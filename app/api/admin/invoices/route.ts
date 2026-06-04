/**
 * GET  /api/admin/invoices                              → liste globale + stats
 * POST /api/admin/invoices { fromQuote?: "DEV-..." | manual: {...} }
 *   - fromQuote : génère depuis le devis du lead
 *   - manual    : création vierge avec input
 */

import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/require-admin";
import {
  listInvoices,
  createInvoice,
  createInvoiceFromQuote,
  computeStats,
} from "@/lib/invoices-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const auth = await requireAdminApi(req);
  if (!auth.ok) return auth.response;
  const [invoices, stats] = await Promise.all([
    listInvoices(),
    computeStats(),
  ]);
  return NextResponse.json({ invoices, stats });
}

export async function POST(req: Request) {
  const auth = await requireAdminApi(req);
  if (!auth.ok) return auth.response;
  let body: { fromQuote?: string; manual?: never };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON invalide" }, { status: 400 });
  }
  if (typeof body.fromQuote === "string" && body.fromQuote.trim()) {
    const invoice = await createInvoiceFromQuote(body.fromQuote.trim());
    if (!invoice) {
      return NextResponse.json(
        { error: "Devis introuvable pour cette référence" },
        { status: 404 },
      );
    }
    return NextResponse.json({ invoice });
  }
  if (body.manual && typeof body.manual === "object") {
    try {
      const invoice = await createInvoice(body.manual);
      return NextResponse.json({ invoice });
    } catch (e) {
      return NextResponse.json(
        { error: e instanceof Error ? e.message : "Erreur" },
        { status: 400 },
      );
    }
  }
  return NextResponse.json(
    { error: "fromQuote (string) ou manual (objet) requis" },
    { status: 400 },
  );
}
