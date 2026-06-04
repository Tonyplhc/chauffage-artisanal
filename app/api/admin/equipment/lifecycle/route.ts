/**
 * GET /api/admin/equipment/lifecycle → assessments triés par opportunité commerciale
 */

import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/require-admin";
import {
  listAssessments,
  computeStats,
} from "@/lib/equipment-lifecycle";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const auth = await requireAdminApi(req);
  if (!auth.ok) return auth.response;
  const [assessments, stats] = await Promise.all([
    listAssessments(),
    computeStats(),
  ]);
  return NextResponse.json({ assessments, stats });
}
