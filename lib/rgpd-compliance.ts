/**
 * Rapport conformité RGPD.
 *
 * Génère le contenu du registre des traitements + statistiques d'usage
 * (nb exports demandés, nb suppressions, leads concernés) à partir de l'état
 * réel du système.
 *
 * Le registre de traitements est statique (les finalités/bases légales sont
 * définies par le métier) mais ENRICHI par les données concrètes du tenant
 * (durée de conservation effective, volume de leads, dernière purge…).
 *
 * Sortie pensée pour 2 usages :
 *   1. Affichage web (admin/rgpd) — lecture rapide
 *   2. Impression / PDF (via print CSS de la page) — preuve à l'autorité
 *
 * Pas d'auto-conformité : ce rapport AIDE à documenter, il ne remplace pas
 * une revue juridique. Le DPO/responsable RGPD reste in fine accountable.
 */

import { listActivity } from "./activity-log";
import { listLeads } from "./leads-store";
import { getBrand } from "./brand-settings";

export type ProcessingPurpose = {
  id: string;
  title: string;
  /** Base légale (art. 6 RGPD). */
  legalBasis:
    | "contrat"
    | "consentement"
    | "obligation_legale"
    | "interet_legitime";
  /** Catégories de données traitées. */
  dataCategories: string[];
  /** Catégories de destinataires (interne + sous-traitants). */
  recipients: string[];
  /** Durée de conservation. */
  retention: string;
  /** Mesures techniques en place. */
  securityMeasures: string[];
  /** Transferts hors UE ? */
  outsideEu: { transferred: boolean; safeguards?: string };
};

export type RgpdMetrics = {
  /** Total leads en base. */
  leadsTotal: number;
  /** Plus ancien lead (date). */
  oldestLeadAt: string | null;
  /** Plus récent lead. */
  newestLeadAt: string | null;
  /** Nb d'exports RGPD effectués (depuis activity log). */
  exportsCount: number;
  dernierExportAt: string | null;
  /** Nb de suppressions RGPD effectuées. */
  deletionsCount: number;
  dernierDeletionAt: string | null;
  /** Leads créés au-delà d'une rétention "standard" (24 mois). À auditer. */
  leadsBeyondStandardRetention: number;
};

export type RgpdReport = {
  generatedAt: string;
  brand: {
    name: string;
    contactEmail: string;
    address: string;
  };
  purposes: ProcessingPurpose[];
  rights: {
    title: string;
    description: string;
    procedureFr: string;
  }[];
  metrics: RgpdMetrics;
  /** Recommandations contextuelles si données indiquent un risque. */
  recommendations: { severity: "info" | "warning" | "critical"; text: string }[];
};

const PROCESSING_PURPOSES: ProcessingPurpose[] = [
  {
    id: "devis-prospects",
    title: "Gestion des demandes de devis et prospects",
    legalBasis: "interet_legitime",
    dataCategories: [
      "Identité (nom, prénom)",
      "Coordonnées (email, téléphone, adresse)",
      "Données de projet (type de logement, équipement existant, budget)",
      "Photos d'installation (téléversement volontaire)",
    ],
    recipients: [
      "Équipe commerciale interne",
      "Techniciens intervenant sur le projet",
      "Sous-traitant email transactionnel (Resend, UE)",
      "Hébergeur (Supabase / Vercel selon configuration)",
    ],
    retention:
      "24 mois après dernière interaction si non-converti ; durée du contrat + 5 ans (obligations comptables) si converti",
    securityMeasures: [
      "Authentification admin avec mot de passe haché (Argon2id)",
      "2FA optionnel pour les comptes admin",
      "Cookies de session signés HMAC SHA-256",
      "Rate limiting sur les endpoints publics",
      "Chiffrement TLS en transit (HTTPS obligatoire)",
      "Logs d'audit horodatés (transitions de statut, exports, suppressions)",
    ],
    outsideEu: {
      transferred: false,
    },
  },
  {
    id: "contrats-entretien",
    title: "Suivi des contrats d'entretien et SAV",
    legalBasis: "contrat",
    dataCategories: [
      "Identité client + coordonnées",
      "Inventaire équipements installés (marque, modèle, n° série)",
      "Historique visites d'entretien et rapports techniques",
      "Photos avant/après chantier",
    ],
    recipients: [
      "Équipe technique",
      "Sous-traitants fournisseurs (pour SAV uniquement, données minimales)",
    ],
    retention: "Durée du contrat + 10 ans (responsabilité décennale)",
    securityMeasures: [
      "Accès restreint par rôle (admin / technicien / utilisateur)",
      "Logs d'accès aux fiches client",
    ],
    outsideEu: { transferred: false },
  },
  {
    id: "facturation",
    title: "Facturation et obligations comptables",
    legalBasis: "obligation_legale",
    dataCategories: [
      "Identité et adresse de facturation",
      "Montants facturés et historique de paiements",
      "Pièces justificatives (devis signé, bon de commande)",
    ],
    recipients: [
      "Service comptabilité",
      "Expert-comptable / commissaire aux comptes",
      "Administration fiscale (sur demande)",
    ],
    retention: "10 ans (Code de commerce)",
    securityMeasures: [
      "Numérotation séquentielle non altérable",
      "Sauvegarde régulière (export JSON / SQL dump)",
    ],
    outsideEu: { transferred: false },
  },
  {
    id: "marketing-newsletter",
    title: "Newsletter et communications marketing",
    legalBasis: "consentement",
    dataCategories: ["Email", "Prénom (optionnel)", "Préférences thématiques"],
    recipients: [
      "Équipe marketing interne",
      "Sous-traitant email (Resend, UE)",
    ],
    retention: "Jusqu'au retrait du consentement + 3 ans (preuve)",
    securityMeasures: [
      "Double opt-in à l'inscription",
      "Lien de désinscription dans chaque envoi",
      "Suivi du consentement horodaté",
    ],
    outsideEu: { transferred: false },
  },
  {
    id: "analytics",
    title: "Mesure d'audience anonyme du site",
    legalBasis: "interet_legitime",
    dataCategories: [
      "Page consultée, durée, source de trafic",
      "Aucun cookie tiers, aucune empreinte navigateur",
    ],
    recipients: ["Équipe interne uniquement"],
    retention: "13 mois",
    securityMeasures: [
      "Mesure côté serveur, pas de Google Analytics / GA4",
      "Pas d'identifiant utilisateur persistant",
    ],
    outsideEu: { transferred: false },
  },
];

const DATA_SUBJECT_RIGHTS = [
  {
    title: "Droit d'accès (art. 15)",
    description:
      "Obtenir copie des données personnelles détenues, dans un format lisible.",
    procedureFr:
      "Sur demande écrite (email ou courrier), réponse sous 1 mois. Export JSON complet généré depuis l'admin (bouton « Export RGPD »).",
  },
  {
    title: "Droit de rectification (art. 16)",
    description: "Faire corriger des informations inexactes ou incomplètes.",
    procedureFr:
      "Sur demande, mise à jour immédiate des champs concernés par l'équipe support. Traçabilité dans le journal d'audit.",
  },
  {
    title: "Droit à l'effacement / oubli (art. 17)",
    description:
      "Demander la suppression des données, sauf obligation légale de conservation (comptabilité, garanties).",
    procedureFr:
      "Bouton « Suppression RGPD » dans l'admin. Le lead et ses photos sont effacés du store. Les factures associées sont conservées (obligation comptable 10 ans) en anonymisant le client lorsque le délai légal est échu.",
  },
  {
    title: "Droit à la portabilité (art. 20)",
    description: "Récupérer ses données dans un format structuré, lisible.",
    procedureFr:
      "Export complet JSON disponible (incluant photos en base64). Format ouvert, interopérable.",
  },
  {
    title: "Droit d'opposition (art. 21)",
    description:
      "S'opposer au traitement pour intérêt légitime (marketing, prospection).",
    procedureFr:
      "Désinscription newsletter en un clic. Marquage interne « ne plus solliciter » sur la fiche lead.",
  },
];

function daysBetween(a: string, b: string): number {
  return Math.abs(
    (new Date(a).getTime() - new Date(b).getTime()) / (1000 * 60 * 60 * 24),
  );
}

export async function computeRgpdReport(): Promise<RgpdReport> {
  const [activity, leads, brand] = await Promise.all([
    listActivity(),
    listLeads(),
    getBrand(),
  ]);

  // Métriques exports/suppressions
  const exports = activity.filter((a) => a.type === "lead.rgpd_export");
  const deletions = activity.filter((a) => a.type === "lead.rgpd_delete");

  // Plus ancien / récent lead
  let oldest: string | null = null;
  let newest: string | null = null;
  for (const l of leads) {
    if (!oldest || l.submittedAt < oldest) oldest = l.submittedAt;
    if (!newest || l.submittedAt > newest) newest = l.submittedAt;
  }

  // Leads au-delà de 24 mois — candidats à revue conservation
  const now = new Date().toISOString();
  const leadsBeyondStandardRetention = leads.filter((l) => {
    if (l.status === "converti") return false; // soumis aux obligations comptables
    return daysBetween(now, l.submittedAt) > 24 * 30;
  }).length;

  const metrics: RgpdMetrics = {
    leadsTotal: leads.length,
    oldestLeadAt: oldest,
    newestLeadAt: newest,
    exportsCount: exports.length,
    dernierExportAt: exports[0]?.at ?? null,
    deletionsCount: deletions.length,
    dernierDeletionAt: deletions[0]?.at ?? null,
    leadsBeyondStandardRetention,
  };

  const recommendations: RgpdReport["recommendations"] = [];

  if (leadsBeyondStandardRetention > 0) {
    recommendations.push({
      severity: "warning",
      text: `${leadsBeyondStandardRetention} lead(s) non-converti(s) datent de plus de 24 mois. Vérifier qu'ils peuvent être purgés ou anonymisés conformément à la politique de conservation.`,
    });
  }

  if (exports.length === 0 && leads.length > 0) {
    recommendations.push({
      severity: "info",
      text: "Aucun export RGPD effectué à ce jour. Si vous recevez une demande d'accès, utilisez le bouton « Export » sur la fiche lead.",
    });
  }

  if (deletions.length === 0 && leads.length > 50) {
    recommendations.push({
      severity: "info",
      text: "Aucune suppression RGPD effectuée à ce jour. Pensez à formaliser un processus de revue annuelle des leads anciens.",
    });
  }

  if (!brand.contactEmail || brand.contactEmail.includes("00 00")) {
    recommendations.push({
      severity: "critical",
      text: "L'adresse de contact RGPD (brand.contactEmail) semble être un placeholder. Renseignez l'email du DPO ou responsable RGPD dans les paramètres de marque.",
    });
  }

  return {
    generatedAt: new Date().toISOString(),
    brand: {
      name: brand.name,
      contactEmail: brand.contactEmail,
      address: brand.contactAddress,
    },
    purposes: PROCESSING_PURPOSES,
    rights: DATA_SUBJECT_RIGHTS,
    metrics,
    recommendations,
  };
}

export function legalBasisLabel(b: ProcessingPurpose["legalBasis"]): string {
  switch (b) {
    case "contrat":
      return "Exécution d'un contrat";
    case "consentement":
      return "Consentement explicite";
    case "obligation_legale":
      return "Obligation légale";
    case "interet_legitime":
      return "Intérêt légitime";
  }
}
