/**
 * Store des documents attachés à un lead (devis officiel, fiches techniques,
 * photos chantier, etc.).
 *
 * Persistance dev : `data/documents/<reference>/<filename>` + index dans
 * `data/documents/<reference>/_index.json`.
 *
 * Limites volontaires :
 *   - Pas de versioning : un upload écrase un fichier de même nom
 *   - Taille max 20 MB par fichier (configurable)
 *   - Types autorisés : PDF, images, Word, Excel (élargi pour usage admin)
 */

import { promises as fs } from "node:fs";
import path from "node:path";
import { randomBytes } from "node:crypto";

const DATA_DIR = path.join(process.cwd(), "data");
const DOCS_DIR = path.join(DATA_DIR, "documents");

export const ALLOWED_MIME = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "text/csv",
  "text/plain",
];

export const MAX_BYTES = 20 * 1024 * 1024; // 20 MB

export type LeadDocument = {
  id: string;
  filename: string;
  mime: string;
  size: number;
  uploadedAt: string;
  label?: string;
};

async function ensureDir(p: string) {
  try {
    await fs.mkdir(p, { recursive: true });
  } catch {}
}

function indexPath(reference: string) {
  return path.join(DOCS_DIR, reference, "_index.json");
}

function filePath(reference: string, docId: string) {
  return path.join(DOCS_DIR, reference, docId);
}

export async function listDocuments(reference: string): Promise<LeadDocument[]> {
  try {
    const raw = await fs.readFile(indexPath(reference), "utf8");
    return JSON.parse(raw) as LeadDocument[];
  } catch {
    return [];
  }
}

export async function saveDocument(
  reference: string,
  filename: string,
  mime: string,
  buffer: Buffer,
  label?: string,
): Promise<LeadDocument> {
  const dir = path.join(DOCS_DIR, reference);
  await ensureDir(dir);
  const ext = path.extname(filename) || guessExt(mime);
  const id = `${Date.now()}-${randomBytes(4).toString("hex")}${ext}`;
  await fs.writeFile(filePath(reference, id), buffer);

  const doc: LeadDocument = {
    id,
    filename,
    mime,
    size: buffer.length,
    uploadedAt: new Date().toISOString(),
    label,
  };
  const all = await listDocuments(reference);
  all.unshift(doc);
  await fs.writeFile(indexPath(reference), JSON.stringify(all, null, 2), "utf8");
  return doc;
}

export async function deleteDocument(
  reference: string,
  docId: string,
): Promise<boolean> {
  const all = await listDocuments(reference);
  const idx = all.findIndex((d) => d.id === docId);
  if (idx === -1) return false;
  try {
    await fs.unlink(filePath(reference, docId));
  } catch {}
  all.splice(idx, 1);
  await fs.writeFile(indexPath(reference), JSON.stringify(all, null, 2), "utf8");
  return true;
}

export async function readDocument(
  reference: string,
  docId: string,
): Promise<{ buffer: Buffer; doc: LeadDocument } | null> {
  const all = await listDocuments(reference);
  const doc = all.find((d) => d.id === docId);
  if (!doc) return null;
  try {
    const buffer = await fs.readFile(filePath(reference, docId));
    return { buffer, doc };
  } catch {
    return null;
  }
}

function guessExt(mime: string): string {
  if (mime === "application/pdf") return ".pdf";
  if (mime === "image/jpeg") return ".jpg";
  if (mime === "image/png") return ".png";
  if (mime === "image/webp") return ".webp";
  if (mime === "text/csv") return ".csv";
  if (mime === "text/plain") return ".txt";
  if (mime.includes("wordprocessingml")) return ".docx";
  if (mime.includes("spreadsheetml")) return ".xlsx";
  if (mime === "application/msword") return ".doc";
  if (mime === "application/vnd.ms-excel") return ".xls";
  return "";
}
