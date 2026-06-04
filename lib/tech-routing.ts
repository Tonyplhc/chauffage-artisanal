/**
 * Routing intelligent des interventions vers les techniciens.
 *
 * Score chaque tech sur 100 selon 3 axes pondérés :
 *   - Skill match (50 pts) : services du lead ∩ compétences tech
 *   - Proximity (30 pts) : distance home base → commune lead
 *   - Workload (20 pts) : moins le tech a de slots cette semaine, plus
 *     son score grimpe (équilibre la charge)
 *
 * Distance : table approximative inter-communes pour Luxembourg
 * (exhaustive sur les principales seulement). Si commune inconnue, on
 * retourne 25 km par défaut.
 */

import { listProfiles, type TechProfile, type Skill } from "./tech-profiles-store";
import { listSlots, type DispatchSlot } from "./dispatch-store";
import type { LeadRecord } from "./devis-schema";

/* ─────────────── Distance approximative entre communes ─────────────── */

const COMMUNE_DISTANCES: Record<string, Record<string, number>> = {
  "luxembourg-ville": {
    "esch-sur-alzette": 18,
    "differdange": 25,
    "dudelange": 17,
    "bettembourg": 14,
    "petange": 22,
    "schifflange": 16,
    "sanem": 19,
    "ettelbruck": 28,
    "diekirch": 32,
    "wiltz": 50,
    "remich": 22,
    "mersch": 18,
    "echternach": 28,
    "redange": 32,
  },
  "esch-sur-alzette": {
    "differdange": 7,
    "dudelange": 8,
    "schifflange": 4,
    "sanem": 5,
    "luxembourg-ville": 18,
    "bettembourg": 10,
    "petange": 9,
  },
  "ettelbruck": {
    "diekirch": 4,
    "wiltz": 20,
    "mersch": 14,
    "luxembourg-ville": 28,
    "redange": 15,
  },
};

function normalize(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function distanceBetween(
  fromCommune: string,
  toCommune: string,
): number {
  const a = normalize(fromCommune);
  const b = normalize(toCommune);
  if (a === b) return 0;
  const lookup = COMMUNE_DISTANCES[a]?.[b];
  if (lookup !== undefined) return lookup;
  const reverse = COMMUNE_DISTANCES[b]?.[a];
  if (reverse !== undefined) return reverse;
  // Heuristique : si même 3 premières lettres → 8 km, sinon 25 km
  if (a.slice(0, 3) === b.slice(0, 3)) return 8;
  return 25;
}

/* ─────────────── Matching skills ─────────────── */

/** Mappe les services lead vers les skills techs. */
function leadSkills(lead: LeadRecord): Skill[] {
  const out = new Set<Skill>();
  for (const s of lead.services) {
    if (s === "chauffage") out.add("chaudiere");
    else if (s === "pac") out.add("pac");
    else if (s === "clim") out.add("clim");
    else if (s === "sanitaire") out.add("sanitaire");
    else if (s === "enr") out.add("enr");
    else if (s === "depannage") out.add("depannage");
  }
  return [...out];
}

/* ─────────────── Score ─────────────── */

export type RoutingSuggestion = {
  profile: TechProfile;
  scoreTotal: number;
  skillScore: number;
  skillMatches: number;
  skillTotal: number;
  proximityScore: number;
  distanceKm: number;
  workloadScore: number;
  upcomingSlotCount: number;
  /** Raison principale en clair. */
  reason: string;
};

export async function suggestTechniciansFor(
  lead: LeadRecord,
  opts: {
    weekStart?: Date;
  } = {},
): Promise<RoutingSuggestion[]> {
  const profiles = await listProfiles({ isActive: true });
  if (profiles.length === 0) return [];
  const required = leadSkills(lead);
  const skillTotal = Math.max(1, required.length);

  // Charge : on regarde les slots à venir 7 jours
  const weekStart = opts.weekStart ?? new Date();
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 7);
  const slots = await listSlots({
    from: weekStart.toISOString(),
    to: weekEnd.toISOString(),
  });
  const slotsByTech = new Map<string, DispatchSlot[]>();
  for (const s of slots) {
    const k = s.technicianEmail.toLowerCase();
    if (!slotsByTech.has(k)) slotsByTech.set(k, []);
    slotsByTech.get(k)!.push(s);
  }
  const maxSlots = Math.max(
    1,
    ...[...slotsByTech.values()].map((arr) => arr.length),
  );

  const suggestions: RoutingSuggestion[] = profiles.map((p) => {
    // Skill match
    const matches = required.filter((s) => p.skills.includes(s)).length;
    const skillScore = Math.round((matches / skillTotal) * 50);
    // Proximity
    const distanceKm = distanceBetween(p.homeBase, lead.commune);
    const proximityRaw = Math.max(0, 1 - distanceKm / 50);
    const proximityScore = Math.round(proximityRaw * 30);
    // Workload (inverse)
    const upcomingSlotCount =
      slotsByTech.get(p.email.toLowerCase())?.length ?? 0;
    const workloadRaw = 1 - upcomingSlotCount / maxSlots;
    const workloadScore = Math.round(workloadRaw * 20);
    const scoreTotal = skillScore + proximityScore + workloadScore;

    let reason: string;
    if (matches === skillTotal && distanceKm < 15) {
      reason = "Match parfait : compétences couvertes et proche du chantier";
    } else if (matches === 0) {
      reason = "Pas de compétence directe sur les services demandés";
    } else if (distanceKm > 30) {
      reason = "Trop éloigné de la commune du chantier";
    } else if (upcomingSlotCount >= maxSlots) {
      reason = "Charge déjà saturée cette semaine";
    } else if (matches === skillTotal) {
      reason = "Toutes les compétences requises présentes";
    } else {
      reason = `${matches}/${skillTotal} compétences alignées`;
    }
    return {
      profile: p,
      scoreTotal,
      skillScore,
      skillMatches: matches,
      skillTotal,
      proximityScore,
      distanceKm,
      workloadScore,
      upcomingSlotCount,
      reason,
    };
  });

  suggestions.sort((a, b) => b.scoreTotal - a.scoreTotal);
  return suggestions;
}
