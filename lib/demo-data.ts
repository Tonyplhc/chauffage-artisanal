/**
 * ════════════════════════════════════════════════════════════════════════
 *  ⚠️  DONNÉES DE DÉMONSTRATION — NE PAS PUBLIER TELLES QUELLES
 * ════════════════════════════════════════════════════════════════════════
 *
 *  Ce fichier centralise TOUT le contenu fictif du démonstrateur premium.
 *  Objectif : permettre de visualiser le rendu final avant de disposer des
 *  vraies données du client.
 *
 *  AVANT MISE EN PRODUCTION → remplacer systématiquement chaque entrée par
 *  les données réelles, puis passer `IS_DEMO_DATA` à `false`.
 *
 *  ── AUTORISÉ (placeholders crédibles, marqués) ──────────────────────────
 *    • chiffres / statistiques fictifs réalistes
 *    • photos placeholder
 *    • avis placeholder (prénom + commune, SANS marque tierce)
 *    • membres d'équipe placeholder
 *
 *  ── INTERDIT (ne jamais inventer) ───────────────────────────────────────
 *    • faux avis Google / Trustpilot (aucun logo ni branding de plateforme)
 *    • fausses certifications, récompenses, labels
 *    • faux partenaires
 *
 *  Les DONNÉES RÉELLES vérifiées (1994, RCS B46877, affiliations Fédération
 *  des Artisans / du Génie Technique, partenaires Viessmann · Buderus ·
 *  De Dietrich, garantie installation) vivent dans `lib/company-info.ts` et
 *  NE doivent JAMAIS être dupliquées ici.
 */

/** Drapeau global : `true` tant que le site affiche du contenu de démo. */
export const IS_DEMO_DATA = true;

/* ───────────────────────────── Statistiques ───────────────────────────── */

export interface DemoStat {
  /** Valeur numérique brute (formatée à l'affichage). */
  value: number;
  /** Suffixe / unité éventuel (ex. " €/an", "/5", "h"). */
  unit?: string;
  /** Libellé affiché. */
  label: string;
  /**
   * `true`  → donnée RÉELLE vérifiable (peut être publiée).
   * `false` → [DEMO] placeholder à remplacer avant production.
   */
  real: boolean;
}

/**
 * [DEMO] Données financières du simulateur « Économies » + section « Aides ».
 *
 * ⚠️ TOUS ces chiffres sont fictifs/illustratifs — centralisés ICI pour être
 * remplacés d'un seul endroit par le vrai calcul (moteurs) avant production.
 *
 * Convention couleur (stricte) : ces valeurs sont des DONNÉES FINANCIÈRES →
 * affichées en VERT (gain) / ROUGE (coût). Jamais dans le design de marque.
 */
export const DEMO_SIMULATION = {
  energieActuelle: "Mazout",
  coutActuelAnnuel: 3200, // €/an — coût de chauffage actuel  → ROUGE
  solution: "PAC air/eau",
  coutApresAnnuel: 2080, // €/an — coût après travaux         → neutre
  economieAnnuelle: 1450, // €/an — gain (= actuel − après)   → VERT
  reductionFacturePct: 45, // %
  budgetInstallation: 18500, // € — budget estimatif PAC
  aidesPossibles: 10000, // € — aides déduites                → VERT
  resteACharge: 8500, // € — = budget − aides
  projectionAnnees: 10, // gain projeté = economieAnnuelle × projectionAnnees
} as const;

/** [DEMO] Montants d'aides affichés (source réelle à terme : lib/klimabonus-2026.ts). */
export const DEMO_AIDES = {
  pacAirEau: 10000, // €
  geothermie: 12000, // €
} as const;

export const STATS: Record<string, DemoStat> = {
  anneesExperience: { value: 30, label: "ans d'expertise", real: true }, // ✓ 2024 − 1994
  delaiDevis: { value: 24, unit: "h", label: "délai de devis", real: true }, // ✓ engagement
  projetsRealises: { value: 3200, label: "installations depuis 1994", real: false }, // [DEMO]
  satisfaction: { value: 4.8, unit: "/5", label: "satisfaction client", real: false }, // [DEMO] — JAMAIS présenté comme « avis Google »
  techniciens: { value: 18, label: "techniciens & frigoristes", real: false }, // [DEMO]
  communesCouvertes: { value: 100, label: "communes couvertes", real: false }, // [DEMO]
};

/* ───────────────────────────── Réalisations ───────────────────────────── */

export interface DemoRealisation {
  id: string;
  /** Type de chantier (sert aussi de filtre de galerie). */
  category: "Villas" | "Résidentiel" | "Immeubles" | "Commerce" | "Industrie";
  /** Intitulé court (type · commune). */
  title: string;
  commune: string;
  system: string;
  year: number;
  /** Image placeholder (à remplacer par photo réelle de chantier). */
  image: string;
}

/** [DEMO] 12 chantiers fictifs — à remplacer par de vraies photos avant/après. */
export const REALISATIONS: DemoRealisation[] = [
  { id: "demo-1", category: "Villas", title: "Villa · Strassen", commune: "Strassen", system: "PAC géothermique", year: 2025, image: "https://picsum.photos/seed/proj1/600/800" },
  { id: "demo-2", category: "Résidentiel", title: "Résidence · Esch", commune: "Esch-sur-Alzette", system: "Chaufferie collective", year: 2024, image: "https://picsum.photos/seed/proj2/600/800" },
  { id: "demo-3", category: "Commerce", title: "Commerce · Lux-Ville", commune: "Luxembourg", system: "Climatisation", year: 2024, image: "https://picsum.photos/seed/proj3/600/800" },
  { id: "demo-4", category: "Villas", title: "Maison · Mersch", commune: "Mersch", system: "PAC air/eau + solaire", year: 2025, image: "https://picsum.photos/seed/proj4/600/800" },
  { id: "demo-5", category: "Villas", title: "Villa · Bertrange", commune: "Bertrange", system: "Plancher chauffant", year: 2024, image: "https://picsum.photos/seed/proj5/600/800" },
  { id: "demo-6", category: "Immeubles", title: "Immeuble · Differdange", commune: "Differdange", system: "Sous-stations", year: 2023, image: "https://picsum.photos/seed/proj6/600/800" },
  { id: "demo-7", category: "Résidentiel", title: "Maison · Dudelange", commune: "Dudelange", system: "Salle de bain complète", year: 2025, image: "https://picsum.photos/seed/proj7/600/800" },
  { id: "demo-8", category: "Commerce", title: "Bureau · Contern", commune: "Contern", system: "VRV tertiaire", year: 2024, image: "https://picsum.photos/seed/proj8/600/800" },
  { id: "demo-9", category: "Villas", title: "Villa · Ettelbruck", commune: "Ettelbruck", system: "Solaire thermique", year: 2023, image: "https://picsum.photos/seed/proj9/600/800" },
  { id: "demo-10", category: "Résidentiel", title: "Résidence · Mamer", commune: "Mamer", system: "PAC collective", year: 2025, image: "https://picsum.photos/seed/proj10/600/800" },
  { id: "demo-11", category: "Villas", title: "Maison · Bettembourg", commune: "Bettembourg", system: "Remplacement chaudière", year: 2024, image: "https://picsum.photos/seed/proj11/600/800" },
  { id: "demo-12", category: "Industrie", title: "Atelier · Sanem", commune: "Sanem", system: "Aérothermes industriels", year: 2023, image: "https://picsum.photos/seed/proj12/600/800" },
];

/* ────────────────────────────── Témoignages ───────────────────────────── */

export interface DemoTestimonial {
  id: string;
  rating: 1 | 2 | 3 | 4 | 5;
  quote: string;
  /** Prénom + commune uniquement — AUCUNE marque/plateforme tierce. */
  author: string;
}

/**
 * [DEMO] 6 avis fictifs. À remplacer par de vrais avis collectés via le
 * pipeline NPS interne ou Google Business Profile.
 * ⚠️ Ne JAMAIS habiller ces cartes d'un logo « Google » en production.
 */
export const TESTIMONIALS: DemoTestimonial[] = [
  { id: "demo-t1", rating: 5, quote: "Installation impeccable et dossier de primes géré de bout en bout. Équipe ponctuelle et soignée.", author: "Sophie, Strassen" },
  { id: "demo-t2", rating: 5, quote: "Conseil honnête sur le dimensionnement de la pompe à chaleur. Aucune sur-vente.", author: "Marc, Esch-sur-Alzette" },
  { id: "demo-t3", rating: 5, quote: "Dépannage rapide en plein hiver. On sent les 30 ans de métier.", author: "Anne, Mersch" },
  { id: "demo-t4", rating: 5, quote: "Devis clair et délais tenus. Le chantier est resté propre du début à la fin.", author: "Jean, Bertrange" },
  { id: "demo-t5", rating: 5, quote: "Très bon accompagnement pour le Klimabonus, on n'a eu aucune paperasse à gérer.", author: "Carla, Dudelange" },
  { id: "demo-t6", rating: 5, quote: "Suivi sérieux après l'installation. Une vraie maison locale de confiance.", author: "Pierre, Mamer" },
];

/* ────────────────────────────────── Équipe ────────────────────────────── */

export interface DemoTeamMember {
  id: string;
  /** [DEMO] — à remplacer par le vrai nom (direction réelle : Almeida / Battista…). */
  name: string;
  role: string;
  photo: string;
}

/** [DEMO] 6 membres fictifs — noms & photos placeholder. */
export const TEAM: DemoTeamMember[] = [
  { id: "demo-m1", name: "[Prénom Nom]", role: "Direction technique", photo: "https://picsum.photos/seed/team1/400/400" },
  { id: "demo-m2", name: "[Prénom Nom]", role: "Chef de chantier", photo: "https://picsum.photos/seed/team2/400/400" },
  { id: "demo-m3", name: "[Prénom Nom]", role: "Frigoriste", photo: "https://picsum.photos/seed/team3/400/400" },
  { id: "demo-m4", name: "[Prénom Nom]", role: "Bureau d'études", photo: "https://picsum.photos/seed/team4/400/400" },
  { id: "demo-m5", name: "[Prénom Nom]", role: "Technicien SAV", photo: "https://picsum.photos/seed/team5/400/400" },
  { id: "demo-m6", name: "[Prénom Nom]", role: "Apprenti", photo: "https://picsum.photos/seed/team6/400/400" },
];

/* ─────────────────────────── Références promoteurs ─────────────────────── */

export interface DemoPromoterRef {
  id: string;
  label: string;
  commune: string;
}

/** [DEMO] 3 références B2B fictives. */
export const PROMOTER_REFS: DemoPromoterRef[] = [
  { id: "demo-p1", label: "Réf. immeuble", commune: "Esch-sur-Alzette" },
  { id: "demo-p2", label: "Résidence", commune: "Luxembourg" },
  { id: "demo-p3", label: "Tertiaire", commune: "Contern" },
];

/* ───────────────────────────── Zones desservies ───────────────────────── */

/**
 * Communes desservies (SEO local). Noms factuels — à CONFIRMER avec le client
 * pour la couverture exacte (ce ne sont pas des données « inventées », mais la
 * liste doit être validée avant publication).
 */
export const SERVICE_ZONES: string[] = [
  "Luxembourg-Ville",
  "Esch-sur-Alzette",
  "Mersch",
  "Ettelbruck",
  "Differdange",
  "Dudelange",
  "Grande Région",
];
