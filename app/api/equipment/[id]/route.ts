/**
 * GET /api/equipment/[id]?t=<token>
 *
 * Endpoint public — accès lecture seule à la fiche équipement, validé par
 * token HMAC. Utilisé par la page publique scan QR.
 */

import { NextResponse } from "next/server";
import { getEquipment } from "@/lib/equipment-store";
import { verifyEquipmentToken } from "@/lib/equipment-token";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  req: Request,
  { params }: { params: { id: string } },
) {
  const url = new URL(req.url);
  const token = url.searchParams.get("t") ?? undefined;
  if (!verifyEquipmentToken(params.id, token)) {
    return NextResponse.json({ error: "Token invalide" }, { status: 401 });
  }
  const equipment = await getEquipment(params.id);
  if (!equipment) {
    return NextResponse.json({ error: "Introuvable" }, { status: 404 });
  }
  // On ne retourne pas leadReference (PII potentielle) — juste les champs
  // techniques de la fiche.
  return NextResponse.json({
    equipment: {
      id: equipment.id,
      type: equipment.type,
      brand: equipment.brand,
      model: equipment.model,
      serialNumber: equipment.serialNumber,
      power: equipment.power,
      installedAt: equipment.installedAt,
      warrantyExpiresAt: equipment.warrantyExpiresAt,
      location: equipment.location,
      notes: equipment.notes,
      status: equipment.status,
    },
  });
}
