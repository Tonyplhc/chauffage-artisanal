import { z } from "zod";

/**
 * Schéma serveur du lead /devis.
 * Source de vérité unique partagée client + API.
 * Toute évolution de structure passe par ici.
 */

export const ServiceEnum = z.enum([
  "chauffage",
  "pac",
  "clim",
  "sanitaire",
  "enr",
  "depannage",
  "autre",
]);
export const BuildingEnum = z.enum(["maison", "appartement", "collectif", "tertiaire", "autre"]);
export const ConstructionEnum = z.enum(["neuf", "renovation"]);
export const EnergyEnum = z.enum(["fioul", "gaz", "electrique", "bois", "pac", "autre", "inconnu"]);
export const TimelineEnum = z.enum(["urgent", "court", "annee", "exploration"]);
// Tranches budget — V2 plus réaliste (refonte complète peut dépasser 100k€).
// Les anciennes valeurs (10-20, 20-40, 40plus) restent acceptées pour ne pas
// casser les leads historiques en base. Le formulaire n'affiche que la V2.
export const BudgetEnum = z.enum([
  "less10",
  // V2 — affichées dans le configurateur actuel
  "10-25",
  "25-50",
  "50-100",
  "100plus",
  // V1 — legacy (existing leads in DB), still accepted by API
  "10-20",
  "20-40",
  "40plus",
  "inconnu",
]);
export const ChannelEnum = z.enum(["phone", "email", "sms", "whatsapp"]);
export const StatusEnum = z.enum(["nouveau", "contacte", "devis_envoye", "converti", "perdu"]);

/**
 * Marque souhaitée par le client (optionnel) — pré-renseignable via
 * ?marque=xxx depuis les fiches /marques/[slug]. "aucune" = pas de
 * préférence, on choisira pour eux selon le projet.
 */
export const BrandPreferenceEnum = z.enum([
  "aucune",
  "vaillant",
  "viessmann",
  "daikin",
  "mitsubishi",
  "buderus",
  "atlantic",
  "bosch",
  "de-dietrich",
  "hoval",
]);

export const PhotoSchema = z.object({
  name: z.string().min(1).max(200),
  size: z.number().int().min(1).max(8 * 1024 * 1024), // 8 MB max
  type: z.string().regex(/^image\/(jpeg|jpg|png|webp|heic|heif)$/i),
  // base64 data URL ; le serveur reconvertit puis stocke en binaire
  dataUrl: z.string().regex(/^data:image\//),
});

/** Payload accepté par POST /api/devis (avant traitement serveur). */
export const DevisSubmitSchema = z.object({
  // Honeypot — caché côté UI ; doit rester vide.
  // On NE valide PAS la longueur côté schéma (Zod 4 traite "" de manière
  // inattendue avec .max(0)). La détection de bot est faite ensuite dans la
  // route /api/devis : si trap.length > 0 → réponse silencieuse.
  trap: z.string().optional().default(""),

  // Multi-select : au moins 1, au plus 7 services
  services: z.array(ServiceEnum).min(1).max(7),
  buildingType: BuildingEnum,
  construction: ConstructionEnum,

  surface: z.number().int().min(10).max(20000),
  currentEnergy: EnergyEnum,
  commune: z.string().min(2).max(120),

  timeline: TimelineEnum,
  budget: BudgetEnum,

  // Marque souhaitée — optionnel ("aucune" par défaut). Permet la
  // pré-sélection depuis les fiches /marques/[slug] via ?marque=xxx.
  preferredBrand: BrandPreferenceEnum.optional().default("aucune"),

  photos: z.array(PhotoSchema).max(5).default([]),

  fullName: z.string().min(2).max(120),
  email: z.string().email().max(180),
  phone: z.string().min(6).max(40),
  preferredChannel: ChannelEnum,
  message: z.string().max(2000).default(""),
  rgpdConsent: z.literal(true),

  metadata: z
    .object({
      userAgent: z.string().max(400).optional(),
      locale: z.string().max(20).optional(),
      // Attribution / source tracking (W18.2)
      source: z
        .object({
          utmSource: z.string().max(120).optional(),
          utmMedium: z.string().max(120).optional(),
          utmCampaign: z.string().max(160).optional(),
          utmContent: z.string().max(160).optional(),
          utmTerm: z.string().max(160).optional(),
          referrer: z.string().max(400).optional(),
          landing: z.string().max(400).optional(),
          capturedAt: z.string().max(40).optional(),
        })
        .optional(),
    })
    .passthrough() // accepte d'autres champs runtime (tags, estimatedValue…)
    .optional()
    .default({}),
});

export type DevisSubmit = z.infer<typeof DevisSubmitSchema>;

/** Niveau de chaleur lead — calculé automatiquement par lib/lead-scoring. */
export const LeadLevelEnum = z.enum(["hot", "warm", "cold"]);

/** Audit log entry : une transition de statut. */
export const StatusTransitionSchema = z.object({
  from: StatusEnum,
  to: StatusEnum,
  at: z.string(), // ISO date
});

/** Lead persisté, après traitement serveur. */
export const LeadRecordSchema = DevisSubmitSchema.omit({ trap: true, photos: true }).extend({
  reference: z.string().regex(/^DEV-\d{4}-\d{4}$/),
  submittedAt: z.string(),
  status: StatusEnum,
  photoUrls: z.array(z.string()).default([]),
  source: z.string().default("/devis"),
  notes: z.string().default(""),
  // Scoring (champs optionnels pour rétro-compat avec leads anciens)
  score: z.number().int().min(0).max(100).optional(),
  level: LeadLevelEnum.optional(),
  scoreReasons: z
    .array(z.object({ label: z.string(), points: z.number().int() }))
    .optional(),
  // Historique transitions de statut (vide pour leads pré-audit-log)
  statusHistory: z.array(StatusTransitionSchema).optional(),
  // Assignation à un utilisateur (email)
  assignedTo: z.string().email().optional(),
});

/** Helper : libellé court d'un service (réutilisé partout). */
export const SERVICE_LABELS: Record<z.infer<typeof ServiceEnum>, string> = {
  chauffage: "Chauffage",
  pac: "Pompe à chaleur",
  clim: "Climatisation",
  sanitaire: "Sanitaire",
  enr: "Énergies renouvelables",
  depannage: "Dépannage",
  autre: "Autre projet",
};

export type LeadRecord = z.infer<typeof LeadRecordSchema>;

/** Nouvelle référence DEV-YYYY-XXXX */
export function makeReference(): string {
  const year = new Date().getFullYear();
  const num = Math.floor(Math.random() * 9000) + 1000;
  return `DEV-${year}-${num}`;
}

/** Sanitize basique d'une chaîne libre (utilisé sur message). */
export function sanitizeText(s: string): string {
  return s
    .replace(/<[^>]*>/g, "") // strip HTML tags
    .replace(/\s{3,}/g, "\n\n")
    .trim();
}
