/**
 * Webhook temps réel pour notifier un canal externe à chaque nouveau lead.
 *
 * Supporte Slack ET Discord en parallèle (les deux si configurés).
 *   SLACK_WEBHOOK_URL  = https://hooks.slack.com/services/...
 *   DISCORD_WEBHOOK_URL = https://discord.com/api/webhooks/...
 *
 * Si aucune des deux n'est configurée → le webhook est silencieusement no-op,
 * et on log en console le contenu prévu (utile pour dev / debug).
 *
 * Tout échec est silencieux côté API publique : on n'empêche jamais la
 * création d'un lead à cause d'un canal externe down.
 */

import type { LeadRecord } from "./devis-schema";
import { LEVEL_LABELS, LEVEL_COLORS } from "./lead-scoring";
import { logger } from "./logger";

const SERVICE_LABELS_FR: Record<LeadRecord["services"][number], string> = {
  chauffage: "Chauffage",
  pac: "PAC",
  clim: "Climatisation",
  sanitaire: "Sanitaire",
  enr: "Énergies renouv.",
  depannage: "Dépannage",
  autre: "Autre",
};

const BUDGET_LABELS_FR: Record<LeadRecord["budget"], string> = {
  less10: "< 10 k€",
  "10-20": "10-20 k€",
  "20-40": "20-40 k€",
  "40plus": "> 40 k€",
  inconnu: "Budget ?",
};

const TIMELINE_LABELS_FR: Record<LeadRecord["timeline"], string> = {
  urgent: "Urgent (< 2 sem.)",
  court: "< 3 mois",
  annee: "Cette année",
  exploration: "Exploration",
};

function publicAdminUrl(reference: string): string {
  const base = process.env.PUBLIC_URL?.replace(/\/$/, "") ?? "http://localhost:3017";
  return `${base}/admin/leads/${encodeURIComponent(reference)}`;
}

function levelEmoji(level: LeadRecord["level"] | undefined): string {
  if (level === "hot") return "🔥";
  if (level === "warm") return "🟠";
  if (level === "cold") return "⚪";
  return "📥";
}

/* ─────────────── Slack ─────────────── */

async function sendSlack(lead: LeadRecord): Promise<{ ok: boolean; error?: string }> {
  const url = process.env.SLACK_WEBHOOK_URL;
  if (!url) return { ok: false, error: "no_url" };

  const services = lead.services.map((s) => SERVICE_LABELS_FR[s]).join(" · ");
  const level = lead.level;
  const score = lead.score;
  const emoji = levelEmoji(level);
  const levelLabel = level ? LEVEL_LABELS[level] : "Nouveau";
  const adminUrl = publicAdminUrl(lead.reference);

  // Slack Block Kit — visuel propre, contraste avec les notifs habituelles
  const payload = {
    text: `${emoji} ${levelLabel} · ${lead.reference} · ${services} · ${lead.commune}`,
    blocks: [
      {
        type: "header",
        text: {
          type: "plain_text",
          text: `${emoji} Nouveau lead · ${levelLabel}${score != null ? ` (${score}/100)` : ""}`,
          emoji: true,
        },
      },
      {
        type: "section",
        fields: [
          { type: "mrkdwn", text: `*Référence*\n\`${lead.reference}\`` },
          { type: "mrkdwn", text: `*Contact*\n${lead.fullName}` },
          { type: "mrkdwn", text: `*Projets*\n${services}` },
          { type: "mrkdwn", text: `*Budget*\n${BUDGET_LABELS_FR[lead.budget]}` },
          { type: "mrkdwn", text: `*Délai*\n${TIMELINE_LABELS_FR[lead.timeline]}` },
          { type: "mrkdwn", text: `*Commune*\n${lead.commune} · ${lead.surface} m²` },
        ],
      },
      ...(lead.scoreReasons && lead.scoreReasons.length > 0
        ? [
            {
              type: "context",
              elements: [
                {
                  type: "mrkdwn",
                  text:
                    "*Signaux* — " +
                    lead.scoreReasons
                      .slice(0, 5)
                      .map((r) => `\`+${r.points}\` ${r.label}`)
                      .join(" · "),
                },
              ],
            },
          ]
        : []),
      {
        type: "actions",
        elements: [
          {
            type: "button",
            text: { type: "plain_text", text: "📂 Ouvrir le dossier", emoji: true },
            url: adminUrl,
            style: level === "hot" ? "primary" : undefined,
          },
          {
            type: "button",
            text: { type: "plain_text", text: "📞 Appeler", emoji: true },
            url: `tel:${lead.phone.replace(/\s/g, "")}`,
          },
          {
            type: "button",
            text: { type: "plain_text", text: "✉️ Email", emoji: true },
            url: `mailto:${lead.email}`,
          },
        ],
      },
    ],
  };

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      return { ok: false, error: `slack ${res.status} ${await res.text().catch(() => "")}` };
    }
    return { ok: true };
  } catch (e) {
    return { ok: false, error: `slack network ${String(e)}` };
  }
}

/* ─────────────── Discord ─────────────── */

async function sendDiscord(lead: LeadRecord): Promise<{ ok: boolean; error?: string }> {
  const url = process.env.DISCORD_WEBHOOK_URL;
  if (!url) return { ok: false, error: "no_url" };

  const services = lead.services.map((s) => SERVICE_LABELS_FR[s]).join(" · ");
  const level = lead.level;
  const score = lead.score;
  const emoji = levelEmoji(level);
  const levelLabel = level ? LEVEL_LABELS[level] : "Nouveau";
  const colorHex = level ? LEVEL_COLORS[level] : "#b86a36";
  const colorInt = parseInt(colorHex.replace("#", ""), 16);
  const adminUrl = publicAdminUrl(lead.reference);

  const reasonsText =
    (lead.scoreReasons ?? [])
      .slice(0, 6)
      .map((r) => `\`+${r.points}\` ${r.label}`)
      .join("\n") || "—";

  const payload = {
    content: `${emoji} **${levelLabel}** · \`${lead.reference}\` · ${services} · ${lead.commune}`,
    embeds: [
      {
        title: `${emoji} Nouveau lead · ${levelLabel}${score != null ? ` (${score}/100)` : ""}`,
        url: adminUrl,
        color: colorInt,
        fields: [
          { name: "Contact", value: lead.fullName, inline: true },
          { name: "Projets", value: services, inline: true },
          { name: "Budget", value: BUDGET_LABELS_FR[lead.budget], inline: true },
          { name: "Délai", value: TIMELINE_LABELS_FR[lead.timeline], inline: true },
          {
            name: "Commune",
            value: `${lead.commune} · ${lead.surface} m²`,
            inline: true,
          },
          { name: "Canal préféré", value: lead.preferredChannel, inline: true },
          { name: "Signaux scoring", value: reasonsText, inline: false },
        ],
        footer: { text: `Réf · ${lead.reference}` },
        timestamp: lead.submittedAt,
      },
    ],
  };

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      return { ok: false, error: `discord ${res.status} ${await res.text().catch(() => "")}` };
    }
    return { ok: true };
  } catch (e) {
    return { ok: false, error: `discord network ${String(e)}` };
  }
}

/* ─────────────── Console fallback (dev) ─────────────── */

function logConsoleFallback(lead: LeadRecord) {
  const services = lead.services.map((s) => SERVICE_LABELS_FR[s]).join(" · ");
  const emoji = levelEmoji(lead.level);
  const label = lead.level ? LEVEL_LABELS[lead.level] : "Nouveau";
  // eslint-disable-next-line no-console
  console.info(
    `\n=== [webhook · dev mode — no SLACK_WEBHOOK_URL/DISCORD_WEBHOOK_URL] ===
${emoji} ${label}${lead.score != null ? ` (${lead.score}/100)` : ""} · ${lead.reference}
${lead.fullName} · ${services}
${BUDGET_LABELS_FR[lead.budget]} · ${TIMELINE_LABELS_FR[lead.timeline]} · ${lead.commune}
→ ${publicAdminUrl(lead.reference)}
========================================================================\n`,
  );
}

/* ─────────────── API publique ─────────────── */

export type WebhookOutcome = {
  slack?: { ok: boolean; error?: string };
  discord?: { ok: boolean; error?: string };
  mode: "slack" | "discord" | "both" | "console";
};

export async function sendLeadWebhook(lead: LeadRecord): Promise<WebhookOutcome> {
  const hasSlack = !!process.env.SLACK_WEBHOOK_URL;
  const hasDiscord = !!process.env.DISCORD_WEBHOOK_URL;

  if (!hasSlack && !hasDiscord) {
    logConsoleFallback(lead);
    return { mode: "console" };
  }

  const tasks: Promise<unknown>[] = [];
  const out: WebhookOutcome = {
    mode: hasSlack && hasDiscord ? "both" : hasSlack ? "slack" : "discord",
  };

  if (hasSlack) {
    tasks.push(
      sendSlack(lead).then((r) => {
        out.slack = r;
        if (!r.ok) {
          logger.warn("webhook.slack_failed", { reference: lead.reference, error: r.error });
        } else {
          logger.info("webhook.slack_sent", { reference: lead.reference });
        }
      }),
    );
  }
  if (hasDiscord) {
    tasks.push(
      sendDiscord(lead).then((r) => {
        out.discord = r;
        if (!r.ok) {
          logger.warn("webhook.discord_failed", { reference: lead.reference, error: r.error });
        } else {
          logger.info("webhook.discord_sent", { reference: lead.reference });
        }
      }),
    );
  }

  await Promise.allSettled(tasks);
  return out;
}
