/**
 * GET /api/admin/payments → liste globale + stats
 */

import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/require-admin";
import { listPayments, computeStats } from "@/lib/payments-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const auth = await requireAdminApi(req);
  if (!auth.ok) return auth.response;
  const [payments, stats] = await Promise.all([
    listPayments(),
    computeStats(),
  ]);
  return NextResponse.json({ payments, stats });
}
