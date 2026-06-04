/**
 * Contrats d'entretien récurrents — chaudière, PAC, clim, sanitaire.
 *
 * Cas d'usage HVAC : un client converti pour une chaudière a un entretien
 * annuel obligatoire. Le système suit la prochaine échéance et crée
 * automatiquement un rappel (via lib/reminders-store) quand on s'approche
 * de la date.
 *
 * Statuts : active → l'échéance est suivie. paused → arrêt temporaire (gel
 * d'abonnement). expired → contrat résilié.
 *
 * Pas de facturation auto en V1 — la facture pour visite annuelle se génère
 * manuellement le moment venu via le module facturation (W21.4).
 */

import { promises as fs } from "node:fs";
import path from "node:path";
import { randomBytes } from "node:crypto";
import {
  listReminders,
  createReminder,
} from "./reminders-store";

const DATA_DIR = path.join(process.cwd(), "data");
const CONTRACTS_FILE = path.join(DATA_DIR, "maintenance-contracts.json");

export type ContractType =
  | "chaudiere"
  | "pac"
  | "clim"
  | "sanitaire"
  | "autre";

export type ContractFrequency =
  | "annual"
  | "biannual" // 2 fois / an
  | "quarterly";

export type ContractStatus = "active" | "paused" | "expired";

export type MaintenanceContract = {
  id: string;
  contractNumber: string; // MAINT-YYYY-NNNN
  leadReference: string;
  clientName: string;
  type: ContractType;
  equipment: string; // ex "Viessmann Vitodens 100-W 32 kW"
  frequency: ContractFrequency;
  startDate: string; // ISO
  /** Calculée depuis startDate + frequency, ajustée à chaque visite. */
  nextDueAt: string;
  lastVisitAt?: string;
  amountAnnualEur?: number; // montant annuel indicatif
  notes?: string;
  status: ContractStatus;
  createdAt: string;
  updatedAt: string;
};

async function ensureDir() {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
  } catch {}
}

async function readAll(): Promise<MaintenanceContract[]> {
  try {
    return JSON.parse(await fs.readFile(CONTRACTS_FILE, "utf8"));
  } catch {
    return [];
  }
}

async function writeAll(arr: MaintenanceContract[]) {
  await ensureDir();
  await fs.writeFile(CONTRACTS_FILE, JSON.stringify(arr, null, 2), "utf8");
}

function makeId(): string {
  return `mc-${randomBytes(5).toString("hex")}`;
}

async function nextContractNumber(year: number): Promise<string> {
  const all = await readAll();
  const prefix = `MAINT-${year}-`;
  let maxN = 0;
  for (const c of all) {
    if (c.contractNumber.startsWith(prefix)) {
      const n = parseInt(c.contractNumber.slice(prefix.length), 10);
      if (!isNaN(n) && n > maxN) maxN = n;
    }
  }
  return `${prefix}${String(maxN + 1).padStart(4, "0")}`;
}

/** Calcule la prochaine échéance à partir d'une date de référence. */
export function computeNextDue(
  fromIso: string,
  frequency: ContractFrequency,
): string {
  const d = new Date(fromIso);
  if (frequency === "annual") d.setUTCFullYear(d.getUTCFullYear() + 1);
  else if (frequency === "biannual") d.setUTCMonth(d.getUTCMonth() + 6);
  else if (frequency === "quarterly") d.setUTCMonth(d.getUTCMonth() + 3);
  return d.toISOString();
}

/* ─────────────── Lectures ─────────────── */

export async function listContracts(opts: {
  status?: ContractStatus;
  leadReference?: string;
} = {}): Promise<MaintenanceContract[]> {
  const all = await readAll();
  return all
    .filter((c) => {
      if (opts.status && c.status !== opts.status) return false;
      if (opts.leadReference && c.leadReference !== opts.leadReference)
        return false;
      return true;
    })
    .sort((a, b) => a.nextDueAt.localeCompare(b.nextDueAt));
}

export async function getContract(
  id: string,
): Promise<MaintenanceContract | null> {
  const all = await readAll();
  return all.find((c) => c.id === id) ?? null;
}

/* ─────────────── Mutations ─────────────── */

export async function createContract(input: {
  leadReference: string;
  clientName: string;
  type: ContractType;
  equipment: string;
  frequency: ContractFrequency;
  startDate?: string;
  amountAnnualEur?: number;
  notes?: string;
}): Promise<MaintenanceContract> {
  if (!input.leadReference) throw new Error("leadReference requis");
  if (!input.equipment.trim()) throw new Error("Équipement requis");
  const startDate = input.startDate ?? new Date().toISOString();
  const now = new Date();
  const contractNumber = await nextContractNumber(now.getUTCFullYear());
  const contract: MaintenanceContract = {
    id: makeId(),
    contractNumber,
    leadReference: input.leadReference,
    clientName: input.clientName.trim().slice(0, 200),
    type: input.type,
    equipment: input.equipment.trim().slice(0, 300),
    frequency: input.frequency,
    startDate,
    nextDueAt: computeNextDue(startDate, input.frequency),
    amountAnnualEur:
      typeof input.amountAnnualEur === "number" && input.amountAnnualEur >= 0
        ? Math.round(input.amountAnnualEur)
        : undefined,
    notes: input.notes?.slice(0, 2000),
    status: "active",
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
  };
  const all = await readAll();
  all.push(contract);
  await writeAll(all);
  return contract;
}

export async function updateContract(
  id: string,
  patch: Partial<
    Pick<
      MaintenanceContract,
      | "type"
      | "equipment"
      | "frequency"
      | "amountAnnualEur"
      | "notes"
      | "status"
      | "clientName"
    >
  >,
): Promise<MaintenanceContract | null> {
  const all = await readAll();
  const idx = all.findIndex((c) => c.id === id);
  if (idx === -1) return null;
  const cur = all[idx];
  const next: MaintenanceContract = { ...cur };
  if (patch.type !== undefined) next.type = patch.type;
  if (patch.equipment !== undefined)
    next.equipment = patch.equipment.trim().slice(0, 300);
  if (patch.frequency !== undefined && patch.frequency !== cur.frequency) {
    next.frequency = patch.frequency;
    // Recalcule nextDueAt depuis startDate avec la nouvelle fréquence
    next.nextDueAt = computeNextDue(cur.startDate, patch.frequency);
  }
  if (patch.amountAnnualEur !== undefined)
    next.amountAnnualEur =
      patch.amountAnnualEur >= 0 ? Math.round(patch.amountAnnualEur) : undefined;
  if (patch.notes !== undefined)
    next.notes = patch.notes.slice(0, 2000) || undefined;
  if (patch.clientName !== undefined)
    next.clientName = patch.clientName.trim();
  if (patch.status !== undefined) next.status = patch.status;
  next.updatedAt = new Date().toISOString();
  all[idx] = next;
  await writeAll(all);
  return next;
}

export async function deleteContract(id: string): Promise<boolean> {
  const all = await readAll();
  const next = all.filter((c) => c.id !== id);
  if (next.length === all.length) return false;
  await writeAll(next);
  return true;
}

/**
 * Marque une visite faite pour un contrat. Bouge `nextDueAt` à +1 cycle.
 */
export async function recordVisit(
  id: string,
  visitDateIso?: string,
): Promise<MaintenanceContract | null> {
  const all = await readAll();
  const idx = all.findIndex((c) => c.id === id);
  if (idx === -1) return null;
  const cur = all[idx];
  const visitAt = visitDateIso ?? new Date().toISOString();
  const next: MaintenanceContract = {
    ...cur,
    lastVisitAt: visitAt,
    nextDueAt: computeNextDue(visitAt, cur.frequency),
    updatedAt: new Date().toISOString(),
  };
  all[idx] = next;
  await writeAll(all);
  return next;
}

/* ─────────────── Auto reminders ─────────────── */

/**
 * Pour chaque contrat actif dont nextDueAt approche (<30 j), crée un rappel
 * sur le lead s'il n'existe pas déjà un rappel actif pour ce contrat.
 * Idempotent.
 */
export async function ensureUpcomingReminders(): Promise<{
  created: number;
}> {
  const contracts = await listContracts({ status: "active" });
  const now = Date.now();
  const horizon = now + 30 * 86_400_000;
  let created = 0;

  for (const c of contracts) {
    const dueAt = new Date(c.nextDueAt).getTime();
    if (dueAt > horizon) continue;
    if (dueAt < now - 30 * 86_400_000) continue; // trop vieux, on ne spam pas
    const existing = await listReminders({
      leadReference: c.leadReference,
      pendingOnly: true,
    });
    const alreadyHas = existing.some((r) =>
      (r.note ?? "").includes(c.contractNumber),
    );
    if (alreadyHas) continue;
    await createReminder({
      leadReference: c.leadReference,
      dueAt: c.nextDueAt,
      note: `Visite annuelle ${c.contractNumber} (${c.equipment}) — contact à reprendre`,
      createdBy: "system",
    });
    created += 1;
  }

  return { created };
}

/* ─────────────── Stats ─────────────── */

export type ContractStats = {
  total: number;
  active: number;
  paused: number;
  expired: number;
  dueWithin30d: number;
  dueWithin90d: number;
  overdue: number;
  recurringRevenueAnnual: number; // somme amountAnnualEur des actifs
};

export async function computeStats(): Promise<ContractStats> {
  const all = await readAll();
  const now = Date.now();
  const stats: ContractStats = {
    total: all.length,
    active: 0,
    paused: 0,
    expired: 0,
    dueWithin30d: 0,
    dueWithin90d: 0,
    overdue: 0,
    recurringRevenueAnnual: 0,
  };
  for (const c of all) {
    stats[c.status] += 1;
    if (c.status === "active") {
      stats.recurringRevenueAnnual += c.amountAnnualEur ?? 0;
      const due = new Date(c.nextDueAt).getTime();
      if (due < now) stats.overdue += 1;
      else if (due < now + 30 * 86_400_000) stats.dueWithin30d += 1;
      else if (due < now + 90 * 86_400_000) stats.dueWithin90d += 1;
    }
  }
  return stats;
}
