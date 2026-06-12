/**
 * Analyse de sentiment rules-based pour le français.
 *
 * Dictionnaire de mots polarisés + intensifieurs + négateurs. L'algorithme :
 *   1. tokenize en mots minuscules (normalize NFD)
 *   2. pour chaque mot polarisé → score ±1
 *   3. si intensifieur précède (1 mot avant) → ×1.5
 *   4. si négateur précède (3 mots avant) → inverse signe
 *   5. agrège et normalise par nombre de tokens significatifs
 *
 * Retourne label `positive` (>0.15), `negative` (<-0.15) ou `neutral` (sinon).
 *
 * Pas de ML — c'est un signal indicatif rapide, pas une vérité absolue.
 * Pour de la production, brancher un modèle (Anthropic, OpenAI…) côté call.
 */

const POSITIVE_WORDS = new Set([
  "excellent",
  "excellente",
  "parfait",
  "parfaite",
  "super",
  "superbe",
  "formidable",
  "ravi",
  "ravie",
  "satisfait",
  "satisfaite",
  "satisfaction",
  "content",
  "contente",
  "heureux",
  "heureuse",
  "bravo",
  "merci",
  "recommande",
  "recommander",
  "recommandable",
  "recommanderais",
  "professionnel",
  "professionnels",
  "serieux",
  "sérieuse",
  "serieuse",
  "efficace",
  "rapide",
  "rapidement",
  "qualité",
  "qualite",
  "qualitatif",
  "top",
  "bien",
  "très bien",
  "tres bien",
  "magnifique",
  "génial",
  "genial",
  "geniale",
  "impeccable",
  "irréprochable",
  "irreprochable",
  "soigné",
  "soigne",
  "agréable",
  "agreable",
  "courtois",
  "courtoise",
  "respectueux",
  "respectueuse",
  "compétent",
  "competent",
  "compétente",
  "bonne",
  "bon",
  "meilleur",
  "meilleure",
  "réussi",
  "reussi",
  "fiable",
  "ponctuel",
  "ponctuelle",
  "transparent",
  "transparente",
  "exemplaire",
  "fluide",
  "clair",
  "claire",
]);

const NEGATIVE_WORDS = new Set([
  "déçu",
  "decu",
  "déçue",
  "decue",
  "mauvais",
  "mauvaise",
  "problème",
  "probleme",
  "problèmes",
  "retard",
  "retards",
  "lent",
  "lente",
  "lentement",
  "cher",
  "chère",
  "chere",
  "déception",
  "deception",
  "nul",
  "nulle",
  "horrible",
  "incompétent",
  "incompetent",
  "médiocre",
  "mediocre",
  "jamais",
  "pire",
  "pires",
  "plainte",
  "dommage",
  "raté",
  "rate",
  "ratée",
  "désastre",
  "desastre",
  "scandaleux",
  "scandaleuse",
  "refus",
  "refuse",
  "arnaque",
  "menteur",
  "menteuse",
  "désagréable",
  "desagreable",
  "agressif",
  "agressive",
  "désordre",
  "desordre",
  "inacceptable",
  "inadmissible",
  "inutile",
  "catastrophique",
  "frustrant",
  "frustrante",
  "ennuyeux",
  "compliqué",
  "complique",
  "compliquée",
  "douteux",
  "douteuse",
  "indigne",
  "déplorable",
  "deplorable",
  "lamentable",
  "raté",
  "défaut",
  "defaut",
  "défauts",
  "echec",
  "échec",
  "fuite",
  "casse",
  "abandonné",
  "abandonne",
  "ignorer",
  "ignoré",
  "ignore",
]);

const INTENSIFIERS = new Set([
  "très",
  "tres",
  "vraiment",
  "tellement",
  "absolument",
  "extrêmement",
  "extremement",
  "totalement",
  "particulièrement",
  "particulierement",
  "carrément",
  "carrement",
  "super",
]);

const NEGATORS = new Set([
  "pas",
  "non",
  "jamais",
  "rien",
  "aucun",
  "aucune",
  "ni",
  "sans",
]);

export type SentimentLabel = "positive" | "negative" | "neutral";

export type SentimentResult = {
  score: number; // -1..1
  label: SentimentLabel;
  matches: {
    word: string;
    polarity: "positive" | "negative";
    intensified: boolean;
    negated: boolean;
  }[];
  tokensCount: number;
};

function normalize(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();
}

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s'-]/gu, " ")
    .split(/\s+/)
    .filter(Boolean);
}

export function analyzeSentiment(text: string): SentimentResult {
  if (!text || !text.trim()) {
    return { score: 0, label: "neutral", matches: [], tokensCount: 0 };
  }
  const tokens = tokenize(text);
  const matches: SentimentResult["matches"] = [];
  let total = 0;
  let polarizedCount = 0;
  for (let i = 0; i < tokens.length; i++) {
    const raw = tokens[i];
    const norm = normalize(raw);
    const isPos =
      POSITIVE_WORDS.has(raw) ||
      POSITIVE_WORDS.has(norm);
    const isNeg =
      NEGATIVE_WORDS.has(raw) || NEGATIVE_WORDS.has(norm);
    if (!isPos && !isNeg) continue;

    let polarity = isPos ? 1 : -1;
    // Check intensifier 1 word before
    const intensified =
      i > 0 &&
      (INTENSIFIERS.has(tokens[i - 1]) ||
        INTENSIFIERS.has(normalize(tokens[i - 1])));
    if (intensified) polarity *= 1.5;
    // Check negator in 3 previous words
    let negated = false;
    for (let j = Math.max(0, i - 3); j < i; j++) {
      if (NEGATORS.has(tokens[j]) || NEGATORS.has(normalize(tokens[j]))) {
        negated = true;
        break;
      }
    }
    if (negated) polarity *= -1;

    total += polarity;
    polarizedCount += 1;
    matches.push({
      word: raw,
      polarity: isPos ? "positive" : "negative",
      intensified,
      negated,
    });
  }
  // Normalize : on borne par le nombre de mots polarisés multiplié par 1.5
  // (impact max intensifié)
  const maxAbs = Math.max(1, polarizedCount * 1.5);
  const score = Math.max(-1, Math.min(1, total / maxAbs));
  let label: SentimentLabel = "neutral";
  if (score > 0.15) label = "positive";
  else if (score < -0.15) label = "negative";
  return {
    score: Math.round(score * 100) / 100,
    label,
    matches,
    tokensCount: tokens.length,
  };
}

export function sentimentEmoji(label: SentimentLabel): string {
  if (label === "positive") return "🟢";
  if (label === "negative") return "🔴";
  return "⚪";
}

export function sentimentColor(label: SentimentLabel): string {
  if (label === "positive") return "#22a06b";
  if (label === "negative") return "#C24A2C";
  return "#8b847a";
}

export function sentimentLabelFr(label: SentimentLabel): string {
  if (label === "positive") return "Positif";
  if (label === "negative") return "Négatif";
  return "Neutre";
}
