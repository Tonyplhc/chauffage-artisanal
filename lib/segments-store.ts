/**
 * Smart segments — cohortes nommées de leads définies par une expression de
 * recherche (réutilise la grammaire search-operators).
 *
 * Différence avec saved-views (W17.2) : un segment est destiné à être **agi**
 * (envoi groupé, bulk update, export), pas juste à filtrer l'UI pipeline.
 *
 * Évaluation à la demande : on stocke la query, on recalcule les membres au
 * GET. Pas de cache — la table de leads reste petite en file-store.
 */

import { promises as fs } from "node:fs";
import path from "node:path";
import { randomBytes } from "node:crypto";
import {
  parseSearch,
  applySearchFilters,
  type SearchFilters,
} from "./search-operators";
import { listLeads } from "./leads-store";
import type { LeadRecord } from "./devis-schema";

const DATA_DIR = path.join(process.cwd(), "data");
const SEGMENTS_FILE = path.join(DATA_DIR, "segments.json");

export type Segment = {
  id: string;
  name: string;
  description?: string;
  ownerEmail?: string;
  isShared: boolean;
  query: string; // expression search-operators ; ex "level:hot commune:Esch"
  createdAt: string;
  updatedAt: string;
};

async function ensureDir() {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
  } catch {}
}

async function readAll(): Promise<Segment[]> {
  try {
    return JSON.parse(await fs.readFile(SEGMENTS_FILE, "utf8"));
  } catch {
    return [];
  }
}

async function writeAll(arr: Segment[]) {
  await ensureDir();
  await fs.writeFile(SEGMENTS_FILE, JSON.stringify(arr, null, 2), "utf8");
}

function makeId(): string {
  return `seg-${randomBytes(5).toString("hex")}`;
}

export async function listSegmentsFor(
  userEmail?: string,
): Promise<Segment[]> {
  const all = await readAll();
  return all
    .filter((s) => s.isShared || (!!userEmail && s.ownerEmail === userEmail))
    .sort((a, b) => (a.isShared !== b.isShared ? (a.isShared ? 1 : -1) : 0));
}

export async function getSegment(id: string): Promise<Segment | null> {
  const all = await readAll();
  return all.find((s) => s.id === id) ?? null;
}

export async function createSegment(input: {
  name: string;
  description?: string;
  query: string;
  isShared?: boolean;
  ownerEmail?: string;
}): Promise<Segment> {
  const name = input.name.trim();
  if (!name) throw new Error("Nom requis");
  if (name.length > 80) throw new Error("Nom trop long");
  if (!input.query.trim()) throw new Error("Query requise");
  if (input.query.length > 500) throw new Error("Query trop longue");
  const all = await readAll();
  const now = new Date().toISOString();
  const s: Segment = {
    id: makeId(),
    name,
    description: input.description?.trim() || undefined,
    query: input.query.trim(),
    isShared: !!input.isShared,
    ownerEmail: input.ownerEmail,
    createdAt: now,
    updatedAt: now,
  };
  all.push(s);
  await writeAll(all);
  return s;
}

export async function updateSegment(
  id: string,
  patch: Partial<Pick<Segment, "name" | "description" | "query" | "isShared">>,
  callerEmail?: string,
): Promise<Segment | null> {
  const all = await readAll();
  const idx = all.findIndex((s) => s.id === id);
  if (idx === -1) return null;
  const cur = all[idx];
  if (cur.ownerEmail && cur.ownerEmail !== callerEmail) {
    throw new Error("Segment verrouillé — auteur uniquement");
  }
  const next: Segment = { ...cur };
  if (patch.name !== undefined) {
    const n = patch.name.trim();
    if (!n) throw new Error("Nom requis");
    next.name = n;
  }
  if (patch.description !== undefined)
    next.description = patch.description.trim() || undefined;
  if (patch.query !== undefined) {
    if (!patch.query.trim()) throw new Error("Query requise");
    next.query = patch.query.trim();
  }
  if (patch.isShared !== undefined) next.isShared = patch.isShared;
  next.updatedAt = new Date().toISOString();
  all[idx] = next;
  await writeAll(all);
  return next;
}

export async function deleteSegment(
  id: string,
  callerEmail?: string,
): Promise<boolean> {
  const all = await readAll();
  const cur = all.find((s) => s.id === id);
  if (!cur) return false;
  if (cur.ownerEmail && cur.ownerEmail !== callerEmail) {
    throw new Error("Segment verrouillé — auteur uniquement");
  }
  await writeAll(all.filter((s) => s.id !== id));
  return true;
}

/* ─────────────── Évaluation ─────────────── */

export type SegmentEvaluation = {
  segment: Segment;
  members: LeadRecord[];
  filters: SearchFilters;
};

export async function evaluateSegment(
  id: string,
  opts: { currentUserEmail?: string } = {},
): Promise<SegmentEvaluation | null> {
  const segment = await getSegment(id);
  if (!segment) return null;
  const filters = parseSearch(segment.query);
  const leads = await listLeads();
  const members = applySearchFilters(leads, filters, opts);
  return { segment, members, filters };
}

/** Helper léger : juste le compte de membres, sans charger tous les leads. */
export async function evaluateSegmentCount(
  segment: Segment,
  leads: LeadRecord[],
  currentUserEmail?: string,
): Promise<number> {
  const filters = parseSearch(segment.query);
  return applySearchFilters(leads, filters, { currentUserEmail }).length;
}
