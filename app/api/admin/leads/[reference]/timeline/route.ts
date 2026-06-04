/**
 * GET /api/admin/leads/[reference]/timeline → liste chronologique unifiée.
 */

import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/require-admin";
import { composeTimeline } from "@/lib/lead-timeline";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  req: Request,
  { params }: { params: { reference: string } },
) {
  const auth = await requireAdminApi(req);
  if (!auth.ok) return auth.response;
  const events = await composeTimeline(params.reference);
  return NextResponse.json({ events });
}
