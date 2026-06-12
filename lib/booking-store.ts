/**
 * Réservations RDV publiques — store dual-mode (même pattern que leads-store).
 *
 * Dev   : fichier data/bookings.json (zéro dépendance).
 * Prod  : Supabase activé automatiquement si SUPABASE_URL +
 *         SUPABASE_SERVICE_ROLE_KEY sont définis — indispensable sur Vercel
 *         (filesystem éphémère). Table `bookings`
 *         (cf. supabase/migrations/20260612_004_bookings.sql).
 *
 * Discipline : on confirme par email mais on ne promet PAS la disponibilité
 * définitive — un humain valide ensuite (le créneau peut être bougé).
 */

import { promises as fs } from "node:fs";
import path from "node:path";
import { randomBytes } from "node:crypto";
import type { Booking, BookingPurpose } from "./booking-types";
export {
  PURPOSE_LABELS,
  type Booking,
  type BookingPurpose,
} from "./booking-types";

function useSupabase(): boolean {
  return !!(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

/* ─────────────── FILE STORE (dev) ─────────────── */

const DATA_DIR = path.join(process.cwd(), "data");
const FILE = path.join(DATA_DIR, "bookings.json");

async function ensureDir() {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
  } catch {}
}

async function fileReadAll(): Promise<Booking[]> {
  try {
    return JSON.parse(await fs.readFile(FILE, "utf8"));
  } catch {
    return [];
  }
}

async function fileWriteAll(arr: Booking[]) {
  await ensureDir();
  await fs.writeFile(FILE, JSON.stringify(arr, null, 2), "utf8");
}

function makeId(): string {
  return `bkg-${randomBytes(5).toString("hex")}`;
}

/* ─────────────── SUPABASE STORE (prod) ─────────────── */

function sbHeaders(extra: Record<string, string> = {}) {
  return {
    apikey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
    Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY!}`,
    "Content-Type": "application/json",
    Prefer: "return=representation",
    ...extra,
  };
}

function sbRest(p: string) {
  return `${process.env.SUPABASE_URL}/rest/v1${p}`;
}

function toDb(b: Booking) {
  return {
    id: b.id,
    slot_iso: b.slotIso,
    duration_min: b.durationMin,
    purpose: b.purpose,
    full_name: b.fullName,
    email: b.email,
    phone: b.phone,
    commune: b.commune ?? null,
    notes: b.notes ?? null,
    created_at: b.createdAt,
    status: b.status,
  };
}

function fromDb(row: Record<string, unknown>): Booking {
  return {
    id: String(row.id),
    slotIso: String(row.slot_iso),
    durationMin: Number(row.duration_min),
    purpose: row.purpose as BookingPurpose,
    fullName: String(row.full_name),
    email: String(row.email),
    phone: String(row.phone),
    commune: row.commune ? String(row.commune) : undefined,
    notes: row.notes ? String(row.notes) : undefined,
    createdAt: String(row.created_at),
    status: row.status as Booking["status"],
  };
}

async function sbList(): Promise<Booking[]> {
  const res = await fetch(sbRest("/bookings?select=*&order=created_at.desc"), {
    headers: sbHeaders(),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Supabase bookings list: ${res.status}`);
  return ((await res.json()) as Record<string, unknown>[]).map(fromDb);
}

async function sbCreate(booking: Booking): Promise<Booking> {
  const res = await fetch(sbRest("/bookings"), {
    method: "POST",
    headers: sbHeaders(),
    body: JSON.stringify(toDb(booking)),
  });
  if (res.status === 409) {
    // Index unique partiel (slot_iso, status <> cancelled) → doublon atomique
    throw new Error("Créneau déjà réservé.");
  }
  if (!res.ok) throw new Error(`Supabase booking insert: ${res.status}`);
  const rows = (await res.json()) as Record<string, unknown>[];
  return fromDb(rows[0]);
}

/* ─────────────── API PUBLIQUE (inchangée) ─────────────── */

export async function listBookings(): Promise<Booking[]> {
  if (useSupabase()) return await sbList();
  return await fileReadAll();
}

export async function createBooking(input: {
  slotIso: string;
  durationMin: number;
  purpose: BookingPurpose;
  fullName: string;
  email: string;
  phone: string;
  commune?: string;
  notes?: string;
}): Promise<Booking> {
  const booking: Booking = {
    id: makeId(),
    slotIso: input.slotIso,
    durationMin: input.durationMin,
    purpose: input.purpose,
    fullName: input.fullName.trim(),
    email: input.email.trim(),
    phone: input.phone.trim(),
    commune: input.commune?.trim(),
    notes: input.notes?.slice(0, 800),
    createdAt: new Date().toISOString(),
    status: "confirmed",
  };

  if (useSupabase()) {
    // L'unicité du créneau est garantie par l'index partiel (atomique).
    return await sbCreate(booking);
  }

  // Mode fichier : anti-doublon applicatif (suffisant en dev mono-process).
  const all = await fileReadAll();
  if (all.some((b) => b.slotIso === input.slotIso && b.status !== "cancelled")) {
    throw new Error("Créneau déjà réservé.");
  }
  all.unshift(booking);
  await fileWriteAll(all);
  return booking;
}

/**
 * Génère la grille de créneaux ouverts sur les `daysAhead` prochains jours.
 * Créneaux : lundi-vendredi, 9h, 10h, 11h, 14h, 15h, 16h, 17h.
 * Skip les week-ends. Exclut ceux déjà réservés (quel que soit le store).
 */
export async function listAvailableSlots(daysAhead = 14): Promise<{
  slots: { iso: string; date: string; time: string }[];
}> {
  const all = await listBookings();
  const taken = new Set(
    all.filter((b) => b.status !== "cancelled").map((b) => b.slotIso),
  );
  const HOURS = [9, 10, 11, 14, 15, 16, 17];
  const out: { iso: string; date: string; time: string }[] = [];
  const now = new Date();

  for (let d = 1; d <= daysAhead; d++) {
    const day = new Date(now);
    day.setUTCDate(day.getUTCDate() + d);
    const wd = day.getUTCDay();
    if (wd === 0 || wd === 6) continue; // week-end
    for (const h of HOURS) {
      const slot = new Date(
        Date.UTC(day.getUTCFullYear(), day.getUTCMonth(), day.getUTCDate(), h, 0, 0),
      );
      const iso = slot.toISOString();
      if (taken.has(iso)) continue;
      out.push({
        iso,
        date: new Intl.DateTimeFormat("fr-FR", {
          weekday: "long",
          day: "numeric",
          month: "long",
        }).format(slot),
        time: `${h}h00`,
      });
    }
  }
  return { slots: out };
}
