/**
 * Détection de leads doublons par email ou téléphone normalisés.
 *
 * Normalisation :
 *   - email : lower + trim, strip "+suffixe" pour les providers gmail-like
 *   - phone : on garde les chiffres et "+" initial, on retire tout le reste
 *
 * Faux positifs marquables comme "non-doublons" via le store de dismissals —
 * permet à l'admin de masquer définitivement une paire qui partage un numéro
 * de standard partagé par exemple.
 *
 * Pas de merge automatique en V1 — c'est trop sensible (notes, statusHistory,
 * documents). On suggère, l'admin tranche manuellement.
 */

import { promises as fs } from "node:fs";
import path from "node:path";
import type { LeadRecord } from "./devis-schema";

const DATA_DIR = path.join(process.cwd(), "data");
const DISMISSAL_FILE = path.join(DATA_DIR, "duplicate-dismissals.json");

export type DuplicateMatch = {
  reason: "email" | "phone" | "both";
  match: LeadRecord;
  normalizedEmail?: string;
  normalizedPhone?: string;
};

export type DuplicateGroup = {
  key: string; // hash de la valeur partagée
  reason: "email" | "phone";
  value: string;
  leads: LeadRecord[];
};

type Dismissal = {
  pair: [string, string]; // refs triées
  reason: "email" | "phone" | "both";
  dismissedAt: string;
  dismissedBy?: string;
};

/* ─────────────── Normalisation ─────────────── */

export function normalizeEmail(email: string | undefined | null): string {
  if (!email) return "";
  const trimmed = email.toLowerCase().trim();
  // Strip "+suffix" : user+tag@gmail.com → user@gmail.com
  const at = trimmed.indexOf("@");
  if (at === -1) return trimmed;
  const local = trimmed.slice(0, at);
  const domain = trimmed.slice(at + 1);
  const plus = local.indexOf("+");
  const cleanLocal = plus === -1 ? local : local.slice(0, plus);
  return `${cleanLocal}@${domain}`;
}

export function normalizePhone(phone: string | undefined | null): string {
  if (!phone) return "";
  // Garde "+" initial + chiffres
  const trimmed = phone.trim();
  const hasPlus = trimmed.startsWith("+");
  const digits = trimmed.replace(/[^\d]/g, "");
  if (digits.length < 6) return ""; // trop court pour être un vrai numéro
  return hasPlus ? `+${digits}` : digits;
}

/* ─────────────── Dismissals ─────────────── */

async function ensureDir() {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
  } catch {}
}

async function readDismissals(): Promise<Dismissal[]> {
  try {
    return JSON.parse(await fs.readFile(DISMISSAL_FILE, "utf8"));
  } catch {
    return [];
  }
}

async function writeDismissals(arr: Dismissal[]) {
  await ensureDir();
  await fs.writeFile(DISMISSAL_FILE, JSON.stringify(arr, null, 2), "utf8");
}

function pairKey(a: string, b: string): [string, string] {
  return a < b ? [a, b] : [b, a];
}

export async function dismissDuplicate(
  refA: string,
  refB: string,
  reason: "email" | "phone" | "both",
  dismissedBy?: string,
): Promise<void> {
  const all = await readDismissals();
  const [a, b] = pairKey(refA, refB);
  if (all.some((d) => d.pair[0] === a && d.pair[1] === b)) return;
  all.push({
    pair: [a, b],
    reason,
    dismissedAt: new Date().toISOString(),
    dismissedBy,
  });
  await writeDismissals(all);
}

export async function isDuplicateDismissed(
  refA: string,
  refB: string,
): Promise<boolean> {
  const all = await readDismissals();
  const [a, b] = pairKey(refA, refB);
  return all.some((d) => d.pair[0] === a && d.pair[1] === b);
}

export async function listDismissals(): Promise<Dismissal[]> {
  return await readDismissals();
}

/* ─────────────── Détection ─────────────── */

/**
 * Trouve tous les leads doublons d'un lead donné (hors lui-même et hors
 * dismissals).
 */
export async function findDuplicatesFor(
  target: LeadRecord,
  allLeads: LeadRecord[],
): Promise<DuplicateMatch[]> {
  const tEmail = normalizeEmail(target.email);
  const tPhone = normalizePhone(target.phone);
  if (!tEmail && !tPhone) return [];

  const dismissals = await readDismissals();
  const dismissedRefs = new Set<string>();
  for (const d of dismissals) {
    if (d.pair[0] === target.reference) dismissedRefs.add(d.pair[1]);
    if (d.pair[1] === target.reference) dismissedRefs.add(d.pair[0]);
  }

  const matches: DuplicateMatch[] = [];
  for (const lead of allLeads) {
    if (lead.reference === target.reference) continue;
    if (dismissedRefs.has(lead.reference)) continue;
    const oEmail = normalizeEmail(lead.email);
    const oPhone = normalizePhone(lead.phone);
    const sameEmail = tEmail && oEmail === tEmail;
    const samePhone = tPhone && oPhone === tPhone;
    if (sameEmail || samePhone) {
      matches.push({
        reason: sameEmail && samePhone ? "both" : sameEmail ? "email" : "phone",
        match: lead,
        normalizedEmail: sameEmail ? tEmail : undefined,
        normalizedPhone: samePhone ? tPhone : undefined,
      });
    }
  }
  return matches;
}

/**
 * Calcule tous les groupes de doublons dans la base.
 * Groupe = leads partageant un email OU un téléphone normalisé.
 * Un lead peut apparaître dans plusieurs groupes si email et phone matchent
 * des leads différents — c'est volontaire (signal indicatif).
 */
export async function findAllDuplicateGroups(
  allLeads: LeadRecord[],
): Promise<DuplicateGroup[]> {
  const dismissals = await readDismissals();
  const isDismissed = (a: string, b: string) => {
    const [x, y] = pairKey(a, b);
    return dismissals.some((d) => d.pair[0] === x && d.pair[1] === y);
  };

  // Indexe par email + par phone
  const byEmail = new Map<string, LeadRecord[]>();
  const byPhone = new Map<string, LeadRecord[]>();
  for (const l of allLeads) {
    const e = normalizeEmail(l.email);
    const p = normalizePhone(l.phone);
    if (e) {
      if (!byEmail.has(e)) byEmail.set(e, []);
      byEmail.get(e)!.push(l);
    }
    if (p) {
      if (!byPhone.has(p)) byPhone.set(p, []);
      byPhone.get(p)!.push(l);
    }
  }

  const groups: DuplicateGroup[] = [];
  let emailIdx = 0;
  for (const [val, leads] of byEmail) {
    if (leads.length < 2) continue;
    // Filtre les dismissals : si TOUTES les paires sont dismissed, skip
    const refs = leads.map((l) => l.reference);
    let hasUndismissed = false;
    for (let i = 0; i < refs.length && !hasUndismissed; i++) {
      for (let j = i + 1; j < refs.length && !hasUndismissed; j++) {
        if (!isDismissed(refs[i], refs[j])) hasUndismissed = true;
      }
    }
    if (!hasUndismissed) continue;
    groups.push({
      key: `email-${emailIdx++}`,
      reason: "email",
      value: val,
      leads: [...leads].sort(
        (a, b) =>
          new Date(b.submittedAt).getTime() -
          new Date(a.submittedAt).getTime(),
      ),
    });
  }
  let phoneIdx = 0;
  for (const [val, leads] of byPhone) {
    if (leads.length < 2) continue;
    const refs = leads.map((l) => l.reference);
    let hasUndismissed = false;
    for (let i = 0; i < refs.length && !hasUndismissed; i++) {
      for (let j = i + 1; j < refs.length && !hasUndismissed; j++) {
        if (!isDismissed(refs[i], refs[j])) hasUndismissed = true;
      }
    }
    if (!hasUndismissed) continue;
    groups.push({
      key: `phone-${phoneIdx++}`,
      reason: "phone",
      value: val,
      leads: [...leads].sort(
        (a, b) =>
          new Date(b.submittedAt).getTime() -
          new Date(a.submittedAt).getTime(),
      ),
    });
  }
  // Tri : plus gros groupes en premier, puis date la plus récente
  groups.sort((a, b) => {
    if (b.leads.length !== a.leads.length) return b.leads.length - a.leads.length;
    return (
      new Date(b.leads[0].submittedAt).getTime() -
      new Date(a.leads[0].submittedAt).getTime()
    );
  });
  return groups;
}
