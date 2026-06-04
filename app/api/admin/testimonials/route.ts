/**
 * GET /api/admin/testimonials → candidats NPS (promoteurs avec commentaire)
 * + leur état d'approbation.
 */

import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/require-admin";
import { listCandidates } from "@/lib/testimonials-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const auth = await requireAdminApi(req);
  if (!auth.ok) return auth.response;
  const candidates = await listCandidates();
  return NextResponse.json({ candidates });
}
