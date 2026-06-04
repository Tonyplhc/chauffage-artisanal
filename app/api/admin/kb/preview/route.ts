/**
 * POST /api/admin/kb/preview { content } → HTML rendu.
 *
 * Endpoint utilitaire pour le live preview du markdown.
 */

import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/require-admin";
import { renderMarkdownLight } from "@/lib/kb-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const auth = await requireAdminApi(req);
  if (!auth.ok) return auth.response;
  let body: { content?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON invalide" }, { status: 400 });
  }
  const content = String(body.content ?? "").slice(0, 50_000);
  return NextResponse.json({ rendered: renderMarkdownLight(content) });
}
