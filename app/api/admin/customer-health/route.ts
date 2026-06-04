/**
 * GET /api/admin/customer-health → tous les clients convertis avec leur score
 */

import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/require-admin";
import {
  assessAllClients,
  computeStats,
} from "@/lib/customer-health";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const auth = await requireAdminApi(req);
  if (!auth.ok) return auth.response;
  const [assessments, stats] = await Promise.all([
    assessAllClients(),
    computeStats(),
  ]);
  return NextResponse.json({ assessments, stats });
}
