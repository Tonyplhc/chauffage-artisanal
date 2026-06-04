/**
 * GET    /api/admin/leads/[reference]/duplicates
 *   → doublons potentiels pour ce lead.
 *
 * POST   /api/admin/leads/[reference]/duplicates/dismiss
 *   { otherRef, reason }
 *   → marque une paire comme "pas un doublon" (faux positif).
 */

import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/require-admin";
import { getLead, listLeads } from "@/lib/leads-store";
import {
  findDuplicatesFor,
  dismissDuplicate,
} from "@/lib/duplicate-detection";
import { logActivity } from "@/lib/activity-log";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  req: Request,
  { params }: { params: { reference: string } },
) {
  const auth = await requireAdminApi(req);
  if (!auth.ok) return auth.response;
  const lead = await getLead(params.reference);
  if (!lead) {
    return NextResponse.json({ error: "Lead introuvable" }, { status: 404 });
  }
  const all = await listLeads();
  const matches = await findDuplicatesFor(lead, all);
  return NextResponse.json({
    matches: matches.map((m) => ({
      reason: m.reason,
      normalizedEmail: m.normalizedEmail,
      normalizedPhone: m.normalizedPhone,
      lead: {
        reference: m.match.reference,
        fullName: m.match.fullName,
        email: m.match.email,
        phone: m.match.phone,
        commune: m.match.commune,
        status: m.match.status,
        submittedAt: m.match.submittedAt,
        services: m.match.services,
        level: m.match.level,
      },
    })),
  });
}

export async function POST(
  req: Request,
  { params }: { params: { reference: string } },
) {
  const auth = await requireAdminApi(req);
  if (!auth.ok) return auth.response;
  const email = (auth.session as { email?: string } | undefined)?.email;
  let body: { otherRef?: string; reason?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON invalide" }, { status: 400 });
  }
  if (!body.otherRef) {
    return NextResponse.json(
      { error: "otherRef requis" },
      { status: 400 },
    );
  }
  const reason: "email" | "phone" | "both" =
    body.reason === "email" || body.reason === "phone" || body.reason === "both"
      ? body.reason
      : "both";
  await dismissDuplicate(params.reference, body.otherRef, reason, email);
  void logActivity(
    "lead.notes_updated",
    `Doublon ignoré : ${params.reference} ↔ ${body.otherRef} (${reason})`,
    { reference: params.reference, meta: { otherRef: body.otherRef, reason } },
  );
  return NextResponse.json({ ok: true });
}
