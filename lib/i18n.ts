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
    metiers: string;
    maisonInfos: string;
  };
  // Home hero
  hero: {
    eyebrowEst: string;
    eyebrowAtelier: string;
    titlePart1: string;
    titleHighlight: string;
    titlePart2: string;
    principleEyebrow: string;
    principleQuote: string;
    principleAttribution: string;
    methodLink: string;
    introBody: string;
    devisCta: string;
    depannage: string;
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
    metiers: "Métiers",
    maisonInfos: "Maison & infos",
  },
  hero: {
    eyebrowEst: "Est. 1994",
    eyebrowAtelier: "Atelier thermique luxembourgeois",
    titlePart1: "Le confort thermique",
    titleHighlight: "nouvelle génération",
    titlePart2: "au Luxembourg.",
    principleEyebrow: "Le principe",
    principleQuote:
      "Ce qui distingue une bonne installation d'une mauvaise, ce n'est pas le matériel —",
    principleAttribution: "Direction technique · Chauffage Artisanal",
    methodLink: "Méthode",
    introBody:
      "nous concevons, installons et entretenons les systèmes thermiques des maisons, immeubles et bâtiments tertiaires du Grand-Duché.",
    devisCta: "Demander un devis",
    depannage: "Dépannage",
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
    metiers: "Fachgebiete",
    maisonInfos: "Haus & Infos",
  },
  hero: {
    eyebrowEst: "Seit 1994",
    eyebrowAtelier: "Luxemburger Heizungsfachbetrieb",
    titlePart1: "Thermischer Komfort",
    titleHighlight: "neue Generation",
    titlePart2: "in Luxemburg.",
    principleEyebrow: "Unser Prinzip",
    principleQuote:
      "Was eine gute Installation von einer schlechten unterscheidet, ist nicht das Material —",
    principleAttribution: "Technische Leitung · Chauffage Artisanal",
    methodLink: "Methode",
    introBody:
      "planen, installieren und warten wir die thermischen Systeme von Häusern, Mehrfamilienhäusern und Geschäftsgebäuden im Großherzogtum.",
    devisCta: "Angebot anfordern",
    depannage: "Notdienst",
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
    metiers: "Trades",
    maisonInfos: "Company",
  },
  hero: {
    eyebrowEst: "Est. 1994",
    eyebrowAtelier: "Luxembourg HVAC craftsmen",
    titlePart1: "Next-generation",
    titleHighlight: "thermal comfort",
    titlePart2: "in Luxembourg.",
    principleEyebrow: "Our principle",
    principleQuote:
      "What sets a good installation apart isn't the hardware —",
    principleAttribution: "Technical direction · Chauffage Artisanal",
    methodLink: "Method",
    introBody:
      "we design, install and maintain the thermal systems of homes, residential and commercial buildings across the Grand Duchy.",
    devisCta: "Request a quote",
    depannage: "Emergency",
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
