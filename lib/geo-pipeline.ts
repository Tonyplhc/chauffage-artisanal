/**
 * Pipeline pipeline value par commune — heat map des opportunités géographiques.
 */

import { listLeads } from "./leads-store";
import { getLeadValue, getLeadWeightedValue } from "./pipeline-value";

export type CommuneStats = {
  commune: string;
  leadCount: number;
  hotCount: number;
  convertedCount: number;
  lostCount: number;
  conversionRate: number;
  pipelineValueEur: number; // somme des valeurs leads ouverts
  weightedPipelineEur: number; // pondéré par probabilité statut
  realizedRevenueEur: number; // somme des convertis
  averageDealEur: number;
};

export async function computeGeoPipeline(): Promise<CommuneStats[]> {
  const leads = await listLeads();
  const map = new Map<string, CommuneStats>();

  for (const lead of leads) {
    const key = (lead.commune || "—").trim();
    if (!map.has(key)) {
      map.set(key, {
        commune: key,
        leadCount: 0,
        hotCount: 0,
        convertedCount: 0,
        lostCount: 0,
        conversionRate: 0,
        pipelineValueEur: 0,
        weightedPipelineEur: 0,
        realizedRevenueEur: 0,
        averageDealEur: 0,
      });
    }
    const row = map.get(key)!;
    row.leadCount += 1;
    if (lead.level === "hot") row.hotCount += 1;
    if (lead.status === "converti") {
      row.convertedCount += 1;
      row.realizedRevenueEur += getLeadValue(lead);
    } else if (lead.status === "perdu") {
      row.lostCount += 1;
    } else {
      row.pipelineValueEur += getLeadValue(lead);
      row.weightedPipelineEur += getLeadWeightedValue(lead);
    }
  }

  for (const row of map.values()) {
    const decided = row.convertedCount + row.lostCount;
    row.conversionRate =
      decided === 0 ? 0 : row.convertedCount / decided;
    row.averageDealEur =
      row.convertedCount === 0
        ? 0
        : Math.round(row.realizedRevenueEur / row.convertedCount);
    row.pipelineValueEur = Math.round(row.pipelineValueEur);
    row.weightedPipelineEur = Math.round(row.weightedPipelineEur);
    row.realizedRevenueEur = Math.round(row.realizedRevenueEur);
  }

  return [...map.values()].sort(
    (a, b) =>
      b.pipelineValueEur + b.realizedRevenueEur -
      (a.pipelineValueEur + a.realizedRevenueEur),
  );
}
