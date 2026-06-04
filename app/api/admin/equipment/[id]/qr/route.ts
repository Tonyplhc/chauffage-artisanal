/**
 * GET /api/admin/equipment/[id]/qr → URL publique signée + URL image QR.
 *
 * En V1 on délègue le rendu à un service externe (api.qrserver.com) pour
 * éviter une dépendance. À remplacer par un encoder interne en prod réelle
 * pour éliminer la dépendance et la fuite éventuelle d'URL.
 */

import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/require-admin";
import { getEquipment } from "@/lib/equipment-store";
import { makeEquipmentToken } from "@/lib/equipment-token";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  req: Request,
  { params }: { params: { id: string } },
) {
  const auth = await requireAdminApi(req);
  if (!auth.ok) return auth.response;
  const equipment = await getEquipment(params.id);
  if (!equipment) {
    return NextResponse.json({ error: "Introuvable" }, { status: 404 });
  }
  const baseUrl = process.env.PUBLIC_URL ?? "http://localhost:3020";
  const token = makeEquipmentToken(params.id);
  const publicUrl = `${baseUrl}/equipement/${params.id}?t=${token}`;
  // Image QR via service externe (fallback démo) — en prod, brancher un
  // encoder npm tel que `qrcode` côté serveur pour générer un PNG/SVG local.
  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&margin=10&data=${encodeURIComponent(publicUrl)}`;
  return NextResponse.json({
    publicUrl,
    qrImageUrl,
    equipment: {
      brand: equipment.brand,
      model: equipment.model,
      serialNumber: equipment.serialNumber,
    },
  });
}
