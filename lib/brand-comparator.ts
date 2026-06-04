/**
 * Logique du comparateur de marques /marques/comparer/[slug].
 *
 * Stratégie SEO : 36 pages générées statiquement, une par paire de marques
 * (combinaisons sans répétition de 9 marques = 36). Capture les requêtes
 * long-tail Google volumineuses :
 *   - "vaillant vs viessmann"
 *   - "daikin ou mitsubishi"
 *   - "comparatif chaudière X Y"
 *
 * Slug canonique : marques triées alphabétiquement, séparées par "-vs-".
 *   Ex : "atlantic-vs-viessmann" (pas "viessmann-vs-atlantic")
 *
 * Le rendu construit un POV éditorial honnête : quand choisir A, quand
 * choisir B, points communs, différences. Pas de classement absolu.
 */

import { BRANDS, BRAND_SLUGS, type Brand } from "./brands-content";

export type Pair = {
  slug: string; // ex: "atlantic-vs-viessmann"
  a: Brand;
  b: Brand;
};

/**
 * Génère toutes les paires uniques (C(9, 2) = 36). Ordre alphabétique pour
 * éviter les URL dupliquées (a-vs-b et b-vs-a).
 */
export function generateAllPairs(): Pair[] {
  const slugs = [...BRAND_SLUGS].sort();
  const pairs: Pair[] = [];
  for (let i = 0; i < slugs.length; i++) {
    for (let j = i + 1; j < slugs.length; j++) {
      const a = BRANDS[slugs[i]];
      const b = BRANDS[slugs[j]];
      pairs.push({
        slug: `${a.slug}-vs-${b.slug}`,
        a,
        b,
      });
    }
  }
  return pairs;
}

/**
 * Résout un slug vers la paire correspondante. Accepte aussi l'ordre inverse
 * en redirigeant vers le canonique (alphabétique).
 */
export function getPair(slug: string): Pair | null {
  const parts = slug.split("-vs-");
  if (parts.length !== 2) return null;
  const [s1, s2] = parts;
  if (!BRANDS[s1] || !BRANDS[s2] || s1 === s2) return null;
  // Re-tri pour canoniser
  const [sa, sb] = [s1, s2].sort();
  return {
    slug: `${sa}-vs-${sb}`,
    a: BRANDS[sa],
    b: BRANDS[sb],
  };
}

/**
 * Génère un avis éditorial sur quand choisir l'une ou l'autre, en se basant
 * sur les catégories couvertes, l'origine, l'année de fondation. Pas de
 * jugement de valeur absolu — juste des heuristiques d'orientation.
 */
export type Verdict = {
  whenChooseA: string;
  whenChooseB: string;
  commonGround: string;
};

export function buildVerdict(a: Brand, b: Brand): Verdict {
  const aOlder = parseInt(a.since) < parseInt(b.since);
  const olderBrand = aOlder ? a : b;
  const newerBrand = aOlder ? b : a;
  const yearsDiff = Math.abs(parseInt(a.since) - parseInt(b.since));

  const aHasPac = a.categories.includes("pac");
  const bHasPac = b.categories.includes("pac");
  const aHasClim = a.categories.includes("climatisation");
  const bHasClim = b.categories.includes("climatisation");
  const aHasChauffage = a.categories.includes("chauffage");
  const bHasChauffage = b.categories.includes("chauffage");

  // Cas spéciaux selon spécialités
  let whenChooseA = `${a.name} est pertinent pour les profils qui valorisent ${
    aHasChauffage && !bHasChauffage
      ? "une expertise historique en chauffage"
      : a.categories.length > b.categories.length
        ? "une couverture catalogue plus large (multi-énergies)"
        : `l'origine ${a.origin}`
  }.`;

  let whenChooseB = `${b.name} a sa place quand vous cherchez ${
    bHasPac && bHasClim && !aHasClim
      ? "une expertise combinée PAC + climatisation"
      : b.categories.length > a.categories.length
        ? "un catalogue très étendu (toutes énergies)"
        : `un partenariat avec un fabricant ${b.origin}`
  }.`;

  let commonGround = `Les deux marques sont des références européennes installées de longue date — ${olderBrand.name} depuis ${olderBrand.since}, ${newerBrand.name} depuis ${newerBrand.since} (${yearsDiff} ans d'écart). Nous installons et entretenons les deux, le choix dépend surtout du dossier technique et du budget.`;

  return { whenChooseA, whenChooseB, commonGround };
}
