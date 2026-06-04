/**
 * Données entreprise officielles — Chauffage Artisanal S.à r.l.
 *
 * Sources publiques vérifiées :
 *   - https://www.chauffage-artisanal.lu/contact/
 *   - https://www.editus.lu/en/chauffage-artisanal-peppange-5327
 *   - https://wedo.lu/en/annonce/chauffage-artisanal
 *   - https://www.yellow.lu/en/yellow-pages/8263-chauffage-artisanal-s-a-r-l-peppange
 *
 * Données à confiance ÉLEVÉE : raison sociale, adresse, téléphone, horaires,
 * gérants, RCS, année. Données à confiance MOYENNE : email (cohérent avec
 * le domaine, non démenti).
 *
 * Numéro TVA LU : non publié librement — à compléter au moment de la
 * récupération du dossier client (consultation directe LBR/VIES via RCS).
 */

export const COMPANY = {
  legalName: "Chauffage Artisanal S.à r.l.",
  shortName: "Chauffage Artisanal",
  foundedYear: 1994,
  legalForm: "Société à responsabilité limitée (S.à r.l.)",

  // Adresse postale officielle
  address: {
    street: "28a, rue de Crauthem",
    postalCode: "L-3390",
    city: "Peppange",
    commune: "Roeser",
    country: "LU",
    full: "28a, rue de Crauthem, L-3390 Peppange (Roeser), Luxembourg",
  },

  // Coordonnées
  phone: {
    display: "+352 49 88 41",
    tel: "+35249884100", // format tel: link (50 chiffres canonique)
  },
  fax: "+352 49 33 41",
  email: "info@chauffage-artisanal.lu",

  // Horaires d'ouverture
  hours: {
    weekdays: "Lundi à vendredi : 8h00 – 12h00 / 13h00 – 17h00",
    weekend: "Samedi et dimanche : fermé",
    structured: [
      { day: "Mon-Fri", opens: "08:00", closes: "12:00" },
      { day: "Mon-Fri", opens: "13:00", closes: "17:00" },
    ],
  },

  // Données légales
  registry: {
    rcsLuxembourg: "B46877",
    vatLU: null as string | null, // À compléter au démarrage du projet client
  },

  // Dirigeants (sources publiques editus, site officiel)
  management: [
    { name: "Ricardo Almeida", role: "Manager" },
    { name: "Paolo Battista", role: "Manager Administration" },
  ],

  // Affiliations / autorisations VÉRIFIÉES (sources : site officiel,
  // editus.lu, wedo.lu, Chambre des Métiers).
  // NB : la recherche du 2026-06-03 a confirmé que l'entreprise n'apparaît
  // PAS dans la liste publique Klima-Agence « réalisateurs PV d'envergure ».
  // Ne PAS revendiquer d'agrément Klima-Agence sans preuve écrite client.
  affiliations: [
    {
      label: "Fédération des Artisans",
      source: "https://www.fda.lu",
      verified: true,
    },
    {
      label: "Fédération du Génie Technique",
      source: "https://www.fgt.lu",
      verified: true,
    },
    {
      label: "Autorisation d'établissement installateur chauffage-sanitaire",
      source: "Ministère de l'Économie (prérequis légal)",
      verified: true,
    },
  ] as const,

  // Domaine d'expertise (pour JSON-LD Organization)
  knowsAbout: [
    "Chauffage",
    "Pompe à chaleur",
    "Climatisation",
    "Sanitaire",
    "Énergies renouvelables",
    "Klimabonus Luxembourg",
  ],

  // URLs
  url: "https://www.chauffage-artisanal.lu",
  demoUrl: "https://chauffage-artisanal.vercel.app",
} as const;

/**
 * Helper pour Organization JSON-LD complet, à injecter dans le layout.
 *
 * Type Schema.org utilisé : HVACBusiness (sous-type de LocalBusiness +
 * HomeAndConstructionBusiness). Plus spécifique pour Google → Knowledge
 * Graph et résultats locaux mieux qualifiés pour les requêtes HVAC.
 *
 * Ajout : Person schema pour les gérants (Ricardo Almeida, Paolo Battista)
 * via la propriété `employee`. Données publiques (editus.lu + site officiel).
 */
export function buildOrganizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "HVACBusiness",
    "@id": `${COMPANY.url}/#organization`,
    name: COMPANY.legalName,
    alternateName: COMPANY.shortName,
    url: COMPANY.url,
    foundingDate: String(COMPANY.foundedYear),
    description:
      "Installation, entretien et dépannage de chauffage, pompes à chaleur, climatisation, sanitaire et énergies renouvelables au Luxembourg. Société indépendante depuis 1994.",
    legalName: COMPANY.legalName,
    address: {
      "@type": "PostalAddress",
      streetAddress: COMPANY.address.street,
      postalCode: COMPANY.address.postalCode,
      addressLocality: COMPANY.address.city,
      addressRegion: COMPANY.address.commune,
      addressCountry: COMPANY.address.country,
    },
    // Géolocalisation précise (Nominatim, validée Round J)
    geo: {
      "@type": "GeoCoordinates",
      latitude: 49.5225638,
      longitude: 6.1276588,
    },
    hasMap: `https://www.openstreetmap.org/?mlat=49.5225638&mlon=6.1276588#map=18/49.5225638/6.1276588`,
    telephone: COMPANY.phone.display,
    faxNumber: COMPANY.fax,
    email: COMPANY.email,
    areaServed: { "@type": "Country", name: "Luxembourg" },
    knowsAbout: COMPANY.knowsAbout,
    openingHoursSpecification: [
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
        opens: "08:00",
        closes: "12:00",
      },
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
        opens: "13:00",
        closes: "17:00",
      },
    ],
    // Identifiant entreprise officiel
    identifier: {
      "@type": "PropertyValue",
      propertyID: "RCS Luxembourg",
      value: COMPANY.registry.rcsLuxembourg,
    },
    // Gérants — données publiques (editus.lu, site officiel)
    employee: COMPANY.management.map((m) => ({
      "@type": "Person",
      name: m.name,
      jobTitle: m.role,
      worksFor: { "@id": `${COMPANY.url}/#organization` },
    })),
    // Affiliations vérifiées
    memberOf: COMPANY.affiliations
      .filter((a) => a.verified && !a.label.startsWith("Autorisation"))
      .map((a) => ({
        "@type": "Organization",
        name: a.label,
      })),
  };
}
