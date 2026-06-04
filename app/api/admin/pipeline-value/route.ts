/**
 * GET /api/admin/pipeline-value → stats valeur + forecast pondéré.
 */

import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/require-admin";
import { listLeads } from "@/lib/leads-store";
import {
  computePipelineValue,
  STATUS_PROBABILITY,
  BUDGET_DEFAULTS,
} from "@/lib/pipeline-value";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const auth = await requireAdminApi(req);
  if (!auth.ok) return auth.response;

  const leads = await listLeads();
  const stats = computePipelineValue(leads);
  return NextResponse.json({
    stats,
    config: {
      statusProbability: STATUS_PROBABILITY,
      budgetDefaults: BUDGET_DEFAULTS,
    },
    asOf: new Date().toISOString(),
  });
}
