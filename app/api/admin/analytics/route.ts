import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/require-admin";
import { computeAggregates } from "@/lib/analytics-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const auth = await requireAdminApi(req);
  if (!auth.ok) return auth.response;
  const aggregates = await computeAggregates();
  return NextResponse.json(aggregates);
}
