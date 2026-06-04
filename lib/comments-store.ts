/**
 * Commentaires fil par lead — distinct des notes (qui restent un champ libre,
 * mono-auteur, sans timeline).
 *
 * Chaque commentaire :
 *   - body texte libre, max 4000 chars
 *   - authorEmail (extrait de la session admin)
 *   - mentions: liste d'emails @mentionnés (extraits par regex)
 *
 * Pas de threads imbriqués en V1 — flat liste chronologique.
 *
 * Soft delete : on garde l'entrée avec deletedAt + body remplacé par "[supprimé]"
 * pour ne pas casser les références dans les logs/exports.
 */

import { promises as fs } from "node:fs";
import path from "node:path";
import { randomBytes } from "node:crypto";

const DATA_DIR = path.join(process.cwd(), "data");
const COMMENTS_FILE = path.join(DATA_DIR, "comments.json");

export type Comment = {
  id: string;
  leadReference: string;
  authorEmail: string;
  body: string;
  mentions: string[];
  createdAt: string;
  deletedAt?: string;
};

async function ensureDir() {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
  } catch {}
}

async function readAll(): Promise<Comment[]> {
  try {
    return JSON.parse(await fs.readFile(COMMENTS_FILE, "utf8"));
  } catch {
    return [];
  }
}

async function writeAll(arr: Comment[]) {
  await ensureDir();
  await fs.writeFile(COMMENTS_FILE, JSON.stringify(arr, null, 2), "utf8");
}

/** Extrait les @mentions d'emails du corps. Format : @user@domain.tld */
export function extractMentions(body: string): string[] {
  const re = /@([a-zA-Z0-9._+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,})/g;
  const out = new Set<string>();
  let m: RegExpExecArray | null;
  while ((m = re.exec(body)) !== null) {
    out.add(m[1].toLowerCase());
  }
  return [...out];
}

export async function listCommentsForLead(
  leadReference: string,
): Promise<Comment[]> {
  const all = await readAll();
  return all
    .filter((c) => c.leadReference === leadReference)
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
}

export async function getComment(id: string): Promise<Comment | null> {
  const all = await readAll();
  return all.find((c) => c.id === id) ?? null;
}

export async function createComment(input: {
  leadReference: string;
  authorEmail: string;
  body: string;
}): Promise<Comment> {
  const body = input.body.trim();
  if (!body) throw new Error("Commentaire vide");
  if (body.length > 4000) throw new Error("Commentaire trop long (max 4000)");
  const all = await readAll();
  const c: Comment = {
    id: `cmt-${randomBytes(5).toString("hex")}`,
    leadReference: input.leadReference,
    authorEmail: input.authorEmail,
    body,
    mentions: extractMentions(body),
    createdAt: new Date().toISOString(),
  };
  all.push(c);
  await writeAll(all);
  return c;
}

export async function deleteComment(
  id: string,
  callerEmail: string,
): Promise<Comment | null> {
  const all = await readAll();
  const idx = all.findIndex((c) => c.id === id);
  if (idx === -1) return null;
  if (all[idx].authorEmail !== callerEmail) {
    throw new Error("Seul l'auteur peut supprimer son commentaire");
  }
  // Soft delete
  const next: Comment = {
    ...all[idx],
    body: "[supprimé]",
    mentions: [],
    deletedAt: new Date().toISOString(),
  };
  all[idx] = next;
  await writeAll(all);
  return next;
}

/** Liste les commentaires où un email est mentionné, plus récents en premier. */
export async function listCommentsMentioning(
  email: string,
  limit = 50,
): Promise<Comment[]> {
  const all = await readAll();
  const target = email.toLowerCase();
  return all
    .filter((c) => !c.deletedAt && c.mentions.includes(target))
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    )
    .slice(0, limit);
}
