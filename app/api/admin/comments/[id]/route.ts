/**
 * DELETE /api/admin/comments/[id]  → soft delete (auteur uniquement)
 */

import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/require-admin";
import { deleteComment, getComment } from "@/lib/comments-store";
import { logActivity } from "@/lib/activity-log";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } },
) {
  const auth = await requireAdminApi(req);
  if (!auth.ok) return auth.response;
  const email =
    (auth.session as { email?: string } | undefined)?.email ?? "admin";
  const before = await getComment(params.id);
  try {
    const c = await deleteComment(params.id, email);
    if (!c) {
      return NextResponse.json({ error: "Introuvable" }, { status: 404 });
    }
    void logActivity("lead.comment_deleted", `Commentaire supprimé`, {
      reference: before?.leadReference,
      meta: { id: c.id },
    });
    return NextResponse.json({ comment: c });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Erreur" },
      { status: 403 },
    );
  }
}
