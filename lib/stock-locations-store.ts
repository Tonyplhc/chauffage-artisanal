/**
 * Stock multi-localisations (camion / atelier / dépôt).
 *
 * Extension du concept inventory pour gérer plusieurs localisations physiques.
 * Une "location" = un endroit (atelier principal, camion-1, camion-2, dépôt
 * secondaire). Chaque article du catalogue a un stock par location.
 *
 * Mouvements : transfert entre localisations + entrées (réception
 * fournisseur) + sorties (utilisé chantier / vendu).
 *
 * V1 simplifié : pas de comptabilité analytique, pas de lot/série, pas de
 * traçabilité fournisseur ligne par ligne. Vient en V+1 si besoin.
 */

import { promises as fs } from "node:fs";
import path from "node:path";
import { randomBytes } from "node:crypto";

const DATA_DIR = path.join(process.cwd(), "data");
const LOC_FILE = path.join(DATA_DIR, "stock-locations.json");
const MOVES_FILE = path.join(DATA_DIR, "stock-movements.json");

export type StockLocationType = "atelier" | "camion" | "depot" | "autre";

export const LOCATION_TYPE_LABEL: Record<StockLocationType, string> = {
  atelier: "Atelier",
  camion: "Camion",
  depot: "Dépôt",
  autre: "Autre",
};

export type StockLocation = {
  id: string;
  name: string;
  type: StockLocationType;
  /** Référent (technicien attitré pour un camion par exemple). */
  ownerTechName?: string;
  /** Notes (immatriculation camion, adresse dépôt). */
  notes?: string;
  /** Inventaire : { articleRef: quantité }. */
  inventory: Record<string, number>;
  createdAt: string;
  updatedAt: string;
};

export type StockMovementType = "entree" | "sortie" | "transfert";

export type StockMovement = {
  id: string;
  type: StockMovementType;
  articleRef: string;
  articleLabel?: string;
  quantity: number;
  /** Pour entree/sortie : location concernée. Pour transfert : null. */
  locationId?: string;
  /** Pour transfert : source + destination. */
  fromLocationId?: string;
  toLocationId?: string;
  /** Référence lead/projet si lié. */
  leadReference?: string;
  /** Référence BC si entrée. */
  purchaseOrderRef?: string;
  notes?: string;
  performedBy?: string;
  at: string;
};

async function ensureDir() {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
  } catch {}
}

async function readLocs(): Promise<StockLocation[]> {
  try {
    return JSON.parse(await fs.readFile(LOC_FILE, "utf8"));
  } catch {
    return [];
  }
}

async function writeLocs(arr: StockLocation[]) {
  await ensureDir();
  await fs.writeFile(LOC_FILE, JSON.stringify(arr, null, 2), "utf8");
}

async function readMoves(): Promise<StockMovement[]> {
  try {
    return JSON.parse(await fs.readFile(MOVES_FILE, "utf8"));
  } catch {
    return [];
  }
}

async function writeMoves(arr: StockMovement[]) {
  await ensureDir();
  await fs.writeFile(MOVES_FILE, JSON.stringify(arr, null, 2), "utf8");
}

function makeId(prefix: string): string {
  return `${prefix}-${randomBytes(5).toString("hex")}`;
}

export async function listLocations(): Promise<StockLocation[]> {
  return await readLocs();
}

export async function createLocation(input: {
  name: string;
  type: StockLocationType;
  ownerTechName?: string;
  notes?: string;
}): Promise<StockLocation> {
  if (!input.name.trim()) throw new Error("Nom requis");
  const all = await readLocs();
  const now = new Date().toISOString();
  const loc: StockLocation = {
    id: makeId("loc"),
    name: input.name.trim(),
    type: input.type,
    ownerTechName: input.ownerTechName?.trim(),
    notes: input.notes?.trim(),
    inventory: {},
    createdAt: now,
    updatedAt: now,
  };
  all.push(loc);
  await writeLocs(all);
  return loc;
}

export async function recordMovement(input: {
  type: StockMovementType;
  articleRef: string;
  articleLabel?: string;
  quantity: number;
  locationId?: string;
  fromLocationId?: string;
  toLocationId?: string;
  leadReference?: string;
  purchaseOrderRef?: string;
  notes?: string;
  performedBy?: string;
}): Promise<StockMovement> {
  if (input.quantity <= 0) throw new Error("Quantité positive requise");
  const locs = await readLocs();

  // Met à jour les inventaires
  if (input.type === "entree" && input.locationId) {
    const idx = locs.findIndex((l) => l.id === input.locationId);
    if (idx === -1) throw new Error("Localisation introuvable");
    locs[idx].inventory[input.articleRef] =
      (locs[idx].inventory[input.articleRef] ?? 0) + input.quantity;
    locs[idx].updatedAt = new Date().toISOString();
  } else if (input.type === "sortie" && input.locationId) {
    const idx = locs.findIndex((l) => l.id === input.locationId);
    if (idx === -1) throw new Error("Localisation introuvable");
    const current = locs[idx].inventory[input.articleRef] ?? 0;
    if (current < input.quantity) {
      throw new Error(
        `Stock insuffisant (${current} disponible, ${input.quantity} demandé)`,
      );
    }
    locs[idx].inventory[input.articleRef] = current - input.quantity;
    locs[idx].updatedAt = new Date().toISOString();
  } else if (input.type === "transfert") {
    if (!input.fromLocationId || !input.toLocationId) {
      throw new Error("Source et destination requises pour transfert");
    }
    const src = locs.findIndex((l) => l.id === input.fromLocationId);
    const dst = locs.findIndex((l) => l.id === input.toLocationId);
    if (src === -1 || dst === -1) throw new Error("Localisation introuvable");
    const avail = locs[src].inventory[input.articleRef] ?? 0;
    if (avail < input.quantity) {
      throw new Error(`Stock insuffisant à la source (${avail} disponible)`);
    }
    locs[src].inventory[input.articleRef] = avail - input.quantity;
    locs[dst].inventory[input.articleRef] =
      (locs[dst].inventory[input.articleRef] ?? 0) + input.quantity;
    locs[src].updatedAt = new Date().toISOString();
    locs[dst].updatedAt = locs[src].updatedAt;
  }

  await writeLocs(locs);

  const move: StockMovement = {
    id: makeId("mov"),
    type: input.type,
    articleRef: input.articleRef,
    articleLabel: input.articleLabel,
    quantity: input.quantity,
    locationId: input.locationId,
    fromLocationId: input.fromLocationId,
    toLocationId: input.toLocationId,
    leadReference: input.leadReference,
    purchaseOrderRef: input.purchaseOrderRef,
    notes: input.notes?.slice(0, 500),
    performedBy: input.performedBy,
    at: new Date().toISOString(),
  };
  const moves = await readMoves();
  moves.unshift(move);
  // Cap raisonnable
  await writeMoves(moves.slice(0, 5000));
  return move;
}

export async function listMovements(limit = 100): Promise<StockMovement[]> {
  return (await readMoves()).slice(0, limit);
}

/**
 * Vue agrégée : pour chaque article, son stock total + détail par location.
 */
export async function getStockSummary(): Promise<
  {
    articleRef: string;
    total: number;
    byLocation: { locationId: string; locationName: string; qty: number }[];
  }[]
> {
  const locs = await readLocs();
  const map = new Map<string, Map<string, number>>();
  for (const loc of locs) {
    for (const [ref, qty] of Object.entries(loc.inventory)) {
      if (!map.has(ref)) map.set(ref, new Map());
      map.get(ref)!.set(loc.id, qty);
    }
  }
  return Array.from(map.entries()).map(([articleRef, byLoc]) => ({
    articleRef,
    total: Array.from(byLoc.values()).reduce((s, v) => s + v, 0),
    byLocation: Array.from(byLoc.entries()).map(([locId, qty]) => ({
      locationId: locId,
      locationName: locs.find((l) => l.id === locId)?.name ?? locId,
      qty,
    })),
  }));
}
