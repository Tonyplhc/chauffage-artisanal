/**
 * Lead scoring : on calcule un score 0-100 + un niveau (hot/warm/cold) + des
 * raisons explicites, à partir des signaux du formulaire /devis.
 *
 * Heuristique transparente (pas de ML magique) — chaque point gagné est tracé
 * dans `reasons`, ce qui rend le score lisible et auditable par le dirigeant.
 *
 * Échelle :
 *   hot    : ≥ 60  — à traiter prioritairement
 *   warm   : 30-59 — qualifié, à recontacter sous délai standard
 *   cold   : < 30  — exploration / signal faible
 */

import type { LeadRecord } from "./devis-schema";

export type LeadLevel = "hot" | "warm" | "cold";

export type LeadScore = {
  score: number; // 0-100 (clamped)
  level: LeadLevel;
  reasons: { label: string; points: number }[];
};

const HOT_THRESHOLD = 60;
const WARM_THRESHOLD = 30;

/** Signaux + poids, ordre décroissant d'impact commercial. */
function buildSignals(
  lead: Pick<
    LeadRecord,
    | "timeline"
    | "budget"
    | "services"
    | "buildingType"
    | "construction"
    | "currentEnergy"
    | "surface"
    | "message"
    | "photoUrls"
    | "preferredChannel"
  >,
): { label: string; points: number }[] {
  const out: { label: string; points: number }[] = [];

  // --- Urgence ---
  if (lead.timeline === "urgent") out.push({ label: "Délai urgent (< 2 sem.)", points: 30 });
  else if (lead.timeline === "court") out.push({ label: "Délai court (< 3 mois)", points: 20 });
  else if (lead.timeline === "annee") out.push({ label: "Projet sur l'année", points: 10 });

  // --- Budget (V2 affichées par le configurateur + V1 legacy) ---
  if (lead.budget === "100plus") out.push({ label: "Budget > 100 k€", points: 25 });
  else if (lead.budget === "50-100") out.push({ label: "Budget 50-100 k€", points: 25 });
  else if (lead.budget === "25-50") out.push({ label: "Budget 25-50 k€", points: 20 });
  else if (lead.budget === "10-25") out.push({ label: "Budget 10-25 k€", points: 12 });
  else if (lead.budget === "40plus") out.push({ label: "Budget > 40 k€", points: 25 });
  else if (lead.budget === "20-40") out.push({ label: "Budget 20-40 k€", points: 20 });
  else if (lead.budget === "10-20") out.push({ label: "Budget 10-20 k€", points: 12 });
  else if (lead.budget === "less10") out.push({ label: "Budget < 10 k€", points: 4 });
  // inconnu : 0

  // --- Services à forte valeur ---
  const highValueSet = new Set(["pac", "enr"]);
  const multiServices = lead.services.length >= 2;
  let serviceBonus = 0;
  for (const s of lead.services) {
    if (highValueSet.has(s)) serviceBonus += 8;
  }
  if (serviceBonus > 0)
    out.push({
      label: `Service à forte valeur (${lead.services.filter((s) => highValueSet.has(s)).join(" + ")})`,
      points: Math.min(serviceBonus, 18),
    });
  if (multiServices)
    out.push({
      label: `Projet multi-services (${lead.services.length})`,
      points: 6,
    });

  // --- Typologie bâtiment ---
  if (lead.buildingType === "tertiaire" || lead.buildingType === "collectif") {
    out.push({ label: "Bâtiment tertiaire / collectif", points: 12 });
  }

  // --- Construction neuve : projet structuré ---
  if (lead.construction === "neuf") {
    out.push({ label: "Projet de construction neuve", points: 6 });
  }

  // --- Sortie énergie fossile = motivation forte ---
  if (lead.currentEnergy === "fioul") {
    out.push({ label: "Sortie fioul (transition énergétique)", points: 8 });
  }

  // --- Surface significative ---
  if (lead.surface >= 250) out.push({ label: `Grande surface (${lead.surface} m²)`, points: 8 });
  else if (lead.surface >= 150) out.push({ label: `Surface intermédiaire`, points: 4 });

  // --- Message libre nourri ---
  const msgLen = lead.message?.trim().length ?? 0;
  if (msgLen > 250) out.push({ label: "Message détaillé (> 250 car.)", points: 8 });
  else if (msgLen > 80) out.push({ label: "Message présent (> 80 car.)", points: 4 });

  // --- Photos jointes = lead investi ---
  if ((lead.photoUrls?.length ?? 0) > 0) {
    out.push({ label: `${lead.photoUrls.length} photo(s) jointe(s)`, points: 5 });
  }

  // --- Canal préféré téléphone = appétence à la mise en relation rapide ---
  if (lead.preferredChannel === "phone") {
    out.push({ label: "Demande de rappel téléphonique", points: 3 });
  }

  return out;
}

export function scoreLead(
  lead: Pick<
    LeadRecord,
    | "timeline"
    | "budget"
    | "services"
    | "buildingType"
    | "construction"
    | "currentEnergy"
    | "surface"
    | "message"
    | "photoUrls"
    | "preferredChannel"
  >,
): LeadScore {
  const signals = buildSignals(lead);
  const rawScore = signals.reduce((acc, s) => acc + s.points, 0);
  const score = Math.max(0, Math.min(100, rawScore));
  const level: LeadLevel =
    score >= HOT_THRESHOLD ? "hot" : score >= WARM_THRESHOLD ? "warm" : "cold";

  // Tri des raisons par poids décroissant — les plus parlantes en haut
  const reasons = signals.sort((a, b) => b.points - a.points);

  return { score, level, reasons };
}

/** Libellés FR pour affichage UI. */
export const LEVEL_LABELS: Record<LeadLevel, string> = {
  hot: "Chaud",
  warm: "Tiède",
  cold: "Froid",
};

/** Tone HEX pour Slack/Discord/admin. */
export const LEVEL_COLORS: Record<LeadLevel, string> = {
  hot: "#dc5a28", // ember
  warm: "#b86a36", // copper
  cold: "#8b847a", // muted
};
