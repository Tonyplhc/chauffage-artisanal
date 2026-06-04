/**
 * Heatmap d'activité des leads — jour de la semaine × heure du jour.
 *
 * Source : `submittedAt` de chaque lead. Locale Europe/Luxembourg pour
 * extraire jour/heure (offset géré par toLocaleString basique).
 *
 * Output : matrice 7 × 24 + agrégats (peak day, peak hour, top cells).
 */

import type { LeadRecord } from "./devis-schema";

export const DAY_LABELS = [
  "Lundi",
  "Mardi",
  "Mercredi",
  "Jeudi",
  "Vendredi",
  "Samedi",
  "Dimanche",
];

/** Convertit Date → [dayIndex 0..6 (lundi=0), hour 0..23]. */
function bucketOf(d: Date): [number, number] {
  // getDay : 0=dimanche, 6=samedi. On veut 0=lundi.
  const js = d.getDay();
  const day = (js + 6) % 7;
  return [day, d.getHours()];
}

export type Heatmap = {
  matrix: number[][]; // [day][hour]
  rowTotals: number[]; // [day]
  colTotals: number[]; // [hour]
  total: number;
  peak: { count: number; day: number; hour: number } | null;
  peakDay: { day: number; count: number } | null;
  peakHour: { hour: number; count: number } | null;
  /** Top cellules par count desc. */
  topCells: { day: number; hour: number; count: number }[];
  /** Plage horaire conseillée — heure moyenne pondérée arrondie. */
  recommendedHourRange: { from: number; to: number } | null;
};

export function computeHeatmap(leads: LeadRecord[]): Heatmap {
  const matrix: number[][] = Array.from({ length: 7 }, () =>
    Array.from({ length: 24 }, () => 0),
  );
  let total = 0;
  for (const l of leads) {
    const d = new Date(l.submittedAt);
    if (isNaN(d.getTime())) continue;
    const [day, hour] = bucketOf(d);
    matrix[day][hour] += 1;
    total += 1;
  }

  const rowTotals = matrix.map((row) => row.reduce((a, b) => a + b, 0));
  const colTotals = Array.from({ length: 24 }, (_, h) =>
    matrix.reduce((s, row) => s + row[h], 0),
  );

  let peak: Heatmap["peak"] = null;
  for (let d = 0; d < 7; d++) {
    for (let h = 0; h < 24; h++) {
      const c = matrix[d][h];
      if (c > 0 && (!peak || c > peak.count)) {
        peak = { count: c, day: d, hour: h };
      }
    }
  }
  const peakDayIdx = rowTotals.indexOf(Math.max(...rowTotals));
  const peakHourIdx = colTotals.indexOf(Math.max(...colTotals));

  const peakDay =
    rowTotals[peakDayIdx] > 0
      ? { day: peakDayIdx, count: rowTotals[peakDayIdx] }
      : null;
  const peakHour =
    colTotals[peakHourIdx] > 0
      ? { hour: peakHourIdx, count: colTotals[peakHourIdx] }
      : null;

  // Top 5 cellules (jour, heure)
  const cells: { day: number; hour: number; count: number }[] = [];
  for (let d = 0; d < 7; d++) {
    for (let h = 0; h < 24; h++) {
      if (matrix[d][h] > 0)
        cells.push({ day: d, hour: h, count: matrix[d][h] });
    }
  }
  cells.sort((a, b) => b.count - a.count);
  const topCells = cells.slice(0, 5);

  // Recommandation : prend la plage horaire qui couvre 60% des soumissions
  let recommendedHourRange: Heatmap["recommendedHourRange"] = null;
  if (total > 0) {
    // Trouve la fenêtre de 3 heures consécutives avec la plus grosse somme
    let best = { from: 9, to: 11, sum: 0 };
    for (let start = 0; start < 22; start++) {
      const sum = colTotals[start] + colTotals[start + 1] + colTotals[start + 2];
      if (sum > best.sum) best = { from: start, to: start + 2, sum };
    }
    if (best.sum > 0) {
      recommendedHourRange = { from: best.from, to: best.to };
    }
  }

  return {
    matrix,
    rowTotals,
    colTotals,
    total,
    peak,
    peakDay,
    peakHour,
    topCells,
    recommendedHourRange,
  };
}
