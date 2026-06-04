/**
 * Campagnes newsletter programmées.
 *
 * Architecture sans cron externe : on déclenche le processeur sur chaque
 * requête admin (lazy) — c'est suffisant pour un usage de démo. En prod, on
 * brancherait un vrai cron job ou Vercel Cron.
 *
 * Une campagne = subject + body + scheduledAt + status (scheduled/sent/cancelled).
 */

import { promises as fs } from "node:fs";
import path from "node:path";
import { z } from "zod";

const DATA_DIR = path.join(process.cwd(), "data");
const CAMPAIGNS_FILE = path.join(DATA_DIR, "scheduled-campaigns.json");

export const CampaignSchema = z.object({
  id: z.string().min(1).max(40),
  subject: z.string().min(2).max(200),
  body: z.string().min(10).max(50_000),
  scheduledAt: z.string(), // ISO date
  status: z.enum(["scheduled", "sending", "sent", "cancelled", "failed"]).default("scheduled"),
  sentAt: z.string().optional(),
  sentCount: z.number().int().min(0).optional(),
  failedCount: z.number().int().min(0).optional(),
  error: z.string().max(2000).optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

export type Campaign = z.infer<typeof CampaignSchema>;

async function ensureDir() {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
  } catch {}
}

export async function listCampaigns(): Promise<Campaign[]> {
  try {
    return JSON.parse(await fs.readFile(CAMPAIGNS_FILE, "utf8"));
  } catch {
    return [];
  }
}

export async function saveCampaign(c: Campaign): Promise<Campaign> {
  const all = await listCampaigns();
  const idx = all.findIndex((x) => x.id === c.id);
  const now = new Date().toISOString();
  const next: Campaign = {
    ...c,
    createdAt: c.createdAt ?? now,
    updatedAt: now,
  };
  if (idx === -1) all.push(next);
  else all[idx] = next;
  await ensureDir();
  await fs.writeFile(CAMPAIGNS_FILE, JSON.stringify(all, null, 2), "utf8");
  return next;
}

export async function deleteCampaign(id: string): Promise<boolean> {
  const all = await listCampaigns();
  const filtered = all.filter((x) => x.id !== id);
  if (filtered.length === all.length) return false;
  await fs.writeFile(CAMPAIGNS_FILE, JSON.stringify(filtered, null, 2), "utf8");
  return true;
}

/* ─────────────── Processeur ─────────────── */

import { listNewsletter, makeNewsletterToken } from "./newsletter-store";
import { logger } from "./logger";

/**
 * Traite toutes les campagnes "scheduled" dont scheduledAt est passé.
 * Best-effort, idempotent : si une campagne est déjà "sending"/"sent",
 * elle est ignorée.
 */
export async function processScheduledCampaigns(): Promise<{
  processed: number;
}> {
  const all = await listCampaigns();
  const now = Date.now();
  let processed = 0;

  for (const c of all) {
    if (c.status !== "scheduled") continue;
    if (new Date(c.scheduledAt).getTime() > now) continue;

    // Lock : on passe en "sending" tout de suite
    c.status = "sending";
    await saveCampaign(c);

    try {
      const subs = await listNewsletter();
      const recipients = subs.filter((s) => s.status === "confirmed");

      let sent = 0;
      let failed = 0;

      const baseUrl = process.env.PUBLIC_URL?.replace(/\/$/, "") ?? "http://localhost:3020";
      const useResend = !!(process.env.RESEND_API_KEY && process.env.EMAIL_FROM);

      for (const r of recipients) {
        const unsubUrl = `${baseUrl}/api/newsletter/unsubscribe?email=${encodeURIComponent(r.email)}&t=${makeNewsletterToken(r.email, "unsubscribe")}`;
        const text = `${c.body}\n\n---\nSe désinscrire : ${unsubUrl}`;
        if (!useResend) {
          // eslint-disable-next-line no-console
          console.info(
            `\n=== [campaign · dev mode] → ${r.email} (planifié) ===
SUBJ : ${c.subject}
${c.body}
====================================================\n`,
          );
          sent++;
          continue;
        }
        try {
          const res = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              from: process.env.EMAIL_FROM,
              to: [r.email],
              subject: c.subject,
              text,
            }),
          });
          if (res.ok) sent++;
          else failed++;
        } catch {
          failed++;
        }
      }

      c.status = "sent";
      c.sentAt = new Date().toISOString();
      c.sentCount = sent;
      c.failedCount = failed;
      await saveCampaign(c);
      logger.info("campaign.sent", { id: c.id, sent, failed });
      processed++;
    } catch (e) {
      c.status = "failed";
      c.error = String(e);
      await saveCampaign(c);
      logger.error("campaign.failed", e, { id: c.id });
    }
  }

  return { processed };
}
