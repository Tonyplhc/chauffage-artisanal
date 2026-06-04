/**
 * Parser de search bar avec opérateurs.
 *
 * Syntaxe :
 *   `pac rénovation`              → free text search (tous les tokens en AND)
 *   `status:nouveau`              → filtre statut = nouveau
 *   `level:hot`                   → filtre niveau = hot
 *   `service:pac`                 → filtre services inclut pac
 *   `commune:luxembourg`          → filtre commune contient
 *   `assignedTo:me`               → filtre assigné à moi (currentUserEmail)
 *   `assignedTo:none`             → filtre non assigné
 *   `budget:40plus`               → filtre budget = 40plus
 *   `timeline:urgent`             → filtre timeline = urgent
 *
 * Combinaisons : tous les filtres sont AND. Les tokens libres restants sont
 * matched contre nom/email/référence/commune.
 *
 * Exemple : `status:nouveau level:hot pac` → status=nouveau ET level=hot ET
 * texte 'pac' apparaît quelque part.
 */

import type { LeadRecord } from "./devis-schema";

export type SearchFilters = {
  freeText: string[];
  status?: string;
  level?: "hot" | "warm" | "cold";
  service?: string;
  commune?: string;
  assignedTo?: string; // "me" pour moi, "none" pour non assigné, sinon email
  budget?: string;
  timeline?: string;
};

const KNOWN_OPS = new Set([
  "status",
  "level",
  "service",
  "commune",
  "assignedto",
  "budget",
  "timeline",
]);

export function parseSearch(query: string): SearchFilters {
  const result: SearchFilters = { freeText: [] };
  if (!query.trim()) return result;

  // Token = mot ou "groupe entre guillemets"
  const tokens: string[] = [];
  let buffer = "";
  let inQuotes = false;
  for (const ch of query) {
    if (ch === '"') {
      inQuotes = !inQuotes;
      continue;
    }
    if (/\s/.test(ch) && !inQuotes) {
      if (buffer) {
        tokens.push(buffer);
        buffer = "";
      }
      continue;
    }
    buffer += ch;
  }
  if (buffer) tokens.push(buffer);

  for (const tok of tokens) {
    const colonIdx = tok.indexOf(":");
    if (colonIdx > 0 && colonIdx < tok.length - 1) {
      const opRaw = tok.slice(0, colonIdx).toLowerCase();
      const val = tok.slice(colonIdx + 1).toLowerCase();
      if (KNOWN_OPS.has(opRaw)) {
        if (opRaw === "status") result.status = val;
        else if (opRaw === "level") result.level = val as SearchFilters["level"];
        else if (opRaw === "service") result.service = val;
        else if (opRaw === "commune") result.commune = val;
        else if (opRaw === "assignedto") result.assignedTo = val;
        else if (opRaw === "budget") result.budget = val;
        else if (opRaw === "timeline") result.timeline = val;
        continue;
      }
    }
    result.freeText.push(tok.toLowerCase());
  }

  return result;
}

export function applySearchFilters(
  leads: LeadRecord[],
  filters: SearchFilters,
  context: { currentUserEmail?: string | null },
): LeadRecord[] {
  return leads.filter((l) => {
    if (filters.status && l.status !== filters.status) return false;
    if (filters.level && l.level !== filters.level) return false;
    if (filters.service && !l.services.some((s) => s === filters.service)) return false;
    if (filters.commune && !l.commune.toLowerCase().includes(filters.commune)) return false;
    if (filters.budget && l.budget !== filters.budget) return false;
    if (filters.timeline && l.timeline !== filters.timeline) return false;
    if (filters.assignedTo) {
      if (filters.assignedTo === "me") {
        if (!context.currentUserEmail || l.assignedTo !== context.currentUserEmail) return false;
      } else if (filters.assignedTo === "none") {
        if (l.assignedTo) return false;
      } else {
        if (l.assignedTo?.toLowerCase() !== filters.assignedTo) return false;
      }
    }
    // Free text — AND : tous les tokens doivent apparaître quelque part
    for (const tok of filters.freeText) {
      const haystack = [
        l.fullName,
        l.email,
        l.commune,
        l.reference,
        ...l.services,
        l.message ?? "",
      ]
        .join(" ")
        .toLowerCase();
      if (!haystack.includes(tok)) return false;
    }
    return true;
  });
}

/* ─────────────── Suggestion d'opérateurs (autocomplete) ─────────────── */

export const OPERATOR_SUGGESTIONS = [
  { op: "status", values: ["nouveau", "contacte", "devis_envoye", "converti", "perdu"] },
  { op: "level", values: ["hot", "warm", "cold"] },
  { op: "service", values: ["pac", "chauffage", "clim", "sanitaire", "enr", "depannage"] },
  { op: "timeline", values: ["urgent", "court", "annee", "exploration"] },
  { op: "budget", values: ["less10", "10-20", "20-40", "40plus", "inconnu"] },
  { op: "assignedTo", values: ["me", "none"] },
];
