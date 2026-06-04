/**
 * Index de recherche côté public — pages statiques + articles + zones.
 *
 * Petit et embarqué dans le bundle client (les contenus sont déjà publics).
 * Pour scaler à plus de contenu, on pourrait basculer vers une API
 * /api/search avec un index in-memory côté serveur ou un service externe.
 */

export type SearchEntry = {
  type: "page" | "article" | "zone" | "service";
  href: string;
  title: string;
  description: string;
  keywords: string;
  badge?: string;
};

export const PUBLIC_SEARCH_INDEX: SearchEntry[] = [
  // Pages métier
  {
    type: "service",
    href: "/chauffage",
    title: "Chauffage",
    description: "Chaudières condensation, hybrides, biomasse",
    keywords: "chauffage chaudière gaz fioul biomasse condensation",
    badge: "Métier",
  },
  {
    type: "service",
    href: "/pompes-a-chaleur",
    title: "Pompes à chaleur",
    description: "Air/eau, géothermie, hybride",
    keywords: "pac pompe chaleur air eau sol géothermie hybride klimabonus",
    badge: "Métier",
  },
  {
    type: "service",
    href: "/climatisation",
    title: "Climatisation",
    description: "Mono/multi-split, tertiaire",
    keywords: "climatisation clim split vrv tertiaire bureau commerce",
    badge: "Métier",
  },
  {
    type: "service",
    href: "/sanitaire",
    title: "Sanitaire",
    description: "Salles de bain premium, plomberie",
    keywords: "sanitaire plomberie salle bain robinetterie adoucisseur",
    badge: "Métier",
  },
  {
    type: "service",
    href: "/energies-renouvelables",
    title: "Énergies renouvelables",
    description: "Photovoltaïque, solaire thermique, stockage",
    keywords: "solaire photovoltaïque thermique stockage batterie autoconsommation",
    badge: "Métier",
  },
  {
    type: "service",
    href: "/entretien",
    title: "Entretien",
    description: "Contrats annuels, conformité F-Gas",
    keywords: "entretien maintenance contrat fgas annuel",
    badge: "Métier",
  },
  // Pages support
  {
    type: "page",
    href: "/depannage",
    title: "Dépannage 24/7",
    description: "Intervention selon disponibilité, diagnostic prioritaire",
    keywords: "dépannage urgence panne chaudière fuite clim 24/7",
    badge: "Service",
  },
  {
    type: "page",
    href: "/primes-aides",
    title: "Primes & aides Luxembourg",
    description: "Klimabonus, aides communales, TVA réduite",
    keywords: "klimabonus primes aides subvention myenergy guichet tva",
    badge: "Service",
  },
  {
    type: "page",
    href: "/savoir-faire",
    title: "Savoir-faire & méthode",
    description: "Méthode en 5 étapes",
    keywords: "savoir-faire méthode étapes audit étude",
    badge: "Méthode",
  },
  {
    type: "page",
    href: "/realisations",
    title: "Réalisations",
    description: "Exemples de projets types",
    keywords: "réalisations projets exemples cas chantier portfolio",
    badge: "Projets",
  },
  {
    type: "page",
    href: "/recrutement",
    title: "Recrutement",
    description: "Postes ouverts en permanence",
    keywords: "recrutement carrière emploi technicien frigoriste apprenti",
    badge: "Carrière",
  },
  {
    type: "page",
    href: "/a-propos",
    title: "À propos",
    description: "Depuis 1994, maison technique luxembourgeoise",
    keywords: "à propos 1994 entreprise histoire équipe direction",
    badge: "Maison",
  },
  {
    type: "page",
    href: "/contact",
    title: "Contact & visite technique",
    description: "Devis sous 4h, visite gratuite",
    keywords: "contact devis visite rdv téléphone email whatsapp",
    badge: "Contact",
  },
  {
    type: "page",
    href: "/devis",
    title: "Demander un devis",
    description: "Configurateur en 5 étapes",
    keywords: "devis demande configurateur projet quote",
    badge: "Action",
  },
  {
    type: "page",
    href: "/zones",
    title: "Zones d'intervention",
    description: "Tout le Grand-Duché",
    keywords: "zones intervention luxembourg commune région",
    badge: "Zone",
  },
  {
    type: "page",
    href: "/actualites",
    title: "Actualités",
    description: "Articles techniques et lectures Klimabonus",
    keywords: "actualités blog articles news klimabonus",
    badge: "Contenu",
  },
  // Communes
  {
    type: "zone",
    href: "/zones/luxembourg-ville",
    title: "Luxembourg-Ville",
    description: "Capitale du Grand-Duché",
    keywords: "luxembourg ville centre kirchberg belair limpertsberg merl",
    badge: "Zone",
  },
  {
    type: "zone",
    href: "/zones/esch-sur-alzette",
    title: "Esch-sur-Alzette",
    description: "Deuxième ville, ancien bassin minier",
    keywords: "esch alzette belval lallange minier ouvrier",
    badge: "Zone",
  },
  {
    type: "zone",
    href: "/zones/differdange",
    title: "Differdange",
    description: "Tissu industriel reconverti",
    keywords: "differdange industrielle reconversion",
    badge: "Zone",
  },
  {
    type: "zone",
    href: "/zones/strassen",
    title: "Strassen",
    description: "Résidentiel haut de gamme",
    keywords: "strassen résidentiel villa architecte",
    badge: "Zone",
  },
  {
    type: "zone",
    href: "/zones/bertrange",
    title: "Bertrange",
    description: "Cloche d'Or, résidentiel et tertiaire",
    keywords: "bertrange cloche or résidentiel tertiaire",
    badge: "Zone",
  },
  // Articles
  {
    type: "article",
    href: "/actualites/klimabonus-2026-ce-quil-faut-savoir",
    title: "Klimabonus 2026 : ce qui change",
    description: "Lecture du programme d'aides énergie",
    keywords: "klimabonus 2026 aide subvention myenergy",
    badge: "Article",
  },
  {
    type: "article",
    href: "/actualites/pac-hybride-renovation-quand-cest-pertinent",
    title: "PAC hybride en rénovation",
    description: "Quand est-ce pertinent ?",
    keywords: "pac hybride rénovation pompe chaleur",
    badge: "Article",
  },
  {
    type: "article",
    href: "/actualites/sortir-du-fioul-trajectoire-raisonnee",
    title: "Sortir du fioul",
    description: "Trajectoire raisonnée",
    keywords: "fioul transition énergétique pac chaudière",
    badge: "Article",
  },
];

/* ─────────────── Helpers de recherche ─────────────── */

export type SearchResult = {
  entry: SearchEntry;
  score: number;
};

/**
 * Recherche fuzzy simple : tokenize la requête + score chaque entrée selon
 * combien de tokens matchent le titre + keywords. Pas de Levenshtein
 * (overkill, lent en JS pur sur le client).
 */
export function searchEntries(query: string, entries: SearchEntry[]): SearchResult[] {
  const q = query.toLowerCase().trim();
  if (!q) return [];
  const tokens = q.split(/\s+/).filter((t) => t.length > 0);

  const results: SearchResult[] = [];
  for (const entry of entries) {
    const haystack = `${entry.title} ${entry.description} ${entry.keywords}`.toLowerCase();
    let score = 0;
    for (const tok of tokens) {
      // Match exact substring
      const idx = haystack.indexOf(tok);
      if (idx === -1) continue;
      // Bonus si match en début de mot
      const charBefore = idx === 0 ? " " : haystack[idx - 1];
      const startBonus = /\s/.test(charBefore) ? 1 : 0;
      // Bonus si match dans le titre
      const inTitle = entry.title.toLowerCase().includes(tok) ? 2 : 0;
      score += 1 + startBonus + inTitle;
    }
    // Tous les tokens doivent matcher
    if (score >= tokens.length) {
      results.push({ entry, score });
    }
  }
  return results.sort((a, b) => b.score - a.score).slice(0, 12);
}
