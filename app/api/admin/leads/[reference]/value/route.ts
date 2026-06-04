/**
 * GET /api/admin/leads/[reference]/value         → valeur estimée + métadonnées
 * PUT /api/admin/leads/[reference]/value         { value: number | null } → set/clear
 *   - value === null → retire l'override (retombe sur la valeur déduite du budget)
 */

import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/require-admin";
import { getLead, updateLead } from "@/lib/leads-store";
import {
  getLeadValue,
  isValueExplicit,
  suggestEstimatedValue,
} from "@/lib/pipeline-value";
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
  return NextResponse.json({
    value: getLeadValue(lead),
    explicit: isValueExplicit(lead),
    suggested: suggestEstimatedValue(lead),
    budget: lead.budget,
  });
}

export async function PUT(
  req: Request,
  { params }: { params: { reference: string } },
) {
  const auth = await requireAdminApi(req);
  if (!auth.ok) return auth.response;
  let body: { value?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON invalide" }, { status: 400 });
  }
  const v = body.value;
  if (v !== null && (typeof v !== "number" || !Number.isFinite(v) || v < 0)) {
    return NextResponse.json(
      { error: "value doit être un nombre positif ou null" },
      { status: 400 },
    );
  }
  if (typeof v === "number" && v > 10_000_000) {
    return NextResponse.json(
      { error: "value trop grande" },
      { status: 400 },
    );
  }
  const lead = await getLead(params.reference);
  if (!lead) {
    return NextResponse.json({ error: "Lead introuvable" }, { status: 404 });
  }
  const meta = { ...(lead.metadata ?? {}) } as Record<string, unknown>;
  if (v === null) {
    delete meta.estimatedValue;
  } else {
    meta.estimatedValue = Math.round(v);
  }
  await updateLead(params.reference, {
    metadata: meta as typeof lead.metadata,
  });
  void logActivity(
    "lead.value_updated",
    v === null
      ? "Valeur estimée retirée"
      : `Valeur estimée fixée à ${Math.round(v)} €`,
    { reference: params.reference, meta: { value: v } },
  );
  const after = await getLead(params.reference);
  return NextResponse.json({
    value: after ? getLeadValue(after) : 0,
    explicit: after ? isValueExplicit(after) : false,
  });
}
