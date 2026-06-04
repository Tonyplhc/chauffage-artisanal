/**
 * GET    /api/admin/safety/[id]    → completion + template + isPassing
 * PATCH  /api/admin/safety/[id]    → mise à jour résultats / signature
 * DELETE /api/admin/safety/[id]
 */

import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/require-admin";
import {
  getCompletion,
  updateCompletion,
  deleteCompletion,
  getTemplate,
  isCompletionPassing,
} from "@/lib/safety-checklists-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  req: Request,
  { params }: { params: { id: string } },
) {
  const auth = await requireAdminApi(req);
  if (!auth.ok) return auth.response;
  const completion = await getCompletion(params.id);
  if (!completion) {
    return NextResponse.json({ error: "Introuvable" }, { status: 404 });
  }
  const template = getTemplate(completion.templateId);
  return NextResponse.json({
    completion,
    template,
    passing: template ? isCompletionPassing(template, completion) : false,
  });
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
  const completion = await updateCompletion(params.id, body as never);
  if (!completion) {
    return NextResponse.json({ error: "Introuvable" }, { status: 404 });
  }
  const template = getTemplate(completion.templateId);
  return NextResponse.json({
    completion,
    template,
    passing: template ? isCompletionPassing(template, completion) : false,
  });
}

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } },
) {
  const auth = await requireAdminApi(req);
  if (!auth.ok) return auth.response;
  await deleteCompletion(params.id);
  return NextResponse.json({ ok: true });
}
