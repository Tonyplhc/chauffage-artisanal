/**
 * Pipeline value & forecast.
 *
 * Donne une valeur monétaire à chaque opportunité (lead) et calcule un
 * forecast pondéré par la probabilité de conversion associée au statut.
 *
 * Stockage : `lead.metadata.estimatedValue` en EUROS (entier, pas de cents).
 * Pas de devise multiple — Luxembourg = EUR partout.
 *
 * Probabilités par défaut (configurables côté UI dans une V+1) :
 *   nouveau       → 10 %
 *   contacté      → 25 %
 *   devis_envoyé  → 55 %
 *   converti      → 100 % (réalisé)
 *   perdu         → 0 %
 *
 * Le « forecast » correspond à la somme pondérée — ce qu'on espère réaliser
 * sur le pipeline ouvert. Les "converti" sont comptés en chiffre d'affaires
 * réalisé. Les "perdu" sont exclus.
 *
 * Estimation automatique depuis budget si pas de valeur explicite — voir
 * `suggestEstimatedValue`. Les valeurs proposées sont volontairement modestes
 * pour ne pas surévaluer le pipeline.
 */

import type { LeadRecord } from "./devis-schema";

export type LeadStatus = LeadRecord["status"];
export type LeadBudget = LeadRecord["budget"];

export const STATUS_PROBABILITY: Record<LeadStatus, number> = {
  nouveau: 0.1,
  contacte: 0.25,
  devis_envoye: 0.55,
  converti: 1.0,
  perdu: 0.0,
};

export const BUDGET_DEFAULTS: Record<LeadBudget, number> = {
  inconnu: 0, // pas d'estimation auto
  less10: 6_000,
  "10-20": 14_000,
  "20-40": 28_000,
  "40plus": 50_000,
};

function extractValue(metadata: unknown): number | null {
  if (!metadata || typeof metadata !== "object") return null;
  const v = (metadata as { estimatedValue?: unknown }).estimatedValue;
  if (typeof v === "number" && Number.isFinite(v) && v >= 0) return Math.round(v);
  return null;
}

export function getLeadValue(lead: LeadRecord): number {
  const stored = extractValue(lead.metadata);
  if (stored !== null) return stored;
  return BUDGET_DEFAULTS[lead.budget] ?? 0;
}

export function isValueExplicit(lead: LeadRecord): boolean {
  return extractValue(lead.metadata) !== null;
}

export function suggestEstimatedValue(lead: LeadRecord): number {
  return BUDGET_DEFAULTS[lead.budget] ?? 0;
}

export function getLeadProbability(lead: LeadRecord): number {
  return STATUS_PROBABILITY[lead.status] ?? 0;
}

export function getLeadWeightedValue(lead: LeadRecord): number {
  return Math.round(getLeadValue(lead) * getLeadProbability(lead));
}

export type PipelineValueStats = {
  // Open pipeline (= tout sauf perdu et converti)
  openValue: number;
  openWeightedValue: number;
  openCount: number;
  // Stade par stade
  byStatus: Record<
    LeadStatus,
    {
      count: number;
      value: number;
      weightedValue: number;
      probability: number;
    }
  >;
  // CA réalisé (sum value des "converti")
  realizedValue: number;
  // CA perdu théorique (sum value des "perdu")
  lostValue: number;
  // Top 10 leads ouverts par valeur pondérée descendante
  topOpen: {
    reference: string;
    fullName: string;
    commune: string;
    status: LeadStatus;
    services: string[];
    value: number;
    weightedValue: number;
    probability: number;
    explicit: boolean;
  }[];
};

export function computePipelineValue(leads: LeadRecord[]): PipelineValueStats {
  const byStatus: PipelineValueStats["byStatus"] = {
    nouveau: { count: 0, value: 0, weightedValue: 0, probability: STATUS_PROBABILITY.nouveau },
    contacte: { count: 0, value: 0, weightedValue: 0, probability: STATUS_PROBABILITY.contacte },
    devis_envoye: { count: 0, value: 0, weightedValue: 0, probability: STATUS_PROBABILITY.devis_envoye },
    converti: { count: 0, value: 0, weightedValue: 0, probability: STATUS_PROBABILITY.converti },
    perdu: { count: 0, value: 0, weightedValue: 0, probability: STATUS_PROBABILITY.perdu },
  };

  let openValue = 0;
  let openWeightedValue = 0;
  let openCount = 0;
  let realizedValue = 0;
  let lostValue = 0;

  const openCandidates: PipelineValueStats["topOpen"] = [];

  for (const lead of leads) {
    const value = getLeadValue(lead);
    const prob = getLeadProbability(lead);
    const weighted = Math.round(value * prob);
    const bucket = byStatus[lead.status];
    if (bucket) {
      bucket.count += 1;
      bucket.value += value;
      bucket.weightedValue += weighted;
    }
    if (lead.status === "converti") {
      realizedValue += value;
    } else if (lead.status === "perdu") {
      lostValue += value;
    } else {
      openValue += value;
      openWeightedValue += weighted;
      openCount += 1;
      openCandidates.push({
        reference: lead.reference,
        fullName: lead.fullName,
        commune: lead.commune,
        status: lead.status,
        services: lead.services,
        value,
        weightedValue: weighted,
        probability: prob,
        explicit: isValueExplicit(lead),
      });
    }
  }

  openCandidates.sort((a, b) => b.weightedValue - a.weightedValue);

  return {
    openValue,
    openWeightedValue,
    openCount,
    byStatus,
    realizedValue,
    lostValue,
    topOpen: openCandidates.slice(0, 10),
  };
}

/** Formate un montant EUR pour affichage. Compact pour les KPIs. */
export function formatEur(value: number, compact = false): string {
  if (compact && Math.abs(value) >= 1000) {
    if (Math.abs(value) >= 1_000_000) {
      return `${(value / 1_000_000).toFixed(1).replace(/\.0$/, "")} M€`;
    }
    return `${(value / 1000).toFixed(value % 1000 === 0 ? 0 : 1).replace(/\.0$/, "")} k€`;
  }
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(value);
}
