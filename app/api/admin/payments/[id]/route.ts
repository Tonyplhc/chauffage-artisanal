/**
 * GET    /api/admin/payments/[id]                → détail
 * POST   /api/admin/payments/[id]/mark-paid      → simule paiement (mode démo uniquement)
 *   (Pour le mode live, le webhook Stripe est l'autorité.)
 */

import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/require-admin";
import { getPayment, markPaid } from "@/lib/payments-store";
import { logActivity } from "@/lib/activity-log";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  req: Request,
  { params }: { params: { id: string } },
) {
  const auth = await requireAdminApi(req);
  if (!auth.ok) return auth.response;
  const payment = await getPayment(params.id);
  if (!payment) {
    return NextResponse.json({ error: "Introuvable" }, { status: 404 });
  }
  return NextResponse.json({ payment });
}

export async function POST(
  req: Request,
  { params }: { params: { id: string } },
) {
  const auth = await requireAdminApi(req);
  if (!auth.ok) return auth.response;
  const payment = await getPayment(params.id);
  if (!payment) {
    return NextResponse.json({ error: "Introuvable" }, { status: 404 });
  }
  if (payment.mode !== "demo") {
    return NextResponse.json(
      { error: "Mark-paid uniquement en mode démo. En live, Stripe webhook." },
      { status: 400 },
    );
  }
  if (payment.status === "completed") {
    return NextResponse.json({ payment });
  }
  const updated = await markPaid(params.id);
  void logActivity(
    "lead.template_sent",
    `Paiement marqué reçu (démo) — ${(payment.amountCents / 100).toFixed(2)} €`,
    {
      reference: payment.leadReference,
      meta: { paymentId: payment.id, mode: "demo" },
    },
  );
  return NextResponse.json({ payment: updated });
}
