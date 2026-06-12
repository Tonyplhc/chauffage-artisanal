/**
 * Calcul des déperditions thermiques d'un logement et dimensionnement de la
 * puissance de chauffage.
 *
 * Approche simplifiée pédagogique :
 *   Déperditions chauffage (W) = Volume × G × ΔT
 *   - Volume = surface × hauteur sous plafond
 *   - G = coefficient global d'isolation (W/m³/°C) selon époque/qualité
 *   - ΔT = température intérieure - température extérieure de base
 *
 * Luxembourg : base extérieure -10 °C en zone climatique tempérée
 * (norme NBN, recommandation industrielle).
 *
 * Valeurs INDICATIVES — un dimensionnement réel passe par une étude
 * thermique complète avec U-values mur/toit/sol et ponts thermiques. Cette
 * lib sert d'estimateur grand public + outil de pré-qualification commerciale.
 */
import { PRIX_ENERGIE } from "./referentiel/prix-energie";
import { SCOP_PAC_AIR_EAU } from "./referentiel/estimation";

export type IsolationLevel =
  | "bbc"
  | "good"
  | "average"
  | "weak"
  | "very_weak";

export type EnergySource =
  | "fioul"
  | "gaz"
  | "electrique"
  | "bois"
  | "pac"
  | "inconnu";

export const ISOLATION_COEFFICIENTS: Record<
  IsolationLevel,
  { g: number; label: string; period: string }
> = {
  bbc: {
    g: 0.55,
    label: "Excellente — BBC / passive (post 2012)",
    period: "Construction post-2012 ou rénovation complète",
  },
  good: {
    g: 0.85,
    label: "Bonne — récent / rénové (2000–2012)",
    period: "Isolation post-2000",
  },
  average: {
    g: 1.25,
    label: "Moyenne — années 1990",
    period: "Construction 1990–2000",
  },
  weak: {
    g: 1.65,
    label: "Faible — années 1975–1990",
    period: "Isolation basique",
  },
  very_weak: {
    g: 2.1,
    label: "Très faible — ancien non rénové (avant 1975)",
    period: "Pas d'isolation moderne",
  },
};

/**
 * Tarifs au Luxembourg — lus depuis lib/referentiel/prix-energie (Règle N°5 :
 * source unique, mêmes chiffres que l'estimateur).
 */
export const ENERGY_PRICES_EUR_PER_KWH: Record<EnergySource, number> = {
  fioul: PRIX_ENERGIE.fioul,
  gaz: PRIX_ENERGIE.gaz,
  electrique: PRIX_ENERGIE.electricite,
  bois: PRIX_ENERGIE.bois,
  // Coût équivalent du kWh thermique produit par la PAC (élec / SCOP).
  pac: Math.round((PRIX_ENERGIE.electricite / SCOP_PAC_AIR_EAU) * 1000) / 1000,
  inconnu: PRIX_ENERGIE.fioul,
};

/** Rendement moyen typique par énergie (kWh utile / kWh consommé). */
export const ENERGY_EFFICIENCY: Record<EnergySource, number> = {
  fioul: 0.85,
  gaz: 0.92,
  electrique: 1.0, // effet joule
  bois: 0.75,
  pac: SCOP_PAC_AIR_EAU, // COP moyen air/eau (référentiel)
  inconnu: 0.85,
};

export type HeatLossInput = {
  surfaceM2: number;
  ceilingHeightM: number;
  isolation: IsolationLevel;
  /** Température intérieure souhaitée (défaut 20). */
  targetTempC?: number;
  /** Température extérieure de base (défaut -10 pour Luxembourg). */
  baseExtTempC?: number;
  /** Inclure besoins ECS (eau chaude sanitaire) pour ménage 4 pers. */
  withDhw?: boolean;
  occupants?: number;
  currentEnergy?: EnergySource;
  /** Cible pour estimation économies — défaut PAC. */
  targetEnergy?: EnergySource;
  /** Heures équivalentes pleine puissance / an pour Luxembourg ~1800 h. */
  annualEqHours?: number;
};

export type HeatLossResult = {
  volumeM3: number;
  deltaT: number;
  gFactor: number;
  /** Déperditions calorifiques (W). */
  heatLossW: number;
  /** Puissance chauffage recommandée incluant marge sécurité. */
  recommendedKW: number;
  /** + besoins ECS si demandé (kW). */
  dhwKW: number;
  /** Total puissance à viser. */
  totalKW: number;
  /** Estimation consommation annuelle (kWh thermique). */
  annualHeatKWh: number;
  /** Avec source actuelle. */
  currentAnnualCostEur: number | null;
  /** Avec source cible. */
  targetAnnualCostEur: number | null;
  /** Économies estimées si bascule (négatif = surcoût). */
  savingsEur: number | null;
  /** Co2 économisé indicatif (kg/an) — facteur 0.27 kg/kWh fioul → 0.1 PAC. */
  co2SavedKgPerYear: number | null;
};

const CO2_KG_PER_KWH: Partial<Record<EnergySource, number>> = {
  fioul: 0.27,
  gaz: 0.2,
  electrique: 0.12,
  bois: 0.03,
  pac: 0.045, // électrique × 1/COP
};

export function computeHeatLoss(input: HeatLossInput): HeatLossResult {
  const surface = Math.max(10, input.surfaceM2);
  const height = Math.max(2, Math.min(5, input.ceilingHeightM));
  const volumeM3 = surface * height;
  const gFactor = ISOLATION_COEFFICIENTS[input.isolation].g;
  const targetT = input.targetTempC ?? 20;
  const baseExtT = input.baseExtTempC ?? -10;
  const deltaT = targetT - baseExtT;
  const heatLossW = volumeM3 * gFactor * deltaT;
  // Marge sécurité 20%
  const recommendedKW = Math.round((heatLossW * 1.2) / 1000) * 1; // arrondi kW
  // Besoins ECS : ~1.5 kW base + 0.5 kW par occupant > 2
  const occupants = input.occupants ?? 4;
  const dhwKW = input.withDhw
    ? Math.max(1.5, 1.5 + Math.max(0, occupants - 2) * 0.5)
    : 0;
  const totalKW = recommendedKW + (input.withDhw ? Math.round(dhwKW) : 0);

  // Conso annuelle estimative — heures équivalentes pleine puissance Luxembourg ~1800-2000
  const annualEqHours = input.annualEqHours ?? 1900;
  const annualHeatKWh = Math.round((heatLossW / 1000) * annualEqHours);

  // Coût avec source actuelle
  const annualCost = (energy?: EnergySource) => {
    if (!energy || energy === "inconnu") return null;
    const eff = ENERGY_EFFICIENCY[energy];
    const price = ENERGY_PRICES_EUR_PER_KWH[energy];
    if (!eff || !price) return null;
    const consumed = annualHeatKWh / eff;
    return Math.round(consumed * price);
  };

  const currentAnnualCostEur = annualCost(input.currentEnergy);
  const targetAnnualCostEur = annualCost(input.targetEnergy ?? "pac");
  const savingsEur =
    currentAnnualCostEur !== null && targetAnnualCostEur !== null
      ? currentAnnualCostEur - targetAnnualCostEur
      : null;

  // CO2 — approximation
  const co2Current =
    input.currentEnergy && CO2_KG_PER_KWH[input.currentEnergy]
      ? Math.round(
          (annualHeatKWh / ENERGY_EFFICIENCY[input.currentEnergy]) *
            (CO2_KG_PER_KWH[input.currentEnergy] ?? 0),
        )
      : null;
  const co2Target = CO2_KG_PER_KWH[input.targetEnergy ?? "pac"]
    ? Math.round(
        (annualHeatKWh / ENERGY_EFFICIENCY[input.targetEnergy ?? "pac"]) *
          (CO2_KG_PER_KWH[input.targetEnergy ?? "pac"] ?? 0),
      )
    : null;
  const co2SavedKgPerYear =
    co2Current !== null && co2Target !== null ? co2Current - co2Target : null;

  return {
    volumeM3: Math.round(volumeM3),
    deltaT,
    gFactor,
    heatLossW: Math.round(heatLossW),
    recommendedKW,
    dhwKW: input.withDhw ? Math.round(dhwKW) : 0,
    totalKW,
    annualHeatKWh,
    currentAnnualCostEur,
    targetAnnualCostEur,
    savingsEur,
    co2SavedKgPerYear,
  };
}
