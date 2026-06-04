import { NextResponse } from "next/server";
import { z } from "zod";
import { getLead, updateLead } from "@/lib/leads-store";
import { StatusEnum } from "@/lib/devis-schema";
import { requireAdminApi, getAdminSession } from "@/lib/require-admin";
import { publish } from "@/lib/event-bus";
import { logActivity } from "@/lib/activity-log";
import { recordDiff } from "@/lib/audit-diff-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const PatchSchema = z
  .object({
    status: StatusEnum.optional(),
    notes: z.string().max(5000).optional(),
    assignedTo: z.union([z.string().email(), z.literal("")]).optional(),
  })
  .refine((d) => Object.keys(d).length > 0, { message: "Aucune modification fournie." });

export async function GET(
  req: Request,
  { params }: { params: { reference: string } },
) {
  const auth = await requireAdminApi(req);
  if (!auth.ok) return auth.response;
  const lead = await getLead(params.reference);
  if (!lead) return NextResponse.json({ error: "Lead introuvable" }, { status: 404 });
  return NextResponse.json({ lead });
}

export async function PATCH(
  req: Request,
  { params }: { params: { reference: string } },
) {
  const auth = await requireAdminApi(req);
  if (!auth.ok) return auth.response;
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON invalide" }, { status: 400 });
  }
  const parsed = PatchSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ error: "Données invalides", details: parsed.error.issues }, { status: 400 });
  }
  // Récup statut avant mise à jour pour pouvoir broadcaster la transition
  const before = await getLead(params.reference);
  // assignedTo vide chaîne = désassigner
  const patch: Parameters<typeof updateLead>[1] = { ...parsed.data };
  if (parsed.data.assignedTo === "") {
    patch.assignedTo = undefined;
  }
  const updated = await updateLead(params.reference, patch);
  if (!updated) return NextResponse.json({ error: "Lead introuvable" }, { status: 404 });
  // Audit trail granulaire (W25.1) — diff champ par champ
  if (before) {
    const session = getAdminSession();
    void recordDiff({
      entityType: "lead",
      entityId: updated.reference,
      actorEmail: (session as { email?: string } | null)?.email,
      before: before as unknown as Record<string, unknown>,
      after: updated as unknown as Record<string, unknown>,
      fields: ["status", "notes", "assignedTo"],
    });
  }
  if (before && parsed.data.status && before.status !== parsed.data.status) {
    publish({
      type: "lead.status_changed",
      at: new Date().toISOString(),
      reference: updated.reference,
      from: before.status,
      to: parsed.data.status,
    });
    void logActivity(
      "lead.status_changed",
      `Statut · ${before.status} → ${parsed.data.status}`,
      { reference: updated.reference, meta: { from: before.status, to: parsed.data.status } },
    );
  }
  if (before && parsed.data.notes !== undefined && before.notes !== parsed.data.notes) {
    void logActivity("lead.notes_updated", "Notes internes modifiées", {
      reference: updated.reference,
    });
  }
  return NextResponse.json({ lead: updated });
}
