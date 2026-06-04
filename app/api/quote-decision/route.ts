/**
 * Endpoint public pour qu'un client accepte ou refuse son devis.
 *
 * Auth : token HMAC `quote:<reference>` (le même que celui qui sert à voir la
 * page publique du devis). Pas d'auth admin.
 *
 * Effets :
 *   - Met à jour le quote (status + signature ou refusalReason)
 *   - Si accepted → transitionne le lead en statut "converti"
 *   - Émet un event SSE + activity log
 *   - Envoie un email à l'admin
 */

import { NextResponse } from "next/server";
import { createHash } from "node:crypto";
import { z } from "zod";
import { rateLimit, clientKey } from "@/lib/rate-limit";
import { getLead, updateLead } from "@/lib/leads-store";
import { getQuote, markDecision } from "@/lib/quotes-store";
import { verifyRecapToken } from "@/lib/recap-token";
import { publish } from "@/lib/event-bus";
import { logActivity } from "@/lib/activity-log";
import { logger } from "@/lib/logger";
import { computeTotals, formatEur } from "@/lib/quote-schema";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DecisionSchema = z.discriminatedUnion("decision", [
  z.object({
    decision: z.literal("accepted"),
    reference: z.string().regex(/^DEV-\d{4}-\d{4}$/),
    token: z.string().min(8).max(60),
    signerName: z.string().min(2).max(120),
    acceptedTerms: z.literal(true),
  }),
  z.object({
    decision: z.literal("refused"),
    reference: z.string().regex(/^DEV-\d{4}-\d{4}$/),
    token: z.string().min(8).max(60),
    refusalReason: z.string().max(2000).default(""),
  }),
]);

function hashIp(ip: string): string {
  return createHash("sha256").update(`ip:${ip}`).digest("hex").slice(0, 16);
}

export async function POST(req: Request) {
  const ip = clientKey(req.headers);
  const limit = rateLimit(`quote-decision:${ip}`, { windowMs: 60_000, max: 5 });
  if (!limit.ok) {
    return NextResponse.json(
      { error: "Trop de tentatives." },
      { status: 429 },
    );
  }

  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON invalide" }, { status: 400 });
  }
  const parsed = DecisionSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Données invalides", details: parsed.error.flatten() },
      { status: 400 },
    );
  }
  const data = parsed.data;

  // Vérif token
  if (!verifyRecapToken(`quote:${data.reference}`, data.token)) {
    return NextResponse.json({ error: "Lien invalide" }, { status: 403 });
  }

  const lead = await getLead(data.reference);
  const quote = await getQuote(data.reference);
  if (!lead || !quote) {
    return NextResponse.json({ error: "Devis introuvable" }, { status: 404 });
  }

  if (quote.status === "accepted" || quote.status === "refused") {
    return NextResponse.json(
      { error: "Ce devis a déjà reçu une réponse." },
      { status: 409 },
    );
  }

  let updatedQuote;
  if (data.decision === "accepted") {
    updatedQuote = await markDecision(data.reference, "accepted", {
      signature: {
        signerName: data.signerName,
        acceptedTerms: true,
        signedAt: new Date().toISOString(),
        ipHash: hashIp(ip),
        userAgent: req.headers.get("user-agent")?.slice(0, 400),
      },
    });
    // Transition lead → converti
    await updateLead(data.reference, { status: "converti" });
    publish({
      type: "lead.status_changed",
      at: new Date().toISOString(),
      reference: data.reference,
      from: lead.status,
      to: "converti",
    });
    void logActivity(
      "lead.quote_sent",
      `Devis ACCEPTÉ par le client · n° ${quote.number}`,
      {
        reference: data.reference,
        meta: { signedBy: data.signerName, number: quote.number },
      },
    );
    logger.info("quote.accepted", {
      reference: data.reference,
      number: quote.number,
    });
  } else {
    updatedQuote = await markDecision(data.reference, "refused", {
      refusalReason: data.refusalReason || undefined,
    });
    void logActivity(
      "lead.quote_sent",
      `Devis REFUSÉ par le client · n° ${quote.number}`,
      {
        reference: data.reference,
        meta: { number: quote.number, reason: data.refusalReason },
      },
    );
    logger.info("quote.refused", {
      reference: data.reference,
      number: quote.number,
    });
  }

  // Notif email admin (best-effort)
  if (process.env.RESEND_API_KEY && process.env.EMAIL_ADMIN && process.env.EMAIL_FROM) {
    const totals = computeTotals(quote);
    const baseUrl =
      process.env.PUBLIC_URL?.replace(/\/$/, "") ?? "http://localhost:3020";
    void fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: process.env.EMAIL_FROM,
        to: [process.env.EMAIL_ADMIN],
        subject:
          data.decision === "accepted"
            ? `✅ Devis ${quote.number} ACCEPTÉ · ${lead.fullName}`
            : `❌ Devis ${quote.number} refusé · ${lead.fullName}`,
        text: `${data.decision === "accepted" ? "Le client a accepté votre devis." : "Le client a refusé votre devis."}

Référence : ${data.reference}
Devis n° : ${quote.number}
Client : ${lead.fullName} (${lead.email})
Total TTC : ${formatEur(totals.ttcAmount)}
${data.decision === "accepted" ? `Signé par : ${data.signerName}` : `Motif : ${data.refusalReason || "non communiqué"}`}

Ouvrir le dossier : ${baseUrl}/admin/leads/${data.reference}`,
      }),
    });
  } else {
    // eslint-disable-next-line no-console
    console.info(
      `\n=== [quote-decision · dev mode] ===\n` +
        `Référence : ${data.reference}\n` +
        `Décision : ${data.decision}\n` +
        (data.decision === "accepted"
          ? `Signé par : ${data.signerName}\n`
          : `Motif : ${data.refusalReason}\n`) +
        `====================================\n`,
    );
  }

  return NextResponse.json({ ok: true, quote: updatedQuote });
}
