/**
 * Gestion garantie / SAV.
 *
 * Suit les déclarations de sinistre liées à un équipement installé, le
 * statut de prise en charge constructeur, les pièces commandées et leur
 * réception. Sert aussi à alerter sur les fins de garantie imminentes
 * (vente d'extension possible).
 *
 * Numérotation : GAR-YYYY-NNNN.
 */

import { promises as fs } from "node:fs";
import path from "node:path";
import { randomBytes } from "node:crypto";

const DATA_DIR = path.join(process.cwd(), "data");
const FILE = path.join(DATA_DIR, "warranty-claims.json");

export type WarrantyStatus =
  | "ouvert"
  | "en-attente-constructeur"
  | "piece-commandee"
  | "piece-recue"
  | "intervention-planifiee"
  | "resolu"
  | "refuse";

export const WARRANTY_STATUS_LABEL: Record<WarrantyStatus, string> = {
  ouvert: "Ouvert",
  "en-attente-constructeur": "Attente constructeur",
  "piece-commandee": "Pièce commandée",
  "piece-recue": "Pièce reçue",
  "intervention-planifiee": "Intervention planifiée",
  resolu: "Résolu",
  refuse: "Refusé",
};

export type WarrantyClaim = {
  id: string;
  number: string;
  /** Équipement concerné (id du registre équipements ou texte libre). */
  equipmentRef: string;
  equipmentDescription: string;
  /** Date d'installation initiale (pour calcul ancienneté). */
  installedAt?: string;
  /** Date d'expiration garantie constructeur. */
  warrantyExpiresAt?: string;
  /** Client concerné. */
  clientName: string;
  /** Référence lead/projet. */
  leadReference?: string;
  /** Symptôme déclaré. */
  symptom: string;
  /** Diagnostic interne. */
  diagnosis?: string;
  /** Pièces demandées : { ref, label, qty, receivedAt? }. */
  parts: {
    reference: string;
    label: string;
    quantity: number;
    receivedAt?: string;
  }[];
  status: WarrantyStatus;
  /** Référence dossier côté constructeur. */
  manufacturerCaseRef?: string;
  /** Notes diverses. */
  notes?: string;
  createdAt: string;
  updatedAt: string;
};

async function ensureDir() {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
  } catch {}
}

async function readAll(): Promise<WarrantyClaim[]> {
  try {
    return JSON.parse(await fs.readFile(FILE, "utf8"));
  } catch {
    return [];
  }
}

async function writeAll(arr: WarrantyClaim[]) {
  await ensureDir();
  await fs.writeFile(FILE, JSON.stringify(arr, null, 2), "utf8");
}

function makeId(): string {
  return `gar-${randomBytes(5).toString("hex")}`;
}

async function nextNumber(): Promise<string> {
  const y = new Date().getUTCFullYear();
  const all = await readAll();
  const same = all.filter((p) => p.number.startsWith(`GAR-${y}-`));
  const n = (same.length + 1).toString().padStart(4, "0");
  return `GAR-${y}-${n}`;
}

export async function listClaims(): Promise<WarrantyClaim[]> {
  return [...(await readAll())].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}

export async function createClaim(input: {
  equipmentRef: string;
  equipmentDescription: string;
  installedAt?: string;
  warrantyExpiresAt?: string;
  clientName: string;
  leadReference?: string;
  symptom: string;
  manufacturerCaseRef?: string;
}): Promise<WarrantyClaim> {
  if (!input.equipmentDescription.trim()) throw new Error("Équipement requis");
  if (!input.symptom.trim()) throw new Error("Symptôme requis");
  if (!input.clientName.trim()) throw new Error("Client requis");
  const now = new Date().toISOString();
  const claim: WarrantyClaim = {
    id: makeId(),
    number: await nextNumber(),
    equipmentRef: input.equipmentRef,
    equipmentDescription: input.equipmentDescription.trim(),
    installedAt: input.installedAt,
    warrantyExpiresAt: input.warrantyExpiresAt,
    clientName: input.clientName.trim(),
    leadReference: input.leadReference,
    symptom: input.symptom.trim(),
    parts: [],
    status: "ouvert",
    manufacturerCaseRef: input.manufacturerCaseRef?.trim(),
    createdAt: now,
    updatedAt: now,
  };
  const all = await readAll();
  all.unshift(claim);
  await writeAll(all);
  return claim;
}

export async function updateClaim(
  id: string,
  patch: Partial<Omit<WarrantyClaim, "id" | "number" | "createdAt">>,
): Promise<WarrantyClaim | null> {
  const all = await readAll();
  const idx = all.findIndex((c) => c.id === id);
  if (idx === -1) return null;
  all[idx] = { ...all[idx], ...patch, updatedAt: new Date().toISOString() };
  await writeAll(all);
  return all[idx];
}

/**
 * Calcule les KPIs pour un dashboard :
 *   - ouverts en cours
 *   - pièces en attente
 *   - garanties expirant dans <90j
 */
export async function getWarrantyStats() {
  const all = await readAll();
  const open = all.filter(
    (c) => c.status !== "resolu" && c.status !== "refuse",
  ).length;
  const waitingParts = all.filter(
    (c) => c.status === "piece-commandee",
  ).length;
  const now = Date.now();
  const expiringSoon = all.filter((c) => {
    if (!c.warrantyExpiresAt) return false;
    const t = new Date(c.warrantyExpiresAt).getTime();
    return t > now && t - now < 90 * 24 * 3600 * 1000;
  }).length;
  return {
    total: all.length,
    open,
    waitingParts,
    expiringSoon,
  };
}
