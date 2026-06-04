/**
 * Parser Excel/CSV → CatalogueItem[]
 * Colonnes attendues (insensibles à la casse, séparateurs multiples acceptés) :
 *   ref · service · name · description · priceMin · priceMax · unit ·
 *   advantages · inconvenients · brand · power · surfaceMin · surfaceMax
 *
 * Advantages/Inconvenients : séparateurs " | " ou " ; " ou retour à la ligne.
 */

import * as XLSX from "xlsx";
import { CatalogueItemSchema, type CatalogueItem } from "./catalogue-schema";

const COLUMN_ALIASES: Record<string, string[]> = {
  ref: ["ref", "reference", "référence", "code"],
  service: ["service", "categorie", "catégorie", "metier", "métier"],
  name: ["name", "nom", "produit", "designation", "désignation", "intitulé", "intitule"],
  description: ["description", "details", "détails", "descriptif"],
  priceMin: ["pricemin", "prixmin", "prix min", "prix minimum", "minprice"],
  priceMax: ["pricemax", "prixmax", "prix max", "prix maximum", "maxprice"],
  unit: ["unit", "unite", "unité", "unitprice"],
  advantages: ["advantages", "avantages", "pros", "plus"],
  inconvenients: ["inconvenients", "inconvénients", "cons", "moins", "limites"],
  brand: ["brand", "marque", "fabricant"],
  power: ["power", "puissance", "kw"],
  surfaceMin: ["surfacemin", "surface min", "surf min", "min surface"],
  surfaceMax: ["surfacemax", "surface max", "surf max", "max surface"],
};

const SERVICE_ALIASES: Record<string, string> = {
  chauffage: "chauffage",
  pompeachaleur: "pac",
  pompeàchaleur: "pac",
  pac: "pac",
  pompechaleur: "pac",
  climatisation: "clim",
  clim: "clim",
  sanitaire: "sanitaire",
  plomberie: "sanitaire",
  enr: "enr",
  energiesrenouvelables: "enr",
  énergiesrenouvelables: "enr",
  solaire: "enr",
  photovoltaique: "enr",
  photovoltaïque: "enr",
  depannage: "depannage",
  dépannage: "depannage",
  autre: "autre",
};

function normKey(k: string): string {
  return k
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z]/g, "");
}

function findCol(row: Record<string, unknown>, target: string): string | null {
  const aliases = COLUMN_ALIASES[target] ?? [target];
  const aliasNorm = aliases.map(normKey);
  for (const k of Object.keys(row)) {
    if (aliasNorm.includes(normKey(k))) return k;
  }
  return null;
}

function toStringSafe(v: unknown): string {
  if (v === undefined || v === null) return "";
  return String(v).trim();
}

function toIntOrNull(v: unknown): number | null {
  if (v === undefined || v === null || v === "") return null;
  const n =
    typeof v === "number"
      ? v
      : Number(String(v).replace(/[€\s]/g, "").replace(",", "."));
  if (!Number.isFinite(n) || n < 0) return null;
  return Math.round(n);
}

function splitList(v: unknown): string[] {
  const s = toStringSafe(v);
  if (!s) return [];
  return s
    .split(/[|;\n]+/)
    .map((x) => x.trim())
    .filter((x) => x.length > 0)
    .slice(0, 8);
}

function normService(v: unknown): string {
  const s = normKey(toStringSafe(v));
  return SERVICE_ALIASES[s] ?? s;
}

export type ParseResult = {
  ok: boolean;
  items: CatalogueItem[];
  errors: { row: number; reason: string }[];
};

export async function parseCatalogueFile(
  buffer: ArrayBuffer,
  filename: string,
): Promise<ParseResult> {
  const errors: { row: number; reason: string }[] = [];
  const items: CatalogueItem[] = [];

  let rows: Record<string, unknown>[];
  try {
    const wb = XLSX.read(buffer, { type: "array" });
    const sheet = wb.Sheets[wb.SheetNames[0]];
    rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: "" });
  } catch (e) {
    return {
      ok: false,
      items: [],
      errors: [{ row: 0, reason: `Fichier illisible : ${String(e)}` }],
    };
  }

  if (rows.length === 0) {
    return { ok: false, items: [], errors: [{ row: 0, reason: "Fichier vide" }] };
  }

  rows.forEach((row, i) => {
    const refKey = findCol(row, "ref");
    const serviceKey = findCol(row, "service");
    const nameKey = findCol(row, "name");

    if (!refKey || !serviceKey || !nameKey) {
      errors.push({
        row: i + 2,
        reason: `Colonnes manquantes (ref / service / name requises). Trouvées : ${Object.keys(row).join(", ")}`,
      });
      return;
    }

    const candidate = {
      ref: toStringSafe(row[refKey]),
      service: normService(row[serviceKey]),
      name: toStringSafe(row[nameKey]),
      description: toStringSafe(row[findCol(row, "description") ?? ""]),
      priceMin: toIntOrNull(row[findCol(row, "priceMin") ?? ""]),
      priceMax: toIntOrNull(row[findCol(row, "priceMax") ?? ""]),
      unit: toStringSafe(row[findCol(row, "unit") ?? ""]) || "forfait",
      advantages: splitList(row[findCol(row, "advantages") ?? ""]),
      inconvenients: splitList(row[findCol(row, "inconvenients") ?? ""]),
      brand: toStringSafe(row[findCol(row, "brand") ?? ""]),
      power: toStringSafe(row[findCol(row, "power") ?? ""]),
      surfaceMin: toIntOrNull(row[findCol(row, "surfaceMin") ?? ""]),
      surfaceMax: toIntOrNull(row[findCol(row, "surfaceMax") ?? ""]),
    };

    const parsed = CatalogueItemSchema.safeParse(candidate);
    if (!parsed.success) {
      errors.push({
        row: i + 2,
        reason: parsed.error.issues.map((e) => `${e.path.join(".")} : ${e.message}`).join(" · "),
      });
      return;
    }
    items.push(parsed.data);
  });

  return { ok: errors.length === 0 || items.length > 0, items, errors };
}

/* ─────────── Template CSV (téléchargeable) ─────────── */

export function buildCsvTemplate(): string {
  const headers = [
    "ref",
    "service",
    "name",
    "description",
    "priceMin",
    "priceMax",
    "unit",
    "advantages",
    "inconvenients",
    "brand",
    "power",
    "surfaceMin",
    "surfaceMax",
  ];
  // Lignes d'exemple — à REMPLACER par tes vraies références.
  // Les prix sont des ordres de grandeur indicatifs marché LU 2026 (à valider).
  const sampleRows = [
    // PAC — 3 tiers
    [
      "PAC-AE-ENTREE",
      "pac",
      "PAC air/eau monobloc · entrée de gamme",
      "Solution résidentielle d'entrée. Marque européenne accessible, COP ~3,8.",
      "8000",
      "12000",
      "installation complète",
      "Tarif accessible | Installation rapide | Éligible Klimabonus",
      "Performance baisse par grand froid | Acoustique correcte sans plus",
      "",
      "8-10 kW",
      "80",
      "150",
    ],
    [
      "PAC-AE-STANDARD",
      "pac",
      "PAC air/eau · cœur de gamme",
      "Solution résidentielle équilibrée. Marque allemande, COP ~4,5, régulation connectée.",
      "13000",
      "20000",
      "installation complète",
      "Performance constante | Connectée | Garantie étendue | Klimabonus",
      "Investissement initial moyen | Maintenance annuelle requise",
      "",
      "10-14 kW",
      "120",
      "220",
    ],
    [
      "PAC-AE-PREMIUM",
      "pac",
      "PAC air/eau · haut de gamme",
      "Marque premium allemande, modulation fine, ECS intégrée, télémaintenance.",
      "22000",
      "32000",
      "installation complète",
      "Modulation fine | Bruit minimal | Télémaintenance | ECS intégrée",
      "Investissement élevé | Délai approvisionnement",
      "",
      "12-16 kW",
      "150",
      "300",
    ],
    // CHAUFFAGE
    [
      "CHAUFF-COND-ENTREE",
      "chauffage",
      "Chaudière gaz à condensation · accessible",
      "Solution standard de remplacement, modèle européen éprouvé.",
      "4500",
      "7000",
      "installation complète",
      "Tarif compétitif | Énergie maîtrisée | Compatible existant",
      "Énergie fossile | Modulation limitée",
      "",
      "24 kW",
      "80",
      "180",
    ],
    [
      "CHAUFF-HYBRIDE",
      "chauffage",
      "Système hybride gaz + PAC",
      "Couple chaudière condensation + PAC air/eau, pilotage intelligent selon prix énergie.",
      "15000",
      "22000",
      "installation complète",
      "Optimisation prix énergie | Klimabonus partiel | Confort hiver garanti",
      "Investissement double | Maintenance plus complexe",
      "",
      "",
      "100",
      "250",
    ],
    // CLIM
    [
      "CLIM-MONOSPLIT",
      "clim",
      "Climatisation mono-split",
      "Une unité intérieure + une extérieure. Idéal pièce à vivre ou chambre.",
      "1800",
      "3500",
      "par unité installée",
      "Installation simple | F-Gas inclus | Réversible chauffage",
      "Une seule pièce | Esthétique unité intérieure",
      "",
      "2,5-5 kW",
      "",
      "",
    ],
    [
      "CLIM-MULTISPLIT",
      "clim",
      "Climatisation multi-split (3 pièces)",
      "Une unité extérieure + 3 unités intérieures. Discrétion architecturale.",
      "5500",
      "9000",
      "installation complète",
      "Pilotage par zone | Une seule unité extérieure | Réversible",
      "Plus complexe à installer | Maintenance annuelle",
      "",
      "5-8 kW total",
      "",
      "",
    ],
    // SANITAIRE
    [
      "SAN-SDB-STANDARD",
      "sanitaire",
      "Salle de bain rénovation standard",
      "Démontage + sanitaires marques européennes + faïence + plomberie.",
      "8000",
      "14000",
      "salle de bain complète",
      "Travail clés en main | Délai maîtrisé | Garanties standard",
      "Indisponibilité 2 semaines | Choix limité aux gammes accessibles",
      "",
      "",
      "",
      "",
    ],
    [
      "SAN-SDB-ARCHI",
      "sanitaire",
      "Salle de bain haut de gamme avec architecte",
      "Robinetterie premium, douche italienne, baignoire îlot, plancher chauffant.",
      "18000",
      "35000",
      "salle de bain complète",
      "Robinetterie premium | Plancher chauffant | Coordination architecte | Finitions soignées",
      "Délai 4-6 semaines | Budget élevé | Indisponibilité longue",
      "",
      "",
      "",
      "",
    ],
    // ENR
    [
      "ENR-PV-RESID",
      "enr",
      "Photovoltaïque résidentiel 5 kWc",
      "12-14 panneaux haut rendement + micro-onduleurs + monitoring.",
      "9000",
      "14000",
      "installation complète",
      "Autoconsommation | Klimabonus | Garantie 25 ans modules",
      "Dépend ensoleillement | Investissement initial",
      "",
      "5 kWc",
      "",
      "",
    ],
    [
      "ENR-PV-BATT",
      "enr",
      "Photovoltaïque 8 kWc + batterie 10 kWh",
      "Installation PV étendue + stockage lithium pour autoconsommation maximale.",
      "20000",
      "30000",
      "installation complète",
      "Autoconsommation 70-80% | Indépendance partielle | Klimabonus étendu",
      "Investissement élevé | Durée batterie 10-15 ans",
      "",
      "8 kWc + 10 kWh",
      "",
      "",
    ],
  ];

  const lines = [headers.join(",")];
  for (const r of sampleRows) {
    lines.push(
      r
        .map((cell) => {
          const s = String(cell);
          return /[",\n;|]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
        })
        .join(","),
    );
  }
  return lines.join("\n");
}
