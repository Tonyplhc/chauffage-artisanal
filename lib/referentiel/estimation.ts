/**
 * MOTEUR D'ESTIMATION DÉTERMINISTE — calcule le projet PAC à partir des réponses.
 *
 * Charte Règle N°4 : c'est CE moteur (pas l'UI, pas l'IA) qui produit tous les
 * chiffres. Constantes cohérentes avec roi-simulator / savings-calculator, prix
 * énergie depuis lib/referentiel/prix-energie, aides depuis computeAides.
 */
import { computeAides, type AidesResult } from "./aides";
import { PRIX_ENERGIE } from "./prix-energie";

export type ChauffageActuel = "Mazout" | "Gaz" | "Électrique" | "Bois" | "Autre";
export type Logement = "maison" | "appartement";

export interface EstimationInput {
  commune: string;
  logement: Logement;
  chauffage: ChauffageActuel;
  /** Facture de chauffage annuelle actuelle (€). */
  factureAnnuelle: number;
}

export interface EstimationResult {
  equipement: string;
  coutActuel: number; // €/an
  coutApres: number; // €/an (neutre)
  economieAnnuelle: number; // €/an (gain)
  gain10ans: number; // € (gain, conservateur)
  budget: number; // € (estimatif)
  resteACharge: number; // €
  roiAnnees: number | null;
  aides: AidesResult;
  puissanceKw: number;
}

// Prix €/kWh de l'énergie actuelle (Autre traité comme fioul, conservateur).
export const PRIX_CHAUFFAGE: Record<ChauffageActuel, number> = {
  Mazout: PRIX_ENERGIE.fioul,
  Gaz: PRIX_ENERGIE.gaz,
  "Électrique": PRIX_ENERGIE.electricite,
  Bois: PRIX_ENERGIE.bois,
  Autre: PRIX_ENERGIE.fioul,
};
const PRIX = PRIX_CHAUFFAGE;
// Rendement de l'installation actuelle.
export const RENDEMENT_CHAUFFAGE: Record<ChauffageActuel, number> = {
  Mazout: 0.88,
  Gaz: 0.92,
  "Électrique": 1.0,
  Bois: 0.75, // poêle/chaudière bûches-pellets, moyenne parc
  Autre: 0.9,
};
const RENDEMENT = RENDEMENT_CHAUFFAGE;
/** SCOP de référence PAC air/eau, climat LU — consommé par tous les simulateurs. */
export const SCOP_PAC_AIR_EAU = 3.5;
const SCOP = SCOP_PAC_AIR_EAU;
const HEURES = 1800; // heures équivalent pleine charge / an
const MARGE = 1.15;

/**
 * Besoin de chaleur annuel (kWh utiles) déduit de la facture actuelle.
 * Brique réutilisée par tous les simulateurs (Règle N°5) : le client entre
 * sa facture (qu'il connaît), jamais des kWh.
 */
export function besoinChaleurKwh(chauffage: ChauffageActuel, factureAnnuelle: number): number {
  return (factureAnnuelle / PRIX[chauffage]) * RENDEMENT[chauffage];
}

/** Dimensionnement PAC + budget installation réaliste à partir du besoin. */
export function dimensionnerPac(besoinKwh: number): { puissanceKw: number; budget: number } {
  const puissanceKw = Math.round(((besoinKwh / HEURES) * MARGE) * 10) / 10;
  const budget = Math.round(Math.min(26000, Math.max(13000, 13000 + puissanceKw * 700)));
  return { puissanceKw, budget };
}

export function estimerProjet(input: EstimationInput): EstimationResult {
  const { commune, logement, chauffage, factureAnnuelle: facture } = input;
  const fossile = chauffage === "Mazout" || chauffage === "Gaz";

  // 1) Besoin de chaleur (kWh utile) déduit de la facture actuelle.
  const besoinKwh = besoinChaleurKwh(chauffage, facture);
  // 2) Coût après PAC : électricité consommée = besoin / SCOP.
  const coutApres = Math.round((besoinKwh / SCOP) * PRIX_ENERGIE.electricite);
  const economieAnnuelle = Math.max(0, Math.round(facture - coutApres));
  // 3) Dimensionnement → budget installation réaliste.
  const { puissanceKw, budget } = dimensionnerPac(besoinKwh);
  // 4) Aides (moteur déterministe, forfaits Klimabonus 2026 vérifiés).
  const aides = computeAides({
    equipement: "pac-air-eau",
    logement: logement === "maison" ? "unifamilial" : "collectif",
    remplacementFossile: fossile,
    commune,
  });
  // 5) Reste à charge, gain 10 ans, ROI.
  const resteACharge = Math.max(0, budget - aides.klimabonus);
  const gain10ans = economieAnnuelle * 10;
  const roiAnnees =
    economieAnnuelle > 0 ? Math.round((resteACharge / economieAnnuelle) * 10) / 10 : null;

  return {
    equipement: "Pompe à chaleur air/eau",
    coutActuel: facture,
    coutApres,
    economieAnnuelle,
    gain10ans,
    budget,
    resteACharge,
    roiAnnees,
    aides,
    puissanceKw,
  };
}

/** Liste des communes du Luxembourg (référentiel local). */
export const COMMUNES_LU: string[] = [
  "Luxembourg", "Beaufort", "Bech", "Beckerich", "Berdorf", "Bertrange", "Bettembourg",
  "Bettendorf", "Betzdorf", "Bissen", "Biwer", "Boulaide", "Bourscheid", "Bous-Waldbredimus",
  "Clervaux", "Colmar-Berg", "Consdorf", "Contern", "Dalheim", "Diekirch", "Differdange",
  "Dippach", "Dudelange", "Echternach", "Ell", "Erpeldange-sur-Sûre", "Esch-sur-Alzette",
  "Esch-sur-Sûre", "Ettelbruck", "Feulen", "Fischbach", "Flaxweiler", "Frisange", "Garnich",
  "Goesdorf", "Grevenmacher", "Grosbous", "Heffingen", "Helperknapp", "Hesperange", "Junglinster",
  "Käerjeng", "Kayl", "Kehlen", "Kiischpelt", "Koerich", "Kopstal", "Larochette", "Lenningen",
  "Leudelange", "Lintgen", "Lorentzweiler", "Mamer", "Manternach", "Mersch", "Mertert", "Mertzig",
  "Mondercange", "Mondorf-les-Bains", "Niederanven", "Nommern", "Parc Hosingen", "Pétange",
  "Préizerdaul", "Putscheid", "Rambrouch", "Reckange-sur-Mess", "Redange-sur-Attert", "Reisdorf",
  "Remich", "Roeser", "Rosport-Mompach", "Rumelange", "Saeul", "Sandweiler", "Sanem", "Schengen",
  "Schieren", "Schifflange", "Schuttrange", "Stadtbredimus", "Steinfort", "Steinsel", "Strassen",
  "Tandel", "Troisvierges", "Useldange", "Vallée de l'Ernz", "Vianden", "Vichten", "Wahl",
  "Waldbillig", "Walferdange", "Weiler-la-Tour", "Weiswampach", "Wiltz", "Wincrange", "Winseler",
  "Wormeldange", "Autre",
];
