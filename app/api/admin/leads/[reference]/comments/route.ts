/**
 * GET  /api/admin/leads/[reference]/comments      → fil de discussion (ordre chrono asc)
 * POST /api/admin/leads/[reference]/comments      { body } → ajout
 */

import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/require-admin";
import {
  listCommentsForLead,
  createComment,
} from "@/lib/comments-store";
import { logActivity } from "@/lib/activity-log";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  req: Request,
  { params }: { params: { reference: string } },
) {
  const auth = await requireAdminApi(req);
  if (!auth.ok) return auth.response;
  const comments = await listCommentsForLead(params.reference);
  return NextResponse.json({ comments });
}

export async function POST(
  req: Request,
  { params }: { params: { reference: string } },
) {
  const auth = await requireAdminApi(req);
  if (!auth.ok) return auth.response;
  const email =
    (auth.session as { email?: string } | undefined)?.email ?? "admin";
  let body: { body?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON invalide" }, { status: 400 });
  }
  try {
    const c = await createComment({
      leadReference: params.reference,
      authorEmail: email,
      body: body.body ?? "",
    });
    void logActivity(
      "lead.comment_added",
      c.mentions.length > 0
        ? `Commentaire de ${email} (${c.mentions.length} @mention${c.mentions.length > 1 ? "s" : ""})`
        : `Commentaire de ${email}`,
      {
        reference: params.reference,
        meta: { id: c.id, mentions: c.mentions, preview: c.body.slice(0, 120) },
      },
    );
    return NextResponse.json({ comment: c });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Erreur" },
      { status: 400 },
    );
  }
}
