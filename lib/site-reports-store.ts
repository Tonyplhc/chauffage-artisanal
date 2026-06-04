/**
 * Rapports de chantier — galerie photos avant/après par lead.
 *
 * Photos stockées en base64 dans le JSON. Limite pratique : 5 Mo / photo,
 * 30 photos / rapport. Pour la prod : passer sur Supabase storage / S3.
 *
 * Le rapport est visible côté espace client via le token recap existant
 * (même mécanisme que /espace/[ref]?t=…).
 */

import { promises as fs } from "node:fs";
import path from "node:path";
import { randomBytes } from "node:crypto";

const DATA_DIR = path.join(process.cwd(), "data");
const REPORTS_DIR = path.join(DATA_DIR, "site-reports");

export type PhotoKind = "before" | "in_progress" | "after" | "detail";

export type ReportPhoto = {
  id: string;
  kind: PhotoKind;
  caption?: string;
  dataUrl: string; // base64 data URL
  uploadedAt: string;
};

export type SiteReport = {
  leadReference: string;
  title: string;
  summary?: string;
  photos: ReportPhoto[];
  technicianNames?: string[];
  publishedAt?: string; // si défini, visible côté espace client
  createdAt: string;
  updatedAt: string;
};

async function ensureDir() {
  try {
    await fs.mkdir(REPORTS_DIR, { recursive: true });
  } catch {}
}

function reportPath(reference: string): string {
  return path.join(
    REPORTS_DIR,
    `${reference.replace(/[^a-zA-Z0-9_-]/g, "_")}.json`,
  );
}

export async function getReport(
  leadReference: string,
): Promise<SiteReport | null> {
  try {
    return JSON.parse(
      await fs.readFile(reportPath(leadReference), "utf8"),
    );
  } catch {
    return null;
  }
}

export async function ensureReport(
  leadReference: string,
  title?: string,
): Promise<SiteReport> {
  const existing = await getReport(leadReference);
  if (existing) return existing;
  const now = new Date().toISOString();
  const report: SiteReport = {
    leadReference,
    title: title ?? `Rapport de chantier ${leadReference}`,
    photos: [],
    createdAt: now,
    updatedAt: now,
  };
  await ensureDir();
  await fs.writeFile(reportPath(leadReference), JSON.stringify(report, null, 2));
  return report;
}

export async function updateReport(
  leadReference: string,
  patch: Partial<
    Pick<SiteReport, "title" | "summary" | "technicianNames" | "publishedAt">
  >,
): Promise<SiteReport | null> {
  const cur = await getReport(leadReference);
  if (!cur) return null;
  const next: SiteReport = {
    ...cur,
    title: patch.title !== undefined ? patch.title.slice(0, 200) : cur.title,
    summary:
      patch.summary !== undefined
        ? patch.summary.slice(0, 4000) || undefined
        : cur.summary,
    technicianNames:
      patch.technicianNames !== undefined
        ? patch.technicianNames
        : cur.technicianNames,
    publishedAt:
      patch.publishedAt !== undefined ? patch.publishedAt : cur.publishedAt,
    updatedAt: new Date().toISOString(),
  };
  await ensureDir();
  await fs.writeFile(reportPath(leadReference), JSON.stringify(next, null, 2));
  return next;
}

export async function addPhoto(
  leadReference: string,
  photo: { kind: PhotoKind; caption?: string; dataUrl: string },
): Promise<SiteReport | null> {
  const cur = await getReport(leadReference);
  if (!cur) return null;
  if (cur.photos.length >= 30) throw new Error("Limite de 30 photos atteinte");
  if (!photo.dataUrl.startsWith("data:image/"))
    throw new Error("Format image invalide");
  if (photo.dataUrl.length > 5 * 1024 * 1024 * 1.4)
    throw new Error("Photo trop lourde (5 Mo max)");
  const next: SiteReport = {
    ...cur,
    photos: [
      ...cur.photos,
      {
        id: `pic-${randomBytes(4).toString("hex")}`,
        kind: photo.kind,
        caption: photo.caption?.slice(0, 400),
        dataUrl: photo.dataUrl,
        uploadedAt: new Date().toISOString(),
      },
    ],
    updatedAt: new Date().toISOString(),
  };
  await ensureDir();
  await fs.writeFile(reportPath(leadReference), JSON.stringify(next, null, 2));
  return next;
}

export async function removePhoto(
  leadReference: string,
  photoId: string,
): Promise<SiteReport | null> {
  const cur = await getReport(leadReference);
  if (!cur) return null;
  const next: SiteReport = {
    ...cur,
    photos: cur.photos.filter((p) => p.id !== photoId),
    updatedAt: new Date().toISOString(),
  };
  await fs.writeFile(reportPath(leadReference), JSON.stringify(next, null, 2));
  return next;
}

export async function updatePhotoCaption(
  leadReference: string,
  photoId: string,
  caption: string,
): Promise<SiteReport | null> {
  const cur = await getReport(leadReference);
  if (!cur) return null;
  const next: SiteReport = {
    ...cur,
    photos: cur.photos.map((p) =>
      p.id === photoId ? { ...p, caption: caption.slice(0, 400) } : p,
    ),
    updatedAt: new Date().toISOString(),
  };
  await fs.writeFile(reportPath(leadReference), JSON.stringify(next, null, 2));
  return next;
}
