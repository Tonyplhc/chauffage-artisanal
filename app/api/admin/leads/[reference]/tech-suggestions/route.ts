/**
 * GET /api/admin/leads/[ref]/tech-suggestions
 *   → liste des techniciens classés par score d'affinité avec l'intervention
 */

import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/require-admin";
import { getLead } from "@/lib/leads-store";
import { suggestTechniciansFor } from "@/lib/tech-routing";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  req: Request,
  { params }: { params: { reference: string } },
) {
  const auth = await requireAdminApi(req);
  if (!auth.ok) return auth.response;
  const lead = await getLead(params.reference);
  if (!lead) {
    return NextResponse.json({ error: "Lead introuvable" }, { status: 404 });
  }
  const suggestions = await suggestTechniciansFor(lead);
  return NextResponse.json({ suggestions: suggestions.slice(0, 10) });
}
