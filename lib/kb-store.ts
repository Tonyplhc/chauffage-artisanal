/**
 * Knowledge base interne — wiki d'équipe.
 *
 * Articles markdown courts avec catégories, tags et slug.
 *
 * Pas de versioning / révisions en V1 — juste la dernière version.
 * L'historique des modifications transitera par l'activity log via l'API.
 */

import { promises as fs } from "node:fs";
import path from "node:path";
import { randomBytes } from "node:crypto";

const DATA_DIR = path.join(process.cwd(), "data");
const KB_FILE = path.join(DATA_DIR, "kb-articles.json");

export type KbArticle = {
  id: string;
  slug: string;
  title: string;
  category: string;
  content: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  updatedBy?: string;
};

async function ensureDir() {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
  } catch {}
}

async function readAll(): Promise<KbArticle[]> {
  try {
    return JSON.parse(await fs.readFile(KB_FILE, "utf8"));
  } catch {
    return [];
  }
}

async function writeAll(arr: KbArticle[]) {
  await ensureDir();
  await fs.writeFile(KB_FILE, JSON.stringify(arr, null, 2), "utf8");
}

function makeId(): string {
  return `kb-${randomBytes(5).toString("hex")}`;
}

function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

async function uniqueSlug(base: string, excludeId?: string): Promise<string> {
  const all = await readAll();
  let candidate = base || "article";
  let i = 1;
  while (
    all.some((a) => a.slug === candidate && a.id !== excludeId)
  ) {
    candidate = `${base}-${++i}`;
  }
  return candidate;
}

export async function listArticles(opts: {
  category?: string;
  search?: string;
} = {}): Promise<KbArticle[]> {
  const all = await readAll();
  const q = opts.search?.trim().toLowerCase();
  return all
    .filter((a) => {
      if (opts.category && a.category !== opts.category) return false;
      if (q) {
        const hay = `${a.title} ${a.content} ${a.tags.join(" ")}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    })
    .sort(
      (a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
    );
}

export async function listCategories(): Promise<string[]> {
  const all = await readAll();
  return [...new Set(all.map((a) => a.category).filter(Boolean))].sort();
}

export async function getArticle(id: string): Promise<KbArticle | null> {
  const all = await readAll();
  return all.find((a) => a.id === id) ?? null;
}

export async function getArticleBySlug(slug: string): Promise<KbArticle | null> {
  const all = await readAll();
  return all.find((a) => a.slug === slug) ?? null;
}

export async function createArticle(input: {
  title: string;
  category?: string;
  content?: string;
  tags?: string[];
  updatedBy?: string;
}): Promise<KbArticle> {
  const title = input.title.trim();
  if (!title) throw new Error("Titre requis");
  if (title.length > 200) throw new Error("Titre trop long");
  const slug = await uniqueSlug(slugify(title));
  const now = new Date().toISOString();
  const article: KbArticle = {
    id: makeId(),
    slug,
    title,
    category: input.category?.trim() || "Général",
    content: (input.content ?? "").slice(0, 50_000),
    tags: (input.tags ?? [])
      .map((t) => t.trim())
      .filter(Boolean)
      .slice(0, 20),
    createdAt: now,
    updatedAt: now,
    updatedBy: input.updatedBy,
  };
  const all = await readAll();
  all.push(article);
  await writeAll(all);
  return article;
}

export async function updateArticle(
  id: string,
  patch: Partial<Pick<KbArticle, "title" | "category" | "content" | "tags">>,
  updatedBy?: string,
): Promise<KbArticle | null> {
  const all = await readAll();
  const idx = all.findIndex((a) => a.id === id);
  if (idx === -1) return null;
  const cur = all[idx];
  const next: KbArticle = { ...cur };
  if (patch.title !== undefined) {
    const t = patch.title.trim();
    if (!t) throw new Error("Titre requis");
    if (t !== cur.title) {
      next.title = t;
      next.slug = await uniqueSlug(slugify(t), id);
    }
  }
  if (patch.category !== undefined)
    next.category = patch.category.trim() || "Général";
  if (patch.content !== undefined)
    next.content = patch.content.slice(0, 50_000);
  if (patch.tags !== undefined)
    next.tags = patch.tags.map((t) => t.trim()).filter(Boolean).slice(0, 20);
  next.updatedAt = new Date().toISOString();
  next.updatedBy = updatedBy;
  all[idx] = next;
  await writeAll(all);
  return next;
}

export async function deleteArticle(id: string): Promise<boolean> {
  const all = await readAll();
  const next = all.filter((a) => a.id !== id);
  if (next.length === all.length) return false;
  await writeAll(next);
  return true;
}

/* ─────────────── Markdown light renderer ─────────────── */

/**
 * Mini-Markdown → HTML safe. Pas de support tables ni images en V1.
 * Échappe les `<` `>` `&` d'abord pour rester safe.
 */
export function renderMarkdownLight(md: string): string {
  // Escape HTML
  let html = md
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  // Code blocks ``` ... ```
  html = html.replace(
    /```([\s\S]*?)```/g,
    (_m, code) =>
      `<pre class="kb-pre"><code>${code.replace(/^\n/, "")}</code></pre>`,
  );

  // Lignes
  const lines = html.split("\n");
  const out: string[] = [];
  let inList: "ul" | "ol" | null = null;

  const closeList = () => {
    if (inList) {
      out.push(inList === "ul" ? "</ul>" : "</ol>");
      inList = null;
    }
  };

  for (const raw of lines) {
    const line = raw;
    // Headers
    const h = line.match(/^(#{1,3})\s+(.*)$/);
    if (h) {
      closeList();
      const level = h[1].length;
      out.push(`<h${level} class="kb-h${level}">${inlineMd(h[2])}</h${level}>`);
      continue;
    }
    // UL
    const ulItem = line.match(/^[-*]\s+(.*)$/);
    if (ulItem) {
      if (inList !== "ul") {
        closeList();
        out.push(`<ul class="kb-ul">`);
        inList = "ul";
      }
      out.push(`<li>${inlineMd(ulItem[1])}</li>`);
      continue;
    }
    // OL
    const olItem = line.match(/^\d+\.\s+(.*)$/);
    if (olItem) {
      if (inList !== "ol") {
        closeList();
        out.push(`<ol class="kb-ol">`);
        inList = "ol";
      }
      out.push(`<li>${inlineMd(olItem[1])}</li>`);
      continue;
    }
    // Blank line → close list, separator
    if (line.trim() === "") {
      closeList();
      out.push("");
      continue;
    }
    // Default paragraph
    closeList();
    out.push(`<p class="kb-p">${inlineMd(line)}</p>`);
  }
  closeList();

  return out.filter((l) => l !== undefined).join("\n");
}

function inlineMd(s: string): string {
  return s
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/\*([^*]+)\*/g, "<em>$1</em>")
    .replace(/`([^`]+)`/g, '<code class="kb-code">$1</code>')
    .replace(
      /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g,
      '<a href="$2" class="kb-link" rel="noopener noreferrer" target="_blank">$1</a>',
    );
}
