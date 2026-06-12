/**
 * Enquêtes NPS (Net Promoter Score) envoyées après conversion d'un lead.
 *
 * Workflow :
 *   1. Un lead passe en statut "converti"
 *   2. Après un délai de grâce (par défaut 7 jours), un job lazy crée une
 *      enquête + envoie un email contenant le lien public signé HMAC
 *   3. Le client clique → page `/feedback/<token>` avec boutons 0..10 +
 *      zone commentaire libre
 *   4. Submit → la réponse est stockée
 *
 * Pas de relance auto en V1. Une enquête par lead converti maximum.
 */

import { promises as fs } from "node:fs";
import path from "node:path";
import { randomBytes } from "node:crypto";
import { listLeads } from "./leads-store";
import { getBrand } from "./brand-settings";
import { logger } from "./logger";
import { logActivity } from "./activity-log";
import { makeNpsToken } from "./nps-token";

const DATA_DIR = path.join(process.cwd(), "data");
const NPS_FILE = path.join(DATA_DIR, "nps-surveys.json");

const DEFAULT_GRACE_DAYS = 7;

export type NpsSurvey = {
  id: string;
  leadReference: string;
  recipientEmail: string;
  recipientName: string;
  sentAt: string;
  respondedAt?: string;
  score?: number; // 0..10
  comment?: string;
};

async function ensureDir() {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
  } catch {}
}

async function readAll(): Promise<NpsSurvey[]> {
  try {
    return JSON.parse(await fs.readFile(NPS_FILE, "utf8"));
  } catch {
    return [];
  }
}

async function writeAll(arr: NpsSurvey[]) {
  await ensureDir();
  await fs.writeFile(NPS_FILE, JSON.stringify(arr, null, 2), "utf8");
}

export async function listSurveys(): Promise<NpsSurvey[]> {
  return await readAll();
}

export async function getSurvey(id: string): Promise<NpsSurvey | null> {
  const all = await readAll();
  return all.find((s) => s.id === id) ?? null;
}

export async function recordResponse(
  id: string,
  score: number,
  comment: string,
): Promise<NpsSurvey | null> {
  const all = await readAll();
  const idx = all.findIndex((s) => s.id === id);
  if (idx === -1) return null;
  if (all[idx].respondedAt) return all[idx]; // déjà répondu — pas écrasé
  const trimmedComment = (comment ?? "").trim().slice(0, 4000);
  const next: NpsSurvey = {
    ...all[idx],
    score: Math.max(0, Math.min(10, Math.round(score))),
    comment: trimmedComment || undefined,
    respondedAt: new Date().toISOString(),
  };
  all[idx] = next;
  await writeAll(all);
  return next;
}

/**
 * Lazy processor : trouve les leads convertis depuis > N jours sans enquête
 * envoyée, crée et envoie l'enquête. Idempotent.
 */
export async function maybeSendNpsSurveys(
  graceDays = DEFAULT_GRACE_DAYS,
): Promise<{ created: number; skipped: string[] }> {
  const leads = await listLeads();
  const surveys = await readAll();
  const sentRefs = new Set(surveys.map((s) => s.leadReference));
  const now = Date.now();
  const graceMs = graceDays * 86_400_000;
  const skipped: string[] = [];
  let created = 0;

  // Cherche dans statusHistory la date de passage à "converti"
  function convertedAt(leadRef: string): number | null {
    const lead = leads.find((l) => l.reference === leadRef);
    if (!lead) return null;
    if (lead.status !== "converti") return null;
    const history = lead.statusHistory ?? [];
    for (let i = history.length - 1; i >= 0; i--) {
      if (history[i].to === "converti") {
        return new Date(history[i].at).getTime();
      }
    }
    // Pas d'historique mais statut converti → utilise submittedAt comme fallback
    return new Date(lead.submittedAt).getTime();
  }

  const brand = await getBrand();
  const baseUrl = process.env.PUBLIC_URL ?? "http://localhost:3020";
  const useResend = !!(process.env.RESEND_API_KEY && process.env.EMAIL_FROM);

  for (const lead of leads) {
    if (lead.status !== "converti") continue;
    if (sentRefs.has(lead.reference)) continue;
    const at = convertedAt(lead.reference);
    if (at === null || now - at < graceMs) {
      skipped.push(lead.reference);
      continue;
    }

    const survey: NpsSurvey = {
      id: `nps-${randomBytes(6).toString("hex")}`,
      leadReference: lead.reference,
      recipientEmail: lead.email,
      recipientName: lead.fullName,
      sentAt: new Date().toISOString(),
    };
    const token = makeNpsToken(survey.id);
    const link = `${baseUrl}/feedback/${survey.id}?t=${token}`;

    const subject = `${brand.name} — votre avis nous intéresse`;
    const text = `Bonjour ${lead.fullName},\n\nMerci de votre confiance. Nous aimerions connaître votre avis sur votre récente collaboration avec ${brand.name}. Cela ne prendra qu'une minute.\n\n${link}\n\nÀ très bientôt,\nL'équipe ${brand.name}`;
    const html = renderNpsEmail(brand.name, lead.fullName, link);

    let sent = false;
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
            html,
            text,
          }),
        });
        sent = res.ok;
        if (!sent) {
          logger.error("nps.send_failed", await res.text(), {
            reference: lead.reference,
          });
        }
      } catch (e) {
        logger.error("nps.send_failed", e, { reference: lead.reference });
      }
    } else {
      // eslint-disable-next-line no-console
      console.info(
        `\n=== [nps · dev mode] → ${lead.email} ===\n${subject}\n${text}\n=====\n`,
      );
      sent = true;
    }

    if (sent) {
      surveys.push(survey);
      created += 1;
      void logActivity(
        "lead.template_sent",
        `Enquête NPS envoyée à ${lead.email}`,
        { reference: lead.reference, meta: { surveyId: survey.id } },
      );
    }
  }

  if (created > 0) await writeAll(surveys);

  return { created, skipped };
}

function renderNpsEmail(brand: string, name: string, link: string): string {
  return `<!doctype html>
<html><body style="margin:0;padding:32px 16px;background:#F7F2E9;font-family:'Inter Tight',Inter,system-ui,sans-serif;color:#2A2724;">
<table role="presentation" cellpadding="0" cellspacing="0" width="100%">
  <tr><td align="center">
    <table role="presentation" cellpadding="0" cellspacing="0" width="560" style="max-width:560px;background:#ffffff;border:1px solid rgba(42,37,30,0.08);border-radius:24px;overflow:hidden;">
      <tr><td style="background:#0A3D6E;color:#F7F2E9;padding:28px;">
        <div style="font-family:monospace;font-size:10px;letter-spacing:0.28em;text-transform:uppercase;color:#0B57A0;">${escapeHtml(brand)} · Votre retour</div>
        <div style="font-family:Georgia,serif;font-size:24px;margin-top:6px;">Une minute pour nous dire ce que vous en avez pensé</div>
      </td></tr>
      <tr><td style="padding:28px;font-size:15px;line-height:1.6;">
        <p>Bonjour <strong>${escapeHtml(name)}</strong>,</p>
        <p>Merci de votre confiance. Pour continuer à faire mieux, nous aimerions connaître votre avis sur votre récente collaboration avec ${escapeHtml(brand)}.</p>
        <p style="text-align:center;margin:24px 0;">
          <a href="${link}" style="display:inline-block;padding:14px 32px;background:#0B57A0;color:#fff;text-decoration:none;border-radius:9999px;font-weight:500;">Donner mon avis</a>
        </p>
        <p style="font-size:13px;color:#8b847a;">Cela ne prendra qu'une minute. Aucune obligation, juste un score sur 10 et un commentaire libre si vous le souhaitez.</p>
      </td></tr>
      <tr><td style="background:#F7F2E9;padding:16px 28px;font-size:11px;color:#8b847a;text-align:center;">
        ${escapeHtml(brand)} — Lien unique sécurisé.
      </td></tr>
    </table>
  </td></tr>
</table>
</body></html>`;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/* ─────────────── Stats agrégées ─────────────── */

export type NpsStats = {
  sent: number;
  responded: number;
  responseRate: number;
  averageScore: number | null;
  promoters: number;
  passives: number;
  detractors: number;
  nps: number | null; // -100..100
  recent: NpsSurvey[]; // 20 plus récentes
};

export function computeNpsStats(surveys: NpsSurvey[]): NpsStats {
  const sent = surveys.length;
  const responded = surveys.filter((s) => s.respondedAt && s.score !== undefined);
  const scores = responded.map((s) => s.score!);
  const sum = scores.reduce((a, b) => a + b, 0);
  const promoters = scores.filter((s) => s >= 9).length;
  const passives = scores.filter((s) => s >= 7 && s <= 8).length;
  const detractors = scores.filter((s) => s <= 6).length;
  const nps =
    scores.length === 0
      ? null
      : Math.round(((promoters - detractors) / scores.length) * 100);
  const recent = [...surveys]
    .sort(
      (a, b) =>
        new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime(),
    )
    .slice(0, 20);
  return {
    sent,
    responded: responded.length,
    responseRate: sent === 0 ? 0 : responded.length / sent,
    averageScore: scores.length === 0 ? null : sum / scores.length,
    promoters,
    passives,
    detractors,
    nps,
    recent,
  };
}
