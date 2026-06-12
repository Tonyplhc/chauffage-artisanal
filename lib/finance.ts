/**
 * ════════════════════════════════════════════════════════════════════════
 *  CONVENTION — SÉMAPHORE FINANCIER (globale, tout le site)
 * ════════════════════════════════════════════════════════════════════════
 *
 *  Partout où le site affiche un MONTANT, une économie, une aide, un coût,
 *  un ROI ou un résultat de calcul → langage visuel financier universel :
 *
 *    🔴 ROUGE  (perte)  = argent qui SORT de la poche : coût actuel, facture
 *                          actuelle, consommation, pertes énergétiques,
 *                          dépenses annuelles, surcoût, reste à payer.
 *    🟢 VERT   (gain)   = argent qui ENTRE / reste : économie, aide,
 *                          subvention, ROI, réduction de facture, gain cumulé.
 *                          → doit être l'élément le PLUS visible du calcul.
 *    ⚫ NEUTRE (après)  = coût APRÈS travaux : anthracite / gris. JAMAIS vert
 *                          (le vert est réservé au gain).
 *
 *  ⚠️ Ces couleurs sont INDÉPENDANTES de la charte graphique. La marque reste
 *  crème / bleu / brique. Le vert et le rouge n'existent QUE dans les zones
 *  de calcul et de résultats financiers — JAMAIS dans la navigation, le
 *  branding ou les sections institutionnelles.
 *
 *  Tokens Tailwind : text-perte / text-gain / text-anthra (+ bg perteBg/gainBg).
 */

export type FinanceKind = "perte" | "gain" | "neutre";

/** Classe couleur texte selon la nature financière de la valeur. */
export const financeText = (kind: FinanceKind): string =>
  kind === "perte" ? "text-perte" : kind === "gain" ? "text-gain" : "text-anthra";

/** Classe couleur de fond doux (cartes de résultat). */
export const financeBg = (kind: FinanceKind): string =>
  kind === "perte" ? "bg-perteBg" : kind === "gain" ? "bg-gainBg" : "bg-white";

/** Format euro FR : 1450 → "1 450 €". */
export const eur = (n: number): string => `${n.toLocaleString("fr-FR")} €`;

/** Préfixe de signe conventionnel : un gain s'annonce "+". */
export const financeSign = (kind: FinanceKind): string => (kind === "gain" ? "+ " : "");
