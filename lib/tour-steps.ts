/**
 * Étapes du tour interactif admin (W33.4).
 *
 * 8 étapes qui couvrent les features les plus impressionnantes pour un
 * prospect. Chaque étape : un titre, un corps explicatif, une page cible
 * (où l'utilisateur sera redirigé), et un éventuel sélecteur DOM à mettre
 * en avant.
 *
 * Le tour est piloté par `components/admin/tour-overlay.tsx` qui :
 *   - lit `localStorage["ca-tour-step"]` au démarrage
 *   - navigue sur `path` quand on clique "Suivant"
 *   - met en avant l'élément `anchorSelector` si présent (scrollIntoView + halo)
 *
 * Persistance : étape courante dans localStorage. Si l'utilisateur ferme,
 * il peut reprendre où il en est via le bouton "Reprendre le tour" sur
 * `/admin/guide`.
 */

export type TourStep = {
  id: string;
  title: string;
  body: string;
  /** Page sur laquelle cette étape doit s'afficher. */
  path: string;
  /** Sélecteur CSS optionnel à scroller / mettre en avant. */
  anchorSelector?: string;
  /** Conseil concret d'action à faire pendant cette étape. */
  hint?: string;
};

export const TOUR_STEPS: TourStep[] = [
  {
    id: "intro-pipeline",
    title: "Bienvenue dans votre pipeline",
    body:
      "Cette page est votre QG quotidien. Tous les leads, triables, filtrables, avec leur score automatique. C'est ici qu'on passe le plus de temps : on va explorer les blocs qui font gagner de l'argent.",
    path: "/admin/leads",
    hint:
      "Repérez la barre d'outils en haut : ce sont les raccourcis vers les tableaux de bord. On va en visiter 7 dans les prochaines étapes.",
  },
  {
    id: "fiche-lead-360",
    title: "Une fiche lead, tout en un",
    body:
      "Ouvrez n'importe quel lead. Sur une seule page : score, timeline, next best action, suggestions techniciens, brouillons d'emails, devis, factures, équipements installés, conformité RGPD. Pas de bascule entre 10 outils.",
    path: "/admin/leads",
    hint:
      "Cliquez sur n'importe quelle ligne du pipeline pour voir la fiche détaillée — puis revenez ici via 'Retour pipeline'.",
  },
  {
    id: "forecast-saisonnier",
    title: "Forecast saisonnier sur vos données",
    body:
      "Projection des leads, conversions et CA sur les prochains mois. Calculé depuis VOTRE historique réel — pas un modèle générique. Tendance + index de saisonnalité, avec une bande d'incertitude honnête.",
    path: "/admin/forecast",
    anchorSelector: "main h1",
    hint:
      "Le bandeau d'index saisonnier en haut montre quels mois sont historiquement forts. Pratique pour planifier l'embauche saisonnière.",
  },
  {
    id: "pricing-intelligence",
    title: "Pricing intelligence",
    body:
      "Vos prix moyens par segment (service × type de bâtiment), avec coefficient de variation et détection des devis aberrants (à plus de 1.5σ de la moyenne). Une boussole pour ne plus vendre au pif.",
    path: "/admin/pricing",
    anchorSelector: "main h1",
    hint:
      "Plus le CV (coefficient de variation) est bas, plus vos prix sont cohérents sur ce segment. Au-delà de 50%, il y a probablement un sujet à investiguer.",
  },
  {
    id: "heatmap-geo",
    title: "Heat map géographique",
    body:
      "Pipeline ouvert + CA réalisé par commune. Identifie vos zones premium (forte valeur, forte conversion) et vos opportunités sous-exploitées (volume mais faible deal moyen).",
    path: "/admin/geo-pipeline",
    anchorSelector: "main h1",
    hint:
      "Triez par 'Forecast pondéré' pour voir les communes qui rapportent le plus dans le pipeline ouvert.",
  },
  {
    id: "tenants-white-label",
    title: "Multi-marque white-label",
    body:
      "Si vous gérez plusieurs marques (groupe, marque blanche pour un confrère), tout est ici. Chaque marque a son branding, ses informations légales, son cookie de sélection.",
    path: "/admin/tenants",
    anchorSelector: "main h1",
    hint:
      "Au démarrage, créez une marque par défaut avec vos vraies coordonnées. Les autres viennent plus tard si besoin.",
  },
  {
    id: "rgpd-conformite",
    title: "Conformité RGPD documentée",
    body:
      "Registre des traitements, droits des personnes, métriques d'usage (exports, suppressions, leads anciens). Imprimable pour archive — preuve à présenter à la CNPD si demande.",
    path: "/admin/rgpd",
    anchorSelector: "main h1",
    hint:
      "Lisez les 'recommandations' en haut : l'outil détecte automatiquement ce qui mérite votre attention (leads non purgés, contact RGPD manquant…).",
  },
  {
    id: "knowledge-base",
    title: "Base de connaissance interne",
    body:
      "Tout ce que votre équipe doit savoir au même endroit : procédures, fiches produits, FAQ techniques. Construite par vous, accessible par eux. Évite de répéter 100 fois la même réponse.",
    path: "/admin/kb",
    anchorSelector: "main h1",
    hint:
      "Le moteur de recherche global (Ctrl+K) cherche aussi dans la KB. Plus elle est nourrie, plus l'équipe est autonome.",
  },
];

export const TOUR_STORAGE_KEY = "ca-tour-step";
export const TOUR_DISMISSED_KEY = "ca-tour-dismissed";
