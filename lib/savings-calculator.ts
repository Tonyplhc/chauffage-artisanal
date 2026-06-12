/**
 * Calculateur économies grand-public — version unifiée.
 *
 * Inputs minimum (4 champs) :
 *   - typologie logement (maison / appartement)
 *   - énergie actuelle (gaz, fioul, électrique)
 *   - surface chauffée m²
 *   - occupants (pour ECS)
 *
 * Outputs : 3 scénarios indépendants, calculés en parallèle :
 *   1. PAC air/eau (remplacement du chauffage actuel)
 *   2. Chauffe-eau thermodynamique (remplacement chauffe-eau existant)
 *   3. Panneaux PV autoconsommation (réduction facture élec)
 *
 * Chaque scénario retourne :
 *   - économie annuelle €
 *   - CO2 évité (kg/an)
 *   - coût investissement initial €
 *   - aide Klimabonus indicative €
 *   - ROI en années (investissement net / économie annuelle)
 *
 * Hypothèses 2026 Luxembourg — prudentes et documentées.
 * AUCUNE garantie — c'est un ordre de grandeur pour orienter la réflexion.
 */
import { PRIX_ENERGIE } from "./referentiel/prix-energie";
import { SCOP_PAC_AIR_EAU, RENDEMENT_CHAUFFAGE } from "./referentiel/estimation";
import { computeAides } from "./referentiel/aides";

export type SavingsInput = {
  buildingType: "maison" | "appartement";
  currentEnergy: "gaz" | "fioul" | "electrique" | "bois";
  surfaceM2: number;
  occupants: number;
};

export type ScenarioResult = {
  id: "pac" | "ecs-thermo" | "pv";
  label: string;
  shortLabel: string;
  description: string;
  annualSavings: number; // € économisés / an
  co2Saved: number; // kg CO2 évités / an
  investment: number; // € coût installation indicatif
  klimabonus: number; // € aide indicative
  netInvestment: number; // investment - klimabonus
  paybackYears: number; // ROI années (ou Infinity)
  applicable: boolean; // false si non pertinent (ex: PAC pour appartement)
  notes: string[]; // hypothèses / nuances
};

export type SavingsResult = {
  scenarios: ScenarioResult[];
  combinedAnnualSavings: number; // somme des économies des scénarios applicables
  combinedCo2: number;
  combinedNetInvestment: number;
};

/* Hypothèses par défaut — prix lus depuis lib/referentiel (Règle N°5 :
   mêmes chiffres que l'estimateur et tous les simulateurs). */
const PRICE_KWH_GAS_TTC = PRIX_ENERGIE.gaz;
const PRICE_KWH_FUEL_TTC = PRIX_ENERGIE.fioul;
const PRICE_KWH_ELEC_TTC = PRIX_ENERGIE.electricite;
const PRICE_KWH_PV_PRODUCED = PRIX_ENERGIE.pvAutoproduit;

/** Besoins thermiques par m² selon typologie — moyennes prudentes LU 2026. */
const HEAT_NEEDS_KWH_M2 = {
  maison: 110, // habitat individuel mixte rénové / non rénové
  appartement: 80, // mieux isolé en moyenne (collectif)
};

/** Rendement chaudière / efficacité PAC — alignés sur le référentiel. */
const GAS_BOILER_EFFICIENCY = RENDEMENT_CHAUFFAGE.Gaz; // condensation standard
const FUEL_BOILER_EFFICIENCY = RENDEMENT_CHAUFFAGE.Mazout;
const ELEC_DIRECT_EFFICIENCY = RENDEMENT_CHAUFFAGE["Électrique"]; // chauffage électrique direct
const WOOD_BOILER_EFFICIENCY = RENDEMENT_CHAUFFAGE.Bois; // bûches/pellets, moyenne parc
const PAC_SCOP = SCOP_PAC_AIR_EAU; // saisonnier prudent LU (référentiel)

/** Facteurs CO2 par kWh consommé (kg CO2 / kWh). */
const CO2_GAS = 0.205;
const CO2_FUEL = 0.27;
const CO2_ELEC_LU = 0.045; // mix LU bas-carbone (beaucoup d'import hydro/éol)
const CO2_WOOD = 0.03; // biomasse quasi neutre (cycle court)

/** ECS — production annuelle / occupant (kWh thermique). */
const ECS_KWH_PER_OCCUPANT_YEAR = 800;

/** Chauffe-eau classique vs thermodynamique. */
const ECS_ELEC_DIRECT_KWH_PER_KWH = 1.0;
const ECS_THERMO_COP = 3.0;

/** Production PV par kWc/an au LU (prudent : 950 kWh/kWc/an). */
const PV_KWH_PER_KWC_YEAR = 950;

/**
 * Coûts indicatifs équipement (TTC posé). Les valeurs scalent désormais
 * avec les inputs réels — pas de prix fixe quel que soit le projet.
 *
 * PAC air/eau : coût ≈ base + €/m² (puissance proportionnelle à la surface)
 *   - Petite (<120m²) : ~12 000 €
 *   - Moyenne (140-180m²) : ~16-20 000 €
 *   - Grande (>250m²) : ~24-28 000 €
 */
function pacCost(surfaceM2: number): number {
  const base = 8000;
  const perM2 = 70; // €/m²
  return Math.round(base + surfaceM2 * perM2);
}

/**
 * Chauffe-eau thermodynamique : prix lié à la capacité (litres),
 * elle-même liée au nombre d'occupants (≈ 50-60 L par personne).
 *
 *   1-2 personnes : 150 L → ~2 600 €
 *   3-4 personnes : 250 L → ~3 500 €
 *   5-6 personnes : 300 L → ~4 200 €
 *   7-8 personnes : 400 L → ~5 200 €
 */
function ecsThermoCost(occupants: number): number {
  if (occupants <= 2) return 2600;
  if (occupants <= 4) return 3500;
  if (occupants <= 6) return 4200;
  return 5200;
}

/**
 * Dimensionnement PV par défaut : taille la centrale pour couvrir une bonne
 * part des besoins du foyer. Foyer plus grand = plus de conso → plus de kWc.
 *
 *   Maison 1-2 pers : 3 kWc
 *   Maison 3-4 pers : 5 kWc
 *   Maison 5-6 pers : 7 kWc
 *   Maison 7-8 pers : 9 kWc
 *   Appartement : 0 kWc (PV en copro pas un cas individuel)
 */
function pvDefaultKwc(
  buildingType: SavingsInput["buildingType"],
  occupants: number,
): number {
  if (buildingType === "appartement") return 0;
  if (occupants <= 2) return 3;
  if (occupants <= 4) return 5;
  if (occupants <= 6) return 7;
  return 9;
}

const PV_COST_PER_KWC = 1700; // €/kWc posé TTC LU 2026 indicatif

/**
 * Aide Klimabonus indicative.
 *
 * PAC : forfaits 2026 VÉRIFIÉS, lus depuis le moteur d'aides du référentiel
 * (indépendants de la puissance — réforme 2026). Le scénario PAC de cet outil
 * ne s'applique qu'en maison (unifamilial) ; le forfait dépend de l'énergie
 * remplacée (fossile ou non).
 * Chauffe-eau thermo / PV : ordres de grandeur locaux (pas encore au référentiel) :
 *   - Chauffe-eau thermo : ~17 % du coût, plafonné à 1 000 €
 *   - PV : ~500 €/kWc plafonné à 6 000 €
 */
function pacKlimabonus(currentEnergy: SavingsInput["currentEnergy"]): number {
  return computeAides({
    equipement: "pac-air-eau",
    logement: "unifamilial",
    remplacementFossile: currentEnergy === "gaz" || currentEnergy === "fioul",
  }).klimabonus;
}
function ecsThermoKlimabonus(investment: number): number {
  return Math.min(1000, Math.round(investment * 0.17));
}
function pvKlimabonus(kwc: number): number {
  return Math.min(6000, kwc * 500);
}

/* ──────────────────────── COEUR DE CALCUL ──────────────────────── */

export function calculateSavings(input: SavingsInput): SavingsResult {
  const { buildingType, currentEnergy, surfaceM2, occupants } = input;

  // 1. Besoins thermiques annuels chauffage (kWh)
  const heatNeedsKwh = HEAT_NEEDS_KWH_M2[buildingType] * surfaceM2;

  // 2. Scénario PAC air/eau (invest. scale avec la surface)
  const pac = computePacScenario(heatNeedsKwh, currentEnergy, buildingType, surfaceM2);

  // 3. Scénario chauffe-eau thermodynamique (invest. scale avec occupants)
  const ecsThermo = computeEcsThermoScenario(occupants);

  // 4. Scénario PV autoconsommation (invest. scale avec besoins du foyer)
  const pv = computePvScenario(buildingType, occupants);

  const scenarios = [pac, ecsThermo, pv];
  const applicable = scenarios.filter((s) => s.applicable);

  return {
    scenarios,
    combinedAnnualSavings: applicable.reduce((sum, s) => sum + s.annualSavings, 0),
    combinedCo2: applicable.reduce((sum, s) => sum + s.co2Saved, 0),
    combinedNetInvestment: applicable.reduce((sum, s) => sum + s.netInvestment, 0),
  };
}

function computePacScenario(
  heatNeedsKwh: number,
  currentEnergy: SavingsInput["currentEnergy"],
  buildingType: SavingsInput["buildingType"],
  surfaceM2: number,
): ScenarioResult {
  // En appartement : PAC rarement pertinente (collectif, copro) → on désactive.
  const applicable = buildingType === "maison";

  // Coût actuel du chauffage selon énergie
  let currentAnnualCost = 0;
  let currentCo2 = 0;
  let currentLabel = "";
  switch (currentEnergy) {
    case "gaz":
      currentAnnualCost = (heatNeedsKwh / GAS_BOILER_EFFICIENCY) * PRICE_KWH_GAS_TTC;
      currentCo2 = (heatNeedsKwh / GAS_BOILER_EFFICIENCY) * CO2_GAS;
      currentLabel = "chaudière gaz";
      break;
    case "fioul":
      currentAnnualCost = (heatNeedsKwh / FUEL_BOILER_EFFICIENCY) * PRICE_KWH_FUEL_TTC;
      currentCo2 = (heatNeedsKwh / FUEL_BOILER_EFFICIENCY) * CO2_FUEL;
      currentLabel = "chaudière fioul";
      break;
    case "electrique":
      currentAnnualCost = (heatNeedsKwh / ELEC_DIRECT_EFFICIENCY) * PRICE_KWH_ELEC_TTC;
      currentCo2 = (heatNeedsKwh / ELEC_DIRECT_EFFICIENCY) * CO2_ELEC_LU;
      currentLabel = "chauffage électrique direct";
      break;
    case "bois":
      currentAnnualCost = (heatNeedsKwh / WOOD_BOILER_EFFICIENCY) * PRIX_ENERGIE.bois;
      currentCo2 = (heatNeedsKwh / WOOD_BOILER_EFFICIENCY) * CO2_WOOD;
      currentLabel = "chaudière bois/pellets";
      break;
  }

  // Coût avec PAC
  const pacAnnualCost = (heatNeedsKwh / PAC_SCOP) * PRICE_KWH_ELEC_TTC;
  const pacCo2 = (heatNeedsKwh / PAC_SCOP) * CO2_ELEC_LU;

  const annualSavings = Math.max(0, currentAnnualCost - pacAnnualCost);
  const co2Saved = Math.max(0, currentCo2 - pacCo2);

  // Coût installation indexé sur la surface réelle du logement
  const investment = applicable ? pacCost(surfaceM2) : 0;
  const klimabonus = applicable ? pacKlimabonus(currentEnergy) : 0;
  const netInvestment = Math.max(0, investment - klimabonus);
  const paybackYears = annualSavings > 0 ? netInvestment / annualSavings : Infinity;

  return {
    id: "pac",
    label: "Pompe à chaleur air/eau",
    shortLabel: "PAC air/eau",
    description: `Remplace votre ${currentLabel}. SCOP ${PAC_SCOP}, R32 ou R290, fonctionne jusqu'à -20°C.`,
    annualSavings: Math.round(annualSavings),
    co2Saved: Math.round(co2Saved),
    investment,
    klimabonus,
    netInvestment: Math.round(netInvestment),
    paybackYears: Math.round(paybackYears * 10) / 10,
    applicable,
    notes: [
      `Besoins chauffage estimés : ${Math.round(heatNeedsKwh).toLocaleString("fr-LU")} kWh/an (surface ${surfaceM2} m²)`,
      `Hypothèse SCOP saisonnier : ${PAC_SCOP}`,
      `Coût indicatif : base 8 000 € + 70 €/m² → ${investment.toLocaleString("fr-LU")} €`,
      `Klimabonus 2026 (forfait officiel, maison) : ${klimabonus.toLocaleString("fr-LU")} €`,
      applicable
        ? "Adaptée maison individuelle, sous réserve d'isolation correcte."
        : "En appartement, la PAC dépend de la copropriété — pas d'estimation individuelle.",
    ],
  };
}

function computeEcsThermoScenario(occupants: number): ScenarioResult {
  // Besoins ECS scalent avec les occupants
  const ecsKwhYear = ECS_KWH_PER_OCCUPANT_YEAR * Math.max(1, occupants);

  // Hypothèse : chauffe-eau actuel = électrique direct (cas le plus défavorable
  // et le plus courant en remplacement). C'est le scénario où le gain est le
  // plus visible. Les utilisateurs au gaz s'écarteront du calcul intuitivement.
  const currentCost = ecsKwhYear * ECS_ELEC_DIRECT_KWH_PER_KWH * PRICE_KWH_ELEC_TTC;
  const currentCo2 = ecsKwhYear * ECS_ELEC_DIRECT_KWH_PER_KWH * CO2_ELEC_LU;

  const thermoCost = (ecsKwhYear / ECS_THERMO_COP) * PRICE_KWH_ELEC_TTC;
  const thermoCo2 = (ecsKwhYear / ECS_THERMO_COP) * CO2_ELEC_LU;

  const annualSavings = currentCost - thermoCost;
  const co2Saved = currentCo2 - thermoCo2;

  // Capacité ballon (et donc prix) liée au foyer
  const investment = ecsThermoCost(occupants);
  const klimabonus = ecsThermoKlimabonus(investment);
  const netInvestment = Math.max(0, investment - klimabonus);
  const paybackYears = annualSavings > 0 ? netInvestment / annualSavings : Infinity;

  // Capacité indicative (en L) pour affichage
  const capacityL =
    occupants <= 2 ? 150 : occupants <= 4 ? 250 : occupants <= 6 ? 300 : 400;

  return {
    id: "ecs-thermo",
    label: "Chauffe-eau thermodynamique",
    shortLabel: "Chauffe-eau thermo",
    description: `Ballon ${capacityL} L pour ${occupants} personne${occupants > 1 ? "s" : ""}. COP ${ECS_THERMO_COP}, remplace un chauffe-eau électrique.`,
    annualSavings: Math.round(annualSavings),
    co2Saved: Math.round(co2Saved),
    investment,
    klimabonus,
    netInvestment: Math.round(netInvestment),
    paybackYears: Math.round(paybackYears * 10) / 10,
    applicable: true,
    notes: [
      `Besoins ECS : ${Math.round(ecsKwhYear).toLocaleString("fr-LU")} kWh/an (${occupants} occupant${occupants > 1 ? "s" : ""})`,
      `Ballon dimensionné ${capacityL} L (~${Math.round(capacityL / occupants)} L/personne)`,
      `Coût indicatif posé : ${investment.toLocaleString("fr-LU")} € (varie selon capacité)`,
      `Klimabonus indicatif (~17 %, plafond 1 000 €) : ${klimabonus.toLocaleString("fr-LU")} €`,
      "Comparaison vs chauffe-eau électrique direct (cas le plus courant).",
    ],
  };
}

function computePvScenario(
  buildingType: SavingsInput["buildingType"],
  occupants: number,
): ScenarioResult {
  // Dimensionnement PV proportionnel au foyer (plus de monde = plus de conso)
  const kwc = pvDefaultKwc(buildingType, occupants);
  const applicable = kwc > 0;

  const annualProduction = kwc * PV_KWH_PER_KWC_YEAR;
  // Hypothèse autoconsommation 40 % (sans batterie) — prudente
  const selfConsumptionRate = 0.4;
  const selfConsumedKwh = annualProduction * selfConsumptionRate;
  const annualSavings = selfConsumedKwh * (PRICE_KWH_ELEC_TTC - PRICE_KWH_PV_PRODUCED);
  const co2Saved = selfConsumedKwh * CO2_ELEC_LU;

  const investment = kwc * PV_COST_PER_KWC;
  const klimabonus = pvKlimabonus(kwc);
  const netInvestment = Math.max(0, investment - klimabonus);
  const paybackYears = annualSavings > 0 ? netInvestment / annualSavings : Infinity;

  return {
    id: "pv",
    label: "Photovoltaïque autoconsommation",
    shortLabel: "PV autoconso",
    description: applicable
      ? `${kwc} kWc en toiture (dimensionné pour ${occupants} occupant${occupants > 1 ? "s" : ""}). Autoconsommation 40 % sans batterie.`
      : "PV en appartement nécessite l'accord copropriété — pas d'estimation individuelle.",
    annualSavings: Math.round(annualSavings),
    co2Saved: Math.round(co2Saved),
    investment,
    klimabonus,
    netInvestment: Math.round(netInvestment),
    paybackYears: Math.round(paybackYears * 10) / 10,
    applicable,
    notes: [
      applicable
        ? `${kwc} kWc → ${Math.round(annualProduction).toLocaleString("fr-LU")} kWh produits/an (950 kWh/kWc/an au LU)`
        : "PV en appartement dépend de la copropriété — pas un cas individuel.",
      `Coût indicatif posé : ${kwc} × 1 700 €/kWc = ${investment.toLocaleString("fr-LU")} €`,
      `Klimabonus indicatif (~500 €/kWc, plafond 6 000 €) : ${klimabonus.toLocaleString("fr-LU")} €`,
      "Hypothèse autoconsommation 40 % (sans batterie).",
      "Surplus revendu non comptabilisé (variable selon tarif d'injection).",
    ],
  };
}
