/**
 * GET  /api/admin/drip-campaigns → liste + enrollments
 * POST /api/admin/drip-campaigns → création
 */

import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/require-admin";
import {
  listCampaigns,
  createCampaign,
  listEnrollments,
} from "@/lib/drip-campaigns-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const auth = await requireAdminApi(req);
  if (!auth.ok) return auth.response;
  const [campaigns, enrollments] = await Promise.all([
    listCampaigns(),
    listEnrollments(),
  ]);
  return NextResponse.json({ campaigns, enrollments });
}

export async function POST(req: Request) {
  const auth = await requireAdminApi(req);
  if (!auth.ok) return auth.response;
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON invalide" }, { status: 400 });
  }
  try {
    const campaign = await createCampaign(body as never);
    return NextResponse.json({ campaign });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Erreur" },
      { status: 400 },
    );
  }
}
