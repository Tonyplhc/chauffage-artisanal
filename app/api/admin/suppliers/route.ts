/**
 * GET  /api/admin/suppliers      → liste + categories + stats
 * POST /api/admin/suppliers      → création
 */

import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/require-admin";
import {
  listSuppliers,
  createSupplier,
  listCategories,
  computeStats,
} from "@/lib/suppliers-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const auth = await requireAdminApi(req);
  if (!auth.ok) return auth.response;
  const url = new URL(req.url);
  const category = url.searchParams.get("category") ?? undefined;
  const search = url.searchParams.get("search") ?? undefined;
  const status = url.searchParams.get("status") as
    | "active"
    | "archived"
    | null;
  const [suppliers, categories, stats] = await Promise.all([
    listSuppliers({
      status: status ?? undefined,
      category,
      search,
    }),
    listCategories(),
    computeStats(),
  ]);
  return NextResponse.json({ suppliers, categories, stats });
}

export async function POST(req: Request) {
  const auth = await requireAdminApi(req);
  if (!auth.ok) return auth.response;
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON invalide" }, { status: 400 });
  }
  try {
    const supplier = await createSupplier(body as never);
    return NextResponse.json({ supplier });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Erreur" },
      { status: 400 },
    );
  }
}
