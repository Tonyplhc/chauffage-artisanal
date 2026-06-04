/**
 * GET /api/email-track/c/<id>?u=<url>
 * Redirige vers l'URL d'origine et incrémente le compteur de clics.
 */

import { NextResponse } from "next/server";
import { recordClick } from "@/lib/email-tracking-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  req: Request,
  { params }: { params: { id: string } },
) {
  const url = new URL(req.url);
  const target = url.searchParams.get("u");
  if (!target) {
    return NextResponse.json({ error: "missing target" }, { status: 400 });
  }
  let safeTarget: URL;
  try {
    safeTarget = new URL(target);
  } catch {
    return NextResponse.json({ error: "invalid url" }, { status: 400 });
  }
  // Refuser non-http(s)
  if (safeTarget.protocol !== "http:" && safeTarget.protocol !== "https:") {
    return NextResponse.json({ error: "blocked protocol" }, { status: 400 });
  }
  void recordClick(params.id, target);
  return NextResponse.redirect(safeTarget.toString(), 302);
}
