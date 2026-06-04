/**
 * PATCH  /api/admin/reminders/[id] { snoozeHours? | dismiss? }
 * DELETE /api/admin/reminders/[id]
 */

import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/require-admin";
import {
  deleteReminder,
  dismissReminder,
  snoozeReminder,
  getReminder,
} from "@/lib/reminders-store";
import { logActivity } from "@/lib/activity-log";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } },
) {
  const auth = await requireAdminApi(req);
  if (!auth.ok) return auth.response;
  let body: { snoozeHours?: unknown; dismiss?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON invalide" }, { status: 400 });
  }
  if (body.dismiss === true) {
    const r = await dismissReminder(params.id);
    if (!r) return NextResponse.json({ error: "Introuvable" }, { status: 404 });
    void logActivity("lead.reminder_cleared", "Rappel marqué comme fait", {
      reference: r.leadReference,
      meta: { id: r.id },
    });
    return NextResponse.json({ reminder: r });
  }
  if (typeof body.snoozeHours === "number" && body.snoozeHours > 0) {
    const r = await snoozeReminder(params.id, body.snoozeHours);
    if (!r) return NextResponse.json({ error: "Introuvable" }, { status: 404 });
    return NextResponse.json({ reminder: r });
  }
  return NextResponse.json(
    { error: "snoozeHours ou dismiss requis" },
    { status: 400 },
  );
}

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } },
) {
  const auth = await requireAdminApi(req);
  if (!auth.ok) return auth.response;
  const before = await getReminder(params.id);
  const ok = await deleteReminder(params.id);
  if (!ok) return NextResponse.json({ error: "Introuvable" }, { status: 404 });
  if (before) {
    void logActivity("lead.reminder_cleared", "Rappel supprimé", {
      reference: before.leadReference,
      meta: { id: before.id },
    });
  }
  return NextResponse.json({ ok: true });
}
