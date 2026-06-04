/**
 * GET    /api/admin/tenants/[id] → détail
 * PATCH  /api/admin/tenants/[id] → mise à jour partielle
 * DELETE /api/admin/tenants/[id] → suppression (un autre est promu default le cas échéant)
 */

import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/require-admin";
import {
  getTenant,
  updateTenant,
  deleteTenant,
} from "@/lib/tenants-store";
import { logActivity } from "@/lib/activity-log";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  req: Request,
  { params }: { params: { id: string } },
) {
  const auth = await requireAdminApi(req);
  if (!auth.ok) return auth.response;
  const tenant = await getTenant(params.id);
  if (!tenant) {
    return NextResponse.json({ error: "Marque introuvable" }, { status: 404 });
  }
  return NextResponse.json({ tenant });
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
  try {
    const tenant = await updateTenant(params.id, body);
    if (!tenant) {
      return NextResponse.json(
        { error: "Marque introuvable" },
        { status: 404 },
      );
    }
    void logActivity(
      "admin.tenant_updated",
      `Marque blanche mise à jour : ${tenant.name}`,
      { meta: { id: tenant.id, slug: tenant.slug } },
    );
    return NextResponse.json({ tenant });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Erreur" },
      { status: 400 },
    );
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } },
) {
  const auth = await requireAdminApi(req);
  if (!auth.ok) return auth.response;
  const before = await getTenant(params.id);
  const ok = await deleteTenant(params.id);
  if (!ok) {
    return NextResponse.json({ error: "Marque introuvable" }, { status: 404 });
  }
  void logActivity(
    "admin.tenant_deleted",
    `Marque blanche supprimée : ${before?.name ?? params.id}`,
    { meta: { id: params.id } },
  );
  return NextResponse.json({ ok: true });
}
