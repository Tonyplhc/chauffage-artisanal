/**
 * Règles custom de scoring lead — additives par rapport au scoring par défaut
 * (lib/lead-scoring.ts).
 *
 * L'admin définit un ensemble de règles (ex : "service:pac + commune Esch
 * → +10"). Elles sont appliquées au moment de la requête (ne modifient pas
 * le score persisté). Permet d'ajuster sans toucher au code.
 *
 * Pas de recalcul rétroactif persisté en V1 : on calcule à la lecture.
 */

import { promises as fs } from "node:fs";
import path from "node:path";
import { randomBytes } from "node:crypto";
import type { LeadRecord } from "./devis-schema";

const DATA_DIR = path.join(process.cwd(), "data");
const RULES_FILE = path.join(DATA_DIR, "scoring-rules.json");

export type ScoringOperator =
  | "eq"
  | "in"
  | "contains"
  | "gte"
  | "lte"
  | "exists";

export type ScoringRule = {
  id: string;
  label: string;
  /** Champ du lead : "commune", "services", "level", "score", "surface",
   *  "timeline", "budget", "preferredChannel", ou "metadata.tags". */
  field: string;
  op: ScoringOperator;
  /** Valeur de comparaison (string, number, ou array selon op). */
  value: string | number | string[];
  /** Points à ajouter au score quand la condition matche. Peut être négatif. */
  points: number;
  enabled: boolean;
};

export type ScoringRuleSet = {
  rules: ScoringRule[];
  updatedAt: string;
};

async function ensureDir() {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
  } catch {}
}

async function readRuleSet(): Promise<ScoringRuleSet> {
  try {
    return JSON.parse(await fs.readFile(RULES_FILE, "utf8"));
  } catch {
    return { rules: [], updatedAt: new Date().toISOString() };
  }
}

async function writeRuleSet(set: ScoringRuleSet) {
  await ensureDir();
  await fs.writeFile(RULES_FILE, JSON.stringify(set, null, 2), "utf8");
}

function makeId(): string {
  return `sr-${randomBytes(4).toString("hex")}`;
}

export async function getRules(): Promise<ScoringRuleSet> {
  return await readRuleSet();
}

export async function setRules(
  rules: ScoringRule[],
): Promise<ScoringRuleSet> {
  const sanitized = rules
    .filter((r) => r.label?.trim() && r.field?.trim())
    .map((r) => ({
      id: r.id || makeId(),
      label: r.label.trim().slice(0, 200),
      field: r.field.trim().slice(0, 100),
      op: r.op,
      value: r.value,
      points: Math.round(Number(r.points) || 0),
      enabled: r.enabled !== false,
    }))
    .slice(0, 100);
  const next: ScoringRuleSet = {
    rules: sanitized,
    updatedAt: new Date().toISOString(),
  };
  await writeRuleSet(next);
  return next;
}

/* ─────────────── Évaluation ─────────────── */

function readField(lead: LeadRecord, path: string): unknown {
  const parts = path.split(".");
  let cur: unknown = lead;
  for (const p of parts) {
    if (cur === null || cur === undefined) return undefined;
    cur = (cur as Record<string, unknown>)[p];
  }
  return cur;
}

function ruleMatches(rule: ScoringRule, lead: LeadRecord): boolean {
  const v = readField(lead, rule.field);
  switch (rule.op) {
    case "exists":
      return v !== undefined && v !== null && v !== "";
    case "eq":
      return String(v).toLowerCase() === String(rule.value).toLowerCase();
    case "in": {
      const arr = Array.isArray(rule.value)
        ? rule.value
        : String(rule.value).split(",").map((s) => s.trim());
      if (Array.isArray(v)) {
        return v.some((x) => arr.includes(String(x)));
      }
      return arr.includes(String(v));
    }
    case "contains": {
      if (Array.isArray(v)) {
        return v.some((x) =>
          String(x).toLowerCase().includes(String(rule.value).toLowerCase()),
        );
      }
      return String(v ?? "")
        .toLowerCase()
        .includes(String(rule.value).toLowerCase());
    }
    case "gte":
      return Number(v) >= Number(rule.value);
    case "lte":
      return Number(v) <= Number(rule.value);
  }
}

export type AppliedRule = {
  rule: ScoringRule;
  matched: boolean;
  pointsApplied: number;
};

export type ScoringAdjustment = {
  baseScore: number;
  adjustedScore: number;
  delta: number;
  appliedRules: AppliedRule[];
};

export async function applyCustomRules(
  lead: LeadRecord,
  baseScore: number,
): Promise<ScoringAdjustment> {
  const set = await readRuleSet();
  let delta = 0;
  const applied: AppliedRule[] = [];
  for (const rule of set.rules) {
    if (!rule.enabled) continue;
    const matched = ruleMatches(rule, lead);
    if (matched) {
      delta += rule.points;
      applied.push({ rule, matched: true, pointsApplied: rule.points });
    } else {
      applied.push({ rule, matched: false, pointsApplied: 0 });
    }
  }
  const adjusted = Math.max(0, Math.min(100, baseScore + delta));
  return {
    baseScore,
    adjustedScore: adjusted,
    delta,
    appliedRules: applied,
  };
}
