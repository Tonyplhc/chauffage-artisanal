import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/require-admin";
import { buildCsvTemplate } from "@/lib/catalogue-parser";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const auth = await requireAdminApi(req);
  if (!auth.ok) return auth.response;

  const csv = buildCsvTemplate();
  // BOM UTF-8 pour ouverture propre dans Excel
  const body = "﻿" + csv;
  return new NextResponse(body, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="catalogue-template.csv"',
    },
  });
}
