/**
 * GET  /api/admin/stock-locations → liste + résumé stocks
 * POST /api/admin/stock-locations → création location
 */

import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/require-admin";
import {
  listLocations,
  createLocation,
  getStockSummary,
} from "@/lib/stock-locations-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const auth = await requireAdminApi(req);
  if (!auth.ok) return auth.response;
  const [locations, summary] = await Promise.all([
    listLocations(),
    getStockSummary(),
  ]);
  return NextResponse.json({ locations, summary });
}

export async function POST(req: Request) {
  const auth = await requireAdminApi(req);
  if (!auth.ok) return auth.response;
  let body: Parameters<typeof createLocation>[0];
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON invalide" }, { status: 400 });
  }
  try {
    const loc = await createLocation(body);
    return NextResponse.json({ location: loc });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Erreur" },
      { status: 400 },
    );
  }
}
