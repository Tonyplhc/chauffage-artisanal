/**
 * Inventaire produits avec historique de mouvements.
 *
 * Items minimaux : sku + nom + catégorie + quantité courante + seuil de
 * réapprovisionnement. Mouvements horodatés (in/out/adjust) pour audit.
 *
 * Pas de gestion fournisseur / coûts en V1 — focus sur le signal de rupture.
 */

import { promises as fs } from "node:fs";
import path from "node:path";
import { randomBytes } from "node:crypto";

const DATA_DIR = path.join(process.cwd(), "data");
const ITEMS_FILE = path.join(DATA_DIR, "inventory-items.json");
const MOVEMENTS_FILE = path.join(DATA_DIR, "inventory-movements.json");

export type InventoryItem = {
  id: string;
  sku: string;
  name: string;
  category?: string;
  quantity: number;
  reorderLevel: number;
  unit: string; // "pcs", "m", "L", "kg"
  notes?: string;
  createdAt: string;
  updatedAt: string;
  lastMovementAt?: string;
};

export type MovementType = "in" | "out" | "adjust";

export type InventoryMovement = {
  id: string;
  itemId: string;
  type: MovementType;
  quantity: number; // delta — toujours signé selon le type
  reason?: string;
  reference?: string; // lien lead/devis si pertinent
  at: string;
  by?: string;
};

async function ensureDir() {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
  } catch {}
}

async function readItems(): Promise<InventoryItem[]> {
  try {
    return JSON.parse(await fs.readFile(ITEMS_FILE, "utf8"));
  } catch {
    return [];
  }
}

async function writeItems(arr: InventoryItem[]) {
  await ensureDir();
  await fs.writeFile(ITEMS_FILE, JSON.stringify(arr, null, 2), "utf8");
}

async function readMovements(): Promise<InventoryMovement[]> {
  try {
    return JSON.parse(await fs.readFile(MOVEMENTS_FILE, "utf8"));
  } catch {
    return [];
  }
}

async function writeMovements(arr: InventoryMovement[]) {
  await ensureDir();
  await fs.writeFile(MOVEMENTS_FILE, JSON.stringify(arr, null, 2), "utf8");
}

function makeId(prefix: string): string {
  return `${prefix}-${randomBytes(5).toString("hex")}`;
}

/* ─────────────── Items ─────────────── */

export async function listItems(): Promise<InventoryItem[]> {
  const all = await readItems();
  return [...all].sort((a, b) => a.name.localeCompare(b.name));
}

export async function getItem(id: string): Promise<InventoryItem | null> {
  const all = await readItems();
  return all.find((i) => i.id === id) ?? null;
}

export async function getItemBySku(sku: string): Promise<InventoryItem | null> {
  const all = await readItems();
  const k = sku.toUpperCase().trim();
  return all.find((i) => i.sku.toUpperCase() === k) ?? null;
}

export async function createItem(input: {
  sku: string;
  name: string;
  category?: string;
  quantity?: number;
  reorderLevel?: number;
  unit?: string;
  notes?: string;
}): Promise<InventoryItem> {
  const sku = input.sku.trim();
  if (!sku) throw new Error("SKU requis");
  if (sku.length > 60) throw new Error("SKU trop long");
  const name = input.name.trim();
  if (!name) throw new Error("Nom requis");
  if (name.length > 200) throw new Error("Nom trop long");
  const existing = await getItemBySku(sku);
  if (existing) throw new Error("SKU déjà utilisé");

  const now = new Date().toISOString();
  const item: InventoryItem = {
    id: makeId("inv"),
    sku,
    name,
    category: input.category?.trim() || undefined,
    quantity: Math.max(0, Math.round(input.quantity ?? 0)),
    reorderLevel: Math.max(0, Math.round(input.reorderLevel ?? 0)),
    unit: (input.unit ?? "pcs").slice(0, 20),
    notes: input.notes?.slice(0, 2000),
    createdAt: now,
    updatedAt: now,
  };
  const all = await readItems();
  all.push(item);
  await writeItems(all);
  return item;
}

export async function updateItem(
  id: string,
  patch: Partial<
    Pick<
      InventoryItem,
      "name" | "category" | "reorderLevel" | "unit" | "notes" | "sku"
    >
  >,
): Promise<InventoryItem | null> {
  const all = await readItems();
  const idx = all.findIndex((i) => i.id === id);
  if (idx === -1) return null;
  const cur = all[idx];
  const next: InventoryItem = { ...cur };
  if (patch.name !== undefined) next.name = patch.name.trim().slice(0, 200);
  if (patch.sku !== undefined) {
    const skuNew = patch.sku.trim();
    if (
      skuNew !== cur.sku &&
      all.some((i) => i.id !== id && i.sku.toUpperCase() === skuNew.toUpperCase())
    ) {
      throw new Error("SKU déjà utilisé");
    }
    next.sku = skuNew.slice(0, 60);
  }
  if (patch.category !== undefined)
    next.category = patch.category.trim() || undefined;
  if (patch.reorderLevel !== undefined)
    next.reorderLevel = Math.max(0, Math.round(patch.reorderLevel));
  if (patch.unit !== undefined) next.unit = patch.unit.slice(0, 20);
  if (patch.notes !== undefined)
    next.notes = patch.notes.slice(0, 2000) || undefined;
  next.updatedAt = new Date().toISOString();
  all[idx] = next;
  await writeItems(all);
  return next;
}

export async function deleteItem(id: string): Promise<boolean> {
  const all = await readItems();
  const next = all.filter((i) => i.id !== id);
  if (next.length === all.length) return false;
  await writeItems(next);
  // On garde l'historique de mouvements — traçabilité
  return true;
}

/* ─────────────── Mouvements ─────────────── */

export async function recordMovement(input: {
  itemId: string;
  type: MovementType;
  quantity: number;
  reason?: string;
  reference?: string;
  by?: string;
}): Promise<InventoryMovement | null> {
  const items = await readItems();
  const idx = items.findIndex((i) => i.id === input.itemId);
  if (idx === -1) return null;
  const cur = items[idx];

  let delta = Math.abs(Math.round(input.quantity));
  if (delta <= 0) throw new Error("Quantité doit être > 0");

  let newQty = cur.quantity;
  if (input.type === "in") newQty = cur.quantity + delta;
  else if (input.type === "out") {
    newQty = cur.quantity - delta;
    if (newQty < 0) throw new Error("Stock insuffisant");
    delta = -delta;
  } else if (input.type === "adjust") {
    // adjust : quantity représente la NOUVELLE valeur absolue
    delta = Math.round(input.quantity) - cur.quantity;
    newQty = Math.round(input.quantity);
    if (newQty < 0) throw new Error("Quantité ajustée invalide");
  }

  const movement: InventoryMovement = {
    id: makeId("mov"),
    itemId: input.itemId,
    type: input.type,
    quantity: delta,
    reason: input.reason?.slice(0, 400),
    reference: input.reference?.slice(0, 80),
    at: new Date().toISOString(),
    by: input.by,
  };

  const movements = await readMovements();
  movements.push(movement);
  await writeMovements(movements);

  items[idx] = {
    ...cur,
    quantity: newQty,
    lastMovementAt: movement.at,
    updatedAt: movement.at,
  };
  await writeItems(items);

  return movement;
}

export async function listMovements(opts: {
  itemId?: string;
  limit?: number;
} = {}): Promise<InventoryMovement[]> {
  const all = await readMovements();
  let filtered = all;
  if (opts.itemId)
    filtered = filtered.filter((m) => m.itemId === opts.itemId);
  filtered.sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());
  if (opts.limit) filtered = filtered.slice(0, opts.limit);
  return filtered;
}

/* ─────────────── Stats ─────────────── */

export type InventoryStats = {
  totalItems: number;
  totalUnits: number;
  belowReorder: number;
  outOfStock: number;
  categories: { name: string; count: number }[];
};

export async function computeStats(): Promise<InventoryStats> {
  const items = await readItems();
  let totalUnits = 0;
  let belowReorder = 0;
  let outOfStock = 0;
  const catMap = new Map<string, number>();
  for (const i of items) {
    totalUnits += i.quantity;
    if (i.quantity === 0) outOfStock += 1;
    else if (i.quantity <= i.reorderLevel) belowReorder += 1;
    const k = i.category ?? "Sans catégorie";
    catMap.set(k, (catMap.get(k) ?? 0) + 1);
  }
  const categories = [...catMap.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);
  return {
    totalItems: items.length,
    totalUnits,
    belowReorder,
    outOfStock,
    categories,
  };
}
