/**
 * GET  /api/admin/views                        → liste accessible pour le user
 * POST /api/admin/views { name, isShared, state } → création
 */

import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/require-admin";
import { listViewsFor, createView } from "@/lib/saved-views-store";
import { logActivity } from "@/lib/activity-log";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const auth = await requireAdminApi(req);
  if (!auth.ok) return auth.response;
  const email = (auth.session as { email?: string } | undefined)?.email;
  const views = await listViewsFor(email);
  return NextResponse.json({ views });
}

export async function POST(req: Request) {
  const auth = await requireAdminApi(req);
  if (!auth.ok) return auth.response;
  const email = (auth.session as { email?: string } | undefined)?.email;
  let body: { name?: string; isShared?: boolean; state?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON invalide" }, { status: 400 });
  }
  if (!body.name || typeof body.state !== "object" || body.state === null) {
    return NextResponse.json(
      { error: "name et state requis" },
      { status: 400 },
    );
  }
  try {
    const v = await createView({
      name: body.name,
      isShared: !!body.isShared,
      ownerEmail: email,
      state: body.state as never,
    });
    void logActivity("admin.view_saved", `Vue créée : ${v.name}`, {
      meta: { id: v.id, isShared: v.isShared },
    });
    return NextResponse.json({ view: v });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Erreur" },
      { status: 400 },
    );
  }
}
