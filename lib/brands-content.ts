/**
 * Encyclopédie /marques — contenu éditorial pour les 9 marques partenaires.
 *
 * Stratégie SEO :
 *   - capter les requêtes "vaillant luxembourg", "installateur viessmann lux", etc.
 *   - autorité topique (Google E-E-A-T) en montrant que la maison maîtrise la
 *     gamme constructeur, les garanties, les modèles, les compatibilités
 *   - point de départ vers /devis avec pré-sélection de la marque souhaitée
 *
 * Discipline éditoriale :
 *   - on indique nos partenariats sans inventer de chiffres officiels
 *   - garanties = "selon programme constructeur" plutôt que "X années"
 *   - modèles phares = noms de gamme publics, pas de prix
 */

/**
 * Tier de prix d'une marque — orientation budgétaire indicative.
 *
 *   accessible : rapport qualité/prix solide, accessible aux petits budgets
 *                (Buderus, Atlantic, Bosch)
 *   standard   : milieu de gamme premium, équilibre prix/perf
 *                (Vaillant, Daikin, Mitsubishi, De Dietrich)
 *   premium    : haut de gamme, finitions, R&D avancée, prix supérieur
 *                (Viessmann, Hoval)
 */
export type PriceTier = "accessible" | "standard" | "premium";

export type Brand = {
  slug: string; // "vaillant", "viessmann", ...
  name: string; // "Vaillant"
  origin: string; // "Allemagne"
  since: string; // "1874" — année de fondation publique
  shortPitch: string; // 1 ligne pour le hub
  priceTier: PriceTier; // orientation budgétaire
  /**
   * Partenariat OFFICIEL revendiqué publiquement par Chauffage Artisanal
   * sur leur site / fiche Editus (vérifié par recherche). Distingue les
   * marques "documentées partenaires" des marques "couverture marché".
   *
   * Sources vérifiées :
   *   - Buderus : chauffage-artisanal.lu/chauffage-central-regulation/chaudiere-buderus/ + logo partenaire footer
   *   - Viessmann : chauffage-artisanal.lu/chauffage-central-regulation/chaudieres-viessmann/
   *   - De Dietrich : editus.lu "Our brands"
   *   - Pluggit : editus.lu "Our brands" (spécialiste VMC double flux)
   */
  verifiedPartner?: boolean;
  hero: {
    eyebrow: string;
    title: string;
    titleHighlight: string;
    intro: string;
  };
  meta: { title: string; description: string };
  categories: ("chauffage" | "pac" | "climatisation" | "sanitaire" | "ventilation")[];
  positioning: string; // paragraphe de positionnement de la marque
  whyUs: { title: string; body: string }[]; // 3-4 raisons de nous choisir pour cette marque
  flagships: { range: string; type: string; body: string }[]; // 3-5 gammes/modèles phares
  warrantyNote: string;
  partnershipNote: string; // notre niveau de partenariat constructeur
};

export const BRANDS: Record<string, Brand> = {
  vaillant: {
    slug: "vaillant",
    name: "Vaillant",
    origin: "Allemagne",
    since: "1874",
    shortPitch:
      "Référence allemande historique du chauffage. Chaudières gaz, PAC air/eau, hybrides.",
    priceTier: "standard",
    hero: {
      eyebrow: "Marque · Vaillant",
      title: "Vaillant",
      titleHighlight: "installateur agréé au Luxembourg",
      intro:
        "Référence allemande du chauffage depuis 1874. Chaudières gaz à condensation, pompes à chaleur air/eau aroTHERM, systèmes hybrides — gamme résidentielle et collective.",
    },
    meta: {
      title: "Vaillant Luxembourg — Installateur agréé, devis, entretien",
      description:
        "Installation et entretien Vaillant au Luxembourg : chaudières ecoTEC, PAC aroTHERM, systèmes hybrides. Techniciens formés en usine, accompagnement Klimabonus.",
    },
    categories: ["chauffage", "pac"],
    positioning:
      "Vaillant est l'un des plus anciens fabricants européens d'équipements de chauffage. Sa philosophie ingénieure et son investissement constant en R&D en font une référence pour les installations résidentielles longue durée, en particulier sur les chaudières à condensation et les PAC air/eau.",
    whyUs: [
      {
        title: "Techniciens formés en usine",
        body: "Nos techniciens suivent les certifications Vaillant pour le diagnostic, la mise en route et le SAV — accès au support technique constructeur direct.",
      },
      {
        title: "Stock pièces détachées",
        body: "Pièces d'usure courantes Vaillant (sondes, vases d'expansion, échangeurs) en stock à l'atelier — réparation rapide sur les pannes saisonnières.",
      },
      {
        title: "Accompagnement Klimabonus",
        body: "Sur les remplacements vers PAC ou hybride Vaillant, nous préparons le volet technique du dossier d'aide (fiches produit, schémas).",
      },
    ],
    flagships: [
      {
        range: "ecoTEC plus",
        type: "Chaudière gaz à condensation",
        body: "Gamme résidentielle de référence : compacte, rendement élevé, compatibilité avec sondes extérieures et thermostats connectés.",
      },
      {
        range: "aroTHERM plus",
        type: "PAC air/eau",
        body: "Pompe à chaleur monobloc R290 (réfrigérant naturel à faible impact), température de départ jusqu'à 75 °C — adaptée aux rénovations.",
      },
      {
        range: "flexoTHERM exclusive",
        type: "PAC géothermique",
        body: "Pompe à chaleur sol/eau et eau/eau pour les projets neufs ou rénovation lourde avec forage géothermique.",
      },
      {
        range: "Systèmes hybrides",
        type: "Chaudière + PAC",
        body: "Couplage intelligent ecoTEC + aroTHERM — la régulation choisit l'énergie la plus efficiente selon la température extérieure.",
      },
    ],
    warrantyNote:
      "Garantie selon programme constructeur Vaillant — variable selon la gamme et la souscription d'un contrat d'entretien annuel.",
    partnershipNote:
      "Partenariat installateur historique. Accès au portail technique Vaillant pour le SAV et le suivi des garanties.",
  },

  viessmann: {
    slug: "viessmann",
    name: "Viessmann",
    origin: "Allemagne",
    since: "1917",
    shortPitch:
      "Premium allemand. Chaudières condensation, PAC, biomasse, solaire thermique — toutes énergies.",
    priceTier: "premium",
    verifiedPartner: true,
    hero: {
      eyebrow: "Marque · Viessmann",
      title: "Viessmann",
      titleHighlight: "spécialiste premium au Luxembourg",
      intro:
        "Constructeur allemand premium depuis 1917. Vitodens (gaz condensation), Vitocal (PAC), Vitoligno (biomasse), Vitosol (solaire) — l'une des gammes les plus larges du marché européen.",
    },
    meta: {
      title: "Viessmann Luxembourg — Installateur Vitodens, Vitocal, biomasse",
      description:
        "Installation Viessmann au Luxembourg : Vitodens condensation, Vitocal PAC, Vitoligno biomasse pellets, Vitosol solaire. Techniciens certifiés, support constructeur direct.",
    },
    categories: ["chauffage", "pac"],
    positioning:
      "Viessmann est le constructeur de référence pour les installations exigeantes — finitions de pose, durabilité long terme, gammes spécialisées biomasse et solaire thermique. Particulièrement adapté aux maîtres d'ouvrage qui valorisent le détail technique.",
    whyUs: [
      {
        title: "Certification Viessmann",
        body: "Formation continue sur les nouvelles gammes Vitocal et Vitodens — assurance d'un dimensionnement et d'une mise en route conformes aux spécifications constructeur.",
      },
      {
        title: "Gamme biomasse maîtrisée",
        body: "Pour les projets bois/pellets (Vitoligno), nous gérons le stockage, l'aspiration, la régulation et le SAV — peu d'installateurs au LU sur ce créneau.",
      },
      {
        title: "Solaire thermique cohérent",
        body: "Couplage Vitosol + Vitocal/Vitodens pour préchauffer l'ECS — étude énergétique globale, pas un système ajouté à un autre.",
      },
    ],
    flagships: [
      {
        range: "Vitodens 200-W",
        type: "Chaudière gaz à condensation",
        body: "Gamme premium connectée, écran couleur, ViCare app, modulation large pour adaptation fine aux besoins.",
      },
      {
        range: "Vitocal 250-A",
        type: "PAC air/eau monobloc",
        body: "PAC R290 silencieuse, départ jusqu'à 70 °C, intégration possible en relève de chaudière existante.",
      },
      {
        range: "Vitoligno 300-C",
        type: "Chaudière pellets",
        body: "Chaudière biomasse à pellets pour transition fioul→bois ou installation neuve écologique en zone gaz absent.",
      },
      {
        range: "Vitosol 200-FM",
        type: "Solaire thermique",
        body: "Capteurs plans pour préchauffage ECS — réduction significative de la consommation gaz/électricité ECS annuelle.",
      },
    ],
    warrantyNote:
      "Garanties Viessmann selon gamme et programme — extension possible avec contrat d'entretien annuel.",
    partnershipNote:
      "Partenariat installateur. Accès au support technique Viessmann et formations sur nouvelles gammes.",
  },

  daikin: {
    slug: "daikin",
    name: "Daikin",
    origin: "Japon",
    since: "1924",
    shortPitch:
      "Référence mondiale climatisation et PAC. Altherma, Stylish, VRV — résidentiel et tertiaire.",
    priceTier: "standard",
    hero: {
      eyebrow: "Marque · Daikin",
      title: "Daikin",
      titleHighlight: "PAC, climatisation au Luxembourg",
      intro:
        "Référence mondiale japonaise depuis 1924. Pompes à chaleur Altherma, climatisation résidentielle Perfera/Stylish, VRV/VRF pour tertiaire. Un des leaders mondiaux en confort thermique.",
    },
    meta: {
      title: "Daikin Luxembourg — PAC Altherma, climatisation Stylish, VRV",
      description:
        "Installateur Daikin au Luxembourg : pompes à chaleur Altherma 3 H HT, climatisation Stylish/Perfera, systèmes VRV tertiaires. Techniciens habilités fluides frigorigènes.",
    },
    categories: ["pac", "climatisation"],
    positioning:
      "Daikin reste la référence en matière d'inverter, de COP réels élevés et de fiabilité long terme sur les compresseurs. Particulièrement fort en climatisation résidentielle haut de gamme et en VRV/VRF tertiaire.",
    whyUs: [
      {
        title: "Habilitation fluides catégorie I",
        body: "Nos techniciens disposent de l'attestation d'aptitude fluides frigorigènes catégorie I, obligatoire au Luxembourg pour toute intervention sur circuit frigorifique.",
      },
      {
        title: "Expertise VRV tertiaire",
        body: "Bureaux, commerces, restaurants : étude, déploiement et maintenance des Daikin VRV/VRF avec récupération de chaleur inter-zones.",
      },
      {
        title: "Daikin Cloud + monitoring",
        body: "Pour les installations tertiaires, intégration au Daikin Cloud pour monitoring distance et détection anomalies — maintenance prédictive.",
      },
    ],
    flagships: [
      {
        range: "Altherma 3 H HT",
        type: "PAC air/eau haute température",
        body: "PAC bi-bloc haute température (jusqu'à 70 °C) — idéale pour rénovations avec radiateurs existants non basse-température.",
      },
      {
        range: "Altherma 3 R",
        type: "PAC air/eau monobloc R32",
        body: "Monobloc compact pour maisons individuelles neuves ou bien isolées — COP élevé en mi-saison.",
      },
      {
        range: "Stylish FTXA",
        type: "Climatisation murale design",
        body: "Mono-split résidentiel design Marc Newson — silencieux (19 dB), filtration et déshumidification.",
      },
      {
        range: "VRV 5",
        type: "VRV/VRF tertiaire",
        body: "Système modulaire pour bureaux et commerces, gestion énergie inter-zones, intégration GTB.",
      },
    ],
    warrantyNote:
      "Garanties Daikin selon programme constructeur — registration en ligne après installation pour activation de la garantie étendue.",
    partnershipNote:
      "Installateur Daikin agréé fluides. Accès direct au support technique et au programme de garantie étendue.",
  },

  mitsubishi: {
    slug: "mitsubishi",
    name: "Mitsubishi Electric",
    origin: "Japon",
    since: "1921",
    shortPitch:
      "Climatisation et PAC japonaises. Ecodan, M-Series, City Multi — fiabilité reconnue.",
    priceTier: "standard",
    hero: {
      eyebrow: "Marque · Mitsubishi Electric",
      title: "Mitsubishi Electric",
      titleHighlight: "PAC et climatisation au Luxembourg",
      intro:
        "Constructeur japonais référent depuis 1921. Pompes à chaleur Ecodan, climatisation M-Series, systèmes City Multi pour le tertiaire. Réputation de fiabilité long terme.",
    },
    meta: {
      title: "Mitsubishi Electric Luxembourg — Ecodan, M-Series, City Multi",
      description:
        "Installation Mitsubishi Electric au Luxembourg : PAC Ecodan, climatisation M-Series, systèmes City Multi tertiaires. Habilitation fluides, devis gratuit.",
    },
    categories: ["pac", "climatisation"],
    positioning:
      "Mitsubishi Electric se distingue par la fiabilité de ses compresseurs et la précision de ses systèmes de régulation. Excellente longévité sur les installations résidentielles et un fort positionnement sur le tertiaire avec City Multi.",
    whyUs: [
      {
        title: "Habilitation fluides catégorie I",
        body: "Toutes nos interventions Mitsubishi sont réalisées par des techniciens habilités fluides frigorigènes — sécurité et conformité réglementaire.",
      },
      {
        title: "Ecodan, expertise rénovation",
        body: "Les PAC Ecodan sont particulièrement adaptées aux rénovations luxembourgeoises — études de dimensionnement précises pour optimiser le COP réel.",
      },
      {
        title: "MELCloud monitoring",
        body: "Connexion MELCloud pour pilotage à distance et suivi conso — utilisateur final ou télémaintenance.",
      },
    ],
    flagships: [
      {
        range: "Ecodan PUZ-WM",
        type: "PAC air/eau",
        body: "Gamme résidentielle haute efficacité avec R32, modulation Inverter, fonctionnement jusqu'à -25 °C.",
      },
      {
        range: "M-Series MSZ-LN",
        type: "Climatisation murale premium",
        body: "Mono-split design, capteurs 3D-i See, débit d'air double, filtration Plasma Quad Plus.",
      },
      {
        range: "City Multi VRF",
        type: "Système tertiaire",
        body: "VRF jusqu'à 30 unités intérieures, récupération de chaleur entre zones — bureaux, hôtels, commerces.",
      },
    ],
    warrantyNote: "Garanties Mitsubishi Electric selon programme constructeur en vigueur.",
    partnershipNote:
      "Installateur certifié Mitsubishi Electric — accès au support technique constructeur.",
  },

  buderus: {
    slug: "buderus",
    name: "Buderus",
    origin: "Allemagne",
    since: "1731",
    shortPitch:
      "Constructeur allemand historique du chauffage. Chaudières condensation et PAC fiables.",
    priceTier: "accessible",
    verifiedPartner: true,
    hero: {
      eyebrow: "Marque · Buderus",
      title: "Buderus",
      titleHighlight: "chauffage allemand au Luxembourg",
      intro:
        "Fondé en 1731, Buderus est l'un des plus anciens fabricants européens de chauffage. Chaudières Logamax/Logano à condensation, pompes à chaleur Logatherm — robustesse et accessibilité prix.",
    },
    meta: {
      title: "Buderus Luxembourg — Installateur Logamax, Logatherm, devis",
      description:
        "Installation Buderus au Luxembourg : chaudières Logamax/Logano à condensation, PAC Logatherm. Techniciens formés, stock pièces détachées, accompagnement Klimabonus.",
    },
    categories: ["chauffage", "pac"],
    positioning:
      "Buderus offre un excellent rapport qualité-prix sur les chaudières gaz à condensation et les PAC. Marque accessible avec une grande disponibilité pièces et un SAV efficace.",
    whyUs: [
      {
        title: "Techniciens formés Buderus",
        body: "Formations régulières sur les nouvelles régulations Logamatic et les évolutions des gammes Logamax/Logano.",
      },
      {
        title: "Pièces détachées disponibles",
        body: "Stock pièces d'usure courantes Buderus (sondes, brûleurs, pompes) — pas d'attente sur les pannes saisonnières.",
      },
      {
        title: "Logamatic + connectivité",
        body: "Configuration et formation à la régulation Logamatic et l'app MyBuderus pour pilotage à distance.",
      },
    ],
    flagships: [
      {
        range: "Logamax plus GB192i",
        type: "Chaudière gaz à condensation",
        body: "Gamme résidentielle compacte, design moderne, régulation Logamatic intégrée.",
      },
      {
        range: "Logano plus GB212",
        type: "Chaudière au sol condensation",
        body: "Chaudière sol pour besoins importants (collectif léger, maisons grandes surfaces).",
      },
      {
        range: "Logatherm WPL AR",
        type: "PAC air/eau",
        body: "Pompe à chaleur split air/eau jusqu'à 70 °C — compatible rénovation avec radiateurs existants.",
      },
    ],
    warrantyNote: "Garanties Buderus selon programme constructeur en vigueur.",
    partnershipNote: "Partenariat installateur Buderus — support technique constructeur.",
  },

  atlantic: {
    slug: "atlantic",
    name: "Atlantic",
    origin: "France",
    since: "1968",
    shortPitch:
      "Fabricant français. Chauffe-eau thermodynamiques, PAC, radiateurs intelligents.",
    priceTier: "accessible",
    hero: {
      eyebrow: "Marque · Atlantic",
      title: "Atlantic",
      titleHighlight: "fabricant français au Luxembourg",
      intro:
        "Fabricant français historique du confort thermique. Chauffe-eau thermodynamiques Calypso, PAC Alfea, radiateurs connectés — gammes accessibles et rapport qualité-prix solide.",
    },
    meta: {
      title: "Atlantic Luxembourg — Chauffe-eau Calypso, PAC Alfea, devis",
      description:
        "Installation Atlantic au Luxembourg : chauffe-eau thermodynamiques Calypso, PAC Alfea, ballons sanitaires. Devis gratuit, technicien proche, garantie constructeur.",
    },
    categories: ["chauffage", "pac", "sanitaire"],
    positioning:
      "Atlantic est un fabricant français pertinent sur les chauffe-eau thermodynamiques et les PAC résidentielles à prix accessibles. Particulièrement intéressant pour le remplacement d'un chauffe-eau électrique vieillissant.",
    whyUs: [
      {
        title: "Spécialiste Calypso",
        body: "Le chauffe-eau thermodynamique Calypso permet jusqu'à 70 % d'économies sur l'ECS vs électrique classique — nous étudions l'éligibilité Klimabonus.",
      },
      {
        title: "Atlantic Cozytouch",
        body: "Configuration de l'app Cozytouch pour pilotage à distance des PAC Alfea et chauffe-eau Calypso.",
      },
      {
        title: "SAV France-proche",
        body: "Support technique Atlantic réactif depuis le Luxembourg — pièces détachées disponibles rapidement.",
      },
    ],
    flagships: [
      {
        range: "Calypso VM",
        type: "Chauffe-eau thermodynamique",
        body: "Ballon 200-270 L avec PAC intégrée — économies 50-70 % vs chauffe-eau électrique. Éligible Klimabonus en remplacement.",
      },
      {
        range: "Alfea Excellia Duo",
        type: "PAC air/eau avec ECS intégrée",
        body: "PAC + production ECS dans le même équipement — installation compacte pour rénovation.",
      },
      {
        range: "Galapagos",
        type: "Radiateur connecté",
        body: "Radiateur électrique intelligent à inertie pour chauffage d'appoint pièce par pièce, programmation pilotée.",
      },
    ],
    warrantyNote: "Garanties Atlantic selon programme constructeur — cuves émaillées avec anode magnésium pour les chauffe-eau.",
    partnershipNote: "Installateur Atlantic avec accès à la formation continue et au SAV constructeur.",
  },

  bosch: {
    slug: "bosch",
    name: "Bosch",
    origin: "Allemagne",
    since: "1886",
    shortPitch:
      "Marque allemande accessible. Chaudières Condens, PAC Compress, fiabilité reconnue.",
    priceTier: "accessible",
    hero: {
      eyebrow: "Marque · Bosch",
      title: "Bosch",
      titleHighlight: "chauffage et PAC au Luxembourg",
      intro:
        "Constructeur allemand mondialement reconnu depuis 1886. Chaudières gaz Condens, pompes à chaleur Compress, systèmes hybrides. Fiabilité industrielle et SAV solide.",
    },
    meta: {
      title: "Bosch Luxembourg — Chaudières Condens, PAC Compress, devis",
      description:
        "Installation Bosch au Luxembourg : chaudières gaz Condens, pompes à chaleur Compress, systèmes hybrides. Techniciens formés, accompagnement Klimabonus, devis gratuit.",
    },
    categories: ["chauffage", "pac"],
    positioning:
      "Bosch combine ingénierie allemande et prix maîtrisés. Gammes Condens et Compress particulièrement adaptées aux maisons individuelles résidentielles, avec une régulation Bosch Smart Home cohérente.",
    whyUs: [
      {
        title: "Régulation Bosch Smart Home",
        body: "Intégration de la PAC ou chaudière Bosch avec les capteurs et thermostats Smart Home pour une gestion énergétique intelligente.",
      },
      {
        title: "Hybride Condens + Compress",
        body: "Couplage hybride pour maximiser les économies — la régulation choisit la source d'énergie selon coût et performance.",
      },
      {
        title: "Garantie + entretien",
        body: "Contrat d'entretien Bosch pour préserver la garantie constructeur sur la durée.",
      },
    ],
    flagships: [
      {
        range: "Condens 7000i W",
        type: "Chaudière gaz à condensation",
        body: "Gamme résidentielle premium avec écran couleur, connectivité Wi-Fi, modulation large.",
      },
      {
        range: "Compress 7400i AW",
        type: "PAC air/eau split",
        body: "PAC R290 (réfrigérant naturel) jusqu'à 75 °C — adaptée aux rénovations avec radiateurs.",
      },
      {
        range: "Compress 5000 DW",
        type: "Chauffe-eau thermodynamique",
        body: "Ballon thermodynamique 200-260 L — alternative économe au chauffe-eau électrique classique.",
      },
    ],
    warrantyNote: "Garanties Bosch selon programme constructeur — registration nécessaire post-installation.",
    partnershipNote: "Installateur partenaire Bosch — accès support technique et formations gammes.",
  },

  "de-dietrich": {
    slug: "de-dietrich",
    name: "De Dietrich",
    origin: "France",
    since: "1684",
    shortPitch:
      "Fabricant français historique. Chaudières condensation, PAC Strateo, design soigné.",
    priceTier: "standard",
    verifiedPartner: true,
    hero: {
      eyebrow: "Marque · De Dietrich",
      title: "De Dietrich",
      titleHighlight: "élégance française au Luxembourg",
      intro:
        "Fabricant français historique depuis 1684 (l'un des plus anciens d'Europe). Chaudières gaz Vivadens, PAC Strateo/Hi Pac, design produit reconnu — pour les projets qui valorisent l'esthétique technique.",
    },
    meta: {
      title: "De Dietrich Luxembourg — Vivadens, Strateo, devis installateur",
      description:
        "Installation De Dietrich au Luxembourg : chaudières Vivadens condensation, PAC Strateo, systèmes hybrides. Techniciens formés constructeur, accompagnement Klimabonus.",
    },
    categories: ["chauffage", "pac"],
    positioning:
      "De Dietrich allie tradition française et design produit moderne. Particulièrement adapté aux projets qui valorisent l'aspect esthétique et la finition.",
    whyUs: [
      {
        title: "Spécialiste De Dietrich",
        body: "Maîtrise des spécificités constructeur — régulation iSense, paramétrage Strateo, mise en service propre.",
      },
      {
        title: "Design et discrétion",
        body: "Chaudières et PAC choisies pour s'intégrer dans des espaces visibles (cuisines ouvertes, locaux techniques apparents).",
      },
      {
        title: "SAV constructeur direct",
        body: "Accès au support technique De Dietrich pour les diagnostics complexes et les commandes pièces.",
      },
    ],
    flagships: [
      {
        range: "Vivadens MCR",
        type: "Chaudière murale gaz condensation",
        body: "Chaudière condensation résidentielle compacte avec régulation iSense intégrée.",
      },
      {
        range: "Strateo",
        type: "PAC air/eau",
        body: "Pompe à chaleur monobloc compacte — installation et maintenance simplifiées.",
      },
      {
        range: "Hi Pac Hybrid",
        type: "Système hybride",
        body: "Couplage chaudière + PAC pour optimiser les économies sur rénovations partielles.",
      },
    ],
    warrantyNote: "Garanties De Dietrich selon programme constructeur.",
    partnershipNote: "Partenariat installateur De Dietrich avec support technique direct.",
  },

  hoval: {
    slug: "hoval",
    name: "Hoval",
    origin: "Liechtenstein",
    since: "1945",
    shortPitch:
      "Constructeur premium Liechtenstein. Chaudières TopGas, PAC Belaria, biomasse Ultragas.",
    priceTier: "premium",
    hero: {
      eyebrow: "Marque · Hoval",
      title: "Hoval",
      titleHighlight: "premium Liechtenstein au Luxembourg",
      intro:
        "Constructeur premium fondé au Liechtenstein en 1945. Chaudières TopGas/Ultragas, PAC Belaria, systèmes biomasse — particulièrement positionné sur le tertiaire et le résidentiel haut de gamme.",
    },
    meta: {
      title: "Hoval Luxembourg — TopGas, Belaria, devis installateur",
      description:
        "Installation Hoval au Luxembourg : chaudières TopGas/Ultragas condensation, PAC Belaria, biomasse pellets. Spécialiste tertiaire et résidentiel premium.",
    },
    categories: ["chauffage", "pac"],
    positioning:
      "Hoval est un constructeur premium suisse-allemand fort sur le tertiaire et les installations résidentielles exigeantes. Particulièrement reconnu pour ses chaudières à grande puissance et ses solutions biomasse.",
    whyUs: [
      {
        title: "Expertise tertiaire Hoval",
        body: "Bureaux, hôtels, copropriétés : étude et installation des chaudières à grande puissance Hoval avec hydraulique optimisée.",
      },
      {
        title: "Biomasse pellets",
        body: "Maîtrise des chaudières biomasse Hoval (Pellet, BioLyt) pour transition fioul→bois en zones non-desservies par le gaz.",
      },
      {
        title: "Support Hoval direct",
        body: "Accès au support technique Hoval — mise en route documentée, paramétrage régulation TopTronic E.",
      },
    ],
    flagships: [
      {
        range: "TopGas classic",
        type: "Chaudière gaz à condensation",
        body: "Gamme résidentielle premium avec régulation TopTronic, rendement élevé, connectivité.",
      },
      {
        range: "Belaria pro",
        type: "PAC air/eau",
        body: "Pompe à chaleur premium pour résidentiel et petit tertiaire — silencieuse, COP élevé.",
      },
      {
        range: "BioLyt",
        type: "Chaudière pellets",
        body: "Chaudière biomasse pellets résidentielle — autonomie longue, asservissement réservoir, faible entretien.",
      },
    ],
    warrantyNote: "Garanties Hoval selon programme constructeur — contrat d'entretien recommandé pour grande puissance.",
    partnershipNote: "Installateur partenaire Hoval avec support technique constructeur.",
  },
};

export const BRAND_SLUGS = Object.keys(BRANDS);

export function getBrand(slug: string): Brand | undefined {
  return BRANDS[slug];
}

export const CATEGORY_LABELS: Record<string, string> = {
  chauffage: "Chauffage",
  pac: "Pompe à chaleur",
  climatisation: "Climatisation",
  sanitaire: "Sanitaire",
  ventilation: "Ventilation",
};
