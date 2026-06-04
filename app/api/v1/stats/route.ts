/**
 * GET /api/v1/stats
 * Auth : Bearer token API key avec scope read:stats.
 * Renvoie des stats agrégées (sans données personnelles).
 */

import { NextResponse } from "next/server";
import { extractApiKey, verifyKey } from "@/lib/api-keys-store";
import { listLeads } from "@/lib/leads-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const raw = extractApiKey(req);
  if (!raw) {
    return NextResponse.json({ error: "missing_api_key" }, { status: 401 });
  }
  const verified = await verifyKey(raw, "read:stats");
  if (!verified.ok) {
    return NextResponse.json(
      { error: verified.error },
      { status: verified.error === "scope_missing" ? 403 : 401 },
    );
  }

  const leads = await listLeads();
  const byStatus: Record<string, number> = {};
  const byLevel: Record<string, number> = { hot: 0, warm: 0, cold: 0 };
  const byService: Record<string, number> = {};
  for (const l of leads) {
    byStatus[l.status] = (byStatus[l.status] ?? 0) + 1;
    if (l.level) byLevel[l.level] = (byLevel[l.level] ?? 0) + 1;
    for (const s of l.services) byService[s] = (byService[s] ?? 0) + 1;
  }

  return NextResponse.json({
    totals: { leads: leads.length },
    byStatus,
    byLevel,
    byService,
    apiVersion: "v1",
  });
}
