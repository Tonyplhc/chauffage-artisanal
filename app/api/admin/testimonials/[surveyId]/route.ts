/**
 * POST   /api/admin/testimonials/[surveyId] { displayName, commune? } → approuver
 * DELETE /api/admin/testimonials/[surveyId] → désapprouver
 */

import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/require-admin";
import { approveSurvey, unapprove } from "@/lib/testimonials-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(
  req: Request,
  { params }: { params: { surveyId: string } },
) {
  const auth = await requireAdminApi(req);
  if (!auth.ok) return auth.response;
  const email = (auth.session as { email?: string } | undefined)?.email;
  let body: { displayName?: string; commune?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON invalide" }, { status: 400 });
  }
  if (!body.displayName) {
    return NextResponse.json(
      { error: "displayName requis" },
      { status: 400 },
    );
  }
  try {
    const a = await approveSurvey({
      surveyId: params.surveyId,
      displayName: body.displayName,
      commune: body.commune,
      approvedBy: email,
    });
    return NextResponse.json({ approval: a });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Erreur" },
      { status: 400 },
    );
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { surveyId: string } },
) {
  const auth = await requireAdminApi(req);
  if (!auth.ok) return auth.response;
  const ok = await unapprove(params.surveyId);
  if (!ok) {
    return NextResponse.json({ error: "Introuvable" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
