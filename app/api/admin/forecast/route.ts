/**
 * GET /api/admin/forecast?months=6&lookback=24
 *   → projection saisonnière sur N mois.
 */

import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/require-admin";
import { computeSeasonalForecast } from "@/lib/seasonal-forecast";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const auth = await requireAdminApi(req);
  if (!auth.ok) return auth.response;
  const url = new URL(req.url);
  const months = Number(url.searchParams.get("months") ?? "6");
  const lookback = Number(url.searchParams.get("lookback") ?? "24");
  const report = await computeSeasonalForecast(months, lookback);
  return NextResponse.json({ report });
}
