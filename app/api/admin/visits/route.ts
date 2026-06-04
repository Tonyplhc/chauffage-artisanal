/**
 * GET  /api/admin/visits → liste toutes les interventions
 * POST /api/admin/visits → création d'une intervention ad-hoc (sans contrat)
 *
 * Le POST sous /api/admin/maintenance/[id]/visits reste l'entry-point pour
 * les visites d'entretien sous contrat (pré-remplit checklist + équipement).
 */

import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/require-admin";
import {
  createVisit,
  listVisits,
  type VisitType,
} from "@/lib/maintenance-visits-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const VALID_TYPES: VisitType[] = [
  "entretien",
  "depannage",
  "pose",
  "diagnostic",
];

export async function GET(req: Request) {
  const auth = await requireAdminApi(req);
  if (!auth.ok) return auth.response;
  const visits = await listVisits();
  return NextResponse.json({ visits });
}

export async function POST(req: Request) {
  const auth = await requireAdminApi(req);
  if (!auth.ok) return auth.response;
  const email = (auth.session as { email?: string } | undefined)?.email;
  let body: {
    leadReference?: string;
    type?: string;
    visitedAt?: string;
    technicianEmail?: string;
    equipmentId?: string;
    equipmentType?: string;
  } = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON invalide" }, { status: 400 });
  }
  if (!body.leadReference) {
    return NextResponse.json(
      { error: "leadReference requis" },
      { status: 400 },
    );
  }
  const type =
    body.type && VALID_TYPES.includes(body.type as VisitType)
      ? (body.type as VisitType)
      : "depannage";
  try {
    const visit = await createVisit({
      leadReference: body.leadReference,
      type,
      visitedAt: body.visitedAt,
      technicianEmail: body.technicianEmail ?? email,
      equipmentId: body.equipmentId,
      equipmentType: body.equipmentType,
    });
    return NextResponse.json({ visit });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Erreur" },
      { status: 400 },
    );
  }
}
