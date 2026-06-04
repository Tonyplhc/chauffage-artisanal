/**
 * Store des utilisateurs admin.
 *
 * Persistance dev : `data/users.json`.
 * Mots de passe : hashés avec scrypt (Node built-in), pas de dépendance bcrypt.
 *
 * Rôles :
 *   - admin       : tout (settings, RGPD, 2FA, multi-user mgmt, suppression)
 *   - commercial  : tout sauf settings sensibles (pas de RGPD delete, pas de user mgmt)
 *   - viewer      : lecture seule (peut consulter mais pas modifier)
 *
 * Migration : si data/users.json est vide, on bascule sur l'ancien
 * ADMIN_PASSWORD avec rôle "admin" comme fallback unique.
 */

import { promises as fs } from "node:fs";
import path from "node:path";
import {
  randomBytes,
  scryptSync,
  timingSafeEqual,
  createHash,
} from "node:crypto";

const DATA_DIR = path.join(process.cwd(), "data");
const USERS_FILE = path.join(DATA_DIR, "users.json");

export type Role = "admin" | "commercial" | "viewer";

export type StoredUser = {
  id: string;
  email: string;
  role: Role;
  passwordHash: string;
  passwordSalt: string;
  totpSecret?: string;
  /**
   * Liste de capabilities accordées à cet utilisateur. Si undefined ou vide,
   * on bascule sur la rétrocompatibilité par rôle (le rôle décide).
   * Source de vérité fine : lib/capabilities.ts
   */
  capabilities?: string[];
  /** Nom affiché optionnel (sinon on prend la partie locale de l'email). */
  displayName?: string;
  createdAt: string;
  lastLoginAt?: string;
};

export type SafeUser = Omit<StoredUser, "passwordHash" | "passwordSalt" | "totpSecret"> & {
  has2fa: boolean;
};

async function ensureDir() {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
  } catch {}
}

async function readAll(): Promise<StoredUser[]> {
  try {
    return JSON.parse(await fs.readFile(USERS_FILE, "utf8"));
  } catch {
    return [];
  }
}

async function writeAll(users: StoredUser[]): Promise<void> {
  await ensureDir();
  await fs.writeFile(USERS_FILE, JSON.stringify(users, null, 2), "utf8");
}

function toSafe(u: StoredUser): SafeUser {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { passwordHash, passwordSalt, totpSecret, ...rest } = u;
  return { ...rest, has2fa: !!totpSecret };
}

/* ─────────────── Password hashing ─────────────── */

function hashPassword(password: string): { hash: string; salt: string } {
  const salt = randomBytes(16).toString("hex");
  const derived = scryptSync(password, salt, 64).toString("hex");
  return { hash: derived, salt };
}

function verifyPassword(password: string, hash: string, salt: string): boolean {
  try {
    const derived = scryptSync(password, salt, 64);
    const known = Buffer.from(hash, "hex");
    return derived.length === known.length && timingSafeEqual(derived, known);
  } catch {
    return false;
  }
}

/* ─────────────── API publique ─────────────── */

export async function listUsers(): Promise<SafeUser[]> {
  const all = await readAll();
  return all.map(toSafe);
}

export async function hasAnyUser(): Promise<boolean> {
  const all = await readAll();
  return all.length > 0;
}

export async function getUserByEmail(email: string): Promise<StoredUser | undefined> {
  const all = await readAll();
  return all.find((u) => u.email.toLowerCase() === email.toLowerCase());
}

export async function createUser(
  email: string,
  password: string,
  role: Role,
): Promise<SafeUser> {
  if (password.length < 8) {
    throw new Error("Mot de passe trop court (8 caractères minimum).");
  }
  const all = await readAll();
  if (all.some((u) => u.email.toLowerCase() === email.toLowerCase())) {
    throw new Error("Email déjà utilisé.");
  }
  const { hash, salt } = hashPassword(password);
  const user: StoredUser = {
    id: createHash("sha256").update(`${email}:${Date.now()}`).digest("hex").slice(0, 16),
    email: email.toLowerCase().trim(),
    role,
    passwordHash: hash,
    passwordSalt: salt,
    createdAt: new Date().toISOString(),
  };
  all.push(user);
  await writeAll(all);
  return toSafe(user);
}

export async function updateUser(
  id: string,
  patch: Partial<{
    role: Role;
    password: string;
    totpSecret: string | null;
    capabilities: string[];
    displayName: string;
  }>,
): Promise<SafeUser | null> {
  const all = await readAll();
  const idx = all.findIndex((u) => u.id === id);
  if (idx === -1) return null;
  const user = all[idx];
  if (patch.role) user.role = patch.role;
  if (patch.password) {
    if (patch.password.length < 8) {
      throw new Error("Mot de passe trop court.");
    }
    const { hash, salt } = hashPassword(patch.password);
    user.passwordHash = hash;
    user.passwordSalt = salt;
  }
  if (patch.totpSecret === null) {
    delete user.totpSecret;
  } else if (patch.totpSecret) {
    user.totpSecret = patch.totpSecret;
  }
  if (patch.capabilities !== undefined) {
    // Dédoublonne + filtre les strings non vides
    user.capabilities = Array.from(
      new Set(patch.capabilities.filter((c) => typeof c === "string" && c.length > 0)),
    );
  }
  if (patch.displayName !== undefined) {
    user.displayName = patch.displayName.trim().slice(0, 80) || undefined;
  }
  all[idx] = user;
  await writeAll(all);
  return toSafe(user);
}

/** Récupère les capabilities d'un utilisateur. Si vide → on dérive du rôle. */
export async function getUserCapabilities(id: string): Promise<string[]> {
  const all = await readAll();
  const u = all.find((x) => x.id === id);
  if (!u) return [];
  if (u.capabilities && u.capabilities.length > 0) return u.capabilities;
  // Rétrocompat : un admin reçoit tout, un commercial reçoit le preset
  // commercial, un viewer reçoit les capabilities de lecture pure.
  // (Lazy import pour éviter cycle de modules.)
  const { PRESETS, CAPABILITIES } = await import("./capabilities");
  if (u.role === "admin") return CAPABILITIES.map((c) => c.id);
  if (u.role === "commercial") return PRESETS.commercial.capabilityIds;
  // viewer : tout ce qui contient ".view" ou ".read"
  return CAPABILITIES.filter((c) => /\.(view|read)$/.test(c.id)).map((c) => c.id);
}

export async function deleteUser(id: string): Promise<boolean> {
  const all = await readAll();
  const filtered = all.filter((u) => u.id !== id);
  if (filtered.length === all.length) return false;
  await writeAll(filtered);
  return true;
}

export async function recordLogin(id: string): Promise<void> {
  const all = await readAll();
  const u = all.find((x) => x.id === id);
  if (!u) return;
  u.lastLoginAt = new Date().toISOString();
  await writeAll(all);
}

/** Vérif login avec mot de passe. Retourne l'utilisateur StoredUser si OK. */
export async function authenticate(
  email: string,
  password: string,
): Promise<StoredUser | null> {
  const u = await getUserByEmail(email);
  if (!u) return null;
  if (!verifyPassword(password, u.passwordHash, u.passwordSalt)) return null;
  return u;
}

/* ─────────────── Permissions ─────────────── */

export const ROLE_LABELS: Record<Role, string> = {
  admin: "Administrateur",
  commercial: "Commercial",
  viewer: "Consultation",
};

export function canManageUsers(role: Role): boolean {
  return role === "admin";
}

export function canDeleteLeads(role: Role): boolean {
  return role === "admin";
}

export function canEditLeads(role: Role): boolean {
  return role === "admin" || role === "commercial";
}

export function canSendEmails(role: Role): boolean {
  return role === "admin" || role === "commercial";
}

export function canEditQuotes(role: Role): boolean {
  return role === "admin" || role === "commercial";
}

export function canViewSensitive(role: Role): boolean {
  return role === "admin" || role === "commercial";
}
