/**
 * GET /api/admin/loyalty → liste comptes + stats
 */

import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/require-admin";
import { listAccounts, computeStats } from "@/lib/loyalty-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const auth = await requireAdminApi(req);
  if (!auth.ok) return auth.response;
  const [accounts, stats] = await Promise.all([listAccounts(), computeStats()]);
  return NextResponse.json({ accounts, stats });
}
