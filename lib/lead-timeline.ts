/**
 * Timeline unifié pour un lead — fusion chronologique de tous les événements
 * touchant ce dossier : status transitions, activity log, comments, reminders,
 * quote events, NPS.
 *
 * Volontairement read-only. Les insertions se font dans leurs stores
 * respectifs ; le timeline ne fait que les agréger pour l'affichage.
 */

import { getLead } from "./leads-store";
import { listActivity } from "./activity-log";
import { listCommentsForLead } from "./comments-store";
import { listReminders } from "./reminders-store";
import { getQuote } from "./quotes-store";
import { listSurveys } from "./nps-store";
import type { LeadRecord } from "./devis-schema";

export type TimelineEvent = {
  id: string;
  at: string;
  kind:
    | "lead.created"
    | "status.transition"
    | "activity"
    | "comment.added"
    | "comment.deleted"
    | "reminder.created"
    | "reminder.fired"
    | "reminder.dismissed"
    | "quote.created"
    | "quote.sent"
    | "quote.accepted"
    | "quote.refused"
    | "nps.sent"
    | "nps.responded";
  title: string;
  description?: string;
  actor?: string;
  meta?: Record<string, unknown>;
};

const STATUS_LABELS: Record<string, string> = {
  nouveau: "Nouveau",
  contacte: "Contacté",
  devis_envoye: "Devis envoyé",
  converti: "Converti",
  perdu: "Perdu",
};

export async function composeTimeline(
  reference: string,
): Promise<TimelineEvent[]> {
  const lead = await getLead(reference);
  if (!lead) return [];

  const events: TimelineEvent[] = [];

  // 1. Création
  events.push({
    id: `${reference}-created`,
    at: lead.submittedAt,
    kind: "lead.created",
    title: "Lead créé",
    description: `${lead.fullName} a soumis le formulaire`,
    meta: { commune: lead.commune, services: lead.services },
  });

  // 2. Transitions de statut
  const history = lead.statusHistory ?? [];
  history.forEach((t, i) => {
    events.push({
      id: `${reference}-status-${i}`,
      at: t.at,
      kind: "status.transition",
      title: `${STATUS_LABELS[t.from] ?? t.from} → ${STATUS_LABELS[t.to] ?? t.to}`,
      meta: { from: t.from, to: t.to },
    });
  });

  // 3. Activity log lié
  const allActivity = await listActivity();
  const acts = allActivity.filter((a) => a.reference === reference);
  for (const a of acts) {
    // On évite de dupliquer les events déjà couverts par les transitions
    if (a.type === "lead.status_changed") continue;
    events.push({
      id: `act-${a.id}`,
      at: a.at,
      kind: "activity",
      title: a.summary,
      actor: (a as { actorEmail?: string }).actorEmail,
      meta: { type: a.type, ...(a.meta ?? {}) },
    });
  }

  // 4. Comments
  const comments = await listCommentsForLead(reference);
  for (const c of comments) {
    if (c.deletedAt) {
      events.push({
        id: `cmt-del-${c.id}`,
        at: c.deletedAt,
        kind: "comment.deleted",
        title: `Commentaire de ${c.authorEmail} supprimé`,
        actor: c.authorEmail,
      });
      continue;
    }
    events.push({
      id: `cmt-${c.id}`,
      at: c.createdAt,
      kind: "comment.added",
      title: `Commentaire de ${c.authorEmail}`,
      description: c.body.slice(0, 240),
      actor: c.authorEmail,
      meta: { mentions: c.mentions, full: c.body },
    });
  }

  // 5. Reminders
  const reminders = await listReminders({
    leadReference: reference,
    includeDismissed: true,
  });
  for (const r of reminders) {
    events.push({
      id: `rem-c-${r.id}`,
      at: r.createdAt,
      kind: "reminder.created",
      title: `Rappel programmé pour ${new Date(r.dueAt).toLocaleString("fr-FR", {
        dateStyle: "short",
        timeStyle: "short",
      })}`,
      description: r.note,
      actor: r.createdBy,
    });
    if (r.firedAt) {
      events.push({
        id: `rem-f-${r.id}`,
        at: r.firedAt,
        kind: "reminder.fired",
        title: "Échéance de rappel atteinte",
        description: r.note,
      });
    }
    if (r.dismissedAt) {
      events.push({
        id: `rem-d-${r.id}`,
        at: r.dismissedAt,
        kind: "reminder.dismissed",
        title: "Rappel marqué comme fait",
      });
    }
  }

  // 6. Quote events
  const quote = await getQuote(reference);
  if (quote) {
    if (quote.createdAt) {
      events.push({
        id: `quote-c-${reference}`,
        at: quote.createdAt,
        kind: "quote.created",
        title: `Devis brouillon créé${quote.number ? ` (n° ${quote.number})` : ""}`,
        meta: { number: quote.number, linesCount: quote.lines.length },
      });
    }
    if (quote.sentAt) {
      events.push({
        id: `quote-s-${reference}`,
        at: quote.sentAt,
        kind: "quote.sent",
        title: `Devis envoyé${quote.number ? ` (n° ${quote.number})` : ""}`,
      });
    }
    const sig = quote.signature;
    if (sig?.signedAt && quote.status === "accepted") {
      events.push({
        id: `quote-a-${reference}`,
        at: sig.signedAt,
        kind: "quote.accepted",
        title: `Devis accepté par ${sig.signerName}`,
      });
    }
    if (quote.status === "refused" && sig?.signedAt) {
      events.push({
        id: `quote-r-${reference}`,
        at: sig.signedAt,
        kind: "quote.refused",
        title: `Devis refusé`,
      });
    }
  }

  // 7. NPS
  const allSurveys = await listSurveys();
  const surveys = allSurveys.filter((s) => s.leadReference === reference);
  for (const s of surveys) {
    events.push({
      id: `nps-s-${s.id}`,
      at: s.sentAt,
      kind: "nps.sent",
      title: "Enquête NPS envoyée",
    });
    if (s.respondedAt && typeof s.score === "number") {
      events.push({
        id: `nps-r-${s.id}`,
        at: s.respondedAt,
        kind: "nps.responded",
        title: `Réponse NPS : ${s.score}/10`,
        description: s.comment,
        meta: { score: s.score },
      });
    }
  }

  // Tri : récent en haut
  events.sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());
  return events;
}
