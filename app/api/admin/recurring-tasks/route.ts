/**
 * GET  /api/admin/recurring-tasks → liste + stats
 * POST /api/admin/recurring-tasks → création
 */

import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/require-admin";
import {
  listTasks,
  createTask,
  computeStats,
} from "@/lib/recurring-tasks-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const auth = await requireAdminApi(req);
  if (!auth.ok) return auth.response;
  const [tasks, stats] = await Promise.all([listTasks(), computeStats()]);
  return NextResponse.json({ tasks, stats });
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
    const task = await createTask(body as never);
    return NextResponse.json({ task });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Erreur" },
      { status: 400 },
    );
  }
}
