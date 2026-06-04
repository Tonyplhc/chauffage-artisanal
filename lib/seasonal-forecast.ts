/**
 * Forecast prédictif saisonnier — projection leads + CA sur N prochains mois.
 *
 * Méthode (volontairement transparente, vérifiable manuellement) :
 *
 *   1. Constituer un historique mensuel `{leads, revenue}` sur les 24 derniers
 *      mois à partir des leads existants.
 *   2. Calculer un index de saisonnalité par mois calendaire (1..12) :
 *      moyenne du mois normalisée par la moyenne globale. Ex : si décembre
 *      reçoit historiquement 1.3 × la moyenne annuelle → index 1.30.
 *   3. Calculer la "trend baseline" = moyenne mobile des 6 derniers mois +
 *      régression linéaire simple (slope sur les 12 derniers).
 *   4. Projeter pour chaque mois futur : baseline + slope * t, puis ajusté
 *      par l'index saisonnier du mois calendaire correspondant.
 *
 * Pas de saisonnalité hard-codée — tout vient des données réelles du tenant.
 * Si l'historique est trop court (< 6 mois utiles), on signale `lowConfidence`
 * et on n'applique pas la saisonnalité (juste la moyenne avec une bande
 * d'incertitude large).
 *
 * Le CA mensuel est issu des leads `converti` du mois × valeur estimée
 * (`lib/pipeline-value`). La projection CA réutilise la trend + index, mais
 * lissée par le taux de conversion historique pour rester réaliste.
 *
 * Limites assumées :
 *   - aucun lissage HoltWinters / ARIMA : c'est une projection naïve mais
 *     lisible. Un vrai modèle ARIMA viendra en V+1 si demande.
 *   - les chocs externes (médias, sinistralité) ne sont pas modélisés.
 *   - les "perdu" ne consomment pas la baseline (on prédit des LEADS, pas
 *     des conversions).
 */

import type { LeadRecord } from "./devis-schema";
import { listLeads } from "./leads-store";
import { getLeadValue } from "./pipeline-value";

const MONTH_LABELS_FR = [
  "Janvier",
  "Février",
  "Mars",
  "Avril",
  "Mai",
  "Juin",
  "Juillet",
  "Août",
  "Septembre",
  "Octobre",
  "Novembre",
  "Décembre",
];

export type HistoricalMonth = {
  year: number;
  month: number; // 1..12
  label: string; // "Mai 2025"
  leads: number;
  conversions: number;
  revenueEur: number; // somme valeur des leads convertis ce mois
};

export type SeasonalIndex = {
  /** Index par mois calendaire 1..12 ; 1.0 = moyenne, >1 = mois fort. */
  byCalendarMonth: Record<number, number>;
  /** Pour transparence : nb d'années couvertes par calendarMonth. */
  yearsPerMonth: Record<number, number>;
};

export type ForecastMonth = {
  year: number;
  month: number;
  label: string;
  forecastLeads: number;
  forecastConversions: number;
  forecastRevenueEur: number;
  seasonalIndex: number;
  /** Bande d'incertitude ±%. */
  uncertaintyPct: number;
};

export type ForecastReport = {
  history: HistoricalMonth[];
  seasonal: SeasonalIndex;
  baseline: {
    /** Moyenne mobile 6 derniers mois (leads). */
    rollingAvg6: number;
    /** Pente linéaire mensuelle estimée sur 12 mois (leads/mois). */
    monthlySlope: number;
    /** Taux de conversion sur les 12 derniers mois (0..1). */
    conversionRate: number;
    /** Valeur moyenne par lead converti sur 12 mois. */
    avgDealEur: number;
  };
  /** Projection (3-12 mois). */
  forecast: ForecastMonth[];
  /** Si l'historique est trop court pour fiabilité, le drapeau est levé. */
  lowConfidence: boolean;
  lowConfidenceReason?: string;
};

function ymKey(year: number, month: number): string {
  return `${year}-${month.toString().padStart(2, "0")}`;
}

function buildHistoryByMonth(
  leads: LeadRecord[],
  monthsBack: number,
): HistoricalMonth[] {
  const now = new Date();
  const buckets = new Map<
    string,
    { year: number; month: number; leads: number; conversions: number; revenue: number }
  >();

  // Initialise les N derniers mois à 0 (inclusif mois courant)
  for (let i = monthsBack - 1; i >= 0; i--) {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1));
    const y = d.getUTCFullYear();
    const m = d.getUTCMonth() + 1;
    buckets.set(ymKey(y, m), {
      year: y,
      month: m,
      leads: 0,
      conversions: 0,
      revenue: 0,
    });
  }

  for (const lead of leads) {
    const t = new Date(lead.submittedAt);
    if (!Number.isFinite(t.getTime())) continue;
    const y = t.getUTCFullYear();
    const m = t.getUTCMonth() + 1;
    const key = ymKey(y, m);
    const bucket = buckets.get(key);
    if (!bucket) continue;
    bucket.leads += 1;
    if (lead.status === "converti") {
      bucket.conversions += 1;
      bucket.revenue += getLeadValue(lead);
    }
  }

  return Array.from(buckets.values())
    .sort((a, b) => (a.year - b.year) * 12 + (a.month - b.month))
    .map((b) => ({
      year: b.year,
      month: b.month,
      label: `${MONTH_LABELS_FR[b.month - 1]} ${b.year}`,
      leads: b.leads,
      conversions: b.conversions,
      revenueEur: b.revenue,
    }));
}

function computeSeasonal(history: HistoricalMonth[]): SeasonalIndex {
  // Groupe par mois calendaire 1..12
  const grouped: Record<number, number[]> = {};
  for (let m = 1; m <= 12; m++) grouped[m] = [];
  for (const h of history) grouped[h.month].push(h.leads);

  const globalMean =
    history.length > 0
      ? history.reduce((s, h) => s + h.leads, 0) / history.length
      : 0;

  const byCalendarMonth: Record<number, number> = {};
  const yearsPerMonth: Record<number, number> = {};
  for (let m = 1; m <= 12; m++) {
    const arr = grouped[m];
    yearsPerMonth[m] = arr.length;
    if (arr.length === 0 || globalMean === 0) {
      byCalendarMonth[m] = 1.0;
      continue;
    }
    const mean = arr.reduce((s, v) => s + v, 0) / arr.length;
    const idx = mean / globalMean;
    // Clamp pour éviter divergence sur petits échantillons
    byCalendarMonth[m] = Math.max(0.5, Math.min(1.8, idx));
  }

  return { byCalendarMonth, yearsPerMonth };
}

function linearSlope(values: number[]): number {
  if (values.length < 2) return 0;
  const n = values.length;
  const xMean = (n - 1) / 2;
  const yMean = values.reduce((s, v) => s + v, 0) / n;
  let num = 0;
  let den = 0;
  for (let i = 0; i < n; i++) {
    num += (i - xMean) * (values[i] - yMean);
    den += (i - xMean) ** 2;
  }
  return den === 0 ? 0 : num / den;
}

/**
 * Calcule un rapport de forecast pour les `horizonMonths` prochains mois.
 *
 * @param horizonMonths Nombre de mois à projeter (1..12).
 * @param lookbackMonths Profondeur d'historique à charger (par défaut 24).
 */
export async function computeSeasonalForecast(
  horizonMonths = 6,
  lookbackMonths = 24,
): Promise<ForecastReport> {
  const safeHorizon = Math.max(1, Math.min(12, Math.floor(horizonMonths)));
  const safeLookback = Math.max(12, Math.min(36, Math.floor(lookbackMonths)));

  const leads = await listLeads();
  const history = buildHistoryByMonth(leads, safeLookback);

  const nonEmptyMonths = history.filter((h) => h.leads > 0).length;
  const lowConfidence = nonEmptyMonths < 6;
  const lowConfidenceReason = lowConfidence
    ? `Historique insuffisant (${nonEmptyMonths} mois avec activité) — projection à manier avec prudence.`
    : undefined;

  const last12 = history.slice(-12);
  const last6 = history.slice(-6);
  const rollingAvg6 =
    last6.length > 0 ? last6.reduce((s, h) => s + h.leads, 0) / last6.length : 0;
  const monthlySlope = linearSlope(last12.map((h) => h.leads));

  const totalLeads12 = last12.reduce((s, h) => s + h.leads, 0);
  const totalConv12 = last12.reduce((s, h) => s + h.conversions, 0);
  const totalRev12 = last12.reduce((s, h) => s + h.revenueEur, 0);
  const conversionRate = totalLeads12 > 0 ? totalConv12 / totalLeads12 : 0;
  const avgDealEur = totalConv12 > 0 ? Math.round(totalRev12 / totalConv12) : 0;

  const seasonal = computeSeasonal(history);

  const now = new Date();
  const forecast: ForecastMonth[] = [];
  for (let i = 1; i <= safeHorizon; i++) {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + i, 1));
    const y = d.getUTCFullYear();
    const m = d.getUTCMonth() + 1;
    const baseline = Math.max(0, rollingAvg6 + monthlySlope * i);
    const idx = lowConfidence ? 1.0 : seasonal.byCalendarMonth[m];
    const forecastLeads = Math.round(baseline * idx);
    const forecastConv = Math.round(forecastLeads * conversionRate);
    const forecastRev = Math.round(forecastConv * avgDealEur);
    // Incertitude : 25% baseline + 5% par mois d'horizon, max 70%
    const uncertaintyPct = Math.min(70, 25 + i * 5) + (lowConfidence ? 20 : 0);
    forecast.push({
      year: y,
      month: m,
      label: `${MONTH_LABELS_FR[m - 1]} ${y}`,
      forecastLeads,
      forecastConversions: forecastConv,
      forecastRevenueEur: forecastRev,
      seasonalIndex: Number(idx.toFixed(2)),
      uncertaintyPct: Math.round(uncertaintyPct),
    });
  }

  return {
    history,
    seasonal,
    baseline: {
      rollingAvg6: Number(rollingAvg6.toFixed(1)),
      monthlySlope: Number(monthlySlope.toFixed(2)),
      conversionRate: Number(conversionRate.toFixed(3)),
      avgDealEur,
    },
    forecast,
    lowConfidence,
    lowConfidenceReason,
  };
}
