/**
 * Helper SEO : construit l'objet `alternates` (canonical) pour les metadata
 * Next.js d'une page.
 *
 * Le site n'a pas d'URLs localisées (rendu FR unique, switch de langue par
 * cookie) : aucun hreflang `languages` n'est donc émis, pour ne pas déclarer
 * de variantes de/en factices pointant vers la même URL.
 *
 * Usage :
 *   export const metadata = {
 *     title: "...",
 *     alternates: buildAlternates("/ma-page"),
 *   };
 */

export function buildAlternates(canonicalPath: string) {
  return {
    canonical: canonicalPath,
  };
}
