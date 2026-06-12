/**
 * ════════════════════════════════════════════════════════════════════════
 *  DESIGN SYSTEM — Chauffage Artisanal (identité « logo historique »)
 * ════════════════════════════════════════════════════════════════════════
 *
 *  Palette extraite du LOGO RÉEL et du thème historique (chart2013) :
 *    - Bleu cobalt  #0054A5  → anobli en #0B57A0 (primaire)
 *    - Rouge brique #A2131A  → accent signature (du logo)
 *    - Gris/anthracite #373737, brun #524438 → texte / tertiaire chaud
 *
 *  Direction validée :
 *    • Base DOMINANTE  : crème / sable / pierre (univers « confort habitat »)
 *    • Structure & confiance : bleu / bleu profond (navy)
 *    • ACCENT (parcimonie)   : rouge brique
 *    • URGENCE uniquement     : terracotta
 *    • Texte                  : anthracite
 *
 *  Ces constantes servent les usages HORS Tailwind (JSON-LD, theme-color,
 *  canvas, e-mails…). Les mêmes valeurs sont déclarées comme tokens Tailwind
 *  (voir tailwind.config.ts) pour les classes utilitaires.
 *
 *  NB : les tokens « copper / ember / charcoal » de l'ancienne version sont
 *  conservés temporairement le temps de la migration (Lot B+), puis supprimés.
 */

export const PALETTE = {
  // Neutres chauds — base dominante
  creme: "#F7F2E9", // fond principal
  sable: "#EFE7D8", // surfaces / cards
  pierre: "#E0D5C2", // bordures / séparateurs
  brun: "#5A4636", // tertiaire chaud (détails)
  anthra: "#2A2724", // texte principal (anthracite)
  taupe: "#6E675C", // texte secondaire (gris pierre)

  // Bleu Artisanal — structure & confiance (signature du logo)
  bleu: "#0B57A0", // primaire
  navy: "#0A3D6E", // bleu profond (sections fortes / B2B / footer)
  bleuvif: "#2C7BD0", // liens / hover / accent sur fond navy
  voile: "#E8F0F8", // fonds bleutés doux

  // Accents
  brique: "#A2131A", // ACCENT signature (du logo) — usage parcimonieux
  terracotta: "#C24A2C", // URGENCE / dépannage uniquement
} as const;

export type PaletteToken = keyof typeof PALETTE;

export const FONTS = {
  display: "Fraunces", // grands titres (serif premium)
  ui: "Montserrat", // interface & corps (sans géométrique — police historique)
  mono: "JetBrains Mono", // eyebrows / labels techniques
} as const;

/**
 * RÈGLES LOGO — le design est construit AUTOUR du logo, pas l'inverse.
 *
 *  Asset : public/brand/logo-chauffage-artisanal.png  (162×76, PNG transparent)
 *
 *  Contrastes & déclinaisons (décision validée) :
 *    • Fond clair (crème / blanc / sable) → logo COULEUR direct.
 *    • Fond bleu / navy                   → PLAQUE CRÈME + logo couleur.
 *      → On NE PASSE PAS en blanc inversé : préserver le bleu/rouge
 *        historique (le blanc inversé « fait rebranding »).
 *
 *  Clear-space : marge mini autour du logo = hauteur de l'icône « maison ».
 *  Tailles    : ≥ 28 px de haut (mobile, lisibilité) · 36–40 px en nav.
 */
export const LOGO = {
  src: "/brand/logo-chauffage-artisanal.png",
  alt: "Chauffage Artisanal",
  width: 162,
  height: 76,
  ratio: 162 / 76,
  minHeightPx: 28,
  navHeightPx: 36,
  /** Sur fond foncé : plaque crème (jamais de blanc inversé). */
  onDark: "cream-plate" as const,
} as const;
