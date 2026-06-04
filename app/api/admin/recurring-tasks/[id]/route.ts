/**
 * PATCH  /api/admin/recurring-tasks/[id] → édition (body.markDone=true pour avancer)
 * DELETE /api/admin/recurring-tasks/[id]
 */

import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/require-admin";
import {
  updateTask,
  deleteTask,
  markDone,
} from "@/lib/recurring-tasks-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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
  if (body.markDone === true) {
    const task = await markDone(params.id);
    if (!task) {
      return NextResponse.json({ error: "Introuvable" }, { status: 404 });
    }
    return NextResponse.json({ task });
  }
  try {
    const task = await updateTask(params.id, body as never);
    if (!task) {
      return NextResponse.json({ error: "Introuvable" }, { status: 404 });
    }
    return NextResponse.json({ task });
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
  await deleteTask(params.id);
  return NextResponse.json({ ok: true });
}
