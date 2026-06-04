/**
 * API keys pour l'API publique /api/v1/*.
 *
 * Stockage : data/api-keys.json.
 * Format clé : `ca_pk_<random32>`.
 * Permissions : scopes par clé (read:leads, read:catalogue, etc.).
 */

import { promises as fs } from "node:fs";
import path from "node:path";
import { randomBytes, createHash } from "node:crypto";
import { z } from "zod";

const DATA_DIR = path.join(process.cwd(), "data");
const KEYS_FILE = path.join(DATA_DIR, "api-keys.json");

export const SCOPES = [
  "read:leads",
  "read:catalogue",
  "read:articles",
  "read:zones",
  "read:stats",
] as const;

export type Scope = (typeof SCOPES)[number];

export type ApiKey = {
  id: string;
  label: string;
  // Hash de la clé — on ne stocke jamais la clé en clair
  hash: string;
  prefix: string; // 6 premiers chars de la clé, affiché dans l'admin
  scopes: Scope[];
  createdAt: string;
  lastUsedAt?: string;
  useCount?: number;
  enabled: boolean;
};

export const ApiKeyCreateSchema = z.object({
  label: z.string().min(2).max(120),
  scopes: z.array(z.enum(SCOPES)).min(1),
});

async function ensureDir() {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
  } catch {}
}

async function readAll(): Promise<ApiKey[]> {
  try {
    return JSON.parse(await fs.readFile(KEYS_FILE, "utf8"));
  } catch {
    return [];
  }
}

async function writeAll(keys: ApiKey[]) {
  await ensureDir();
  await fs.writeFile(KEYS_FILE, JSON.stringify(keys, null, 2), "utf8");
}

function hashKey(rawKey: string): string {
  return createHash("sha256").update(rawKey).digest("hex");
}

export async function listKeys(): Promise<ApiKey[]> {
  return await readAll();
}

export async function createKey(
  label: string,
  scopes: Scope[],
): Promise<{ apiKey: ApiKey; rawKey: string }> {
  const rand = randomBytes(24).toString("base64url");
  const rawKey = `ca_pk_${rand}`;
  const apiKey: ApiKey = {
    id: `key_${Date.now().toString(36)}_${randomBytes(3).toString("hex")}`,
    label,
    hash: hashKey(rawKey),
    prefix: rawKey.slice(0, 10),
    scopes,
    createdAt: new Date().toISOString(),
    enabled: true,
    useCount: 0,
  };
  const all = await readAll();
  all.push(apiKey);
  await writeAll(all);
  return { apiKey, rawKey };
}

export async function revokeKey(id: string): Promise<boolean> {
  const all = await readAll();
  const k = all.find((x) => x.id === id);
  if (!k) return false;
  k.enabled = false;
  await writeAll(all);
  return true;
}

export async function deleteKey(id: string): Promise<boolean> {
  const all = await readAll();
  const next = all.filter((x) => x.id !== id);
  if (next.length === all.length) return false;
  await writeAll(next);
  return true;
}

export async function verifyKey(
  rawKey: string,
  requiredScope: Scope,
): Promise<{ ok: true; key: ApiKey } | { ok: false; error: string }> {
  const hash = hashKey(rawKey);
  const all = await readAll();
  const k = all.find((x) => x.hash === hash);
  if (!k) return { ok: false, error: "invalid_key" };
  if (!k.enabled) return { ok: false, error: "key_revoked" };
  if (!k.scopes.includes(requiredScope)) return { ok: false, error: "scope_missing" };
  // Record use (best-effort, non bloquant)
  k.lastUsedAt = new Date().toISOString();
  k.useCount = (k.useCount ?? 0) + 1;
  await writeAll(all).catch(() => {});
  return { ok: true, key: k };
}

/**
 * Extrait la clé d'une requête : header Authorization Bearer ou X-API-Key.
 */
export function extractApiKey(req: Request): string | null {
  const auth = req.headers.get("authorization");
  if (auth && auth.toLowerCase().startsWith("bearer ")) {
    return auth.slice(7).trim();
  }
  const x = req.headers.get("x-api-key");
  return x ? x.trim() : null;
}
