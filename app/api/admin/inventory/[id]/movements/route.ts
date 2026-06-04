/**
 * POST /api/admin/inventory/[id]/movements { type, quantity, reason?, reference? }
 *   - in: ajout au stock
 *   - out: sortie (vérifie stock suffisant)
 *   - adjust: redéfinit la quantité absolue
 */

import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/require-admin";
import { recordMovement } from "@/lib/inventory-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(
  req: Request,
  { params }: { params: { id: string } },
) {
  const auth = await requireAdminApi(req);
  if (!auth.ok) return auth.response;
  const email = (auth.session as { email?: string } | undefined)?.email;
  let body: {
    type?: "in" | "out" | "adjust";
    quantity?: number;
    reason?: string;
    reference?: string;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON invalide" }, { status: 400 });
  }
  if (
    (body.type !== "in" && body.type !== "out" && body.type !== "adjust") ||
    typeof body.quantity !== "number"
  ) {
    return NextResponse.json(
      { error: "type + quantity requis" },
      { status: 400 },
    );
  }
  try {
    const movement = await recordMovement({
      itemId: params.id,
      type: body.type,
      quantity: body.quantity,
      reason: body.reason,
      reference: body.reference,
      by: email,
    });
    if (!movement) {
      return NextResponse.json({ error: "Item introuvable" }, { status: 404 });
    }
    return NextResponse.json({ movement });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Erreur" },
      { status: 400 },
    );
  }
}
