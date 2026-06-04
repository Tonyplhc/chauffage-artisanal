/**
 * Certifications et formations des techniciens.
 *
 * Suivi conformité : habilitations gaz, frigorigène cat. I, électrique,
 * sécurité travail en hauteur, formations continues fabricants…
 *
 * Alerte expiration : pour chaque certif on a une date d'échéance. Le
 * dashboard signale ce qui expire sous 60 jours.
 */

import { promises as fs } from "node:fs";
import path from "node:path";
import { randomBytes } from "node:crypto";

const DATA_DIR = path.join(process.cwd(), "data");
const CERTIFS_FILE = path.join(DATA_DIR, "certifications.json");

export type CertCategory =
  | "gaz"
  | "frigorigene"
  | "electrique"
  | "securite_hauteur"
  | "amiante"
  | "formation_fabricant"
  | "autre";

export type Certification = {
  id: string;
  techEmail: string;
  techName: string;
  name: string;
  category: CertCategory;
  issuingBody?: string;
  issuedAt: string; // ISO
  expiresAt?: string; // ISO — laissé vide si pas d'échéance
  evidenceUrl?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
};

async function ensureDir() {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
  } catch {}
}

async function readAll(): Promise<Certification[]> {
  try {
    return JSON.parse(await fs.readFile(CERTIFS_FILE, "utf8"));
  } catch {
    return [];
  }
}

async function writeAll(arr: Certification[]) {
  await ensureDir();
  await fs.writeFile(CERTIFS_FILE, JSON.stringify(arr, null, 2), "utf8");
}

function makeId(): string {
  return `cert-${randomBytes(5).toString("hex")}`;
}

export async function listCertifications(opts: {
  techEmail?: string;
  category?: CertCategory;
} = {}): Promise<Certification[]> {
  const all = await readAll();
  return all
    .filter((c) => {
      if (
        opts.techEmail &&
        c.techEmail.toLowerCase() !== opts.techEmail.toLowerCase()
      )
        return false;
      if (opts.category && c.category !== opts.category) return false;
      return true;
    })
    .sort((a, b) => {
      // Priorité : expiré d'abord, puis proche expiration, puis date desc
      const aw = a.expiresAt ? new Date(a.expiresAt).getTime() : Infinity;
      const bw = b.expiresAt ? new Date(b.expiresAt).getTime() : Infinity;
      return aw - bw;
    });
}

export async function getCertification(
  id: string,
): Promise<Certification | null> {
  const all = await readAll();
  return all.find((c) => c.id === id) ?? null;
}

export async function createCertification(input: {
  techEmail: string;
  techName: string;
  name: string;
  category: CertCategory;
  issuingBody?: string;
  issuedAt: string;
  expiresAt?: string;
  evidenceUrl?: string;
  notes?: string;
}): Promise<Certification> {
  if (!input.techEmail?.trim()) throw new Error("Technicien requis");
  if (!input.name?.trim()) throw new Error("Nom certif requis");
  const now = new Date().toISOString();
  const cert: Certification = {
    id: makeId(),
    techEmail: input.techEmail.trim().toLowerCase(),
    techName: input.techName.trim().slice(0, 120),
    name: input.name.trim().slice(0, 200),
    category: input.category,
    issuingBody: input.issuingBody?.trim() || undefined,
    issuedAt: input.issuedAt,
    expiresAt: input.expiresAt || undefined,
    evidenceUrl: input.evidenceUrl?.trim() || undefined,
    notes: input.notes?.slice(0, 1000),
    createdAt: now,
    updatedAt: now,
  };
  const all = await readAll();
  all.push(cert);
  await writeAll(all);
  return cert;
}

export async function updateCertification(
  id: string,
  patch: Partial<Omit<Certification, "id" | "createdAt">>,
): Promise<Certification | null> {
  const all = await readAll();
  const idx = all.findIndex((c) => c.id === id);
  if (idx === -1) return null;
  const next: Certification = {
    ...all[idx],
    ...patch,
    updatedAt: new Date().toISOString(),
  };
  all[idx] = next;
  await writeAll(all);
  return next;
}

export async function deleteCertification(id: string): Promise<boolean> {
  const all = await readAll();
  const next = all.filter((c) => c.id !== id);
  if (next.length === all.length) return false;
  await writeAll(next);
  return true;
}

/* ─────────────── Stats ─────────────── */

export type CertStats = {
  total: number;
  expiringSoon: number; // <60j
  expired: number;
  byCategory: Record<CertCategory, number>;
};

export async function computeStats(): Promise<CertStats> {
  const all = await readAll();
  const stats: CertStats = {
    total: all.length,
    expiringSoon: 0,
    expired: 0,
    byCategory: {
      gaz: 0,
      frigorigene: 0,
      electrique: 0,
      securite_hauteur: 0,
      amiante: 0,
      formation_fabricant: 0,
      autre: 0,
    },
  };
  const now = Date.now();
  for (const c of all) {
    stats.byCategory[c.category] += 1;
    if (c.expiresAt) {
      const t = new Date(c.expiresAt).getTime();
      if (t < now) stats.expired += 1;
      else if (t < now + 60 * 86_400_000) stats.expiringSoon += 1;
    }
  }
  return stats;
}
