/**
 * Reports mensuels avec comparaisons MoM (month-over-month) et YoY (year-over-year).
 *
 * Calcule pour un (year, month) donné :
 *   - KPIs : leads reçus, hot, convertis, conversion %
 *   - Répartition par service (top 5)
 *   - Top communes (top 5)
 *   - Entonnoir de statuts (nouveau → contacté → devis → rdv → converti / perdu)
 *   - Comparaisons absolues et en % vs mois précédent (M-1) et même mois N-1
 *
 * Lecture seule : pas d'envoi email, pas de persistance d'état. Le rapport est
 * recalculé à la demande depuis les leads existants — bon marché car file-based.
 *
 * Le module `weekly-digest` reste séparé : il gère l'envoi planifié + throttle.
 */

import { listLeads } from "./leads-store";
import type { LeadRecord } from "./devis-schema";

export type MonthlyKpis = {
  leadsReceived: number;
  leadsHot: number;
  leadsConverted: number;
  leadsLost: number;
  conversionRate: number; // 0..1
};

export type MonthlyDelta = {
  abs: number;
  pct: number | null; // null si base = 0 (incomparable)
};

export type MonthlyComparison = {
  leadsReceived: MonthlyDelta;
  leadsHot: MonthlyDelta;
  leadsConverted: MonthlyDelta;
  conversionRate: MonthlyDelta;
};

export type MonthlyReport = {
  period: {
    year: number;
    month: number; // 1..12
    from: string;
    to: string;
    label: string; // ex "Mai 2026"
  };
  kpis: MonthlyKpis;
  prevMonth: { kpis: MonthlyKpis; period: { label: string } };
  prevYear: { kpis: MonthlyKpis; period: { label: string } };
  vsPrevMonth: MonthlyComparison;
  vsPrevYear: MonthlyComparison;
  topCommunes: { name: string; count: number }[];
  serviceSplit: { service: string; count: number }[];
  statusFunnel: { status: string; count: number }[];
  totalsForContext: { allTimeLeads: number };
};

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

function monthBounds(year: number, month: number): { from: Date; to: Date } {
  // month 1..12, exclusive upper bound
  const from = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0, 0));
  const to = new Date(Date.UTC(year, month, 1, 0, 0, 0, 0));
  return { from, to };
}

function leadsInRange(leads: LeadRecord[], from: Date, to: Date): LeadRecord[] {
  const fromMs = from.getTime();
  const toMs = to.getTime();
  return leads.filter((l) => {
    const t = new Date(l.submittedAt).getTime();
    return t >= fromMs && t < toMs;
  });
}

function computeKpis(leads: LeadRecord[]): MonthlyKpis {
  const leadsReceived = leads.length;
  const leadsHot = leads.filter((l) => l.level === "hot").length;
  const leadsConverted = leads.filter((l) => l.status === "converti").length;
  const leadsLost = leads.filter((l) => l.status === "perdu").length;
  const decided = leadsConverted + leadsLost;
  const conversionRate = decided === 0 ? 0 : leadsConverted / decided;
  return { leadsReceived, leadsHot, leadsConverted, leadsLost, conversionRate };
}

function deltaAbs(now: number, base: number): MonthlyDelta {
  const abs = now - base;
  if (base === 0) return { abs, pct: null };
  return { abs, pct: abs / base };
}

function compareKpis(a: MonthlyKpis, b: MonthlyKpis): MonthlyComparison {
  return {
    leadsReceived: deltaAbs(a.leadsReceived, b.leadsReceived),
    leadsHot: deltaAbs(a.leadsHot, b.leadsHot),
    leadsConverted: deltaAbs(a.leadsConverted, b.leadsConverted),
    conversionRate: deltaAbs(a.conversionRate, b.conversionRate),
  };
}

function labelFor(year: number, month: number): string {
  return `${MONTH_LABELS_FR[month - 1]} ${year}`;
}

function prevMonth(year: number, month: number): { year: number; month: number } {
  if (month === 1) return { year: year - 1, month: 12 };
  return { year, month: month - 1 };
}

export async function computeMonthlyReport(
  year: number,
  month: number,
): Promise<MonthlyReport> {
  const leads = await listLeads();

  const cur = monthBounds(year, month);
  const prevM = prevMonth(year, month);
  const prevMBounds = monthBounds(prevM.year, prevM.month);
  const prevYBounds = monthBounds(year - 1, month);

  const curLeads = leadsInRange(leads, cur.from, cur.to);
  const prevMLeads = leadsInRange(leads, prevMBounds.from, prevMBounds.to);
  const prevYLeads = leadsInRange(leads, prevYBounds.from, prevYBounds.to);

  const kpis = computeKpis(curLeads);
  const prevMKpis = computeKpis(prevMLeads);
  const prevYKpis = computeKpis(prevYLeads);

  // Top communes
  const communeMap = new Map<string, number>();
  for (const l of curLeads) {
    const k = (l.commune || "—").trim();
    communeMap.set(k, (communeMap.get(k) ?? 0) + 1);
  }
  const topCommunes = [...communeMap.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, count]) => ({ name, count }));

  // Service split (un lead peut avoir plusieurs services)
  const serviceMap = new Map<string, number>();
  for (const l of curLeads) {
    for (const s of l.services) {
      serviceMap.set(s, (serviceMap.get(s) ?? 0) + 1);
    }
  }
  const serviceSplit = [...serviceMap.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([service, count]) => ({ service, count }));

  // Status funnel — ordre fixe (5 statuts officiels du LeadRecord)
  const funnelOrder = [
    "nouveau",
    "contacte",
    "devis_envoye",
    "converti",
    "perdu",
  ];
  const statusCount = new Map<string, number>();
  for (const l of curLeads) {
    statusCount.set(l.status, (statusCount.get(l.status) ?? 0) + 1);
  }
  const statusFunnel = funnelOrder.map((status) => ({
    status,
    count: statusCount.get(status) ?? 0,
  }));

  return {
    period: {
      year,
      month,
      from: cur.from.toISOString(),
      to: cur.to.toISOString(),
      label: labelFor(year, month),
    },
    kpis,
    prevMonth: {
      kpis: prevMKpis,
      period: { label: labelFor(prevM.year, prevM.month) },
    },
    prevYear: {
      kpis: prevYKpis,
      period: { label: labelFor(year - 1, month) },
    },
    vsPrevMonth: compareKpis(kpis, prevMKpis),
    vsPrevYear: compareKpis(kpis, prevYKpis),
    topCommunes,
    serviceSplit,
    statusFunnel,
    totalsForContext: { allTimeLeads: leads.length },
  };
}

/**
 * Helper : liste des (year, month) pour lesquels on a des leads — utile pour
 * peupler un sélecteur côté UI. Trié desc.
 */
export async function listAvailableMonths(): Promise<
  { year: number; month: number; label: string; count: number }[]
> {
  const leads = await listLeads();
  const map = new Map<string, number>();
  for (const l of leads) {
    const d = new Date(l.submittedAt);
    const key = `${d.getUTCFullYear()}-${d.getUTCMonth() + 1}`;
    map.set(key, (map.get(key) ?? 0) + 1);
  }
  const arr = [...map.entries()]
    .map(([key, count]) => {
      const [y, m] = key.split("-").map(Number);
      return { year: y, month: m, label: labelFor(y, m), count };
    })
    .sort((a, b) => (b.year - a.year) * 100 + (b.month - a.month));
  return arr;
}
