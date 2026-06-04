/**
 * GET /api/admin/sla → stats SLA + leads à risque.
 *
 * Lecture seule, recalculé à la demande depuis les leads en mémoire.
 */

import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/require-admin";
import { listLeads } from "@/lib/leads-store";
import { computeSlaStats, DEFAULT_SLA_TARGETS } from "@/lib/sla-tracker";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const auth = await requireAdminApi(req);
  if (!auth.ok) return auth.response;

  const leads = await listLeads();
  const stats = computeSlaStats(leads);

  return NextResponse.json({
    stats,
    targets: DEFAULT_SLA_TARGETS,
    asOf: new Date().toISOString(),
  });
}
