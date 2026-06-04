import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/require-admin";
import { listTracking } from "@/lib/email-tracking-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const auth = await requireAdminApi(req);
  if (!auth.ok) return auth.response;
  const all = await listTracking();
  // Agrégations
  const total = all.length;
  const totalOpens = all.reduce((s, t) => s + t.opens, 0);
  const totalClicks = all.reduce((s, t) => s + t.clicks, 0);
  const openRate = total > 0 ? all.filter((t) => t.opens > 0).length / total : 0;
  const clickRate = total > 0 ? all.filter((t) => t.clicks > 0).length / total : 0;

  const byKind: Record<string, { sent: number; opens: number; clicks: number }> = {};
  for (const t of all) {
    if (!byKind[t.kind]) byKind[t.kind] = { sent: 0, opens: 0, clicks: 0 };
    byKind[t.kind].sent++;
    byKind[t.kind].opens += t.opens;
    byKind[t.kind].clicks += t.clicks;
  }

  return NextResponse.json({
    tracking: all.slice(0, 200),
    totals: { sent: total, opens: totalOpens, clicks: totalClicks },
    rates: { openRate, clickRate },
    byKind,
  });
}
