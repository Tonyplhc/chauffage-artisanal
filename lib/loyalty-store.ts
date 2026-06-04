/**
 * Programme fidélité client — points cumulés + paliers.
 *
 * Events qui rapportent des points (modifiables) :
 *   conversion           : +100
 *   parrainage (par lead amené converti) : +50
 *   contrat entretien actif : +25 (annuel)
 *   nps promoteur (9-10) : +30
 *   nps passif (7-8)     : +10
 *   manuel               : adjustable
 *
 * Paliers (cumul) :
 *   bronze    : 0+
 *   silver    : 150+
 *   gold      : 400+
 *   platinum  : 1000+
 *
 * Pas d'expiration en V1. Le compte est créé lazy quand on ajoute des points.
 */

import { promises as fs } from "node:fs";
import path from "node:path";
import { randomBytes } from "node:crypto";

const DATA_DIR = path.join(process.cwd(), "data");
const LOYALTY_FILE = path.join(DATA_DIR, "loyalty-accounts.json");

export type LoyaltyTier = "bronze" | "silver" | "gold" | "platinum";

export type LoyaltyEvent = {
  id: string;
  at: string;
  points: number;
  kind:
    | "conversion"
    | "referral_converted"
    | "maintenance_active"
    | "nps_promoter"
    | "nps_passive"
    | "manual_adjust";
  reason?: string;
};

export type LoyaltyAccount = {
  leadReference: string;
  clientName: string;
  email: string;
  points: number;
  tier: LoyaltyTier;
  history: LoyaltyEvent[];
  createdAt: string;
  updatedAt: string;
};

export function tierFor(points: number): LoyaltyTier {
  if (points >= 1000) return "platinum";
  if (points >= 400) return "gold";
  if (points >= 150) return "silver";
  return "bronze";
}

async function ensureDir() {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
  } catch {}
}

async function readAll(): Promise<LoyaltyAccount[]> {
  try {
    return JSON.parse(await fs.readFile(LOYALTY_FILE, "utf8"));
  } catch {
    return [];
  }
}

async function writeAll(arr: LoyaltyAccount[]) {
  await ensureDir();
  await fs.writeFile(LOYALTY_FILE, JSON.stringify(arr, null, 2), "utf8");
}

function makeEventId(): string {
  return `lev-${randomBytes(4).toString("hex")}`;
}

export async function listAccounts(): Promise<LoyaltyAccount[]> {
  const all = await readAll();
  return [...all].sort((a, b) => b.points - a.points);
}

export async function getAccount(
  leadReference: string,
): Promise<LoyaltyAccount | null> {
  const all = await readAll();
  return all.find((a) => a.leadReference === leadReference) ?? null;
}

export async function ensureAccount(input: {
  leadReference: string;
  clientName: string;
  email: string;
}): Promise<LoyaltyAccount> {
  const existing = await getAccount(input.leadReference);
  if (existing) return existing;
  const now = new Date().toISOString();
  const account: LoyaltyAccount = {
    leadReference: input.leadReference,
    clientName: input.clientName,
    email: input.email,
    points: 0,
    tier: "bronze",
    history: [],
    createdAt: now,
    updatedAt: now,
  };
  const all = await readAll();
  all.push(account);
  await writeAll(all);
  return account;
}

export async function addEvent(
  leadReference: string,
  kind: LoyaltyEvent["kind"],
  points: number,
  reason?: string,
  clientInfo?: { name: string; email: string },
): Promise<LoyaltyAccount | null> {
  const all = await readAll();
  let idx = all.findIndex((a) => a.leadReference === leadReference);
  if (idx === -1) {
    if (!clientInfo) return null;
    // Crée le compte si on a les infos
    const now = new Date().toISOString();
    all.push({
      leadReference,
      clientName: clientInfo.name,
      email: clientInfo.email,
      points: 0,
      tier: "bronze",
      history: [],
      createdAt: now,
      updatedAt: now,
    });
    idx = all.length - 1;
  }
  const event: LoyaltyEvent = {
    id: makeEventId(),
    at: new Date().toISOString(),
    points,
    kind,
    reason,
  };
  const updated: LoyaltyAccount = {
    ...all[idx],
    points: Math.max(0, all[idx].points + points),
    history: [...all[idx].history, event],
    updatedAt: new Date().toISOString(),
  };
  updated.tier = tierFor(updated.points);
  all[idx] = updated;
  await writeAll(all);
  return updated;
}

export async function setManualAdjustment(
  leadReference: string,
  delta: number,
  reason: string,
): Promise<LoyaltyAccount | null> {
  return addEvent(leadReference, "manual_adjust", delta, reason);
}

/* ─────────────── Stats ─────────────── */

export type LoyaltyStats = {
  totalAccounts: number;
  totalPoints: number;
  byTier: Record<LoyaltyTier, number>;
};

export async function computeStats(): Promise<LoyaltyStats> {
  const all = await readAll();
  const stats: LoyaltyStats = {
    totalAccounts: all.length,
    totalPoints: 0,
    byTier: { bronze: 0, silver: 0, gold: 0, platinum: 0 },
  };
  for (const a of all) {
    stats.totalPoints += a.points;
    stats.byTier[a.tier] += 1;
  }
  return stats;
}
