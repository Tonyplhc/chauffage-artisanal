/**
 * ROI marketing par source d'acquisition.
 *
 * Combine :
 *   - Stats source (W18.2) : leads + conversions par utm_source/referrer
 *   - Pipeline value (W17.1) : revenu réalisé par lead
 *   - Marketing spend par source (W29.1) saisi par admin
 *
 * Calcule CAC = (spend mensuel × mois écoulés) / convertis et ROI = revenu /
 * dépense. LTV = moyenne revenu par client converti, ajustée par durée
 * d'entretien estimée (10 ans).
 */

import { listLeads } from "./leads-store";
import { listSpend } from "./marketing-spend-store";
import { getLeadValue } from "./pipeline-value";
import type { LeadRecord } from "./devis-schema";

const LIFETIME_YEARS = 10;
const AVG_MAINTENANCE_PER_YEAR = 200; // EUR estimation entretien annuel
const HISTORY_MONTHS = 6; // fenêtre par défaut pour CAC

function sourceOf(lead: LeadRecord): string {
  const meta = lead.metadata as
    | { source?: { utmSource?: string; referrer?: string } }
    | undefined;
  const s = meta?.source;
  return (s?.utmSource ?? s?.referrer ?? "direct").toLowerCase();
}

export type ChannelStats = {
  source: string;
  leads: number;
  converted: number;
  conversionRate: number;
  totalRevenueEur: number;
  averageDealEur: number;
  estimatedLtvEur: number;
  monthlySpendEur: number | null;
  cacEur: number | null;
  roi: number | null;
  scoreLabel: "excellent" | "good" | "neutral" | "loss";
};

export type RoiReport = {
  channels: ChannelStats[];
  totals: {
    leads: number;
    converted: number;
    totalRevenueEur: number;
    totalSpendEur: number;
    overallRoi: number | null;
  };
};

function labelOf(roi: number | null): ChannelStats["scoreLabel"] {
  if (roi === null) return "neutral";
  if (roi >= 3) return "excellent";
  if (roi >= 1) return "good";
  if (roi >= 0.5) return "neutral";
  return "loss";
}

export async function computeMarketingRoi(opts: {
  windowMonths?: number;
} = {}): Promise<RoiReport> {
  const windowMonths = opts.windowMonths ?? HISTORY_MONTHS;
  const [leads, spend] = await Promise.all([listLeads(), listSpend()]);
  const spendBySource = new Map(
    spend.map((s) => [s.source.toLowerCase(), s.monthlyEur]),
  );

  const map = new Map<
    string,
    {
      leads: number;
      converted: number;
      totalRevenueEur: number;
    }
  >();

  for (const lead of leads) {
    const key = sourceOf(lead);
    if (!map.has(key))
      map.set(key, { leads: 0, converted: 0, totalRevenueEur: 0 });
    const row = map.get(key)!;
    row.leads += 1;
    if (lead.status === "converti") {
      row.converted += 1;
      row.totalRevenueEur += getLeadValue(lead);
    }
  }

  const channels: ChannelStats[] = [];
  let totalSpend = 0;
  let totalLeads = 0;
  let totalConverted = 0;
  let totalRevenue = 0;

  for (const [source, row] of map) {
    totalLeads += row.leads;
    totalConverted += row.converted;
    totalRevenue += row.totalRevenueEur;
    const conversionRate =
      row.leads === 0 ? 0 : row.converted / row.leads;
    const averageDealEur =
      row.converted === 0 ? 0 : Math.round(row.totalRevenueEur / row.converted);
    const monthlySpend = spendBySource.get(source) ?? null;
    let cac: number | null = null;
    let roi: number | null = null;
    if (monthlySpend !== null) {
      const totalSpendInWindow = monthlySpend * windowMonths;
      totalSpend += totalSpendInWindow;
      if (row.converted > 0) {
        cac = Math.round(totalSpendInWindow / row.converted);
        roi =
          totalSpendInWindow === 0
            ? null
            : Math.round(
                (row.totalRevenueEur / totalSpendInWindow) * 100,
              ) / 100;
      } else {
        cac = null;
        roi = totalSpendInWindow > 0 ? 0 : null;
      }
    }
    // LTV estimation : averageDeal + 10 ans × ratio occupants entretien
    const estimatedLtv =
      averageDealEur > 0
        ? Math.round(averageDealEur + LIFETIME_YEARS * AVG_MAINTENANCE_PER_YEAR)
        : 0;
    channels.push({
      source,
      leads: row.leads,
      converted: row.converted,
      conversionRate,
      totalRevenueEur: Math.round(row.totalRevenueEur),
      averageDealEur,
      estimatedLtvEur: estimatedLtv,
      monthlySpendEur: monthlySpend,
      cacEur: cac,
      roi,
      scoreLabel: labelOf(roi),
    });
  }

  channels.sort((a, b) => {
    if (b.roi !== null && a.roi !== null) return b.roi - a.roi;
    return b.totalRevenueEur - a.totalRevenueEur;
  });

  return {
    channels,
    totals: {
      leads: totalLeads,
      converted: totalConverted,
      totalRevenueEur: Math.round(totalRevenue),
      totalSpendEur: totalSpend,
      overallRoi:
        totalSpend === 0
          ? null
          : Math.round((totalRevenue / totalSpend) * 100) / 100,
    },
  };
}
