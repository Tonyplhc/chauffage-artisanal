/**
 * Lifecycle management des équipements installés.
 *
 * Pour chaque équipement, calcule son âge, sa durée de vie attendue et son
 * statut (sain / vieillissant / fin de vie). Identifie les opportunités
 * commerciales de remplacement préventif.
 *
 * Durées de vie : moyennes industrie. Plusieurs facteurs réduisent (mauvais
 * entretien, eau dure, surcharge). Ce calcul est indicatif.
 */

import { listEquipment, type Equipment } from "./equipment-store";

export type LifecycleStatus =
  | "new" // <25 % de la durée de vie
  | "healthy" // 25–60 %
  | "aging" // 60–85 %
  | "near_end" // 85–100 %
  | "end_of_life"; // >100 %

/** Durée de vie moyenne en années par type d'équipement. */
export const LIFESPAN_YEARS: Record<Equipment["type"], number> = {
  chaudiere: 18,
  pac: 17,
  ballon: 14,
  clim: 12,
  vmc: 20,
  solaire: 25,
  regulation: 15,
  autre: 15,
};

export type LifecycleAssessment = {
  equipment: Equipment;
  ageYears: number | null;
  lifespanYears: number;
  /** Ratio age / lifespan (0..>1). */
  wearRatio: number | null;
  status: LifecycleStatus;
  /** Score d'opportunité commerciale (0..100). */
  opportunityScore: number;
  /** Recommandation textuelle courte. */
  recommendation: string;
};

export function assessLifecycle(equipment: Equipment): LifecycleAssessment {
  const lifespanYears = LIFESPAN_YEARS[equipment.type];
  const installedAt = equipment.installedAt
    ? new Date(equipment.installedAt).getTime()
    : null;
  let ageYears: number | null = null;
  if (installedAt) {
    ageYears =
      (Date.now() - installedAt) / (365.25 * 86_400_000);
  }
  const wearRatio = ageYears !== null ? ageYears / lifespanYears : null;
  let status: LifecycleStatus = "new";
  if (wearRatio === null) {
    status = "healthy";
  } else if (wearRatio < 0.25) status = "new";
  else if (wearRatio < 0.6) status = "healthy";
  else if (wearRatio < 0.85) status = "aging";
  else if (wearRatio <= 1.0) status = "near_end";
  else status = "end_of_life";

  // Opportunity score : 0 si neuf, ramping up
  let opportunityScore = 0;
  if (wearRatio !== null) {
    if (wearRatio < 0.6) opportunityScore = Math.round(wearRatio * 30);
    else if (wearRatio < 0.85)
      opportunityScore = 18 + Math.round((wearRatio - 0.6) * 200);
    else if (wearRatio <= 1.0)
      opportunityScore = 68 + Math.round((wearRatio - 0.85) * 130);
    else opportunityScore = 95;
  }
  if (equipment.status === "decommissioned") opportunityScore = 100;

  // Bonus opportunité : garantie expirée
  if (
    equipment.warrantyExpiresAt &&
    new Date(equipment.warrantyExpiresAt).getTime() < Date.now()
  ) {
    opportunityScore = Math.min(100, opportunityScore + 5);
  }

  let recommendation = "RAS — équipement en bon état présumé.";
  if (status === "aging") {
    recommendation =
      "Vieillissement notable : programmer un entretien renforcé, anticiper le remplacement.";
  } else if (status === "near_end") {
    recommendation =
      "Approche de la fin de vie. Préparer le client à un remplacement préventif.";
  } else if (status === "end_of_life") {
    recommendation =
      "Au-delà de la durée de vie estimée. Remplacement à proposer rapidement (rendement chuté, risque de panne).";
  } else if (status === "healthy") {
    recommendation = "Phase de pleine performance. Maintenir l'entretien régulier.";
  } else {
    recommendation = "Équipement récent. Prochaine grosse échéance dans plusieurs années.";
  }

  return {
    equipment,
    ageYears: ageYears === null ? null : Math.round(ageYears * 10) / 10,
    lifespanYears,
    wearRatio,
    status,
    opportunityScore,
    recommendation,
  };
}

export async function listAssessments(opts: {
  minStatus?: LifecycleStatus;
} = {}): Promise<LifecycleAssessment[]> {
  const items = await listEquipment();
  const order: LifecycleStatus[] = [
    "new",
    "healthy",
    "aging",
    "near_end",
    "end_of_life",
  ];
  const min = opts.minStatus
    ? order.indexOf(opts.minStatus)
    : 0;
  return items
    .map(assessLifecycle)
    .filter((a) => order.indexOf(a.status) >= min)
    .sort((a, b) => b.opportunityScore - a.opportunityScore);
}

export type LifecycleStats = {
  totals: Record<LifecycleStatus, number>;
  totalOpportunities: number;
  averageAge: number | null;
};

export async function computeStats(): Promise<LifecycleStats> {
  const assessments = await listAssessments();
  const totals: Record<LifecycleStatus, number> = {
    new: 0,
    healthy: 0,
    aging: 0,
    near_end: 0,
    end_of_life: 0,
  };
  let totalOpportunities = 0;
  let ageSum = 0;
  let ageCount = 0;
  for (const a of assessments) {
    totals[a.status] += 1;
    if (a.opportunityScore >= 50) totalOpportunities += 1;
    if (a.ageYears !== null) {
      ageSum += a.ageYears;
      ageCount += 1;
    }
  }
  return {
    totals,
    totalOpportunities,
    averageAge: ageCount === 0 ? null : ageSum / ageCount,
  };
}
