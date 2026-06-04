/**
 * GET /api/admin/heatmap → matrice 7×24 des soumissions de leads.
 */

import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/require-admin";
import { listLeads } from "@/lib/leads-store";
import { computeHeatmap } from "@/lib/lead-heatmap";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const auth = await requireAdminApi(req);
  if (!auth.ok) return auth.response;
  const leads = await listLeads();
  const heatmap = computeHeatmap(leads);
  return NextResponse.json({ heatmap });
}
