/**
 * Catalogue des communes luxembourgeoises pour pages géo SEO.
 *
 * But : ranker sur les requêtes "chauffage [commune]", "pompe à chaleur [commune]",
 * "climatisation [commune]" qui captent la demande locale.
 *
 * Discipline éditoriale : pas de fausse promesse de proximité, pas de chiffre
 * inventé sur l'activité commune par commune. On parle des typologies de
 * bâtiments représentatives de la commune et des contraintes spécifiques.
 */

/**
 * Fiche données factuelles d'une commune — sources officielles citées.
 * Tous les champs sont vérifiables (STATEC, sites communaux, syvicol.lu).
 */
export type CommuneFacts = {
  /** Population au 1er janvier — chiffre STATEC ou site communal officiel. */
  population: number;
  /** Année de référence du chiffre population. */
  populationYear: number;
  /** Source URL exacte du chiffre population. */
  populationSource: string;
  /** Superficie en km². */
  areaKm2: number;
  /** Distance à vol d'oiseau depuis Luxembourg-Ville (0 pour LU-Ville). */
  distanceFromLuxKm: number;
  /** Bourgmestre en exercice (nom + parti). */
  mayor: string;
  /** Code commune LAU (Local Administrative Unit, code Eurostat). */
  lauCode?: string;
  /** Site web officiel de la commune. */
  officialUrl: string;
  /** Plage code postal (Luxembourg utilise un système par rue). */
  postalRange: string;
};

export type Commune = {
  slug: string;
  name: string;
  /** Données factuelles vérifiables (STATEC / site commune). */
  facts: CommuneFacts;
  /** Population indicative (pour briefer le lecteur, pas un chiffre marketing). */
  context: string;
  /** Description honnête du tissu bâti, sans flatterie. */
  buildingProfile: string;
  /** Spécificités techniques à considérer dans la commune. */
  considerations: string[];
  /** Typologies de projets fréquents (utilisé dans le H2 « projets typiques »). */
  typicalProjects: string[];
};

export const COMMUNES: Commune[] = [
  {
    slug: "luxembourg-ville",
    name: "Luxembourg-Ville",
    facts: {
      population: 136161,
      populationYear: 2025,
      populationSource: "https://www.vdl.lu/en/news/2025-census-figures",
      areaKm2: 51.46,
      distanceFromLuxKm: 0,
      mayor: "Lydie Polfer (DP)",
      lauCode: "LU0000304",
      officialUrl: "https://www.vdl.lu",
      postalRange: "L-1009 à L-2999 (24 quartiers)",
    },
    context:
      "Capitale du Grand-Duché, la ville mêle immeubles haussmanniens, projets contemporains (Kirchberg, Cloche d'Or) et résidentiel collectif dense.",
    buildingProfile:
      "Le bâti est très varié : appartements anciens dans le Centre et la Vieille Ville, immeubles modernes du Kirchberg et de la Cloche d'Or, et zones résidentielles en pourtour (Belair, Limpertsberg, Merl). Les contraintes patrimoniales sont fréquentes en centre historique.",
    considerations: [
      "Accès logistique limité dans le Centre — anticipation du chantier indispensable",
      "Réglementation patrimoine (Vieille Ville, façades classées) pour les unités extérieures",
      "Acoustique critique dans les zones résidentielles denses",
      "Coordination régulière avec syndicats de copropriété en collectif",
    ],
    typicalProjects: [
      "Remplacement de chaudière en appartement haussmannien",
      "Climatisation discrète dans bureau tertiaire au Kirchberg",
      "Pompe à chaleur en rénovation à Limpertsberg ou Belair",
      "Rénovation salle de bain premium en collaboration architecte",
    ],
  },
  {
    slug: "esch-sur-alzette",
    name: "Esch-sur-Alzette",
    facts: {
      population: 37922,
      populationYear: 2025,
      populationSource: "https://statistiques.public.lu/fr/actualites/2025/stn16-population-2025.html",
      areaKm2: 14.35,
      distanceFromLuxKm: 15,
      mayor: "Christian Weis (CSV)",
      lauCode: "LU0000204",
      officialUrl: "https://esch.lu",
      postalRange: "L-4010 à L-4374",
    },
    context:
      "Deuxième ville du pays, ancien bassin minier et sidérurgique transformé. Mélange de bâti ouvrier, de rénovations contemporaines (Belval) et de pavillonnaire récent.",
    buildingProfile:
      "Bâti hétérogène : maisons ouvrières historiques avec souvent un besoin d'isolation et de modernisation thermique, immeubles collectifs des années 70 en rénovation, et zones neuves (Belval, plateau de Lallange) très bien isolées.",
    considerations: [
      "Besoin marqué de remplacement des installations anciennes",
      "Énergies fossiles (fioul, gaz) encore présentes — transition à structurer",
      "Belval : bâtiments très efficaces où la climatisation devient pertinente l'été",
      "Aides communales spécifiques à vérifier",
    ],
    typicalProjects: [
      "Sortie de chauffage fioul vers pompe à chaleur en maison ouvrière",
      "Rénovation énergétique complète (isolation + chauffage + ventilation)",
      "Climatisation résidentielle dans appartement neuf à Belval",
      "Chaufferie collective modernisée dans immeuble années 70",
    ],
  },
  {
    slug: "differdange",
    name: "Differdange",
    facts: {
      population: 30789,
      populationYear: 2025,
      populationSource: "https://en.wikipedia.org/wiki/Differdange",
      areaKm2: 22.18,
      distanceFromLuxKm: 27,
      mayor: "Guy Altmeisch (LSAP)",
      lauCode: "LU0000202",
      officialUrl: "https://differdange.lu",
      postalRange: "L-4501 à L-4945",
    },
    context:
      "Troisième commune du pays. Tissu industriel reconverti, résidentiel ouvrier et zones contemporaines.",
    buildingProfile:
      "Beaucoup de maisons individuelles anciennes avec chaudière en fin de cycle, à côté de programmes neufs récents avec exigences énergétiques élevées. Le rythme de rénovation est soutenu.",
    considerations: [
      "Forte demande de remplacement de chauffage gaz / fioul",
      "Maisons mitoyennes : contraintes acoustiques pour unités PAC",
      "Programmes neufs intégrant souvent solaire photovoltaïque",
    ],
    typicalProjects: [
      "Remplacement chaudière en maison ouvrière rénovée",
      "PAC air/eau en construction neuve",
      "Couplage PV + PAC en programmes contemporains",
      "Modernisation sanitaire complète",
    ],
  },
  {
    slug: "strassen",
    name: "Strassen",
    facts: {
      population: 10631,
      populationYear: 2025,
      populationSource: "https://www.strassen.lu/citoyens-residents/la-commune-en-chiffres",
      areaKm2: 10.71,
      distanceFromLuxKm: 5,
      mayor: "Nico Pundel (CSV)",
      officialUrl: "https://www.strassen.lu",
      postalRange: "L-8001 à L-8099",
    },
    context:
      "Commune résidentielle haut de gamme en proche périphérie de Luxembourg-Ville. Importante zone d'activité commerciale.",
    buildingProfile:
      "Villas individuelles soignées, parfois d'architecte, sur de grandes parcelles. Programmes neufs collectifs récents. Tertiaire significatif (centres commerciaux, bureaux).",
    considerations: [
      "Exigence esthétique forte — intégration discrète des unités extérieures",
      "Projets souvent menés avec architecte d'intérieur ou maître d'œuvre",
      "Salles de bain premium fréquentes",
      "Tertiaire avec besoins de climatisation centralisée et GTC",
    ],
    typicalProjects: [
      "Pompe à chaleur géothermique en villa",
      "Climatisation gainable invisible avec architecte",
      "Rénovation salle de bain premium",
      "Climatisation centralisée en bureau tertiaire",
    ],
  },
  {
    slug: "bertrange",
    name: "Bertrange",
    facts: {
      population: 9097,
      populationYear: 2025,
      populationSource: "https://fr.wikipedia.org/wiki/Bertrange_(Luxembourg)",
      areaKm2: 17.39,
      distanceFromLuxKm: 6.5,
      mayor: "Youri De Smet (DP)",
      lauCode: "LU0000301",
      officialUrl: "https://www.bertrange.lu",
      postalRange: "L-8011 à L-8099",
    },
    context:
      "Commune résidentielle limitrophe de Luxembourg-Ville et zone commerciale majeure (Cloche d'Or).",
    buildingProfile:
      "Mix de résidentiel pavillonnaire récent (très isolé), de petits collectifs et de tertiaire en plein développement. Les projets neufs intègrent presque systématiquement pompe à chaleur et solaire.",
    considerations: [
      "Bâti récent à haute performance énergétique",
      "Climatisation devenue pertinente en logement neuf l'été",
      "Programmes tertiaires modernes avec besoins multi-zones",
      "Coordination avec syndic de copropriété en collectif neuf",
    ],
    typicalProjects: [
      "PAC + photovoltaïque en villa contemporaine",
      "Climatisation résidentielle réversible en logement neuf",
      "Chaufferie de programme collectif neuf",
      "Système multi-zones en bureau tertiaire à Cloche d'Or",
    ],
  },
];

export function getCommune(slug: string): Commune | undefined {
  return COMMUNES.find((c) => c.slug === slug);
}
