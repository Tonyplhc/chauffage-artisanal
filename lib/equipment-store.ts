/**
 * Registre des équipements installés chez un client.
 *
 * Une entrée par appareil : chaudière, PAC extérieure, ballon thermo,
 * climatiseur, ventilation, etc. Permet de retrouver rapidement les
 * caractéristiques techniques d'un dossier déjà installé pour SAV ou
 * extension.
 *
 * Lien avec les contrats d'entretien (W23.1) : un équipement peut avoir
 * son contrat associé via `contractId`. Pas de FK stricte — le lien est
 * informatif, la suppression de l'un ne casse pas l'autre.
 */

import { promises as fs } from "node:fs";
import path from "node:path";
import { randomBytes } from "node:crypto";

const DATA_DIR = path.join(process.cwd(), "data");
const EQUIPMENT_FILE = path.join(DATA_DIR, "equipment.json");

export type EquipmentType =
  | "chaudiere"
  | "pac"
  | "ballon"
  | "clim"
  | "vmc"
  | "solaire"
  | "regulation"
  | "autre";

export type EquipmentStatus = "operational" | "maintenance" | "decommissioned";

export type Equipment = {
  id: string;
  leadReference: string;
  type: EquipmentType;
  brand: string;
  model: string;
  serialNumber?: string;
  power?: string; // ex "24 kW"
  installedAt?: string; // ISO
  warrantyExpiresAt?: string;
  location?: string; // ex "Cave", "Toit"
  contractId?: string; // lien optionnel vers MaintenanceContract
  manualUrl?: string;
  notes?: string;
  status: EquipmentStatus;
  createdAt: string;
  updatedAt: string;
};

async function ensureDir() {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
  } catch {}
}

async function readAll(): Promise<Equipment[]> {
  try {
    return JSON.parse(await fs.readFile(EQUIPMENT_FILE, "utf8"));
  } catch {
    return [];
  }
}

async function writeAll(arr: Equipment[]) {
  await ensureDir();
  await fs.writeFile(EQUIPMENT_FILE, JSON.stringify(arr, null, 2), "utf8");
}

function makeId(): string {
  return `eq-${randomBytes(5).toString("hex")}`;
}

/* ─────────────── Reads ─────────────── */

export async function listEquipment(opts: {
  leadReference?: string;
  status?: EquipmentStatus;
  type?: EquipmentType;
} = {}): Promise<Equipment[]> {
  const all = await readAll();
  return all
    .filter((e) => {
      if (opts.leadReference && e.leadReference !== opts.leadReference)
        return false;
      if (opts.status && e.status !== opts.status) return false;
      if (opts.type && e.type !== opts.type) return false;
      return true;
    })
    .sort((a, b) => {
      // Tri : par lead puis installedAt desc puis nom
      if (a.leadReference !== b.leadReference)
        return a.leadReference.localeCompare(b.leadReference);
      const ai = a.installedAt ?? a.createdAt;
      const bi = b.installedAt ?? b.createdAt;
      return bi.localeCompare(ai);
    });
}

export async function getEquipment(id: string): Promise<Equipment | null> {
  const all = await readAll();
  return all.find((e) => e.id === id) ?? null;
}

/* ─────────────── Mutations ─────────────── */

export async function createEquipment(input: {
  leadReference: string;
  type: EquipmentType;
  brand: string;
  model: string;
  serialNumber?: string;
  power?: string;
  installedAt?: string;
  warrantyExpiresAt?: string;
  location?: string;
  contractId?: string;
  manualUrl?: string;
  notes?: string;
}): Promise<Equipment> {
  if (!input.leadReference) throw new Error("leadReference requis");
  if (!input.brand?.trim()) throw new Error("Marque requise");
  if (!input.model?.trim()) throw new Error("Modèle requis");
  const now = new Date().toISOString();
  const equipment: Equipment = {
    id: makeId(),
    leadReference: input.leadReference,
    type: input.type,
    brand: input.brand.trim().slice(0, 100),
    model: input.model.trim().slice(0, 200),
    serialNumber: input.serialNumber?.trim().slice(0, 100) || undefined,
    power: input.power?.trim().slice(0, 50) || undefined,
    installedAt: input.installedAt,
    warrantyExpiresAt: input.warrantyExpiresAt,
    location: input.location?.trim().slice(0, 100) || undefined,
    contractId: input.contractId || undefined,
    manualUrl: input.manualUrl?.trim() || undefined,
    notes: input.notes?.slice(0, 2000) || undefined,
    status: "operational",
    createdAt: now,
    updatedAt: now,
  };
  const all = await readAll();
  all.push(equipment);
  await writeAll(all);
  return equipment;
}

export async function updateEquipment(
  id: string,
  patch: Partial<Omit<Equipment, "id" | "createdAt" | "leadReference">>,
): Promise<Equipment | null> {
  const all = await readAll();
  const idx = all.findIndex((e) => e.id === id);
  if (idx === -1) return null;
  const next: Equipment = { ...all[idx] };
  for (const [key, val] of Object.entries(patch)) {
    if (val === undefined) continue;
    if (key === "brand" || key === "model") {
      const s = String(val).trim();
      if (!s) throw new Error(`${key} requis`);
      (next as Record<string, unknown>)[key] = s;
    } else if (typeof val === "string") {
      (next as Record<string, unknown>)[key] = val.trim() || undefined;
    } else {
      (next as Record<string, unknown>)[key] = val;
    }
  }
  next.updatedAt = new Date().toISOString();
  all[idx] = next;
  await writeAll(all);
  return next;
}

export async function deleteEquipment(id: string): Promise<boolean> {
  const all = await readAll();
  const next = all.filter((e) => e.id !== id);
  if (next.length === all.length) return false;
  await writeAll(next);
  return true;
}

/* ─────────────── Stats ─────────────── */

export type EquipmentStats = {
  total: number;
  byType: Record<EquipmentType, number>;
  warrantyExpiringSoon: number; // <60 jours
  warrantyExpired: number;
};

export async function computeStats(): Promise<EquipmentStats> {
  const all = await readAll();
  const stats: EquipmentStats = {
    total: all.length,
    byType: {
      chaudiere: 0,
      pac: 0,
      ballon: 0,
      clim: 0,
      vmc: 0,
      solaire: 0,
      regulation: 0,
      autre: 0,
    },
    warrantyExpiringSoon: 0,
    warrantyExpired: 0,
  };
  const now = Date.now();
  for (const e of all) {
    stats.byType[e.type] = (stats.byType[e.type] ?? 0) + 1;
    if (e.warrantyExpiresAt) {
      const w = new Date(e.warrantyExpiresAt).getTime();
      if (w < now) stats.warrantyExpired += 1;
      else if (w < now + 60 * 86_400_000) stats.warrantyExpiringSoon += 1;
    }
  }
  return stats;
}
