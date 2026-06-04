/**
 * Bons de commande fournisseurs.
 *
 * Une commande lie un fournisseur, un projet (lead converti optionnel), et
 * une liste de lignes (référence, quantité, prix unitaire HT). On suit le
 * statut : draft → sent → received-partial → received-full → cancelled.
 *
 * Numérotation : BC-YYYY-NNNN incrémental annuel.
 */

import { promises as fs } from "node:fs";
import path from "node:path";
import { randomBytes } from "node:crypto";

const DATA_DIR = path.join(process.cwd(), "data");
const FILE = path.join(DATA_DIR, "purchase-orders.json");

export type PoStatus =
  | "draft"
  | "sent"
  | "received-partial"
  | "received-full"
  | "cancelled";

export const PO_STATUS_LABELS: Record<PoStatus, string> = {
  draft: "Brouillon",
  sent: "Envoyé",
  "received-partial": "Reçu partiel",
  "received-full": "Reçu complet",
  cancelled: "Annulé",
};

export type PoLine = {
  reference: string;
  description: string;
  quantity: number;
  unitPriceHt: number;
  /** Quantité reçue (pour suivi partiel). */
  receivedQty?: number;
};

export type PurchaseOrder = {
  id: string;
  /** Numéro client lisible : BC-YYYY-NNNN. */
  number: string;
  supplierId: string;
  supplierName: string;
  /** Lié à un lead converti optionnel. */
  leadReference?: string;
  lines: PoLine[];
  /** Total HT calculé. */
  totalHt: number;
  /** TVA appliquée (taux). */
  vatRate: number;
  /** Total TTC. */
  totalTtc: number;
  status: PoStatus;
  /** Date d'envoi prévue/effective. */
  sentAt?: string;
  /** Date livraison prévue. */
  expectedDeliveryAt?: string;
  /** Notes internes. */
  notes?: string;
  createdAt: string;
  updatedAt: string;
};

async function ensureDir() {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
  } catch {}
}

async function readAll(): Promise<PurchaseOrder[]> {
  try {
    return JSON.parse(await fs.readFile(FILE, "utf8"));
  } catch {
    return [];
  }
}

async function writeAll(arr: PurchaseOrder[]) {
  await ensureDir();
  await fs.writeFile(FILE, JSON.stringify(arr, null, 2), "utf8");
}

function makeId(): string {
  return `po-${randomBytes(5).toString("hex")}`;
}

async function nextNumber(): Promise<string> {
  const year = new Date().getUTCFullYear();
  const all = await readAll();
  const sameYear = all.filter((p) => p.number.startsWith(`BC-${year}-`));
  const next = (sameYear.length + 1).toString().padStart(4, "0");
  return `BC-${year}-${next}`;
}

function computeTotals(lines: PoLine[], vatRate: number) {
  const totalHt = lines.reduce(
    (s, l) => s + l.quantity * l.unitPriceHt,
    0,
  );
  const totalTtc = Math.round(totalHt * (1 + vatRate) * 100) / 100;
  return { totalHt: Math.round(totalHt * 100) / 100, totalTtc };
}

export async function listPurchaseOrders(): Promise<PurchaseOrder[]> {
  const all = await readAll();
  return [...all].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}

export async function getPurchaseOrder(id: string): Promise<PurchaseOrder | null> {
  const all = await readAll();
  return all.find((p) => p.id === id) ?? null;
}

export async function createPurchaseOrder(input: {
  supplierId: string;
  supplierName: string;
  leadReference?: string;
  lines: PoLine[];
  vatRate?: number;
  expectedDeliveryAt?: string;
  notes?: string;
}): Promise<PurchaseOrder> {
  if (!input.lines.length) throw new Error("Au moins une ligne requise");
  const all = await readAll();
  const vatRate = input.vatRate ?? 0.17;
  const { totalHt, totalTtc } = computeTotals(input.lines, vatRate);
  const now = new Date().toISOString();
  const po: PurchaseOrder = {
    id: makeId(),
    number: await nextNumber(),
    supplierId: input.supplierId,
    supplierName: input.supplierName,
    leadReference: input.leadReference,
    lines: input.lines.map((l) => ({ ...l, receivedQty: 0 })),
    totalHt,
    vatRate,
    totalTtc,
    status: "draft",
    expectedDeliveryAt: input.expectedDeliveryAt,
    notes: input.notes?.slice(0, 1000),
    createdAt: now,
    updatedAt: now,
  };
  all.unshift(po);
  await writeAll(all);
  return po;
}

export async function updatePurchaseOrder(
  id: string,
  patch: Partial<Omit<PurchaseOrder, "id" | "number" | "createdAt">>,
): Promise<PurchaseOrder | null> {
  const all = await readAll();
  const idx = all.findIndex((p) => p.id === id);
  if (idx === -1) return null;
  const next = { ...all[idx], ...patch, updatedAt: new Date().toISOString() };
  if (patch.lines) {
    const totals = computeTotals(patch.lines, next.vatRate);
    next.totalHt = totals.totalHt;
    next.totalTtc = totals.totalTtc;
  }
  all[idx] = next;
  await writeAll(all);
  return next;
}

export async function deletePurchaseOrder(id: string): Promise<boolean> {
  const all = await readAll();
  const next = all.filter((p) => p.id !== id);
  if (next.length === all.length) return false;
  await writeAll(next);
  return true;
}
