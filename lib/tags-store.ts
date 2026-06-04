/**
 * Tags personnalisés — dictionnaire éditable par l'admin.
 *
 * Sépare deux choses :
 *   - Le DICTIONNAIRE de tags (id + label + couleur) → `data/tags.json`
 *   - L'ASSIGNATION d'un lead à des tags → champ `metadata.tags: string[]`
 *     déjà utilisé par les automations (action addTag). On stocke des IDs.
 *
 * Couleur : hex `#rrggbb`. Côté UI, on dérive la couleur de fond (alpha 12%)
 * et texte avec la même teinte saturée.
 *
 * NB: pas de validation Zod sur metadata côté updateLead → on étend
 * librement metadata.tags sans risque de stripping.
 */

import { promises as fs } from "node:fs";
import path from "node:path";
import { randomBytes } from "node:crypto";
import { getLead, updateLead } from "./leads-store";

const DATA_DIR = path.join(process.cwd(), "data");
const TAGS_FILE = path.join(DATA_DIR, "tags.json");

export type Tag = {
  id: string;
  label: string;
  color: string; // #rrggbb
  createdAt: string;
  updatedAt: string;
};

async function ensureDir() {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
  } catch {}
}

async function readAll(): Promise<Tag[]> {
  try {
    return JSON.parse(await fs.readFile(TAGS_FILE, "utf8"));
  } catch {
    return [];
  }
}

async function writeAll(tags: Tag[]) {
  await ensureDir();
  await fs.writeFile(TAGS_FILE, JSON.stringify(tags, null, 2), "utf8");
}

function makeId(): string {
  return `tag-${randomBytes(5).toString("hex")}`;
}

function isValidHex(color: string): boolean {
  return /^#[0-9a-fA-F]{6}$/.test(color);
}

/* ─────────────── Dictionnaire ─────────────── */

export async function listTags(): Promise<Tag[]> {
  return await readAll();
}

export async function getTag(id: string): Promise<Tag | null> {
  const all = await readAll();
  return all.find((t) => t.id === id) ?? null;
}

export async function createTag(input: {
  label: string;
  color: string;
}): Promise<Tag> {
  const label = input.label.trim();
  if (!label) throw new Error("Label requis");
  if (label.length > 60) throw new Error("Label trop long (max 60)");
  const color = input.color.trim();
  if (!isValidHex(color)) throw new Error("Couleur hex invalide (#rrggbb)");

  const all = await readAll();
  if (all.some((t) => t.label.toLowerCase() === label.toLowerCase())) {
    throw new Error("Un tag avec ce label existe déjà");
  }
  const now = new Date().toISOString();
  const tag: Tag = {
    id: makeId(),
    label,
    color,
    createdAt: now,
    updatedAt: now,
  };
  all.push(tag);
  await writeAll(all);
  return tag;
}

export async function updateTag(
  id: string,
  patch: { label?: string; color?: string },
): Promise<Tag | null> {
  const all = await readAll();
  const idx = all.findIndex((t) => t.id === id);
  if (idx === -1) return null;
  const next = { ...all[idx] };
  if (patch.label !== undefined) {
    const label = patch.label.trim();
    if (!label) throw new Error("Label requis");
    if (label.length > 60) throw new Error("Label trop long (max 60)");
    if (
      all.some(
        (t) => t.id !== id && t.label.toLowerCase() === label.toLowerCase(),
      )
    ) {
      throw new Error("Un tag avec ce label existe déjà");
    }
    next.label = label;
  }
  if (patch.color !== undefined) {
    if (!isValidHex(patch.color)) throw new Error("Couleur hex invalide");
    next.color = patch.color;
  }
  next.updatedAt = new Date().toISOString();
  all[idx] = next;
  await writeAll(all);
  return next;
}

export async function deleteTag(id: string): Promise<boolean> {
  const all = await readAll();
  const next = all.filter((t) => t.id !== id);
  if (next.length === all.length) return false;
  await writeAll(next);
  return true;
}

/* ─────────────── Assignation par lead ─────────────── */

function extractTags(metadata: unknown): string[] {
  if (!metadata || typeof metadata !== "object") return [];
  const tags = (metadata as { tags?: unknown }).tags;
  if (!Array.isArray(tags)) return [];
  return tags.filter((t): t is string => typeof t === "string");
}

export async function getLeadTags(reference: string): Promise<string[]> {
  const lead = await getLead(reference);
  if (!lead) return [];
  return extractTags(lead.metadata);
}

export async function setLeadTags(
  reference: string,
  tagIds: string[],
): Promise<string[] | null> {
  const lead = await getLead(reference);
  if (!lead) return null;
  // Dédoublonne + ignore les vides
  const clean = Array.from(
    new Set(tagIds.filter((t) => typeof t === "string" && t.trim())),
  );
  const nextMeta = { ...(lead.metadata ?? {}), tags: clean };
  await updateLead(reference, {
    metadata: nextMeta as typeof lead.metadata,
  });
  return clean;
}
