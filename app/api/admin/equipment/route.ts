/**
 * GET /api/admin/equipment → liste de tous les équipements installés.
 *
 * Avant ce fichier, seules /api/admin/equipment/[id] et /lifecycle
 * existaient — pas de liste. La page /admin/equipment attend cet endpoint.
 */

import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/require-admin";
import { listEquipment } from "@/lib/equipment-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const auth = await requireAdminApi(req);
  if (!auth.ok) return auth.response;
  const equipment = await listEquipment({});
  return NextResponse.json({ equipment });
}
