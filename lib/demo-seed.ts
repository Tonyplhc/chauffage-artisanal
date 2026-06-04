/**
 * Seed démo — génère 80 leads réalistes sur 24 mois pour la démo client.
 *
 * Idempotent : si `data/leads.json` contient déjà des entrées dont la
 * référence commence par `DEV-SEED-`, on les considère comme « déjà seedées »
 * et on ne refait rien (sauf si `force=true`).
 *
 * Discipline éditoriale :
 *   - prénoms et noms de famille issus de pools FR/Lux raisonnables, jamais
 *     de personne réelle célèbre
 *   - emails et téléphones obviously fake (@demo.local, +352 00 …)
 *   - communes uniquement celles du catalogue + quelques voisines réalistes
 *   - photos absentes (pas de fake binaire)
 *   - aucun témoignage public n'est créé (les leads démo NE doivent PAS
 *     apparaître dans le wall de témoignages)
 *
 * Génération réaliste :
 *   - répartition statuts : 18 nouveau / 22 contacte / 22 devis_envoye /
 *     12 converti / 6 perdu (= 80)
 *   - submittedAt étalé sur 24 mois avec saisonnalité (hiver = +40%, été = -30%)
 *   - statusHistory cohérent avec submittedAt (transitions logiques dans le temps)
 *   - scoring recalculé depuis lib/lead-scoring
 *   - sources d'acquisition variées (SEO, Google Ads, parrainage, direct, FB)
 *
 * Note : on ne touche PAS aux autres stores (factures, contrats, équipements…)
 * dans ce seed V1. L'extension viendra dans W33.1bis si besoin pour la démo.
 */

import { promises as fs } from "node:fs";
import path from "node:path";
import type { LeadRecord } from "./devis-schema";
import { scoreLead } from "./lead-scoring";

const DATA_DIR = path.join(process.cwd(), "data");
const LEADS_FILE = path.join(DATA_DIR, "leads.json");

const SEED_PREFIX = "DEV-SEED-";

// ─── Pools de génération ─────────────────────────────────────────────────

const FIRST_NAMES = [
  "Léa", "Camille", "Marc", "Sophie", "Julien", "Marie", "Thomas", "Claire",
  "Antoine", "Sarah", "Nicolas", "Émilie", "Pierre", "Anne", "Mathieu",
  "Laure", "Vincent", "Hélène", "Olivier", "Christine", "François", "Nathalie",
  "Stéphane", "Isabelle", "Patrick", "Catherine", "Bernard", "Sylvie",
  "Frédéric", "Valérie", "Sébastien", "Caroline", "Bruno", "Sandrine",
  "Romain", "Aurélie", "Maxime", "Charlotte",
];

const LAST_NAMES = [
  "Weber", "Schmit", "Wagner", "Müller", "Schneider", "Reuter", "Hoffmann",
  "Becker", "Klein", "Schmitt", "Lentz", "Kremer", "Thill", "Wiltgen",
  "Bonifas", "Marx", "Goerens", "Faber", "Reiter", "Krier", "Risch",
  "Dupont", "Lefebvre", "Bernard", "Petit", "Robert", "Richard", "Durand",
  "Moreau", "Laurent", "Simon", "Michel", "Garcia", "Martinez",
];

const COMMUNES = [
  "Luxembourg-Ville", "Esch-sur-Alzette", "Differdange", "Strassen", "Bertrange",
  "Dudelange", "Bettembourg", "Pétange", "Sanem", "Niederanven",
  "Mamer", "Steinsel", "Walferdange", "Hesperange", "Schifflange",
  "Mersch", "Diekirch", "Wiltz", "Echternach",
];

const SERVICES: LeadRecord["services"] = [
  ["chauffage"],
  ["pac"],
  ["clim"],
  ["sanitaire"],
  ["enr"],
  ["depannage"],
  ["chauffage", "sanitaire"],
  ["pac", "enr"],
  ["chauffage", "pac"],
  ["clim", "enr"],
] as unknown as LeadRecord["services"];

const BUILDINGS: LeadRecord["buildingType"][] = [
  "maison",
  "maison",
  "maison",
  "appartement",
  "appartement",
  "collectif",
  "tertiaire",
];

const CONSTRUCTIONS: LeadRecord["construction"][] = [
  "renovation",
  "renovation",
  "renovation",
  "neuf",
];

const ENERGIES: LeadRecord["currentEnergy"][] = [
  "gaz",
  "fioul",
  "electrique",
  "pac",
  "bois",
  "inconnu",
];

const TIMELINES: LeadRecord["timeline"][] = [
  "urgent",
  "court",
  "court",
  "annee",
  "annee",
  "exploration",
];

const BUDGETS: LeadRecord["budget"][] = [
  "less10",
  "10-20",
  "10-20",
  "20-40",
  "20-40",
  "40plus",
  "inconnu",
];

const CHANNELS: LeadRecord["preferredChannel"][] = [
  "phone",
  "phone",
  "email",
  "email",
  "whatsapp",
];

const SOURCES = [
  { utmSource: "google", utmMedium: "cpc", utmCampaign: "chauffage-lux" },
  { utmSource: "google", utmMedium: "organic", utmCampaign: "" },
  { utmSource: "facebook", utmMedium: "social", utmCampaign: "klimabonus-2026" },
  { utmSource: "newsletter", utmMedium: "email", utmCampaign: "spring" },
  { utmSource: "direct", utmMedium: "none", utmCampaign: "" },
  { utmSource: "referral", utmMedium: "wom", utmCampaign: "" },
  { utmSource: "linkedin", utmMedium: "social", utmCampaign: "" },
];

const STATUS_DISTRIBUTION: LeadRecord["status"][] = [
  ...Array(18).fill("nouveau"),
  ...Array(22).fill("contacte"),
  ...Array(22).fill("devis_envoye"),
  ...Array(12).fill("converti"),
  ...Array(6).fill("perdu"),
];

const SAMPLE_MESSAGES = [
  "Bonjour, nous avons un projet de remplacement de chaudière, peut-on convenir d'une visite ?",
  "Notre PAC actuelle a plus de 15 ans, intéressé(e) par une étude.",
  "Construction neuve, je souhaite comprendre les options de chauffage.",
  "Devis en parallèle, merci de revenir vers moi rapidement.",
  "Hésitation entre PAC et condensation gaz — pouvez-vous nous conseiller ?",
  "Climatisation pour 2 chambres et 1 salon, possible cet été ?",
  "Suite à votre article sur le Klimabonus, j'aimerais valider mon éligibilité.",
  "Recommandé(e) par mon voisin qui a fait poser une PAC chez vous l'an dernier.",
  "",
  "",
];

// ─── Helpers déterministes (PRNG seedé pour idempotence) ─────────────────

/** PRNG mulberry32 — pseudo-aléatoire reproductible. */
function makeRng(seed: number) {
  let s = seed;
  return () => {
    s |= 0;
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pick<T>(rng: () => number, arr: readonly T[]): T {
  return arr[Math.floor(rng() * arr.length)];
}

function randInt(rng: () => number, min: number, max: number): number {
  return Math.floor(rng() * (max - min + 1)) + min;
}

/**
 * Date submission : étalée sur les 24 derniers mois avec saisonnalité.
 * Décembre/Janvier = peak (×1.4), Juillet/Août = creux (×0.7), reste = ×1.
 */
function pickSubmittedAt(rng: () => number, indexInBatch: number): string {
  // Distribution non-uniforme : on prend un mois 0..23 pondéré par saisonnalité
  const SEASONAL = [
    1.4, 1.3, 1.1, 1.0, 0.9, 0.85, // jan-juin
    0.7, 0.75, 0.95, 1.1, 1.25, 1.4, // jul-déc
  ];
  // Sélectionne un mois calendaire pondéré
  let monthChoice = -1;
  const total = SEASONAL.reduce((s, v) => s + v, 0);
  let r = rng() * total;
  for (let m = 0; m < 12; m++) {
    r -= SEASONAL[m];
    if (r <= 0) {
      monthChoice = m;
      break;
    }
  }
  if (monthChoice === -1) monthChoice = 5;

  // Sélectionne une année dans la fenêtre 24 mois
  const now = new Date();
  const yearOffset = rng() < 0.55 ? 0 : -1; // 55% année courante, 45% précédente
  const targetYear = now.getUTCFullYear() + yearOffset;
  const targetMonth = monthChoice;

  // Si le résultat tombe dans le futur, recule d'un an
  const baseDate = new Date(Date.UTC(targetYear, targetMonth, 1));
  let finalDate = baseDate;
  if (baseDate.getTime() > now.getTime()) {
    finalDate = new Date(Date.UTC(targetYear - 1, targetMonth, 1));
  }
  // Si trop ancien (>24 mois), avance d'un an
  const maxBack = new Date(Date.UTC(now.getUTCFullYear() - 2, now.getUTCMonth(), 1));
  if (finalDate.getTime() < maxBack.getTime()) {
    finalDate = new Date(Date.UTC(finalDate.getUTCFullYear() + 1, finalDate.getUTCMonth(), 1));
  }

  // Ajoute un jour aléatoire dans le mois + heure ouvrée
  const day = randInt(rng, 1, 27);
  const hour = randInt(rng, 8, 19);
  const minute = randInt(rng, 0, 59);
  const final = new Date(
    Date.UTC(finalDate.getUTCFullYear(), finalDate.getUTCMonth(), day, hour, minute),
  );
  // Utilise indexInBatch pour décaler de quelques secondes (évite collisions)
  final.setUTCSeconds(indexInBatch % 60);
  return final.toISOString();
}

function makeReference(rng: () => number, index: number): string {
  const year = new Date().getUTCFullYear();
  const num = (1000 + index).toString().padStart(4, "0");
  return `${SEED_PREFIX}${year}-${num}`;
}

function buildStatusHistory(
  status: LeadRecord["status"],
  submittedAt: string,
  rng: () => number,
): LeadRecord["statusHistory"] {
  const start = new Date(submittedAt).getTime();
  const dayMs = 24 * 3600 * 1000;
  const transitions: LeadRecord["statusHistory"] = [];

  if (status === "nouveau") return [];

  // contacte : 1-5 jours après création
  const contactedAt = new Date(start + randInt(rng, 1, 5) * dayMs).toISOString();
  transitions.push({ from: "nouveau", to: "contacte", at: contactedAt });
  if (status === "contacte") return transitions;

  // devis_envoye : 3-15 jours après contact
  const quoteSentAt = new Date(
    new Date(contactedAt).getTime() + randInt(rng, 3, 15) * dayMs,
  ).toISOString();
  transitions.push({ from: "contacte", to: "devis_envoye", at: quoteSentAt });
  if (status === "devis_envoye") return transitions;

  // Décision (converti / perdu) : 5-30 jours après devis
  const decisionAt = new Date(
    new Date(quoteSentAt).getTime() + randInt(rng, 5, 30) * dayMs,
  ).toISOString();
  transitions.push({ from: "devis_envoye", to: status, at: decisionAt });
  return transitions;
}

function estimatedValueFor(
  budget: LeadRecord["budget"],
  rng: () => number,
): number {
  // Si budget = inconnu → estime depuis service + bâtiment (modeste)
  const map: Record<LeadRecord["budget"], [number, number]> = {
    less10: [4500, 9000],
    "10-20": [11000, 18000],
    "20-40": [22000, 38000],
    "40plus": [42000, 65000],
    inconnu: [6000, 14000],
  };
  const [min, max] = map[budget];
  return randInt(rng, min, max);
}

// ─── Génération principale ───────────────────────────────────────────────

async function readLeads(): Promise<LeadRecord[]> {
  try {
    return JSON.parse(await fs.readFile(LEADS_FILE, "utf8")) as LeadRecord[];
  } catch {
    return [];
  }
}

async function writeLeads(leads: LeadRecord[]) {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
  } catch {}
  await fs.writeFile(LEADS_FILE, JSON.stringify(leads, null, 2), "utf8");
}

export type SeedResult = {
  ok: boolean;
  inserted: number;
  skipped: number;
  alreadyPresent: number;
  totalAfter: number;
  reason?: string;
};

export type SeedOptions = {
  /** Si true, recrée même si des seeds existent déjà (les écrase). */
  force?: boolean;
  /** Nombre de leads démo à générer (default 80). */
  count?: number;
  /** Seed PRNG pour reproductibilité (default fixed). */
  rngSeed?: number;
};

export async function seedDemoLeads(
  options: SeedOptions = {},
): Promise<SeedResult> {
  const count = options.count ?? 80;
  const seed = options.rngSeed ?? 20260529;
  const force = options.force ?? false;

  const existing = await readLeads();
  const existingSeeds = existing.filter((l) =>
    l.reference.startsWith(SEED_PREFIX),
  );

  if (existingSeeds.length > 0 && !force) {
    return {
      ok: false,
      inserted: 0,
      skipped: count,
      alreadyPresent: existingSeeds.length,
      totalAfter: existing.length,
      reason: `${existingSeeds.length} leads démo déjà présents — utilisez force=true pour régénérer.`,
    };
  }

  // Si force : retire les seeds existants
  const nonSeed = existing.filter(
    (l) => !l.reference.startsWith(SEED_PREFIX),
  );

  const rng = makeRng(seed);
  const generated: LeadRecord[] = [];

  for (let i = 0; i < count; i++) {
    const firstName = pick(rng, FIRST_NAMES);
    const lastName = pick(rng, LAST_NAMES);
    const fullName = `${firstName} ${lastName}`;
    const slug = `${firstName}.${lastName}`
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .toLowerCase()
      .replace(/[^a-z.]/g, "");

    const services = pick(rng, SERVICES);
    const buildingType = pick(rng, BUILDINGS);
    const construction = pick(rng, CONSTRUCTIONS);
    const currentEnergy = pick(rng, ENERGIES);
    const commune = pick(rng, COMMUNES);
    const timeline = pick(rng, TIMELINES);
    const budget = pick(rng, BUDGETS);
    const channel = pick(rng, CHANNELS);
    const status = STATUS_DISTRIBUTION[i] ?? "nouveau";

    const surface =
      buildingType === "appartement"
        ? randInt(rng, 35, 130)
        : buildingType === "collectif"
          ? randInt(rng, 200, 1200)
          : buildingType === "tertiaire"
            ? randInt(rng, 150, 800)
            : randInt(rng, 80, 250);

    const submittedAt = pickSubmittedAt(rng, i);
    const reference = makeReference(rng, i);
    const message = pick(rng, SAMPLE_MESSAGES);
    const sourceMeta = pick(rng, SOURCES);
    const estimatedValue = estimatedValueFor(budget, rng);

    // Score via le moteur officiel (cohérence avec leads réels)
    const scoringInput = {
      services,
      buildingType,
      construction,
      surface,
      currentEnergy,
      timeline,
      budget,
      message,
      photoUrls: [] as string[],
      preferredChannel: channel,
    };
    const scoring = scoreLead(scoringInput);

    const statusHistory = buildStatusHistory(status, submittedAt, rng);

    const record: LeadRecord = {
      reference,
      submittedAt,
      services,
      buildingType,
      construction,
      surface,
      currentEnergy,
      commune,
      timeline,
      budget,
      fullName,
      email: `${slug}.${i}@demo.local`,
      phone: `+352 00 ${(100 + i).toString().padStart(4, "0")}`,
      preferredChannel: channel,
      message,
      rgpdConsent: true,
      metadata: {
        seedDemo: true,
        estimatedValue,
        source: sourceMeta,
      },
      status,
      photoUrls: [],
      source: "/devis",
      notes: "",
      score: scoring.score,
      level: scoring.level,
      scoreReasons: scoring.reasons,
      statusHistory,
    };

    generated.push(record);
  }

  // Tri par date submitted desc pour cohérence avec le store réel
  generated.sort(
    (a, b) =>
      new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime(),
  );

  const all = [...generated, ...nonSeed];
  await writeLeads(all);

  return {
    ok: true,
    inserted: generated.length,
    skipped: 0,
    alreadyPresent: 0,
    totalAfter: all.length,
  };
}

export async function removeDemoLeads(): Promise<{ removed: number; totalAfter: number }> {
  const existing = await readLeads();
  const kept = existing.filter((l) => !l.reference.startsWith(SEED_PREFIX));
  const removed = existing.length - kept.length;
  if (removed > 0) await writeLeads(kept);
  return { removed, totalAfter: kept.length };
}

export async function countDemoLeads(): Promise<number> {
  const existing = await readLeads();
  return existing.filter((l) => l.reference.startsWith(SEED_PREFIX)).length;
}
