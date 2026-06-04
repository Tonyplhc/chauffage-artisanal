/**
 * GET /api/v1/articles
 * Auth : Bearer token API key avec scope read:articles.
 * Renvoie les articles publics.
 */

import { NextResponse } from "next/server";
import { extractApiKey, verifyKey } from "@/lib/api-keys-store";
import { ARTICLES } from "@/lib/articles";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const raw = extractApiKey(req);
  if (!raw) {
    return NextResponse.json({ error: "missing_api_key" }, { status: 401 });
  }
  const verified = await verifyKey(raw, "read:articles");
  if (!verified.ok) {
    return NextResponse.json(
      { error: verified.error },
      { status: verified.error === "scope_missing" ? 403 : 401 },
    );
  }
  return NextResponse.json({
    data: ARTICLES.map((a) => ({
      slug: a.slug,
      title: a.title,
      excerpt: a.excerpt,
      category: a.category,
      readingMinutes: a.readingMinutes,
      publishedAt: a.publishedAt,
      cover: a.cover,
    })),
    count: ARTICLES.length,
    apiVersion: "v1",
  });
}
