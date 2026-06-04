/**
 * Token HMAC pour les enquêtes NPS publiques.
 *
 * Format : `nps:<surveyId>`. Validation par timing-safe compare.
 */

import { createHmac, timingSafeEqual } from "node:crypto";

function secret(): string {
  const s = process.env.SESSION_SECRET;
  if (s && s.length >= 16) return s;
  if (process.env.NODE_ENV === "production") {
    throw new Error("[nps-token] SESSION_SECRET manquant en production.");
  }
  return "dev-only-secret-change-me-in-prod-32chars-minimum";
}

export function makeNpsToken(surveyId: string): string {
  return createHmac("sha256", secret())
    .update(`nps:${surveyId}`)
    .digest("base64url")
    .slice(0, 32);
}

export function verifyNpsToken(surveyId: string, token: string | undefined): boolean {
  if (!token) return false;
  const expected = makeNpsToken(surveyId);
  if (token.length !== expected.length) return false;
  try {
    return timingSafeEqual(Buffer.from(token), Buffer.from(expected));
  } catch {
    return false;
  }
}
