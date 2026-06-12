/**
 * Internationalisation light — pas de routing multi-locale (qui demanderait une
 * réorganisation de toute l'app router). À la place : provider client + cookie
 * de préférence + dictionnaire de strings critiques (nav, CTAs, hero).
 *
 * Le contenu éditorial des pages métier reste en FR — c'est la langue maître.
 * En production, on pourrait évoluer vers next-intl si traduction complète.
 *
 * Locales supportées :
 *   - fr : Français (défaut)
 *   - de : Deutsch
 *   - en : English
 */

export type Locale = "fr" | "de" | "en";

export const LOCALES: Locale[] = ["fr", "de", "en"];

export const LOCALE_LABELS: Record<Locale, string> = {
  fr: "Français",
  de: "Deutsch",
  en: "English",
};

export const LOCALE_FLAGS: Record<Locale, string> = {
  fr: "🇫🇷",
  de: "🇩🇪",
  en: "🇬🇧",
};

export const COOKIE_NAME = "ca-locale";
export const DEFAULT_LOCALE: Locale = "fr";

/* ─────────────── Dictionnaire ─────────────── */

type Dictionary = {
  // Nav
  nav: {
    chauffage: string;
    pac: string;
    climatisation: string;
    sanitaire: string;
    enr: string;
    aides: string;
    aidesBadge: string;
    recrutement: string;
    recrutementBadge: string;
    depannage: string;
    entretien: string;
    savoirFaire: string;
    marques: string;
    realisations: string;
    actualites: string;
    aPropos: string;
    contact: string;
    devisCta: string;
    estimationCta: string;
    metiers: string;
    maisonInfos: string;
    particuliers: string;
    promoteurs: string;
    outils: string;
    outilsAll: string;
    consultation: string;
  };
  // Home hero
  hero: {
    eyebrowEst: string;
    eyebrowRegion: string;
    titleBefore: string;
    titleHighlight: string;
    titleAfter: string;
    subtitle: string;
    devisCta: string;
    depannage: string;
    proofFounded: string;
    proofCompany: string;
    proofPartners: string;
    cardLabel: string;
    cardTitle: string;
    cardSub: string;
  };
  // Common
  common: {
    learnMore: string;
    callUs: string;
    quoteRequest: string;
    languageSwitch: string;
  };
  // Footer
  footer: {
    addressLabel: string;
    hoursLabel: string;
    onCallLabel: string;
    rcsLabel: string;
    legalLinks: string;
  };
  // Klimabonus page CTAs (page strategique pour expats)
  klimabonus: {
    hero: string;
    helpedSetup: string;
    officialSource: string;
    hotline: string;
    simulator: string;
    askQuote: string;
  };
};

const FR: Dictionary = {
  nav: {
    chauffage: "Chauffage",
    pac: "PAC",
    climatisation: "Climatisation",
    sanitaire: "Sanitaire",
    enr: "Énergies renouv.",
    aides: "Aides",
    aidesBadge: "Klimabonus",
    recrutement: "Recrutement",
    recrutementBadge: "Nous recrutons",
    depannage: "Dépannage 24/7",
    entretien: "Entretien",
    savoirFaire: "Savoir-faire",
    marques: "Marques",
    realisations: "Réalisations",
    actualites: "Actualités",
    aPropos: "À propos",
    contact: "Contact",
    devisCta: "Demander un devis",
    estimationCta: "Estimation gratuite",
    metiers: "Métiers",
    maisonInfos: "Maison & infos",
    particuliers: "Particuliers",
    promoteurs: "Promoteurs",
    outils: "Outils",
    outilsAll: "Tous les outils",
    consultation: "Consultation projet",
  },
  hero: {
    eyebrowEst: "Est. 1994",
    eyebrowRegion: "Luxembourg & Grande Région",
    titleBefore: "Chauffage, pompes à chaleur et sanitaire au",
    titleHighlight: "Luxembourg",
    titleAfter: ", depuis 1994.",
    subtitle:
      "Installation, dépannage et entretien de vos systèmes thermiques. Étude personnalisée, devis sous 24 h et accompagnement Klimabonus de A à Z.",
    devisCta: "Étude gratuite sous 24 h",
    depannage: "Panne ? Appelez-nous",
    proofFounded: "Depuis 1994",
    proofCompany: "Société établie au Luxembourg",
    proofPartners: "Partenaire Viessmann · Buderus · De Dietrich",
    cardLabel: "Engagement",
    cardTitle: "Réponse sous 24 h",
    cardSub: "Étude personnalisée & chiffrée",
  },
  common: {
    learnMore: "En savoir plus",
    callUs: "Nous appeler",
    quoteRequest: "Demander un devis",
    languageSwitch: "Langue",
  },
  footer: {
    addressLabel: "Atelier",
    hoursLabel: "Horaires",
    onCallLabel: "Astreinte dépannage hors horaires",
    rcsLabel: "RCS Luxembourg",
    legalLinks: "Mentions légales",
  },
  klimabonus: {
    hero: "Klimabonus 2026 : barèmes officiels Luxembourg",
    helpedSetup: "Nous préparons le volet technique de votre dossier Klimabonus.",
    officialSource: "Source officielle",
    hotline: "Guichet unique des aides au logement",
    simulator: "Simulateur officiel Klima-Agence",
    askQuote: "Demander un devis",
  },
};

const DE: Dictionary = {
  nav: {
    chauffage: "Heizung",
    pac: "Wärmepumpe",
    climatisation: "Klimatechnik",
    sanitaire: "Sanitär",
    enr: "Erneuerbare",
    aides: "Förderungen",
    aidesBadge: "Klimabonus",
    recrutement: "Karriere",
    recrutementBadge: "Wir stellen ein",
    depannage: "Notdienst 24/7",
    entretien: "Wartung",
    savoirFaire: "Know-how",
    marques: "Marken",
    realisations: "Referenzen",
    actualites: "Aktuelles",
    aPropos: "Über uns",
    contact: "Kontakt",
    devisCta: "Angebot anfordern",
    estimationCta: "Kostenlose Schätzung",
    metiers: "Fachgebiete",
    maisonInfos: "Haus & Infos",
    particuliers: "Privatkunden",
    promoteurs: "Bauträger",
    outils: "Tools",
    outilsAll: "Alle Tools",
    consultation: "Projektberatung",
  },
  hero: {
    eyebrowEst: "Seit 1994",
    eyebrowRegion: "Luxemburg & Großregion",
    titleBefore: "Heizung, Wärmepumpen und Sanitär in",
    titleHighlight: "Luxemburg",
    titleAfter: ", seit 1994.",
    subtitle:
      "Installation, Notdienst und Wartung Ihrer Heizsysteme. Persönliche Beratung, Angebot binnen 24 h und Klimabonus-Begleitung von A bis Z.",
    devisCta: "Kostenlose Analyse < 24 h",
    depannage: "Panne? Rufen Sie an",
    proofFounded: "Seit 1994",
    proofCompany: "In Luxemburg ansässiges Unternehmen",
    proofPartners: "Partner: Viessmann · Buderus · De Dietrich",
    cardLabel: "Versprechen",
    cardTitle: "Antwort binnen 24 h",
    cardSub: "Persönliche, bezifferte Analyse",
  },
  common: {
    learnMore: "Mehr erfahren",
    callUs: "Anrufen",
    quoteRequest: "Angebot anfordern",
    languageSwitch: "Sprache",
  },
  footer: {
    addressLabel: "Werkstatt",
    hoursLabel: "Öffnungszeiten",
    onCallLabel: "Notdienst außerhalb der Bürozeiten",
    rcsLabel: "Handelsregister Luxemburg",
    legalLinks: "Impressum",
  },
  klimabonus: {
    hero: "Klimabonus 2026 : offizielle Förderbeträge Luxemburg",
    helpedSetup: "Wir übernehmen den technischen Teil Ihres Klimabonus-Antrags.",
    officialSource: "Offizielle Quelle",
    hotline: "Zentrales Wohnungsförderungsbüro",
    simulator: "Offizieller Klima-Agence-Rechner",
    askQuote: "Angebot anfordern",
  },
};

const EN: Dictionary = {
  nav: {
    chauffage: "Heating",
    pac: "Heat Pumps",
    climatisation: "Cooling",
    sanitaire: "Plumbing",
    enr: "Renewables",
    aides: "Subsidies",
    aidesBadge: "Klimabonus",
    recrutement: "Careers",
    recrutementBadge: "We're hiring",
    depannage: "24/7 Emergency",
    entretien: "Maintenance",
    savoirFaire: "Expertise",
    marques: "Brands",
    realisations: "Projects",
    actualites: "News",
    aPropos: "About",
    contact: "Contact",
    devisCta: "Request a quote",
    estimationCta: "Free estimate",
    metiers: "Trades",
    maisonInfos: "Company",
    particuliers: "Homeowners",
    promoteurs: "Developers",
    outils: "Tools",
    outilsAll: "All tools",
    consultation: "Project consultation",
  },
  hero: {
    eyebrowEst: "Est. 1994",
    eyebrowRegion: "Luxembourg & Greater Region",
    titleBefore: "Heating, heat pumps and plumbing in",
    titleHighlight: "Luxembourg",
    titleAfter: ", since 1994.",
    subtitle:
      "Installation, emergency repairs and maintenance of your heating systems. Personalised study, a quote within 24 h and full Klimabonus support.",
    devisCta: "Free study within 24 h",
    depannage: "Breakdown? Call us",
    proofFounded: "Since 1994",
    proofCompany: "Company established in Luxembourg",
    proofPartners: "Partner: Viessmann · Buderus · De Dietrich",
    cardLabel: "Commitment",
    cardTitle: "Reply within 24 h",
    cardSub: "Personalised, costed study",
  },
  common: {
    learnMore: "Learn more",
    callUs: "Call us",
    quoteRequest: "Request a quote",
    languageSwitch: "Language",
  },
  footer: {
    addressLabel: "Workshop",
    hoursLabel: "Opening hours",
    onCallLabel: "Emergency service outside office hours",
    rcsLabel: "Luxembourg Trade Register",
    legalLinks: "Legal notice",
  },
  klimabonus: {
    hero: "Klimabonus 2026: official Luxembourg subsidy rates",
    helpedSetup: "We handle the technical part of your Klimabonus application.",
    officialSource: "Official source",
    hotline: "Housing subsidies one-stop shop",
    simulator: "Official Klima-Agence calculator",
    askQuote: "Request a quote",
  },
};

export const DICTIONARIES: Record<Locale, Dictionary> = {
  fr: FR,
  de: DE,
  en: EN,
};

export function getDictionary(locale: Locale): Dictionary {
  return DICTIONARIES[locale] ?? FR;
}
