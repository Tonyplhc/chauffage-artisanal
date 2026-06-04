/**
 * Stockage du catalogue produit/prestation client.
 * Dev : fichier `data/catalogue.json`.
 * Prod : à brancher sur Supabase via une table `catalogue_items`.
 */

import { promises as fs } from "node:fs";
import path from "node:path";
import type { CatalogueItem, CatalogueState } from "./catalogue-schema";
import { logger } from "./logger";

const DATA_DIR = path.join(process.cwd(), "data");
const CATALOGUE_FILE = path.join(DATA_DIR, "catalogue.json");

async function ensureDir() {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
  } catch {}
}

export async function readCatalogue(): Promise<CatalogueState | null> {
  try {
    const raw = await fs.readFile(CATALOGUE_FILE, "utf8");
    return JSON.parse(raw) as CatalogueState;
  } catch {
    return null;
  }
}

export async function writeCatalogue(state: CatalogueState): Promise<void> {
  await ensureDir();
  await fs.writeFile(CATALOGUE_FILE, JSON.stringify(state, null, 2), "utf8");
  logger.info("catalogue.saved", { count: state.items.length });
}

export async function clearCatalogue(): Promise<void> {
  try {
    await fs.unlink(CATALOGUE_FILE);
    logger.info("catalogue.cleared");
  } catch {}
}

/* ─────────── Matching catalogue ↔ lead ─────────── */

export type Lead = {
  services: string[];
  surface: number;
  budget: string;
};

export type Tier = "low" | "mid" | "high";

export type TieredProposition = {
  tier: Tier;
  tierLabel: string;
  item: CatalogueItem | null; // null si aucune option trouvée pour ce tier
  reasoning: string;
};

/** Renvoie le prix « médian » d'un item, ou null si aucun prix. */
function itemMidPrice(item: CatalogueItem): number | null {
  if (item.priceMin != null && item.priceMax != null) return (item.priceMin + item.priceMax) / 2;
  if (item.priceMin != null) return item.priceMin;
  if (item.priceMax != null) return item.priceMax;
  return null;
}

/**
 * Filtre les items pertinents pour un lead (services + surface si renseignée).
 */
function selectRelevant(items: CatalogueItem[], lead: Lead): CatalogueItem[] {
  return items.filter((item) => {
    // Service du lead
    if (!lead.services.includes(item.service)) return false;
    // Surface — on filtre si l'item a une plage explicite et qu'on est hors plage de ±30%
    if (item.surfaceMin != null && lead.surface < item.surfaceMin * 0.7) return false;
    if (item.surfaceMax != null && lead.surface > item.surfaceMax * 1.3) return false;
    return true;
  });
}

/**
 * Génère 3 propositions tier bas / dans-gamme / haut-gamme à partir du catalogue.
 *
 * Logique :
 *   - Filtre les items pertinents (services + surface).
 *   - Sépare en trois groupes selon prix médian vs budget client :
 *       low  : prix médian < budgetMin
 *       mid  : prix médian ∈ [budgetMin, budgetMax]
 *       high : prix médian > budgetMax
 *   - Pour chaque tier, on prend l'item le plus pertinent (proximité de la cible).
 *   - Si un tier est vide, on emprunte le plus proche à un tier adjacent et on le
 *     marque comme "fallback" dans le reasoning.
 *   - Si budget=inconnu, on retourne low/mid/high par tri prix.
 */
export function matchByBudgetTiers(
  items: CatalogueItem[],
  lead: Lead,
  budgetRange: { min: number; max: number },
  budgetIsUnknown: boolean,
): TieredProposition[] {
  const relevant = selectRelevant(items, lead);

  // Items sans prix : on les met à part. Ils ne servent qu'en fallback ultime.
  const withPrice = relevant
    .map((it) => ({ item: it, price: itemMidPrice(it) }))
    .filter((x) => x.price != null) as { item: CatalogueItem; price: number }[];
  const sansPrix = relevant.filter((it) => itemMidPrice(it) == null);

  // Tri par prix asc
  withPrice.sort((a, b) => a.price - b.price);

  let lowCandidates: { item: CatalogueItem; price: number }[];
  let midCandidates: { item: CatalogueItem; price: number }[];
  let highCandidates: { item: CatalogueItem; price: number }[];

  if (budgetIsUnknown) {
    // Pas de budget : on découpe la liste en 3 tiers par quantile
    const n = withPrice.length;
    if (n === 0) {
      lowCandidates = midCandidates = highCandidates = [];
    } else if (n === 1) {
      lowCandidates = midCandidates = highCandidates = withPrice;
    } else if (n === 2) {
      lowCandidates = [withPrice[0]];
      midCandidates = [withPrice[Math.floor(n / 2)]];
      highCandidates = [withPrice[n - 1]];
    } else {
      const third = Math.floor(n / 3);
      lowCandidates = withPrice.slice(0, third);
      midCandidates = withPrice.slice(third, n - third);
      highCandidates = withPrice.slice(n - third);
    }
  } else {
    lowCandidates = withPrice.filter((x) => x.price < budgetRange.min);
    midCandidates = withPrice.filter(
      (x) => x.price >= budgetRange.min && x.price <= budgetRange.max,
    );
    highCandidates = withPrice.filter((x) => x.price > budgetRange.max);
  }

  // Choisir un item par tier — préférer le plus proche du milieu de la cible.
  const targetMid = (budgetRange.min + budgetRange.max) / 2;

  function pickClosest(list: { item: CatalogueItem; price: number }[], target: number) {
    if (list.length === 0) return null;
    let best = list[0];
    let bestDiff = Math.abs(list[0].price - target);
    for (const x of list.slice(1)) {
      const d = Math.abs(x.price - target);
      if (d < bestDiff) {
        best = x;
        bestDiff = d;
      }
    }
    return best;
  }

  // Dédoublon : un même item ne doit pas remplir 2 tiers à la fois.
  const used = new Set<string>();
  function pickUnused(
    list: { item: CatalogueItem; price: number }[],
    target: number,
  ) {
    const filtered = list.filter((x) => !used.has(x.item.ref));
    const picked = pickClosest(filtered, target);
    if (picked) used.add(picked.item.ref);
    return picked;
  }

  // Mid d'abord (c'est le plus important commercialement), puis low, puis high.
  const mid =
    pickUnused(midCandidates, targetMid) ??
    pickUnused(highCandidates, budgetRange.max) ??
    pickUnused(lowCandidates, budgetRange.max);
  const low =
    pickUnused(lowCandidates, budgetRange.min) ??
    pickUnused(midCandidates, 0) ??
    pickUnused(highCandidates, 0);
  const high =
    pickUnused(highCandidates, budgetRange.max) ??
    pickUnused(midCandidates, Infinity) ??
    pickUnused(lowCandidates, Infinity);

  function reasoningFor(
    tier: Tier,
    chosen: { item: CatalogueItem; price: number } | null,
    fallback = false,
  ): string {
    if (!chosen) return "Aucune option correspondante dans le catalogue.";
    if (budgetIsUnknown) {
      if (tier === "low") return "Option la plus économique disponible pour ce service.";
      if (tier === "mid") return "Solution médiane — équilibre prix/prestations.";
      return "Option premium — prestations étendues.";
    }
    if (tier === "low") {
      if (fallback) return "Pas d'option strictement sous le budget — voici l'item le moins cher disponible.";
      return `Sous le budget annoncé (~${(chosen.price / 1000).toFixed(0)} k€).`;
    }
    if (tier === "mid") {
      if (fallback) return "Pas d'option pile dans la fourchette budget — voici la plus proche.";
      return `Dans la fourchette budget (~${(chosen.price / 1000).toFixed(0)} k€).`;
    }
    if (fallback) return "Pas d'option au-dessus du budget — voici la plus haute du catalogue.";
    return `Au-dessus du budget — option premium (~${(chosen.price / 1000).toFixed(0)} k€).`;
  }

  return [
    {
      tier: "low",
      tierLabel: "Bas de gamme",
      item: low?.item ?? sansPrix[0] ?? null,
      reasoning: reasoningFor("low", low, !lowCandidates.length && !!low),
    },
    {
      tier: "mid",
      tierLabel: "Dans votre gamme",
      item: mid?.item ?? sansPrix[1] ?? sansPrix[0] ?? null,
      reasoning: reasoningFor("mid", mid, !midCandidates.length && !!mid),
    },
    {
      tier: "high",
      tierLabel: "Haut de gamme",
      item: high?.item ?? sansPrix[2] ?? null,
      reasoning: reasoningFor("high", high, !highCandidates.length && !!high),
    },
  ];
}
