/**
 * TOTP (Time-based One-Time Password) — RFC 6238 + RFC 4226.
 *
 * Implémentation pure node:crypto, sans dépendance externe.
 * Compatible Google Authenticator, Microsoft Authenticator, Authy, 1Password.
 *
 * Convention :
 *   - Secret stocké en base32 (encoding standard pour les URIs otpauth)
 *   - 6 digits, période 30s, algorithme SHA-1 (standard)
 *   - URI format : otpauth://totp/{issuer}:{label}?secret=...&issuer=...
 */

import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

const PERIOD = 30; // secondes
const DIGITS = 6;
const ALG = "sha1";

// Base32 (RFC 4648, sans padding par défaut pour Google Authenticator)
const B32_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

function toBase32(buf: Buffer): string {
  let bits = "";
  for (const b of buf) bits += b.toString(2).padStart(8, "0");
  let out = "";
  for (let i = 0; i < bits.length; i += 5) {
    const chunk = bits.slice(i, i + 5).padEnd(5, "0");
    out += B32_ALPHABET[parseInt(chunk, 2)];
  }
  return out;
}

function fromBase32(input: string): Buffer {
  const cleaned = input.replace(/=+$/, "").toUpperCase().replace(/\s/g, "");
  let bits = "";
  for (const ch of cleaned) {
    const v = B32_ALPHABET.indexOf(ch);
    if (v < 0) throw new Error("Invalid base32 char");
    bits += v.toString(2).padStart(5, "0");
  }
  const bytes: number[] = [];
  for (let i = 0; i + 8 <= bits.length; i += 8) {
    bytes.push(parseInt(bits.slice(i, i + 8), 2));
  }
  return Buffer.from(bytes);
}

/** Génère un secret aléatoire (20 bytes = 160 bits, recommandation RFC). */
export function generateSecret(): string {
  return toBase32(randomBytes(20));
}

/** Calcule le code TOTP pour un timestamp donné (par défaut now). */
export function generateCode(secret: string, atSeconds?: number): string {
  const seconds = atSeconds ?? Math.floor(Date.now() / 1000);
  const counter = Math.floor(seconds / PERIOD);
  const counterBuf = Buffer.alloc(8);
  counterBuf.writeBigUInt64BE(BigInt(counter));

  const key = fromBase32(secret);
  const hmac = createHmac(ALG, key).update(counterBuf).digest();
  // Dynamic truncation (RFC 4226 §5.3)
  const offset = hmac[hmac.length - 1] & 0xf;
  const binCode =
    ((hmac[offset] & 0x7f) << 24) |
    ((hmac[offset + 1] & 0xff) << 16) |
    ((hmac[offset + 2] & 0xff) << 8) |
    (hmac[offset + 3] & 0xff);
  const code = binCode % 10 ** DIGITS;
  return code.toString().padStart(DIGITS, "0");
}

/**
 * Vérifie un code avec tolérance ±1 fenêtre (90s total) — compense le drift
 * d'horloge entre serveur et appareil utilisateur.
 */
export function verifyCode(secret: string, code: string): boolean {
  const cleanedCode = code.replace(/\s/g, "");
  if (cleanedCode.length !== DIGITS) return false;
  const now = Math.floor(Date.now() / 1000);
  for (const offset of [-1, 0, 1]) {
    const expected = generateCode(secret, now + offset * PERIOD);
    try {
      if (timingSafeEqual(Buffer.from(expected), Buffer.from(cleanedCode))) {
        return true;
      }
    } catch {
      // continue
    }
  }
  return false;
}

/** Construit une URI otpauth pour QR code (compatible Google Authenticator). */
export function buildOtpauthUri(
  label: string,
  secret: string,
  issuer = "Chauffage Artisanal",
): string {
  const encLabel = encodeURIComponent(`${issuer}:${label}`);
  const params = new URLSearchParams({
    secret,
    issuer,
    algorithm: "SHA1",
    digits: String(DIGITS),
    period: String(PERIOD),
  });
  return `otpauth://totp/${encLabel}?${params.toString()}`;
}

/**
 * Génère une URL d'image QR code via api.qrserver.com (libre, pas d'API key).
 * Le QR code n'est qu'une représentation graphique de l'URI otpauth, ne contient
 * pas de secret côté serveur tiers.
 */
export function buildQrUrl(otpauthUri: string, size = 220): string {
  const enc = encodeURIComponent(otpauthUri);
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${enc}`;
}
