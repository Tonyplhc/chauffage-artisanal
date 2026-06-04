/**
 * Moteur de recommandations pour le quote builder.
 *
 * Pour un lead donné, on cherche les devis acceptés de leads similaires
 * (services + type bâtiment + budget) et on agrège les items de devis les
 * plus fréquents.
 *
 * Filtrage similarité (simple) :
 *   - Au moins 1 service en commun
 *   - Préférence si même buildingType ou même budget
 *
 * Retourne top N items recommandés avec score (= fréquence × moyenne PU).
 */

import { listLeads } from "./leads-store";
import { listInvoices } from "./invoices-store";
import { promises as fs } from "node:fs";
import path from "node:path";
import type { LeadRecord } from "./devis-schema";

const DATA_DIR = path.join(process.cwd(), "data");
const QUOTES_FILE = path.join(DATA_DIR, "quotes.json");

type StoredQuote = {
  leadReference: string;
  status: string;
  lines: { description: string; quantity: number; unitPrice: number; unit?: string }[];
};

async function readQuotes(): Promise<StoredQuote[]> {
  try {
    return JSON.parse(await fs.readFile(QUOTES_FILE, "utf8"));
  } catch {
    return [];
  }
}

export type ItemRecommendation = {
  description: string;
  unit: string;
  meanQuantity: number;
  meanUnitPrice: number;
  frequency: number;
  sourceLeads: string[]; // refs (max 5)
  score: number;
};

function similarity(target: LeadRecord, other: LeadRecord): number {
  let s = 0;
  const sharedServices = target.services.filter((sv) =>
    other.services.includes(sv),
  ).length;
  if (sharedServices === 0) return 0;
  s += sharedServices * 10;
  if (target.buildingType === other.buildingType) s += 5;
  if (target.budget === other.budget) s += 3;
  if (target.construction === other.construction) s += 2;
  return s;
}

function normalizeDesc(d: string): string {
  return d.trim().toLowerCase().slice(0, 200);
}

export async function recommendItemsFor(
  target: LeadRecord,
  limit = 6,
): Promise<ItemRecommendation[]> {
  const [leads, quotes, invoices] = await Promise.all([
    listLeads(),
    readQuotes(),
    listInvoices(),
  ]);

  // Construire le pool de devis "convertis" : devis dont le lead est converti OU
  // dont une facture existe.
  const convertedRefs = new Set(
    leads.filter((l) => l.status === "converti").map((l) => l.reference),
  );
  for (const inv of invoices) convertedRefs.add(inv.leadReference);

  const validQuotes = quotes.filter(
    (q) =>
      convertedRefs.has(q.leadReference) &&
      q.leadReference !== target.reference,
  );

  // Scores de similarité par lead source
  const leadByRef = new Map(leads.map((l) => [l.reference, l]));
  type Acc = {
    description: string;
    unit: string;
    quantities: number[];
    unitPrices: number[];
    sourceLeads: Set<string>;
    weight: number;
  };
  const acc = new Map<string, Acc>();

  for (const q of validQuotes) {
    const source = leadByRef.get(q.leadReference);
    if (!source) continue;
    const sim = similarity(target, source);
    if (sim === 0) continue;
    for (const line of q.lines) {
      const key = normalizeDesc(line.description);
      if (!key) continue;
      if (!acc.has(key)) {
        acc.set(key, {
          description: line.description.trim(),
          unit: line.unit ?? "forfait",
          quantities: [],
          unitPrices: [],
          sourceLeads: new Set(),
          weight: 0,
        });
      }
      const a = acc.get(key)!;
      a.quantities.push(line.quantity);
      a.unitPrices.push(line.unitPrice);
      a.sourceLeads.add(q.leadReference);
      a.weight += sim;
    }
  }

  const out: ItemRecommendation[] = [...acc.values()].map((a) => {
    const meanQuantity =
      a.quantities.reduce((s, x) => s + x, 0) / a.quantities.length;
    const meanUnitPrice =
      a.unitPrices.reduce((s, x) => s + x, 0) / a.unitPrices.length;
    const frequency = a.sourceLeads.size;
    const score = Math.round(frequency * a.weight);
    return {
      description: a.description,
      unit: a.unit,
      meanQuantity: Math.round(meanQuantity * 10) / 10,
      meanUnitPrice: Math.round(meanUnitPrice),
      frequency,
      sourceLeads: [...a.sourceLeads].slice(0, 5),
      score,
    };
  });

  // On garde uniquement les items récurrents (frequency >= 2 si possible)
  const recurring = out.filter((r) => r.frequency >= 2);
  const result = (recurring.length >= 3 ? recurring : out).sort(
    (a, b) => b.score - a.score,
  );
  return result.slice(0, limit);
}
