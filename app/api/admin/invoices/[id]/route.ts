/**
 * GET   /api/admin/invoices/[id] → détail + totaux
 * PATCH /api/admin/invoices/[id] → édition / changement de statut
 */

import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/require-admin";
import {
  getInvoice,
  updateInvoice,
  computeTotals,
} from "@/lib/invoices-store";
import { getBrand } from "@/lib/brand-settings";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  req: Request,
  { params }: { params: { id: string } },
) {
  const auth = await requireAdminApi(req);
  if (!auth.ok) return auth.response;
  const invoice = await getInvoice(params.id);
  if (!invoice) {
    return NextResponse.json({ error: "Introuvable" }, { status: 404 });
  }
  const totals = computeTotals(invoice);
  const brand = await getBrand();
  return NextResponse.json({ invoice, totals, brand });
}

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } },
) {
  const auth = await requireAdminApi(req);
  if (!auth.ok) return auth.response;
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON invalide" }, { status: 400 });
  }
  const invoice = await updateInvoice(params.id, body as never);
  if (!invoice) {
    return NextResponse.json({ error: "Introuvable" }, { status: 404 });
  }
  return NextResponse.json({ invoice });
}
