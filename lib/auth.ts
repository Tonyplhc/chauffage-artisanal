/**
 * Authentification admin — session signée HMAC + protection brute-force.
 *
 * Configuration (.env.local) :
 *   ADMIN_PASSWORD=...         mot de passe admin (texte brut, comparaison constante)
 *   SESSION_SECRET=...         clé HMAC ≥ 32 caractères (générée aléatoirement en prod)
 *   SESSION_TTL_HOURS=12       durée de session (défaut 12h)
 *
 * En l'absence de SESSION_SECRET en prod, l'auth échoue à l'init (volontaire).
 * En dev, un secret par défaut est utilisé avec un warning console.
 */

import { createHmac, timingSafeEqual, randomBytes } from "node:crypto";
import type { Role } from "./users-store";

const COOKIE_NAME = "ca-admin-session";
const DEFAULT_TTL_HOURS = 12;

type Session = {
  role: Role | "admin"; // legacy single-user "admin" si pas de users-store
  userId?: string;
  email?: string;
  iat: number; // issued at (ms)
  exp: number; // expires at (ms)
  jti: string; // unique id (anti-replay si besoin)
};

function secret(): string {
  const s = process.env.SESSION_SECRET;
  if (s && s.length >= 16) return s;
  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "[auth] SESSION_SECRET manquant ou trop court (≥16 chars requis en production).",
    );
  }
  // Dev fallback — clé en clair (ne JAMAIS utiliser en prod)
  return "dev-only-secret-change-me-in-prod-32chars-minimum";
}

function sign(payload: string): string {
  return createHmac("sha256", secret()).update(payload).digest("base64url");
}

function b64(s: string): string {
  return Buffer.from(s, "utf8").toString("base64url");
}
function unb64(s: string): string {
  return Buffer.from(s, "base64url").toString("utf8");
}

function ttlMs(): number {
  const h = Number(process.env.SESSION_TTL_HOURS ?? DEFAULT_TTL_HOURS);
  return (Number.isFinite(h) ? h : DEFAULT_TTL_HOURS) * 60 * 60 * 1000;
}

export function createSession(extra?: {
  userId?: string;
  email?: string;
  role?: Role;
}): { token: string; expiresAt: Date } {
  const now = Date.now();
  const ttl = ttlMs();
  const session: Session = {
    role: extra?.role ?? "admin",
    userId: extra?.userId,
    email: extra?.email,
    iat: now,
    exp: now + ttl,
    jti: randomBytes(12).toString("hex"),
  };
  const payload = b64(JSON.stringify(session));
  const signature = sign(payload);
  return { token: `${payload}.${signature}`, expiresAt: new Date(session.exp) };
}

const VALID_ROLES = new Set(["admin", "commercial", "viewer"]);

export function verifySession(token: string | undefined): Session | null {
  if (!token) return null;
  const parts = token.split(".");
  if (parts.length !== 2) return null;
  const [payload, signature] = parts;
  const expectedSig = sign(payload);
  const a = Buffer.from(signature);
  const b = Buffer.from(expectedSig);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  let session: Session;
  try {
    session = JSON.parse(unb64(payload)) as Session;
  } catch {
    return null;
  }
  if (!session.exp || Date.now() > session.exp) return null;
  if (!VALID_ROLES.has(session.role)) return null;
  return session;
}

export const SESSION_COOKIE = COOKIE_NAME;

/* ───────────────────── Vérification password ───────────────────── */

export function checkPassword(input: string): boolean {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected || expected.length < 4) {
    // Pas de password configuré — refus systématique
    return false;
  }
  if (input.length !== expected.length) {
    // Comparaison constante quand même pour limiter l'oracle
    const dummy = Buffer.from(expected.padEnd(input.length, " "));
    const got = Buffer.from(input.padEnd(expected.length, " "));
    try {
      timingSafeEqual(dummy.slice(0, got.length), got.slice(0, dummy.length));
    } catch {}
    return false;
  }
  return timingSafeEqual(Buffer.from(input), Buffer.from(expected));
}

/* ───────────────────── 2FA helpers ───────────────────── */

/**
 * Le secret TOTP est stocké côté serveur dans une variable d'env (ou dans un
 * fichier `data/2fa-secret.txt` créé par la page d'enrôlement). Si aucun
 * secret n'est configuré, le 2FA est désactivé (rétrocompat dev).
 */
import { promises as fs } from "node:fs";
import path from "node:path";

const SECRET_FILE = path.join(process.cwd(), "data", "2fa-secret.txt");

export async function getTotpSecret(): Promise<string | null> {
  // Priorité au fichier (généré lors de l'enrôlement) puis env
  try {
    const raw = await fs.readFile(SECRET_FILE, "utf8");
    const trimmed = raw.trim();
    if (trimmed.length >= 16) return trimmed;
  } catch {
    // pas de fichier
  }
  const env = process.env.ADMIN_TOTP_SECRET;
  return env && env.length >= 16 ? env : null;
}

export async function setTotpSecret(secret: string): Promise<void> {
  const dir = path.dirname(SECRET_FILE);
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(SECRET_FILE, secret, "utf8");
}

export async function clearTotpSecret(): Promise<void> {
  try {
    await fs.unlink(SECRET_FILE);
  } catch {}
}

export async function isTotpEnabled(): Promise<boolean> {
  return (await getTotpSecret()) !== null;
}

/* ───────────────────── Brute-force protection ───────────────────── */

type Attempt = { count: number; lockedUntil: number };
const attempts = new Map<string, Attempt>();

const MAX_ATTEMPTS = 5;
const LOCKOUT_MS = 15 * 60 * 1000; // 15 minutes

export function getBruteForceState(ip: string): {
  locked: boolean;
  remainingMs: number;
  attemptsLeft: number;
} {
  const a = attempts.get(ip);
  const now = Date.now();
  if (!a || a.lockedUntil <= now) {
    return { locked: false, remainingMs: 0, attemptsLeft: MAX_ATTEMPTS };
  }
  return {
    locked: a.count >= MAX_ATTEMPTS,
    remainingMs: a.lockedUntil - now,
    attemptsLeft: Math.max(0, MAX_ATTEMPTS - a.count),
  };
}

export function recordFailedAttempt(ip: string): void {
  const a = attempts.get(ip) ?? { count: 0, lockedUntil: 0 };
  a.count += 1;
  a.lockedUntil = Date.now() + LOCKOUT_MS;
  attempts.set(ip, a);
}

export function clearAttempts(ip: string): void {
  attempts.delete(ip);
}

setInterval(() => {
  const now = Date.now();
  for (const [k, v] of attempts.entries()) {
    if (v.lockedUntil <= now) attempts.delete(k);
  }
}, 60_000);
