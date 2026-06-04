/**
 * GET    /api/admin/leads/[reference]/report      → rapport (auto-créé)
 * PATCH  /api/admin/leads/[reference]/report      → édition titre/résumé/publication
 * POST   /api/admin/leads/[reference]/report      { kind, caption, dataUrl } → ajout photo
 */

import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/require-admin";
import {
  ensureReport,
  updateReport,
  addPhoto,
} from "@/lib/site-reports-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  req: Request,
  { params }: { params: { reference: string } },
) {
  const auth = await requireAdminApi(req);
  if (!auth.ok) return auth.response;
  const report = await ensureReport(params.reference);
  return NextResponse.json({ report });
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
  await ensureReport(params.reference);
  const report = await updateReport(params.reference, body as never);
  return NextResponse.json({ report });
}

export async function POST(
  req: Request,
  { params }: { params: { reference: string } },
) {
  const auth = await requireAdminApi(req);
  if (!auth.ok) return auth.response;
  let body: { kind?: string; caption?: string; dataUrl?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON invalide" }, { status: 400 });
  }
  const allowedKinds = ["before", "in_progress", "after", "detail"];
  if (!body.kind || !allowedKinds.includes(body.kind)) {
    return NextResponse.json({ error: "kind invalide" }, { status: 400 });
  }
  if (!body.dataUrl) {
    return NextResponse.json({ error: "dataUrl requise" }, { status: 400 });
  }
  await ensureReport(params.reference);
  try {
    const report = await addPhoto(params.reference, {
      kind: body.kind as never,
      caption: body.caption,
      dataUrl: body.dataUrl,
    });
    return NextResponse.json({ report });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Erreur" },
      { status: 400 },
    );
  }
}
