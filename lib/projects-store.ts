/**
 * Suivi de chantier post-conversion.
 *
 * Étend l'espace client (W6.1) avec un suivi visuel des étapes du chantier.
 * Visible côté admin (gestion) et côté espace client (lecture seule).
 *
 * Données minimales — l'objectif est la transparence client, pas un outil
 * de gestion de projet complet.
 */

import { promises as fs } from "node:fs";
import path from "node:path";
import { randomBytes } from "node:crypto";

const DATA_DIR = path.join(process.cwd(), "data");
const PROJECTS_FILE = path.join(DATA_DIR, "projects.json");

export type MilestoneStatus = "planned" | "in_progress" | "done";

export type Milestone = {
  id: string;
  title: string;
  description?: string;
  status: MilestoneStatus;
  plannedAt?: string; // ISO
  completedAt?: string; // ISO
};

export type Project = {
  leadReference: string;
  milestones: Milestone[];
  notesPublic?: string; // visible côté espace client
  notesInternal?: string; // admin uniquement
  contactName?: string;
  contactPhone?: string;
  createdAt: string;
  updatedAt: string;
};

const DEFAULT_MILESTONES: Omit<Milestone, "id">[] = [
  { title: "Lancement projet", status: "done" },
  { title: "Commande du matériel", status: "planned" },
  { title: "Livraison sur site", status: "planned" },
  { title: "Installation", status: "planned" },
  { title: "Mise en service", status: "planned" },
  { title: "Réception client", status: "planned" },
];

async function ensureDir() {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
  } catch {}
}

async function readAll(): Promise<Project[]> {
  try {
    return JSON.parse(await fs.readFile(PROJECTS_FILE, "utf8"));
  } catch {
    return [];
  }
}

async function writeAll(arr: Project[]) {
  await ensureDir();
  await fs.writeFile(PROJECTS_FILE, JSON.stringify(arr, null, 2), "utf8");
}

function makeMilestoneId(): string {
  return `ms-${randomBytes(4).toString("hex")}`;
}

export async function getProject(
  leadReference: string,
): Promise<Project | null> {
  const all = await readAll();
  return all.find((p) => p.leadReference === leadReference) ?? null;
}

export async function ensureProject(
  leadReference: string,
): Promise<Project> {
  const existing = await getProject(leadReference);
  if (existing) return existing;
  const now = new Date().toISOString();
  const project: Project = {
    leadReference,
    milestones: DEFAULT_MILESTONES.map((m) => ({
      ...m,
      id: makeMilestoneId(),
    })),
    createdAt: now,
    updatedAt: now,
  };
  const all = await readAll();
  all.push(project);
  await writeAll(all);
  return project;
}

export async function updateProject(
  leadReference: string,
  patch: Partial<
    Pick<
      Project,
      "milestones" | "notesPublic" | "notesInternal" | "contactName" | "contactPhone"
    >
  >,
): Promise<Project | null> {
  const all = await readAll();
  const idx = all.findIndex((p) => p.leadReference === leadReference);
  if (idx === -1) return null;
  const cur = all[idx];
  const next: Project = { ...cur };
  if (patch.milestones !== undefined) {
    // Sanitize : titre obligatoire, plus 50 milestones max
    const cleaned = patch.milestones
      .slice(0, 50)
      .map((m) => ({
        id: m.id || makeMilestoneId(),
        title: String(m.title ?? "").slice(0, 200).trim(),
        description: m.description
          ? String(m.description).slice(0, 1000)
          : undefined,
        status:
          m.status === "done" || m.status === "in_progress"
            ? m.status
            : ("planned" as const),
        plannedAt: m.plannedAt,
        completedAt: m.completedAt,
      }))
      .filter((m) => m.title.length > 0);
    next.milestones = cleaned;
  }
  if (patch.notesPublic !== undefined)
    next.notesPublic = String(patch.notesPublic).slice(0, 4000) || undefined;
  if (patch.notesInternal !== undefined)
    next.notesInternal = String(patch.notesInternal).slice(0, 4000) || undefined;
  if (patch.contactName !== undefined)
    next.contactName = String(patch.contactName).slice(0, 120) || undefined;
  if (patch.contactPhone !== undefined)
    next.contactPhone = String(patch.contactPhone).slice(0, 40) || undefined;
  next.updatedAt = new Date().toISOString();
  all[idx] = next;
  await writeAll(all);
  return next;
}

export async function deleteProject(leadReference: string): Promise<boolean> {
  const all = await readAll();
  const next = all.filter((p) => p.leadReference !== leadReference);
  if (next.length === all.length) return false;
  await writeAll(next);
  return true;
}

/* ─────────────── Helpers de progression ─────────────── */

export function computeProgress(project: Project): {
  doneCount: number;
  totalCount: number;
  ratio: number;
  currentStep?: Milestone;
  nextStep?: Milestone;
} {
  const totalCount = project.milestones.length;
  const doneCount = project.milestones.filter((m) => m.status === "done").length;
  const ratio = totalCount === 0 ? 0 : doneCount / totalCount;
  const currentStep = project.milestones.find((m) => m.status === "in_progress");
  const nextStep =
    currentStep ?? project.milestones.find((m) => m.status === "planned");
  return { doneCount, totalCount, ratio, currentStep, nextStep };
}
