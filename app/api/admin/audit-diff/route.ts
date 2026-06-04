/**
 * GET /api/admin/audit-diff?entityId=&entityType=&actorEmail=&limit=
 *
 * Liste les diffs avec stats agrégées. Filtre principal : par entityId pour
 * la revue d'un lead spécifique.
 */

import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/require-admin";
import { listDiffs, computeStats } from "@/lib/audit-diff-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const auth = await requireAdminApi(req);
  if (!auth.ok) return auth.response;
  const url = new URL(req.url);
  const entityId = url.searchParams.get("entityId") ?? undefined;
  const entityType = url.searchParams.get("entityType") ?? undefined;
  const actorEmail = url.searchParams.get("actorEmail") ?? undefined;
  const field = url.searchParams.get("field") ?? undefined;
  const limit = url.searchParams.get("limit")
    ? Number(url.searchParams.get("limit"))
    : 200;
  const [diffs, stats] = await Promise.all([
    listDiffs({ entityId, entityType, actorEmail, field, limit }),
    computeStats(),
  ]);
  return NextResponse.json({ diffs, stats });
}
