/**
 * Export RGPD — un fichier JSON contenant toutes les données détenues sur un
 * lead (record + documents listés + quote + métadonnées).
 *
 * Servi en téléchargement (Content-Disposition attachment) avec un nom de
 * fichier qui inclut la référence et la date.
 *
 * À transmettre au client sur demande dans le cadre du droit d'accès RGPD.
 */

import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/require-admin";
import { getLead } from "@/lib/leads-store";
import { listDocuments } from "@/lib/documents-store";
import { getQuote } from "@/lib/quotes-store";
import { logger } from "@/lib/logger";
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
  const documents = await listDocuments(params.reference);
  const quote = await getQuote(params.reference);

  const exportData = {
    _meta: {
      exportedAt: new Date().toISOString(),
      exportedBy: "admin",
      purpose: "RGPD article 15 — droit d'accès aux données personnelles",
      version: 1,
    },
    lead,
    documents: documents.map((d) => ({
      ...d,
      url: `/api/admin/leads/${params.reference}/documents/${d.id}`,
    })),
    quote: quote ?? null,
  };

  logger.info("admin.rgpd_export", {
    reference: params.reference,
    documents: documents.length,
    quote: !!quote,
  });
  void logActivity("lead.rgpd_export", "Export RGPD effectué", {
    reference: params.reference,
    meta: { documents: documents.length, hasQuote: !!quote },
  });

  const filename = `rgpd-${params.reference}-${new Date()
    .toISOString()
    .slice(0, 10)}.json`;

  return new NextResponse(JSON.stringify(exportData, null, 2), {
    status: 200,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
