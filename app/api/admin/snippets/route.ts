/**
 * GET  /api/admin/snippets               → liste (avec ?category=)
 * POST /api/admin/snippets { title, category, content } → création
 */

import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/require-admin";
import { listSnippets, createSnippet } from "@/lib/snippets-store";
import { logActivity } from "@/lib/activity-log";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const auth = await requireAdminApi(req);
  if (!auth.ok) return auth.response;
  const url = new URL(req.url);
  const category = url.searchParams.get("category");
  const all = await listSnippets();
  const filtered = category
    ? all.filter((s) => s.category.toLowerCase() === category.toLowerCase())
    : all;
  // Tri : usage desc, puis updatedAt desc
  const sorted = [...filtered].sort((a, b) => {
    if (b.usageCount !== a.usageCount) return b.usageCount - a.usageCount;
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
  });
  const categories = [...new Set(all.map((s) => s.category))].sort();
  return NextResponse.json({ snippets: sorted, categories });
}

export async function POST(req: Request) {
  const auth = await requireAdminApi(req);
  if (!auth.ok) return auth.response;
  let body: { title?: string; category?: string; content?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON invalide" }, { status: 400 });
  }
  if (!body.title || !body.content) {
    return NextResponse.json(
      { error: "title et content requis" },
      { status: 400 },
    );
  }
  try {
    const snip = await createSnippet({
      title: body.title,
      category: body.category ?? "Général",
      content: body.content,
    });
    void logActivity("admin.snippet_created", `Snippet créé : ${snip.title}`, {
      meta: { id: snip.id, category: snip.category },
    });
    return NextResponse.json({ snippet: snip });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Erreur" },
      { status: 400 },
    );
  }
}
