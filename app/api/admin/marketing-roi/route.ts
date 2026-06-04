/**
 * GET  /api/admin/marketing-roi → rapport ROI par source
 * POST /api/admin/marketing-roi/spend { source, monthlyEur } → upsert spend
 */

import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/require-admin";
import { computeMarketingRoi } from "@/lib/marketing-roi";
import {
  upsertSpend,
  listSpend,
} from "@/lib/marketing-spend-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const auth = await requireAdminApi(req);
  if (!auth.ok) return auth.response;
  const url = new URL(req.url);
  const windowMonths = Number(url.searchParams.get("months") ?? "6");
  const [report, spend] = await Promise.all([
    computeMarketingRoi({ windowMonths }),
    listSpend(),
  ]);
  return NextResponse.json({ report, spend, windowMonths });
}

export async function POST(req: Request) {
  const auth = await requireAdminApi(req);
  if (!auth.ok) return auth.response;
  let body: { source?: string; monthlyEur?: number; notes?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON invalide" }, { status: 400 });
  }
  if (!body.source || typeof body.monthlyEur !== "number") {
    return NextResponse.json(
      { error: "source et monthlyEur requis" },
      { status: 400 },
    );
  }
  try {
    const spend = await upsertSpend({
      source: body.source,
      monthlyEur: body.monthlyEur,
      notes: body.notes,
    });
    return NextResponse.json({ spend });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Erreur" },
      { status: 400 },
    );
  }
}
