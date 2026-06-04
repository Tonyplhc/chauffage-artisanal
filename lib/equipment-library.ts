/**
 * Bibliothèque d'équipements HVAC consultable.
 *
 * Référentiel statique de marques et modèles courants au Luxembourg avec
 * leurs spécifications principales. Sert à :
 *   - aider les admins à pré-remplir des devis et fiches équipement
 *   - donner du contenu réel aux prospects sur les outils publics
 *
 * Discipline éditoriale : on liste des marques RÉELLES et leurs gammes
 * courantes, mais avec des fourchettes de prix indicatives ET annotées
 * "à confirmer". On NE PROMET aucun prix exact ni disponibilité.
 *
 * Sources : sites constructeurs publics. Mise à jour annuelle conseillée.
 */

export type EquipmentCategory =
  | "pac-air-eau"
  | "pac-geothermique"
  | "pac-air-air"
  | "chaudiere-gaz"
  | "chaudiere-bois"
  | "solaire-thermique"
  | "photovoltaique"
  | "ventilation";

export const CATEGORY_LABELS: Record<EquipmentCategory, string> = {
  "pac-air-eau": "Pompe à chaleur air/eau",
  "pac-geothermique": "Pompe à chaleur géothermique",
  "pac-air-air": "Climatisation réversible",
  "chaudiere-gaz": "Chaudière gaz à condensation",
  "chaudiere-bois": "Chaudière biomasse",
  "solaire-thermique": "Solaire thermique",
  photovoltaique: "Photovoltaïque",
  ventilation: "VMC double flux",
};

export type Equipment = {
  id: string;
  category: EquipmentCategory;
  brand: string;
  model: string;
  /** Gamme/famille (ex "Vitocal 200-S"). */
  series?: string;
  /** Puissance nominale typique (kW). */
  powerKw?: number;
  /** Gamme de puissances disponibles dans la série (kW min-max). */
  powerRangeKw?: [number, number];
  /** SCOP saisonnier moyen (PAC) ou rendement (chaudière). */
  efficiency?: number;
  efficiencyLabel?: string;
  /** Fourchette de prix indicative HT (matériel seul, pose non incluse). */
  priceRangeEur?: [number, number];
  /** Garantie constructeur standard (années). */
  warrantyYears?: number;
  /** Caractéristique différenciante. */
  highlight?: string;
  /** Compatible Klimabonus (à vérifier au cas par cas). */
  klimabonusEligible?: boolean;
  /** Notes ou points de vigilance. */
  notes?: string;
};

/**
 * Données : exemples représentatifs, pas exhaustifs. Le client peut compléter
 * via l'admin (à venir : CRUD si besoin métier). Pour V1, statique.
 */
export const EQUIPMENT_LIBRARY: Equipment[] = [
  // PAC air/eau
  {
    id: "viess-vitocal-200s",
    category: "pac-air-eau",
    brand: "Viessmann",
    series: "Vitocal 200-S",
    model: "AWB-AC 201.D",
    powerRangeKw: [4, 13],
    efficiency: 3.6,
    efficiencyLabel: "SCOP",
    priceRangeEur: [10500, 16500],
    warrantyYears: 5,
    highlight: "Compresseur Inverter, silencieux 35 dB(A) à 5 m",
    klimabonusEligible: true,
  },
  {
    id: "daikin-altherma-3",
    category: "pac-air-eau",
    brand: "Daikin",
    series: "Altherma 3",
    model: "EAVH-D",
    powerRangeKw: [4, 16],
    efficiency: 3.8,
    efficiencyLabel: "SCOP",
    priceRangeEur: [9500, 17000],
    warrantyYears: 5,
    highlight: "Fluide R-32, écran tactile, supervision via app",
    klimabonusEligible: true,
  },
  {
    id: "mitsubishi-ecodan",
    category: "pac-air-eau",
    brand: "Mitsubishi Electric",
    series: "Ecodan",
    model: "PUZ-WM",
    powerRangeKw: [5, 14],
    efficiency: 3.5,
    efficiencyLabel: "SCOP",
    priceRangeEur: [9000, 15500],
    warrantyYears: 3,
    klimabonusEligible: true,
  },
  // PAC géothermique
  {
    id: "stiebel-eltron-wpf",
    category: "pac-geothermique",
    brand: "Stiebel Eltron",
    series: "WPF cool",
    model: "WPF 10 cool",
    powerRangeKw: [7, 17],
    efficiency: 4.5,
    efficiencyLabel: "SCOP",
    priceRangeEur: [16000, 24000],
    warrantyYears: 5,
    highlight: "Forages verticaux 80-120 m typiques au Lux",
    klimabonusEligible: true,
    notes:
      "Coût forage non inclus (≈ 5-12 k€ selon profondeur et géologie).",
  },
  // PAC air/air (clim)
  {
    id: "daikin-perfera",
    category: "pac-air-air",
    brand: "Daikin",
    series: "Perfera",
    model: "FTXM-R",
    powerRangeKw: [2, 7],
    efficiency: 5.1,
    efficiencyLabel: "SCOP",
    priceRangeEur: [1800, 3500],
    warrantyYears: 3,
    highlight: "Mono-split ; multi-split possible jusqu'à 5 unités",
    klimabonusEligible: false,
    notes: "Klimabonus généralement réservé air/eau.",
  },
  // Chaudières gaz
  {
    id: "viess-vitodens-200w",
    category: "chaudiere-gaz",
    brand: "Viessmann",
    series: "Vitodens 200-W",
    model: "B2HF",
    powerRangeKw: [11, 32],
    efficiency: 0.98,
    efficiencyLabel: "Rendement PCI",
    priceRangeEur: [4500, 7500],
    warrantyYears: 2,
    highlight: "Modulation 1:20, écran tactile, OpenTherm",
    klimabonusEligible: false,
  },
  {
    id: "buderus-gb172",
    category: "chaudiere-gaz",
    brand: "Buderus",
    series: "Logamax plus GB172",
    model: "GB172i",
    powerRangeKw: [14, 24],
    efficiency: 0.97,
    efficiencyLabel: "Rendement PCI",
    priceRangeEur: [3800, 6500],
    warrantyYears: 2,
    klimabonusEligible: false,
  },
  // Solaire thermique
  {
    id: "viess-vitosol-200tm",
    category: "solaire-thermique",
    brand: "Viessmann",
    series: "Vitosol 200-TM",
    model: "Tube sous vide SP3C",
    priceRangeEur: [3500, 7500],
    warrantyYears: 10,
    highlight: "Production ECS jusqu'à 60% des besoins selon orientation",
    klimabonusEligible: true,
  },
  // PV
  {
    id: "sunpower-maxeon",
    category: "photovoltaique",
    brand: "SunPower",
    series: "Maxeon 6",
    model: "AC 425W",
    priceRangeEur: [350, 480],
    warrantyYears: 40,
    highlight: "Rendement cellule >22%, garantie performance 40 ans",
    klimabonusEligible: true,
    notes:
      "Prix par module. Installation type 6 kWc ≈ 14 modules + onduleur + pose.",
  },
  // VMC
  {
    id: "atlantic-duolix",
    category: "ventilation",
    brand: "Atlantic",
    series: "Duolix Max",
    model: "HR Premium",
    powerRangeKw: [0.1, 0.3],
    efficiency: 0.93,
    efficiencyLabel: "Rendement échange",
    priceRangeEur: [2200, 3800],
    warrantyYears: 2,
    klimabonusEligible: true,
  },
];

export function listEquipment(filter?: {
  category?: EquipmentCategory;
  brand?: string;
}): Equipment[] {
  let out = EQUIPMENT_LIBRARY;
  if (filter?.category) out = out.filter((e) => e.category === filter.category);
  if (filter?.brand) {
    const b = filter.brand.toLowerCase();
    out = out.filter((e) => e.brand.toLowerCase().includes(b));
  }
  return out;
}

export function listBrands(): string[] {
  return Array.from(new Set(EQUIPMENT_LIBRARY.map((e) => e.brand))).sort();
}
