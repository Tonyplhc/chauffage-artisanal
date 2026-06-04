/**
 * Capabilities — système de droits granulaire par utilisateur.
 *
 * Chaque écran / action admin est gardé par une capability. Un utilisateur
 * a une liste de capabilities qui détermine ce qu'il voit et ce qu'il peut
 * faire. Le concept "rôle" historique (admin / commercial / viewer) reste,
 * mais n'est plus qu'un préréglage facultatif — les capabilities sont la
 * source de vérité.
 *
 * Convention de nommage :
 *   - `domain.action` — ex : `leads.view`, `quotes.create`, `stats.read`
 *   - actions standards : `view`, `create`, `edit`, `delete`, `manage`,
 *     `send`, `export`, `import`
 *   - `manage` = view + create + edit + delete sur le domaine
 *
 * Les capabilities sont REGROUPÉES en sections métier (voir SECTIONS) pour
 * faciliter l'attribution dans l'UI : une checklist par section, avec un
 * bouton "tout cocher" pour la section.
 *
 * IMPORTANT : la garde finale doit être faite côté SERVEUR (sur les routes
 * API). Le filtrage côté client (sidebar) n'est qu'une commodité — il ne
 * sécurise rien si la route API ne re-vérifie pas.
 */

export type CapabilityCategory =
  | "pipeline"
  | "production"
  | "analyse"
  | "equipe"
  | "config"
  | "aide";

export type Capability = {
  id: string;
  label: string;
  description: string;
  category: CapabilityCategory;
};

export const CATEGORY_LABEL: Record<CapabilityCategory, string> = {
  pipeline: "Pipeline & relation client",
  production: "Production & terrain",
  analyse: "Analyse & pilotage",
  equipe: "Équipe & RH",
  config: "Configuration",
  aide: "Aide & démo",
};

export const CATEGORY_DESCRIPTION: Record<CapabilityCategory, string> = {
  pipeline:
    "Gestion des leads, devis, suivi commercial, communication avec le client",
  production:
    "Interventions terrain, équipements installés, stock, bons d'intervention, garantie SAV",
  analyse:
    "Tableaux de bord, forecast, KPIs, ROI marketing, pricing intelligence",
  equipe:
    "Techniciens, planning, dispatch, productivité, certifications, objectifs",
  config:
    "Marque, utilisateurs, automations, webhooks, intégrations, paramètres",
  aide: "Guide, tour interactif, RGPD, démo, onboarding",
};

/**
 * Catalogue exhaustif des capabilities — source unique.
 * Ajouter une nouvelle feature = ajouter une (ou plusieurs) entrée(s) ici.
 */
export const CAPABILITIES: Capability[] = [
  // ── Pipeline ────────────────────────────────────────────────────────
  { id: "leads.view", label: "Voir les leads", description: "Consulter le pipeline et les fiches lead", category: "pipeline" },
  { id: "leads.edit", label: "Modifier les leads", description: "Changer statut, notes, assignation", category: "pipeline" },
  { id: "leads.delete", label: "Supprimer un lead", description: "Suppression définitive (hors RGPD)", category: "pipeline" },
  { id: "leads.bulk", label: "Actions en masse", description: "Modifier plusieurs leads à la fois", category: "pipeline" },
  { id: "quotes.create", label: "Créer un devis", description: "Builder devis sur fiche lead", category: "pipeline" },
  { id: "quotes.send", label: "Envoyer un devis", description: "Envoi officiel au client par email", category: "pipeline" },
  { id: "quotes.approve", label: "Valider un devis", description: "Workflow d'approbation", category: "pipeline" },
  { id: "quotes.templates", label: "Templates de devis", description: "Créer et gérer les templates", category: "pipeline" },
  { id: "invoices.manage", label: "Gérer les factures", description: "Création, envoi, suivi paiement", category: "pipeline" },
  { id: "payments.manage", label: "Liens de paiement", description: "Créer des liens Stripe / acomptes", category: "pipeline" },
  { id: "communications.send", label: "Communiquer client", description: "Chat, email, snippets, templates", category: "pipeline" },
  { id: "duplicates.manage", label: "Gérer les doublons", description: "Voir et fusionner les leads dupliqués", category: "pipeline" },
  { id: "comments.write", label: "Commenter un lead", description: "Ajouter des commentaires internes", category: "pipeline" },
  { id: "tags.manage", label: "Gérer les tags", description: "Créer/modifier le dictionnaire de tags", category: "pipeline" },

  // ── Production / terrain ────────────────────────────────────────────
  { id: "interventions.view", label: "Voir ses interventions", description: "Mode terrain mobile, planning personnel", category: "production" },
  { id: "service_orders.create", label: "Bons d'intervention", description: "Créer et signer un BI sur le terrain", category: "production" },
  { id: "site_reports.create", label: "Rapports chantier", description: "Photos avant/après, observations", category: "production" },
  { id: "visits.manage", label: "Interventions", description: "Comptes-rendus terrain, signature client, notes, finalisation", category: "production" },
  { id: "equipment.view", label: "Voir équipements installés", description: "Registre des équipements par client", category: "production" },
  { id: "equipment.manage", label: "Gérer équipements", description: "Ajout, modification, retrait", category: "production" },
  { id: "warranty.manage", label: "Garantie & SAV", description: "Déclaration sinistre, suivi pièces", category: "production" },
  { id: "inventory.view", label: "Voir le stock", description: "Stock atelier + camions", category: "production" },
  { id: "inventory.manage", label: "Gérer le stock", description: "Entrées, sorties, transferts", category: "production" },
  { id: "suppliers.manage", label: "Fournisseurs", description: "Référentiel + bons de commande", category: "production" },
  { id: "purchase_orders.manage", label: "Bons de commande", description: "Créer et suivre les BC", category: "production" },
  { id: "maintenance.manage", label: "Contrats entretien", description: "Contrats récurrents + échéances", category: "production" },
  { id: "kb.read", label: "Base de connaissance", description: "Lecture des articles techniques internes", category: "production" },
  { id: "kb.edit", label: "Éditer la KB", description: "Créer / modifier les articles KB", category: "production" },
  { id: "safety.read", label: "Health & safety", description: "Consulter les check-lists sécurité", category: "production" },
  { id: "calendar.view", label: "Calendrier RDV", description: "Voir le calendrier global", category: "production" },

  // ── Analyse ─────────────────────────────────────────────────────────
  { id: "stats.read", label: "Stats globales", description: "KPIs admin et tableau de bord", category: "analyse" },
  { id: "forecast.read", label: "Forecast saisonnier", description: "Projections leads + CA", category: "analyse" },
  { id: "pipeline_value.read", label: "Pipeline pondéré", description: "Valeur pipeline × probabilités", category: "analyse" },
  { id: "pricing.read", label: "Pricing intelligence", description: "Stats prix par segment + outliers", category: "analyse" },
  { id: "geo.read", label: "Heat map géo", description: "Pipeline par commune Luxembourg", category: "analyse" },
  { id: "marketing_roi.read", label: "ROI marketing", description: "CAC, LTV, ROI par canal", category: "analyse" },
  { id: "lead_aging.read", label: "Lead aging", description: "Temps passé par statut + bottlenecks", category: "analyse" },
  { id: "customer_health.read", label: "Customer health", description: "Score de santé client", category: "analyse" },
  { id: "project_budgets.read", label: "Budgets projets", description: "Prévu vs réalisé + marge", category: "analyse" },
  { id: "loyalty.read", label: "Loyalty points", description: "Programme fidélité clients", category: "analyse" },
  { id: "carbon.read", label: "Carbon footprint", description: "Bilan CO₂ des installations", category: "analyse" },
  { id: "segments.manage", label: "Segments dynamiques", description: "Cohortes filtrables", category: "analyse" },
  { id: "reports.read", label: "Rapports mensuels", description: "Reports périodiques + comparaisons", category: "analyse" },
  { id: "experiments.read", label: "A/B tests", description: "Expériences en cours et résultats", category: "analyse" },
  { id: "analytics.read", label: "Analytics maison", description: "Mesure d'audience RGPD-friendly", category: "analyse" },
  { id: "exports.use", label: "Exports & warehouse", description: "CSV, JSON, schéma data warehouse", category: "analyse" },

  // ── Équipe & RH ─────────────────────────────────────────────────────
  { id: "tech_profiles.manage", label: "Profils techniciens", description: "Compétences, taux horaire, base", category: "equipe" },
  { id: "dispatch.manage", label: "Dispatch / planning", description: "Affecter techs aux chantiers", category: "equipe" },
  { id: "productivity.read", label: "Productivité équipe", description: "Heures, intervention/jour, classement", category: "equipe" },
  { id: "certifications.manage", label: "Certifications", description: "Échéances + renouvellements", category: "equipe" },
  { id: "goals.manage", label: "Objectifs mensuels", description: "Définir et suivre les objectifs équipe", category: "equipe" },
  { id: "onboarding.read", label: "Onboarding employé", description: "Checklist nouveau collaborateur", category: "equipe" },
  { id: "recurring.manage", label: "Tâches récurrentes", description: "Tâches admin à fréquence définie", category: "equipe" },

  // ── Configuration ──────────────────────────────────────────────────
  { id: "users.manage", label: "Gérer les utilisateurs", description: "Créer, modifier, supprimer les comptes", category: "config" },
  { id: "users.capabilities", label: "Gérer les permissions", description: "Cocher les capabilities par utilisateur", category: "config" },
  { id: "brand.manage", label: "Marque & branding", description: "Logo, couleurs, infos légales", category: "config" },
  { id: "tenants.manage", label: "Marques blanches", description: "Gestion multi-marque (multi-tenant)", category: "config" },
  { id: "automations.manage", label: "Automations", description: "Règles auto sur événements lead", category: "config" },
  { id: "webhooks.manage", label: "Webhooks externes", description: "Notifications vers systèmes tiers", category: "config" },
  { id: "api_keys.manage", label: "Clés API", description: "Émission et révocation de tokens", category: "config" },
  { id: "templates.manage", label: "Templates email", description: "Bibliothèque de templates", category: "config" },
  { id: "snippets.manage", label: "Snippets", description: "Phrases-types réutilisables", category: "config" },
  { id: "drip.manage", label: "Drip campaigns", description: "Séquences email automatisées", category: "config" },
  { id: "newsletter.send", label: "Newsletter", description: "Édition et envoi de campagnes", category: "config" },
  { id: "scoring_rules.manage", label: "Règles de scoring", description: "Personnaliser le scoring lead", category: "config" },
  { id: "calendar_sync.manage", label: "Sync calendrier", description: "Export iCal et configuration", category: "config" },
  { id: "backup.use", label: "Backup / restore", description: "Sauvegarde et restauration JSON", category: "config" },
  { id: "audit.read", label: "Audit log", description: "Lire le journal d'audit complet", category: "config" },
  { id: "rgpd.manage", label: "RGPD & registre", description: "Export, suppression, rapport conformité", category: "config" },
  { id: "twofa.manage", label: "Activer 2FA", description: "Gérer son propre 2FA", category: "config" },

  // ── Aide & démo ─────────────────────────────────────────────────────
  { id: "guide.read", label: "Guide utilisateur", description: "Consulter le guide imprimable", category: "aide" },
  { id: "tour.run", label: "Tour interactif", description: "Lancer le tour de découverte", category: "aide" },
  { id: "demo.seed", label: "Seed démo", description: "Générer / supprimer 80 leads démo", category: "aide" },
];

/** Index par id pour lookup rapide. */
export const CAPABILITIES_BY_ID: Record<string, Capability> = Object.fromEntries(
  CAPABILITIES.map((c) => [c.id, c]),
);

/** Groupe par catégorie pour rendu UI. */
export function capabilitiesByCategory(): Record<CapabilityCategory, Capability[]> {
  const out = {} as Record<CapabilityCategory, Capability[]>;
  for (const c of CAPABILITIES) {
    if (!out[c.category]) out[c.category] = [];
    out[c.category].push(c);
  }
  return out;
}

/**
 * Presets de capabilities — utilitaire pour la page d'attribution. L'option
 * "Capabilities pures" choisie par l'utilisateur signifie que ces presets
 * NE sont QU'un raccourci ergonomique : on coche les bonnes cases en un clic
 * mais on peut tout modifier ensuite à la main.
 */
export const PRESETS: Record<string, { label: string; capabilityIds: string[] }> = {
  admin: {
    label: "Admin (tout cocher)",
    capabilityIds: CAPABILITIES.map((c) => c.id),
  },
  technicien: {
    label: "Technicien terrain",
    capabilityIds: [
      "leads.view",
      "interventions.view",
      "service_orders.create",
      "site_reports.create",
      "visits.manage",
      "equipment.view",
      "warranty.manage",
      "inventory.view",
      "kb.read",
      "safety.read",
      "calendar.view",
      "guide.read",
      "twofa.manage",
    ],
  },
  commercial: {
    label: "Commercial",
    capabilityIds: [
      "leads.view",
      "leads.edit",
      "leads.bulk",
      "quotes.create",
      "quotes.send",
      "quotes.templates",
      "invoices.manage",
      "payments.manage",
      "communications.send",
      "duplicates.manage",
      "comments.write",
      "tags.manage",
      "segments.manage",
      "templates.manage",
      "snippets.manage",
      "guide.read",
      "twofa.manage",
    ],
  },
  analyste: {
    label: "Analyste / patron",
    capabilityIds: [
      "leads.view",
      "stats.read",
      "forecast.read",
      "pipeline_value.read",
      "pricing.read",
      "geo.read",
      "marketing_roi.read",
      "lead_aging.read",
      "customer_health.read",
      "project_budgets.read",
      "loyalty.read",
      "carbon.read",
      "segments.manage",
      "reports.read",
      "experiments.read",
      "analytics.read",
      "exports.use",
      "audit.read",
      "guide.read",
      "twofa.manage",
    ],
  },
  manager: {
    label: "Manager équipe",
    capabilityIds: [
      "leads.view",
      "interventions.view",
      "visits.manage",
      "calendar.view",
      "tech_profiles.manage",
      "dispatch.manage",
      "productivity.read",
      "certifications.manage",
      "goals.manage",
      "onboarding.read",
      "recurring.manage",
      "kb.read",
      "kb.edit",
      "guide.read",
      "twofa.manage",
    ],
  },
};

export function presetIds(): string[] {
  return Object.keys(PRESETS);
}

/**
 * Vérifie qu'un set de capabilities autorise une capability donnée.
 * NOTE : la garde finale doit être faite côté serveur sur chaque route API
 * sensible.
 */
export function hasCapability(
  userCaps: string[] | undefined,
  capId: string,
): boolean {
  if (!userCaps) return false;
  return userCaps.includes(capId);
}
