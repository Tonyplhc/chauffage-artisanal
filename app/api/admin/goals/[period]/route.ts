/**
 * GET    /api/admin/goals/[period]       → progression du mois donné
 * DELETE /api/admin/goals/[period]       → supprime l'objectif (mais pas les leads !)
 *
 * `period` au format YYYY-MM. Spécial : "current" → mois en cours.
 */

import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/require-admin";
import {
  computeProgress,
  deleteGoal,
  currentPeriod,
} from "@/lib/goals-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function resolvePeriod(raw: string): string {
  if (raw === "current") return currentPeriod();
  return raw;
}

export async function GET(
  req: Request,
  { params }: { params: { period: string } },
) {
  const auth = await requireAdminApi(req);
  if (!auth.ok) return auth.response;
  const progress = await computeProgress(resolvePeriod(params.period));
  return NextResponse.json({ progress });
}

export async function DELETE(
  req: Request,
  { params }: { params: { period: string } },
) {
  const auth = await requireAdminApi(req);
  if (!auth.ok) return auth.response;
  const ok = await deleteGoal(resolvePeriod(params.period));
  if (!ok) {
    return NextResponse.json({ error: "Objectif introuvable" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
