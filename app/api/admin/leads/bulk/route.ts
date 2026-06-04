/**
 * Endpoint bulk operations sur les leads.
 *
 * Auth admin requise. Accepte :
 *   { action: "updateStatus", references: string[], status: LeadStatus }
 *
 * Renvoie le compte de succès. Les références introuvables sont silencieusement
 * ignorées (utile si l'UI est désynchro).
 */

import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminApi } from "@/lib/require-admin";
import { updateLead } from "@/lib/leads-store";
import { StatusEnum } from "@/lib/devis-schema";
import { logger } from "@/lib/logger";
import { logActivity } from "@/lib/activity-log";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BulkSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("updateStatus"),
    references: z.array(z.string().regex(/^DEV-\d{4}-\d{4}$/)).min(1).max(200),
    status: StatusEnum,
  }),
]);

export async function POST(req: Request) {
  const auth = await requireAdminApi(req);
  if (!auth.ok) return auth.response;

  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON invalide." }, { status: 400 });
  }
  const parsed = BulkSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Action invalide." },
      { status: 400 },
    );
  }

  const data = parsed.data;
  let succeeded = 0;
  let failed = 0;

  for (const ref of data.references) {
    const updated = await updateLead(ref, { status: data.status });
    if (updated) succeeded++;
    else failed++;
  }

  logger.info("admin.bulk_operation", {
    action: data.action,
    requested: data.references.length,
    succeeded,
    failed,
  });

  void logActivity(
    "lead.bulk_status",
    `Statut groupé · ${succeeded} dossier(s) → ${data.status}`,
    { meta: { succeeded, failed, status: data.status } },
  );

  return NextResponse.json({ ok: true, succeeded, failed });
}
