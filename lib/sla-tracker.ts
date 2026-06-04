/**
 * SLA tracker — cibles de temps de premier contact par niveau de lead.
 *
 * Pourquoi : un lead hot oublié 6 heures, c'est probablement perdu. Le SLA
 * tracker matérialise un objectif et signale les dépassements (« breaches »)
 * pour qu'aucun lead chaud ne dorme dans le pipeline.
 *
 * Calcul du « temps de 1ère réponse » :
 *   - Première transition de statut hors de "nouveau" (statusHistory[0])
 *   - Si pas encore de transition mais lead n'est plus nouveau (ex: pré-audit),
 *     on prend submittedAt → now comme inconnu
 *   - Si le lead est toujours "nouveau" → SLA en cours, vérifie si déjà dépassé
 *
 * Cibles par défaut (modifiables via brand-settings dans une V+1) :
 *   - hot  : 60 min
 *   - warm : 240 min (4h)
 *   - cold : 1440 min (24h)
 *
 * Heures ouvrées : on reste simple — pas de calendrier de business hours en
 * V1. Ça reste un signal indicatif, à pondérer avec l'expérience opérateur.
 */

import type { LeadRecord } from "./devis-schema";
import type { LeadLevel } from "./lead-scoring";

export type SlaTarget = {
  level: LeadLevel;
  minutes: number;
  label: string;
};

export const DEFAULT_SLA_TARGETS: Record<LeadLevel, SlaTarget> = {
  hot: { level: "hot", minutes: 60, label: "1 h" },
  warm: { level: "warm", minutes: 240, label: "4 h" },
  cold: { level: "cold", minutes: 1440, label: "24 h" },
};

export type SlaStatus = "ok" | "warning" | "breach" | "pending" | "na";

export type SlaAssessment = {
  status: SlaStatus;
  /** Temps en ms écoulé jusqu'à la première réponse (ou jusqu'à maintenant). */
  elapsedMs: number;
  /** Cible en ms. */
  targetMs: number;
  /** Si répondu, la date de la première transition hors de "nouveau". */
  firstResponseAt?: string;
  level?: LeadLevel;
};

const MINUTE = 60_000;

export function getSlaTarget(
  level: LeadLevel | undefined,
  custom?: Partial<Record<LeadLevel, number>>,
): number {
  if (!level) return DEFAULT_SLA_TARGETS.warm.minutes * MINUTE;
  const m = custom?.[level] ?? DEFAULT_SLA_TARGETS[level].minutes;
  return m * MINUTE;
}

/**
 * Inspecte le statusHistory pour trouver la 1ère transition hors de "nouveau".
 */
function findFirstResponseAt(lead: LeadRecord): string | undefined {
  const history = lead.statusHistory ?? [];
  for (const entry of history) {
    if (entry.from === "nouveau" && entry.to !== "nouveau") {
      return entry.at;
    }
  }
  // Pas d'historique mais statut ≠ nouveau → on a perdu l'info temporelle :
  // on ne peut pas estimer, retourne undefined (le lead sera marqué "na").
  return undefined;
}

export function assessLeadSla(
  lead: LeadRecord,
  now: number = Date.now(),
  custom?: Partial<Record<LeadLevel, number>>,
): SlaAssessment {
  const targetMs = getSlaTarget(lead.level, custom);
  const submittedMs = new Date(lead.submittedAt).getTime();
  const firstResponseAt = findFirstResponseAt(lead);

  // Cas 1 : lead encore "nouveau" → SLA en cours
  if (lead.status === "nouveau") {
    const elapsedMs = now - submittedMs;
    let status: SlaStatus = "ok";
    if (elapsedMs >= targetMs) status = "breach";
    else if (elapsedMs >= targetMs * 0.75) status = "warning";
    return {
      status: lead.status === "nouveau" ? (status === "ok" ? "pending" : status) : status,
      elapsedMs,
      targetMs,
      level: lead.level,
    };
  }

  // Cas 2 : lead a bougé mais pas d'historique → on ne peut pas mesurer
  if (!firstResponseAt) {
    return { status: "na", elapsedMs: 0, targetMs, level: lead.level };
  }

  // Cas 3 : on a la 1ère transition → mesure ferme
  const respondedMs = new Date(firstResponseAt).getTime();
  const elapsedMs = respondedMs - submittedMs;
  const status: SlaStatus = elapsedMs <= targetMs ? "ok" : "breach";
  return {
    status,
    elapsedMs,
    targetMs,
    firstResponseAt,
    level: lead.level,
  };
}

export type SlaStats = {
  // KPIs globaux
  total: number;
  measured: number;
  ok: number;
  breach: number;
  pending: number;
  warning: number;
  na: number;
  // Taux respect (parmi mesurés)
  complianceRate: number; // 0..1
  // Temps moyen de 1ère réponse (parmi mesurés)
  avgResponseMs: number | null;
  // Détail par level
  byLevel: Record<
    LeadLevel,
    {
      total: number;
      ok: number;
      breach: number;
      pending: number;
      avgResponseMs: number | null;
    }
  >;
  // Leads "à risque" : encore nouveau et warning/breach
  atRisk: {
    reference: string;
    fullName: string;
    commune: string;
    level: LeadLevel | undefined;
    elapsedMs: number;
    targetMs: number;
    status: SlaStatus;
    submittedAt: string;
  }[];
};

export function computeSlaStats(
  leads: LeadRecord[],
  now: number = Date.now(),
): SlaStats {
  const byLevel: SlaStats["byLevel"] = {
    hot: { total: 0, ok: 0, breach: 0, pending: 0, avgResponseMs: null },
    warm: { total: 0, ok: 0, breach: 0, pending: 0, avgResponseMs: null },
    cold: { total: 0, ok: 0, breach: 0, pending: 0, avgResponseMs: null },
  };
  const responseTimesByLevel: Record<LeadLevel, number[]> = {
    hot: [],
    warm: [],
    cold: [],
  };
  const allResponseTimes: number[] = [];

  let total = 0;
  let measured = 0;
  let ok = 0;
  let breach = 0;
  let pending = 0;
  let warning = 0;
  let na = 0;
  const atRisk: SlaStats["atRisk"] = [];

  for (const lead of leads) {
    total += 1;
    const a = assessLeadSla(lead, now);
    if (lead.level && byLevel[lead.level]) byLevel[lead.level].total += 1;

    if (a.status === "ok") {
      ok += 1;
      if (lead.level) byLevel[lead.level].ok += 1;
    } else if (a.status === "breach") {
      breach += 1;
      if (lead.level) byLevel[lead.level].breach += 1;
    } else if (a.status === "pending" || a.status === "warning") {
      pending += 1;
      if (lead.level) byLevel[lead.level].pending += 1;
      if (a.status === "warning") warning += 1;
    } else if (a.status === "na") {
      na += 1;
    }

    // Compte comme "mesuré" seulement les leads avec firstResponseAt
    if (a.firstResponseAt) {
      measured += 1;
      allResponseTimes.push(a.elapsedMs);
      if (lead.level) responseTimesByLevel[lead.level].push(a.elapsedMs);
    }

    // À risque : encore nouveau + warning ou breach
    if (
      lead.status === "nouveau" &&
      (a.status === "breach" || a.status === "warning")
    ) {
      atRisk.push({
        reference: lead.reference,
        fullName: lead.fullName,
        commune: lead.commune,
        level: lead.level,
        elapsedMs: a.elapsedMs,
        targetMs: a.targetMs,
        status: a.status,
        submittedAt: lead.submittedAt,
      });
    }
  }

  // Moyennes
  for (const lvl of ["hot", "warm", "cold"] as LeadLevel[]) {
    const arr = responseTimesByLevel[lvl];
    byLevel[lvl].avgResponseMs =
      arr.length === 0 ? null : arr.reduce((a, b) => a + b, 0) / arr.length;
  }
  const avgResponseMs =
    allResponseTimes.length === 0
      ? null
      : allResponseTimes.reduce((a, b) => a + b, 0) / allResponseTimes.length;

  // Tri at-risk : pire en premier (elapsed/target descendant)
  atRisk.sort((a, b) => b.elapsedMs / b.targetMs - a.elapsedMs / a.targetMs);

  // Taux respect parmi les leads effectivement mesurés (ayant une 1ère réponse)
  const compliance = measured === 0 ? 1 : ok / measured;

  return {
    total,
    measured,
    ok,
    breach,
    pending,
    warning,
    na,
    complianceRate: compliance,
    avgResponseMs,
    byLevel,
    atRisk: atRisk.slice(0, 25),
  };
}

/** Helper d'affichage : "1 h 23 min", "47 min", "2 j 4 h" */
export function formatDuration(ms: number): string {
  if (ms < 0) ms = 0;
  const min = Math.floor(ms / 60_000);
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  const rm = min % 60;
  if (h < 24) return rm === 0 ? `${h} h` : `${h} h ${rm} min`;
  const d = Math.floor(h / 24);
  const rh = h % 24;
  return rh === 0 ? `${d} j` : `${d} j ${rh} h`;
}
