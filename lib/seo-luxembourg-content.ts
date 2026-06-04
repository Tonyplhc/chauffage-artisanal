/**
 * Contenu SEO long-form pour les pages /[service]-luxembourg.
 *
 * Stratégie : chaque page cible une requête Google volumineuse au LU :
 *   • "chauffage Luxembourg"        ≈ 1 600 recherches/mois
 *   • "pompe à chaleur Luxembourg"  ≈ 2 400
 *   • "climatisation Luxembourg"    ≈   880
 *   • "salle de bain Luxembourg"    ≈   720
 *   • "ventilation Luxembourg"      ≈   210
 *   • "dépannage Luxembourg"        ≈ 1 100
 *   • "entretien chaudière Lux."    ≈   590
 *   • "chauffe-eau Luxembourg"      ≈   480
 *   • "plombier Luxembourg"         ≈ 1 900
 *
 * Chaque page expose :
 *   - h1 / intro / blocs USP
 *   - FAQ structurée (JSON-LD schema.org Question/Answer)
 *   - CTA devis ancré
 *   - Maillage interne vers les pages outils + Klimabonus
 */

export type SeoPage = {
  slug: string; // ex: "chauffage-luxembourg"
  hero: {
    eyebrow: string;
    title: string;
    titleHighlight: string;
    intro: string;
  };
  meta: {
    title: string;
    description: string;
    h1Keyword: string;
  };
  usps: { title: string; body: string }[];
  faqs: { q: string; a: string }[];
  internalLinks: { label: string; href: string }[];
  ctaLine: string;
};

export const SEO_PAGES: Record<string, SeoPage> = {
  "chauffage-luxembourg": {
    slug: "chauffage-luxembourg",
    hero: {
      eyebrow: "Chauffage · Luxembourg",
      title: "Installation et entretien de chauffage",
      titleHighlight: "au Luxembourg",
      intro:
        "Chaudière gaz à condensation, chaudière biomasse, hybride solaire — depuis 1994, nous installons et entretenons les systèmes de chauffage du résidentiel et du tertiaire luxembourgeois.",
    },
    meta: {
      title: "Chauffage Luxembourg — Installation, entretien, dépannage 24/7",
      description:
        "Installation chaudière gaz, biomasse, hybride solaire au Luxembourg. Étude personnalisée, accompagnement Klimabonus, entretien annuel, dépannage 24/7. Devis gratuit en 24h.",
      h1Keyword: "chauffage Luxembourg",
    },
    usps: [
      {
        title: "Marques certifiées",
        body: "Viessmann, Vaillant, Buderus, Atlantic, Bosch — partenariats constructeurs depuis 30 ans, techniciens formés en usine.",
      },
      {
        title: "Klimabonus accompagné",
        body: "Nous préparons le volet technique du dossier d'aide (schémas, attestations, fiches produits) ; vous gardez le dossier administratif à votre nom.",
      },
      {
        title: "Garantie installation",
        body: "Garantie constructeur + garantie pose. Contrat d'entretien annuel optionnel pour préserver la garantie sur la durée.",
      },
      {
        title: "Intervention sous 24h",
        body: "Astreinte 24/7 pour les pannes critiques en hiver. Stock pièces détachées toutes marques pour redémarrage rapide.",
      },
    ],
    faqs: [
      {
        q: "Combien coûte une chaudière à condensation au Luxembourg en 2026 ?",
        a: "Pour une maison individuelle au Luxembourg, comptez entre 4 500 € et 9 000 € posée pour une chaudière gaz à condensation, selon la puissance, la marque et la complexité d'installation. Le Klimabonus peut couvrir une partie du coût pour les bâtiments éligibles.",
      },
      {
        q: "Quelles aides existent pour remplacer une chaudière au Luxembourg ?",
        a: "Le programme national Klimabonus, géré par l'administration de l'environnement, soutient le remplacement vers des systèmes plus performants (PAC, biomasse, hybride). Selon votre commune, des aides communales Klimapakt peuvent s'ajouter. Une TVA réduite s'applique aussi à de nombreux travaux dans le logement.",
      },
      {
        q: "Quelle est la durée de vie d'une chaudière à condensation ?",
        a: "Une chaudière à condensation bien entretenue (révision annuelle obligatoire au Luxembourg) dure typiquement 15 à 20 ans. Au-delà, le rendement diminue et le risque de panne augmente — il devient pertinent de comparer avec un remplacement.",
      },
      {
        q: "Quelle est la périodicité de l'inspection chaudière au Luxembourg ?",
        a: "Au Luxembourg, l'inspection périodique est obligatoire selon le combustible : tous les 2 ans pour les chaudières fioul et bois (RGD 7 octobre 2014), tous les 4 ans pour le gaz (RGD 27 février 2010). L'entretien annuel n'est pas une obligation légale unique mais une bonne pratique imposée par les constructeurs et la plupart des contrats d'assurance habitation. Détails complets sur notre page conformité.",
      },
      {
        q: "Combien de temps prend une installation de chauffage neuf ?",
        a: "Pour un remplacement standard, comptez 1 à 2 jours d'intervention. Pour une installation neuve avec circuit complet (radiateurs, plancher chauffant), comptez 1 à 3 semaines selon la taille du bâtiment.",
      },
    ],
    internalLinks: [
      { label: "Pompe à chaleur Luxembourg", href: "/pompe-a-chaleur-luxembourg" },
      { label: "Entretien chaudière Luxembourg", href: "/entretien-chaudiere-luxembourg" },
      { label: "Dépannage 24/7", href: "/depannage-luxembourg" },
      { label: "Klimabonus 2026 — barèmes officiels", href: "/klimabonus-2026" },
      { label: "Demander un devis", href: "/devis" },
    ],
    ctaLine:
      "Vous prévoyez un remplacement ou une installation neuve ? Demandez un devis détaillé sous 24h.",
  },

  "pompe-a-chaleur-luxembourg": {
    slug: "pompe-a-chaleur-luxembourg",
    hero: {
      eyebrow: "Pompe à chaleur · Luxembourg",
      title: "Installation de pompe à chaleur",
      titleHighlight: "au Luxembourg",
      intro:
        "Air/eau, géothermique, hybride solaire — études de dimensionnement précises, accompagnement Klimabonus complet, COP > 4,8 mesurés sur nos installations 2024.",
    },
    meta: {
      title: "Pompe à chaleur Luxembourg — Installation PAC, Klimabonus, devis",
      description:
        "Installation pompe à chaleur air/eau, géothermique, hybride au Luxembourg. COP > 4,8 mesurés. Accompagnement complet Klimabonus. Étude gratuite, devis sous 24h.",
      h1Keyword: "pompe à chaleur Luxembourg",
    },
    usps: [
      {
        title: "COP > 4,8 mesurés",
        body: "Sur nos installations 2024, le coefficient de performance moyen dépasse 4,8 — chaque kWh électrique consommé restitue 4,8 kWh de chaleur.",
      },
      {
        title: "Klimabonus jusqu'à 12 000 €",
        body: "Selon votre dossier et le type de PAC, le Klimabonus peut couvrir une part significative de l'investissement. Vérification d'éligibilité avant chaque devis.",
      },
      {
        title: "Dimensionnement précis",
        body: "Étude thermique du bâtiment, calcul des déperditions, choix de la PAC adaptée — pas de surdimensionnement qui dégrade le COP réel.",
      },
      {
        title: "Garantie 7 ans",
        body: "Sur les compresseurs principaux (Daikin, Mitsubishi, Vaillant) selon programme constructeur. Entretien annuel obligatoire pour préserver la garantie.",
      },
    ],
    faqs: [
      {
        q: "Combien coûte une pompe à chaleur au Luxembourg en 2026 ?",
        a: "Pour une PAC air/eau résidentielle, comptez 12 000 € à 22 000 € posée selon la puissance et la marque. Pour une PAC géothermique, comptez 25 000 € à 40 000 € incluant le forage. Le Klimabonus peut couvrir 5 000 € à 12 000 € selon le dossier.",
      },
      {
        q: "Une pompe à chaleur fonctionne-t-elle en hiver au Luxembourg ?",
        a: "Oui — les PAC modernes (Daikin Altherma, Mitsubishi Ecodan, Vaillant aroTHERM) sont conçues pour fonctionner jusqu'à -20°C, soit largement au-delà des minimas luxembourgeois (-10°C en moyenne). Le COP diminue à très basse température mais reste positif.",
      },
      {
        q: "Quelle est la différence entre PAC air/eau et géothermique ?",
        a: "La PAC air/eau prélève la chaleur dans l'air extérieur (installation simple, coût modéré, COP 3,5 à 4,5). La PAC géothermique prélève dans le sol via des sondes (installation lourde avec forage, coût plus élevé, COP 4,5 à 5,5 plus stable l'hiver). Le choix dépend du terrain, du budget et de la consommation cible.",
      },
      {
        q: "Faut-il garder une chaudière en relève d'une PAC ?",
        a: "Pas systématiquement. Les PAC actuelles couvrent 100 % du besoin sur la majorité des maisons luxembourgeoises bien isolées. Pour les bâtiments anciens mal isolés ou les très grandes surfaces, un système hybride PAC + chaudière reste pertinent.",
      },
      {
        q: "Combien dure une installation de PAC ?",
        a: "Pour une PAC air/eau, comptez 2 à 5 jours d'intervention. Pour une PAC géothermique avec forage, comptez 1 à 2 semaines selon le terrain. Mise en route, tests et formation client compris.",
      },
    ],
    internalLinks: [
      { label: "Chauffage Luxembourg", href: "/chauffage-luxembourg" },
      { label: "Calculateur ROI PAC", href: "/outils/roi-pac" },
      { label: "Dimensionnement PAC", href: "/outils/dimensionnement-pac" },
      { label: "Klimabonus PAC — 10 000 €", href: "/klimabonus-2026#pac-air-eau" },
      { label: "Devis PAC", href: "/devis" },
    ],
    ctaLine:
      "Estimez votre Klimabonus et vos économies sur 20 ans en 2 minutes, ou demandez un devis personnalisé sous 24h.",
  },

  "climatisation-luxembourg": {
    slug: "climatisation-luxembourg",
    hero: {
      eyebrow: "Climatisation · Luxembourg",
      title: "Installation de climatisation",
      titleHighlight: "au Luxembourg",
      intro:
        "Mono-split, multi-split, VRV/VRF — installation résidentielle, bureaux, commerces, salles techniques. Marques Daikin, Mitsubishi, LG. Maintenance prédictive et contrats SLA tertiaires.",
    },
    meta: {
      title: "Climatisation Luxembourg — Installation, maintenance, SLA tertiaire",
      description:
        "Installation climatisation au Luxembourg : mono-split, multi-split, VRV/VRF Daikin, Mitsubishi, LG. Bureaux, commerces, résidentiel. Contrats SLA tertiaires. Devis gratuit.",
      h1Keyword: "climatisation Luxembourg",
    },
    usps: [
      {
        title: "Tous types de bâtiments",
        body: "Résidentiel haut de gamme, bureaux, commerces, salles techniques, restaurants — solution adaptée à chaque usage.",
      },
      {
        title: "Marques premium",
        body: "Daikin, Mitsubishi Electric, LG, Atlantic — partenaire installateur agréé, accès aux dernières gammes inverter et R32.",
      },
      {
        title: "Attestations fluides",
        body: "Nos techniciens disposent de l'attestation d'aptitude fluides frigorigènes catégorie I (obligatoire au Luxembourg pour toute intervention).",
      },
      {
        title: "Maintenance prédictive",
        body: "Sur les installations tertiaires, monitoring connecté pour détecter les anomalies avant la panne — réduction des arrêts non planifiés.",
      },
    ],
    faqs: [
      {
        q: "Une climatisation est-elle nécessaire au Luxembourg ?",
        a: "Avec les étés de plus en plus chauds (les épisodes >30°C deviennent fréquents), la climatisation devient un confort apprécié dans les maisons modernes très bien isolées, et un besoin dans les bureaux et commerces. Les pompes à chaleur air/air réversibles permettent de chauffer aussi en hiver.",
      },
      {
        q: "Combien coûte une climatisation au Luxembourg ?",
        a: "Pour un mono-split résidentiel, comptez 2 200 € à 4 500 € posé. Pour un multi-split (2-4 pièces), comptez 5 500 € à 12 000 €. Pour du tertiaire VRV/VRF, le tarif dépend de la surface et de la configuration.",
      },
      {
        q: "Quelle est la différence entre mono-split et VRV/VRF ?",
        a: "Un mono-split relie 1 unité extérieure à 1 unité intérieure. Un multi-split relie 1 unité extérieure à plusieurs intérieures. Un VRV/VRF (Daikin VRV, Mitsubishi City Multi) gère un grand nombre d'unités intérieures avec récupération de chaleur entre zones — typique tertiaire.",
      },
      {
        q: "Y a-t-il une obligation d'entretien des climatisations ?",
        a: "Oui. Les installations de plus de 12 kW de puissance frigorifique sont soumises à un contrôle d'étanchéité périodique selon le règlement F-gas. Au-delà, l'entretien préventif (nettoyage filtres, échangeurs, vérification gaz) prolonge la durée de vie et préserve le COP.",
      },
      {
        q: "Quelle est la durée de vie d'une climatisation ?",
        a: "Une climatisation bien entretenue dure 12 à 18 ans. Sur les installations tertiaires intensives (commerces, restaurants), comptez plutôt 8 à 12 ans avec remplacement des compresseurs en cours de vie.",
      },
    ],
    internalLinks: [
      { label: "Pompe à chaleur Luxembourg", href: "/pompe-a-chaleur-luxembourg" },
      { label: "Ventilation Luxembourg", href: "/ventilation-luxembourg" },
      { label: "Dépannage 24/7", href: "/depannage-luxembourg" },
      { label: "Devis climatisation", href: "/devis" },
    ],
    ctaLine:
      "Étude gratuite de votre projet de climatisation résidentielle ou tertiaire — devis détaillé sous 24h.",
  },

  "salle-de-bain-luxembourg": {
    slug: "salle-de-bain-luxembourg",
    hero: {
      eyebrow: "Salle de bain · Luxembourg",
      title: "Rénovation salle de bain",
      titleHighlight: "au Luxembourg",
      intro:
        "Salles de bain haut de gamme clé en main — plomberie complète, sanitaire premium, douches à l'italienne, robinetterie design. En collaboration avec architectes d'intérieur.",
    },
    meta: {
      title: "Salle de bain Luxembourg — Rénovation clé en main premium",
      description:
        "Rénovation salle de bain au Luxembourg : douche italienne, baignoire îlot, robinetterie premium. Travail avec architectes d'intérieur. Devis détaillé poste par poste.",
      h1Keyword: "salle de bain Luxembourg",
    },
    usps: [
      {
        title: "Clé en main",
        body: "Démolition, plomberie, électricité (en lien avec partenaire), carrelage, sanitaire, robinetterie, finitions — un seul interlocuteur pour tout.",
      },
      {
        title: "Partenariat architectes",
        body: "Nous travaillons en lien avec des architectes d'intérieur luxembourgeois pour les projets haut de gamme. Respect des plans à la finition près.",
      },
      {
        title: "Marques premium",
        body: "Hansgrohe, Grohe, Duravit, Geberit, Villeroy & Boch, Burgbad — accès aux gammes premium avec garanties constructeur étendues.",
      },
      {
        title: "Planning respecté",
        body: "Planning communiqué semaine par semaine, photos quotidiennes, protection des sols, nettoyage fin de chantier — pas de mauvaise surprise.",
      },
    ],
    faqs: [
      {
        q: "Combien coûte une rénovation de salle de bain au Luxembourg ?",
        a: "Pour une rénovation complète 5-8 m², comptez 12 000 € à 25 000 € hors équipements premium. Pour une salle de bain haut de gamme avec marbre, douche italienne et baignoire îlot, le budget peut dépasser 40 000 €. Devis détaillé poste par poste avant signature.",
      },
      {
        q: "Combien de temps prend une rénovation de salle de bain ?",
        a: "Pour une rénovation complète résidentielle, comptez 3 à 5 semaines de chantier (démolition + plomberie + carrelage + finitions). Le timing dépend du séchage des chapes et des délais de livraison des sanitaires premium.",
      },
      {
        q: "Faut-il une autorisation pour rénover sa salle de bain au Luxembourg ?",
        a: "Pour une rénovation à l'identique (mêmes positions sanitaires), aucune autorisation. Si vous modifiez la position des évacuations ou créez une nouvelle salle de bain, un permis communal peut être requis selon votre commune. Nous vous orientons.",
      },
      {
        q: "Bénéficie-t-on de la TVA réduite ?",
        a: "Oui — sous conditions d'ancienneté du logement et d'usage principal habitation, une TVA réduite s'applique aux travaux de rénovation sanitaire au Luxembourg. Le devis détaille clairement le taux applicable.",
      },
    ],
    internalLinks: [
      { label: "Sanitaire complet", href: "/sanitaire" },
      { label: "Plombier Luxembourg", href: "/plombier-luxembourg" },
      { label: "Devis salle de bain", href: "/devis" },
    ],
    ctaLine:
      "Décrivez-nous votre projet de salle de bain — nous venons mesurer sur place et vous remettons un devis détaillé sous 24h.",
  },

  "ventilation-luxembourg": {
    slug: "ventilation-luxembourg",
    hero: {
      eyebrow: "Ventilation · Luxembourg",
      title: "Ventilation mécanique contrôlée (VMC)",
      titleHighlight: "au Luxembourg",
      intro:
        "VMC simple flux, double flux à récupération de chaleur, VMC hygroréglable — installation résidentielle et tertiaire. Air sain, économies d'énergie, conformité réglementaire.",
    },
    meta: {
      title: "Ventilation Luxembourg — VMC simple flux, double flux, hygro",
      description:
        "Installation VMC au Luxembourg : simple flux, double flux récupération chaleur, hygroréglable. Maisons passives, rénovations, tertiaire. Devis gratuit.",
      h1Keyword: "ventilation Luxembourg",
    },
    usps: [
      {
        title: "Tous types de VMC",
        body: "Simple flux autoréglable, hygroréglable B, double flux à récupération de chaleur (jusqu'à 92 % de rendement).",
      },
      {
        title: "Maisons passives",
        body: "VMC double flux indispensable pour respecter les standards passif/BBC. Étude des débits selon la norme luxembourgeoise.",
      },
      {
        title: "Maintenance simple",
        body: "Filtres remplacés 1×/an, nettoyage gaines 1×/5 ans — contrat de maintenance disponible.",
      },
      {
        title: "Couplage PAC",
        body: "Installation cohérente avec une PAC air/eau ou un puits canadien — étude énergétique globale.",
      },
    ],
    faqs: [
      {
        q: "Quelle VMC choisir au Luxembourg ?",
        a: "Pour une maison neuve ou rénovée à haute performance, la VMC double flux à récupération de chaleur est la plus efficace (jusqu'à 92 % de chaleur récupérée). Pour un appartement ou une rénovation simple, la VMC simple flux hygroréglable reste pertinente et plus économique.",
      },
      {
        q: "Combien coûte une VMC double flux au Luxembourg ?",
        a: "Pour une maison individuelle de 150-200 m², comptez 6 000 € à 12 000 € posée selon la complexité du réseau de gaines. La VMC simple flux hygroréglable se situe entre 1 800 € et 3 500 €.",
      },
      {
        q: "Une VMC est-elle obligatoire au Luxembourg ?",
        a: "Pour les constructions neuves répondant aux standards énergétiques (Klasse A/B), oui — une ventilation mécanique est requise pour assurer le renouvellement d'air conformément aux RGD luxembourgeois. En rénovation lourde, c'est fortement recommandé.",
      },
      {
        q: "La VMC fait-elle du bruit ?",
        a: "Les VMC modernes (Aldes, Atlantic, Zehnder, Helios) sont silencieuses (<30 dB en bouche) à condition d'être correctement dimensionnées et installées avec des silencieux. Nous garantissons les seuils acoustiques au cahier des charges.",
      },
    ],
    internalLinks: [
      { label: "Pompe à chaleur Luxembourg", href: "/pompe-a-chaleur-luxembourg" },
      { label: "Climatisation Luxembourg", href: "/climatisation-luxembourg" },
      { label: "Devis ventilation", href: "/devis" },
    ],
    ctaLine:
      "Projet de ventilation pour construction neuve ou rénovation ? Devis sous 24h après visite.",
  },

  "depannage-luxembourg": {
    slug: "depannage-luxembourg",
    hero: {
      eyebrow: "Dépannage · Luxembourg",
      title: "Dépannage chauffage et sanitaire 24/7",
      titleHighlight: "au Luxembourg",
      intro:
        "Astreinte 24/7, 365 jours par an. Diagnostic prioritaire sous 2h pour les pannes critiques (plus de chaud, plus d'eau, fuite gaz). Stock pièces détachées toutes marques.",
    },
    meta: {
      title: "Dépannage Luxembourg — Chauffage, sanitaire 24/7, intervention <2h",
      description:
        "Dépannage chauffage et sanitaire 24/7 au Luxembourg. Astreinte permanente, diagnostic sous 2h, pièces détachées toutes marques. Appel d'urgence accepté la nuit et le week-end.",
      h1Keyword: "dépannage Luxembourg",
    },
    usps: [
      {
        title: "Astreinte 24/7",
        body: "365 jours par an, jour et nuit, week-end et jours fériés. Pas de répondeur — un humain vous répond.",
      },
      {
        title: "Diagnostic prioritaire",
        body: "Pour les pannes critiques (gel, fuite gaz, plus d'eau chaude en hiver), intervention sous 2h dans la zone Luxembourg-Ville et alentours.",
      },
      {
        title: "Stock toutes marques",
        body: "Pièces détachées Vaillant, Viessmann, Buderus, Atlantic, Bosch, De Dietrich, Hoval — souvent réparé en une intervention.",
      },
      {
        title: "Prix transparent",
        body: "Tarif d'astreinte communiqué au téléphone avant déplacement. Devis sur place avant toute réparation supérieure à 200 €.",
      },
    ],
    faqs: [
      {
        q: "Combien coûte un dépannage chauffage au Luxembourg ?",
        a: "Le déplacement + 1h de main d'œuvre se situe entre 120 € et 180 € en journée, 200 € à 280 € en astreinte nuit/week-end. Les pièces sont facturées en sus selon devis. Tarif communiqué au téléphone avant intervention.",
      },
      {
        q: "Intervenez-vous la nuit et le week-end ?",
        a: "Oui — astreinte 24/7 toute l'année. Les majorations d'astreinte (nuit, week-end, jour férié) sont indiquées au téléphone avant le déplacement. Aucune surprise sur la facture.",
      },
      {
        q: "Quelle zone géographique couvrez-vous ?",
        a: "Luxembourg-Ville et toute la Grande Région (Esch-sur-Alzette, Differdange, Dudelange, Mersch, Diekirch, Ettelbruck…). Pour les zones éloignées en astreinte, un préavis peut s'appliquer.",
      },
      {
        q: "Que faire en cas d'odeur de gaz ?",
        a: "Coupez le robinet de gaz immédiatement, ouvrez les fenêtres, n'actionnez aucun interrupteur électrique, sortez du logement et appelez le 112 (pompiers). Puis appelez-nous pour intervention dès sécurité confirmée.",
      },
      {
        q: "Acceptez-vous les paiements en plusieurs fois ?",
        a: "Pour les dépannages standards, paiement immédiat (carte, virement, espèces). Pour les réparations lourdes ou remplacements, paiement échelonné possible — à discuter sur devis.",
      },
    ],
    internalLinks: [
      { label: "Entretien chaudière", href: "/entretien-chaudiere-luxembourg" },
      { label: "Plombier Luxembourg", href: "/plombier-luxembourg" },
      { label: "Auto-diagnostic", href: "/outils/auto-diagnostic" },
    ],
    ctaLine:
      "En cas de panne critique, appelez-nous directement — disponibilité immédiate communiquée au téléphone.",
  },

  "entretien-chaudiere-luxembourg": {
    slug: "entretien-chaudiere-luxembourg",
    hero: {
      eyebrow: "Entretien · Luxembourg",
      title: "Entretien chaudière",
      titleHighlight: "au Luxembourg",
      intro:
        "Contrats d'entretien chaudières gaz, fioul, biomasse — visite annuelle, rapport de contrôle, priorité dépannage, maintien de la garantie constructeur.",
    },
    meta: {
      title: "Entretien chaudière Luxembourg — Contrat annuel, rapport, garantie",
      description:
        "Contrat d'entretien chaudière au Luxembourg : visite annuelle obligatoire, rapport de contrôle, priorité dépannage, maintien de la garantie constructeur. Toutes marques.",
      h1Keyword: "entretien chaudière Luxembourg",
    },
    usps: [
      {
        title: "Visite annuelle conforme",
        body: "Contrôle complet : combustion, étanchéité, sécurité gaz, pression, ramonage si nécessaire. Rapport de visite remis et conservé.",
      },
      {
        title: "Priorité dépannage",
        body: "En cas de panne en cours d'année, intervention prioritaire pour nos contrats d'entretien — devant les appels non-contrats.",
      },
      {
        title: "Maintien garantie",
        body: "L'entretien annuel par un professionnel agréé est souvent une condition pour préserver la garantie constructeur sur la durée.",
      },
      {
        title: "Pièces d'usure incluses",
        body: "Selon formule (Essentiel / Confort / Sérénité), pièces d'usure incluses ou facturées en sus. Conditions précisées au contrat.",
      },
    ],
    faqs: [
      {
        q: "L'entretien chaudière est-il obligatoire au Luxembourg ?",
        a: "Oui. L'entretien annuel des chaudières est une obligation légale au Luxembourg pour la sécurité (CO, étanchéité gaz) et le rendement. Un défaut d'entretien peut entraîner la perte de garantie constructeur, voire l'invalidation de l'assurance en cas de sinistre.",
      },
      {
        q: "Combien coûte un contrat d'entretien chaudière ?",
        a: "Selon la formule choisie : 130 € à 180 €/an pour l'entretien simple, 220 € à 320 €/an pour la formule avec pièces d'usure incluses et priorité dépannage. Tarifs nets, payés à l'année.",
      },
      {
        q: "Que comprend la visite annuelle ?",
        a: "Contrôle complet de la chaudière (corps de chauffe, brûleur, circulateur, vase d'expansion), test combustion et émission CO, vérification étanchéité gaz, contrôle pression circuit, nettoyage si besoin, et remise du rapport de visite signé.",
      },
      {
        q: "Quand programmer l'entretien ?",
        a: "Idéalement à la fin de l'été (août-septembre), avant la saison de chauffe. C'est à ce moment que les délais sont les plus courts et que les éventuelles réparations peuvent être planifiées avant les premiers froids.",
      },
      {
        q: "Intervenez-vous sur toutes les marques ?",
        a: "Oui. Vaillant, Viessmann, Buderus, Atlantic, Bosch, De Dietrich, Hoval, ELM Leblanc, Saunier Duval, Frisquet… nos techniciens sont formés en usine sur les principales marques européennes.",
      },
    ],
    internalLinks: [
      { label: "Chauffage Luxembourg", href: "/chauffage-luxembourg" },
      { label: "Dépannage 24/7", href: "/depannage-luxembourg" },
      { label: "Page entretien complète", href: "/entretien" },
    ],
    ctaLine:
      "Souscrivez un contrat d'entretien — visite annuelle programmée, rappel automatique, tranquillité d'esprit.",
  },

  "chauffe-eau-luxembourg": {
    slug: "chauffe-eau-luxembourg",
    hero: {
      eyebrow: "Chauffe-eau · Luxembourg",
      title: "Installation et remplacement de chauffe-eau",
      titleHighlight: "au Luxembourg",
      intro:
        "Chauffe-eau électrique, thermodynamique (PAC), gaz, solaire — installation et remplacement par techniciens certifiés. Économies d'énergie sur l'ECS jusqu'à 70 %.",
    },
    meta: {
      title: "Chauffe-eau Luxembourg — Électrique, thermodynamique, gaz, solaire",
      description:
        "Installation chauffe-eau au Luxembourg : électrique, thermodynamique PAC, gaz, solaire thermique. Économies d'énergie sur l'eau chaude sanitaire jusqu'à 70 %. Devis gratuit.",
      h1Keyword: "chauffe-eau Luxembourg",
    },
    usps: [
      {
        title: "Tous types",
        body: "Électrique 100-300 L, thermodynamique 200-300 L (PAC sur eau), gaz instantané ou à accumulation, solaire thermique avec appoint.",
      },
      {
        title: "Chauffe-eau thermodynamique",
        body: "Économies jusqu'à 70 % par rapport à un chauffe-eau électrique classique. Éligible au Klimabonus pour le remplacement de l'ancien.",
      },
      {
        title: "Intervention rapide",
        body: "Remplacement d'un chauffe-eau en panne sous 24-48h selon stock — pas de longues semaines sans eau chaude.",
      },
      {
        title: "Garantie cuve étendue",
        body: "Cuves émaillées avec anode magnésium — garantie constructeur 5 à 10 ans selon modèle. Anode contrôlée à chaque entretien.",
      },
    ],
    faqs: [
      {
        q: "Quel type de chauffe-eau choisir ?",
        a: "Pour une famille (3-5 personnes) avec maison rénovée, le chauffe-eau thermodynamique est le plus efficace (économies 50-70 % vs électrique). Pour un appartement avec chauffage gaz, un chauffe-eau gaz à accumulation est cohérent. Le solaire thermique est intéressant pour les maisons exposées sud avec gros besoins ECS.",
      },
      {
        q: "Combien coûte un chauffe-eau thermodynamique au Luxembourg ?",
        a: "Pour un modèle 200-250 L de bonne marque (Atlantic, Thermor, Daikin), comptez 2 800 € à 4 500 € posé. Le Klimabonus peut couvrir une part significative en remplacement d'un ancien chauffe-eau électrique.",
      },
      {
        q: "Quelle est la durée de vie d'un chauffe-eau ?",
        a: "Pour un chauffe-eau électrique : 10-15 ans. Pour un thermodynamique : 15-20 ans avec entretien. Pour un solaire : 20-25 ans. L'eau du Luxembourg étant peu calcaire, les durées de vie sont plutôt favorables.",
      },
      {
        q: "Que faire en cas de fuite de chauffe-eau ?",
        a: "Coupez l'arrivée d'eau au robinet en amont du chauffe-eau et l'alimentation électrique (disjoncteur). Vidangez si possible pour limiter les dégâts. Appelez-nous : dans la majorité des cas la cuve est en fin de vie et un remplacement est plus rentable qu'une réparation.",
      },
    ],
    internalLinks: [
      { label: "Sanitaire complet", href: "/sanitaire" },
      { label: "Plombier Luxembourg", href: "/plombier-luxembourg" },
      { label: "Klimabonus 2026 officiel", href: "/klimabonus-2026" },
      { label: "Dépannage urgent", href: "/depannage-luxembourg" },
    ],
    ctaLine:
      "Votre chauffe-eau a plus de 10 ans ou montre des signes de fatigue ? Demandez un diagnostic gratuit.",
  },

  "plombier-luxembourg": {
    slug: "plombier-luxembourg",
    hero: {
      eyebrow: "Plomberie · Luxembourg",
      title: "Plombier au Luxembourg",
      titleHighlight: "rénovation, dépannage, installation",
      intro:
        "Plomberie résidentielle et tertiaire au Luxembourg — rénovation salle de bain, dépannage fuite, installation sanitaire, débouchage canalisation. Astreinte 24/7 pour les urgences.",
    },
    meta: {
      title: "Plombier Luxembourg — Rénovation, dépannage 24/7, installation",
      description:
        "Plombier au Luxembourg : rénovation salle de bain premium, dépannage fuite 24/7, installation chauffe-eau, débouchage canalisation. Devis gratuit, astreinte garantie.",
      h1Keyword: "plombier Luxembourg",
    },
    usps: [
      {
        title: "Plomberie complète",
        body: "Rénovation salle de bain, remplacement sanitaire, robinetterie, raccordement réseau, débouchage, recherche de fuite avec caméra.",
      },
      {
        title: "Astreinte 24/7",
        body: "Fuite d'eau, canalisation bouchée, robinet cassé en pleine nuit — intervention rapide sous 2h sur Luxembourg-Ville et alentours.",
      },
      {
        title: "Marques premium",
        body: "Hansgrohe, Grohe, Geberit, Duravit, Villeroy & Boch, Roca — accès aux gammes professionnelles avec garanties étendues.",
      },
      {
        title: "Devis transparent",
        body: "Devis détaillé poste par poste avant chaque intervention. Prix matériaux + main d'œuvre séparés. Pas de surprise.",
      },
    ],
    faqs: [
      {
        q: "Combien coûte une intervention plombier au Luxembourg ?",
        a: "Pour une intervention standard en journée : 120 € à 180 € (déplacement + 1h main d'œuvre). En astreinte nuit/week-end : 200 € à 280 €. Matériaux facturés en sus selon nature. Pour les chantiers (rénovation salle de bain, installation neuve), devis détaillé.",
      },
      {
        q: "Que faire en cas de fuite d'eau ?",
        a: "Coupez l'arrivée d'eau générale (vanne au compteur), épongez pour limiter les dégâts, et appelez-nous. Si la fuite est sous pression, faites une photo de la zone avant de couper — utile pour le diagnostic et l'assurance.",
      },
      {
        q: "Faites-vous des recherches de fuite non destructives ?",
        a: "Oui — caméra thermique, gaz traceur, corrélateur acoustique selon la nature de la fuite. Intervention sans casse pour identifier précisément l'origine avant toute reprise.",
      },
      {
        q: "Intervenez-vous pour des canalisations bouchées ?",
        a: "Oui — débouchage manuel, furet électrique, hydrocurage haute pression selon la nature du bouchon. Inspection caméra incluse pour les bouchons récurrents (racines, dépôts calcaire, contre-pente).",
      },
      {
        q: "Y a-t-il une garantie sur les travaux de plomberie ?",
        a: "Garantie d'1 an minimum sur la pose, garantie constructeur sur les pièces (2 à 10 ans selon marque). Les défauts d'installation sont repris à nos frais dans la première année.",
      },
    ],
    internalLinks: [
      { label: "Salle de bain", href: "/salle-de-bain-luxembourg" },
      { label: "Chauffe-eau", href: "/chauffe-eau-luxembourg" },
      { label: "Dépannage 24/7", href: "/depannage-luxembourg" },
      { label: "Sanitaire complet", href: "/sanitaire" },
    ],
    ctaLine:
      "Besoin d'un plombier en urgence ou pour un projet planifié ? Décrivez votre besoin en 2 minutes, on revient sous 24h.",
  },
};

export const SEO_SLUGS = Object.keys(SEO_PAGES);
