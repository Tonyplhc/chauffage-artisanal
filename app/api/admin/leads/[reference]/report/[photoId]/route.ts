/**
 * PATCH  /api/admin/leads/[reference]/report/[photoId] { caption } → édit caption
 * DELETE /api/admin/leads/[reference]/report/[photoId]            → suppression
 */

import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/require-admin";
import {
  removePhoto,
  updatePhotoCaption,
} from "@/lib/site-reports-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PATCH(
  req: Request,
  { params }: { params: { reference: string; photoId: string } },
) {
  const auth = await requireAdminApi(req);
  if (!auth.ok) return auth.response;
  let body: { caption?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON invalide" }, { status: 400 });
  }
  const report = await updatePhotoCaption(
    params.reference,
    params.photoId,
    body.caption ?? "",
  );
  if (!report)
    return NextResponse.json({ error: "Introuvable" }, { status: 404 });
  return NextResponse.json({ report });
}

export async function DELETE(
  req: Request,
  { params }: { params: { reference: string; photoId: string } },
) {
  const auth = await requireAdminApi(req);
  if (!auth.ok) return auth.response;
  const report = await removePhoto(params.reference, params.photoId);
  return NextResponse.json({ report });
}
