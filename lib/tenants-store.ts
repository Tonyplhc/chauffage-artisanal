/**
 * Multi-tenant / white-label : configuration des marques exploitant le même
 * codebase.
 *
 * Cas d'usage : un opérateur multi-sociétés (groupe), un MSP qui vend
 * l'outil en marque blanche à plusieurs HVAC indépendants.
 *
 * V1 : la sélection du tenant actif se fait via cookie `ca-tenant` que
 * l'admin bascule depuis la page de gestion. Le `default` est utilisé en
 * absence de sélection.
 *
 * Extension côté pages publiques : à intégrer plus tard (sous-domaines ?).
 * En V1 on reste mono-domaine pour la partie client.
 */

import { promises as fs } from "node:fs";
import path from "node:path";
import { randomBytes } from "node:crypto";

const DATA_DIR = path.join(process.cwd(), "data");
const TENANTS_FILE = path.join(DATA_DIR, "tenants.json");

export type Tenant = {
  id: string;
  slug: string; // identifiant URL-safe (kebab-case)
  name: string;
  legalName?: string;
  description?: string;
  /** Branding : couleurs hex, URL logo. */
  branding: {
    primaryColor: string;
    secondaryColor: string;
    accentColor: string;
    logoUrl?: string;
  };
  /** Coordonnées légales pour factures / devis / mentions légales. */
  legal: {
    address?: string;
    phone?: string;
    email?: string;
    vatNumber?: string;
    rcsNumber?: string;
    ibanMasked?: string;
    website?: string;
  };
  isActive: boolean;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
};

async function ensureDir() {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
  } catch {}
}

async function readAll(): Promise<Tenant[]> {
  try {
    return JSON.parse(await fs.readFile(TENANTS_FILE, "utf8"));
  } catch {
    return [];
  }
}

async function writeAll(arr: Tenant[]) {
  await ensureDir();
  await fs.writeFile(TENANTS_FILE, JSON.stringify(arr, null, 2), "utf8");
}

function makeId(): string {
  return `tnt-${randomBytes(4).toString("hex")}`;
}

function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

const DEFAULT_BRANDING: Tenant["branding"] = {
  primaryColor: "#1e1a15",
  secondaryColor: "#b86a36",
  accentColor: "#22a06b",
};

export async function listTenants(): Promise<Tenant[]> {
  return await readAll();
}

export async function getTenant(id: string): Promise<Tenant | null> {
  const all = await readAll();
  return all.find((t) => t.id === id) ?? null;
}

export async function getTenantBySlug(slug: string): Promise<Tenant | null> {
  const all = await readAll();
  const k = slug.toLowerCase();
  return all.find((t) => t.slug === k) ?? null;
}

export async function getDefaultTenant(): Promise<Tenant | null> {
  const all = await readAll();
  return all.find((t) => t.isDefault && t.isActive) ?? all[0] ?? null;
}

export async function createTenant(input: {
  name: string;
  legalName?: string;
  description?: string;
  branding?: Partial<Tenant["branding"]>;
  legal?: Partial<Tenant["legal"]>;
  isDefault?: boolean;
}): Promise<Tenant> {
  if (!input.name?.trim()) throw new Error("Nom requis");
  const all = await readAll();
  const baseSlug = slugify(input.name);
  let slug = baseSlug;
  let n = 1;
  while (all.some((t) => t.slug === slug)) {
    slug = `${baseSlug}-${++n}`;
  }
  const now = new Date().toISOString();
  const tenant: Tenant = {
    id: makeId(),
    slug,
    name: input.name.trim(),
    legalName: input.legalName?.trim(),
    description: input.description?.slice(0, 1000),
    branding: { ...DEFAULT_BRANDING, ...(input.branding ?? {}) },
    legal: input.legal ?? {},
    isActive: true,
    isDefault: input.isDefault ?? all.length === 0,
    createdAt: now,
    updatedAt: now,
  };
  // S'assurer qu'un seul tenant est default
  if (tenant.isDefault) {
    for (const t of all) t.isDefault = false;
  }
  all.push(tenant);
  await writeAll(all);
  return tenant;
}

export async function updateTenant(
  id: string,
  patch: Partial<Omit<Tenant, "id" | "createdAt">>,
): Promise<Tenant | null> {
  const all = await readAll();
  const idx = all.findIndex((t) => t.id === id);
  if (idx === -1) return null;
  // Si on définit comme default, retirer le flag des autres
  if (patch.isDefault === true) {
    for (const t of all) t.isDefault = false;
  }
  const next: Tenant = {
    ...all[idx],
    ...patch,
    branding: { ...all[idx].branding, ...(patch.branding ?? {}) },
    legal: { ...all[idx].legal, ...(patch.legal ?? {}) },
    updatedAt: new Date().toISOString(),
  };
  all[idx] = next;
  await writeAll(all);
  return next;
}

export async function deleteTenant(id: string): Promise<boolean> {
  const all = await readAll();
  const next = all.filter((t) => t.id !== id);
  if (next.length === all.length) return false;
  // Si on supprime le default, on en désigne un autre
  if (!next.some((t) => t.isDefault) && next.length > 0) {
    next[0].isDefault = true;
  }
  await writeAll(next);
  return true;
}
