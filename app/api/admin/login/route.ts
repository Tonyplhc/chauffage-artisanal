import { NextResponse } from "next/server";
import { z } from "zod";
import {
  checkPassword,
  createSession,
  SESSION_COOKIE,
  getBruteForceState,
  recordFailedAttempt,
  clearAttempts,
  getTotpSecret,
} from "@/lib/auth";
import { verifyCode } from "@/lib/totp";
import { clientKey } from "@/lib/rate-limit";
import { logger } from "@/lib/logger";
import { logActivity } from "@/lib/activity-log";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const Schema = z.object({
  password: z.string().min(1).max(200),
  totp: z.string().max(10).optional(),
});

export async function POST(req: Request) {
  const ip = clientKey(req.headers);
  const state = getBruteForceState(ip);
  if (state.locked) {
    return NextResponse.json(
      {
        error: `Trop d'échecs. Réessayez dans ${Math.ceil(state.remainingMs / 60_000)} min.`,
        lockedUntilMs: state.remainingMs,
      },
      { status: 429 },
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON invalide" }, { status: 400 });
  }

  const parsed = Schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Données invalides" }, { status: 400 });
  }

  if (!checkPassword(parsed.data.password)) {
    recordFailedAttempt(ip);
    const s = getBruteForceState(ip);
    logger.warn("admin.login_failed", { ip, attemptsLeft: s.attemptsLeft });
    return NextResponse.json(
      { error: "Mot de passe incorrect.", attemptsLeft: s.attemptsLeft },
      { status: 401 },
    );
  }

  // Si 2FA activé, exiger le code TOTP
  const totpSecret = await getTotpSecret();
  if (totpSecret) {
    const code = parsed.data.totp ?? "";
    if (!code) {
      // Premier passage : on indique que le 2FA est requis sans rien révéler
      return NextResponse.json(
        { ok: false, twoFactorRequired: true },
        { status: 200 },
      );
    }
    if (!verifyCode(totpSecret, code)) {
      recordFailedAttempt(ip);
      const s = getBruteForceState(ip);
      logger.warn("admin.totp_failed", { ip, attemptsLeft: s.attemptsLeft });
      return NextResponse.json(
        {
          error: "Code 2FA incorrect.",
          twoFactorRequired: true,
          attemptsLeft: s.attemptsLeft,
        },
        { status: 401 },
      );
    }
  }

  clearAttempts(ip);
  logger.info("admin.login_success", { ip, twoFactor: !!totpSecret });
  void logActivity("auth.login", `Connexion admin${totpSecret ? " · 2FA" : ""}`, {});
  const { token, expiresAt } = createSession();

  const res = NextResponse.json({ ok: true });
  res.cookies.set({
    name: SESSION_COOKIE,
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
  return res;
}
