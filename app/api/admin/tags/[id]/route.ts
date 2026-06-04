/**
 * PATCH /api/admin/tags/[id]  { label?, color? } → mise à jour
 * DELETE /api/admin/tags/[id]                    → suppression du dictionnaire
 *   (les références dans lead.metadata.tags restent — orphelines silencieuses)
 */

import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/require-admin";
import { updateTag, deleteTag, getTag } from "@/lib/tags-store";
import { logActivity } from "@/lib/activity-log";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } },
) {
  const auth = await requireAdminApi(req);
  if (!auth.ok) return auth.response;
  let body: { label?: string; color?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON invalide" }, { status: 400 });
  }
  try {
    const tag = await updateTag(params.id, body);
    if (!tag) {
      return NextResponse.json({ error: "Tag introuvable" }, { status: 404 });
    }
    void logActivity("admin.tag_updated", `Tag mis à jour : ${tag.label}`, {
      meta: { id: tag.id },
    });
    return NextResponse.json({ tag });
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
  const before = await getTag(params.id);
  const ok = await deleteTag(params.id);
  if (!ok) {
    return NextResponse.json({ error: "Tag introuvable" }, { status: 404 });
  }
  void logActivity(
    "admin.tag_deleted",
    `Tag supprimé : ${before?.label ?? params.id}`,
    { meta: { id: params.id } },
  );
  return NextResponse.json({ ok: true });
}
