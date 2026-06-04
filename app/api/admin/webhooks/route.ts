import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/require-admin";
import {
  listWebhooks,
  saveWebhook,
  deleteWebhook,
  testWebhook,
  CustomWebhookSchema,
  WEBHOOK_EVENTS,
} from "@/lib/custom-webhooks-store";
import { logActivity } from "@/lib/activity-log";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const auth = await requireAdminApi(req);
  if (!auth.ok) return auth.response;
  const webhooks = await listWebhooks();
  return NextResponse.json({ webhooks, events: WEBHOOK_EVENTS });
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

  // Action spéciale "test"
  if (
    typeof raw === "object" &&
    raw !== null &&
    "action" in raw &&
    (raw as { action: string }).action === "test"
  ) {
    const parsed = CustomWebhookSchema.safeParse(
      (raw as { webhook: unknown }).webhook,
    );
    if (!parsed.success) {
      return NextResponse.json({ error: "Webhook invalide" }, { status: 400 });
    }
    const result = await testWebhook(parsed.data);
    return NextResponse.json(result);
  }

  // Sauvegarde
  const parsed = CustomWebhookSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Données invalides", details: parsed.error.flatten() },
      { status: 400 },
    );
  }
  const saved = await saveWebhook(parsed.data);
  void logActivity("auth.login", `Webhook custom sauvegardé · ${saved.name}`, {
    meta: { id: saved.id, events: saved.events },
  });
  return NextResponse.json({ webhook: saved });
}

export async function DELETE(req: Request) {
  const auth = await requireAdminApi(req, { roles: ["admin"] });
  if (!auth.ok) return auth.response;
  const url = new URL(req.url);
  const id = url.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id manquant" }, { status: 400 });
  const ok = await deleteWebhook(id);
  if (!ok) return NextResponse.json({ error: "Webhook introuvable" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
