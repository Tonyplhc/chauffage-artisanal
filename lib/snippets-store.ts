/**
 * Snippet library — réponses-types réutilisables par l'admin.
 *
 * Cas d'usage typiques :
 *   - réponse rapide dans le chat
 *   - boilerplate à insérer dans un email template
 *   - rappel/checklist à coller dans une note de lead
 *
 * Variables dynamiques supportées dans le contenu :
 *   - {{lead.fullName}}, {{lead.commune}}, {{lead.reference}}
 *   - {{brand.name}}, {{brand.phone}}
 *
 * L'interpolation est laissée au call-site (chat, template editor) — le store
 * ne fait que persister le contenu brut.
 */

import { promises as fs } from "node:fs";
import path from "node:path";
import { randomBytes } from "node:crypto";

const DATA_DIR = path.join(process.cwd(), "data");
const SNIPPETS_FILE = path.join(DATA_DIR, "snippets.json");

export type Snippet = {
  id: string;
  title: string;
  category: string; // ex "Chat", "Email", "Note", "Devis"
  content: string;
  createdAt: string;
  updatedAt: string;
  /** Compteur d'utilisation pour suggérer les plus utilisés en haut. */
  usageCount: number;
};

async function ensureDir() {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
  } catch {}
}

async function readAll(): Promise<Snippet[]> {
  try {
    return JSON.parse(await fs.readFile(SNIPPETS_FILE, "utf8"));
  } catch {
    return [];
  }
}

async function writeAll(snippets: Snippet[]) {
  await ensureDir();
  await fs.writeFile(SNIPPETS_FILE, JSON.stringify(snippets, null, 2), "utf8");
}

function makeId(): string {
  return `snip-${randomBytes(5).toString("hex")}`;
}

export async function listSnippets(): Promise<Snippet[]> {
  return await readAll();
}

export async function getSnippet(id: string): Promise<Snippet | null> {
  const all = await readAll();
  return all.find((s) => s.id === id) ?? null;
}

export async function createSnippet(input: {
  title: string;
  category: string;
  content: string;
}): Promise<Snippet> {
  const title = input.title.trim();
  if (!title) throw new Error("Titre requis");
  if (title.length > 120) throw new Error("Titre trop long (max 120)");
  const category = input.category.trim() || "Général";
  const content = input.content;
  if (!content || !content.trim()) throw new Error("Contenu requis");
  if (content.length > 8000) throw new Error("Contenu trop long (max 8000)");

  const all = await readAll();
  const now = new Date().toISOString();
  const snip: Snippet = {
    id: makeId(),
    title,
    category,
    content,
    createdAt: now,
    updatedAt: now,
    usageCount: 0,
  };
  all.push(snip);
  await writeAll(all);
  return snip;
}

export async function updateSnippet(
  id: string,
  patch: Partial<Pick<Snippet, "title" | "category" | "content">>,
): Promise<Snippet | null> {
  const all = await readAll();
  const idx = all.findIndex((s) => s.id === id);
  if (idx === -1) return null;
  const cur = all[idx];
  const next: Snippet = { ...cur };
  if (patch.title !== undefined) {
    const t = patch.title.trim();
    if (!t) throw new Error("Titre requis");
    if (t.length > 120) throw new Error("Titre trop long");
    next.title = t;
  }
  if (patch.category !== undefined) {
    next.category = patch.category.trim() || "Général";
  }
  if (patch.content !== undefined) {
    if (!patch.content || !patch.content.trim()) {
      throw new Error("Contenu requis");
    }
    if (patch.content.length > 8000) throw new Error("Contenu trop long");
    next.content = patch.content;
  }
  next.updatedAt = new Date().toISOString();
  all[idx] = next;
  await writeAll(all);
  return next;
}

export async function deleteSnippet(id: string): Promise<boolean> {
  const all = await readAll();
  const next = all.filter((s) => s.id !== id);
  if (next.length === all.length) return false;
  await writeAll(next);
  return true;
}

export async function recordUsage(id: string): Promise<void> {
  const all = await readAll();
  const idx = all.findIndex((s) => s.id === id);
  if (idx === -1) return;
  all[idx].usageCount += 1;
  all[idx].updatedAt = new Date().toISOString();
  await writeAll(all);
}

/**
 * Interpolation simple {{key}} en utilisant un dict de remplacements.
 * Non-strict : les clés manquantes sont laissées telles quelles.
 */
export function interpolateSnippet(
  content: string,
  vars: Record<string, string | undefined>,
): string {
  return content.replace(/\{\{\s*([^}]+?)\s*\}\}/g, (_m, key) => {
    const v = vars[key];
    return v !== undefined ? v : `{{${key}}}`;
  });
}
