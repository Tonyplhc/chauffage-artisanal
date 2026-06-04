/**
 * Envoi d'un template email à un lead — déclenché depuis la fiche lead admin.
 */

import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminApi } from "@/lib/require-admin";
import { getLead } from "@/lib/leads-store";
import { getTemplate, renderTemplate } from "@/lib/email-templates-store";
import { logger } from "@/lib/logger";
import { logActivity } from "@/lib/activity-log";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SendSchema = z.object({
  templateId: z.string().min(1).max(80),
});

export async function POST(
  req: Request,
  { params }: { params: { reference: string } },
) {
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
    return NextResponse.json({ error: "Données invalides" }, { status: 400 });
  }

  const lead = await getLead(params.reference);
  if (!lead) {
    return NextResponse.json({ error: "Lead introuvable" }, { status: 404 });
  }

  const tpl = await getTemplate(parsed.data.templateId);
  if (!tpl) {
    return NextResponse.json({ error: "Template introuvable" }, { status: 404 });
  }

  const { subject, body } = renderTemplate(tpl, lead);

  // Envoi via Resend si configuré, sinon console fallback
  const hasResend = !!(
    process.env.RESEND_API_KEY && process.env.EMAIL_FROM && process.env.EMAIL_ADMIN
  );

  if (!hasResend) {
    // eslint-disable-next-line no-console
    console.info(`\n=== [template · dev mode] → ${lead.email} ===
SUBJ : ${subject}

${body}
=================================================================\n`);
    logger.info("admin.template_sent", {
      reference: lead.reference,
      templateId: tpl.id,
      mode: "console",
    });
    void logActivity("lead.template_sent", `Template envoyé · ${tpl.name}`, {
      reference: lead.reference,
      meta: { templateId: tpl.id, mode: "console" },
    });
    return NextResponse.json({ ok: true, mode: "console" });
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
        to: [lead.email],
        subject,
        text: body,
      }),
    });
    if (!res.ok) {
      const errText = await res.text().catch(() => "");
      logger.error("admin.template_send_failed", errText, {
        reference: lead.reference,
        templateId: tpl.id,
      });
      return NextResponse.json(
        { error: `Resend ${res.status}` },
        { status: 502 },
      );
    }
    logger.info("admin.template_sent", {
      reference: lead.reference,
      templateId: tpl.id,
      mode: "resend",
    });
    void logActivity("lead.template_sent", `Template envoyé · ${tpl.name}`, {
      reference: lead.reference,
      meta: { templateId: tpl.id, mode: "resend" },
    });
    return NextResponse.json({ ok: true, mode: "resend" });
  } catch (e) {
    logger.error("admin.template_send_error", e);
    return NextResponse.json({ error: "Échec d'envoi" }, { status: 500 });
  }
}
