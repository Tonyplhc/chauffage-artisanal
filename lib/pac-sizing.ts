/**
 * Calculateur de dimensionnement PAC (pompe à chaleur).
 *
 * Méthode simplifiée mais transparente :
 *
 *   Puissance requise (kW) = (Volume × G × ΔT) / 1000
 *
 * Où :
 *   - Volume = surface × hauteur sous plafond (par défaut 2.5 m)
 *   - G = coefficient de déperdition global du bâtiment (W/m³.K)
 *   - ΔT = température intérieure − température extérieure de base
 *
 * Coefficient G typique au Luxembourg (climat océanique tempéré) :
 *   - Construction neuve performante (RT2020 / passif) : 0.5 W/m³.K
 *   - Construction neuve standard : 0.8 W/m³.K
 *   - Rénovation isolation complète : 1.0 W/m³.K
 *   - Rénovation isolation partielle : 1.4 W/m³.K
 *   - Ancien non isolé : 2.0 W/m³.K
 *
 * ΔT de base au Luxembourg : 20°C intérieur − (-10°C extérieur base) = 30 K
 *
 * COP saisonnier (SCOP) estimé selon type PAC + climat :
 *   - PAC air/eau Lux : 3.2 – 3.8 typique
 *   - PAC géothermique Lux : 4.0 – 4.5 typique
 *   - PAC air/air : 3.0 – 3.5 typique
 *
 * Limites :
 *   - Pas de prise en compte des apports solaires, occupants, ECS
 *   - Pas de bilan thermique pièce par pièce (RT2012 simplifié)
 *   - Pour un calcul réglementaire, faire un audit thermique professionnel
 *
 * Cette estimation sert à débroussailler un projet, pas à dimensionner
 * une installation officielle.
 */

export type IsolationLevel =
  | "neuf-passif"
  | "neuf-standard"
  | "renov-complete"
  | "renov-partielle"
  | "ancien-non-isole";

export type PacType = "air-eau" | "geothermique" | "air-air";

export const ISOLATION_G: Record<IsolationLevel, number> = {
  "neuf-passif": 0.5,
  "neuf-standard": 0.8,
  "renov-complete": 1.0,
  "renov-partielle": 1.4,
  "ancien-non-isole": 2.0,
};

export const ISOLATION_LABELS: Record<IsolationLevel, string> = {
  "neuf-passif": "Neuf passif / RT2020",
  "neuf-standard": "Neuf standard",
  "renov-complete": "Rénovation isolation complète",
  "renov-partielle": "Rénovation isolation partielle",
  "ancien-non-isole": "Ancien non isolé",
};

export const PAC_SCOP: Record<PacType, { min: number; max: number; label: string }> = {
  "air-eau": { min: 3.2, max: 3.8, label: "PAC air/eau" },
  geothermique: { min: 4.0, max: 4.5, label: "PAC géothermique" },
  "air-air": { min: 3.0, max: 3.5, label: "PAC air/air" },
};

export type PacSizingInput = {
  surface: number; // m²
  ceilingHeight?: number; // m, défaut 2.5
  isolation: IsolationLevel;
  pacType: PacType;
  /** Température intérieure cible (°C), défaut 20. */
  targetTemp?: number;
  /** Température extérieure de base au Lux (°C), défaut -10. */
  outdoorBaseTemp?: number;
};

export type PacSizingResult = {
  /** Volume chauffé (m³). */
  volume: number;
  /** Coefficient G utilisé (W/m³.K). */
  gCoefficient: number;
  /** ΔT utilisé (K). */
  deltaT: number;
  /** Puissance thermique requise (kW). */
  requiredPowerKw: number;
  /** Puissance PAC recommandée avec marge 15% (kW). */
  recommendedPacKw: number;
  /** SCOP moyen attendu pour le type de PAC. */
  expectedScop: { min: number; max: number; mid: number };
  /** Consommation électrique annuelle estimée (kWh). */
  estimatedAnnualKwh: number;
  /** Hypothèse de besoins annuels (heures équivalentes pleine puissance). */
  annualOperatingHours: number;
  /** Avertissements et conseils. */
  notes: string[];
};

const DEFAULT_CEILING = 2.5;
const DEFAULT_TARGET = 20;
const DEFAULT_OUTDOOR = -10;
/** Heures équivalentes pleine puissance — Luxembourg climat tempéré.
 *  Source convention RT2012 simplifiée : ≈ 1700-2000 h/an pour chauffage. */
const ANNUAL_OPERATING_HOURS = 1800;

export function calculatePacSizing(input: PacSizingInput): PacSizingResult {
  const ceiling = input.ceilingHeight ?? DEFAULT_CEILING;
  const target = input.targetTemp ?? DEFAULT_TARGET;
  const outdoor = input.outdoorBaseTemp ?? DEFAULT_OUTDOOR;

  const volume = input.surface * ceiling;
  const g = ISOLATION_G[input.isolation];
  const deltaT = target - outdoor;
  const requiredPowerW = volume * g * deltaT;
  const requiredPowerKw = requiredPowerW / 1000;
  const recommendedPacKw = requiredPowerKw * 1.15; // marge 15%

  const scop = PAC_SCOP[input.pacType];
  const mid = (scop.min + scop.max) / 2;
  const annualKwhThermal = requiredPowerKw * ANNUAL_OPERATING_HOURS;
  const annualKwhElectric = Math.round(annualKwhThermal / mid);

  const notes: string[] = [];
  if (input.surface < 40) {
    notes.push(
      "Surface très faible : envisager un système alternatif (radiateurs électriques performants, mini PAC réversible).",
    );
  }
  if (input.surface > 400) {
    notes.push(
      "Grande surface : penser à un découpage par zones (rez/étage) pour optimiser la régulation.",
    );
  }
  if (input.isolation === "ancien-non-isole") {
    notes.push(
      "Bâtiment non isolé : l'investissement isolation peut diviser la puissance requise par 2 ou 3. À chiffrer en parallèle.",
    );
  }
  if (input.pacType === "geothermique" && input.surface < 80) {
    notes.push(
      "Géothermie peu rentable sur petite surface vs coût des forages. Préférer air/eau sauf cas particulier.",
    );
  }
  if (input.pacType === "air-air" && requiredPowerKw > 8) {
    notes.push(
      "Au-delà de ~8 kW, la PAC air/air devient mal adaptée. Envisager air/eau couplée plancher chauffant.",
    );
  }
  if (deltaT > 35) {
    notes.push(
      `ΔT ${deltaT} K supérieur à la base Lux (30 K). Le dimensionnement intègre une marge de sécurité.`,
    );
  }

  return {
    volume: Math.round(volume),
    gCoefficient: g,
    deltaT,
    requiredPowerKw: Math.round(requiredPowerKw * 10) / 10,
    recommendedPacKw: Math.round(recommendedPacKw * 10) / 10,
    expectedScop: { min: scop.min, max: scop.max, mid },
    estimatedAnnualKwh: annualKwhElectric,
    annualOperatingHours: ANNUAL_OPERATING_HOURS,
    notes,
  };
}
