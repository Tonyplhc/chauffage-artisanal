/**
 * Templates de devis — bundles d'items réutilisables.
 *
 * Exemple : "PAC air/eau standard maison neuve" = ["Fourniture PAC X", "Pose",
 * "Ballon thermo 200L", "Raccordement", "Mise en service"].
 *
 * Au moment d'appliquer un template au quote builder, on copie les lignes
 * (avec leurs unit/qty/unitPrice/unit) et le tvaRate dans le devis brouillon.
 * L'admin peut ensuite ajuster avant envoi.
 *
 * Stockage :
 *   - Local dev : data/quote-templates.json
 *   - Vercel readonly : in-memory store par instance Lambda
 *   - Seeds métier injectés en fallback quand le store est vide (5 templates
 *     types pré-remplis avec prix HT 2026 LU indicatifs)
 */

import { promises as fs } from "node:fs";
import path from "node:path";
import { randomBytes } from "node:crypto";

const DATA_DIR = path.join(process.cwd(), "data");
const TEMPLATES_FILE = path.join(DATA_DIR, "quote-templates.json");

const VERCEL_READONLY = !!process.env.VERCEL;

const globalAny = globalThis as unknown as {
  __memoryQuoteTemplates?: QuoteTemplate[];
};

export type QuoteTemplateLine = {
  description: string;
  quantity: number;
  unitPrice: number;
  unit?: string;
};

export type QuoteTemplate = {
  id: string;
  name: string;
  description?: string;
  category?: string; // ex "PAC", "Climatisation", "Sanitaire"
  lines: QuoteTemplateLine[];
  tvaRate: number;
  createdAt: string;
  updatedAt: string;
  usageCount: number;
};

/* ─────────────── Seeds métier 2026 LU ─────────────── */

const SEED_TEMPLATES: QuoteTemplate[] = [
  {
    id: "seed-pac-air-eau",
    name: "PAC air/eau résidentielle — remplacement chaudière",
    description:
      "Bundle complet : étude + fourniture + pose + mise en service. Compatible Klimabonus 10 000 € en remplacement chaudière fossile.",
    category: "PAC",
    lines: [
      {
        description:
          "Étude thermique + dimensionnement (bilan déperditions + courbe de chauffe)",
        quantity: 1,
        unitPrice: 850,
        unit: "forfait",
      },
      {
        description:
          "Fourniture PAC air/eau monobloc R32 ou R290 (puissance 8 à 12 kW selon dimensionnement)",
        quantity: 1,
        unitPrice: 8500,
        unit: "unité",
      },
      {
        description: "Dépose ancienne chaudière fioul/gaz + évacuation conforme",
        quantity: 1,
        unitPrice: 1100,
        unit: "forfait",
      },
      {
        description:
          "Pose PAC, raccordement hydraulique, circulateur, vase d'expansion, désembouage circuit",
        quantity: 1,
        unitPrice: 2400,
        unit: "forfait",
      },
      {
        description: "Régulation + sonde extérieure + thermostat connecté",
        quantity: 1,
        unitPrice: 650,
        unit: "unité",
      },
      {
        description: "Mise en service, paramétrage, formation client, dossier de garantie",
        quantity: 1,
        unitPrice: 450,
        unit: "forfait",
      },
      {
        description: "Préparation dossier technique Klimabonus (fiches + schémas + attestation)",
        quantity: 1,
        unitPrice: 280,
        unit: "forfait",
      },
    ],
    tvaRate: 3,
    createdAt: "2026-01-15T00:00:00.000Z",
    updatedAt: "2026-01-15T00:00:00.000Z",
    usageCount: 12,
  },
  {
    id: "seed-chaudiere-condensation",
    name: "Chaudière gaz à condensation — remplacement standard",
    description:
      "Remplacement chaudière gaz par condensation milieu de gamme. Inclut SCRB et mise en service.",
    category: "Chauffage",
    lines: [
      {
        description:
          "Fourniture chaudière gaz à condensation murale (Vaillant/Viessmann/Buderus, 24-35 kW)",
        quantity: 1,
        unitPrice: 3400,
        unit: "unité",
      },
      {
        description: "Dépose ancienne chaudière + évacuation",
        quantity: 1,
        unitPrice: 380,
        unit: "forfait",
      },
      {
        description:
          "Pose chaudière, raccordement gaz + eau, conduit de fumée concentrique, évacuation condensats",
        quantity: 1,
        unitPrice: 1450,
        unit: "forfait",
      },
      {
        description: "Tubage conduit existant si nécessaire (forfait moyen)",
        quantity: 1,
        unitPrice: 550,
        unit: "forfait",
      },
      {
        description: "Test étanchéité gaz + mise en service + analyse de combustion",
        quantity: 1,
        unitPrice: 280,
        unit: "forfait",
      },
      {
        description: "Demande de réception SCRB (Chambre des Métiers — RGD 27 février 2010)",
        quantity: 1,
        unitPrice: 150,
        unit: "forfait",
      },
    ],
    tvaRate: 3,
    createdAt: "2026-01-15T00:00:00.000Z",
    updatedAt: "2026-01-15T00:00:00.000Z",
    usageCount: 8,
  },
  {
    id: "seed-salle-de-bain-premium",
    name: "Rénovation salle de bain premium 8 m²",
    description:
      "Rénovation complète clé en main, sanitaire haut de gamme (Hansgrohe/Geberit), douche italienne, baignoire îlot optionnelle.",
    category: "Sanitaire",
    lines: [
      {
        description: "Démolition existant, dépose sanitaire, évacuation gravats",
        quantity: 1,
        unitPrice: 1200,
        unit: "forfait",
      },
      {
        description: "Plomberie complète : réseau cuivre/PER + évacuations PVC reposés",
        quantity: 1,
        unitPrice: 1850,
        unit: "forfait",
      },
      {
        description: "Carrelage sol + murs 24 m² (carrelage fourni grand format)",
        quantity: 24,
        unitPrice: 110,
        unit: "m²",
      },
      {
        description: "Douche italienne avec receveur extra-plat + paroi verre",
        quantity: 1,
        unitPrice: 2200,
        unit: "ensemble",
      },
      {
        description: "Robinetterie mitigeur thermostatique Hansgrohe ShowerSelect",
        quantity: 1,
        unitPrice: 850,
        unit: "unité",
      },
      {
        description: "WC suspendu Geberit avec bâti-support + plaque commande",
        quantity: 1,
        unitPrice: 950,
        unit: "ensemble",
      },
      {
        description: "Meuble vasque double + miroir LED",
        quantity: 1,
        unitPrice: 1800,
        unit: "ensemble",
      },
      {
        description: "Sèche-serviettes électrique avec thermostat",
        quantity: 1,
        unitPrice: 450,
        unit: "unité",
      },
      {
        description: "Coordination chantier + finitions + nettoyage fin de poste",
        quantity: 1,
        unitPrice: 750,
        unit: "forfait",
      },
    ],
    tvaRate: 3,
    createdAt: "2026-01-15T00:00:00.000Z",
    updatedAt: "2026-01-15T00:00:00.000Z",
    usageCount: 5,
  },
  {
    id: "seed-clim-mono-split",
    name: "Climatisation mono-split résidentielle",
    description:
      "Installation d'une climatisation mono-split réversible (chaud + froid) dans une pièce. Habilitation fluides cat I.",
    category: "Climatisation",
    lines: [
      {
        description:
          "Fourniture climatisation mono-split réversible R32 (Daikin/Mitsubishi, 2,5 kW)",
        quantity: 1,
        unitPrice: 1450,
        unit: "ensemble",
      },
      {
        description:
          "Pose unité intérieure murale + unité extérieure + liaison frigorifique (4 m)",
        quantity: 1,
        unitPrice: 880,
        unit: "forfait",
      },
      {
        description: "Percement mur + raccordement électrique dédié",
        quantity: 1,
        unitPrice: 350,
        unit: "forfait",
      },
      {
        description: "Mise sous vide circuit, charge frigorigène, mise en service",
        quantity: 1,
        unitPrice: 280,
        unit: "forfait",
      },
      {
        description: "Habilitation fluides cat I — déclaration annuelle d'étanchéité incluse",
        quantity: 1,
        unitPrice: 120,
        unit: "forfait",
      },
    ],
    tvaRate: 17,
    createdAt: "2026-01-15T00:00:00.000Z",
    updatedAt: "2026-01-15T00:00:00.000Z",
    usageCount: 14,
  },
  {
    id: "seed-contrat-entretien-annuel",
    name: "Contrat d'entretien annuel chaudière",
    description:
      "Visite annuelle complète + rapport conforme + priorité dépannage. Conforme RGD luxembourgeois.",
    category: "Entretien",
    lines: [
      {
        description:
          "Visite annuelle chaudière : combustion, étanchéité gaz, pression, sécurités, nettoyage",
        quantity: 1,
        unitPrice: 145,
        unit: "visite",
      },
      {
        description:
          "Rapport de visite signé + remise en main propre + archivage 5 ans",
        quantity: 1,
        unitPrice: 0,
        unit: "inclus",
      },
      {
        description:
          "Priorité dépannage en cas de panne en cours d'année (vs non-contrats)",
        quantity: 1,
        unitPrice: 0,
        unit: "inclus",
      },
      {
        description:
          "Rappel automatique pour la prochaine visite (8e à 11e mois de l'année)",
        quantity: 1,
        unitPrice: 0,
        unit: "inclus",
      },
    ],
    tvaRate: 17,
    createdAt: "2026-01-15T00:00:00.000Z",
    updatedAt: "2026-01-15T00:00:00.000Z",
    usageCount: 22,
  },
];

/* ─────────────── Storage adapters ─────────────── */

async function ensureDir() {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
  } catch {}
}

async function readAll(): Promise<QuoteTemplate[]> {
  if (VERCEL_READONLY) {
    return globalAny.__memoryQuoteTemplates ?? [];
  }
  try {
    return JSON.parse(await fs.readFile(TEMPLATES_FILE, "utf8"));
  } catch {
    return globalAny.__memoryQuoteTemplates ?? [];
  }
}

async function writeAll(arr: QuoteTemplate[]) {
  globalAny.__memoryQuoteTemplates = arr;
  if (VERCEL_READONLY) return;
  try {
    await ensureDir();
    await fs.writeFile(TEMPLATES_FILE, JSON.stringify(arr, null, 2), "utf8");
  } catch {}
}

function makeId(): string {
  return `qt-${randomBytes(5).toString("hex")}`;
}

function validateLine(l: unknown): QuoteTemplateLine {
  const obj = l as Partial<QuoteTemplateLine>;
  const description = String(obj.description ?? "").trim();
  if (!description) throw new Error("Description de ligne requise");
  if (description.length > 500) throw new Error("Description trop longue");
  const quantity = Number(obj.quantity);
  if (!Number.isFinite(quantity) || quantity < 0 || quantity > 10000)
    throw new Error("Quantité invalide");
  const unitPrice = Number(obj.unitPrice);
  if (!Number.isFinite(unitPrice) || unitPrice < 0 || unitPrice > 10_000_000)
    throw new Error("Prix unitaire invalide");
  const unit = obj.unit ? String(obj.unit).slice(0, 20) : "forfait";
  return { description, quantity, unitPrice, unit };
}

export async function listTemplates(): Promise<QuoteTemplate[]> {
  const all = await readAll();
  // Fallback seeds si vide (ex: première utilisation en prod Vercel)
  const effective = all.length === 0 ? [...SEED_TEMPLATES] : all;
  return [...effective].sort((a, b) => {
    if (b.usageCount !== a.usageCount) return b.usageCount - a.usageCount;
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
  });
}

export async function getTemplate(id: string): Promise<QuoteTemplate | null> {
  const all = await readAll();
  if (all.length === 0) {
    return SEED_TEMPLATES.find((t) => t.id === id) ?? null;
  }
  return all.find((t) => t.id === id) ?? null;
}

export async function createTemplate(input: {
  name: string;
  description?: string;
  category?: string;
  lines: unknown[];
  tvaRate?: number;
}): Promise<QuoteTemplate> {
  const name = input.name.trim();
  if (!name) throw new Error("Nom requis");
  if (name.length > 160) throw new Error("Nom trop long");
  if (!Array.isArray(input.lines) || input.lines.length === 0) {
    throw new Error("Au moins une ligne requise");
  }
  if (input.lines.length > 50) throw new Error("Trop de lignes (max 50)");
  const lines = input.lines.map(validateLine);
  const tvaRate =
    typeof input.tvaRate === "number" && input.tvaRate >= 0 && input.tvaRate <= 100
      ? input.tvaRate
      : 17;
  const all = await readAll();
  // Si store vide, on hydrate avec les seeds AVANT d'ajouter (sinon les seeds
  // disparaissent au premier create).
  if (all.length === 0) all.push(...SEED_TEMPLATES);
  const now = new Date().toISOString();
  const tpl: QuoteTemplate = {
    id: makeId(),
    name,
    description: input.description?.trim() || undefined,
    category: input.category?.trim() || undefined,
    lines,
    tvaRate,
    createdAt: now,
    updatedAt: now,
    usageCount: 0,
  };
  all.push(tpl);
  await writeAll(all);
  return tpl;
}

export async function updateTemplate(
  id: string,
  patch: Partial<Pick<QuoteTemplate, "name" | "description" | "category" | "tvaRate">> & {
    lines?: unknown[];
  },
): Promise<QuoteTemplate | null> {
  let all = await readAll();
  if (all.length === 0) all = [...SEED_TEMPLATES];
  const idx = all.findIndex((t) => t.id === id);
  if (idx === -1) return null;
  const cur = all[idx];
  const next: QuoteTemplate = { ...cur };
  if (patch.name !== undefined) {
    const n = patch.name.trim();
    if (!n) throw new Error("Nom requis");
    next.name = n;
  }
  if (patch.description !== undefined)
    next.description = patch.description.trim() || undefined;
  if (patch.category !== undefined)
    next.category = patch.category.trim() || undefined;
  if (patch.tvaRate !== undefined) {
    const r = Number(patch.tvaRate);
    if (Number.isFinite(r) && r >= 0 && r <= 100) next.tvaRate = r;
  }
  if (patch.lines !== undefined) {
    if (!Array.isArray(patch.lines) || patch.lines.length === 0)
      throw new Error("Au moins une ligne requise");
    if (patch.lines.length > 50) throw new Error("Trop de lignes (max 50)");
    next.lines = patch.lines.map(validateLine);
  }
  next.updatedAt = new Date().toISOString();
  all[idx] = next;
  await writeAll(all);
  return next;
}

export async function deleteTemplate(id: string): Promise<boolean> {
  let all = await readAll();
  if (all.length === 0) all = [...SEED_TEMPLATES];
  const next = all.filter((t) => t.id !== id);
  if (next.length === all.length) return false;
  await writeAll(next);
  return true;
}

export async function recordTemplateUsage(id: string): Promise<void> {
  let all = await readAll();
  if (all.length === 0) all = [...SEED_TEMPLATES];
  const idx = all.findIndex((t) => t.id === id);
  if (idx === -1) return;
  all[idx].usageCount += 1;
  await writeAll(all);
}
