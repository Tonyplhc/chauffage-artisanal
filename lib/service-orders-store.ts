/**
 * Bons d'intervention (BI) imprimables.
 *
 * Document terrain qui synthétise : client, équipement concerné, prestation
 * effectuée, pièces fournies, durée d'intervention, observations,
 * signature client. Imprimable A4 ou export PDF côté UI.
 *
 * Numérotation : BI-YYYY-NNNN.
 */

import { promises as fs } from "node:fs";
import path from "node:path";
import { randomBytes } from "node:crypto";

const DATA_DIR = path.join(process.cwd(), "data");
const FILE = path.join(DATA_DIR, "service-orders.json");

export type ServiceOrderStatus = "draft" | "signed" | "invoiced" | "cancelled";

export const SO_STATUS_LABELS: Record<ServiceOrderStatus, string> = {
  draft: "Brouillon",
  signed: "Signé client",
  invoiced: "Facturé",
  cancelled: "Annulé",
};

export type ServiceLine = {
  description: string;
  quantity: number;
  unit: "h" | "u" | "ml" | "m²" | "kg" | "forfait";
  unitPriceHt?: number;
};

export type ServiceOrder = {
  id: string;
  number: string;
  /** Référence lead lié. */
  leadReference?: string;
  clientName: string;
  clientAddress?: string;
  clientPhone?: string;
  /** Équipement concerné. */
  equipmentDescription?: string;
  /** Date d'intervention. */
  interventionAt: string;
  /** Heure début/fin pour calcul durée. */
  startTime?: string;
  endTime?: string;
  /** Lignes prestations + pièces. */
  lines: ServiceLine[];
  /** Observations / constats. */
  observations?: string;
  /** Préconisations futures (entretien, remplacement). */
  recommendations?: string;
  /** Technicien intervenant. */
  technicianName: string;
  /** Statut + signature. */
  status: ServiceOrderStatus;
  signedAt?: string;
  /** Image data URL ou texte pour signature. En V1 : nom dactylographié. */
  signature?: string;
  createdAt: string;
  updatedAt: string;
};

async function ensureDir() {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
  } catch {}
}

async function readAll(): Promise<ServiceOrder[]> {
  try {
    return JSON.parse(await fs.readFile(FILE, "utf8"));
  } catch {
    return [];
  }
}

async function writeAll(arr: ServiceOrder[]) {
  await ensureDir();
  await fs.writeFile(FILE, JSON.stringify(arr, null, 2), "utf8");
}

function makeId(): string {
  return `bi-${randomBytes(5).toString("hex")}`;
}

async function nextNumber(): Promise<string> {
  const year = new Date().getUTCFullYear();
  const all = await readAll();
  const sameYear = all.filter((p) => p.number.startsWith(`BI-${year}-`));
  const next = (sameYear.length + 1).toString().padStart(4, "0");
  return `BI-${year}-${next}`;
}

export async function listServiceOrders(): Promise<ServiceOrder[]> {
  return [...(await readAll())].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}

export async function getServiceOrder(id: string): Promise<ServiceOrder | null> {
  const all = await readAll();
  return all.find((s) => s.id === id) ?? null;
}

export async function createServiceOrder(input: {
  leadReference?: string;
  clientName: string;
  clientAddress?: string;
  clientPhone?: string;
  equipmentDescription?: string;
  interventionAt: string;
  startTime?: string;
  endTime?: string;
  lines: ServiceLine[];
  observations?: string;
  recommendations?: string;
  technicianName: string;
}): Promise<ServiceOrder> {
  if (!input.clientName.trim()) throw new Error("Nom client requis");
  if (!input.technicianName.trim()) throw new Error("Technicien requis");
  if (!input.lines.length) throw new Error("Au moins une ligne requise");
  const now = new Date().toISOString();
  const order: ServiceOrder = {
    id: makeId(),
    number: await nextNumber(),
    leadReference: input.leadReference,
    clientName: input.clientName.trim(),
    clientAddress: input.clientAddress?.trim(),
    clientPhone: input.clientPhone?.trim(),
    equipmentDescription: input.equipmentDescription?.trim(),
    interventionAt: input.interventionAt,
    startTime: input.startTime,
    endTime: input.endTime,
    lines: input.lines,
    observations: input.observations?.slice(0, 2000),
    recommendations: input.recommendations?.slice(0, 1000),
    technicianName: input.technicianName.trim(),
    status: "draft",
    createdAt: now,
    updatedAt: now,
  };
  const all = await readAll();
  all.unshift(order);
  await writeAll(all);
  return order;
}

export async function updateServiceOrder(
  id: string,
  patch: Partial<Omit<ServiceOrder, "id" | "number" | "createdAt">>,
): Promise<ServiceOrder | null> {
  const all = await readAll();
  const idx = all.findIndex((s) => s.id === id);
  if (idx === -1) return null;
  all[idx] = { ...all[idx], ...patch, updatedAt: new Date().toISOString() };
  await writeAll(all);
  return all[idx];
}

export async function signServiceOrder(
  id: string,
  signature: string,
): Promise<ServiceOrder | null> {
  return await updateServiceOrder(id, {
    signature: signature.trim(),
    signedAt: new Date().toISOString(),
    status: "signed",
  });
}
