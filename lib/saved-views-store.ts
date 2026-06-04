/**
 * Saved views — combinaisons filtre/tri persistées par l'admin sur le pipeline.
 *
 * Exemple : "Hot Esch" = status=all, search="level:hot commune:Esch", sort=score_desc.
 *
 * Visibilité :
 *   - private : visible uniquement par l'owner (email)
 *   - shared  : visible par tous les admins
 *
 * Pas de droits d'édition partagés — seul l'owner peut éditer/supprimer ses
 * propres vues (même partagées).
 */

import { promises as fs } from "node:fs";
import path from "node:path";
import { randomBytes } from "node:crypto";

const DATA_DIR = path.join(process.cwd(), "data");
const VIEWS_FILE = path.join(DATA_DIR, "saved-views.json");

export type SavedViewState = {
  status: string;
  search: string;
  timeFilter: string;
  sortKey: string;
  assigneeFilter: string;
};

export type SavedView = {
  id: string;
  name: string;
  ownerEmail?: string;
  isShared: boolean;
  state: SavedViewState;
  createdAt: string;
  updatedAt: string;
};

async function ensureDir() {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
  } catch {}
}

async function readAll(): Promise<SavedView[]> {
  try {
    return JSON.parse(await fs.readFile(VIEWS_FILE, "utf8"));
  } catch {
    return [];
  }
}

async function writeAll(views: SavedView[]) {
  await ensureDir();
  await fs.writeFile(VIEWS_FILE, JSON.stringify(views, null, 2), "utf8");
}

function makeId(): string {
  return `view-${randomBytes(5).toString("hex")}`;
}

/** Liste filtrée pour un user : ses vues privées + toutes les partagées. */
export async function listViewsFor(
  userEmail?: string,
): Promise<SavedView[]> {
  const all = await readAll();
  return all
    .filter((v) => v.isShared || (!!userEmail && v.ownerEmail === userEmail))
    .sort((a, b) => {
      // Ordre : partagées en bas, sinon par updatedAt desc
      if (a.isShared !== b.isShared) return a.isShared ? 1 : -1;
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });
}

export async function getView(id: string): Promise<SavedView | null> {
  const all = await readAll();
  return all.find((v) => v.id === id) ?? null;
}

export async function createView(input: {
  name: string;
  ownerEmail?: string;
  isShared?: boolean;
  state: SavedViewState;
}): Promise<SavedView> {
  const name = input.name.trim();
  if (!name) throw new Error("Nom requis");
  if (name.length > 60) throw new Error("Nom trop long (max 60)");
  const all = await readAll();
  const now = new Date().toISOString();
  const v: SavedView = {
    id: makeId(),
    name,
    ownerEmail: input.ownerEmail,
    isShared: !!input.isShared,
    state: input.state,
    createdAt: now,
    updatedAt: now,
  };
  all.push(v);
  await writeAll(all);
  return v;
}

export async function updateView(
  id: string,
  patch: Partial<Pick<SavedView, "name" | "isShared" | "state">>,
  callerEmail?: string,
): Promise<SavedView | null> {
  const all = await readAll();
  const idx = all.findIndex((v) => v.id === id);
  if (idx === -1) return null;
  const cur = all[idx];
  // Ownership : seul l'owner peut éditer
  if (cur.ownerEmail && cur.ownerEmail !== callerEmail) {
    throw new Error("Vue verrouillée — seul son auteur peut l'éditer");
  }
  const next: SavedView = { ...cur };
  if (patch.name !== undefined) {
    const n = patch.name.trim();
    if (!n) throw new Error("Nom requis");
    if (n.length > 60) throw new Error("Nom trop long");
    next.name = n;
  }
  if (patch.isShared !== undefined) next.isShared = patch.isShared;
  if (patch.state !== undefined) next.state = patch.state;
  next.updatedAt = new Date().toISOString();
  all[idx] = next;
  await writeAll(all);
  return next;
}

export async function deleteView(
  id: string,
  callerEmail?: string,
): Promise<boolean> {
  const all = await readAll();
  const cur = all.find((v) => v.id === id);
  if (!cur) return false;
  if (cur.ownerEmail && cur.ownerEmail !== callerEmail) {
    throw new Error("Vue verrouillée — seul son auteur peut la supprimer");
  }
  const next = all.filter((v) => v.id !== id);
  await writeAll(next);
  return true;
}
