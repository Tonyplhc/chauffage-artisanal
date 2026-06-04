/**
 * Base fournisseurs — carnet d'adresses des partenaires (matériel, sous-traitants).
 *
 * V1 : pas de commandes (purchase orders), juste un carnet avec leadTime et
 * conditions de paiement. Le module commandes peut s'ajouter dans une V+1
 * sans toucher au schéma supplier.
 */

import { promises as fs } from "node:fs";
import path from "node:path";
import { randomBytes } from "node:crypto";

const DATA_DIR = path.join(process.cwd(), "data");
const SUPPLIERS_FILE = path.join(DATA_DIR, "suppliers.json");

export type SupplierStatus = "active" | "archived";

export type Supplier = {
  id: string;
  name: string;
  category?: string; // ex "Chaudières", "PAC", "Sanitaire", "Sous-traitance"
  contactName?: string;
  email?: string;
  phone?: string;
  website?: string;
  address?: string;
  vatNumber?: string;
  leadTimeDays?: number;
  paymentTerms?: string; // ex "30 jours net"
  notes?: string;
  rating?: number; // 1..5
  status: SupplierStatus;
  createdAt: string;
  updatedAt: string;
};

async function ensureDir() {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
  } catch {}
}

async function readAll(): Promise<Supplier[]> {
  try {
    return JSON.parse(await fs.readFile(SUPPLIERS_FILE, "utf8"));
  } catch {
    return [];
  }
}

async function writeAll(arr: Supplier[]) {
  await ensureDir();
  await fs.writeFile(SUPPLIERS_FILE, JSON.stringify(arr, null, 2), "utf8");
}

function makeId(): string {
  return `sup-${randomBytes(5).toString("hex")}`;
}

export async function listSuppliers(opts: {
  status?: SupplierStatus;
  category?: string;
  search?: string;
} = {}): Promise<Supplier[]> {
  const all = await readAll();
  const q = opts.search?.trim().toLowerCase();
  return all
    .filter((s) => {
      if (opts.status && s.status !== opts.status) return false;
      if (opts.category && s.category !== opts.category) return false;
      if (q) {
        const hay = `${s.name} ${s.contactName ?? ""} ${s.email ?? ""} ${s.notes ?? ""}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    })
    .sort((a, b) => a.name.localeCompare(b.name));
}

export async function getSupplier(id: string): Promise<Supplier | null> {
  const all = await readAll();
  return all.find((s) => s.id === id) ?? null;
}

export async function createSupplier(input: {
  name: string;
  category?: string;
  contactName?: string;
  email?: string;
  phone?: string;
  website?: string;
  address?: string;
  vatNumber?: string;
  leadTimeDays?: number;
  paymentTerms?: string;
  notes?: string;
  rating?: number;
}): Promise<Supplier> {
  const name = input.name.trim();
  if (!name) throw new Error("Nom requis");
  if (name.length > 200) throw new Error("Nom trop long");
  const now = new Date().toISOString();
  const supplier: Supplier = {
    id: makeId(),
    name,
    category: input.category?.trim() || undefined,
    contactName: input.contactName?.trim() || undefined,
    email: input.email?.trim().toLowerCase() || undefined,
    phone: input.phone?.trim() || undefined,
    website: input.website?.trim() || undefined,
    address: input.address?.trim() || undefined,
    vatNumber: input.vatNumber?.trim() || undefined,
    leadTimeDays:
      typeof input.leadTimeDays === "number" && input.leadTimeDays >= 0
        ? Math.round(input.leadTimeDays)
        : undefined,
    paymentTerms: input.paymentTerms?.trim() || undefined,
    notes: input.notes?.slice(0, 4000) || undefined,
    rating:
      typeof input.rating === "number" &&
      input.rating >= 1 &&
      input.rating <= 5
        ? Math.round(input.rating)
        : undefined,
    status: "active",
    createdAt: now,
    updatedAt: now,
  };
  const all = await readAll();
  all.push(supplier);
  await writeAll(all);
  return supplier;
}

export async function updateSupplier(
  id: string,
  patch: Partial<Omit<Supplier, "id" | "createdAt">>,
): Promise<Supplier | null> {
  const all = await readAll();
  const idx = all.findIndex((s) => s.id === id);
  if (idx === -1) return null;
  const cur = all[idx];
  const next: Supplier = { ...cur };
  for (const key of Object.keys(patch) as (keyof typeof patch)[]) {
    const val = patch[key];
    if (val === undefined) continue;
    if (key === "rating") {
      next.rating =
        typeof val === "number" && val >= 1 && val <= 5
          ? Math.round(val)
          : undefined;
    } else if (key === "leadTimeDays") {
      next.leadTimeDays =
        typeof val === "number" && val >= 0 ? Math.round(val) : undefined;
    } else if (key === "name") {
      const n = String(val).trim();
      if (!n) throw new Error("Nom requis");
      next.name = n.slice(0, 200);
    } else if (key === "status") {
      next.status = val as SupplierStatus;
    } else {
      // string fields
      (next as Record<string, unknown>)[key] =
        typeof val === "string" ? val.trim() || undefined : val;
    }
  }
  next.updatedAt = new Date().toISOString();
  all[idx] = next;
  await writeAll(all);
  return next;
}

export async function deleteSupplier(id: string): Promise<boolean> {
  const all = await readAll();
  const next = all.filter((s) => s.id !== id);
  if (next.length === all.length) return false;
  await writeAll(next);
  return true;
}

export async function listCategories(): Promise<string[]> {
  const all = await readAll();
  return [
    ...new Set(all.map((s) => s.category).filter(Boolean) as string[]),
  ].sort();
}

export type SupplierStats = {
  total: number;
  active: number;
  archived: number;
  averageLeadTime: number | null;
};

export async function computeStats(): Promise<SupplierStats> {
  const all = await readAll();
  const active = all.filter((s) => s.status === "active");
  const leadTimes = active
    .map((s) => s.leadTimeDays)
    .filter((n): n is number => typeof n === "number");
  const avg =
    leadTimes.length === 0
      ? null
      : leadTimes.reduce((a, b) => a + b, 0) / leadTimes.length;
  return {
    total: all.length,
    active: active.length,
    archived: all.length - active.length,
    averageLeadTime: avg,
  };
}
