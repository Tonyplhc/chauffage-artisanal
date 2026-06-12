import type { MetadataRoute } from "next";
import { SEO_SLUGS } from "@/lib/seo-luxembourg-content";
import { BRAND_SLUGS } from "@/lib/brands-content";
import { generateAllPairs } from "@/lib/brand-comparator";
import { ARTICLES } from "@/lib/articles";

const BASE = process.env.PUBLIC_URL ?? "https://www.chauffage-artisanal.lu";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const routes = [
    "",
    "/chauffage",
    "/pompes-a-chaleur",
    "/climatisation",
    "/sanitaire",
    "/depannage",
    "/entretien",
    "/energies-renouvelables",
    "/realisations",
    "/savoir-faire",
    "/primes-aides",
    "/klimabonus-2026",
    "/conformite",
    "/a-propos",
    "/recrutement",
    "/contact",
    "/devis",
    "/mentions-legales",
    "/confidentialite",
    "/cookies",
    "/cgv",
    "/processus",
    "/glossaire",
    // Produit cœur : l'estimateur immersif + l'assistant devis IA
    "/estimation",
    "/assistant",
    // Pages SEO Luxembourg (haute valeur : requêtes volumineuses au LU)
    ...SEO_SLUGS.map((slug) => `/${slug}`),
    // Encyclopédie marques — hub + 9 fiches détail + 36 comparaisons
    "/marques",
    ...BRAND_SLUGS.map((slug) => `/marques/${slug}`),
    ...generateAllPairs().map((p) => `/marques/comparer/${p.slug}`),
    // Outils grand-public (calculateurs, simulateurs)
    "/outils",
    "/outils/economies-energie",
    "/outils/estimateur-prix",
    "/outils/calculateur-mensualites",
    "/outils/roi-pac",
    "/outils/dimensionnement-pac",
    "/outils/eligibilite-klimabonus",
    "/outils/auto-diagnostic",
    "/outils/bibliotheque-equipements",
    // Blog SEO — index + tous les articles
    "/actualites",
    ...ARTICLES.map((a) => `/actualites/${a.slug}`),
  ];
  // Pages SEO Luxembourg + marques = priorité haute (autorité topique).
  const SEO_LU_ROUTES = new Set(SEO_SLUGS.map((s) => `/${s}`));
  const BRAND_ROUTES = new Set([
    "/marques",
    ...BRAND_SLUGS.map((s) => `/marques/${s}`),
  ]);
  return routes.map((r) => ({
    url: `${BASE}${r}`,
    lastModified: now,
    changeFrequency: r === "" ? "weekly" : "monthly",
    priority:
      r === ""
        ? 1
        : r === "/estimation"
          ? 0.95
        : r === "/devis" || r === "/assistant"
          ? 0.9
          : SEO_LU_ROUTES.has(r)
            ? 0.85
            : BRAND_ROUTES.has(r)
              ? 0.8
              : 0.7,
  }));
}
