/**
 * GET  /api/admin/segments → liste des segments accessibles + counts
 * POST /api/admin/segments { name, query, isShared, description? } → création
 */

import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/require-admin";
import {
  listSegmentsFor,
  createSegment,
  evaluateSegmentCount,
} from "@/lib/segments-store";
import { listLeads } from "@/lib/leads-store";
import { logActivity } from "@/lib/activity-log";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const auth = await requireAdminApi(req);
  if (!auth.ok) return auth.response;
  const email = (auth.session as { email?: string } | undefined)?.email;
  const [segments, leads] = await Promise.all([
    listSegmentsFor(email),
    listLeads(),
  ]);
  const counts: Record<string, number> = {};
  for (const s of segments) {
    counts[s.id] = await evaluateSegmentCount(s, leads, email);
  }
  return NextResponse.json({ segments, counts });
}

export async function POST(req: Request) {
  const auth = await requireAdminApi(req);
  if (!auth.ok) return auth.response;
  const email = (auth.session as { email?: string } | undefined)?.email;
  let body: {
    name?: string;
    description?: string;
    query?: string;
    isShared?: boolean;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON invalide" }, { status: 400 });
  }
  if (!body.name || !body.query) {
    return NextResponse.json(
      { error: "name et query requis" },
      { status: 400 },
    );
  }
  try {
    const seg = await createSegment({
      name: body.name,
      description: body.description,
      query: body.query,
      isShared: !!body.isShared,
      ownerEmail: email,
    });
    void logActivity(
      "admin.view_saved",
      `Segment créé : ${seg.name}`,
      { meta: { id: seg.id, query: seg.query, isShared: seg.isShared } },
    );
    return NextResponse.json({ segment: seg });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Erreur" },
      { status: 400 },
    );
  }
}
