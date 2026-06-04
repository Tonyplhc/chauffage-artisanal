/**
 * PATCH /api/admin/approvals/[id] { decision: "approved"|"rejected"|"withdrawn", comment? }
 *
 * - approved / rejected : validation par un autre admin
 * - withdrawn : retrait par l'auteur (seulement)
 */

import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/require-admin";
import {
  decideApproval,
  withdrawApproval,
  getApproval,
} from "@/lib/quote-approvals-store";
import { logActivity } from "@/lib/activity-log";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } },
) {
  const auth = await requireAdminApi(req);
  if (!auth.ok) return auth.response;
  const email =
    (auth.session as { email?: string } | undefined)?.email ?? "admin";
  let body: { decision?: string; comment?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON invalide" }, { status: 400 });
  }
  const before = await getApproval(params.id);
  if (!before) {
    return NextResponse.json({ error: "Introuvable" }, { status: 404 });
  }
  try {
    if (body.decision === "withdrawn") {
      const next = await withdrawApproval(params.id, email);
      if (!next) {
        return NextResponse.json({ error: "Introuvable" }, { status: 404 });
      }
      void logActivity(
        "lead.notes_updated",
        `Validation devis retirée par ${email}`,
        { reference: before.leadReference, meta: { approvalId: params.id } },
      );
      return NextResponse.json({ approval: next });
    }
    if (body.decision === "approved" || body.decision === "rejected") {
      const next = await decideApproval(
        params.id,
        body.decision,
        email,
        body.comment,
      );
      if (!next) {
        return NextResponse.json({ error: "Introuvable" }, { status: 404 });
      }
      void logActivity(
        "lead.notes_updated",
        `Validation devis ${
          body.decision === "approved" ? "approuvée" : "rejetée"
        } par ${email}`,
        {
          reference: before.leadReference,
          meta: { approvalId: params.id, decision: body.decision },
        },
      );
      return NextResponse.json({ approval: next });
    }
    return NextResponse.json(
      { error: "decision invalide (approved/rejected/withdrawn)" },
      { status: 400 },
    );
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Erreur" },
      { status: 400 },
    );
  }
}
