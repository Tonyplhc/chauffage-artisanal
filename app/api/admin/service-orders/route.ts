import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/require-admin";
import {
  listServiceOrders,
  createServiceOrder,
} from "@/lib/service-orders-store";
import { logActivity } from "@/lib/activity-log";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const auth = await requireAdminApi(req);
  if (!auth.ok) return auth.response;
  const orders = await listServiceOrders();
  return NextResponse.json({ orders });
}

export async function POST(req: Request) {
  const auth = await requireAdminApi(req);
  if (!auth.ok) return auth.response;
  let body: Parameters<typeof createServiceOrder>[0];
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON invalide" }, { status: 400 });
  }
  try {
    const order = await createServiceOrder(body);
    void logActivity(
      "admin.service_order_created",
      `BI créé : ${order.number} (${order.clientName})`,
      { meta: { id: order.id } },
    );
    return NextResponse.json({ order });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Erreur" },
      { status: 400 },
    );
  }
}
