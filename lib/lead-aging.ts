/**
 * Lead aging — temps moyens par étape du pipeline.
 *
 * Pour chaque transition de statut (from → to), calcule la durée écoulée
 * depuis la précédente transition (ou depuis submittedAt si première). Agrège
 * sur tous les leads pour identifier les goulots d'étranglement.
 *
 * SLA cibles indicatives (à comparer avec lib/sla-tracker.ts pour le 1er
 * contact — ici on regarde l'ensemble du parcours).
 */

import { listLeads } from "./leads-store";
import type { LeadRecord } from "./devis-schema";

const SLA_TARGETS_HOURS: Record<string, number> = {
  "nouveau→contacte": 4,
  "contacte→devis_envoye": 72, // 3 jours
  "devis_envoye→converti": 336, // 14 jours
  "devis_envoye→perdu": 480, // 20 jours
};

export type TransitionStats = {
  key: string;
  from: string;
  to: string;
  count: number;
  meanHours: number;
  medianHours: number;
  p90Hours: number;
  /** Cible SLA en heures (si définie). */
  targetHours?: number;
  /** Ratio actual vs cible — >1 = en retard. */
  performanceRatio?: number;
};

function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[mid - 1] + sorted[mid]) / 2
    : sorted[mid];
}

function percentile(values: number[], p: number): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const idx = Math.floor((p / 100) * (sorted.length - 1));
  return sorted[idx];
}

function transitionsOf(lead: LeadRecord): {
  from: string;
  to: string;
  durationMs: number;
}[] {
  const history = lead.statusHistory ?? [];
  const out: typeof history extends (infer T)[]
    ? { from: string; to: string; durationMs: number }[]
    : never = [];
  let prevAt = new Date(lead.submittedAt).getTime();
  for (const entry of history) {
    const at = new Date(entry.at).getTime();
    out.push({ from: entry.from, to: entry.to, durationMs: at - prevAt });
    prevAt = at;
  }
  return out;
}

export async function computeAging(): Promise<{
  byTransition: TransitionStats[];
  bottleneck: TransitionStats | null;
  /** Temps total moyen d'un lead jusqu'à conversion. */
  averageTotalDaysToConvert: number | null;
  totalLeads: number;
  convertedLeads: number;
}> {
  const leads = await listLeads();
  const totalLeads = leads.length;
  const transitionsMap = new Map<string, number[]>();

  let totalConvertedMs = 0;
  let convertedCount = 0;

  for (const lead of leads) {
    const transitions = transitionsOf(lead);
    for (const t of transitions) {
      const key = `${t.from}→${t.to}`;
      if (!transitionsMap.has(key)) transitionsMap.set(key, []);
      transitionsMap.get(key)!.push(t.durationMs);
    }
    // Total duration jusqu'à converti
    if (lead.status === "converti") {
      const history = lead.statusHistory ?? [];
      const last = history[history.length - 1];
      if (last?.to === "converti") {
        const start = new Date(lead.submittedAt).getTime();
        const end = new Date(last.at).getTime();
        totalConvertedMs += end - start;
        convertedCount += 1;
      }
    }
  }

  const byTransition: TransitionStats[] = [];
  for (const [key, durations] of transitionsMap) {
    const hours = durations.map((d) => d / 3600_000);
    const [from, to] = key.split("→");
    const meanHours = hours.reduce((a, b) => a + b, 0) / hours.length;
    const stat: TransitionStats = {
      key,
      from,
      to,
      count: durations.length,
      meanHours: Math.round(meanHours * 10) / 10,
      medianHours: Math.round(median(hours) * 10) / 10,
      p90Hours: Math.round(percentile(hours, 90) * 10) / 10,
      targetHours: SLA_TARGETS_HOURS[key],
    };
    if (stat.targetHours) {
      stat.performanceRatio =
        Math.round((stat.meanHours / stat.targetHours) * 100) / 100;
    }
    byTransition.push(stat);
  }

  // Bottleneck : pire performanceRatio (avec target défini)
  const withTargets = byTransition.filter(
    (t) => t.performanceRatio !== undefined,
  );
  withTargets.sort(
    (a, b) => (b.performanceRatio ?? 0) - (a.performanceRatio ?? 0),
  );
  const bottleneck = withTargets[0] ?? null;

  // Tri pour affichage : ordre logique du pipeline
  const ORDER = [
    "nouveau→contacte",
    "contacte→devis_envoye",
    "devis_envoye→converti",
    "devis_envoye→perdu",
    "nouveau→perdu",
    "contacte→perdu",
  ];
  byTransition.sort((a, b) => {
    const ai = ORDER.indexOf(a.key);
    const bi = ORDER.indexOf(b.key);
    return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
  });

  return {
    byTransition,
    bottleneck,
    averageTotalDaysToConvert:
      convertedCount === 0
        ? null
        : Math.round(totalConvertedMs / convertedCount / 86_400_000),
    totalLeads,
    convertedLeads: convertedCount,
  };
}
