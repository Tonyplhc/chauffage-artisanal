/**
 * GET  /api/admin/reminders?lead=&pending=1   → liste filtrée
 * POST /api/admin/reminders { leadReference, dueAt, note } → création
 *
 * Côté lecture : on lance d'abord `processDueReminders` (lazy trigger) pour
 * marquer les rappels échus comme "fired" — c'est ce qui alimente le compteur
 * d'événements du foreground notifier via le bus SSE.
 */

import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/require-admin";
import {
  listReminders,
  createReminder,
  processDueReminders,
} from "@/lib/reminders-store";
import { logActivity } from "@/lib/activity-log";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const auth = await requireAdminApi(req);
  if (!auth.ok) return auth.response;
  // Lazy : traite ceux qui viennent d'arriver à échéance
  await processDueReminders();
  const url = new URL(req.url);
  const lead = url.searchParams.get("lead") ?? undefined;
  const pendingOnly = url.searchParams.get("pending") === "1";
  const firedOnly = url.searchParams.get("fired") === "1";
  const reminders = await listReminders({
    leadReference: lead,
    pendingOnly,
    firedOnly,
  });
  return NextResponse.json({ reminders });
}

export async function POST(req: Request) {
  const auth = await requireAdminApi(req);
  if (!auth.ok) return auth.response;
  const email = (auth.session as { email?: string } | undefined)?.email;
  let body: { leadReference?: string; dueAt?: string; note?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON invalide" }, { status: 400 });
  }
  if (!body.leadReference || !body.dueAt) {
    return NextResponse.json(
      { error: "leadReference et dueAt requis" },
      { status: 400 },
    );
  }
  try {
    const r = await createReminder({
      leadReference: body.leadReference,
      dueAt: body.dueAt,
      note: body.note ?? "",
      createdBy: email,
    });
    void logActivity(
      "lead.reminder_created",
      `Rappel pour ${new Date(r.dueAt).toLocaleString("fr-FR")}`,
      { reference: r.leadReference, meta: { id: r.id, note: r.note } },
    );
    return NextResponse.json({ reminder: r });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Erreur" },
      { status: 400 },
    );
  }
}
