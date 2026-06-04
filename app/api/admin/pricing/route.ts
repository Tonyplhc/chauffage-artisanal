/**
 * GET /api/admin/pricing → segments + outliers
 */

import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/require-admin";
import { computePricing } from "@/lib/pricing-intelligence";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const auth = await requireAdminApi(req);
  if (!auth.ok) return auth.response;
  const report = await computePricing();
  return NextResponse.json(report);
}
