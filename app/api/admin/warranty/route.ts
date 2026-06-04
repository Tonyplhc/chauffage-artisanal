/**
 * GET  /api/admin/warranty → liste + stats
 * POST /api/admin/warranty → nouvelle déclaration
 */

import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/require-admin";
import {
  listClaims,
  createClaim,
  getWarrantyStats,
} from "@/lib/warranty-store";
import { logActivity } from "@/lib/activity-log";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const auth = await requireAdminApi(req);
  if (!auth.ok) return auth.response;
  const [claims, stats] = await Promise.all([listClaims(), getWarrantyStats()]);
  return NextResponse.json({ claims, stats });
}

export async function POST(req: Request) {
  const auth = await requireAdminApi(req);
  if (!auth.ok) return auth.response;
  let body: Parameters<typeof createClaim>[0];
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON invalide" }, { status: 400 });
  }
  try {
    const claim = await createClaim(body);
    void logActivity(
      "admin.warranty_claim_created",
      `SAV créé : ${claim.number} (${claim.clientName})`,
      { meta: { id: claim.id, equipment: claim.equipmentDescription } },
    );
    return NextResponse.json({ claim });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Erreur" },
      { status: 400 },
    );
  }
}
