/**
 * GET  /api/admin/scoring-rules → règles courantes
 * PUT  /api/admin/scoring-rules { rules } → remplace l'ensemble
 */

import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/require-admin";
import {
  getRules,
  setRules,
  type ScoringRule,
} from "@/lib/lead-scoring-rules-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const auth = await requireAdminApi(req);
  if (!auth.ok) return auth.response;
  const rules = await getRules();
  return NextResponse.json(rules);
}

export async function PUT(req: Request) {
  const auth = await requireAdminApi(req);
  if (!auth.ok) return auth.response;
  let body: { rules?: ScoringRule[] };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON invalide" }, { status: 400 });
  }
  if (!Array.isArray(body.rules)) {
    return NextResponse.json(
      { error: "rules (array) requis" },
      { status: 400 },
    );
  }
  const set = await setRules(body.rules);
  return NextResponse.json(set);
}
