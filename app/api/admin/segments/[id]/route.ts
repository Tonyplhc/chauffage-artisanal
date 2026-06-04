/**
 * GET    /api/admin/segments/[id]                 → segment + members (lead summaries)
 * PATCH  /api/admin/segments/[id] { name?, query?, description?, isShared? }
 * DELETE /api/admin/segments/[id]
 */

import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/require-admin";
import {
  evaluateSegment,
  updateSegment,
  deleteSegment,
  getSegment,
} from "@/lib/segments-store";
import { logActivity } from "@/lib/activity-log";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  req: Request,
  { params }: { params: { id: string } },
) {
  const auth = await requireAdminApi(req);
  if (!auth.ok) return auth.response;
  const email = (auth.session as { email?: string } | undefined)?.email;
  const evaluation = await evaluateSegment(params.id, {
    currentUserEmail: email,
  });
  if (!evaluation) {
    return NextResponse.json({ error: "Segment introuvable" }, { status: 404 });
  }
  return NextResponse.json({
    segment: evaluation.segment,
    members: evaluation.members.map((l) => ({
      reference: l.reference,
      fullName: l.fullName,
      email: l.email,
      commune: l.commune,
      services: l.services,
      status: l.status,
      level: l.level,
      score: l.score,
      submittedAt: l.submittedAt,
    })),
    count: evaluation.members.length,
  });
}

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } },
) {
  const auth = await requireAdminApi(req);
  if (!auth.ok) return auth.response;
  const email = (auth.session as { email?: string } | undefined)?.email;
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON invalide" }, { status: 400 });
  }
  try {
    const seg = await updateSegment(params.id, body as never, email);
    if (!seg) {
      return NextResponse.json({ error: "Introuvable" }, { status: 404 });
    }
    return NextResponse.json({ segment: seg });
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
  const before = await getSegment(params.id);
  try {
    const ok = await deleteSegment(params.id, email);
    if (!ok) {
      return NextResponse.json({ error: "Introuvable" }, { status: 404 });
    }
    void logActivity(
      "admin.view_deleted",
      `Segment supprimé : ${before?.name ?? params.id}`,
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
