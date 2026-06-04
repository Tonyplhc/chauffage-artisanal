/**
 * Token HMAC pour les liens de parrainage publics.
 *
 * Format : `referral:<parrainRef>`. Cas typique :
 *   - Lead converti DEV-2026-1234 → token unique
 *   - Lien public partageable : /parrainage/DEV-2026-1234?t=<token>
 *   - Au click, redirection vers /devis avec le token persisté
 */

import { createHmac, timingSafeEqual } from "node:crypto";

function secret(): string {
  const s = process.env.SESSION_SECRET;
  if (s && s.length >= 16) return s;
  if (process.env.NODE_ENV === "production") {
    throw new Error("[referral-token] SESSION_SECRET manquant en prod.");
  }
  return "dev-only-secret-change-me-in-prod-32chars-minimum";
}

export function makeReferralToken(reference: string): string {
  return createHmac("sha256", secret())
    .update(`referral:${reference}`)
    .digest("base64url")
    .slice(0, 32);
}

export function verifyReferralToken(
  reference: string,
  token: string | undefined,
): boolean {
  if (!token) return false;
  const expected = makeReferralToken(reference);
  if (token.length !== expected.length) return false;
  try {
    return timingSafeEqual(Buffer.from(token), Buffer.from(expected));
  } catch {
    return false;
  }
}
