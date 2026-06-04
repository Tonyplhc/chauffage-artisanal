/**
 * Tâches administratives récurrentes — checklist de l'opérateur.
 *
 * Exemples : "Revue mensuelle catalogue prix", "Audit annuel certifications
 * techniciens", "Vérification trimestrielle des contrats fournisseurs".
 *
 * Une tâche a une fréquence et une prochaine échéance. Quand l'admin la
 * marque "faite", la prochaine échéance avance automatiquement.
 */

import { promises as fs } from "node:fs";
import path from "node:path";
import { randomBytes } from "node:crypto";

const DATA_DIR = path.join(process.cwd(), "data");
const TASKS_FILE = path.join(DATA_DIR, "recurring-tasks.json");

export type Frequency =
  | "daily"
  | "weekly"
  | "monthly"
  | "quarterly"
  | "yearly";

export type TaskStatus = "active" | "paused";

export type RecurringTask = {
  id: string;
  title: string;
  description?: string;
  category?: string;
  frequency: Frequency;
  /** Prochaine échéance — ISO. */
  nextDueAt: string;
  lastDoneAt?: string;
  owner?: string; // email user responsable
  status: TaskStatus;
  createdAt: string;
  updatedAt: string;
};

async function ensureDir() {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
  } catch {}
}

async function readAll(): Promise<RecurringTask[]> {
  try {
    return JSON.parse(await fs.readFile(TASKS_FILE, "utf8"));
  } catch {
    return [];
  }
}

async function writeAll(arr: RecurringTask[]) {
  await ensureDir();
  await fs.writeFile(TASKS_FILE, JSON.stringify(arr, null, 2), "utf8");
}

function makeId(): string {
  return `rt-${randomBytes(5).toString("hex")}`;
}

export function nextOccurrence(fromIso: string, freq: Frequency): string {
  const d = new Date(fromIso);
  if (freq === "daily") d.setUTCDate(d.getUTCDate() + 1);
  else if (freq === "weekly") d.setUTCDate(d.getUTCDate() + 7);
  else if (freq === "monthly") d.setUTCMonth(d.getUTCMonth() + 1);
  else if (freq === "quarterly") d.setUTCMonth(d.getUTCMonth() + 3);
  else if (freq === "yearly") d.setUTCFullYear(d.getUTCFullYear() + 1);
  return d.toISOString();
}

export async function listTasks(opts: {
  status?: TaskStatus;
  owner?: string;
} = {}): Promise<RecurringTask[]> {
  const all = await readAll();
  return all
    .filter((t) => {
      if (opts.status && t.status !== opts.status) return false;
      if (
        opts.owner &&
        (t.owner ?? "").toLowerCase() !== opts.owner.toLowerCase()
      )
        return false;
      return true;
    })
    .sort((a, b) => a.nextDueAt.localeCompare(b.nextDueAt));
}

export async function getTask(id: string): Promise<RecurringTask | null> {
  const all = await readAll();
  return all.find((t) => t.id === id) ?? null;
}

export async function createTask(input: {
  title: string;
  description?: string;
  category?: string;
  frequency: Frequency;
  startDate?: string;
  owner?: string;
}): Promise<RecurringTask> {
  if (!input.title?.trim()) throw new Error("Titre requis");
  const now = new Date();
  const startDate = input.startDate ?? now.toISOString();
  const task: RecurringTask = {
    id: makeId(),
    title: input.title.trim().slice(0, 200),
    description: input.description?.slice(0, 2000) || undefined,
    category: input.category?.trim() || undefined,
    frequency: input.frequency,
    nextDueAt: startDate,
    owner: input.owner?.trim().toLowerCase() || undefined,
    status: "active",
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
  };
  const all = await readAll();
  all.push(task);
  await writeAll(all);
  return task;
}

export async function updateTask(
  id: string,
  patch: Partial<
    Pick<
      RecurringTask,
      "title" | "description" | "category" | "frequency" | "owner" | "status" | "nextDueAt"
    >
  >,
): Promise<RecurringTask | null> {
  const all = await readAll();
  const idx = all.findIndex((t) => t.id === id);
  if (idx === -1) return null;
  const cur = all[idx];
  const next: RecurringTask = { ...cur };
  if (patch.title !== undefined) next.title = patch.title.trim();
  if (patch.description !== undefined)
    next.description = patch.description?.slice(0, 2000) || undefined;
  if (patch.category !== undefined)
    next.category = patch.category?.trim() || undefined;
  if (patch.frequency !== undefined) next.frequency = patch.frequency;
  if (patch.owner !== undefined)
    next.owner = patch.owner?.trim().toLowerCase() || undefined;
  if (patch.status !== undefined) next.status = patch.status;
  if (patch.nextDueAt !== undefined) next.nextDueAt = patch.nextDueAt;
  next.updatedAt = new Date().toISOString();
  all[idx] = next;
  await writeAll(all);
  return next;
}

export async function markDone(id: string): Promise<RecurringTask | null> {
  const all = await readAll();
  const idx = all.findIndex((t) => t.id === id);
  if (idx === -1) return null;
  const cur = all[idx];
  const now = new Date().toISOString();
  const next: RecurringTask = {
    ...cur,
    lastDoneAt: now,
    nextDueAt: nextOccurrence(now, cur.frequency),
    updatedAt: now,
  };
  all[idx] = next;
  await writeAll(all);
  return next;
}

export async function deleteTask(id: string): Promise<boolean> {
  const all = await readAll();
  const next = all.filter((t) => t.id !== id);
  if (next.length === all.length) return false;
  await writeAll(next);
  return true;
}

/* ─────────────── Stats ─────────────── */

export type RecurringStats = {
  total: number;
  active: number;
  paused: number;
  overdue: number;
  dueWithin7d: number;
};

export async function computeStats(): Promise<RecurringStats> {
  const all = await readAll();
  const now = Date.now();
  const stats: RecurringStats = {
    total: all.length,
    active: 0,
    paused: 0,
    overdue: 0,
    dueWithin7d: 0,
  };
  for (const t of all) {
    if (t.status === "paused") {
      stats.paused += 1;
      continue;
    }
    stats.active += 1;
    const due = new Date(t.nextDueAt).getTime();
    if (due < now) stats.overdue += 1;
    else if (due < now + 7 * 86_400_000) stats.dueWithin7d += 1;
  }
  return stats;
}
