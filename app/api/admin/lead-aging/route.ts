/**
 * GET /api/admin/lead-aging → durées moyennes par transition pipeline
 */

import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/require-admin";
import { computeAging } from "@/lib/lead-aging";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const auth = await requireAdminApi(req);
  if (!auth.ok) return auth.response;
  const aging = await computeAging();
  return NextResponse.json(aging);
}
