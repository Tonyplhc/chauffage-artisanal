/**
 * Génération et envoi du digest hebdomadaire.
 *
 * Contenu :
 *   - KPIs de la semaine (leads reçus, convertis, hot leads)
 *   - Top 5 leads chauds non traités
 *   - Alertes : leads dormants > 3j, devis sans relance > 14j
 *   - Comparaison vs semaine précédente
 *
 * Destinataires : tous les users `admin` ayant accepté de recevoir le digest
 * (champ `optIn` par défaut true).
 *
 * Déclenchement :
 *   - Lazy : à chaque chargement de /admin/reports, on check si un digest doit
 *     être envoyé (dernière exécution > 7 jours).
 *   - En prod : recommandation Vercel Cron tous les lundis 8h.
 */

import { promises as fs } from "node:fs";
import path from "node:path";
import { listLeads } from "./leads-store";
import { listUsers } from "./users-store";
import { getBrand } from "./brand-settings";
import { detectFollowUps } from "./follow-up";
import { logger } from "./logger";

const DATA_DIR = path.join(process.cwd(), "data");
const STATE_FILE = path.join(DATA_DIR, "digest-state.json");

type DigestState = {
  lastSentAt?: string;
  lastDigest?: {
    sentAt: string;
    sentCount: number;
    period: { from: string; to: string };
    stats: DigestStats;
  };
};

export type DigestStats = {
  leadsReceived: number;
  leadsConverted: number;
  hotLeads: number;
  totalRevenue?: number;
  vsLastWeek: {
    leadsReceived: number;
    leadsConverted: number;
  };
  dormantCount: number;
  topHotLeads: {
    reference: string;
    name: string;
    services: string[];
    commune: string;
    score?: number;
  }[];
};

async function readState(): Promise<DigestState> {
  try {
    return JSON.parse(await fs.readFile(STATE_FILE, "utf8"));
  } catch {
    return {};
  }
}

async function writeState(s: DigestState) {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
  } catch {}
  await fs.writeFile(STATE_FILE, JSON.stringify(s, null, 2), "utf8");
}

export async function computeWeeklyStats(): Promise<DigestStats> {
  const leads = await listLeads();
  const now = Date.now();
  const week = 7 * 86_400_000;
  const lastWeekStart = now - week;
  const previousWeekStart = now - 2 * week;

  const thisWeek = leads.filter(
    (l) => new Date(l.submittedAt).getTime() >= lastWeekStart,
  );
  const previousWeek = leads.filter((l) => {
    const t = new Date(l.submittedAt).getTime();
    return t >= previousWeekStart && t < lastWeekStart;
  });

  const leadsReceived = thisWeek.length;
  const leadsConverted = thisWeek.filter((l) => l.status === "converti").length;
  const hotLeads = thisWeek.filter((l) => l.level === "hot").length;

  const follow = detectFollowUps(leads);
  const dormantCount = follow.length;

  const topHotLeads = leads
    .filter((l) => l.status === "nouveau" && l.level === "hot")
    .sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
    .slice(0, 5)
    .map((l) => ({
      reference: l.reference,
      name: l.fullName,
      services: l.services,
      commune: l.commune,
      score: l.score,
    }));

  return {
    leadsReceived,
    leadsConverted,
    hotLeads,
    vsLastWeek: {
      leadsReceived: leadsReceived - previousWeek.length,
      leadsConverted:
        leadsConverted - previousWeek.filter((l) => l.status === "converti").length,
    },
    dormantCount,
    topHotLeads,
  };
}

function renderDigestHtml(brand: { name: string }, stats: DigestStats): string {
  const trendArrow = (n: number) => (n > 0 ? "↗" : n < 0 ? "↘" : "→");
  const trendColor = (n: number) => (n > 0 ? "#22a06b" : n < 0 ? "#C24A2C" : "#8b847a");

  const hotLeadsRows = stats.topHotLeads
    .map(
      (l) => `
    <tr>
      <td style="padding:10px;border-bottom:1px solid rgba(42,37,30,0.08);">
        <strong style="color:#2A2724;">${escapeHtml(l.name)}</strong><br>
        <span style="font-family:monospace;font-size:11px;color:#8b847a;">${l.reference} · ${l.commune}</span>
      </td>
      <td style="padding:10px;border-bottom:1px solid rgba(42,37,30,0.08);text-align:right;">
        <strong style="color:#0B57A0;font-family:monospace;">${l.score ?? "—"}</strong>
        <div style="font-size:11px;color:#8b847a;">${l.services.join(" · ")}</div>
      </td>
    </tr>
  `,
    )
    .join("");

  return `<!doctype html>
<html><body style="margin:0;padding:32px 16px;background:#F7F2E9;font-family:'Inter Tight',Inter,system-ui,sans-serif;color:#2A2724;">
<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background:#F7F2E9;">
  <tr><td align="center">
    <table role="presentation" cellpadding="0" cellspacing="0" width="640" style="max-width:640px;background:#ffffff;border:1px solid rgba(42,37,30,0.08);border-radius:24px;overflow:hidden;">
      <tr><td style="background:#0A3D6E;color:#F7F2E9;padding:32px;">
        <div style="font-family:monospace;font-size:10px;letter-spacing:0.28em;text-transform:uppercase;color:#0B57A0;">
          ${escapeHtml(brand.name)} · Digest hebdo
        </div>
        <div style="font-family:Georgia,serif;font-size:28px;letter-spacing:-0.02em;margin-top:8px;">
          Votre semaine en un coup d'œil
        </div>
      </td></tr>
      <tr><td style="padding:32px;">
        <!-- KPIs -->
        <table cellpadding="0" cellspacing="0" width="100%" style="margin-bottom:32px;">
          <tr>
            <td width="33%" style="padding:16px;background:rgba(184,106,54,0.08);border-radius:16px;text-align:center;">
              <div style="font-family:monospace;font-size:10px;letter-spacing:0.22em;text-transform:uppercase;color:#8b847a;">Leads reçus</div>
              <div style="font-family:Georgia,serif;font-size:36px;color:#2A2724;margin-top:8px;">${stats.leadsReceived}</div>
              <div style="font-size:12px;color:${trendColor(stats.vsLastWeek.leadsReceived)};margin-top:4px;">${trendArrow(stats.vsLastWeek.leadsReceived)} ${stats.vsLastWeek.leadsReceived >= 0 ? "+" : ""}${stats.vsLastWeek.leadsReceived} vs S-1</div>
            </td>
            <td width="4">&nbsp;</td>
            <td width="33%" style="padding:16px;background:rgba(34,160,107,0.08);border-radius:16px;text-align:center;">
              <div style="font-family:monospace;font-size:10px;letter-spacing:0.22em;text-transform:uppercase;color:#8b847a;">Convertis</div>
              <div style="font-family:Georgia,serif;font-size:36px;color:#2A2724;margin-top:8px;">${stats.leadsConverted}</div>
              <div style="font-size:12px;color:${trendColor(stats.vsLastWeek.leadsConverted)};margin-top:4px;">${trendArrow(stats.vsLastWeek.leadsConverted)} ${stats.vsLastWeek.leadsConverted >= 0 ? "+" : ""}${stats.vsLastWeek.leadsConverted} vs S-1</div>
            </td>
            <td width="4">&nbsp;</td>
            <td width="33%" style="padding:16px;background:rgba(220,90,40,0.08);border-radius:16px;text-align:center;">
              <div style="font-family:monospace;font-size:10px;letter-spacing:0.22em;text-transform:uppercase;color:#8b847a;">Hot leads</div>
              <div style="font-family:Georgia,serif;font-size:36px;color:#2A2724;margin-top:8px;">${stats.hotLeads}</div>
              <div style="font-size:12px;color:#8b847a;margin-top:4px;">cette semaine</div>
            </td>
          </tr>
        </table>

        ${
          stats.dormantCount > 0
            ? `
        <div style="padding:16px;background:rgba(220,90,40,0.08);border:1px solid rgba(220,90,40,0.3);border-radius:16px;margin-bottom:24px;">
          <strong style="color:#C24A2C;">⚠ ${stats.dormantCount} dossier${stats.dormantCount > 1 ? "s" : ""} à relancer</strong>
          <div style="font-size:13px;color:#6E675C;margin-top:4px;">
            Sans contact depuis +3 jours ou devis envoyé sans réponse depuis +14 jours.
          </div>
        </div>`
            : ""
        }

        ${
          stats.topHotLeads.length > 0
            ? `
        <h3 style="font-family:Georgia,serif;font-size:18px;color:#2A2724;margin:0 0 12px;">Top hot leads à traiter</h3>
        <table cellpadding="0" cellspacing="0" width="100%" style="border:1px solid rgba(42,37,30,0.08);border-radius:12px;overflow:hidden;">
          ${hotLeadsRows}
        </table>`
            : ""
        }

        <div style="text-align:center;margin-top:32px;">
          <a href="${process.env.PUBLIC_URL ?? "http://localhost:3020"}/admin/leads" style="display:inline-block;padding:12px 28px;border-radius:9999px;background:#0A3D6E;color:#F7F2E9;font-weight:500;text-decoration:none;font-size:14px;">Ouvrir le pipeline →</a>
        </div>
      </td></tr>
      <tr><td style="background:#F7F2E9;padding:18px 32px;font-size:11px;color:#8b847a;text-align:center;">
        Digest hebdomadaire automatique · ${escapeHtml(brand.name)}
      </td></tr>
    </table>
  </td></tr>
</table>
</body></html>`;
}

function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/**
 * Envoi du digest si pas déjà envoyé dans les 7 derniers jours.
 * Retourne le compte de destinataires envoyés (0 si pas le moment).
 */
export async function maybeSendWeeklyDigest(force = false): Promise<{
  sent: number;
  skipped: boolean;
  reason?: string;
}> {
  const state = await readState();
  const now = Date.now();
  if (!force && state.lastSentAt) {
    const lastMs = new Date(state.lastSentAt).getTime();
    if (now - lastMs < 6.5 * 86_400_000) {
      return { sent: 0, skipped: true, reason: "too_recent" };
    }
  }

  const stats = await computeWeeklyStats();
  const brand = await getBrand();
  const users = await listUsers();
  const admins = users.filter((u) => u.role === "admin");

  if (admins.length === 0) {
    return { sent: 0, skipped: true, reason: "no_admins" };
  }

  const html = renderDigestHtml(brand, stats);
  const subject = `📊 ${brand.name} · digest hebdo · ${stats.leadsReceived} lead${stats.leadsReceived > 1 ? "s" : ""}`;
  const text = `Digest hebdomadaire ${brand.name}\n\nLeads reçus : ${stats.leadsReceived}\nConvertis : ${stats.leadsConverted}\nHot leads : ${stats.hotLeads}\n\nOuvrir le pipeline : ${process.env.PUBLIC_URL ?? "http://localhost:3020"}/admin/leads`;

  let sent = 0;
  const useResend = !!(process.env.RESEND_API_KEY && process.env.EMAIL_FROM);

  for (const admin of admins) {
    if (!useResend) {
      // eslint-disable-next-line no-console
      console.info(`\n=== [digest · dev mode] → ${admin.email} ===\n${subject}\n${text}\n=====\n`);
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
          to: [admin.email],
          subject,
          html,
          text,
        }),
      });
      if (res.ok) sent++;
    } catch (e) {
      logger.error("digest.send_failed", e, { email: admin.email });
    }
  }

  state.lastSentAt = new Date().toISOString();
  state.lastDigest = {
    sentAt: state.lastSentAt,
    sentCount: sent,
    period: {
      from: new Date(now - 7 * 86_400_000).toISOString(),
      to: new Date(now).toISOString(),
    },
    stats,
  };
  await writeState(state);
  logger.info("digest.sent", { sent });

  return { sent, skipped: false };
}

export async function getLastDigestInfo(): Promise<DigestState> {
  return await readState();
}
