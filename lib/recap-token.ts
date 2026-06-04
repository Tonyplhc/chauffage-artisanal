/**
 * Token HMAC pour la page récap publique d'un lead.
 *
 * Usage :
 *   1. Lors de la création du lead, on génère `token = makeRecapToken(reference)`.
 *   2. On l'inclut dans l'email envoyé au client : `/devis/recap/<ref>?t=<token>`.
 *   3. La page valide via `verifyRecapToken(reference, token)`.
 *
 * Le token ne donne pas accès à l'admin — il prouve juste « celui qui possède ce
 * lien a légitimement reçu la confirmation de soumission ».
 *
 * Pas de TTL : la référence + le secret suffisent. Si besoin de révocation,
 * tourner SESSION_SECRET invalide tous les tokens.
 */

import { createHmac, timingSafeEqual } from "node:crypto";

function secret(): string {
  const s = process.env.SESSION_SECRET;
  if (s && s.length >= 16) return s;
  if (process.env.NODE_ENV === "production") {
    throw new Error("[recap-token] SESSION_SECRET manquant en production.");
  }
  return "dev-only-secret-change-me-in-prod-32chars-minimum";
}

export function makeRecapToken(reference: string): string {
  return createHmac("sha256", secret())
    .update(`recap:${reference}`)
    .digest("base64url")
    .slice(0, 32); // 32 chars suffisent largement
}

export function verifyRecapToken(reference: string, token: string | undefined): boolean {
  if (!token) return false;
  const expected = makeRecapToken(reference);
  if (token.length !== expected.length) return false;
  try {
    return timingSafeEqual(Buffer.from(token), Buffer.from(expected));
  } catch {
    return false;
  }
}
