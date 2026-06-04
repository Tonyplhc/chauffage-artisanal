/**
 * Souscription newsletter avec double opt-in.
 *
 * POST /api/newsletter
 *   body: { email: string }
 *   → enregistre en status="pending" + envoie email de confirmation avec
 *     lien /api/newsletter/confirm?email=...&t=...
 */

import { NextResponse } from "next/server";
import { z } from "zod";
import { rateLimit, clientKey } from "@/lib/rate-limit";
import { upsertPending, makeNewsletterToken } from "@/lib/newsletter-store";
import { logger } from "@/lib/logger";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SubscribeSchema = z.object({
  email: z.string().email().max(180),
});

async function sendConfirmationEmail(email: string, link: string) {
  if (!process.env.RESEND_API_KEY || !process.env.EMAIL_FROM) {
    // eslint-disable-next-line no-console
    console.info(`\n=== [newsletter · dev mode] → ${email} ===
SUBJ : Confirmez votre inscription à la newsletter
Confirmez en cliquant sur ce lien : ${link}
========================================================\n`);
    return { ok: true, mode: "console" as const };
  }
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: process.env.EMAIL_FROM,
      to: [email],
      subject: "Confirmez votre inscription · Chauffage Artisanal",
      text: `Bonjour,

Merci de votre intérêt pour notre newsletter. Pour confirmer votre inscription, cliquez sur le lien suivant :

${link}

Si vous n'êtes pas à l'origine de cette demande, ignorez simplement cet email.

— Chauffage Artisanal`,
      html: `<!doctype html><html><body style="background:#f6f0e4;font-family:system-ui;color:#2a251e;padding:32px;">
<div style="max-width:560px;margin:0 auto;background:#fff;padding:32px;border-radius:24px;border:1px solid rgba(42,37,30,0.08);">
  <div style="font-family:monospace;font-size:10px;letter-spacing:0.28em;text-transform:uppercase;color:#b86a36;">Chauffage Artisanal</div>
  <h1 style="font-family:Georgia,serif;font-size:24px;margin:12px 0 16px;">Confirmez votre inscription</h1>
  <p style="font-size:15px;line-height:1.6;color:#4a4338;">Merci de votre intérêt pour notre newsletter. Confirmez votre inscription en un clic :</p>
  <div style="text-align:center;margin:24px 0;">
    <a href="${link}" style="display:inline-block;padding:12px 24px;background:#1e1a15;color:#f6f0e4;text-decoration:none;border-radius:9999px;font-size:14px;">Confirmer mon inscription</a>
  </div>
  <p style="font-size:12px;color:#8b847a;">Si vous n'êtes pas à l'origine de cette demande, ignorez ce message.</p>
</div></body></html>`,
    }),
  });
  return res.ok
    ? { ok: true, mode: "resend" as const }
    : { ok: false, mode: "resend" as const, error: `Resend ${res.status}` };
}

export async function POST(req: Request) {
  const ip = clientKey(req.headers);
  const limit = rateLimit(`newsletter:${ip}`, { windowMs: 60_000, max: 3 });
  if (!limit.ok) {
    return NextResponse.json(
      { error: "Trop de tentatives. Réessayez dans une minute." },
      { status: 429 },
    );
  }

  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON invalide." }, { status: 400 });
  }
  const parsed = SubscribeSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ error: "Email invalide." }, { status: 400 });
  }

  const entry = await upsertPending(parsed.data.email);

  // Si déjà confirmé, on évite de spammer
  if (entry.status === "confirmed") {
    logger.info("newsletter.duplicate_confirmed", { email: entry.email });
    return NextResponse.json({
      ok: true,
      message: "Vous êtes déjà inscrit. Merci !",
    });
  }

  const baseUrl =
    process.env.PUBLIC_URL?.replace(/\/$/, "") ?? "http://localhost:3020";
  const token = makeNewsletterToken(entry.email, "confirm");
  const link = `${baseUrl}/api/newsletter/confirm?email=${encodeURIComponent(
    entry.email,
  )}&t=${token}`;

  try {
    const result = await sendConfirmationEmail(entry.email, link);
    logger.info("newsletter.subscribe_pending", {
      email: entry.email,
      mode: result.mode,
    });
  } catch (e) {
    logger.error("newsletter.email_error", e);
  }

  return NextResponse.json(
    {
      ok: true,
      message: "Vérifiez vos emails pour confirmer votre inscription.",
    },
    { status: 201 },
  );
}
