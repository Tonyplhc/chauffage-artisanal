/**
 * MOTEUR D'AIDES DÉTERMINISTE — source unique des montants d'aides utilisés par
 * l'estimateur, l'assistant IA et les simulateurs.
 *
 * Charte Règle N°4 : l'IA n'invente jamais un chiffre — elle appelle ce moteur.
 * Charte Règle N°5 : forfaits numériques alignés sur lib/klimabonus-2026.ts
 * (affichage humain + sources officielles guichet.public.lu, 06.01.2026, vérifié).
 */
import { aideCommunaleEstimee, type AideCommunale } from "./aides-communales";

export type EquipementAide =
  | "pac-air-eau"
  | "pac-geothermique"
  | "biomasse"
  | "solaire-thermique";

export type TypeLogement = "unifamilial" | "collectif";

export interface ContexteProjet {
  equipement: EquipementAide;
  logement?: TypeLogement;
  /** Construction neuve (sinon : logement existant). */
  neuf?: boolean;
  /** Le projet remplace une chaudière fossile (mazout/gaz). */
  remplacementFossile?: boolean;
  /** Année de construction du logement (pour la TVA 3 % > 10 ans). */
  anneeConstruction?: number;
  /** Commune (pour l'aide communale Klimapakt). */
  commune?: string;
}

type Bareme = { existantRemplace: number; existantSans: number; neuf: number };

/**
 * Forfaits Klimabonus 2026 (€) — VÉRIFIÉS sur guichet.public.lu.
 * Différenciés logement unifamilial (maison) / collectif (appartement).
 * Forfaits indépendants de la puissance (réforme 2026).
 */
const FORFAITS: Record<EquipementAide, { label: string; unifamilial: Bareme; collectif: Bareme }> = {
  "pac-air-eau": {
    label: "Pompe à chaleur air/eau",
    unifamilial: { existantRemplace: 10000, existantSans: 6000, neuf: 3000 },
    collectif: { existantRemplace: 8000, existantSans: 3000, neuf: 2000 },
  },
  "pac-geothermique": {
    label: "Pompe à chaleur géothermique",
    unifamilial: { existantRemplace: 12000, existantSans: 8000, neuf: 0 },
    collectif: { existantRemplace: 10000, existantSans: 5000, neuf: 0 },
  },
  biomasse: {
    label: "Chaudière biomasse",
    unifamilial: { existantRemplace: 8000, existantSans: 4000, neuf: 0 },
    collectif: { existantRemplace: 6000, existantSans: 3000, neuf: 0 },
  },
  "solaire-thermique": {
    label: "Solaire thermique (ECS + chauffage)",
    unifamilial: { existantRemplace: 4000, existantSans: 4000, neuf: 0 },
    collectif: { existantRemplace: 3500, existantSans: 3500, neuf: 0 },
  },
};

/** Année de référence du régime Klimabonus 2026 (TVA logement : > 10 ans). */
const ANNEE_REF = 2026;

export interface AidesResult {
  equipementLabel: string;
  klimabonus: number;
  klimabonusContexte: string;
  communal: AideCommunale;
  tva: { taux: 3; eligible: boolean | null; note: string };
  enoprimes: { cumulable: true; note: string };
  total: { min: number; max: number };
  conditions: string[];
  source: string;
  confiance: number;
}

const SOURCE =
  "https://guichet.public.lu/fr/citoyens/aides/logement-construction/klimabonus-2026/";

const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));

/**
 * Calcule les aides estimées pour un projet. Déterministe et pur.
 */
export function computeAides(ctx: ContexteProjet): AidesResult {
  const equip = FORFAITS[ctx.equipement];
  const b = ctx.logement === "collectif" ? equip.collectif : equip.unifamilial;

  let klimabonus: number;
  let klimabonusContexte: string;
  if (ctx.neuf) {
    klimabonus = b.neuf;
    klimabonusContexte = "Construction neuve";
  } else if (ctx.remplacementFossile ?? true) {
    klimabonus = b.existantRemplace;
    klimabonusContexte = "Logement existant — remplacement d'une chaudière fossile";
  } else {
    klimabonus = b.existantSans;
    klimabonusContexte = "Logement existant — sans remplacement d'énergie fossile";
  }

  const communal = aideCommunaleEstimee(ctx.commune, klimabonus);

  const tvaEligible =
    ctx.anneeConstruction != null ? ctx.anneeConstruction <= ANNEE_REF - 10 : null;
  const tva = {
    taux: 3 as const,
    eligible: tvaEligible,
    note:
      tvaEligible === null
        ? "TVA logement à 3 % sous condition d'ancienneté (> 10 ans)."
        : tvaEligible
          ? "Logement > 10 ans : TVA logement à 3 % applicable."
          : "Logement < 10 ans : TVA 3 % non applicable (sauf cas particuliers).",
  };

  const conditions = [
    "Accord de principe à demander AVANT signature du devis (MyGuichet.lu) — aucune aide rétroactive.",
    "Installateur agréé Klima-Agence requis.",
    "Système basse température (départ ≤ 35 °C).",
    "Forfaits 2026 indépendants de la puissance.",
  ];
  if (communal.aConfirmer) {
    conditions.push("Aide communale à confirmer selon le règlement de votre commune.");
  }

  let confiance = 0.7;
  if (!ctx.neuf && ctx.remplacementFossile === undefined) confiance -= 0.1;
  if (communal.aConfirmer) confiance -= 0.08;
  if (ctx.anneeConstruction == null) confiance -= 0.05;
  confiance = clamp(confiance, 0.5, 0.92);

  return {
    equipementLabel: equip.label,
    klimabonus,
    klimabonusContexte,
    communal,
    tva,
    enoprimes: {
      cumulable: true,
      note: "Cumulable avec les Enoprimes (CEE Enovos/Creos/SudEnergie).",
    },
    total: { min: klimabonus + communal.min, max: klimabonus + communal.max },
    conditions,
    source: SOURCE,
    confiance,
  };
}
