/**
 * Profils techniciens — compétences, zone de base, disponibilité.
 *
 * Sert le routing intelligent (W27.1) : pour une intervention donnée, on
 * scorera chaque tech sur (skill match + proximité + charge).
 */

import { promises as fs } from "node:fs";
import path from "node:path";
import { randomBytes } from "node:crypto";

const DATA_DIR = path.join(process.cwd(), "data");
const PROFILES_FILE = path.join(DATA_DIR, "tech-profiles.json");

export type Skill =
  | "chaudiere"
  | "pac"
  | "clim"
  | "sanitaire"
  | "enr"
  | "vmc"
  | "depannage";

export type TechProfile = {
  id: string;
  email: string;
  displayName: string;
  skills: Skill[];
  /** Commune de base (slug ou nom libre). */
  homeBase: string;
  /** Rayon d'action préféré (km). */
  maxKmRadius?: number;
  /** Taux horaire indicatif (pour calcul coût intervention si besoin). */
  hourlyRateEur?: number;
  notes?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

async function ensureDir() {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
  } catch {}
}

async function readAll(): Promise<TechProfile[]> {
  try {
    return JSON.parse(await fs.readFile(PROFILES_FILE, "utf8"));
  } catch {
    return [];
  }
}

async function writeAll(arr: TechProfile[]) {
  await ensureDir();
  await fs.writeFile(PROFILES_FILE, JSON.stringify(arr, null, 2), "utf8");
}

function makeId(): string {
  return `tp-${randomBytes(4).toString("hex")}`;
}

export async function listProfiles(opts: {
  isActive?: boolean;
  skill?: Skill;
} = {}): Promise<TechProfile[]> {
  const all = await readAll();
  return all
    .filter((p) => {
      if (opts.isActive !== undefined && p.isActive !== opts.isActive)
        return false;
      if (opts.skill && !p.skills.includes(opts.skill)) return false;
      return true;
    })
    .sort((a, b) => a.displayName.localeCompare(b.displayName));
}

export async function getProfileByEmail(
  email: string,
): Promise<TechProfile | null> {
  const all = await readAll();
  const key = email.toLowerCase();
  return all.find((p) => p.email.toLowerCase() === key) ?? null;
}

export async function getProfile(id: string): Promise<TechProfile | null> {
  const all = await readAll();
  return all.find((p) => p.id === id) ?? null;
}

export async function upsertProfile(input: {
  id?: string;
  email: string;
  displayName: string;
  skills: Skill[];
  homeBase: string;
  maxKmRadius?: number;
  hourlyRateEur?: number;
  notes?: string;
  isActive?: boolean;
}): Promise<TechProfile> {
  if (!input.email?.trim()) throw new Error("Email requis");
  if (!input.displayName?.trim()) throw new Error("Nom requis");
  const all = await readAll();
  const email = input.email.trim().toLowerCase();
  const now = new Date().toISOString();
  let target = all.find((p) =>
    input.id ? p.id === input.id : p.email.toLowerCase() === email,
  );
  if (target) {
    target.email = email;
    target.displayName = input.displayName.trim();
    target.skills = [...new Set(input.skills)];
    target.homeBase = input.homeBase.trim();
    target.maxKmRadius = input.maxKmRadius;
    target.hourlyRateEur = input.hourlyRateEur;
    target.notes = input.notes?.slice(0, 1000);
    if (input.isActive !== undefined) target.isActive = input.isActive;
    target.updatedAt = now;
  } else {
    target = {
      id: makeId(),
      email,
      displayName: input.displayName.trim(),
      skills: [...new Set(input.skills)],
      homeBase: input.homeBase.trim(),
      maxKmRadius: input.maxKmRadius,
      hourlyRateEur: input.hourlyRateEur,
      notes: input.notes?.slice(0, 1000),
      isActive: input.isActive ?? true,
      createdAt: now,
      updatedAt: now,
    };
    all.push(target);
  }
  await writeAll(all);
  return target;
}

export async function deleteProfile(id: string): Promise<boolean> {
  const all = await readAll();
  const next = all.filter((p) => p.id !== id);
  if (next.length === all.length) return false;
  await writeAll(next);
  return true;
}
