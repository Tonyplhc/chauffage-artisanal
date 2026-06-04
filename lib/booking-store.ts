/**
 * Réservations RDV publiques.
 *
 * Stocke les réservations soumises depuis /rendez-vous. Liste de créneaux
 * disponibles calculée à la volée depuis la grille standard, en excluant
 * ceux déjà pris.
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

const DATA_DIR = path.join(process.cwd(), "data");
const FILE = path.join(DATA_DIR, "bookings.json");

async function ensureDir() {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
  } catch {}
}

async function readAll(): Promise<Booking[]> {
  try {
    return JSON.parse(await fs.readFile(FILE, "utf8"));
  } catch {
    return [];
  }
}

async function writeAll(arr: Booking[]) {
  await ensureDir();
  await fs.writeFile(FILE, JSON.stringify(arr, null, 2), "utf8");
}

function makeId(): string {
  return `bkg-${randomBytes(5).toString("hex")}`;
}

export async function listBookings(): Promise<Booking[]> {
  return await readAll();
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
  const all = await readAll();
  // Anti-doublon : un même créneau ne peut être pris qu'une fois
  if (all.some((b) => b.slotIso === input.slotIso && b.status !== "cancelled")) {
    throw new Error("Créneau déjà réservé.");
  }
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
  all.unshift(booking);
  await writeAll(all);
  return booking;
}

/**
 * Génère la grille de créneaux ouverts sur les `daysAhead` prochains jours.
 * Créneaux : lundi-vendredi, 9h, 10h, 11h, 14h, 15h, 16h, 17h.
 * Skip les week-ends. Exclut ceux déjà réservés.
 */
export async function listAvailableSlots(daysAhead = 14): Promise<{
  slots: { iso: string; date: string; time: string }[];
}> {
  const all = await readAll();
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
