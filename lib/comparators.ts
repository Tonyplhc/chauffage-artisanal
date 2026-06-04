import type { Scenario } from "@/components/system-comparator";

/**
 * Bibliothèque de scénarios de comparaison avant/après par service.
 *
 * Discipline : aucun chiffre marketing — uniquement des évaluations qualitatives
 * sur des dimensions standard (rendement, émissions CO2, bruit, maintenance,
 * autonomie). Les notes 0-5 sont indicatives, basées sur les ordres de grandeur
 * du marché ; à valider client par client.
 */

export const COMPARATORS_CHAUFFAGE: Scenario[] = [
  {
    id: "fioul-condensation",
    label: "Fioul → Condensation",
    before: { title: "Chaudière fioul ancienne", subtitle: "20+ ans, dimensionnement par défaut" },
    after: { title: "Chaudière gaz à condensation", subtitle: "Dimensionnée par étude" },
    dimensions: [
      { label: "Rendement saisonnier", before: 2, after: 4 },
      { label: "Émissions CO₂", before: 1, after: 3 },
      { label: "Maintenance attendue", before: 2, after: 4 },
      { label: "Niveau sonore", before: 3, after: 4 },
      { label: "Indépendance approvisionnement", before: 2, after: 3 },
    ],
    takeaways: [
      "Sortie d'une énergie fossile lourde",
      "Plus de stockage de fioul (citerne libérée)",
      "Maintenance simplifiée et standardisée",
      "Préparation à un futur passage en PAC ou hybride",
    ],
  },
  {
    id: "gaz-ancienne-hybride",
    label: "Gaz ancien → Hybride",
    before: { title: "Chaudière gaz ancienne", subtitle: "15+ ans, non-condensation" },
    after: { title: "Système hybride PAC + gaz", subtitle: "Bascule automatique optimisée" },
    dimensions: [
      { label: "Rendement saisonnier", before: 2, after: 4 },
      { label: "Émissions CO₂", before: 3, after: 4 },
      { label: "Coût d'exploitation", before: 2, after: 4 },
      { label: "Confort thermique", before: 3, after: 5 },
      { label: "Évolutivité (vers tout-électrique)", before: 1, after: 4 },
    ],
    takeaways: [
      "Majeure partie de l'énergie en PAC, gaz uniquement sur les pics",
      "Pas de travaux lourds sur le réseau d'émetteurs existant",
      "Décarbonation progressive, sans rupture brutale",
      "Pilotage intelligent selon coût marginal de l'énergie",
    ],
  },
];

export const COMPARATORS_PAC: Scenario[] = [
  {
    id: "chaudiere-pac-eau",
    label: "Chaudière → PAC air/eau",
    before: { title: "Chaudière classique", subtitle: "Gaz / fioul, sans modulation fine" },
    after: { title: "Pompe à chaleur air/eau", subtitle: "Dimensionnée par étude" },
    dimensions: [
      { label: "Rendement (COP saisonnier)", before: 2, after: 4 },
      { label: "Émissions CO₂", before: 2, after: 4 },
      { label: "Couplage solaire possible", before: 1, after: 5 },
      { label: "Maintenance annuelle", before: 3, after: 4 },
      { label: "Confort thermique", before: 3, after: 4 },
    ],
    takeaways: [
      "Forte décarbonation (électricité vs combustible fossile)",
      "Compatible avec photovoltaïque pour autoconsommation",
      "Suppression du stockage de combustible",
      "Maintenance simplifiée — pas de combustion à contrôler",
    ],
  },
  {
    id: "convecteur-pac-air-air",
    label: "Convecteurs → PAC air/air",
    before: { title: "Convecteurs électriques", subtitle: "Chauffage direct par effet Joule" },
    after: { title: "PAC air/air multi-split", subtitle: "Réversible chaud/froid" },
    dimensions: [
      { label: "Rendement énergétique", before: 1, after: 4 },
      { label: "Confort hiver", before: 2, after: 4 },
      { label: "Confort été (rafraîchissement)", before: 1, after: 5 },
      { label: "Coût d'exploitation", before: 1, after: 4 },
      { label: "Intégration esthétique", before: 3, after: 4 },
    ],
    takeaways: [
      "Diviser la facture de chauffage par 2 à 3 selon usage",
      "Rafraîchissement en été inclus (réversibilité)",
      "Bonne solution rénovation en logement collectif sans toucher au réseau d'eau",
      "Sans modification des émetteurs eau chaude existants",
    ],
  },
];

export const COMPARATORS_CLIM: Scenario[] = [
  {
    id: "sans-clim-multi-split",
    label: "Sans clim → Multi-split",
    before: { title: "Pas de climatisation", subtitle: "Logement neuf bien isolé" },
    after: { title: "Climatisation multi-split réversible", subtitle: "Intégration discrète" },
    dimensions: [
      { label: "Confort été", before: 1, after: 5 },
      { label: "Confort hiver (appoint)", before: 3, after: 4 },
      { label: "Niveau sonore", before: 5, after: 4 },
      { label: "Conso énergétique", before: 5, after: 3 },
      { label: "Maintenance attendue", before: 5, after: 3 },
    ],
    takeaways: [
      "Régulation fine pièce par pièce",
      "Appoint chauffage en mi-saison (réversibilité)",
      "Filtration de l'air (selon gamme)",
      "Conformité F-Gas gérée par contrat",
    ],
  },
];

export const COMPARATORS_SANITAIRE: Scenario[] = [
  {
    id: "salle-bain-standard-premium",
    label: "Standard → Premium",
    before: { title: "Salle de bain années 90", subtitle: "Robinetterie standard, étanchéité d'origine" },
    after: { title: "Rénovation premium avec architecte", subtitle: "Étanchéité PV, robinetterie design" },
    dimensions: [
      { label: "Confort thermique", before: 2, after: 5 },
      { label: "Durabilité étanchéité", before: 2, after: 5 },
      { label: "Qualité de l'eau", before: 3, after: 4 },
      { label: "Intégration architecturale", before: 2, after: 5 },
      { label: "Valorisation du logement", before: 2, after: 4 },
    ],
    takeaways: [
      "Plancher chauffant intégré, confort homogène",
      "Étanchéité contrôlée au PV avant carrelage",
      "Sélection robinetterie design (Dornbracht, Hansgrohe, Vola, etc.)",
      "Coordination chantier avec architecte d'intérieur",
    ],
  },
];

export const COMPARATORS_ENR: Scenario[] = [
  {
    id: "tout-reseau-pv-autoconso",
    label: "Tout réseau → PV + autoconso",
    before: { title: "Achat 100% réseau", subtitle: "Tarif marché complet" },
    after: { title: "Photovoltaïque + autoconsommation", subtitle: "Dimensionné par étude" },
    dimensions: [
      { label: "Indépendance énergétique", before: 1, after: 4 },
      { label: "Émissions CO₂ (chauffage)", before: 2, after: 4 },
      { label: "Couplage PAC envisageable", before: 1, after: 5 },
      { label: "Visibilité de la consommation", before: 2, after: 5 },
      { label: "Évolutivité (stockage, VE)", before: 2, after: 5 },
    ],
    takeaways: [
      "Production locale d'électricité",
      "Couplage PAC pour maximiser l'auto-consommation",
      "Préparation à l'ajout d'une borne VE",
      "Monitoring de production en temps réel",
    ],
  },
];

export const COMPARATORS_ENTRETIEN: Scenario[] = [
  {
    id: "sans-contrat-formule-confort",
    label: "Sans contrat → Formule confort",
    before: { title: "Sans contrat d'entretien", subtitle: "Intervention à la demande" },
    after: { title: "Formule confort annuelle", subtitle: "Visite + pièces d'usure" },
    dimensions: [
      { label: "Durée de vie équipement", before: 2, after: 4 },
      { label: "Priorité dépannage", before: 2, after: 5 },
      { label: "Conformité réglementaire", before: 2, after: 5 },
      { label: "Prévisibilité du coût", before: 2, after: 4 },
      { label: "Détection précoce", before: 1, after: 4 },
    ],
    takeaways: [
      "Visite annuelle + attestation conformité",
      "Pièces d'usure incluses selon liste contractuelle",
      "Priorité d'intervention en cas de dépannage",
      "Pas de mauvaise surprise budgétaire",
    ],
  },
];
