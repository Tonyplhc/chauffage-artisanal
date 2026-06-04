/**
 * GET  /api/admin/maintenance/[id]/visits → liste des visites du contrat
 * POST /api/admin/maintenance/[id]/visits → création d'une visite (draft)
 */

import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/require-admin";
import { getContract } from "@/lib/maintenance-contracts-store";
import {
  listVisits,
  createVisit,
} from "@/lib/maintenance-visits-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  req: Request,
  { params }: { params: { id: string } },
) {
  const auth = await requireAdminApi(req);
  if (!auth.ok) return auth.response;
  const visits = await listVisits({ contractId: params.id });
  return NextResponse.json({ visits });
}

export async function POST(
  req: Request,
  { params }: { params: { id: string } },
) {
  const auth = await requireAdminApi(req);
  if (!auth.ok) return auth.response;
  const email = (auth.session as { email?: string } | undefined)?.email;
  const contract = await getContract(params.id);
  if (!contract) {
    return NextResponse.json(
      { error: "Contrat introuvable" },
      { status: 404 },
    );
  }
  let body: { equipmentId?: string; visitedAt?: string } = {};
  try {
    body = await req.json();
  } catch {
    // ok body absent
  }
  const visit = await createVisit({
    contractId: contract.id,
    leadReference: contract.leadReference,
    equipmentId: body.equipmentId,
    equipmentType: contract.type,
    technicianEmail: email,
    visitedAt: body.visitedAt,
  });
  return NextResponse.json({ visit });
}
