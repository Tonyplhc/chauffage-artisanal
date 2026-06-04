/**
 * GET    /api/admin/snippets/[id]                            → détail (avec usage)
 * PATCH  /api/admin/snippets/[id] { title?, category?, content? } → édition
 * DELETE /api/admin/snippets/[id]                            → suppression
 * POST   /api/admin/snippets/[id]/use → +1 sur usageCount (tracking)
 *   (le tracking d'usage est sur la route GET via header X-Track-Use=1 pour
 *    rester simple — voir /use sub-route ci-dessous si besoin)
 */

import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/require-admin";
import {
  getSnippet,
  updateSnippet,
  deleteSnippet,
  recordUsage,
} from "@/lib/snippets-store";
import { logActivity } from "@/lib/activity-log";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  req: Request,
  { params }: { params: { id: string } },
) {
  const auth = await requireAdminApi(req);
  if (!auth.ok) return auth.response;
  const snip = await getSnippet(params.id);
  if (!snip) {
    return NextResponse.json({ error: "Introuvable" }, { status: 404 });
  }
  // Tracking optionnel via header
  if (req.headers.get("x-track-use") === "1") {
    void recordUsage(params.id);
  }
  return NextResponse.json({ snippet: snip });
}

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } },
) {
  const auth = await requireAdminApi(req);
  if (!auth.ok) return auth.response;
  let body: { title?: string; category?: string; content?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON invalide" }, { status: 400 });
  }
  try {
    const snip = await updateSnippet(params.id, body);
    if (!snip) {
      return NextResponse.json({ error: "Introuvable" }, { status: 404 });
    }
    void logActivity(
      "admin.snippet_updated",
      `Snippet mis à jour : ${snip.title}`,
      { meta: { id: snip.id } },
    );
    return NextResponse.json({ snippet: snip });
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
  const before = await getSnippet(params.id);
  const ok = await deleteSnippet(params.id);
  if (!ok) {
    return NextResponse.json({ error: "Introuvable" }, { status: 404 });
  }
  void logActivity(
    "admin.snippet_deleted",
    `Snippet supprimé : ${before?.title ?? params.id}`,
    { meta: { id: params.id } },
  );
  return NextResponse.json({ ok: true });
}
