/**
 * GET  /api/admin/dispatch?from=&to=&technicianEmail=  → slots + conflits + techniciens
 * POST /api/admin/dispatch                              → création slot
 */

import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/require-admin";
import {
  listSlots,
  createSlot,
  detectConflicts,
  listTechnicians,
} from "@/lib/dispatch-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const auth = await requireAdminApi(req);
  if (!auth.ok) return auth.response;
  const url = new URL(req.url);
  const slots = await listSlots({
    from: url.searchParams.get("from") ?? undefined,
    to: url.searchParams.get("to") ?? undefined,
    technicianEmail:
      url.searchParams.get("technicianEmail") ?? undefined,
  });
  const conflicts = [...detectConflicts(slots)];
  const technicians = await listTechnicians();
  return NextResponse.json({ slots, conflicts, technicians });
}

export async function POST(req: Request) {
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
    const slot = await createSlot({ ...body, createdBy: email } as never);
    return NextResponse.json({ slot });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Erreur" },
      { status: 400 },
    );
  }
}
