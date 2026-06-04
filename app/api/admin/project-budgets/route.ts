/**
 * GET /api/admin/project-budgets → suivi budgétaire par projet
 */

import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/require-admin";
import { listBudgets, computeStats } from "@/lib/project-budget";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const auth = await requireAdminApi(req);
  if (!auth.ok) return auth.response;
  const [budgets, stats] = await Promise.all([listBudgets(), computeStats()]);
  return NextResponse.json({ budgets, stats });
}
