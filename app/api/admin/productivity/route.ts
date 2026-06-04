/**
 * GET /api/admin/productivity?from=&to= → productivité par technicien
 */

import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/require-admin";
import { computeProductivity } from "@/lib/dispatch-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const auth = await requireAdminApi(req);
  if (!auth.ok) return auth.response;
  const url = new URL(req.url);
  const rows = await computeProductivity({
    from: url.searchParams.get("from") ?? "",
    to: url.searchParams.get("to") ?? "",
  });
  return NextResponse.json({ rows });
}
