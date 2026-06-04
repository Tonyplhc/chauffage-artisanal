/**
 * POST /api/admin/leads/[reference]/quote/request-approval { notes? }
 *   → ouvre une demande de validation sur le devis courant
 */

import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/require-admin";
import { requestApproval } from "@/lib/quote-approvals-store";
import { logActivity } from "@/lib/activity-log";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(
  req: Request,
  { params }: { params: { reference: string } },
) {
  const auth = await requireAdminApi(req);
  if (!auth.ok) return auth.response;
  const email =
    (auth.session as { email?: string } | undefined)?.email ?? "admin";
  let body: { notes?: string } = {};
  try {
    body = await req.json();
  } catch {
    // body optionnel
  }
  try {
    const approval = await requestApproval({
      leadReference: params.reference,
      requestedBy: email,
      notes: body.notes,
    });
    void logActivity(
      "lead.notes_updated",
      `Validation devis demandée par ${email}`,
      { reference: params.reference, meta: { approvalId: approval.id } },
    );
    return NextResponse.json({ approval });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Erreur" },
      { status: 400 },
    );
  }
}
