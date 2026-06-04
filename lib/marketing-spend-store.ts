/**
 * Budget marketing mensuel par source d'acquisition.
 *
 * Saisi par l'admin pour calculer CAC + ROI sur la page marketing.
 * Une entrée par source (utm_source ou "direct"). Devise EUR uniquement
 * en V1.
 */

import { promises as fs } from "node:fs";
import path from "node:path";

const DATA_DIR = path.join(process.cwd(), "data");
const SPEND_FILE = path.join(DATA_DIR, "marketing-spend.json");

export type MarketingSpend = {
  source: string;
  monthlyEur: number;
  notes?: string;
  updatedAt: string;
};

async function ensureDir() {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
  } catch {}
}

async function readAll(): Promise<MarketingSpend[]> {
  try {
    return JSON.parse(await fs.readFile(SPEND_FILE, "utf8"));
  } catch {
    return [];
  }
}

async function writeAll(arr: MarketingSpend[]) {
  await ensureDir();
  await fs.writeFile(SPEND_FILE, JSON.stringify(arr, null, 2), "utf8");
}

export async function listSpend(): Promise<MarketingSpend[]> {
  return await readAll();
}

export async function getSpend(source: string): Promise<MarketingSpend | null> {
  const all = await readAll();
  const k = source.toLowerCase();
  return all.find((s) => s.source.toLowerCase() === k) ?? null;
}

export async function upsertSpend(input: {
  source: string;
  monthlyEur: number;
  notes?: string;
}): Promise<MarketingSpend> {
  if (!input.source.trim()) throw new Error("source requise");
  const all = await readAll();
  const k = input.source.toLowerCase().trim();
  const now = new Date().toISOString();
  let existing = all.find((s) => s.source.toLowerCase() === k);
  if (existing) {
    existing.monthlyEur = Math.max(0, Math.round(input.monthlyEur));
    existing.notes = input.notes?.slice(0, 400);
    existing.updatedAt = now;
  } else {
    existing = {
      source: input.source.trim(),
      monthlyEur: Math.max(0, Math.round(input.monthlyEur)),
      notes: input.notes?.slice(0, 400),
      updatedAt: now,
    };
    all.push(existing);
  }
  await writeAll(all);
  return existing;
}

export async function deleteSpend(source: string): Promise<boolean> {
  const all = await readAll();
  const k = source.toLowerCase();
  const next = all.filter((s) => s.source.toLowerCase() !== k);
  if (next.length === all.length) return false;
  await writeAll(next);
  return true;
}
