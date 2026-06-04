/**
 * GET /api/referral/[reference]?t=<token>
 *
 * Endpoint public — valide le token, incrémente le compteur de clicks,
 * retourne le nom abrégé du parrain pour personnaliser la page.
 */

import { NextResponse } from "next/server";
import { getLead } from "@/lib/leads-store";
import { verifyReferralToken } from "@/lib/referral-token";
import { recordClick } from "@/lib/referrals-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function abbreviate(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0) return "Un client";
  if (parts.length === 1) return parts[0];
  return `${parts[0]} ${parts[1][0].toUpperCase()}.`;
}

export async function GET(
  req: Request,
  { params }: { params: { reference: string } },
) {
  const url = new URL(req.url);
  const token = url.searchParams.get("t") ?? undefined;
  if (!verifyReferralToken(params.reference, token)) {
    return NextResponse.json({ error: "Lien invalide" }, { status: 401 });
  }
  const referrer = await getLead(params.reference);
  if (!referrer || referrer.status !== "converti") {
    return NextResponse.json(
      { error: "Parrain introuvable" },
      { status: 404 },
    );
  }
  await recordClick(params.reference);
  return NextResponse.json({
    referrerName: abbreviate(referrer.fullName),
  });
}
