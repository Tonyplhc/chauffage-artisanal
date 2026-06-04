import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/require-admin";
import {
  listExperiments,
  saveExperiment,
  deleteExperiment,
  ExperimentSchema,
} from "@/lib/experiments-store";
import { logActivity } from "@/lib/activity-log";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const auth = await requireAdminApi(req);
  if (!auth.ok) return auth.response;
  const experiments = await listExperiments();
  return NextResponse.json({ experiments });
}

export async function POST(req: Request) {
  const auth = await requireAdminApi(req, { roles: ["admin"] });
  if (!auth.ok) return auth.response;
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON invalide" }, { status: 400 });
  }
  const parsed = ExperimentSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Données invalides", details: parsed.error.flatten() },
      { status: 400 },
    );
  }
  const saved = await saveExperiment(parsed.data);
  void logActivity("auth.login", `Expérience A/B sauvegardée · ${saved.name}`, {
    meta: { id: saved.id, target: saved.target },
  });
  return NextResponse.json({ experiment: saved });
}

export async function DELETE(req: Request) {
  const auth = await requireAdminApi(req, { roles: ["admin"] });
  if (!auth.ok) return auth.response;
  const url = new URL(req.url);
  const id = url.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id manquant" }, { status: 400 });
  const ok = await deleteExperiment(id);
  if (!ok) return NextResponse.json({ error: "Introuvable" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
