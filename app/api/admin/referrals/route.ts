/**
 * GET /api/admin/referrals → liste des parrains avec stats.
 */

import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/require-admin";
import { listReferralSummaries } from "@/lib/referrals-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const auth = await requireAdminApi(req);
  if (!auth.ok) return auth.response;
  const summaries = await listReferralSummaries();
  return NextResponse.json({
    referrals: summaries.map((r) => ({
      referrer: {
        reference: r.referrer.reference,
        fullName: r.referrer.fullName,
        commune: r.referrer.commune,
        status: r.referrer.status,
        submittedAt: r.referrer.submittedAt,
      },
      stats: r.stats,
      brought: r.broughtLeads.length,
      converted: r.convertedBrought,
      broughtLeads: r.broughtLeads.map((l) => ({
        reference: l.reference,
        fullName: l.fullName,
        status: l.status,
        submittedAt: l.submittedAt,
      })),
    })),
  });
}
