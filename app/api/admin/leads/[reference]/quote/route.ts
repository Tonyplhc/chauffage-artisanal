import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/require-admin";
import { getLead } from "@/lib/leads-store";
import { getQuote, upsertQuote, markSent } from "@/lib/quotes-store";
import { QuoteSchema, makeQuoteNumber, computeTotals, formatEur } from "@/lib/quote-schema";
import { makeRecapToken } from "@/lib/recap-token";
import { logger } from "@/lib/logger";
import { logActivity } from "@/lib/activity-log";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  req: Request,
  { params }: { params: { reference: string } },
) {
  const auth = await requireAdminApi(req);
  if (!auth.ok) return auth.response;
  const quote = await getQuote(params.reference);
  return NextResponse.json({ quote: quote ?? null });
}

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
  const incoming = (raw ?? {}) as Record<string, unknown>;
  if (!incoming.number) incoming.number = makeQuoteNumber();
  incoming.leadReference = params.reference;
  const parsed = QuoteSchema.safeParse(incoming);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Devis invalide", details: parsed.error.flatten() },
      { status: 400 },
    );
  }
  const saved = await upsertQuote(parsed.data);
  logger.info("admin.quote_saved", {
    reference: params.reference,
    number: saved.number,
  });
  void logActivity("lead.quote_saved", `Devis enregistré · n° ${saved.number}`, {
    reference: params.reference,
    meta: { number: saved.number, lines: saved.lines.length },
  });
  return NextResponse.json({ quote: saved });
}

/**
 * PATCH = envoyer le devis au client (transitionne en status=sent + email).
 */
export async function PATCH(
  req: Request,
  { params }: { params: { reference: string } },
) {
  const auth = await requireAdminApi(req);
  if (!auth.ok) return auth.response;
  const lead = await getLead(params.reference);
  const quote = await getQuote(params.reference);
  if (!lead || !quote) {
    return NextResponse.json({ error: "Lead ou devis introuvable" }, { status: 404 });
  }

  const baseUrl = process.env.PUBLIC_URL?.replace(/\/$/, "") ?? "http://localhost:3020";
  const token = makeRecapToken(`quote:${lead.reference}`);
  const quoteUrl = `${baseUrl}/devis/officiel/${encodeURIComponent(lead.reference)}?t=${token}`;
  const totals = computeTotals(quote);

  // Envoi email
  if (!process.env.RESEND_API_KEY || !process.env.EMAIL_FROM) {
    // eslint-disable-next-line no-console
    console.info(`\n=== [devis officiel · dev mode] → ${lead.email} ===
SUBJ : Votre devis ${quote.number} · Chauffage Artisanal
TTC total : ${formatEur(totals.ttcAmount)}
Lien : ${quoteUrl}
=================================================================\n`);
  } else {
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: process.env.EMAIL_FROM,
        to: [lead.email],
        subject: `Votre devis ${quote.number} · Chauffage Artisanal`,
        text: `Bonjour ${lead.fullName.split(" ")[0]},

Votre devis ${quote.number} est disponible :
${quoteUrl}

Montant total TTC : ${formatEur(totals.ttcAmount)}

— Chauffage Artisanal`,
      }),
    });
  }

  const sent = await markSent(params.reference);
  logger.info("admin.quote_sent", {
    reference: params.reference,
    number: quote.number,
    ttc: totals.ttcAmount,
  });
  void logActivity(
    "lead.quote_sent",
    `Devis envoyé · n° ${quote.number} · ${formatEur(totals.ttcAmount)} TTC`,
    { reference: params.reference, meta: { number: quote.number, ttc: totals.ttcAmount } },
  );
  return NextResponse.json({ quote: sent, quoteUrl });
}
