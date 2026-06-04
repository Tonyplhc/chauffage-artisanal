/**
 * GET  /api/admin/leads/[reference]/equipment        → liste des équipements
 * POST /api/admin/leads/[reference]/equipment         → création
 */

import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/require-admin";
import {
  listEquipment,
  createEquipment,
} from "@/lib/equipment-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  req: Request,
  { params }: { params: { reference: string } },
) {
  const auth = await requireAdminApi(req);
  if (!auth.ok) return auth.response;
  const equipment = await listEquipment({ leadReference: params.reference });
  return NextResponse.json({ equipment });
}

export async function POST(
  req: Request,
  { params }: { params: { reference: string } },
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
    const equipment = await createEquipment({
      ...body,
      leadReference: params.reference,
    } as never);
    return NextResponse.json({ equipment });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Erreur" },
      { status: 400 },
    );
  }
}
