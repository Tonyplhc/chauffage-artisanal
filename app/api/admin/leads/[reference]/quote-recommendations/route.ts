/**
 * GET /api/admin/leads/[ref]/quote-recommendations
 *   → items suggérés pour le devis basés sur l'historique des conversions
 *     de leads similaires.
 */

import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/require-admin";
import { getLead } from "@/lib/leads-store";
import { recommendItemsFor } from "@/lib/quote-recommendations";

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
  const recommendations = await recommendItemsFor(lead, 8);
  return NextResponse.json({ recommendations });
}
