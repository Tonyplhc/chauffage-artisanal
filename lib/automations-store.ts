/**
 * Moteur d'automation lead — if/then sur les conditions du lead.
 *
 * Une règle = un trigger (lead.created pour l'instant) + une liste de
 * conditions (toutes doivent matcher = AND) + une liste d'actions.
 *
 * Conditions supportées :
 *   - level   : opérateurs in / not_in
 *   - timeline: in / not_in
 *   - budget  : in / not_in
 *   - service : contains / not_contains (un des services contenus)
 *   - surface : >=, <=, ==
 *   - commune : equals / contains
 *
 * Actions supportées :
 *   - setStatus     : change le statut
 *   - sendTemplate  : envoie un email template
 *   - addNote       : ajoute un texte aux notes internes
 *
 * Exécution : à la création du lead, on évalue chaque règle activée et on
 * applique les actions séquentiellement. Les erreurs sont loguées sans bloquer.
 */

import { promises as fs } from "node:fs";
import path from "node:path";
import { z } from "zod";
import type { LeadRecord } from "./devis-schema";

const DATA_DIR = path.join(process.cwd(), "data");
const RULES_FILE = path.join(DATA_DIR, "automation-rules.json");

const ConditionSchema = z.discriminatedUnion("field", [
  z.object({
    field: z.literal("level"),
    op: z.enum(["in", "not_in"]),
    values: z.array(z.enum(["hot", "warm", "cold"])).min(1),
  }),
  z.object({
    field: z.literal("timeline"),
    op: z.enum(["in", "not_in"]),
    values: z.array(z.enum(["urgent", "court", "annee", "exploration"])).min(1),
  }),
  z.object({
    field: z.literal("budget"),
    op: z.enum(["in", "not_in"]),
    values: z.array(z.enum(["less10", "10-20", "20-40", "40plus", "inconnu"])).min(1),
  }),
  z.object({
    field: z.literal("service"),
    op: z.enum(["contains", "not_contains"]),
    values: z.array(
      z.enum(["chauffage", "pac", "clim", "sanitaire", "enr", "depannage", "autre"]),
    ).min(1),
  }),
  z.object({
    field: z.literal("surface"),
    op: z.enum([">=", "<=", "=="]),
    value: z.number().int().min(0).max(20000),
  }),
  z.object({
    field: z.literal("commune"),
    op: z.enum(["equals", "contains"]),
    value: z.string().min(1).max(200),
  }),
]);

const DelaySchema = z.number().int().min(0).max(60 * 60 * 24 * 30).optional();

const ActionSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("setStatus"),
    status: z.enum(["nouveau", "contacte", "devis_envoye", "converti", "perdu"]),
    delaySeconds: DelaySchema,
  }),
  z.object({
    type: z.literal("sendTemplate"),
    templateId: z.string().min(1).max(80),
    delaySeconds: DelaySchema,
  }),
  z.object({
    type: z.literal("addNote"),
    text: z.string().min(1).max(2000),
    delaySeconds: DelaySchema,
  }),
  z.object({
    type: z.literal("assignTo"),
    email: z.string().email().max(180),
    delaySeconds: DelaySchema,
  }),
  z.object({
    type: z.literal("addTag"),
    tag: z.string().min(1).max(40),
    delaySeconds: DelaySchema,
  }),
]);

export const AutomationRuleSchema = z.object({
  id: z.string().min(1).max(40),
  name: z.string().min(2).max(120),
  enabled: z.boolean().default(true),
  trigger: z.literal("lead.created"), // un seul pour l'instant
  conditions: z.array(ConditionSchema).max(10).default([]),
  actions: z.array(ActionSchema).min(1).max(10),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
  // Statistiques d'exécution (lecture seule pour l'UI)
  runs: z.number().int().min(0).default(0),
  lastRunAt: z.string().optional(),
});

export type AutomationRule = z.infer<typeof AutomationRuleSchema>;
export type Condition = z.infer<typeof ConditionSchema>;
export type Action = z.infer<typeof ActionSchema>;

async function ensureDir() {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
  } catch {}
}

export async function listRules(): Promise<AutomationRule[]> {
  try {
    return JSON.parse(await fs.readFile(RULES_FILE, "utf8"));
  } catch {
    return [];
  }
}

export async function saveRule(rule: AutomationRule): Promise<AutomationRule> {
  const all = await listRules();
  const idx = all.findIndex((r) => r.id === rule.id);
  const now = new Date().toISOString();
  const next: AutomationRule = {
    ...rule,
    createdAt: rule.createdAt ?? now,
    updatedAt: now,
  };
  if (idx === -1) all.push(next);
  else all[idx] = next;
  await ensureDir();
  await fs.writeFile(RULES_FILE, JSON.stringify(all, null, 2), "utf8");
  return next;
}

export async function deleteRule(id: string): Promise<boolean> {
  const all = await listRules();
  const next = all.filter((r) => r.id !== id);
  if (next.length === all.length) return false;
  await fs.writeFile(RULES_FILE, JSON.stringify(next, null, 2), "utf8");
  return true;
}

async function incrementRun(id: string) {
  const all = await listRules();
  const r = all.find((x) => x.id === id);
  if (!r) return;
  r.runs = (r.runs ?? 0) + 1;
  r.lastRunAt = new Date().toISOString();
  await fs.writeFile(RULES_FILE, JSON.stringify(all, null, 2), "utf8");
}

/* ─────────────── Évaluation des conditions ─────────────── */

function evaluateCondition(cond: Condition, lead: LeadRecord): boolean {
  switch (cond.field) {
    case "level": {
      const v = lead.level;
      if (!v) return cond.op === "not_in"; // sans level = not_in passe
      const inSet = cond.values.includes(v);
      return cond.op === "in" ? inSet : !inSet;
    }
    case "timeline": {
      const inSet = cond.values.includes(lead.timeline);
      return cond.op === "in" ? inSet : !inSet;
    }
    case "budget": {
      const inSet = (cond.values as readonly string[]).includes(lead.budget);
      return cond.op === "in" ? inSet : !inSet;
    }
    case "service": {
      const anyMatch = cond.values.some((v) => lead.services.includes(v));
      return cond.op === "contains" ? anyMatch : !anyMatch;
    }
    case "surface": {
      if (cond.op === ">=") return lead.surface >= cond.value;
      if (cond.op === "<=") return lead.surface <= cond.value;
      return lead.surface === cond.value;
    }
    case "commune": {
      const lc = lead.commune.toLowerCase();
      const target = cond.value.toLowerCase();
      if (cond.op === "equals") return lc === target;
      return lc.includes(target);
    }
  }
}

export function ruleMatches(rule: AutomationRule, lead: LeadRecord): boolean {
  if (!rule.enabled) return false;
  if (rule.trigger !== "lead.created") return false;
  if (rule.conditions.length === 0) return true; // aucune condition = match toujours
  return rule.conditions.every((c) => evaluateCondition(c, lead));
}

/* ─────────────── Exécution des actions ─────────────── */

import { updateLead } from "./leads-store";
import { getTemplate, renderTemplate } from "./email-templates-store";
import { logger } from "./logger";
import { logActivity } from "./activity-log";
import { scheduleDelayedAction } from "./delayed-actions-store";

async function executeAction(
  action: Action,
  lead: LeadRecord,
  ruleName: string,
): Promise<void> {
  const delay = action.delaySeconds ?? 0;
  if (delay > 0) {
    await scheduleDelayedAction(lead.reference, action, ruleName, delay);
    return;
  }
  try {
    if (action.type === "setStatus") {
      await updateLead(lead.reference, { status: action.status });
      logger.info("automation.setStatus", {
        rule: ruleName,
        reference: lead.reference,
        status: action.status,
      });
    } else if (action.type === "assignTo") {
      await updateLead(lead.reference, { assignedTo: action.email });
      logger.info("automation.assignTo", {
        rule: ruleName,
        reference: lead.reference,
        email: action.email,
      });
    } else if (action.type === "addTag") {
      const current = (lead.metadata as { tags?: string[] } | undefined)?.tags ?? [];
      const next = current.includes(action.tag) ? current : [...current, action.tag];
      await updateLead(lead.reference, {
        metadata: { ...lead.metadata, tags: next },
      });
    } else if (action.type === "addNote") {
      const current = lead.notes ?? "";
      const stamp = new Date().toLocaleString("fr-FR");
      const next = current
        ? `${current}\n\n[Auto · ${stamp}] ${action.text}`
        : `[Auto · ${stamp}] ${action.text}`;
      await updateLead(lead.reference, { notes: next });
    } else if (action.type === "sendTemplate") {
      const tpl = await getTemplate(action.templateId);
      if (!tpl) {
        logger.warn("automation.template_missing", { templateId: action.templateId });
        return;
      }
      const { subject, body } = renderTemplate(tpl, lead);
      // Envoi via Resend si configuré, sinon console
      if (process.env.RESEND_API_KEY && process.env.EMAIL_FROM) {
        await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: process.env.EMAIL_FROM,
            to: [lead.email],
            subject,
            text: body,
          }),
        });
      } else {
        // eslint-disable-next-line no-console
        console.info(`\n=== [automation · dev] ${ruleName} → ${lead.email} ===
SUBJ : ${subject}
${body}
=====================================================\n`);
      }
      void logActivity(
        "lead.template_sent",
        `Template auto-envoyé · ${tpl.name} (règle: ${ruleName})`,
        { reference: lead.reference, meta: { templateId: tpl.id, automated: true } },
      );
    }
  } catch (e) {
    logger.error("automation.action_failed", e, { rule: ruleName });
  }
}

/**
 * Exécute toutes les règles applicables sur un lead nouvellement créé.
 */
export async function runAutomations(lead: LeadRecord): Promise<void> {
  const rules = await listRules();
  for (const rule of rules) {
    if (!ruleMatches(rule, lead)) continue;
    for (const action of rule.actions) {
      // eslint-disable-next-line no-await-in-loop
      await executeAction(action, lead, rule.name);
    }
    void incrementRun(rule.id);
    void logActivity(
      "lead.created",
      `Automation déclenchée · ${rule.name}`,
      { reference: lead.reference, meta: { ruleId: rule.id, ruleName: rule.name } },
    );
  }
}
