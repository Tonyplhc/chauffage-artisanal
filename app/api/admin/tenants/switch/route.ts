/**
 * POST /api/admin/tenants/switch { id }
 *   → bascule du cookie `ca-tenant` qui désigne le tenant actif pour la session admin.
 *
 * Cookie scope : admin uniquement. Les pages publiques utilisent getDefaultTenant() en V1.
 */

import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/require-admin";
import { getTenant } from "@/lib/tenants-store";
import { logActivity } from "@/lib/activity-log";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Nommée localement (les routes Next.js ne peuvent exporter que les handlers HTTP).
const TENANT_COOKIE = "ca-tenant";

export async function POST(req: Request) {
  const auth = await requireAdminApi(req);
  if (!auth.ok) return auth.response;
  let body: { id?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON invalide" }, { status: 400 });
  }
  if (!body.id) {
    return NextResponse.json({ error: "id requis" }, { status: 400 });
  }
  const tenant = await getTenant(body.id);
  if (!tenant) {
    return NextResponse.json({ error: "Marque introuvable" }, { status: 404 });
  }
  const res = NextResponse.json({ ok: true, tenant });
  res.cookies.set(TENANT_COOKIE, tenant.id, {
    httpOnly: false, // visible côté client pour affichage badge
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  void logActivity(
    "admin.tenant_switched",
    `Tenant actif : ${tenant.name}`,
    { meta: { id: tenant.id, slug: tenant.slug } },
  );
  return res;
}
