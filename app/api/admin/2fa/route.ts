/**
 * Gestion du 2FA admin.
 *
 * GET     → état du 2FA (activé ou non)
 * POST    → générer un nouveau secret + URI otpauth (preview, pas activé)
 * PATCH   → confirmer l'enrôlement avec un premier code (active le 2FA)
 * DELETE  → désactiver le 2FA (nécessite un code valide)
 */

import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminApi } from "@/lib/require-admin";
import {
  getTotpSecret,
  setTotpSecret,
  clearTotpSecret,
  isTotpEnabled,
} from "@/lib/auth";
import { generateSecret, verifyCode, buildOtpauthUri, buildQrUrl } from "@/lib/totp";
import { logger } from "@/lib/logger";
import { logActivity } from "@/lib/activity-log";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Session "pending enrollment" stockée en mémoire process (assez pour la démo)
const pendingSecrets = new Map<string, { secret: string; createdAt: number }>();
const PENDING_TTL_MS = 10 * 60 * 1000;

function cleanupPending() {
  const now = Date.now();
  for (const [k, v] of pendingSecrets.entries()) {
    if (now - v.createdAt > PENDING_TTL_MS) pendingSecrets.delete(k);
  }
}

export async function GET(req: Request) {
  const auth = await requireAdminApi(req);
  if (!auth.ok) return auth.response;
  return NextResponse.json({ enabled: await isTotpEnabled() });
}

export async function POST(req: Request) {
  const auth = await requireAdminApi(req);
  if (!auth.ok) return auth.response;
  cleanupPending();
  const secret = generateSecret();
  const uri = buildOtpauthUri("admin", secret);
  // Stocke pendant 10 min, indexé par token de session
  const sessionKey = "admin"; // mono-user pour la démo
  pendingSecrets.set(sessionKey, { secret, createdAt: Date.now() });
  return NextResponse.json({
    secret,
    otpauthUri: uri,
    qrUrl: buildQrUrl(uri),
    note: "Scannez ce QR code dans votre app d'authentification puis confirmez avec un code.",
  });
}

const ConfirmSchema = z.object({ code: z.string().min(6).max(7) });

export async function PATCH(req: Request) {
  const auth = await requireAdminApi(req);
  if (!auth.ok) return auth.response;
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON invalide" }, { status: 400 });
  }
  const parsed = ConfirmSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ error: "Code invalide" }, { status: 400 });
  }
  cleanupPending();
  const pending = pendingSecrets.get("admin");
  if (!pending) {
    return NextResponse.json(
      { error: "Aucun enrôlement en cours. Recommencez." },
      { status: 400 },
    );
  }
  if (!verifyCode(pending.secret, parsed.data.code)) {
    return NextResponse.json({ error: "Code incorrect." }, { status: 400 });
  }
  await setTotpSecret(pending.secret);
  pendingSecrets.delete("admin");
  logger.info("admin.2fa_enabled");
  void logActivity("auth.login", "2FA activé sur le compte admin");
  return NextResponse.json({ ok: true, enabled: true });
}

export async function DELETE(req: Request) {
  const auth = await requireAdminApi(req);
  if (!auth.ok) return auth.response;
  const url = new URL(req.url);
  const code = url.searchParams.get("code") ?? "";
  const secret = await getTotpSecret();
  if (!secret) {
    return NextResponse.json({ error: "2FA déjà désactivé" }, { status: 400 });
  }
  if (!verifyCode(secret, code)) {
    return NextResponse.json({ error: "Code invalide" }, { status: 400 });
  }
  await clearTotpSecret();
  logger.info("admin.2fa_disabled");
  void logActivity("auth.login", "2FA désactivé sur le compte admin");
  return NextResponse.json({ ok: true, enabled: false });
}
