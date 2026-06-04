/**
 * GET    /api/admin/demo-seed → état (nb seeds présents)
 * POST   /api/admin/demo-seed { force?: boolean } → génère 80 leads démo
 * DELETE /api/admin/demo-seed → supprime tous les leads démo
 *
 * Idempotent par défaut : si des seeds sont déjà présents, POST refuse sauf
 * si `force: true`. Permet à l'admin de jouer/rejouer la démo en confiance.
 */

import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/require-admin";
import {
  seedDemoLeads,
  removeDemoLeads,
  countDemoLeads,
} from "@/lib/demo-seed";
import { logActivity } from "@/lib/activity-log";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const auth = await requireAdminApi(req);
  if (!auth.ok) return auth.response;
  const count = await countDemoLeads();
  return NextResponse.json({ count, prefix: "DEV-SEED-" });
}

export async function POST(req: Request) {
  const auth = await requireAdminApi(req);
  if (!auth.ok) return auth.response;
  let body: { force?: boolean } = {};
  try {
    body = await req.json();
  } catch {
    /* body vide accepté */
  }
  const result = await seedDemoLeads({ force: body.force === true });
  if (result.ok) {
    void logActivity(
      "admin.demo_seed_created",
      `Seed démo : ${result.inserted} leads générés`,
      { meta: { totalAfter: result.totalAfter, force: body.force === true } },
    );
  }
  return NextResponse.json({ result });
}

export async function DELETE(req: Request) {
  const auth = await requireAdminApi(req);
  if (!auth.ok) return auth.response;
  const r = await removeDemoLeads();
  if (r.removed > 0) {
    void logActivity(
      "admin.demo_seed_removed",
      `Seed démo : ${r.removed} leads supprimés`,
      { meta: { totalAfter: r.totalAfter } },
    );
  }
  return NextResponse.json({ result: r });
}
