/**
 * GET /api/admin/rgpd-report → rapport conformité RGPD complet.
 */

import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/require-admin";
import { computeRgpdReport } from "@/lib/rgpd-compliance";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const auth = await requireAdminApi(req);
  if (!auth.ok) return auth.response;
  const report = await computeRgpdReport();
  return NextResponse.json({ report });
}
