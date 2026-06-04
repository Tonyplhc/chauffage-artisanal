/**
 * Rappels (reminders) par lead.
 *
 * Cas d'usage : "rappeler M. Dupont mardi à 14h", "vérifier devis dans 3 jours".
 * Stockage : `data/reminders.json` (objet plat). On garde ouvert et historique.
 *
 * Cycle de vie :
 *   - création (pending = firedAt non défini)
 *   - lazy processing : à chaque check, on regarde si dueAt < now → on marque
 *     firedAt. Côté UI, on affiche un compteur de rappels échus + à venir.
 *   - on n'envoie pas d'email automatique en V1 — c'est un signal in-app,
 *     intégré au foreground notifier (l'admin verra le titre clignoter).
 */

import { promises as fs } from "node:fs";
import path from "node:path";
import { randomBytes } from "node:crypto";
import { publish } from "./event-bus";

const DATA_DIR = path.join(process.cwd(), "data");
const REMINDERS_FILE = path.join(DATA_DIR, "reminders.json");

export type Reminder = {
  id: string;
  leadReference: string;
  dueAt: string; // ISO
  note: string;
  createdAt: string;
  createdBy?: string; // email
  firedAt?: string;
  dismissedAt?: string;
};

async function ensureDir() {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
  } catch {}
}

async function readAll(): Promise<Reminder[]> {
  try {
    return JSON.parse(await fs.readFile(REMINDERS_FILE, "utf8"));
  } catch {
    return [];
  }
}

async function writeAll(arr: Reminder[]) {
  await ensureDir();
  await fs.writeFile(REMINDERS_FILE, JSON.stringify(arr, null, 2), "utf8");
}

export type ReminderFilter = {
  leadReference?: string;
  pendingOnly?: boolean;
  firedOnly?: boolean;
  includeDismissed?: boolean;
};

export async function listReminders(
  filter: ReminderFilter = {},
): Promise<Reminder[]> {
  const all = await readAll();
  return all
    .filter((r) => {
      if (filter.leadReference && r.leadReference !== filter.leadReference)
        return false;
      if (filter.pendingOnly && r.firedAt) return false;
      if (filter.firedOnly && !r.firedAt) return false;
      if (!filter.includeDismissed && r.dismissedAt) return false;
      return true;
    })
    .sort((a, b) => new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime());
}

export async function getReminder(id: string): Promise<Reminder | null> {
  const all = await readAll();
  return all.find((r) => r.id === id) ?? null;
}

export async function createReminder(input: {
  leadReference: string;
  dueAt: string;
  note: string;
  createdBy?: string;
}): Promise<Reminder> {
  if (!input.leadReference) throw new Error("leadReference requis");
  const due = new Date(input.dueAt);
  if (isNaN(due.getTime())) throw new Error("dueAt invalide");
  const note = (input.note ?? "").trim();
  if (note.length > 500) throw new Error("Note trop longue (max 500)");
  const all = await readAll();
  const r: Reminder = {
    id: `rem-${randomBytes(5).toString("hex")}`,
    leadReference: input.leadReference,
    dueAt: due.toISOString(),
    note,
    createdAt: new Date().toISOString(),
    createdBy: input.createdBy,
  };
  all.push(r);
  await writeAll(all);
  return r;
}

export async function deleteReminder(id: string): Promise<boolean> {
  const all = await readAll();
  const next = all.filter((r) => r.id !== id);
  if (next.length === all.length) return false;
  await writeAll(next);
  return true;
}

export async function dismissReminder(id: string): Promise<Reminder | null> {
  const all = await readAll();
  const idx = all.findIndex((r) => r.id === id);
  if (idx === -1) return null;
  all[idx] = { ...all[idx], dismissedAt: new Date().toISOString() };
  await writeAll(all);
  return all[idx];
}

export async function snoozeReminder(
  id: string,
  hours: number,
): Promise<Reminder | null> {
  const all = await readAll();
  const idx = all.findIndex((r) => r.id === id);
  if (idx === -1) return null;
  const current = all[idx];
  // Snooze : on repousse dueAt et on efface firedAt
  const base = current.firedAt ? Date.now() : new Date(current.dueAt).getTime();
  const next: Reminder = {
    ...current,
    dueAt: new Date(base + hours * 3600_000).toISOString(),
    firedAt: undefined,
  };
  all[idx] = next;
  await writeAll(all);
  return next;
}

/**
 * Lazy processor : marque les rappels échus mais pas encore "fired" et publie
 * un événement bus pour chaque. Retourne la liste de ceux qui viennent
 * d'être déclenchés.
 */
export async function processDueReminders(
  now: number = Date.now(),
): Promise<Reminder[]> {
  const all = await readAll();
  let changed = false;
  const justFired: Reminder[] = [];
  for (let i = 0; i < all.length; i++) {
    const r = all[i];
    if (!r.firedAt && !r.dismissedAt && new Date(r.dueAt).getTime() <= now) {
      const fired: Reminder = { ...r, firedAt: new Date().toISOString() };
      all[i] = fired;
      justFired.push(fired);
      changed = true;
    }
  }
  if (changed) {
    await writeAll(all);
    // Publish events sur le bus pour que le foreground notifier les compte
    for (const r of justFired) {
      publish({
        type: "lead.reminder_fired",
        at: new Date().toISOString(),
        reference: r.leadReference,
        note: r.note,
        dueAt: r.dueAt,
      });
    }
  }
  return justFired;
}
