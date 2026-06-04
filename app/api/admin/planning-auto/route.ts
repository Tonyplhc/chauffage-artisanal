/**
 * POST /api/admin/planning-auto
 *   { interventions: [...], techs: [...], maxShiftDays?: number }
 *   → calcule un planning auto-équilibré
 *
 * Pour la démo, on accepte le contenu directement dans le body — pas de
 * récupération automatique depuis les leads/visites (extension future).
 */

import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/require-admin";
import { calculatePlanning } from "@/lib/planning-auto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const auth = await requireAdminApi(req);
  if (!auth.ok) return auth.response;
  let body: Parameters<typeof calculatePlanning>[0] extends infer I
    ? { interventions: I; techs: Parameters<typeof calculatePlanning>[1]; maxShiftDays?: number }
    : never;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON invalide" }, { status: 400 });
  }
  if (!Array.isArray(body.interventions) || !Array.isArray(body.techs)) {
    return NextResponse.json(
      { error: "interventions et techs requis (arrays)" },
      { status: 400 },
    );
  }
  const result = calculatePlanning(body.interventions, body.techs, {
    maxShiftDays: body.maxShiftDays,
  });
  return NextResponse.json({ result });
}
