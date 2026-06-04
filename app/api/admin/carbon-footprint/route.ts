/**
 * GET /api/admin/carbon-footprint → portfolio CO2 évité par les conversions
 */

import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/require-admin";
import { buildPortfolio } from "@/lib/carbon-footprint";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const auth = await requireAdminApi(req);
  if (!auth.ok) return auth.response;
  const portfolio = await buildPortfolio();
  return NextResponse.json(portfolio);
}
