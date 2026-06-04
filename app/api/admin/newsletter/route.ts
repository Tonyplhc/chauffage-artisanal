/**
 * Admin newsletter — liste abonnés + composition / envoi.
 *
 * GET  → liste des abonnés (confirmés + en attente)
 * POST → envoyer une newsletter à tous les abonnés confirmés
 *   body: { subject, body }
 */

import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminApi } from "@/lib/require-admin";
import {
  listNewsletter,
  makeNewsletterToken,
} from "@/lib/newsletter-store";
import { logger } from "@/lib/logger";
import { logActivity } from "@/lib/activity-log";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const auth = await requireAdminApi(req);
  if (!auth.ok) return auth.response;
  const all = await listNewsletter();
  const confirmed = all.filter((e) => e.status === "confirmed").length;
  const pending = all.filter((e) => e.status === "pending").length;
  const unsubscribed = all.filter((e) => e.status === "unsubscribed").length;
  return NextResponse.json({
    entries: all,
    stats: { total: all.length, confirmed, pending, unsubscribed },
  });
}

const SendSchema = z.object({
  subject: z.string().min(2).max(200),
  body: z.string().min(10).max(50_000),
  testMode: z.boolean().optional().default(false),
  testEmail: z.string().email().optional(),
});

export async function POST(req: Request) {
  const auth = await requireAdminApi(req);
  if (!auth.ok) return auth.response;
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON invalide" }, { status: 400 });
  }
  const parsed = SendSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Données invalides", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const all = await listNewsletter();
  const recipients = parsed.data.testMode
    ? parsed.data.testEmail
      ? [{ email: parsed.data.testEmail }]
      : []
    : all.filter((e) => e.status === "confirmed");

  if (recipients.length === 0) {
    return NextResponse.json(
      { error: "Aucun destinataire éligible." },
      { status: 400 },
    );
  }

  const baseUrl =
    process.env.PUBLIC_URL?.replace(/\/$/, "") ?? "http://localhost:3020";

  let sent = 0;
  let failed = 0;

  // Si Resend pas configuré : envoi console pour la démo
  const useResend = !!(process.env.RESEND_API_KEY && process.env.EMAIL_FROM);

  for (const r of recipients) {
    const unsubToken = makeNewsletterToken(r.email, "unsubscribe");
    const unsubUrl = `${baseUrl}/api/newsletter/unsubscribe?email=${encodeURIComponent(
      r.email,
    )}&t=${unsubToken}`;

    const html = renderNewsletterHtml(
      parsed.data.subject,
      parsed.data.body,
      unsubUrl,
    );
    const text = `${parsed.data.body}\n\n---\nSe désinscrire : ${unsubUrl}`;

    if (!useResend) {
      // eslint-disable-next-line no-console
      console.info(
        `\n=== [newsletter · dev mode] → ${r.email} ===\nSUBJ : ${parsed.data.subject}\n${parsed.data.body}\n===\nUNSUB : ${unsubUrl}\n========================\n`,
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
          subject: parsed.data.subject,
          html,
          text,
        }),
      });
      if (res.ok) sent++;
      else failed++;
    } catch {
      failed++;
    }
  }

  logger.info("admin.newsletter_sent", {
    subject: parsed.data.subject,
    sent,
    failed,
    testMode: parsed.data.testMode,
  });
  void logActivity(
    "lead.template_sent",
    `Newsletter envoyée · ${sent} destinataire(s)${
      parsed.data.testMode ? " · test" : ""
    }`,
    { meta: { subject: parsed.data.subject, sent, failed } },
  );

  return NextResponse.json({ ok: true, sent, failed });
}

/* ─────────────── Rendu HTML ─────────────── */

function renderNewsletterHtml(subject: string, body: string, unsubUrl: string) {
  // body est en plain text avec retours à la ligne → on convertit en <p>
  const paragraphs = body
    .split(/\n{2,}/)
    .map((p) => `<p style="margin:0 0 16px;line-height:1.6;color:#2a251e;">${escapeHtml(p).replace(/\n/g, "<br/>")}</p>`)
    .join("");

  return `<!doctype html>
<html><body style="background:#f6f0e4;font-family:'Inter Tight',Inter,system-ui,sans-serif;color:#2a251e;margin:0;padding:32px 16px;">
<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background:#f6f0e4;">
  <tr><td align="center">
    <table role="presentation" cellpadding="0" cellspacing="0" width="600" style="max-width:600px;background:#ffffff;border:1px solid rgba(42,37,30,0.08);border-radius:24px;overflow:hidden;">
      <tr><td style="background:#1e1a15;color:#f6f0e4;padding:28px 32px;">
        <div style="font-family:monospace;font-size:10px;letter-spacing:0.28em;text-transform:uppercase;color:#b86a36;">Chauffage Artisanal · Luxembourg</div>
        <div style="font-family:Georgia,serif;font-size:24px;letter-spacing:-0.01em;margin-top:8px;">${escapeHtml(subject)}</div>
      </td></tr>
      <tr><td style="padding:32px;">
        ${paragraphs}
      </td></tr>
      <tr><td style="background:#ede5d3;padding:18px 32px;font-size:11px;color:#8b847a;text-align:center;">
        <a href="${unsubUrl}" style="color:#8b847a;text-decoration:underline;">Se désinscrire</a> · Chauffage Artisanal · Luxembourg
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
