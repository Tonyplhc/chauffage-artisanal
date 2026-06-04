/**
 * GET /api/v1/catalogue
 * Auth : Bearer token API key avec scope read:catalogue.
 */

import { NextResponse } from "next/server";
import { extractApiKey, verifyKey } from "@/lib/api-keys-store";
import { readCatalogue } from "@/lib/catalogue-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const raw = extractApiKey(req);
  if (!raw) {
    return NextResponse.json({ error: "missing_api_key" }, { status: 401 });
  }
  const verified = await verifyKey(raw, "read:catalogue");
  if (!verified.ok) {
    return NextResponse.json(
      { error: verified.error },
      { status: verified.error === "scope_missing" ? 403 : 401 },
    );
  }
  const catalogue = await readCatalogue();
  return NextResponse.json({
    data: catalogue?.items ?? [],
    count: catalogue?.items.length ?? 0,
    apiVersion: "v1",
  });
}
