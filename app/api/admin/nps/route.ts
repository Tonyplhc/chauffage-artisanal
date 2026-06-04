/**
 * GET /api/admin/nps → stats + liste récente des enquêtes
 */

import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/require-admin";
import { listSurveys, computeNpsStats } from "@/lib/nps-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const auth = await requireAdminApi(req);
  if (!auth.ok) return auth.response;
  const surveys = await listSurveys();
  const stats = computeNpsStats(surveys);
  return NextResponse.json({ stats, asOf: new Date().toISOString() });
}
