/**
 * Endpoint public lecture seule pour récupérer le résumé d'un paiement démo.
 *
 * Pas de signature/token : les IDs sont aléatoires longue (14 hex) et la
 * page démo ne déclenche aucune action sensible.
 */

import { NextResponse } from "next/server";
import { getPayment } from "@/lib/payments-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  req: Request,
  { params }: { params: { id: string } },
) {
  const p = await getPayment(params.id);
  if (!p) {
    return NextResponse.json({ error: "Introuvable" }, { status: 404 });
  }
  return NextResponse.json({
    payment: {
      id: p.id,
      leadReference: p.leadReference,
      amountCents: p.amountCents,
      description: p.description,
      status: p.status,
      mode: p.mode,
    },
  });
}
