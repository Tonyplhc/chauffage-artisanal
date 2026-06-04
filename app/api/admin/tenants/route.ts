/**
 * GET  /api/admin/tenants → liste des tenants white-label
 * POST /api/admin/tenants → création d'un tenant
 */

import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/require-admin";
import { listTenants, createTenant } from "@/lib/tenants-store";
import { logActivity } from "@/lib/activity-log";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const auth = await requireAdminApi(req);
  if (!auth.ok) return auth.response;
  const tenants = await listTenants();
  return NextResponse.json({ tenants });
}

export async function POST(req: Request) {
  const auth = await requireAdminApi(req);
  if (!auth.ok) return auth.response;
  let body: {
    name?: string;
    legalName?: string;
    description?: string;
    branding?: {
      primaryColor?: string;
      secondaryColor?: string;
      accentColor?: string;
      logoUrl?: string;
    };
    legal?: {
      address?: string;
      phone?: string;
      email?: string;
      vatNumber?: string;
      rcsNumber?: string;
      ibanMasked?: string;
      website?: string;
    };
    isDefault?: boolean;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON invalide" }, { status: 400 });
  }
  if (!body.name?.trim()) {
    return NextResponse.json({ error: "Nom requis" }, { status: 400 });
  }
  try {
    const tenant = await createTenant({
      name: body.name,
      legalName: body.legalName,
      description: body.description,
      branding: body.branding,
      legal: body.legal,
      isDefault: body.isDefault,
    });
    void logActivity(
      "admin.tenant_created",
      `Marque blanche créée : ${tenant.name}`,
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
