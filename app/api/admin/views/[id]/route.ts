/**
 * PATCH  /api/admin/views/[id] { name?, isShared?, state? } → édition (owner only)
 * DELETE /api/admin/views/[id]                              → suppression (owner only)
 */

import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/require-admin";
import {
  updateView,
  deleteView,
  getView,
} from "@/lib/saved-views-store";
import { logActivity } from "@/lib/activity-log";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } },
) {
  const auth = await requireAdminApi(req);
  if (!auth.ok) return auth.response;
  const email = (auth.session as { email?: string } | undefined)?.email;
  let body: { name?: string; isShared?: boolean; state?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON invalide" }, { status: 400 });
  }
  try {
    const v = await updateView(
      params.id,
      {
        name: body.name,
        isShared: body.isShared,
        state: body.state as never,
      },
      email,
    );
    if (!v) {
      return NextResponse.json({ error: "Vue introuvable" }, { status: 404 });
    }
    return NextResponse.json({ view: v });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Erreur" },
      { status: 403 },
    );
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } },
) {
  const auth = await requireAdminApi(req);
  if (!auth.ok) return auth.response;
  const email = (auth.session as { email?: string } | undefined)?.email;
  const before = await getView(params.id);
  try {
    const ok = await deleteView(params.id, email);
    if (!ok) {
      return NextResponse.json({ error: "Vue introuvable" }, { status: 404 });
    }
    void logActivity(
      "admin.view_deleted",
      `Vue supprimée : ${before?.name ?? params.id}`,
      { meta: { id: params.id } },
    );
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Erreur" },
      { status: 403 },
    );
  }
}
