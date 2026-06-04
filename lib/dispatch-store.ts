/**
 * Planning d'interventions techniciens.
 *
 * Un slot = une intervention planifiée pour un technicien à un moment donné.
 * Optionnellement lié à un lead (pour les RDV) ou autonome (admin / formation).
 *
 * Conflits : on n'empêche pas la création — on flag les chevauchements pour
 * que l'admin décide.
 */

import { promises as fs } from "node:fs";
import path from "node:path";
import { randomBytes } from "node:crypto";

const DATA_DIR = path.join(process.cwd(), "data");
const SLOTS_FILE = path.join(DATA_DIR, "dispatch-slots.json");

export type SlotKind = "intervention" | "rdv" | "admin" | "formation";

export type DispatchSlot = {
  id: string;
  technicianEmail: string;
  leadReference?: string;
  kind: SlotKind;
  title: string;
  notes?: string;
  startAt: string; // ISO
  durationMin: number;
  location?: string;
  /** Pointage temps réel — début (clock-in technicien). */
  actualStartAt?: string;
  /** Pointage temps réel — fin (clock-out technicien). */
  actualEndAt?: string;
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
};

/** Helper : minutes réellement passées sur un slot (ou null si pas complet). */
export function slotActualMinutes(slot: DispatchSlot): number | null {
  if (!slot.actualStartAt || !slot.actualEndAt) return null;
  const start = new Date(slot.actualStartAt).getTime();
  const end = new Date(slot.actualEndAt).getTime();
  if (isNaN(start) || isNaN(end) || end < start) return null;
  return Math.round((end - start) / 60_000);
}

export async function clockIn(id: string): Promise<DispatchSlot | null> {
  const all = await readAll();
  const idx = all.findIndex((s) => s.id === id);
  if (idx === -1) return null;
  all[idx] = {
    ...all[idx],
    actualStartAt: new Date().toISOString(),
    actualEndAt: undefined,
    updatedAt: new Date().toISOString(),
  };
  await writeAll(all);
  return all[idx];
}

export async function clockOut(id: string): Promise<DispatchSlot | null> {
  const all = await readAll();
  const idx = all.findIndex((s) => s.id === id);
  if (idx === -1) return null;
  if (!all[idx].actualStartAt) {
    throw new Error("Pas de pointage début enregistré");
  }
  all[idx] = {
    ...all[idx],
    actualEndAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  await writeAll(all);
  return all[idx];
}

/* ─────────────── Productivité par tech ─────────────── */

export type ProductivityRow = {
  technicianEmail: string;
  plannedMinutes: number;
  actualMinutes: number;
  slotsTotal: number;
  slotsCompleted: number;
  /** Ratio actual / planned (1.0 = à l'heure ; >1 = dépassement). */
  efficiency: number | null;
};

export async function computeProductivity(opts: {
  from: string;
  to: string;
} = { from: "", to: "" }): Promise<ProductivityRow[]> {
  const all = await readAll();
  const fromMs = opts.from ? new Date(opts.from).getTime() : -Infinity;
  const toMs = opts.to ? new Date(opts.to).getTime() : Infinity;
  const byTech = new Map<string, ProductivityRow>();
  for (const s of all) {
    const t = new Date(s.startAt).getTime();
    if (t < fromMs || t > toMs) continue;
    const key = s.technicianEmail.toLowerCase();
    if (!byTech.has(key)) {
      byTech.set(key, {
        technicianEmail: s.technicianEmail,
        plannedMinutes: 0,
        actualMinutes: 0,
        slotsTotal: 0,
        slotsCompleted: 0,
        efficiency: null,
      });
    }
    const row = byTech.get(key)!;
    row.plannedMinutes += s.durationMin;
    row.slotsTotal += 1;
    const actual = slotActualMinutes(s);
    if (actual !== null) {
      row.actualMinutes += actual;
      row.slotsCompleted += 1;
    }
  }
  for (const row of byTech.values()) {
    row.efficiency =
      row.plannedMinutes > 0 ? row.actualMinutes / row.plannedMinutes : null;
  }
  return [...byTech.values()].sort(
    (a, b) => b.plannedMinutes - a.plannedMinutes,
  );
}

async function ensureDir() {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
  } catch {}
}

async function readAll(): Promise<DispatchSlot[]> {
  try {
    return JSON.parse(await fs.readFile(SLOTS_FILE, "utf8"));
  } catch {
    return [];
  }
}

async function writeAll(arr: DispatchSlot[]) {
  await ensureDir();
  await fs.writeFile(SLOTS_FILE, JSON.stringify(arr, null, 2), "utf8");
}

function makeId(): string {
  return `slot-${randomBytes(5).toString("hex")}`;
}

/* ─────────────── Reads ─────────────── */

export type ListOpts = {
  technicianEmail?: string;
  from?: string;
  to?: string;
};

export async function listSlots(opts: ListOpts = {}): Promise<DispatchSlot[]> {
  const all = await readAll();
  const fromMs = opts.from ? new Date(opts.from).getTime() : -Infinity;
  const toMs = opts.to ? new Date(opts.to).getTime() : Infinity;
  return all
    .filter((s) => {
      if (
        opts.technicianEmail &&
        s.technicianEmail.toLowerCase() !== opts.technicianEmail.toLowerCase()
      )
        return false;
      const t = new Date(s.startAt).getTime();
      if (t < fromMs) return false;
      const end = t + s.durationMin * 60_000;
      if (end > toMs && t > toMs) return false;
      return true;
    })
    .sort((a, b) => a.startAt.localeCompare(b.startAt));
}

export async function getSlot(id: string): Promise<DispatchSlot | null> {
  const all = await readAll();
  return all.find((s) => s.id === id) ?? null;
}

/* ─────────────── Mutations ─────────────── */

export async function createSlot(input: {
  technicianEmail: string;
  leadReference?: string;
  kind: SlotKind;
  title: string;
  notes?: string;
  startAt: string;
  durationMin: number;
  location?: string;
  createdBy?: string;
}): Promise<DispatchSlot> {
  if (!input.technicianEmail.trim()) throw new Error("Technicien requis");
  if (!input.title.trim()) throw new Error("Titre requis");
  if (isNaN(new Date(input.startAt).getTime()))
    throw new Error("Date de début invalide");
  if (input.durationMin < 15 || input.durationMin > 24 * 60)
    throw new Error("Durée invalide (15 min — 24 h)");
  const now = new Date().toISOString();
  const slot: DispatchSlot = {
    id: makeId(),
    technicianEmail: input.technicianEmail.trim(),
    leadReference: input.leadReference || undefined,
    kind: input.kind,
    title: input.title.trim().slice(0, 200),
    notes: input.notes?.slice(0, 1000) || undefined,
    startAt: input.startAt,
    durationMin: Math.round(input.durationMin),
    location: input.location?.slice(0, 200) || undefined,
    createdAt: now,
    updatedAt: now,
    createdBy: input.createdBy,
  };
  const all = await readAll();
  all.push(slot);
  await writeAll(all);
  return slot;
}

export async function updateSlot(
  id: string,
  patch: Partial<
    Pick<
      DispatchSlot,
      | "technicianEmail"
      | "leadReference"
      | "kind"
      | "title"
      | "notes"
      | "startAt"
      | "durationMin"
      | "location"
    >
  >,
): Promise<DispatchSlot | null> {
  const all = await readAll();
  const idx = all.findIndex((s) => s.id === id);
  if (idx === -1) return null;
  const cur = all[idx];
  const next: DispatchSlot = { ...cur };
  if (patch.technicianEmail !== undefined)
    next.technicianEmail = patch.technicianEmail.trim();
  if (patch.leadReference !== undefined)
    next.leadReference = patch.leadReference || undefined;
  if (patch.kind !== undefined) next.kind = patch.kind;
  if (patch.title !== undefined) next.title = patch.title.trim().slice(0, 200);
  if (patch.notes !== undefined)
    next.notes = patch.notes.slice(0, 1000) || undefined;
  if (patch.startAt !== undefined) next.startAt = patch.startAt;
  if (patch.durationMin !== undefined)
    next.durationMin = Math.round(patch.durationMin);
  if (patch.location !== undefined)
    next.location = patch.location.slice(0, 200) || undefined;
  next.updatedAt = new Date().toISOString();
  all[idx] = next;
  await writeAll(all);
  return next;
}

export async function deleteSlot(id: string): Promise<boolean> {
  const all = await readAll();
  const next = all.filter((s) => s.id !== id);
  if (next.length === all.length) return false;
  await writeAll(next);
  return true;
}

/* ─────────────── Conflits ─────────────── */

export function slotEndMs(slot: DispatchSlot): number {
  return new Date(slot.startAt).getTime() + slot.durationMin * 60_000;
}

export function detectConflicts(slots: DispatchSlot[]): Set<string> {
  const conflicts = new Set<string>();
  // Group par technicien
  const byTech = new Map<string, DispatchSlot[]>();
  for (const s of slots) {
    const k = s.technicianEmail.toLowerCase();
    if (!byTech.has(k)) byTech.set(k, []);
    byTech.get(k)!.push(s);
  }
  for (const list of byTech.values()) {
    const sorted = [...list].sort((a, b) =>
      a.startAt.localeCompare(b.startAt),
    );
    for (let i = 0; i < sorted.length - 1; i++) {
      const a = sorted[i];
      const b = sorted[i + 1];
      if (slotEndMs(a) > new Date(b.startAt).getTime()) {
        conflicts.add(a.id);
        conflicts.add(b.id);
      }
    }
  }
  return conflicts;
}

export async function listTechnicians(): Promise<string[]> {
  const all = await readAll();
  return [...new Set(all.map((s) => s.technicianEmail))].sort();
}
