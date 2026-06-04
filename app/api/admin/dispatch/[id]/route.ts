/**
 * PATCH  /api/admin/dispatch/[id]  → édition
 * DELETE /api/admin/dispatch/[id]  → suppression
 */

import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/require-admin";
import { updateSlot, deleteSlot } from "@/lib/dispatch-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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
    const slot = await updateSlot(params.id, body as never);
    if (!slot) {
      return NextResponse.json({ error: "Introuvable" }, { status: 404 });
    }
    return NextResponse.json({ slot });
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
  await deleteSlot(params.id);
  return NextResponse.json({ ok: true });
}
