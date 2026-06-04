/**
 * Pricing intelligence — analyse des prix devis pour benchmarking interne.
 *
 * Agrégation par service principal × type bâtiment, avec moyenne, médiane,
 * écart-type. Détection des devis aberrants (> 1.5σ de la moyenne).
 */

import { promises as fs } from "node:fs";
import path from "node:path";
import { listLeads } from "./leads-store";
import type { LeadRecord } from "./devis-schema";

const DATA_DIR = path.join(process.cwd(), "data");
const QUOTES_FILE = path.join(DATA_DIR, "quotes.json");

type StoredQuote = {
  leadReference: string;
  status: string;
  tvaRate: number;
  lines: { quantity: number; unitPrice: number }[];
};

async function readQuotes(): Promise<StoredQuote[]> {
  try {
    return JSON.parse(await fs.readFile(QUOTES_FILE, "utf8"));
  } catch {
    return [];
  }
}

function quoteHt(q: StoredQuote): number {
  return q.lines.reduce((s, l) => s + l.quantity * l.unitPrice, 0);
}

export type SegmentStats = {
  segment: string;
  service?: string;
  buildingType?: string;
  count: number;
  meanEur: number;
  medianEur: number;
  stdEur: number;
  minEur: number;
  maxEur: number;
  /** Coefficient de variation : std / mean (idéalement <0.3 pour cohérence). */
  coefVariation: number | null;
};

export type Outlier = {
  leadReference: string;
  fullName: string;
  service: string;
  buildingType: string;
  quoteHt: number;
  segmentMeanEur: number;
  deviationSigma: number;
  /** "high" si trop élevé, "low" si trop bas. */
  kind: "high" | "low";
};

export type PricingReport = {
  segments: SegmentStats[];
  outliers: Outlier[];
  totalQuotes: number;
};

function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[mid - 1] + sorted[mid]) / 2
    : sorted[mid];
}

function std(values: number[], mean: number): number {
  if (values.length < 2) return 0;
  const sq = values.reduce((s, v) => s + (v - mean) ** 2, 0);
  return Math.sqrt(sq / values.length);
}

function segmentKey(
  service: LeadRecord["services"][number],
  buildingType: LeadRecord["buildingType"],
): string {
  return `${service} · ${buildingType}`;
}

export async function computePricing(): Promise<PricingReport> {
  const [leads, quotes] = await Promise.all([listLeads(), readQuotes()]);
  const leadByRef = new Map(leads.map((l) => [l.reference, l]));

  // Groupe par (service principal, buildingType)
  const groups = new Map<
    string,
    { samples: number[]; refs: string[]; service: string; building: string }
  >();

  for (const q of quotes) {
    const lead = leadByRef.get(q.leadReference);
    if (!lead) continue;
    if (q.lines.length === 0) continue;
    // Service principal = premier service
    const service = lead.services[0];
    if (!service) continue;
    const key = segmentKey(service, lead.buildingType);
    if (!groups.has(key)) {
      groups.set(key, {
        samples: [],
        refs: [],
        service,
        building: lead.buildingType,
      });
    }
    const g = groups.get(key)!;
    g.samples.push(quoteHt(q));
    g.refs.push(lead.reference);
  }

  const segments: SegmentStats[] = [];
  for (const [key, g] of groups) {
    if (g.samples.length === 0) continue;
    const meanEur = g.samples.reduce((s, v) => s + v, 0) / g.samples.length;
    const stdEur = std(g.samples, meanEur);
    const stat: SegmentStats = {
      segment: key,
      service: g.service,
      buildingType: g.building,
      count: g.samples.length,
      meanEur: Math.round(meanEur),
      medianEur: Math.round(median(g.samples)),
      stdEur: Math.round(stdEur),
      minEur: Math.round(Math.min(...g.samples)),
      maxEur: Math.round(Math.max(...g.samples)),
      coefVariation: meanEur > 0 ? Math.round((stdEur / meanEur) * 100) / 100 : null,
    };
    segments.push(stat);
  }
  segments.sort((a, b) => b.count - a.count);

  // Outliers : > 1.5σ
  const outliers: Outlier[] = [];
  for (const [, g] of groups) {
    if (g.samples.length < 3) continue;
    const mean = g.samples.reduce((s, v) => s + v, 0) / g.samples.length;
    const s = std(g.samples, mean);
    if (s === 0) continue;
    g.samples.forEach((v, i) => {
      const deviation = (v - mean) / s;
      if (Math.abs(deviation) >= 1.5) {
        const lead = leadByRef.get(g.refs[i]);
        if (!lead) return;
        outliers.push({
          leadReference: lead.reference,
          fullName: lead.fullName,
          service: g.service,
          buildingType: g.building,
          quoteHt: Math.round(v),
          segmentMeanEur: Math.round(mean),
          deviationSigma: Math.round(deviation * 10) / 10,
          kind: deviation > 0 ? "high" : "low",
        });
      }
    });
  }
  outliers.sort((a, b) => Math.abs(b.deviationSigma) - Math.abs(a.deviationSigma));

  return {
    segments,
    outliers: outliers.slice(0, 30),
    totalQuotes: quotes.length,
  };
}
