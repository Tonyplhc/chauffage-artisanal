/**
 * GET    /api/admin/maintenance/[id]          → détail
 * PATCH  /api/admin/maintenance/[id]          → édition
 * DELETE /api/admin/maintenance/[id]          → suppression
 * POST   /api/admin/maintenance/[id]/visit    → enregistre une visite (avance nextDueAt)
 */

import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/require-admin";
import {
  getContract,
  updateContract,
  deleteContract,
  recordVisit,
} from "@/lib/maintenance-contracts-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  req: Request,
  { params }: { params: { id: string } },
) {
  const auth = await requireAdminApi(req);
  if (!auth.ok) return auth.response;
  const contract = await getContract(params.id);
  if (!contract) {
    return NextResponse.json({ error: "Introuvable" }, { status: 404 });
  }
  return NextResponse.json({ contract });
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
  // Action spéciale : marquer visite faite via body.recordVisit = ISO
  if (typeof body.recordVisit === "string") {
    const contract = await recordVisit(params.id, body.recordVisit);
    if (!contract) {
      return NextResponse.json({ error: "Introuvable" }, { status: 404 });
    }
    return NextResponse.json({ contract });
  }
  if (body.recordVisit === true) {
    const contract = await recordVisit(params.id);
    if (!contract) {
      return NextResponse.json({ error: "Introuvable" }, { status: 404 });
    }
    return NextResponse.json({ contract });
  }
  try {
    const contract = await updateContract(params.id, body as never);
    if (!contract) {
      return NextResponse.json({ error: "Introuvable" }, { status: 404 });
    }
    return NextResponse.json({ contract });
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
  await deleteContract(params.id);
  return NextResponse.json({ ok: true });
}
