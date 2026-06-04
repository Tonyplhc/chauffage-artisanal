/**
 * GET  /api/admin/tags  → liste du dictionnaire
 * POST /api/admin/tags  { label, color } → création
 */

import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/require-admin";
import { listTags, createTag } from "@/lib/tags-store";
import { logActivity } from "@/lib/activity-log";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const auth = await requireAdminApi(req);
  if (!auth.ok) return auth.response;
  const tags = await listTags();
  return NextResponse.json({ tags });
}

export async function POST(req: Request) {
  const auth = await requireAdminApi(req);
  if (!auth.ok) return auth.response;
  let body: { label?: string; color?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON invalide" }, { status: 400 });
  }
  if (!body.label || !body.color) {
    return NextResponse.json(
      { error: "label et color requis" },
      { status: 400 },
    );
  }
  try {
    const tag = await createTag({ label: body.label, color: body.color });
    void logActivity("admin.tag_created", `Tag créé : ${tag.label}`, {
      meta: { id: tag.id, color: tag.color },
    });
    return NextResponse.json({ tag });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Erreur" },
      { status: 400 },
    );
  }
}
