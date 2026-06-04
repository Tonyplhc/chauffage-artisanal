/**
 * Estimateur de prix instantané — fourchette directe depuis 4 inputs.
 *
 * Objectif : donner une réponse en 30 secondes, pas un devis. Permet à
 * l'utilisateur de savoir s'il est dans le bon ordre de grandeur AVANT
 * de remplir le formulaire long. Convertit "combien ça coûte ?" en
 * "ok j'ai une idée, je demande un devis pour préciser".
 *
 * Outputs : min/max + 3 lignes de décomposition (équipement, pose,
 * accessoires) + Klimabonus indicatif.
 *
 * Hypothèses 2026 Luxembourg prudentes, fourchettes larges assumées.
 */

export type ProjectType =
  | "chaudiere-gaz"
  | "pac-air-eau"
  | "pac-geothermie"
  | "chauffe-eau-thermo"
  | "salle-de-bain"
  | "climatisation-mono"
  | "ventilation-double-flux";

export type BuildingType = "maison" | "appartement" | "tertiaire";

export type Complexity =
  | "remplacement" // équipement remplacé à l'identique, raccords OK
  | "neuf" // installation neuve dans bâtiment neuf
  | "renovation"; // rénovation lourde (modif circuits, etc.)

export type EstimateInput = {
  projectType: ProjectType;
  buildingType: BuildingType;
  surfaceM2: number; // utile pour PAC, ventilation, clim
  complexity: Complexity;
};

export type EstimateResult = {
  projectLabel: string;
  min: number;
  max: number;
  breakdown: { label: string; min: number; max: number }[];
  klimabonusMin: number;
  klimabonusMax: number;
  netMin: number;
  netMax: number;
  notes: string[];
};

/* ──────────────────────── BAREMES ──────────────────────── */

const PROJECT_LABELS: Record<ProjectType, string> = {
  "chaudiere-gaz": "Chaudière gaz à condensation",
  "pac-air-eau": "Pompe à chaleur air/eau",
  "pac-geothermie": "Pompe à chaleur géothermique",
  "chauffe-eau-thermo": "Chauffe-eau thermodynamique",
  "salle-de-bain": "Rénovation salle de bain",
  "climatisation-mono": "Climatisation mono-split",
  "ventilation-double-flux": "VMC double flux",
};

/**
 * Coûts indicatifs par type de projet — base maison résidentielle.
 * Adaptation selon surface et complexité ensuite.
 */
const BASE_RANGES: Record<ProjectType, { min: number; max: number }> = {
  "chaudiere-gaz": { min: 4500, max: 9500 },
  "pac-air-eau": { min: 12000, max: 24000 },
  "pac-geothermie": { min: 24000, max: 42000 },
  "chauffe-eau-thermo": { min: 2800, max: 4800 },
  "salle-de-bain": { min: 12000, max: 30000 },
  "climatisation-mono": { min: 2200, max: 4500 },
  "ventilation-double-flux": { min: 6000, max: 12000 },
};

/** Multiplicateur selon le type de bâtiment. */
const BUILDING_MULT: Record<BuildingType, number> = {
  maison: 1.0,
  appartement: 0.85, // installation plus simple en général, moins de surface
  tertiaire: 1.6, // équipements plus puissants, normes accrues
};

/** Multiplicateur selon complexité. */
const COMPLEXITY_MULT: Record<Complexity, { min: number; max: number; label: string }> = {
  remplacement: { min: 0.85, max: 1.0, label: "Remplacement à l'identique" },
  neuf: { min: 1.0, max: 1.15, label: "Installation neuve" },
  renovation: { min: 1.1, max: 1.35, label: "Rénovation (modification circuits)" },
};

/**
 * Surface : pour les projets sensibles à la surface (PAC, clim, VMC),
 * on indexe légèrement le coût sur la surface. Sinon pas d'effet.
 */
function surfaceMult(projectType: ProjectType, surfaceM2: number): number {
  const surfaceSensitive: ProjectType[] = [
    "pac-air-eau",
    "pac-geothermie",
    "climatisation-mono",
    "ventilation-double-flux",
  ];
  if (!surfaceSensitive.includes(projectType)) return 1.0;
  // Calibré pour 140m² = 1.0, 200m² = ~1.2, 80m² = ~0.85, 300m² = ~1.5
  return Math.max(0.7, Math.min(1.7, 0.5 + surfaceM2 / 280));
}

/**
 * Klimabonus indicatif par type de projet. Plafonds 2026 prudents.
 */
const KLIMABONUS: Record<ProjectType, { min: number; max: number }> = {
  "chaudiere-gaz": { min: 0, max: 0 }, // gaz fossile = pas d'aide
  "pac-air-eau": { min: 5000, max: 12000 },
  "pac-geothermie": { min: 8000, max: 16000 },
  "chauffe-eau-thermo": { min: 400, max: 1000 },
  "salle-de-bain": { min: 0, max: 0 }, // pas d'aide directe
  "climatisation-mono": { min: 0, max: 0 },
  "ventilation-double-flux": { min: 1500, max: 3500 },
};

/* ──────────────────────── COEUR DE CALCUL ──────────────────────── */

export function estimatePrice(input: EstimateInput): EstimateResult {
  const { projectType, buildingType, surfaceM2, complexity } = input;
  const base = BASE_RANGES[projectType];

  const buildingFactor = BUILDING_MULT[buildingType];
  const complexFactor = COMPLEXITY_MULT[complexity];
  const surfaceFactor = surfaceMult(projectType, surfaceM2);

  const minBrut = base.min * buildingFactor * surfaceFactor * complexFactor.min;
  const maxBrut = base.max * buildingFactor * surfaceFactor * complexFactor.max;

  // Décomposition indicative (équipement ~55%, pose ~30%, accessoires ~15%)
  const breakdown = [
    {
      label: "Équipement principal",
      min: Math.round(minBrut * 0.55),
      max: Math.round(maxBrut * 0.55),
    },
    {
      label: "Pose et raccordements",
      min: Math.round(minBrut * 0.3),
      max: Math.round(maxBrut * 0.3),
    },
    {
      label: "Accessoires, mise en service",
      min: Math.round(minBrut * 0.15),
      max: Math.round(maxBrut * 0.15),
    },
  ];

  const klimabonus = KLIMABONUS[projectType];
  // Klimabonus s'applique surtout sur les projets éligibles, et seulement
  // pour les bâtiments résidentiels (maison/appartement).
  const klimaActive =
    (buildingType === "maison" || buildingType === "appartement") &&
    klimabonus.max > 0;
  const klimaMin = klimaActive ? klimabonus.min : 0;
  const klimaMax = klimaActive ? klimabonus.max : 0;

  const min = Math.round(minBrut);
  const max = Math.round(maxBrut);
  const netMin = Math.max(0, min - klimaMax); // best case: max aide
  const netMax = Math.max(0, max - klimaMin); // worst case: min aide

  const notes: string[] = [
    `Bâtiment : ${buildingType} (${(buildingFactor * 100 - 100).toFixed(0)} % vs maison)`,
    `Complexité : ${complexFactor.label}`,
  ];
  if (surfaceFactor !== 1.0) {
    notes.push(
      `Surface ${surfaceM2} m² indexée (${((surfaceFactor - 1) * 100).toFixed(0)} %)`,
    );
  }
  if (klimaActive) {
    notes.push(
      `Klimabonus indicatif : ${klimaMin.toLocaleString("fr-LU")} – ${klimaMax.toLocaleString("fr-LU")} €`,
    );
  } else {
    notes.push("Klimabonus non applicable sur ce type de projet/bâtiment.");
  }
  notes.push(
    "Fourchette indicative — un devis ferme nécessite une visite technique (isolation, contraintes, accès).",
  );

  return {
    projectLabel: PROJECT_LABELS[projectType],
    min,
    max,
    breakdown,
    klimabonusMin: klimaMin,
    klimabonusMax: klimaMax,
    netMin,
    netMax,
    notes,
  };
}

export const PROJECT_OPTIONS: { id: ProjectType; label: string; hint: string }[] = [
  { id: "chaudiere-gaz", label: "Chaudière gaz à condensation", hint: "Remplacement ou neuf" },
  { id: "pac-air-eau", label: "PAC air/eau", hint: "Pompe à chaleur résidentielle" },
  { id: "pac-geothermie", label: "PAC géothermique", hint: "Forage + sondes" },
  { id: "chauffe-eau-thermo", label: "Chauffe-eau thermo", hint: "Économies jusqu'à 70 %" },
  { id: "salle-de-bain", label: "Salle de bain", hint: "Rénovation complète" },
  { id: "climatisation-mono", label: "Climatisation", hint: "Mono-split résidentiel" },
  { id: "ventilation-double-flux", label: "VMC double flux", hint: "Avec récupération chaleur" },
];

export const BUILDING_OPTIONS: { id: BuildingType; label: string; hint: string }[] = [
  { id: "maison", label: "Maison individuelle", hint: "Résidentiel principal" },
  { id: "appartement", label: "Appartement", hint: "Résidentiel copropriété" },
  { id: "tertiaire", label: "Tertiaire / commerce", hint: "Bureaux, magasins" },
];

export const COMPLEXITY_OPTIONS: { id: Complexity; label: string; hint: string }[] = [
  { id: "remplacement", label: "Remplacement à l'identique", hint: "Mêmes circuits, raccords OK" },
  { id: "neuf", label: "Installation neuve", hint: "Bâtiment neuf, dimensionnement complet" },
  { id: "renovation", label: "Rénovation lourde", hint: "Modif circuits, mise aux normes" },
];
