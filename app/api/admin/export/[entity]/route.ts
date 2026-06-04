/**
 * GET /api/admin/export/[entity]?format=csv|json
 *
 * Entities supportées : leads, quotes, invoices, events.
 * Format défaut : csv (téléchargement attaché). JSON pour BI moderne.
 */

import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/require-admin";
import {
  exportLeads,
  exportQuotes,
  exportInvoices,
  exportEvents,
} from "@/lib/data-warehouse";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const HANDLERS: Record<string, () => Promise<{ rows: unknown[]; csv: string }>> =
  {
    leads: exportLeads,
    quotes: exportQuotes,
    invoices: exportInvoices,
    events: exportEvents,
  };

export async function GET(
  req: Request,
  { params }: { params: { entity: string } },
) {
  const auth = await requireAdminApi(req);
  if (!auth.ok) return auth.response;
  const handler = HANDLERS[params.entity];
  if (!handler) {
    return NextResponse.json(
      { error: `Entity inconnue : ${params.entity}` },
      { status: 400 },
    );
  }
  const url = new URL(req.url);
  const format = (url.searchParams.get("format") ?? "csv").toLowerCase();
  const data = await handler();
  const stamp = new Date().toISOString().slice(0, 10);
  const filename = `chauffage-artisanal-${params.entity}-${stamp}.${format}`;
  if (format === "json") {
    return new NextResponse(JSON.stringify(data.rows, null, 2), {
      status: 200,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    });
  }
  return new NextResponse(data.csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
