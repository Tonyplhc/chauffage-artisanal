/**
 * Glossaire HVAC luxembourgeois — termes techniques définis.
 *
 * Cible SEO : capter les requêtes informationnelles type "qu'est-ce que
 * SCOP", "COP définition", "n50 Blower Door"… Le markup DefinedTerm de
 * Schema.org permet à Google d'afficher les définitions directement dans
 * la SERP (rich snippet "Vue d'ensemble").
 *
 * Réfs sources :
 *   - klima-agence.lu (terminologie LU)
 *   - guichet.public.lu (terminologie Klimabonus)
 *   - Normes ISO/DIN citées explicitement
 *   - F-Gas III pour les fluides
 */

export type Term = {
  slug: string;
  term: string;
  alternateNames?: string[];
  category:
    | "chauffage"
    | "pac"
    | "climatisation"
    | "ventilation"
    | "fluides"
    | "energie"
    | "regulation"
    | "fiscalite";
  definition: string;
  context?: string; // Précision contextuelle / pratique
  source?: { label: string; url: string };
};

export const GLOSSARY: Term[] = [
  // ─── Chauffage ──────────────────────────────────────
  {
    slug: "chaudiere-condensation",
    term: "Chaudière à condensation",
    category: "chauffage",
    definition:
      "Chaudière gaz ou fioul qui récupère la chaleur des fumées d'échappement par condensation de la vapeur d'eau, atteignant des rendements supérieurs à 100 % sur PCI (pouvoir calorifique inférieur).",
    context:
      "Standard depuis les années 2010 au Luxembourg. Rendement typique 95-108 % PCI. Nécessite une évacuation des condensats acides.",
  },
  {
    slug: "rendement-pci",
    term: "Rendement PCI",
    alternateNames: ["Pouvoir calorifique inférieur"],
    category: "energie",
    definition:
      "Mesure du rendement d'un appareil de combustion, basée sur l'énergie disponible si l'eau produite par la combustion reste à l'état vapeur. Distinct du rendement PCS qui inclut l'énergie de condensation.",
    context:
      "C'est le PCI qui est utilisé pour comparer les chaudières au Luxembourg. Une chaudière condensation peut afficher > 100 % PCI car elle exploite l'énergie de condensation.",
  },
  {
    slug: "ramonage",
    term: "Ramonage",
    category: "chauffage",
    definition:
      "Nettoyage mécanique du conduit de fumée pour évacuer les suies et bistre. Obligatoire au Luxembourg pour les installations bois et fioul selon les communes.",
  },

  // ─── PAC ──────────────────────────────────────
  {
    slug: "cop",
    term: "COP",
    alternateNames: ["Coefficient de performance"],
    category: "pac",
    definition:
      "Rapport entre l'énergie thermique restituée par une pompe à chaleur et l'énergie électrique consommée par son compresseur. Mesuré à une température extérieure fixe (typiquement +7°C, +2°C ou -7°C).",
    context:
      "COP > 3 = la PAC restitue 3× plus d'énergie qu'elle n'en consomme. À ne pas confondre avec le SCOP qui est annualisé.",
  },
  {
    slug: "scop",
    term: "SCOP",
    alternateNames: ["Seasonal Coefficient of Performance"],
    category: "pac",
    definition:
      "COP saisonnier — moyenne pondérée du COP sur l'année selon le climat de référence. Indicateur plus représentatif des performances réelles d'une PAC qu'un COP ponctuel.",
    context:
      "Au Luxembourg, comptez SCOP 3,5 à 4,5 pour une PAC air/eau bien dimensionnée et bien posée. SCOP 4,5+ pour une géothermique.",
  },
  {
    slug: "pac-air-eau",
    term: "Pompe à chaleur air/eau",
    alternateNames: ["PAC air/eau"],
    category: "pac",
    definition:
      "Pompe à chaleur qui prélève les calories dans l'air extérieur et les transfère à un circuit hydraulique de chauffage (radiateurs ou plancher chauffant).",
    context:
      "Solution la plus répandue en résidentiel au LU. Pas de forage requis. SCOP typique 3,5-4,5.",
  },
  {
    slug: "pac-geothermique",
    term: "Pompe à chaleur géothermique",
    alternateNames: ["PAC sol/eau", "PAC eau glycolée/eau"],
    category: "pac",
    definition:
      "Pompe à chaleur qui prélève les calories dans le sol via des sondes verticales (forage) ou des capteurs horizontaux. Plus performante et plus silencieuse que l'air/eau, mais investissement initial supérieur.",
    context:
      "Forage typique 80-150 m de profondeur. SCOP 4,5-5,5. Coût installation 25-40 k€ posée au LU.",
  },
  {
    slug: "pac-hybride",
    term: "PAC hybride",
    category: "pac",
    definition:
      "Système couplant une pompe à chaleur (pour les besoins courants) et une chaudière gaz (pour les pics de froid ou besoins ECS importants). La régulation choisit la source la plus efficiente selon la température extérieure.",
    context:
      "Pertinent en rénovation lourde sur bâtiments mal isolés où une PAC seule serait sous-dimensionnée.",
  },

  // ─── Fluides ──────────────────────────────────────
  {
    slug: "fluide-r32",
    term: "R32",
    alternateNames: ["Difluorométhane"],
    category: "fluides",
    definition:
      "Fluide frigorigène HFC à PRG (potentiel de réchauffement global) modéré (PRG 675), standard des PAC et climatisations résidentielles depuis 2018.",
    context:
      "Remplaçant progressif du R410A. Légèrement inflammable (classe A2L) — précautions à l'installation.",
  },
  {
    slug: "fluide-r290",
    term: "R290",
    alternateNames: ["Propane"],
    category: "fluides",
    definition:
      "Fluide frigorigène naturel (propane) à PRG très bas (PRG 3), utilisé sur les PAC nouvelle génération depuis 2024.",
    context:
      "Solution la plus durable environnementalement. Inflammabilité élevée (A3) → installation extérieure, distances de sécurité.",
  },
  {
    slug: "attestation-fluides-cat-1",
    term: "Attestation d'aptitude fluides cat I",
    category: "fluides",
    definition:
      "Certification individuelle obligatoire pour manipuler des fluides frigorigènes fluorés (HFC/HFO) sur clim, PAC, frigorifique. La catégorie I couvre toutes opérations sans limite de charge.",
    source: {
      label: "Règlement (UE) 2024/573 F-Gas III",
      url: "https://eur-lex.europa.eu/eli/reg/2024/573/oj",
    },
    context:
      "Au Luxembourg, certifiée par CDC-GTB (Bettembourg) ou Isocert Lux (Livange). L'entreprise doit aussi être certifiée en tant que personne morale.",
  },
  {
    slug: "controle-etancheite",
    term: "Contrôle d'étanchéité",
    category: "fluides",
    definition:
      "Vérification périodique obligatoire des installations contenant des fluides frigorigènes fluorés. Fréquence en fonction de la charge équivalent CO2 (5, 50, 500 t CO2 eq) et de la présence d'un système de détection automatique.",
    source: {
      label: "F-Gas III article 5",
      url: "https://eur-lex.europa.eu/eli/reg/2024/573/oj",
    },
  },

  // ─── Climatisation ──────────────────────────────────────
  {
    slug: "mono-split",
    term: "Mono-split",
    category: "climatisation",
    definition:
      "Système de climatisation composé d'une unité extérieure connectée à une seule unité intérieure. Solution simple pour climatiser une pièce.",
  },
  {
    slug: "multi-split",
    term: "Multi-split",
    category: "climatisation",
    definition:
      "Climatisation reliant une unité extérieure à plusieurs unités intérieures (2 à 5 typiquement). Pratique en résidentiel pour climatiser plusieurs pièces avec une seule installation extérieure.",
  },
  {
    slug: "vrv-vrf",
    term: "VRV / VRF",
    alternateNames: ["Variable Refrigerant Volume", "Variable Refrigerant Flow"],
    category: "climatisation",
    definition:
      "Système de climatisation tertiaire reliant une unité extérieure puissante à de nombreuses unités intérieures (jusqu'à 60+), avec régulation fine du débit de fluide selon les besoins par zone.",
    context:
      "Standard en bureaux, hôtels, centres commerciaux. Permet la récupération de chaleur entre zones (un bureau qui chauffe, un autre qui refroidit).",
  },
  {
    slug: "fluides-frigorigenes",
    term: "Fluides frigorigènes",
    alternateNames: ["Réfrigérants"],
    category: "fluides",
    definition:
      "Substances chimiques utilisées dans les circuits de pompe à chaleur, climatisation et réfrigération pour transporter la chaleur par changement d'état (évaporation/condensation).",
  },

  // ─── Ventilation ──────────────────────────────────────
  {
    slug: "vmc-simple-flux",
    term: "VMC simple flux",
    alternateNames: ["Ventilation mécanique contrôlée"],
    category: "ventilation",
    definition:
      "Système de ventilation extrayant l'air vicié des pièces humides (cuisine, salle de bain, WC), avec entrées d'air neuf passives dans les pièces de vie.",
    context: "Solution accessible (1 800-3 500 € posée au LU). Pas de récupération de chaleur.",
  },
  {
    slug: "vmc-double-flux",
    term: "VMC double flux",
    category: "ventilation",
    definition:
      "Système de ventilation avec extraction de l'air vicié ET insufflation de l'air neuf, équipé d'un échangeur qui récupère la chaleur de l'air sortant pour préchauffer l'air entrant (jusqu'à 92 % de rendement).",
    context:
      "Indispensable en construction passive ou BBC. Coût LU 6 000-12 000 € posée.",
  },
  {
    slug: "n50",
    term: "n50",
    alternateNames: ["Renouvellement d'air à 50 Pa"],
    category: "ventilation",
    definition:
      "Indicateur d'étanchéité à l'air d'un bâtiment, mesuré lors d'un test Blower Door (norme DIN ISO 9972). Représente le nombre de fois où le volume d'air du bâtiment est renouvelé par heure sous une différence de pression de 50 Pa.",
    source: {
      label: "Norme DIN ISO 9972",
      url: "https://www.iso.org/standard/55718.html",
    },
    context:
      "Cible au LU : n50 < 0,6 pour passif (AAA, obligatoire neuf 2026), n50 < 1,0 pour BBC.",
  },
  {
    slug: "blower-door",
    term: "Test Blower Door",
    category: "ventilation",
    definition:
      "Mesure de l'étanchéité à l'air d'un bâtiment selon la norme DIN ISO 9972, via une porte étanche équipée d'un ventilateur calibré qui met le bâtiment en surpression ou dépression de 50 Pa.",
    source: {
      label: "Renov.lu",
      url: "https://renov.lu/etancheite-air-blower-door-test/",
    },
    context:
      "Au Luxembourg, test reconnu uniquement s'il est réalisé par un bureau certifié FLIB.",
  },

  // ─── Énergie ──────────────────────────────────────
  {
    slug: "kwh-thermique",
    term: "kWh thermique",
    alternateNames: ["kWh utile"],
    category: "energie",
    definition:
      "Quantité d'énergie de chauffage réellement délivrée à l'habitation, indépendamment du combustible consommé pour la produire. Permet de comparer différents systèmes (gaz, fioul, PAC) sur une base commune.",
    context:
      "Une maison luxembourgeoise moyennement isolée consomme typiquement 15 000 à 20 000 kWh thermique/an.",
  },
  {
    slug: "energiepass",
    term: "Energiepass",
    alternateNames: ["Passeport énergétique"],
    category: "energie",
    definition:
      "Document officiel luxembourgeois certifiant la performance énergétique d'un bâtiment. Obligatoire à la vente, à la location et pour les travaux énergétiques. Délivré par un conseiller énergie certifié.",
    source: {
      label: "Klima-Agence — Energiepass",
      url: "https://klima-agence.lu/en/energiepass",
    },
    context: "Classes A à I. AAA = passif, BBB = basse énergie.",
  },
  {
    slug: "ecs",
    term: "ECS",
    alternateNames: ["Eau Chaude Sanitaire"],
    category: "energie",
    definition:
      "Eau chaude utilisée pour les usages domestiques (douches, vaisselle, lessive). Représente typiquement 15-25 % de la consommation énergétique d'un foyer luxembourgeois.",
  },
  {
    slug: "deperditions-thermiques",
    term: "Déperditions thermiques",
    category: "energie",
    definition:
      "Pertes de chaleur d'un bâtiment vers l'extérieur, par les murs, le toit, les fenêtres et les ponts thermiques. Mesurées en kWh/m²/an ou W/m²K (coefficient U).",
    context:
      "Une maison non isolée a un U-mur ~1,5 W/m²K. Une maison passive ~0,15 W/m²K.",
  },

  // ─── Régulation ──────────────────────────────────────
  {
    slug: "scrb",
    term: "SCRB",
    alternateNames: ["Service Contrôle Réception Bâtiments"],
    category: "regulation",
    definition:
      "Service de la Chambre des Métiers du Luxembourg chargé de réceptionner les installations à gaz et chaudières neuves, dans les 4 semaines suivant leur mise en service.",
    source: {
      label: "Chambre des Métiers — SCRB",
      url: "https://www.cdm.lu/scrb/controle-des-installations-du-batiment-particuliers",
    },
  },
  {
    slug: "klimabonus",
    term: "Klimabonus",
    category: "regulation",
    definition:
      "Programme national luxembourgeois d'aides financières pour la transition énergétique du logement. Couvre PAC, biomasse, solaire, isolation, ventilation, photovoltaïque.",
    source: {
      label: "Klimabonus 2026 — guichet.public.lu",
      url: "https://guichet.public.lu/fr/citoyens/aides/logement-construction/klimabonus-2026/",
    },
    context:
      "Régime 2026 applicable jusqu'au 31.12.2035. Préfinancement automatique pour le PV depuis 04.01.2026.",
  },
  {
    slug: "klima-agence",
    term: "Klima-Agence",
    category: "regulation",
    definition:
      "Agence publique luxembourgeoise pour la transition énergétique du bâtiment. Délivre les certifications professionnelles (conseillers énergie, artisans) et gère le programme Klimabonus.",
    source: {
      label: "Klima-Agence",
      url: "https://www.klima-agence.lu",
    },
  },
  {
    slug: "klimapakt",
    term: "Klimapakt",
    category: "regulation",
    definition:
      "Pacte climatique entre l'État luxembourgeois et les communes pour la transition énergétique locale. Les communes signataires proposent souvent des aides complémentaires au Klimabonus.",
    context:
      "Ville de Luxembourg ajoute jusqu'à +50 % du Klimabonus. Autres communes : 1 000-3 000 € forfaitaires.",
  },

  // ─── Fiscalité ──────────────────────────────────────
  {
    slug: "tva-3-pourcent",
    term: "TVA logement 3 %",
    category: "fiscalite",
    definition:
      "Taux super-réduit de TVA appliqué aux travaux de rénovation et création de logements affectés à l'habitation principale au Luxembourg, en lieu et place du taux standard de 17 %.",
    source: {
      label: "TVA logement — pfi.public.lu",
      url: "https://pfi.public.lu/fr/citoyen/tva/logement.html",
    },
    context:
      "Plafond de faveur fiscale 50 000 € par logement. Autorisation préalable AED obligatoire avant travaux.",
  },
  {
    slug: "bellegen-akt",
    term: "Bëllegen Akt",
    category: "fiscalite",
    definition:
      "Crédit d'impôt luxembourgeois de 40 000 € par acquéreur sur les droits d'enregistrement et de transcription lors de l'acquisition d'un logement en résidence principale. Pérennisé par la loi du 3 juillet 2025.",
    source: {
      label: "Crédit d'impôt actes notariés",
      url: "https://guichet.public.lu/fr/citoyens/aides/logement-construction/aides-indirectes/credit-impot-actes-notaries.html",
    },
  },
];

export const CATEGORY_LABELS: Record<Term["category"], string> = {
  chauffage: "Chauffage",
  pac: "Pompes à chaleur",
  climatisation: "Climatisation",
  ventilation: "Ventilation",
  fluides: "Fluides frigorigènes",
  energie: "Énergie",
  regulation: "Réglementation",
  fiscalite: "Fiscalité",
};

/**
 * Génère le JSON-LD DefinedTermSet + DefinedTerm pour la page glossaire.
 * Permet à Google d'afficher les définitions en rich snippet.
 */
export function buildGlossaryJsonLd(canonicalUrl: string) {
  return {
    "@context": "https://schema.org",
    "@type": "DefinedTermSet",
    name: "Glossaire HVAC Luxembourg",
    description:
      "Termes techniques et réglementaires du secteur chauffage, ventilation, climatisation au Luxembourg.",
    url: canonicalUrl,
    hasDefinedTerm: GLOSSARY.map((t) => ({
      "@type": "DefinedTerm",
      "@id": `${canonicalUrl}#${t.slug}`,
      name: t.term,
      alternateName: t.alternateNames,
      description: t.definition,
      inDefinedTermSet: canonicalUrl,
      termCode: t.slug,
    })),
  };
}
