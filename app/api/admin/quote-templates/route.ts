/**
 * GET  /api/admin/quote-templates → liste (tri usage desc)
 * POST /api/admin/quote-templates { name, description?, category?, lines[], tvaRate? }
 */

import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/require-admin";
import { listTemplates, createTemplate } from "@/lib/quote-templates-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const auth = await requireAdminApi(req);
  if (!auth.ok) return auth.response;
  const templates = await listTemplates();
  return NextResponse.json({ templates });
}

export async function POST(req: Request) {
  const auth = await requireAdminApi(req);
  if (!auth.ok) return auth.response;
  let body: {
    name?: string;
    description?: string;
    category?: string;
    lines?: unknown[];
    tvaRate?: number;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON invalide" }, { status: 400 });
  }
  if (!body.name || !Array.isArray(body.lines)) {
    return NextResponse.json(
      { error: "name et lines requis" },
      { status: 400 },
    );
  }
  try {
    const tpl = await createTemplate({
      name: body.name,
      description: body.description,
      category: body.category,
      lines: body.lines,
      tvaRate: body.tvaRate,
    });
    return NextResponse.json({ template: tpl });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Erreur" },
      { status: 400 },
    );
  }
}
