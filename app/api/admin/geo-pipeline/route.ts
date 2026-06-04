/**
 * GET /api/admin/geo-pipeline → agrégation pipeline value par commune
 */

import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/require-admin";
import { computeGeoPipeline } from "@/lib/geo-pipeline";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const auth = await requireAdminApi(req);
  if (!auth.ok) return auth.response;
  const communes = await computeGeoPipeline();
  return NextResponse.json({ communes });
}
