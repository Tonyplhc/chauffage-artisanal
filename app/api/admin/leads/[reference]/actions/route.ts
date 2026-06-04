/**
 * GET /api/admin/leads/[reference]/actions → suggestions next best action.
 *
 * Compose le contexte (lead + reminders + quote + comments + duplicates) puis
 * lance les règles déterministes.
 */

import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/require-admin";
import { getLead, listLeads } from "@/lib/leads-store";
import { listReminders } from "@/lib/reminders-store";
import { getQuote } from "@/lib/quotes-store";
import { listCommentsForLead } from "@/lib/comments-store";
import { findDuplicatesFor } from "@/lib/duplicate-detection";
import { computeNextBestActions } from "@/lib/next-best-action";

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

  const [reminders, quote, comments, allLeads] = await Promise.all([
    listReminders({ leadReference: params.reference }),
    getQuote(params.reference),
    listCommentsForLead(params.reference),
    listLeads(),
  ]);

  const duplicates = await findDuplicatesFor(lead, allLeads);

  const actions = computeNextBestActions({
    lead,
    reminders,
    hasQuote: !!quote,
    quoteStatus: quote?.status,
    quoteSentAt: quote?.sentAt,
    commentCount: comments.filter((c) => !c.deletedAt).length,
    hasDuplicates: duplicates.length > 0,
  });

  return NextResponse.json({ actions: actions.slice(0, 5) });
}
