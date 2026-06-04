/**
 * GET /api/admin/leads/[reference]/referral-link → URL publique du parrain.
 *
 * Renvoie un objet avec le link complet + stats actuelles.
 */

import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/require-admin";
import { getLead } from "@/lib/leads-store";
import { makeReferralToken } from "@/lib/referral-token";
import {
  ensureReferralEntry,
  getReferralDetailFor,
} from "@/lib/referrals-store";

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
  if (lead.status !== "converti") {
    return NextResponse.json(
      {
        error: "Le lead doit être converti pour générer un lien de parrainage",
      },
      { status: 400 },
    );
  }
  await ensureReferralEntry(lead.reference);
  const token = makeReferralToken(lead.reference);
  const baseUrl = process.env.PUBLIC_URL ?? "http://localhost:3020";
  const url = `${baseUrl}/parrainage/${lead.reference}?t=${token}`;
  const summary = await getReferralDetailFor(lead.reference);
  return NextResponse.json({
    url,
    token,
    referrer: {
      reference: lead.reference,
      fullName: lead.fullName,
    },
    stats: summary?.stats,
    brought: summary?.broughtLeads.length ?? 0,
    converted: summary?.convertedBrought ?? 0,
  });
}
