/**
 * GET    /api/admin/inventory/[id]      → détail + 20 mouvements récents
 * PATCH  /api/admin/inventory/[id]      → édition champs
 * DELETE /api/admin/inventory/[id]      → suppression (mouvements conservés)
 */

import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/require-admin";
import {
  getItem,
  updateItem,
  deleteItem,
  listMovements,
} from "@/lib/inventory-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  req: Request,
  { params }: { params: { id: string } },
) {
  const auth = await requireAdminApi(req);
  if (!auth.ok) return auth.response;
  const item = await getItem(params.id);
  if (!item) {
    return NextResponse.json({ error: "Introuvable" }, { status: 404 });
  }
  const movements = await listMovements({ itemId: params.id, limit: 20 });
  return NextResponse.json({ item, movements });
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
    const item = await updateItem(params.id, body as never);
    if (!item) {
      return NextResponse.json({ error: "Introuvable" }, { status: 404 });
    }
    return NextResponse.json({ item });
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
  await deleteItem(params.id);
  return NextResponse.json({ ok: true });
}
