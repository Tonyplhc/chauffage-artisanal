/**
 * GET  /api/admin/maintenance       → liste + stats + lazy ensureUpcomingReminders
 * POST /api/admin/maintenance       → création contrat
 */

import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/require-admin";
import {
  listContracts,
  createContract,
  computeStats,
  ensureUpcomingReminders,
} from "@/lib/maintenance-contracts-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const auth = await requireAdminApi(req);
  if (!auth.ok) return auth.response;
  // Lazy trigger : crée les rappels manquants pour les contrats dont
  // l'échéance approche.
  await ensureUpcomingReminders();
  const [contracts, stats] = await Promise.all([
    listContracts(),
    computeStats(),
  ]);
  return NextResponse.json({ contracts, stats });
}

export async function POST(req: Request) {
  const auth = await requireAdminApi(req);
  if (!auth.ok) return auth.response;
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON invalide" }, { status: 400 });
  }
  try {
    const contract = await createContract(body as never);
    return NextResponse.json({ contract });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Erreur" },
      { status: 400 },
    );
  }
}
