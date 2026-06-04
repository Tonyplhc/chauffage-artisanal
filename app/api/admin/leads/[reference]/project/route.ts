/**
 * GET    /api/admin/leads/[reference]/project      → projet (auto-créé si absent)
 * PATCH  /api/admin/leads/[reference]/project      { milestones?, notesPublic?, ... }
 * DELETE /api/admin/leads/[reference]/project      → supprime le projet
 */

import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/require-admin";
import {
  ensureProject,
  updateProject,
  deleteProject,
} from "@/lib/projects-store";
import { getLead } from "@/lib/leads-store";
import { logActivity } from "@/lib/activity-log";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  req: Request,
  { params }: { params: { reference: string } },
) {
  const auth = await requireAdminApi(req);
  if (!auth.ok) return auth.response;
  const lead = await getLead(params.reference);
  if (!lead) {
    return NextResponse.json({ error: "Lead introuvable" }, { status: 404 });
  }
  const project = await ensureProject(params.reference);
  return NextResponse.json({ project });
}

export async function PATCH(
  req: Request,
  { params }: { params: { reference: string } },
) {
  const auth = await requireAdminApi(req);
  if (!auth.ok) return auth.response;
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON invalide" }, { status: 400 });
  }
  await ensureProject(params.reference);
  const project = await updateProject(params.reference, body as never);
  if (!project) {
    return NextResponse.json({ error: "Introuvable" }, { status: 404 });
  }
  void logActivity(
    "lead.notes_updated",
    `Suivi de chantier mis à jour`,
    { reference: params.reference, meta: { milestones: project.milestones.length } },
  );
  return NextResponse.json({ project });
}

export async function DELETE(
  req: Request,
  { params }: { params: { reference: string } },
) {
  const auth = await requireAdminApi(req);
  if (!auth.ok) return auth.response;
  await deleteProject(params.reference);
  return NextResponse.json({ ok: true });
}
