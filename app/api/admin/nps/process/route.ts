/**
 * POST /api/admin/nps/process → trigger lazy d'envoi des enquêtes manquantes.
 *
 * À appeler depuis la page admin NPS ou via cron. Idempotent.
 */

import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/require-admin";
import { maybeSendNpsSurveys } from "@/lib/nps-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const auth = await requireAdminApi(req);
  if (!auth.ok) return auth.response;
  const url = new URL(req.url);
  const graceDays = Number(url.searchParams.get("graceDays") ?? "7");
  const result = await maybeSendNpsSurveys(
    Number.isFinite(graceDays) && graceDays >= 0 ? graceDays : 7,
  );
  return NextResponse.json(result);
}
