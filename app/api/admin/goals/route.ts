/**
 * GET /api/admin/goals → liste des objectifs (tous les mois)
 * POST /api/admin/goals { period, leadsTarget, convertedTarget, revenueTarget } → upsert
 */

import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/require-admin";
import { listGoals, upsertGoal } from "@/lib/goals-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const auth = await requireAdminApi(req);
  if (!auth.ok) return auth.response;
  const goals = await listGoals();
  return NextResponse.json({ goals });
}

export async function POST(req: Request) {
  const auth = await requireAdminApi(req);
  if (!auth.ok) return auth.response;
  let body: {
    period?: string;
    leadsTarget?: number;
    convertedTarget?: number;
    revenueTarget?: number;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON invalide" }, { status: 400 });
  }
  if (!body.period) {
    return NextResponse.json({ error: "period requis" }, { status: 400 });
  }
  try {
    const goal = await upsertGoal({
      period: body.period,
      leadsTarget: Number(body.leadsTarget ?? 0),
      convertedTarget: Number(body.convertedTarget ?? 0),
      revenueTarget: Number(body.revenueTarget ?? 0),
    });
    return NextResponse.json({ goal });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Erreur" },
      { status: 400 },
    );
  }
}
