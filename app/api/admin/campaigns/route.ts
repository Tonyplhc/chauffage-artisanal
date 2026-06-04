import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/require-admin";
import {
  listCampaigns,
  saveCampaign,
  deleteCampaign,
  processScheduledCampaigns,
  CampaignSchema,
} from "@/lib/scheduled-campaigns";
import { logActivity } from "@/lib/activity-log";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const auth = await requireAdminApi(req);
  if (!auth.ok) return auth.response;
  // Trigger lazy du processeur à chaque GET (best-effort)
  void processScheduledCampaigns();
  const campaigns = await listCampaigns();
  return NextResponse.json({ campaigns });
}

export async function POST(req: Request) {
  const auth = await requireAdminApi(req);
  if (!auth.ok) return auth.response;
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON invalide" }, { status: 400 });
  }
  const parsed = CampaignSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Données invalides", details: parsed.error.flatten() },
      { status: 400 },
    );
  }
  const saved = await saveCampaign(parsed.data);
  void logActivity(
    "lead.template_sent",
    `Campagne programmée · ${saved.subject} pour le ${new Date(saved.scheduledAt).toLocaleString("fr-FR")}`,
    { meta: { id: saved.id } },
  );
  return NextResponse.json({ campaign: saved });
}

export async function DELETE(req: Request) {
  const auth = await requireAdminApi(req);
  if (!auth.ok) return auth.response;
  const url = new URL(req.url);
  const id = url.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id manquant" }, { status: 400 });
  const ok = await deleteCampaign(id);
  if (!ok) return NextResponse.json({ error: "Campagne introuvable" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
