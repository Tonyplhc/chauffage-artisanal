/**
 * GET  /api/admin/leads/[reference]/payment       → liste paiements du lead
 * POST /api/admin/leads/[reference]/payment       { amountCents, description, quoteNumber? }
 *
 * En mode "live" (STRIPE_SECRET_KEY défini) : crée une session Stripe Checkout
 * via fetch direct vers l'API Stripe (pas de SDK npm — pour rester découplé).
 *
 * En mode "demo" : crée un Payment record qui pointe vers /paiement-demo/[id].
 */

import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/require-admin";
import { getLead } from "@/lib/leads-store";
import {
  createPayment,
  listPaymentsForLead,
  updatePayment,
} from "@/lib/payments-store";
import { logActivity } from "@/lib/activity-log";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  req: Request,
  { params }: { params: { reference: string } },
) {
  const auth = await requireAdminApi(req);
  if (!auth.ok) return auth.response;
  const payments = await listPaymentsForLead(params.reference);
  return NextResponse.json({ payments });
}

export async function POST(
  req: Request,
  { params }: { params: { reference: string } },
) {
  const auth = await requireAdminApi(req);
  if (!auth.ok) return auth.response;
  const lead = await getLead(params.reference);
  if (!lead) {
    return NextResponse.json({ error: "Lead introuvable" }, { status: 404 });
  }
  let body: {
    amountCents?: number;
    description?: string;
    quoteNumber?: string;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON invalide" }, { status: 400 });
  }
  if (
    typeof body.amountCents !== "number" ||
    !Number.isFinite(body.amountCents) ||
    body.amountCents <= 0
  ) {
    return NextResponse.json(
      { error: "amountCents requis (entier > 0)" },
      { status: 400 },
    );
  }
  const description = body.description?.trim() || `Acompte ${params.reference}`;

  try {
    const payment = await createPayment({
      leadReference: params.reference,
      quoteNumber: body.quoteNumber,
      amountCents: Math.round(body.amountCents),
      description,
    });

    // Si mode live, complète la session Stripe
    if (payment.mode === "live" && process.env.STRIPE_SECRET_KEY) {
      const baseUrl = process.env.PUBLIC_URL ?? "http://localhost:3020";
      const successUrl = `${baseUrl}/paiement/succes?id=${payment.id}`;
      const cancelUrl = `${baseUrl}/paiement/annule?id=${payment.id}`;
      const form = new URLSearchParams();
      form.set("mode", "payment");
      form.set("success_url", successUrl);
      form.set("cancel_url", cancelUrl);
      form.set("customer_email", lead.email);
      form.set("line_items[0][quantity]", "1");
      form.set("line_items[0][price_data][currency]", "eur");
      form.set(
        "line_items[0][price_data][product_data][name]",
        description.slice(0, 250),
      );
      form.set(
        "line_items[0][price_data][unit_amount]",
        String(payment.amountCents),
      );
      form.set("metadata[paymentId]", payment.id);
      form.set("metadata[leadReference]", params.reference);

      try {
        const res = await fetch(
          "https://api.stripe.com/v1/checkout/sessions",
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}`,
              "Content-Type": "application/x-www-form-urlencoded",
            },
            body: form.toString(),
          },
        );
        if (res.ok) {
          const data = (await res.json()) as {
            id: string;
            url: string;
          };
          await updatePayment(payment.id, {
            externalSessionId: data.id,
            paymentUrl: data.url,
          });
          payment.externalSessionId = data.id;
          payment.paymentUrl = data.url;
        } else {
          // Fallback : on bascule en démo si Stripe rejette
          const baseUrl = process.env.PUBLIC_URL ?? "http://localhost:3020";
          await updatePayment(payment.id, {
            paymentUrl: `${baseUrl}/paiement-demo/${payment.id}`,
          });
          payment.paymentUrl = `${baseUrl}/paiement-demo/${payment.id}`;
        }
      } catch {
        const baseUrl = process.env.PUBLIC_URL ?? "http://localhost:3020";
        await updatePayment(payment.id, {
          paymentUrl: `${baseUrl}/paiement-demo/${payment.id}`,
        });
        payment.paymentUrl = `${baseUrl}/paiement-demo/${payment.id}`;
      }
    }

    void logActivity(
      "lead.template_sent",
      `Lien de paiement créé (${(payment.amountCents / 100).toFixed(2)} €, mode ${payment.mode})`,
      {
        reference: params.reference,
        meta: { paymentId: payment.id, mode: payment.mode },
      },
    );

    return NextResponse.json({ payment });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Erreur" },
      { status: 400 },
    );
  }
}
