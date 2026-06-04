/**
 * GET /api/admin/sources → stats agrégées par source d'acquisition.
 */

import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/require-admin";
import { listLeads } from "@/lib/leads-store";
import { computeSourceStats } from "@/lib/source-tracking";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const auth = await requireAdminApi(req);
  if (!auth.ok) return auth.response;
  const leads = await listLeads();
  const stats = computeSourceStats(leads);
  return NextResponse.json({ stats, asOf: new Date().toISOString() });
}
