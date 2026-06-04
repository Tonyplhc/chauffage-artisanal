/**
 * Smart matching marque ↔ budget — propose une alternative pertinente
 * quand l'utilisateur sélectionne une marque hors budget réel.
 *
 * Discipline éditoriale : on N'ÉCRASE PAS le choix utilisateur. On affiche
 * une suggestion soft (« vu votre budget, voici 2 marques au meilleur
 * rapport qualité/prix »). Le client reste maître de son choix.
 */

import { BRANDS, BRAND_SLUGS, type Brand, type PriceTier } from "./brands-content";

export type BudgetTier = "small" | "medium" | "comfortable" | "high" | "unknown";

/**
 * Convertit les IDs budget du configurateur vers un tier abstrait,
 * pour décorrélerla logique de matching des intervalles exacts.
 */
export function budgetToTier(budgetId: string | undefined): BudgetTier {
  switch (budgetId) {
    case "less10":
      return "small";
    case "10-25":
    case "10-20":
      return "medium";
    case "25-50":
    case "20-40":
      return "comfortable";
    case "50-100":
    case "40plus":
      return "high";
    case "100plus":
      return "high";
    case "inconnu":
    default:
      return "unknown";
  }
}

export type MatchVerdict = "good" | "tight" | "mismatch";

/**
 * Verdict de compatibilité entre une marque et un tier budget.
 *
 *   good     : couple cohérent, pas de remarque
 *   tight    : couple possible mais limite (peut nécessiter une gamme réduite)
 *   mismatch : décalage notable, on suggère alternatives
 *
 * Matrice :
 *
 *                small        medium       comfortable    high
 *   accessible   good         good         good           good
 *   standard     mismatch     tight        good           good
 *   premium      mismatch     mismatch     tight          good
 */
export function checkFit(budgetTier: BudgetTier, brand: Brand): MatchVerdict {
  if (budgetTier === "unknown") return "good"; // pas d'info → pas de jugement

  const tier = brand.priceTier;
  if (tier === "accessible") return "good";
  if (tier === "standard") {
    if (budgetTier === "small") return "mismatch";
    if (budgetTier === "medium") return "tight";
    return "good";
  }
  // premium
  if (budgetTier === "small" || budgetTier === "medium") return "mismatch";
  if (budgetTier === "comfortable") return "tight";
  return "good";
}

/**
 * Trouve les 2 meilleures marques alternatives selon le budget tier.
 * Filtre :
 *   - exclut la marque déjà choisie
 *   - garde celles dont le fit est "good"
 *   - priorise celles qui partagent au moins une catégorie avec la marque visée
 *
 * Retourne au max 2 marques. Vide si la marque choisie est déjà good fit.
 */
export function suggestAlternatives(
  budgetTier: BudgetTier,
  chosenBrand: Brand,
): Brand[] {
  if (checkFit(budgetTier, chosenBrand) === "good") return [];

  const candidates = BRAND_SLUGS.map((s) => BRANDS[s])
    .filter((b) => b.slug !== chosenBrand.slug)
    .filter((b) => checkFit(budgetTier, b) === "good")
    // Privilégier ceux qui couvrent au moins une catégorie commune
    .map((b) => {
      const sharedCategories = b.categories.filter((c) =>
        chosenBrand.categories.includes(c),
      ).length;
      return { brand: b, sharedCategories };
    })
    .sort((a, b) => b.sharedCategories - a.sharedCategories)
    .slice(0, 2)
    .map((entry) => entry.brand);

  return candidates;
}

/**
 * Message d'orientation court à afficher dans l'UI à côté de la suggestion.
 */
export function getFitMessage(
  verdict: MatchVerdict,
  budgetTier: BudgetTier,
  brand: Brand,
): string | null {
  if (verdict === "good") return null;
  const tierLabel: Record<PriceTier, string> = {
    accessible: "accessible",
    standard: "milieu de gamme premium",
    premium: "premium",
  };
  if (verdict === "tight") {
    return `${brand.name} est positionnée ${tierLabel[brand.priceTier]} — réalisable sur votre budget en optimisant la gamme. Voici aussi 2 alternatives au meilleur rapport qualité/prix.`;
  }
  return `${brand.name} est ${tierLabel[brand.priceTier]} — sur votre budget, le ticket d'entrée risque d'être tendu. Voici 2 marques au meilleur rapport qualité/prix pour votre projet.`;
}
