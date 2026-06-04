/**
 * POST /api/admin/dispatch/[id]/clock { action: "in"|"out" }
 *   - in  : enregistre actualStartAt = maintenant
 *   - out : enregistre actualEndAt = maintenant (exige in préalable)
 */

import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/require-admin";
import { clockIn, clockOut } from "@/lib/dispatch-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(
  req: Request,
  { params }: { params: { id: string } },
) {
  const auth = await requireAdminApi(req);
  if (!auth.ok) return auth.response;
  let body: { action?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON invalide" }, { status: 400 });
  }
  try {
    if (body.action === "in") {
      const slot = await clockIn(params.id);
      if (!slot) {
        return NextResponse.json({ error: "Introuvable" }, { status: 404 });
      }
      return NextResponse.json({ slot });
    }
    if (body.action === "out") {
      const slot = await clockOut(params.id);
      if (!slot) {
        return NextResponse.json({ error: "Introuvable" }, { status: 404 });
      }
      return NextResponse.json({ slot });
    }
    return NextResponse.json(
      { error: "action requis (in/out)" },
      { status: 400 },
    );
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Erreur" },
      { status: 400 },
    );
  }
}
