/**
 * Audit trail granulaire — diff champ par champ des modifications.
 *
 * Complémentaire à `activity-log` (qui trace les événements métier). Ici on
 * stocke le détail : qui a changé tel champ, valeur avant, valeur après.
 *
 * Utile pour les revues de conformité ("qui a baissé la garantie sur le
 * dossier X et quand ?") et la transparence d'équipe.
 *
 * Limites V1 : pas de versioning complet (= pas de restore one-click). On
 * pourrait reconstruire un état historique en rejouant les diffs, mais ce
 * n'est pas exposé.
 */

import { promises as fs } from "node:fs";
import path from "node:path";
import { randomBytes } from "node:crypto";

const DATA_DIR = path.join(process.cwd(), "data");
const AUDIT_FILE = path.join(DATA_DIR, "audit-diffs.json");
const MAX_ENTRIES = 20_000;

export type FieldDiff = {
  id: string;
  at: string;
  actorEmail?: string;
  entityType: "lead" | "quote" | "contract" | "user" | "settings" | string;
  entityId: string;
  field: string;
  oldValue: unknown;
  newValue: unknown;
  /** Optional path pour les sub-objets (ex: "metadata.tags"). */
  path?: string;
};

async function ensureDir() {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
  } catch {}
}

async function readAll(): Promise<FieldDiff[]> {
  try {
    return JSON.parse(await fs.readFile(AUDIT_FILE, "utf8"));
  } catch {
    return [];
  }
}

async function writeAll(arr: FieldDiff[]) {
  await ensureDir();
  await fs.writeFile(AUDIT_FILE, JSON.stringify(arr, null, 2), "utf8");
}

function makeId(): string {
  return `adf-${randomBytes(5).toString("hex")}`;
}

export type ListOpts = {
  entityType?: string;
  entityId?: string;
  actorEmail?: string;
  field?: string;
  fromDate?: string;
  toDate?: string;
  limit?: number;
};

export async function listDiffs(opts: ListOpts = {}): Promise<FieldDiff[]> {
  const all = await readAll();
  let out = all;
  if (opts.entityType)
    out = out.filter((d) => d.entityType === opts.entityType);
  if (opts.entityId) out = out.filter((d) => d.entityId === opts.entityId);
  if (opts.actorEmail)
    out = out.filter(
      (d) => d.actorEmail?.toLowerCase() === opts.actorEmail!.toLowerCase(),
    );
  if (opts.field) out = out.filter((d) => d.field === opts.field);
  if (opts.fromDate) {
    const t = new Date(opts.fromDate).getTime();
    out = out.filter((d) => new Date(d.at).getTime() >= t);
  }
  if (opts.toDate) {
    const t = new Date(opts.toDate).getTime();
    out = out.filter((d) => new Date(d.at).getTime() <= t);
  }
  out.sort((a, b) => b.at.localeCompare(a.at));
  if (opts.limit) out = out.slice(0, opts.limit);
  return out;
}

function isSameValue(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (typeof a !== typeof b) return false;
  if (a === null || b === null) return false;
  if (typeof a === "object" && typeof b === "object") {
    try {
      return JSON.stringify(a) === JSON.stringify(b);
    } catch {
      return false;
    }
  }
  return false;
}

/**
 * Calcule les diffs entre deux objets pour les champs listés, et persiste.
 * Retourne les diffs créés.
 */
export async function recordDiff(input: {
  entityType: FieldDiff["entityType"];
  entityId: string;
  actorEmail?: string;
  before: Record<string, unknown> | null;
  after: Record<string, unknown>;
  fields?: string[]; // si défini, ne diff que ces champs
}): Promise<FieldDiff[]> {
  const fields =
    input.fields ?? [
      ...new Set([
        ...Object.keys(input.before ?? {}),
        ...Object.keys(input.after),
      ]),
    ];
  const out: FieldDiff[] = [];
  const now = new Date().toISOString();
  for (const field of fields) {
    if (field.startsWith("_")) continue;
    const oldValue = input.before?.[field];
    const newValue = input.after[field];
    if (isSameValue(oldValue, newValue)) continue;
    out.push({
      id: makeId(),
      at: now,
      actorEmail: input.actorEmail,
      entityType: input.entityType,
      entityId: input.entityId,
      field,
      oldValue,
      newValue,
    });
  }
  if (out.length === 0) return out;
  const all = await readAll();
  all.push(...out);
  // Garde la queue la plus récente
  if (all.length > MAX_ENTRIES) {
    all.splice(0, all.length - MAX_ENTRIES);
  }
  await writeAll(all);
  return out;
}

export type DiffStats = {
  total: number;
  byEntity: Record<string, number>;
  topActors: { actor: string; count: number }[];
  topFields: { field: string; count: number }[];
};

export async function computeStats(): Promise<DiffStats> {
  const all = await readAll();
  const byEntity: Record<string, number> = {};
  const actorMap = new Map<string, number>();
  const fieldMap = new Map<string, number>();
  for (const d of all) {
    byEntity[d.entityType] = (byEntity[d.entityType] ?? 0) + 1;
    if (d.actorEmail) {
      actorMap.set(d.actorEmail, (actorMap.get(d.actorEmail) ?? 0) + 1);
    }
    fieldMap.set(d.field, (fieldMap.get(d.field) ?? 0) + 1);
  }
  const topActors = [...actorMap.entries()]
    .map(([actor, count]) => ({ actor, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);
  const topFields = [...fieldMap.entries()]
    .map(([field, count]) => ({ field, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);
  return { total: all.length, byEntity, topActors, topFields };
}
