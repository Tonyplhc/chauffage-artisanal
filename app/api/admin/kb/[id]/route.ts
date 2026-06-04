/**
 * GET    /api/admin/kb/[id]                → article + rendu HTML
 * PATCH  /api/admin/kb/[id]                → édition
 * DELETE /api/admin/kb/[id]                → suppression
 */

import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/require-admin";
import {
  getArticle,
  updateArticle,
  deleteArticle,
  renderMarkdownLight,
} from "@/lib/kb-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  req: Request,
  { params }: { params: { id: string } },
) {
  const auth = await requireAdminApi(req);
  if (!auth.ok) return auth.response;
  const article = await getArticle(params.id);
  if (!article) {
    return NextResponse.json({ error: "Introuvable" }, { status: 404 });
  }
  return NextResponse.json({
    article,
    rendered: renderMarkdownLight(article.content),
  });
}

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } },
) {
  const auth = await requireAdminApi(req);
  if (!auth.ok) return auth.response;
  const email = (auth.session as { email?: string } | undefined)?.email;
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON invalide" }, { status: 400 });
  }
  try {
    const article = await updateArticle(params.id, body as never, email);
    if (!article) {
      return NextResponse.json({ error: "Introuvable" }, { status: 404 });
    }
    return NextResponse.json({
      article,
      rendered: renderMarkdownLight(article.content),
    });
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
  await deleteArticle(params.id);
  return NextResponse.json({ ok: true });
}
