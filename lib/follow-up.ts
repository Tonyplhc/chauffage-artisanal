/**
 * Logique de relance automatique des leads.
 *
 * Principe : selon le statut courant d'un lead, on définit une durée raisonnable
 * au-delà de laquelle il faut "faire quelque chose". Sans timestamp de changement
 * de statut (le store ne le track pas pour l'instant), on se base sur la durée
 * écoulée depuis `submittedAt` modulée par le statut.
 *
 * C'est une approximation honnête. Quand on aura un audit log des transitions,
 * on pourra affiner.
 */

import type { LeadRecord } from "./devis-schema";

const DAY = 86_400_000;

/**
 * Durée maximale, en jours, après laquelle un lead dans ce statut doit être
 * traité. Au-delà = à relancer.
 */
const MAX_DAYS_BY_STATUS: Record<LeadRecord["status"], number> = {
  nouveau: 2, // Sans premier contact en 2 j = urgent
  contacte: 7, // Sans devis envoyé en 7 j après contact
  devis_envoye: 14, // Sans réponse client après 14 j = relance commerciale
  converti: 365, // Aucune relance commerciale, juste fidélisation
  perdu: 365, // Pas de relance auto sur perdu
};

export type FollowUpReason = {
  reference: string;
  level: LeadRecord["level"];
  status: LeadRecord["status"];
  daysSince: number;
  threshold: number;
  urgency: "due" | "overdue"; // due = juste atteint, overdue = dépassé largement
  hint: string;
};

const STATUS_HINT: Record<LeadRecord["status"], string> = {
  nouveau: "Premier contact à passer",
  contacte: "Devis à envoyer (suite à l'échange)",
  devis_envoye: "Relance commerciale à effectuer",
  converti: "Suivi de chantier / fidélisation",
  perdu: "Pas d'action prioritaire",
};

/**
 * Détecte les leads à relancer. Les "perdu" et anciens "converti" sont exclus.
 * Tri : priorité par niveau (hot > warm > cold) puis par retard.
 */
export function detectFollowUps(leads: LeadRecord[]): FollowUpReason[] {
  const now = Date.now();
  const out: FollowUpReason[] = [];

  for (const l of leads) {
    // Ne pas relancer les statuts terminaux
    if (l.status === "perdu") continue;
    if (l.status === "converti") continue;

    const days = Math.floor((now - new Date(l.submittedAt).getTime()) / DAY);
    const threshold = MAX_DAYS_BY_STATUS[l.status];
    if (days < threshold) continue;

    out.push({
      reference: l.reference,
      level: l.level,
      status: l.status,
      daysSince: days,
      threshold,
      urgency: days > threshold * 2 ? "overdue" : "due",
      hint: STATUS_HINT[l.status],
    });
  }

  // Tri : hot d'abord, puis overdue, puis durée
  const LEVEL_RANK: Record<NonNullable<LeadRecord["level"]>, number> = {
    hot: 3,
    warm: 2,
    cold: 1,
  };
  out.sort((a, b) => {
    const al = a.level ? LEVEL_RANK[a.level] : 0;
    const bl = b.level ? LEVEL_RANK[b.level] : 0;
    if (al !== bl) return bl - al;
    if (a.urgency !== b.urgency) return a.urgency === "overdue" ? -1 : 1;
    return b.daysSince - a.daysSince;
  });

  return out;
}
