/**
 * Barèmes Klimabonus 2026 — montants officiels vérifiés.
 *
 * Sources primaires (06.01.2026) :
 *   - https://guichet.public.lu/fr/citoyens/aides/logement-construction/klimabonus-2026/aide-installations-techniques.html
 *   - https://guichet.public.lu/fr/citoyens/aides/logement-construction/klimabonus-2026/renovation-energetique-logement-sans-conseil-energie.html
 *   - https://gouvernement.lu/fr/actualites/toutes_actualites/communiques/2025/12-decembre/31-prolongation-klimabonus.html
 *
 * Cadre légal : régime applicable aux factures du 01.01.2026 au 31.12.2035,
 * première demande d'accord de principe avant le 31.12.2030.
 *
 * Discipline : on N'affiche QUE ce qui est confirmé sur guichet.public.lu.
 * Les forfaits VMC double flux et chauffe-eau thermodynamique 2026 n'étaient
 * pas publiés au Mémorial à la date de référence — on indique « à confirmer »
 * et on renvoie vers le simulateur Klima-Agence.
 */

export type KlimabonusBareme = {
  id: string;
  label: string;
  /** Montant forfaitaire si simple, ou description si complexe. */
  amount: string;
  /** Détails par contexte (résidentiel unifamilial / collectif / neuf). */
  details: { context: string; amount: string }[];
  conditions: string[];
  /** Bonus cumulables sur ce barème. */
  bonuses?: string[];
  /** "confirmé" si publié au Mémorial, "à confirmer" sinon. */
  status: "confirmé" | "à confirmer";
  source: string;
  lastUpdated: string;
};

export const KLIMABONUS_BAREMES: KlimabonusBareme[] = [
  {
    id: "pac-air-eau",
    label: "Pompe à chaleur air/eau",
    amount: "jusqu'à 10 000 €",
    details: [
      {
        context: "Logement unifamilial existant, remplacement chaudière fossile",
        amount: "10 000 €",
      },
      {
        context: "Logement unifamilial existant, sans remplacement fossile",
        amount: "6 000 €",
      },
      {
        context: "Logement collectif existant, avec remplacement fossile",
        amount: "8 000 € / logement (plafond 24 000 €)",
      },
      {
        context: "Construction neuve unifamiliale",
        amount: "3 000 €",
      },
      {
        context: "Construction neuve collective",
        amount: "2 000 € / logement (plafond 10 000 €)",
      },
    ],
    conditions: [
      "Forfait indépendant de la puissance (réforme 2026)",
      "Installateur agréé Klima-Agence requis",
      "Accord de principe AVANT signature devis sur MyGuichet.lu",
      "Condition d'ancienneté de la chaudière supprimée en 2026",
    ],
    status: "confirmé",
    source:
      "https://guichet.public.lu/fr/citoyens/aides/logement-construction/klimabonus-2026/aide-installations-techniques.html",
    lastUpdated: "2026-01-06",
  },
  {
    id: "pac-geothermique",
    label: "Pompe à chaleur géothermique (sol/eau)",
    amount: "jusqu'à 12 000 €",
    details: [
      {
        context: "Logement unifamilial existant, remplacement chaudière fossile",
        amount: "12 000 €",
      },
      {
        context: "Logement unifamilial existant, sans remplacement fossile",
        amount: "8 000 €",
      },
      {
        context: "Logement collectif existant, avec remplacement fossile",
        amount: "10 000 € / logement (plafond 50 000 €)",
      },
    ],
    conditions: [
      "Forfait indépendant de la puissance",
      "Installateur et entreprise de forage agréés",
      "Accord de principe AVANT signature devis",
    ],
    status: "confirmé",
    source:
      "https://guichet.public.lu/fr/citoyens/aides/logement-construction/klimabonus-2026/aide-installations-techniques.html",
    lastUpdated: "2026-01-06",
  },
  {
    id: "biomasse",
    label: "Chaudière biomasse (pellets / granulés)",
    amount: "jusqu'à 8 000 €",
    details: [
      {
        context: "Chaudière granulés unifamilial, remplacement fossile",
        amount: "8 000 €",
      },
      {
        context: "Chaudière granulés unifamilial, sans remplacement fossile",
        amount: "4 000 €",
      },
      {
        context: "Chaudière granulés collectif",
        amount: "6 000 € / logement (plafond 40 000 €)",
      },
      {
        context: "Poêle à granulés avec filtre",
        amount: "3 000 € ou 50 % du coût",
      },
      {
        context: "Poêle à bûches (sans chauffage central)",
        amount: "2 500 € ou 50 % du coût",
      },
    ],
    conditions: [
      "Toujours éligible en 2026 (à surveiller — directive RED européenne)",
      "Installateur agréé Klima-Agence",
      "Test combustion + émissions à fournir",
    ],
    bonuses: ["+15 % si réservoir tampon installé"],
    status: "confirmé",
    source:
      "https://guichet.public.lu/fr/citoyens/aides/logement-construction/klimabonus-2026/aide-installations-techniques.html",
    lastUpdated: "2026-01-06",
  },
  {
    id: "solaire-thermique",
    label: "Solaire thermique (ECS / chauffage)",
    amount: "jusqu'à 4 000 €",
    details: [
      {
        context: "ECS seule, unifamilial existant",
        amount: "2 500 €",
      },
      {
        context: "ECS seule, collectif existant",
        amount: "2 000 € / logement (plafond 14 000 €)",
      },
      {
        context: "ECS + appoint chauffage, unifamilial existant",
        amount: "4 000 €",
      },
      {
        context: "ECS + appoint chauffage, collectif existant",
        amount: "3 500 € / logement (plafond 17 500 €)",
      },
    ],
    conditions: [
      "Uniquement logement existant (aide supprimée en construction neuve depuis 01.01.2026)",
      "Installateur et capteurs certifiés",
    ],
    bonuses: ["+1 000 € si combiné avec chaudière bois ou pompe à chaleur"],
    status: "confirmé",
    source:
      "https://guichet.public.lu/fr/citoyens/aides/logement-construction/klimabonus-2026/aide-installations-techniques.html",
    lastUpdated: "2026-01-06",
  },
  {
    id: "photovoltaique",
    label: "Photovoltaïque autoconsommation",
    amount: "jusqu'à 10 000 € + 2 250 € batterie",
    details: [
      {
        context: "Calcul prime PV (€)",
        amount: "Puissance × (1 155 − 1 155/35 × Puissance), plafond 10 000 € atteint à 15 kWc",
      },
      {
        context: "Puissance minimale éligible",
        amount: "2 kWc",
      },
      {
        context: "Stockage batterie (€)",
        amount: "Capacité × (500 − 500/18 × Capacité), plafond 2 250 € à 9 kWh",
      },
      {
        context: "Batterie : capacité minimale",
        amount: "2 kWh, nécessite PV ≥ 2 kWc",
      },
    ],
    conditions: [
      "Préfinancement automatique depuis 04.01.2026 (déduit de la facture installateur)",
      "Installateur agréé Klima-Agence",
    ],
    status: "confirmé",
    source:
      "https://guichet.public.lu/fr/citoyens/aides/logement-construction/klimabonus-2026/aide-installations-techniques.html",
    lastUpdated: "2026-01-06",
  },
  {
    id: "isolation-exterieure",
    label: "Isolation thermique extérieure (mur, toiture, dalle)",
    amount: "35 à 115 €/m²",
    details: [
      {
        context: "Matériau écologique (niveau I à III)",
        amount: "90 à 115 €/m²",
      },
      {
        context: "Matériau minéral",
        amount: "60 à 85 €/m²",
      },
      {
        context: "Matériau fossile / recyclé",
        amount: "35 à 60 €/m²",
      },
    ],
    conditions: [
      "Logement > 10 ans (date du permis de construire)",
      "Entreprise agréée OU accompagnement conseiller énergie (400 € + 100 € vérif)",
      "U-values maximales et épaisseurs minimales à respecter",
      "Accord de principe avant travaux",
    ],
    bonuses: [
      "+15 €/m² isolant minéral recyclé",
      "+15 €/m² écologique sourcing durable",
      "+15 €/m² toiture/façade végétalisée",
      "Cumul des bonus possible",
    ],
    status: "confirmé",
    source:
      "https://guichet.public.lu/fr/citoyens/aides/logement-construction/klimabonus-2026/renovation-energetique-logement-sans-conseil-energie.html",
    lastUpdated: "2026-01-06",
  },
  {
    id: "isolation-interieure",
    label: "Isolation thermique intérieure (zones non chauffées)",
    amount: "20 à 65 €/m²",
    details: [
      {
        context: "Matériau écologique",
        amount: "40 à 65 €/m²",
      },
      {
        context: "Matériau minéral",
        amount: "25 à 50 €/m²",
      },
      {
        context: "Matériau fossile / recyclé",
        amount: "20 à 45 €/m²",
      },
    ],
    conditions: [
      "Logement > 10 ans",
      "U-values + épaisseurs minimales à respecter",
    ],
    status: "confirmé",
    source:
      "https://guichet.public.lu/fr/citoyens/aides/logement-construction/klimabonus-2026/renovation-energetique-logement-sans-conseil-energie.html",
    lastUpdated: "2026-01-06",
  },
  {
    id: "fenetres",
    label: "Remplacement fenêtres (triple vitrage)",
    amount: "70 €/m² de vitrage",
    details: [
      {
        context: "Forfait unique par m² de surface vitrée",
        amount: "70 €/m²",
      },
    ],
    conditions: [
      "Logement > 10 ans",
      "Triple vitrage performant",
      "Entreprise agréée",
      "Accord de principe préalable",
    ],
    status: "confirmé",
    source:
      "https://guichet.public.lu/fr/citoyens/aides/logement-construction/klimabonus-2026/renovation-energetique-logement-sans-conseil-energie.html",
    lastUpdated: "2026-01-06",
  },
  {
    id: "chauffe-eau-thermo",
    label: "Chauffe-eau thermodynamique",
    amount: "À confirmer",
    details: [
      {
        context: "Statut 2026",
        amount: "Catégorie non publiée distinctement sur guichet.public.lu",
      },
    ],
    conditions: [
      "Forfait spécifique 2026 non publié au Mémorial à date",
      "Renvoyer le client vers le simulateur Klima-Agence pour confirmation",
    ],
    status: "à confirmer",
    source: "https://aides.klima-agence.lu/",
    lastUpdated: "2026-01-06",
  },
  {
    id: "vmc-double-flux",
    label: "VMC double flux à récupération de chaleur",
    amount: "À confirmer",
    details: [
      {
        context: "Statut 2026",
        amount: "Forfaits spécifiques non publiés au Mémorial à date",
      },
      {
        context: "Voie d'intégration",
        amount: "Inclus dans le calcul global rénovation énergétique avec conseil",
      },
    ],
    conditions: [
      "Test Blower Door (DIN ISO 9972) souvent requis",
      "Confirmation auprès de Klima-Agence avant chiffrage client",
    ],
    status: "à confirmer",
    source:
      "https://guichet.public.lu/fr/citoyens/aides/logement-construction/klimabonus-2026/renovation-energetique-logement.html",
    lastUpdated: "2026-01-06",
  },
];

/**
 * Conditions transverses critiques — à rappeler systématiquement au client.
 * Source : guichet.public.lu + communiqué gouvernement 31.12.2025.
 */
export const KLIMABONUS_RULES = [
  {
    title: "Accord de principe AVANT signature du devis",
    body: "Demande à déposer sur MyGuichet.lu avant tout engagement avec l'installateur. Aucune aide rétroactive — point bloquant client courant.",
  },
  {
    title: "Logement > 10 ans pour la plupart des aides rénovation",
    body: "Date de référence : permis de construire. Vérifiable sur les pages cadastre.lu.",
  },
  {
    title: "Installateur agréé Klima-Agence requis",
    body: "Tous les artisans HVAC luxembourgeois ne sont pas accrédités. Vérifiez l'enregistrement avant de promettre l'aide.",
  },
  {
    title: "Validité du régime",
    body: "Factures éligibles entre 01.01.2026 et 31.12.2035. Première demande d'accord avant 31.12.2030.",
  },
];

/**
 * Cumuls confirmés — points clés à signaler au client.
 */
export const KLIMABONUS_CUMULS = [
  {
    label: "Klimabonus + Enoprimes (CEE Enovos/Creos/SudEnergie)",
    body: "Cumul intégral confirmé.",
  },
  {
    label: "Klimabonus + aides communales (Klimapakt)",
    body: "Cumul total. Ville de Luxembourg ajoute jusqu'à +50 % du Klimabonus. Autres communes : 1 000 à 3 000 € forfaitaires selon règlement local.",
  },
  {
    label: "Klimabonus + TVA logement 3 %",
    body: "Cumulable. Nouveauté 2026 : seuil d'ancienneté abaissé de 20 à 10 ans.",
  },
  {
    label: "Klimabonus + Klimaprêt BCEE 1,5 %",
    body: "Prêt à taux bonifié sur la part résiduelle après aide.",
  },
  {
    label: "Klimabonus + Complément social",
    body: "Ménages à revenus modestes peuvent demander un complément qui peut doubler l'aide Klimabonus de base (Ministère du Logement).",
  },
];

/**
 * Nouveautés 2026 vs 2022 — argumentaires commerciaux factuels.
 */
export const KLIMABONUS_NEWS_2026 = [
  "TVA logement 3 % : seuil d'ancienneté abaissé de 20 à 10 ans",
  "PV : préfinancement automatique depuis le 04.01.2026 (aide déduite de la facture)",
  "Condition d'ancienneté de la chaudière supprimée pour les PAC",
  "Montants forfaitaires indépendants de la puissance des installations",
  "Aide HEMS (gestion d'énergie domestique) : 500 € à partir du 01.10.2026",
  "Solaire thermique supprimé en construction neuve",
];

export const KLIMABONUS_SOURCE_OFFICIAL = "https://guichet.public.lu/fr/citoyens/aides/logement-construction/klimabonus-2026/";
export const KLIMABONUS_HOTLINE = "(+352) 8002 1010";
export const KLIMABONUS_SIMULATOR = "https://aides.klima-agence.lu/";
