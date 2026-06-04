import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/require-admin";
import {
  listKeys,
  createKey,
  revokeKey,
  deleteKey,
  ApiKeyCreateSchema,
  SCOPES,
} from "@/lib/api-keys-store";
import { logActivity } from "@/lib/activity-log";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const auth = await requireAdminApi(req);
  if (!auth.ok) return auth.response;
  const keys = await listKeys();
  return NextResponse.json({ keys, scopes: SCOPES });
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
  const parsed = ApiKeyCreateSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Données invalides", details: parsed.error.flatten() },
      { status: 400 },
    );
  }
  const { apiKey, rawKey } = await createKey(parsed.data.label, parsed.data.scopes);
  void logActivity("auth.login", `API key créée · ${apiKey.label}`, {
    meta: { id: apiKey.id, scopes: apiKey.scopes },
  });
  // On renvoie la clé en clair UNE SEULE FOIS — à conserver précieusement
  return NextResponse.json({ apiKey, rawKey });
}

export async function DELETE(req: Request) {
  const auth = await requireAdminApi(req, { roles: ["admin"] });
  if (!auth.ok) return auth.response;
  const url = new URL(req.url);
  const id = url.searchParams.get("id");
  const action = url.searchParams.get("action") ?? "delete";
  if (!id) return NextResponse.json({ error: "id manquant" }, { status: 400 });
  if (action === "revoke") {
    const ok = await revokeKey(id);
    if (!ok) return NextResponse.json({ error: "Introuvable" }, { status: 404 });
    return NextResponse.json({ ok: true, action: "revoked" });
  }
  const ok = await deleteKey(id);
  if (!ok) return NextResponse.json({ error: "Introuvable" }, { status: 404 });
  return NextResponse.json({ ok: true, action: "deleted" });
}
