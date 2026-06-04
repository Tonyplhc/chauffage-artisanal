/**
 * Webhook Stripe — réception des événements de paiement.
 *
 * Endpoint public — sécurisé par la signature Stripe (header
 * `stripe-signature`). On valide manuellement via HMAC SHA-256 du payload
 * brut + STRIPE_WEBHOOK_SECRET.
 *
 * Événement traité :
 *   - checkout.session.completed → marque le Payment comme `completed`
 *
 * Pour la spec complète : https://stripe.com/docs/webhooks/signatures
 */

import { NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "node:crypto";
import { markPaid, getPayment } from "@/lib/payments-store";
import { logger } from "@/lib/logger";
import { logActivity } from "@/lib/activity-log";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function verifySignature(
  payload: string,
  header: string,
  secret: string,
): boolean {
  // Format header: "t=12345,v1=abc..."
  const parts = header.split(",");
  const tsPart = parts.find((p) => p.startsWith("t="));
  const sigPart = parts.find((p) => p.startsWith("v1="));
  if (!tsPart || !sigPart) return false;
  const timestamp = tsPart.slice(2);
  const provided = sigPart.slice(3);
  // Tolérance 5 min anti-replay
  const ts = Number(timestamp);
  if (!Number.isFinite(ts)) return false;
  const ageSec = Math.abs(Date.now() / 1000 - ts);
  if (ageSec > 300) return false;

  const expected = createHmac("sha256", secret)
    .update(`${timestamp}.${payload}`)
    .digest("hex");
  if (provided.length !== expected.length) return false;
  try {
    return timingSafeEqual(
      Buffer.from(provided, "hex"),
      Buffer.from(expected, "hex"),
    );
  } catch {
    return false;
  }
}

export async function POST(req: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    logger.warn("stripe.webhook_no_secret");
    return NextResponse.json(
      { error: "Webhook non configuré" },
      { status: 503 },
    );
  }
  const sigHeader = req.headers.get("stripe-signature");
  const payload = await req.text();
  if (!sigHeader || !verifySignature(payload, sigHeader, secret)) {
    logger.warn("stripe.webhook_invalid_signature");
    return NextResponse.json({ error: "Signature invalide" }, { status: 400 });
  }

  let event: { type?: string; data?: { object?: Record<string, unknown> } };
  try {
    event = JSON.parse(payload);
  } catch {
    return NextResponse.json({ error: "JSON invalide" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data?.object;
    const paymentId =
      ((session?.metadata as Record<string, unknown> | undefined)?.paymentId as
        | string
        | undefined) ?? null;
    if (paymentId) {
      const before = await getPayment(paymentId);
      if (before && before.status !== "completed") {
        await markPaid(paymentId);
        void logActivity(
          "lead.template_sent",
          `Paiement reçu via Stripe — ${(before.amountCents / 100).toFixed(2)} €`,
          {
            reference: before.leadReference,
            meta: { paymentId, sessionId: session?.id },
          },
        );
      }
    }
  }

  return NextResponse.json({ ok: true });
}
