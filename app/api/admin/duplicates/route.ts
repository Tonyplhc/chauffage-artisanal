/**
 * GET /api/admin/duplicates → tous les groupes de doublons détectés.
 */

import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/require-admin";
import { listLeads } from "@/lib/leads-store";
import { findAllDuplicateGroups } from "@/lib/duplicate-detection";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const auth = await requireAdminApi(req);
  if (!auth.ok) return auth.response;
  const leads = await listLeads();
  const groups = await findAllDuplicateGroups(leads);
  return NextResponse.json({
    groups: groups.map((g) => ({
      key: g.key,
      reason: g.reason,
      value: g.value,
      leads: g.leads.map((l) => ({
        reference: l.reference,
        fullName: l.fullName,
        email: l.email,
        phone: l.phone,
        commune: l.commune,
        services: l.services,
        status: l.status,
        submittedAt: l.submittedAt,
        level: l.level,
        score: l.score,
      })),
    })),
    totalGroups: groups.length,
  });
}
