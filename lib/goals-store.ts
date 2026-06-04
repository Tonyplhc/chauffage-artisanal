/**
 * Objectifs mensuels — cibles à atteindre par mois calendaire.
 *
 * Trois métriques :
 *   - leadsTarget    : nombre de leads reçus dans le mois
 *   - convertedTarget: nombre de conversions dans le mois
 *   - revenueTarget  : chiffre d'affaires réalisé (somme valeur explicit/budget des leads convertis)
 *
 * Toutes optionnelles individuellement — laisser à 0 désactive le tracking
 * de la métrique pour le mois.
 *
 * Persistance : `data/goals.json` indexé par period (YYYY-MM).
 */

import { promises as fs } from "node:fs";
import path from "node:path";
import { listLeads } from "./leads-store";
import { getLeadValue } from "./pipeline-value";
import type { LeadRecord } from "./devis-schema";

const DATA_DIR = path.join(process.cwd(), "data");
const GOALS_FILE = path.join(DATA_DIR, "goals.json");

export type Goal = {
  period: string; // YYYY-MM
  leadsTarget: number;
  convertedTarget: number;
  revenueTarget: number; // EUR
  createdAt: string;
  updatedAt: string;
};

async function ensureDir() {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
  } catch {}
}

async function readAll(): Promise<Goal[]> {
  try {
    return JSON.parse(await fs.readFile(GOALS_FILE, "utf8"));
  } catch {
    return [];
  }
}

async function writeAll(arr: Goal[]) {
  await ensureDir();
  await fs.writeFile(GOALS_FILE, JSON.stringify(arr, null, 2), "utf8");
}

function validPeriod(p: string): boolean {
  return /^\d{4}-(0[1-9]|1[0-2])$/.test(p);
}

export function currentPeriod(d = new Date()): string {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

export async function listGoals(): Promise<Goal[]> {
  const all = await readAll();
  return [...all].sort((a, b) => (a.period < b.period ? 1 : -1));
}

export async function getGoal(period: string): Promise<Goal | null> {
  const all = await readAll();
  return all.find((g) => g.period === period) ?? null;
}

export async function upsertGoal(input: {
  period: string;
  leadsTarget: number;
  convertedTarget: number;
  revenueTarget: number;
}): Promise<Goal> {
  if (!validPeriod(input.period)) throw new Error("period invalide (YYYY-MM)");
  const lt = Math.max(0, Math.round(input.leadsTarget));
  const ct = Math.max(0, Math.round(input.convertedTarget));
  const rt = Math.max(0, Math.round(input.revenueTarget));
  const all = await readAll();
  const idx = all.findIndex((g) => g.period === input.period);
  const now = new Date().toISOString();
  if (idx === -1) {
    const g: Goal = {
      period: input.period,
      leadsTarget: lt,
      convertedTarget: ct,
      revenueTarget: rt,
      createdAt: now,
      updatedAt: now,
    };
    all.push(g);
    await writeAll(all);
    return g;
  }
  const next: Goal = {
    ...all[idx],
    leadsTarget: lt,
    convertedTarget: ct,
    revenueTarget: rt,
    updatedAt: now,
  };
  all[idx] = next;
  await writeAll(all);
  return next;
}

export async function deleteGoal(period: string): Promise<boolean> {
  const all = await readAll();
  const next = all.filter((g) => g.period !== period);
  if (next.length === all.length) return false;
  await writeAll(next);
  return true;
}

/* ─────────────── Progress computation ─────────────── */

export type GoalProgress = {
  period: string;
  goal: Goal | null;
  // Metrics actuelles
  leadsCount: number;
  convertedCount: number;
  revenue: number;
  // Progression 0..1
  leadsProgress: number | null;
  convertedProgress: number | null;
  revenueProgress: number | null;
  // Position dans le mois (0..1)
  monthElapsed: number;
  // Pace : ratio progress / monthElapsed → 1 = pile à l'heure, >1 = en avance
  leadsPace: number | null;
  convertedPace: number | null;
  revenuePace: number | null;
  // Projection fin de mois si on garde le rythme actuel
  leadsProjected: number;
  convertedProjected: number;
  revenueProjected: number;
};

function monthBounds(period: string): {
  from: Date;
  to: Date;
  totalMs: number;
  elapsedMs: number;
} {
  const [year, month] = period.split("-").map(Number);
  const from = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0, 0));
  const to = new Date(Date.UTC(year, month, 1, 0, 0, 0, 0));
  const totalMs = to.getTime() - from.getTime();
  const now = Date.now();
  const elapsedMs = Math.max(0, Math.min(totalMs, now - from.getTime()));
  return { from, to, totalMs, elapsedMs };
}

function ratio(actual: number, target: number): number | null {
  if (target <= 0) return null;
  return actual / target;
}

function pace(progress: number | null, elapsed: number): number | null {
  if (progress === null || elapsed <= 0) return null;
  return progress / elapsed;
}

export async function computeProgress(period: string): Promise<GoalProgress> {
  const goal = await getGoal(period);
  const leads = await listLeads();
  const { from, to, totalMs, elapsedMs } = monthBounds(period);
  const fromMs = from.getTime();
  const toMs = to.getTime();

  const monthLeads = leads.filter((l) => {
    const t = new Date(l.submittedAt).getTime();
    return t >= fromMs && t < toMs;
  });
  const monthConverted = monthLeads.filter((l) => l.status === "converti");
  const revenue = monthConverted.reduce(
    (sum, l) => sum + getLeadValue(l as LeadRecord),
    0,
  );

  const monthElapsed = totalMs === 0 ? 1 : elapsedMs / totalMs;

  const leadsProgress = ratio(monthLeads.length, goal?.leadsTarget ?? 0);
  const convertedProgress = ratio(
    monthConverted.length,
    goal?.convertedTarget ?? 0,
  );
  const revenueProgress = ratio(revenue, goal?.revenueTarget ?? 0);

  // Projection : si on a déjà du temps écoulé, extrapole en fin de mois
  const projector = (count: number) =>
    monthElapsed > 0 ? count / monthElapsed : count;

  return {
    period,
    goal,
    leadsCount: monthLeads.length,
    convertedCount: monthConverted.length,
    revenue,
    leadsProgress,
    convertedProgress,
    revenueProgress,
    monthElapsed,
    leadsPace: pace(leadsProgress, monthElapsed),
    convertedPace: pace(convertedProgress, monthElapsed),
    revenuePace: pace(revenueProgress, monthElapsed),
    leadsProjected: Math.round(projector(monthLeads.length)),
    convertedProjected: Math.round(projector(monthConverted.length)),
    revenueProjected: Math.round(projector(revenue)),
  };
}
