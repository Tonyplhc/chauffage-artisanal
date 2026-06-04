/**
 * Drip campaigns — séquences emails programmées avec déclencheur.
 *
 * Une DripCampaign = un déclencheur (status_change, conversion, abandonment,
 * manual) + une suite d'étapes {delayDays, templateId, subject}. À chaque
 * matching, on crée une DripEnrollment qui tracke l'avancement.
 *
 * `processDripQueue()` lazy trigger envoie les emails dus (via Resend si
 * configuré, sinon log console). Idempotent.
 *
 * Opt-out par lead : `unsubscribed = true` stoppe la séquence et exclut des
 * futures enrollments.
 */

import { promises as fs } from "node:fs";
import path from "node:path";
import { randomBytes } from "node:crypto";
import { listLeads } from "./leads-store";
import { getBrand } from "./brand-settings";
import { logger } from "./logger";
import { logActivity } from "./activity-log";
import type { LeadRecord } from "./devis-schema";

const DATA_DIR = path.join(process.cwd(), "data");
const CAMPAIGNS_FILE = path.join(DATA_DIR, "drip-campaigns.json");
const ENROLLMENTS_FILE = path.join(DATA_DIR, "drip-enrollments.json");

export type DripTrigger =
  | "status_change"
  | "conversion"
  | "abandonment"
  | "manual";

export type DripStep = {
  id: string;
  delayDays: number;
  subject: string;
  /** Corps texte simple. Variables {{lead.fullName}}, {{brand.name}} interpolées. */
  body: string;
};

export type DripCampaign = {
  id: string;
  name: string;
  description?: string;
  trigger: DripTrigger;
  /** Conditions optionnelles : filtre des leads éligibles. */
  conditions: {
    status?: string;
    level?: "hot" | "warm" | "cold";
    fromStatus?: string;
    toStatus?: string;
  };
  steps: DripStep[];
  status: "active" | "paused";
  createdAt: string;
  updatedAt: string;
};

export type DripEnrollment = {
  id: string;
  campaignId: string;
  leadReference: string;
  enrolledAt: string;
  /** Index 0-based de la prochaine étape à envoyer. */
  nextStepIndex: number;
  nextStepDueAt: string;
  completed: boolean;
  unsubscribed: boolean;
  sentAt: string[]; // historique des envois
};

async function ensureDir() {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
  } catch {}
}

async function readCampaigns(): Promise<DripCampaign[]> {
  try {
    return JSON.parse(await fs.readFile(CAMPAIGNS_FILE, "utf8"));
  } catch {
    return [];
  }
}

async function writeCampaigns(arr: DripCampaign[]) {
  await ensureDir();
  await fs.writeFile(CAMPAIGNS_FILE, JSON.stringify(arr, null, 2), "utf8");
}

async function readEnrollments(): Promise<DripEnrollment[]> {
  try {
    return JSON.parse(await fs.readFile(ENROLLMENTS_FILE, "utf8"));
  } catch {
    return [];
  }
}

async function writeEnrollments(arr: DripEnrollment[]) {
  await ensureDir();
  await fs.writeFile(ENROLLMENTS_FILE, JSON.stringify(arr, null, 2), "utf8");
}

function makeId(prefix: string): string {
  return `${prefix}-${randomBytes(4).toString("hex")}`;
}

/* ─────────────── Campaigns CRUD ─────────────── */

export async function listCampaigns(): Promise<DripCampaign[]> {
  return await readCampaigns();
}

export async function getCampaign(id: string): Promise<DripCampaign | null> {
  const all = await readCampaigns();
  return all.find((c) => c.id === id) ?? null;
}

export async function createCampaign(input: {
  name: string;
  description?: string;
  trigger: DripTrigger;
  conditions?: DripCampaign["conditions"];
  steps?: Omit<DripStep, "id">[];
}): Promise<DripCampaign> {
  if (!input.name?.trim()) throw new Error("Nom requis");
  const now = new Date().toISOString();
  const c: DripCampaign = {
    id: makeId("drip"),
    name: input.name.trim(),
    description: input.description?.slice(0, 1000),
    trigger: input.trigger,
    conditions: input.conditions ?? {},
    steps: (input.steps ?? []).map((s) => ({
      id: makeId("step"),
      delayDays: Math.max(0, Math.round(s.delayDays)),
      subject: s.subject.trim().slice(0, 200),
      body: s.body.slice(0, 8000),
    })),
    status: "active",
    createdAt: now,
    updatedAt: now,
  };
  const all = await readCampaigns();
  all.push(c);
  await writeCampaigns(all);
  return c;
}

export async function updateCampaign(
  id: string,
  patch: Partial<
    Pick<
      DripCampaign,
      "name" | "description" | "conditions" | "steps" | "status" | "trigger"
    >
  >,
): Promise<DripCampaign | null> {
  const all = await readCampaigns();
  const idx = all.findIndex((c) => c.id === id);
  if (idx === -1) return null;
  const cur = all[idx];
  const next: DripCampaign = { ...cur };
  if (patch.name !== undefined) next.name = patch.name.trim();
  if (patch.description !== undefined)
    next.description = patch.description?.slice(0, 1000);
  if (patch.conditions !== undefined) next.conditions = patch.conditions;
  if (patch.trigger !== undefined) next.trigger = patch.trigger;
  if (patch.steps !== undefined) {
    next.steps = patch.steps.map((s) => ({
      id: s.id || makeId("step"),
      delayDays: Math.max(0, Math.round(s.delayDays)),
      subject: s.subject.trim().slice(0, 200),
      body: s.body.slice(0, 8000),
    }));
  }
  if (patch.status !== undefined) next.status = patch.status;
  next.updatedAt = new Date().toISOString();
  all[idx] = next;
  await writeCampaigns(all);
  return next;
}

export async function deleteCampaign(id: string): Promise<boolean> {
  const all = await readCampaigns();
  const next = all.filter((c) => c.id !== id);
  if (next.length === all.length) return false;
  await writeCampaigns(next);
  return true;
}

/* ─────────────── Enrollments ─────────────── */

export async function listEnrollments(opts: {
  campaignId?: string;
  leadReference?: string;
} = {}): Promise<DripEnrollment[]> {
  const all = await readEnrollments();
  return all.filter((e) => {
    if (opts.campaignId && e.campaignId !== opts.campaignId) return false;
    if (opts.leadReference && e.leadReference !== opts.leadReference)
      return false;
    return true;
  });
}

function leadMatchesConditions(
  lead: LeadRecord,
  cond: DripCampaign["conditions"],
  context?: { fromStatus?: string; toStatus?: string },
): boolean {
  if (cond.status && lead.status !== cond.status) return false;
  if (cond.level && lead.level !== cond.level) return false;
  if (cond.fromStatus && context?.fromStatus !== cond.fromStatus) return false;
  if (cond.toStatus && context?.toStatus !== cond.toStatus) return false;
  return true;
}

export async function enrollIfMatches(
  lead: LeadRecord,
  trigger: DripTrigger,
  context?: { fromStatus?: string; toStatus?: string },
): Promise<DripEnrollment[]> {
  const campaigns = await readCampaigns();
  const enrollments = await readEnrollments();
  const out: DripEnrollment[] = [];
  for (const c of campaigns) {
    if (c.status !== "active") continue;
    if (c.trigger !== trigger) continue;
    if (!leadMatchesConditions(lead, c.conditions, context)) continue;
    if (c.steps.length === 0) continue;
    // Anti-doublon : déjà enrolled pour cette campagne ?
    if (
      enrollments.some(
        (e) =>
          e.campaignId === c.id &&
          e.leadReference === lead.reference &&
          !e.unsubscribed,
      )
    ) {
      continue;
    }
    const now = new Date();
    const firstDue = new Date(now);
    firstDue.setDate(firstDue.getDate() + c.steps[0].delayDays);
    const enrollment: DripEnrollment = {
      id: makeId("enr"),
      campaignId: c.id,
      leadReference: lead.reference,
      enrolledAt: now.toISOString(),
      nextStepIndex: 0,
      nextStepDueAt: firstDue.toISOString(),
      completed: false,
      unsubscribed: false,
      sentAt: [],
    };
    enrollments.push(enrollment);
    out.push(enrollment);
  }
  if (out.length > 0) await writeEnrollments(enrollments);
  return out;
}

export async function unenroll(
  campaignId: string,
  leadReference: string,
): Promise<void> {
  const all = await readEnrollments();
  for (const e of all) {
    if (e.campaignId === campaignId && e.leadReference === leadReference) {
      e.unsubscribed = true;
    }
  }
  await writeEnrollments(all);
}

/* ─────────────── Processor ─────────────── */

function interpolate(template: string, vars: Record<string, string>): string {
  return template.replace(/\{\{\s*([^}]+?)\s*\}\}/g, (_m, k) => vars[k] ?? `{{${k}}}`);
}

export async function processDripQueue(): Promise<{
  sent: number;
  failed: number;
  examined: number;
}> {
  const enrollments = await readEnrollments();
  const campaigns = await readCampaigns();
  const leads = await listLeads();
  const leadByRef = new Map(leads.map((l) => [l.reference, l]));
  const brand = await getBrand();
  const useResend = !!(
    process.env.RESEND_API_KEY && process.env.EMAIL_FROM
  );
  const now = Date.now();
  let sent = 0;
  let failed = 0;
  let examined = 0;
  let touched = false;

  for (const enr of enrollments) {
    examined += 1;
    if (enr.unsubscribed || enr.completed) continue;
    if (new Date(enr.nextStepDueAt).getTime() > now) continue;
    const campaign = campaigns.find((c) => c.id === enr.campaignId);
    if (!campaign || campaign.status !== "active") continue;
    const step = campaign.steps[enr.nextStepIndex];
    const lead = leadByRef.get(enr.leadReference);
    if (!step || !lead) continue;

    const subject = interpolate(step.subject, {
      "lead.fullName": lead.fullName,
      "brand.name": brand.name,
    });
    const text = interpolate(step.body, {
      "lead.fullName": lead.fullName,
      "lead.commune": lead.commune,
      "brand.name": brand.name,
    });

    let success = false;
    if (useResend) {
      try {
        const res = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: process.env.EMAIL_FROM,
            to: [lead.email],
            subject,
            text,
          }),
        });
        success = res.ok;
      } catch (e) {
        logger.error("drip.send_failed", e, { enrollment: enr.id });
      }
    } else {
      // eslint-disable-next-line no-console
      console.info(
        `\n=== [drip · dev] → ${lead.email}\nSujet : ${subject}\n${text}\n=====\n`,
      );
      success = true;
    }

    if (success) {
      sent += 1;
      enr.sentAt.push(new Date().toISOString());
      enr.nextStepIndex += 1;
      if (enr.nextStepIndex >= campaign.steps.length) {
        enr.completed = true;
      } else {
        const next = new Date();
        next.setDate(
          next.getDate() + campaign.steps[enr.nextStepIndex].delayDays,
        );
        enr.nextStepDueAt = next.toISOString();
      }
      touched = true;
      void logActivity(
        "lead.template_sent",
        `Drip ${campaign.name} · étape ${enr.nextStepIndex} envoyée`,
        {
          reference: lead.reference,
          meta: {
            campaignId: campaign.id,
            stepIndex: enr.nextStepIndex - 1,
          },
        },
      );
    } else {
      failed += 1;
    }
  }
  if (touched) await writeEnrollments(enrollments);
  return { sent, failed, examined };
}
