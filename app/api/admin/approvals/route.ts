/**
 * GET /api/admin/approvals?status=pending → liste des demandes (toutes par défaut)
 */

import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/require-admin";
import {
  listApprovals,
  computeStats,
  APPROVAL_THRESHOLD_EUR,
  type ApprovalStatus,
} from "@/lib/quote-approvals-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const auth = await requireAdminApi(req);
  if (!auth.ok) return auth.response;
  const url = new URL(req.url);
  const status = url.searchParams.get("status") as ApprovalStatus | null;
  const [approvals, stats] = await Promise.all([
    listApprovals({ status: status ?? undefined }),
    computeStats(),
  ]);
  return NextResponse.json({
    approvals,
    stats,
    threshold: APPROVAL_THRESHOLD_EUR,
  });
}
