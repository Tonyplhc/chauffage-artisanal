/**
 * GET  /api/admin/purchase-orders → liste
 * POST /api/admin/purchase-orders → création
 */

import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/require-admin";
import {
  listPurchaseOrders,
  createPurchaseOrder,
} from "@/lib/purchase-orders-store";
import { logActivity } from "@/lib/activity-log";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const auth = await requireAdminApi(req);
  if (!auth.ok) return auth.response;
  const orders = await listPurchaseOrders();
  return NextResponse.json({ orders });
}

export async function POST(req: Request) {
  const auth = await requireAdminApi(req);
  if (!auth.ok) return auth.response;
  let body: {
    supplierId?: string;
    supplierName?: string;
    leadReference?: string;
    lines?: {
      reference: string;
      description: string;
      quantity: number;
      unitPriceHt: number;
    }[];
    vatRate?: number;
    expectedDeliveryAt?: string;
    notes?: string;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON invalide" }, { status: 400 });
  }
  if (!body.supplierId || !body.supplierName || !body.lines?.length) {
    return NextResponse.json(
      { error: "Fournisseur et lignes requis" },
      { status: 400 },
    );
  }
  try {
    const po = await createPurchaseOrder({
      supplierId: body.supplierId,
      supplierName: body.supplierName,
      leadReference: body.leadReference,
      lines: body.lines,
      vatRate: body.vatRate,
      expectedDeliveryAt: body.expectedDeliveryAt,
      notes: body.notes,
    });
    void logActivity(
      "admin.purchase_order_created",
      `BC créé : ${po.number} (${po.supplierName})`,
      { meta: { id: po.id, totalHt: po.totalHt } },
    );
    return NextResponse.json({ order: po });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Erreur" },
      { status: 400 },
    );
  }
}
