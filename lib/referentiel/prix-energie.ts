/**
 * RÉFÉRENTIEL — Prix de l'énergie au Luxembourg (source unique pour les calculs
 * d'économies / ROI). Consolidé depuis roi-simulator & savings-calculator pour
 * qu'il n'existe qu'UN seul endroit à mettre à jour.
 *
 * Charte Règle N°5 : tout moteur de calcul lit ces valeurs, jamais des constantes
 * en dur dispersées. MAJ annuelle.
 */
export const PRIX_ENERGIE = {
  /** €/kWh TTC */
  gaz: 0.11,
  fioul: 0.13,
  electricite: 0.22,
  /** Bois/pellets (~300 €/t, 4,8 kWh/kg) — moyenne bûches/granulés. */
  bois: 0.06,
  /** Coût actualisé de l'électricité photovoltaïque autoproduite. */
  pvAutoproduit: 0.07,
  lastUpdated: "2026-01-06",
  source: "Moyennes marché résidentiel Luxembourg 2026 — à réviser annuellement.",
} as const;

export type SourceChaleur = "gaz" | "fioul" | "electricite" | "bois";

/** Prix €/kWh d'une énergie de chauffage. */
export function prixEnergie(source: SourceChaleur): number {
  return PRIX_ENERGIE[source];
}
