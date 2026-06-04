/**
 * Conformité réglementaire HVAC Luxembourg — données officielles 2026.
 *
 * Sources primaires citées :
 *   - https://legilux.public.lu/
 *   - https://environnement.public.lu/
 *   - https://klima-agence.lu/
 *   - https://www.cdm.lu/scrb/ (Chambre des Métiers — SCRB)
 *   - https://pfi.public.lu/
 *   - https://eur-lex.europa.eu/
 *
 * Discipline : on cite les textes (RGD, lois, règlements UE) avec leurs URL.
 * Les zones d'ombre sont identifiées explicitement comme « à confirmer ».
 */

export type ConformiteRule = {
  id: string;
  category:
    | "inspection"
    | "fluides"
    | "etancheite"
    | "blower-door"
    | "pose"
    | "fiscalite";
  title: string;
  obligation: string;
  legalSource: {
    label: string;
    url: string;
  }[];
  details: string[];
  certifyingBodies?: string[];
  sanctions?: string;
};

export const CONFORMITE_RULES: ConformiteRule[] = [
  {
    id: "inspection-chaudieres",
    category: "inspection",
    title: "Inspection périodique des chaudières",
    obligation:
      "L'inspection périodique est obligatoire au Luxembourg — la fréquence dépend du combustible. L'entretien annuel relève de la bonne pratique et des contrats d'assurance, pas d'une obligation légale unique.",
    legalSource: [
      {
        label: "RGD du 27 février 2010 — installations à gaz (4 kW à 3 MW)",
        url: "https://legilux.public.lu/eli/etat/leg/rgd/2010/02/27/n2/jo",
      },
      {
        label: "RGD du 7 octobre 2014 — installations solides / liquides (7 kW à 20 MW)",
        url: "https://environnement.public.lu/fr/emweltprozeduren/inspections-evaluation/Installations_de_chauffage.html",
      },
    ],
    details: [
      "Combustibles solides ou liquides (mazout, bois, pellets) : inspection tous les 2 ans",
      "Combustibles gaz : inspection tous les 4 ans",
      "Inspecteur : installateur titulaire du certificat de contrôleur SCRB (Chambre des Métiers)",
      "Réception d'installation neuve : demande à déposer dans les 3 mois suivant la mise en service",
      "Responsabilité : exploitant (propriétaire occupant, ou bailleur en collectif)",
    ],
    certifyingBodies: ["Service Contrôle Réception Bâtiments (SCRB) — Chambre des Métiers"],
    sanctions:
      "Pas d'amende administrative chiffrée dans les textes. En pratique : mise hors service en cas de réception négative, refus de couverture assurance en cas d'accident (CO, incendie), responsabilité civile engagée.",
  },
  {
    id: "fluides-frigorigenes",
    category: "fluides",
    title: "Attestation d'aptitude fluides frigorigènes — catégorie I",
    obligation:
      "Toute intervention sur des équipements contenant des gaz à effet de serre fluorés (HFC/HFO) — climatisation, pompes à chaleur, frigorifique fixe — exige un personnel certifié catégorie I ET une entreprise elle-même certifiée. La catégorie I couvre toutes les opérations sans limite de charge.",
    legalSource: [
      {
        label: "Règlement (UE) 2024/573 — gaz à effet de serre fluorés (F-Gas III)",
        url: "https://eur-lex.europa.eu/eli/reg/2024/573/oj",
      },
      {
        label: "Fiche certification — Administration de l'environnement",
        url: "https://environnement.public.lu/fr/emweltprozeduren/Aides/certification-ges-fluores.html",
      },
    ],
    details: [
      "Entré en application le 11 mars 2024, abroge le règlement (UE) 517/2014",
      "Directement applicable au Luxembourg, sans transposition nationale",
      "Reconnaissance UE : certificats d'un autre État membre acceptés au LU (copie + traduction FR/DE à l'Administration)",
      "Recyclage périodique de la certification prévu par F-Gas III (typiquement 7 ans)",
    ],
    certifyingBodies: [
      "Centre de Compétences – Génie Technique du Bâtiment (CDC-GTB) à Bettembourg — formation FRIG-3-007-1 (40h)",
      "Isocert Lux S.A. à Livange",
    ],
    sanctions:
      "Interdiction d'activité par l'Administration de l'environnement. Ventes de fluides interdites aux opérateurs non-certifiés. Sanctions pénales et civiles selon loi-cadre de transposition.",
  },
  {
    id: "controle-etancheite",
    category: "etancheite",
    title: "Contrôle d'étanchéité — climatisation, PAC, frigorifique",
    obligation:
      "Contrôles d'étanchéité périodiques obligatoires sur tout équipement contenant des HFC. Seuils désormais exprimés en tonnes équivalent CO2 (et non en kg) depuis F-Gas III.",
    legalSource: [
      {
        label: "Règlement (UE) 2024/573 — F-Gas III",
        url: "https://eur-lex.europa.eu/eli/reg/2024/573/oj",
      },
      {
        label: "Contrôles d'étanchéité — environnement.public.lu",
        url: "https://environnement.public.lu/fr/emweltprozeduren/inspections-evaluation/controles-etancheite.html",
      },
    ],
    details: [
      "5 à 50 t CO2 eq : tous les 12 mois (24 mois avec détection automatique)",
      "50 à 500 t CO2 eq : tous les 6 mois (12 mois avec détection)",
      "≥ 500 t CO2 eq : tous les 3 mois (6 mois avec détection)",
      "Détection automatique obligatoire à partir de 500 t CO2 eq",
      "Exemption : équipements hermétiquement scellés < 10 t CO2 eq",
      "Déclaration annuelle obligatoire avant le 31 mars de chaque année à l'Administration",
      "Tenue d'un registre interne des contrôles par l'entreprise",
    ],
    sanctions:
      "Mise en demeure, suspension du certificat entreprise par l'Administration de l'environnement.",
  },
  {
    id: "blower-door",
    category: "blower-door",
    title: "Test Blower Door — étanchéité à l'air (DIN ISO 9972)",
    obligation:
      "Obligatoire pour toute construction résidentielle neuve au Luxembourg depuis le 1er janvier 2015. Depuis 2026, toute construction neuve doit atteindre la classe AAA (passif) avec n50 < 0,6 /h.",
    legalSource: [
      {
        label: "Renov.lu — Étanchéité à l'air Blower Door",
        url: "https://renov.lu/etancheite-air-blower-door-test/",
      },
      {
        label: "Norme DIN ISO 9972 — méthode A",
        url: "https://www.iso.org/standard/55718.html",
      },
    ],
    details: [
      "BBB (basse énergie) : n50 < 1,0 /h",
      "AAA (passif) : n50 < 0,6 /h",
      "Test reconnu uniquement si réalisé par bureau certifié FLIB",
      "Norme de référence : DIN ISO 9972 méthode A",
      "Recommandé en rénovation avec VMC double flux pour valider l'enveloppe avant pose",
    ],
    certifyingBodies: [
      "FLIB — Fachverband Luftdichtheit im Bauwesen (organisme allemand reconnu au LU)",
    ],
    sanctions:
      "Sans test conforme, l'Energiepass ne peut être délivré → blocage de la réception du bâtiment et de toute aide Klimabonus.",
  },
  {
    id: "reception-pose-gaz",
    category: "pose",
    title: "Réception SCRB — pose chaudières et installations à gaz",
    obligation:
      "Toute installation gaz neuve doit être posée par une entreprise établie comme installateur chauffage-sanitaire (droit d'établissement) puis réceptionnée par le SCRB de la Chambre des Métiers dans les 4 semaines suivant la mise en service.",
    legalSource: [
      {
        label: "RGD du 27 février 2010 modifié — installations à gaz",
        url: "https://legilux.public.lu/eli/etat/leg/rgd/2010/02/27/n2/jo",
      },
      {
        label: "Contrôle installations bâtiment — Chambre des Métiers",
        url: "https://www.cdm.lu/scrb/controle-des-installations-du-batiment-particuliers",
      },
    ],
    details: [
      "Entreprise titulaire de l'autorisation d'établissement (qualification installateur chauffage-sanitaire)",
      "Assurance RC professionnelle couvrant le Luxembourg",
      "Demande de réception à déposer dans les 4 semaines",
      "Réception négative : mise hors service immédiate par l'agent",
      "Réception conditionnelle : délai de 1 mois (corrections simples) à 3 mois (transformations majeures)",
    ],
    certifyingBodies: ["Service Contrôle Réception Bâtiments (SCRB) — Chambre des Métiers"],
  },
  {
    id: "tva-3-pourcent",
    category: "fiscalite",
    title: "TVA logement à 3 % — rénovation et création",
    obligation:
      "Taux super-réduit de 3 % au lieu de 17 % sur création et rénovation de logements affectés à l'habitation principale. Important : le seuil d'ancienneté du logement pour la rénovation est à confirmer auprès de l'AED — les sources publiées en 2026 donnent des informations divergentes (10 vs 20 ans selon les fiches).",
    legalSource: [
      {
        label: "Loi du 12 février 1979 modifiée — TVA, article 44ter",
        url: "https://pfi.public.lu/fr/citoyen/tva/logement.html",
      },
      {
        label: "RGD du 30 juillet 2002 modifié — conditions d'application",
        url: "https://pfi.public.lu/fr/citoyen/tva/logement/application-directe-taux-3.html",
      },
    ],
    details: [
      "Affectation : habitation principale (personnelle pour création, directe ou indirecte pour rénovation)",
      "Surface habitable ≤ 400 m² (au-delà : application au prorata)",
      "Plafond de faveur fiscale : 50 000 € maximum par logement",
      "Durée d'affectation : minimum 2 ans d'habitation principale à compter du 1er janvier suivant l'achèvement",
      "Autorisation préalable AED OBLIGATOIRE avant début des travaux ou signature acte VEFA",
      "Seuil d'ancienneté pour rénovation : à confirmer sur fiche AED 2026 (sources divergentes 10 / 20 ans)",
    ],
    sanctions:
      "Restitution intégrale de la faveur fiscale avec intérêts légaux en cas de non-respect de la condition d'affectation 2 ans.",
  },
  {
    id: "bellegen-akt",
    category: "fiscalite",
    title: "Bëllegen Akt — crédit d'impôt droits d'enregistrement",
    obligation:
      "Crédit d'impôt de 40 000 € par acquéreur sur les droits d'enregistrement et de transcription lors de l'acquisition d'un logement en résidence principale.",
    legalSource: [
      {
        label: "Loi modifiée du 30 juillet 2002 — diverses mesures fiscales",
        url: "https://logement.public.lu/fr/proprietaire/fiscalit/credit-impot-actes-notariaux-bellegen-akt.html",
      },
      {
        label: "Crédit d'impôt actes notariés — Guichet",
        url: "https://guichet.public.lu/fr/citoyens/aides/logement-construction/aides-indirectes/credit-impot-actes-notaries.html",
      },
      {
        label: "Loi du 3 juillet 2025 — pérennisation du plafond à 40 000 €",
        url: "https://pfi.public.lu/fr/citoyen/enregistrement/credit-impot.html",
      },
    ],
    details: [
      "Montant 2026 : 40 000 € par acquéreur (pérennisé par loi du 3 juillet 2025)",
      "Affectation : habitation principale, personnelle et effective",
      "Occupation dans les 2 ans (4 ans pour terrain à bâtir ou VEFA)",
      "Occupation continue minimum 2 ans",
      "Minimum perçu par l'AED : 100 € de droits",
      "Pas de condition de fortune, de revenu ni de valeur du bien",
      "Demande introduite par le notaire au moment de l'acte",
    ],
    sanctions:
      "Restitution intégrale avec intérêts légaux en cas de revente, location ou vacance avant la fin des 2 ans d'occupation.",
  },
];

export const CATEGORY_LABELS: Record<ConformiteRule["category"], string> = {
  inspection: "Inspection chaudières",
  fluides: "Fluides frigorigènes",
  etancheite: "Étanchéité climatisation",
  "blower-door": "Étanchéité à l'air bâtiment",
  pose: "Pose et réception",
  fiscalite: "Fiscalité logement",
};
