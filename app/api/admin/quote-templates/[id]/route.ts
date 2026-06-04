/**
 * GET    /api/admin/quote-templates/[id]    → détail (+ tracking via X-Track-Use=1)
 * PATCH  /api/admin/quote-templates/[id]    { name?, description?, category?, lines?, tvaRate? }
 * DELETE /api/admin/quote-templates/[id]
 */

import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/require-admin";
import {
  getTemplate,
  updateTemplate,
  deleteTemplate,
  recordTemplateUsage,
} from "@/lib/quote-templates-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  req: Request,
  { params }: { params: { id: string } },
) {
  const auth = await requireAdminApi(req);
  if (!auth.ok) return auth.response;
  const tpl = await getTemplate(params.id);
  if (!tpl) {
    return NextResponse.json({ error: "Introuvable" }, { status: 404 });
  }
  if (req.headers.get("x-track-use") === "1") {
    void recordTemplateUsage(params.id);
  }
  return NextResponse.json({ template: tpl });
}

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } },
) {
  const auth = await requireAdminApi(req);
  if (!auth.ok) return auth.response;
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON invalide" }, { status: 400 });
  }
  try {
    const tpl = await updateTemplate(params.id, body as never);
    if (!tpl) {
      return NextResponse.json({ error: "Introuvable" }, { status: 404 });
    }
    return NextResponse.json({ template: tpl });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Erreur" },
      { status: 400 },
    );
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } },
) {
  const auth = await requireAdminApi(req);
  if (!auth.ok) return auth.response;
  const ok = await deleteTemplate(params.id);
  if (!ok) {
    return NextResponse.json({ error: "Introuvable" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
