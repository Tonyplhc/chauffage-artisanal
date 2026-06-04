/**
 * GET /api/admin/leads/[reference]/tags    → liste des tagIds du lead
 * PUT /api/admin/leads/[reference]/tags    { tagIds: string[] } → remplace l'assignation
 */

import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/require-admin";
import { getLeadTags, setLeadTags } from "@/lib/tags-store";
import { logActivity } from "@/lib/activity-log";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  req: Request,
  { params }: { params: { reference: string } },
) {
  const auth = await requireAdminApi(req);
  if (!auth.ok) return auth.response;
  const tagIds = await getLeadTags(params.reference);
  return NextResponse.json({ tagIds });
}

export async function PUT(
  req: Request,
  { params }: { params: { reference: string } },
) {
  const auth = await requireAdminApi(req);
  if (!auth.ok) return auth.response;
  let body: { tagIds?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON invalide" }, { status: 400 });
  }
  if (!Array.isArray(body.tagIds)) {
    return NextResponse.json(
      { error: "tagIds (array) requis" },
      { status: 400 },
    );
  }
  const ids = body.tagIds.filter((t): t is string => typeof t === "string");
  const result = await setLeadTags(params.reference, ids);
  if (result === null) {
    return NextResponse.json({ error: "Lead introuvable" }, { status: 404 });
  }
  void logActivity(
    "lead.tags_updated",
    `Tags mis à jour (${result.length})`,
    { reference: params.reference, meta: { tagIds: result } },
  );
  return NextResponse.json({ tagIds: result });
}
