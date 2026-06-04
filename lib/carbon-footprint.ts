/**
 * Empreinte carbone agrégée des conversions.
 *
 * Estimation simplifiée : pour chaque lead converti vers une énergie plus
 * propre que l'existante, on calcule les kg CO2 évités annuellement.
 *
 * Facteurs CO2 par kWh consommé (source ADEME / approximations) :
 *   fioul     : 0.27 kg/kWh
 *   gaz       : 0.20 kg/kWh
 *   électrique: 0.08 kg/kWh (mix luxembourgeois, hors PAC)
 *   pac       : 0.022 kg/kWh thermique (élec / COP)
 *   bois      : 0.03 kg/kWh (biomasse)
 *
 * Estimation conso annuelle = 12 000 kWh thermique par lead par défaut (maison
 * moyenne). Si on a la surface, on ajuste (90 kWh/m² rénové).
 *
 * Indicatif — pour des chiffres officiels, brancher sur les certificats de
 * performance énergétique réels.
 */

import { listLeads } from "./leads-store";
import type { LeadRecord } from "./devis-schema";

export const CO2_PER_KWH: Record<string, number> = {
  fioul: 0.27,
  gaz: 0.2,
  electrique: 0.08,
  pac: 0.022,
  bois: 0.03,
  autre: 0.18,
  inconnu: 0.18,
};

const DEFAULT_ANNUAL_KWH = 12_000;
const KWH_PER_M2_AVG = 90;

function inferTargetEnergy(lead: LeadRecord): string {
  // Inference : si "pac" dans les services → PAC ; "enr" → solaire (PV ?).
  if (lead.services.includes("pac")) return "pac";
  if (lead.services.includes("enr")) return "pac"; // approximation
  if (lead.services.includes("chauffage")) return "gaz"; // remplacement chaudière classique
  return lead.currentEnergy ?? "inconnu";
}

function estimateAnnualKwh(lead: LeadRecord): number {
  if (typeof lead.surface === "number" && lead.surface > 0) {
    return Math.round(lead.surface * KWH_PER_M2_AVG);
  }
  return DEFAULT_ANNUAL_KWH;
}

export type CarbonReport = {
  reference: string;
  fullName: string;
  fromEnergy: string;
  toEnergy: string;
  annualKwh: number;
  co2FromKgPerYear: number;
  co2ToKgPerYear: number;
  co2SavedKgPerYear: number;
};

export async function buildPortfolio(): Promise<{
  reports: CarbonReport[];
  totals: {
    convertedCount: number;
    annualCo2SavedKg: number;
    lifetimeCo2SavedKg: number; // sur 15 ans
    equivalentTreesPlanted: number; // 25 kg/an/arbre
    equivalentCarsRetired: number; // 4000 kg/an/voiture
  };
}> {
  const leads = await listLeads();
  const converted = leads.filter((l) => l.status === "converti");
  const reports: CarbonReport[] = [];
  for (const lead of converted) {
    const fromEnergy = lead.currentEnergy ?? "inconnu";
    const toEnergy = inferTargetEnergy(lead);
    if (fromEnergy === toEnergy) continue; // pas de bascule pertinente
    const annualKwh = estimateAnnualKwh(lead);
    const co2From = Math.round(annualKwh * (CO2_PER_KWH[fromEnergy] ?? 0.2));
    const co2To = Math.round(annualKwh * (CO2_PER_KWH[toEnergy] ?? 0.2));
    const saved = co2From - co2To;
    if (saved <= 0) continue;
    reports.push({
      reference: lead.reference,
      fullName: lead.fullName,
      fromEnergy,
      toEnergy,
      annualKwh,
      co2FromKgPerYear: co2From,
      co2ToKgPerYear: co2To,
      co2SavedKgPerYear: saved,
    });
  }
  const annualCo2SavedKg = reports.reduce(
    (s, r) => s + r.co2SavedKgPerYear,
    0,
  );
  const lifetimeCo2SavedKg = annualCo2SavedKg * 15;
  const equivalentTreesPlanted = Math.round(annualCo2SavedKg / 25);
  const equivalentCarsRetired = Math.round(annualCo2SavedKg / 4000);
  reports.sort((a, b) => b.co2SavedKgPerYear - a.co2SavedKgPerYear);
  return {
    reports,
    totals: {
      convertedCount: reports.length,
      annualCo2SavedKg,
      lifetimeCo2SavedKg,
      equivalentTreesPlanted,
      equivalentCarsRetired,
    },
  };
}
