/**
 * Token HMAC pour le feed iCal admin.
 *
 * Pattern aligné avec recap-token / nps-token / referral-token.
 *
 * Le scope est `calendar:admin` (feed global) ou `calendar:<userEmail>` pour
 * un feed personnel filtré sur les RDV assignés à un user.
 */

import { createHmac, timingSafeEqual } from "node:crypto";

function secret(): string {
  const s = process.env.SESSION_SECRET;
  if (s && s.length >= 16) return s;
  if (process.env.NODE_ENV === "production") {
    throw new Error("[ical-token] SESSION_SECRET manquant en prod.");
  }
  return "dev-only-secret-change-me-in-prod-32chars-minimum";
}

export function makeIcalToken(scope: string): string {
  return createHmac("sha256", secret())
    .update(`calendar:${scope}`)
    .digest("base64url")
    .slice(0, 32);
}

export function verifyIcalToken(
  scope: string,
  token: string | undefined,
): boolean {
  if (!token) return false;
  const expected = makeIcalToken(scope);
  if (token.length !== expected.length) return false;
  try {
    return timingSafeEqual(Buffer.from(token), Buffer.from(expected));
  } catch {
    return false;
  }
}
