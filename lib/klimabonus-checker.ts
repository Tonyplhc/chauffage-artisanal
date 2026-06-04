/**
 * Vérificateur éligibilité Klimabonus (Luxembourg).
 *
 * Implémente un arbre de conditions inspiré du programme officiel d'aide
 * Klimabonus du Luxembourg, mis à jour pour 2026.
 *
 * IMPORTANT : les montants exacts et conditions évoluent annuellement par
 * règlement grand-ducal. Cette implémentation reflète l'état au moment du
 * développement. **Toujours vérifier sur le site officiel klimabonus.lu**
 * avant un engagement client.
 *
 * Source à consulter : https://klimabonus.lu (consulter régulièrement)
 *
 * Stratégie : on retourne un score d'éligibilité (oui/probablement/non) +
 * une estimation FOURCHETTE pour ne pas promettre un montant exact.
 */

export type BuildingAge = "neuf" | "moins-10ans" | "10-30ans" | "plus-30ans";
export type HousingType = "individuelle" | "appartement" | "collectif";
export type OwnerType = "proprietaire-occupant" | "proprietaire-bailleur" | "syndicat";
export type IncomeBracket = "standard" | "modeste" | "tres-modeste";
export type ProjectType =
  | "pac-air-eau"
  | "pac-geothermique"
  | "chaudiere-biomasse"
  | "solaire-thermique"
  | "photovoltaique"
  | "vmc-double-flux"
  | "isolation-toiture"
  | "isolation-murs"
  | "isolation-sol"
  | "fenetres";

export const PROJECT_LABELS: Record<ProjectType, string> = {
  "pac-air-eau": "Pompe à chaleur air/eau",
  "pac-geothermique": "Pompe à chaleur géothermique",
  "chaudiere-biomasse": "Chaudière biomasse (granulés/bois)",
  "solaire-thermique": "Solaire thermique",
  photovoltaique: "Photovoltaïque",
  "vmc-double-flux": "VMC double flux",
  "isolation-toiture": "Isolation toiture",
  "isolation-murs": "Isolation murs extérieurs",
  "isolation-sol": "Isolation sol",
  fenetres: "Remplacement fenêtres",
};

export type KlimabonusInput = {
  projectType: ProjectType;
  buildingAge: BuildingAge;
  housingType: HousingType;
  ownerType: OwnerType;
  incomeBracket: IncomeBracket;
  /** Montant total des travaux TTC (€). */
  totalCostEur: number;
};

export type KlimabonusResult = {
  eligibility: "eligible" | "probable" | "non-eligible";
  /** Aide estimée — fourchette basse à haute. */
  estimatedAidEur: [number, number] | null;
  /** Pourcentage estimé sur le coût total. */
  percentRange: [number, number] | null;
  /** Conditions remplies / bloquantes. */
  reasons: { type: "positive" | "negative" | "warning"; text: string }[];
  /** Recommandations pour maximiser l'aide. */
  tips: string[];
};

/**
 * Logique : chaque projet a une "base rate" (% du coût), modulée par les
 * critères (revenu modeste = +25%, ancien non isolé = +0%, etc.) jusqu'à un
 * plafond. Implémentation simplifiée mais transparente.
 */
const PROJECT_BASE_RATES: Record<
  ProjectType,
  { baseLowPct: number; baseHighPct: number; capEur: number }
> = {
  "pac-air-eau": { baseLowPct: 0.25, baseHighPct: 0.40, capEur: 15000 },
  "pac-geothermique": { baseLowPct: 0.35, baseHighPct: 0.55, capEur: 22000 },
  "chaudiere-biomasse": { baseLowPct: 0.25, baseHighPct: 0.40, capEur: 12000 },
  "solaire-thermique": { baseLowPct: 0.30, baseHighPct: 0.50, capEur: 8000 },
  photovoltaique: { baseLowPct: 0.15, baseHighPct: 0.25, capEur: 8000 },
  "vmc-double-flux": { baseLowPct: 0.25, baseHighPct: 0.40, capEur: 6000 },
  "isolation-toiture": { baseLowPct: 0.25, baseHighPct: 0.45, capEur: 8000 },
  "isolation-murs": { baseLowPct: 0.25, baseHighPct: 0.45, capEur: 12000 },
  "isolation-sol": { baseLowPct: 0.25, baseHighPct: 0.40, capEur: 6000 },
  fenetres: { baseLowPct: 0.20, baseHighPct: 0.35, capEur: 6000 },
};

export function checkKlimabonusEligibility(
  input: KlimabonusInput,
): KlimabonusResult {
  const reasons: KlimabonusResult["reasons"] = [];
  const tips: string[] = [];

  // Bâtiment neuf : aides minimales sauf cas spécifiques
  if (input.buildingAge === "neuf") {
    if (input.projectType === "isolation-toiture" ||
        input.projectType === "isolation-murs" ||
        input.projectType === "isolation-sol" ||
        input.projectType === "fenetres") {
      reasons.push({
        type: "negative",
        text: "Bâtiment neuf : les aides sont concentrées sur la rénovation. Isolation neuve = pas d'aide Klimabonus.",
      });
      return {
        eligibility: "non-eligible",
        estimatedAidEur: null,
        percentRange: null,
        reasons,
        tips,
      };
    }
    reasons.push({
      type: "warning",
      text: "Bâtiment neuf : aides réduites par rapport à la rénovation.",
    });
  } else {
    reasons.push({
      type: "positive",
      text: `Bâtiment ${input.buildingAge.replace("-", " ")} : éligible aux aides rénovation.`,
    });
  }

  // Propriétaire occupant favorisé
  if (input.ownerType === "proprietaire-occupant") {
    reasons.push({
      type: "positive",
      text: "Propriétaire occupant : éligibilité standard.",
    });
  } else if (input.ownerType === "proprietaire-bailleur") {
    reasons.push({
      type: "warning",
      text: "Propriétaire bailleur : conditions spécifiques (parfois aide réduite).",
    });
  } else {
    reasons.push({
      type: "positive",
      text: "Syndicat de copropriété : aide collective possible.",
    });
  }

  // Bonus revenus
  let incomeMultiplier = 1;
  if (input.incomeBracket === "modeste") {
    incomeMultiplier = 1.15;
    reasons.push({
      type: "positive",
      text: "Revenus modestes : bonus d'aide de ~15%.",
    });
  } else if (input.incomeBracket === "tres-modeste") {
    incomeMultiplier = 1.3;
    reasons.push({
      type: "positive",
      text: "Revenus très modestes : bonus d'aide de ~30%.",
    });
  }

  const rates = PROJECT_BASE_RATES[input.projectType];
  let lowPct = rates.baseLowPct * incomeMultiplier;
  let highPct = rates.baseHighPct * incomeMultiplier;

  // Ajustements selon âge
  if (input.buildingAge === "plus-30ans" && input.projectType !== "photovoltaique") {
    lowPct *= 1.1;
    highPct *= 1.1;
    reasons.push({
      type: "positive",
      text: "Bâtiment de plus de 30 ans : aide bonifiée pour rénovation énergétique.",
    });
  }

  let lowAid = Math.min(input.totalCostEur * lowPct, rates.capEur);
  let highAid = Math.min(input.totalCostEur * highPct, rates.capEur);

  if (lowAid <= 0 || highAid <= 0) {
    return {
      eligibility: "non-eligible",
      estimatedAidEur: null,
      percentRange: null,
      reasons,
      tips,
    };
  }

  // Recommandations
  if (input.projectType === "pac-air-eau" || input.projectType === "pac-geothermique") {
    tips.push(
      "Pour bénéficier de l'aide PAC, l'installation doit être réalisée par un artisan agréé Klimabonus avec un équipement labellisé.",
    );
  }
  if (input.totalCostEur > rates.capEur * 2.5) {
    tips.push(
      `Le projet est ambitieux : l'aide est plafonnée à ${formatEurSimple(rates.capEur)}, soit ${Math.round((rates.capEur / input.totalCostEur) * 100)} % du coût.`,
    );
  }
  if (input.incomeBracket === "standard") {
    tips.push(
      "Vérifier l'éligibilité au bonus revenus : seuils définis par règlement, parfois plus larges qu'attendu.",
    );
  }
  tips.push(
    "Dépôt de demande AVANT démarrage des travaux obligatoire. Vérifier les pièces justificatives sur klimabonus.lu.",
  );

  const eligibility: KlimabonusResult["eligibility"] =
    reasons.some((r) => r.type === "negative") ? "probable" : "eligible";

  return {
    eligibility,
    estimatedAidEur: [Math.round(lowAid), Math.round(highAid)],
    percentRange: [Math.round(lowPct * 100), Math.round(highPct * 100)],
    reasons,
    tips,
  };
}

function formatEurSimple(v: number): string {
  return `${v.toLocaleString("fr-FR")} €`;
}
