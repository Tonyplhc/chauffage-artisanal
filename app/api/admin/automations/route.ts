import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/require-admin";
import {
  listRules,
  saveRule,
  deleteRule,
  AutomationRuleSchema,
} from "@/lib/automations-store";
import { logger } from "@/lib/logger";
import { logActivity } from "@/lib/activity-log";
import { processDelayedActions } from "@/lib/delayed-actions-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const auth = await requireAdminApi(req);
  if (!auth.ok) return auth.response;
  // Trigger lazy du processeur d'actions retardées
  void processDelayedActions();
  const rules = await listRules();
  return NextResponse.json({ rules });
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
  const parsed = AutomationRuleSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Données invalides", details: parsed.error.flatten() },
      { status: 400 },
    );
  }
  const saved = await saveRule(parsed.data);
  logger.info("admin.automation_saved", { id: saved.id, name: saved.name });
  void logActivity("auth.login", `Règle d'automation sauvegardée · ${saved.name}`, {
    meta: { ruleId: saved.id },
  });
  return NextResponse.json({ rule: saved });
}

export async function DELETE(req: Request) {
  const auth = await requireAdminApi(req, { roles: ["admin"] });
  if (!auth.ok) return auth.response;
  const url = new URL(req.url);
  const id = url.searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "id manquant" }, { status: 400 });
  }
  const ok = await deleteRule(id);
  if (!ok) {
    return NextResponse.json({ error: "Règle introuvable" }, { status: 404 });
  }
  void logActivity("auth.login", `Règle d'automation supprimée · ${id}`);
  return NextResponse.json({ ok: true });
}
