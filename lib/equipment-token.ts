/**
 * Token HMAC pour les fiches équipement publiques (accès via QR code).
 *
 * Format : `equipment:<id>`. Le QR code embarque l'URL avec ce token.
 */

import { createHmac, timingSafeEqual } from "node:crypto";

function secret(): string {
  const s = process.env.SESSION_SECRET;
  if (s && s.length >= 16) return s;
  if (process.env.NODE_ENV === "production") {
    throw new Error("[equipment-token] SESSION_SECRET manquant en prod.");
  }
  return "dev-only-secret-change-me-in-prod-32chars-minimum";
}

export function makeEquipmentToken(equipmentId: string): string {
  return createHmac("sha256", secret())
    .update(`equipment:${equipmentId}`)
    .digest("base64url")
    .slice(0, 32);
}

export function verifyEquipmentToken(
  equipmentId: string,
  token: string | undefined,
): boolean {
  if (!token) return false;
  const expected = makeEquipmentToken(equipmentId);
  if (token.length !== expected.length) return false;
  try {
    return timingSafeEqual(Buffer.from(token), Buffer.from(expected));
  } catch {
    return false;
  }
}
