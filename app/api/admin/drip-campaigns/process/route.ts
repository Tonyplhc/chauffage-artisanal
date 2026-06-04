/**
 * POST /api/admin/drip-campaigns/process → exécute la queue des étapes dues.
 *
 * À appeler manuellement depuis la page admin ou via cron externe.
 * Idempotent : ne renvoie pas un même step.
 */

import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/require-admin";
import { processDripQueue } from "@/lib/drip-campaigns-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const auth = await requireAdminApi(req);
  if (!auth.ok) return auth.response;
  const result = await processDripQueue();
  return NextResponse.json(result);
}
