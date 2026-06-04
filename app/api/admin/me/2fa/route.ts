/**
 * 2FA par utilisateur (admin connecté).
 *
 * GET    → état (enabled true/false)
 * POST   → générer un nouveau secret + uri otpauth (pas encore activé)
 * PATCH  → confirmer avec code → active le 2FA pour l'utilisateur courant
 * DELETE → désactive (nécessite code valide)
 */

import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminApi } from "@/lib/require-admin";
import { getUserByEmail, updateUser } from "@/lib/users-store";
import { generateSecret, verifyCode, buildOtpauthUri, buildQrUrl } from "@/lib/totp";
import { logger } from "@/lib/logger";
import { logActivity } from "@/lib/activity-log";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Pending enrollment par email (mémoire process)
const pending = new Map<string, { secret: string; createdAt: number }>();
const PENDING_TTL_MS = 10 * 60 * 1000;

function cleanup() {
  const now = Date.now();
  for (const [k, v] of pending.entries()) {
    if (now - v.createdAt > PENDING_TTL_MS) pending.delete(k);
  }
}

export async function GET(req: Request) {
  const auth = await requireAdminApi(req);
  if (!auth.ok) return auth.response;
  const email = auth.session.email;
  if (!email) {
    return NextResponse.json({ enabled: false, perUser: false });
  }
  const user = await getUserByEmail(email);
  return NextResponse.json({
    enabled: !!user?.totpSecret,
    perUser: true,
    email,
  });
}

export async function POST(req: Request) {
  const auth = await requireAdminApi(req);
  if (!auth.ok) return auth.response;
  const email = auth.session.email;
  if (!email) {
    return NextResponse.json(
      { error: "Pas d'utilisateur identifié (mode legacy)." },
      { status: 400 },
    );
  }
  cleanup();
  const secret = generateSecret();
  pending.set(email, { secret, createdAt: Date.now() });
  const uri = buildOtpauthUri(email, secret);
  return NextResponse.json({
    secret,
    otpauthUri: uri,
    qrUrl: buildQrUrl(uri),
  });
}

const ConfirmSchema = z.object({ code: z.string().min(6).max(7) });

export async function PATCH(req: Request) {
  const auth = await requireAdminApi(req);
  if (!auth.ok) return auth.response;
  const email = auth.session.email;
  if (!email) {
    return NextResponse.json({ error: "Pas d'email" }, { status: 400 });
  }
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
  cleanup();
  const p = pending.get(email);
  if (!p) {
    return NextResponse.json(
      { error: "Aucun enrôlement en cours" },
      { status: 400 },
    );
  }
  if (!verifyCode(p.secret, parsed.data.code)) {
    return NextResponse.json({ error: "Code incorrect" }, { status: 400 });
  }
  const user = await getUserByEmail(email);
  if (!user) {
    return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 });
  }
  await updateUser(user.id, { totpSecret: p.secret });
  pending.delete(email);
  logger.info("user.2fa_enabled", { email });
  void logActivity("auth.login", `2FA activé sur ${email}`);
  return NextResponse.json({ ok: true, enabled: true });
}

export async function DELETE(req: Request) {
  const auth = await requireAdminApi(req);
  if (!auth.ok) return auth.response;
  const email = auth.session.email;
  if (!email) {
    return NextResponse.json({ error: "Pas d'email" }, { status: 400 });
  }
  const url = new URL(req.url);
  const code = url.searchParams.get("code") ?? "";
  const user = await getUserByEmail(email);
  if (!user?.totpSecret) {
    return NextResponse.json({ error: "2FA déjà désactivé" }, { status: 400 });
  }
  if (!verifyCode(user.totpSecret, code)) {
    return NextResponse.json({ error: "Code invalide" }, { status: 400 });
  }
  await updateUser(user.id, { totpSecret: null });
  void logActivity("auth.login", `2FA désactivé sur ${email}`);
  return NextResponse.json({ ok: true, enabled: false });
}
