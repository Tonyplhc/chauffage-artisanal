/**
 * Composition des événements du calendrier admin.
 *
 * Réplique côté serveur la logique présente dans `/admin/calendar/page.tsx`
 * (W6.2) pour pouvoir l'exporter en feed iCal abonnable.
 *
 * Sources :
 *   - `lead.metadata.bookingSlot` (RDV planifié par le client via le booking inline)
 *   - leads "urgent" + statut "nouveau" → événement de rappel à J+1
 *   - leads "devis_envoye" → relance à J+7
 *   - rappels actifs (lib/reminders-store)
 */

import { listLeads } from "./leads-store";
import { listReminders } from "./reminders-store";
import type { LeadRecord } from "./devis-schema";

export type CalendarEvent = {
  uid: string; // identifiant unique iCal
  kind: "booking" | "urgent" | "follow-up" | "reminder";
  startAt: string; // ISO
  endAt: string; // ISO — par défaut +1 h
  summary: string;
  description?: string;
  reference?: string; // référence lead
  assignedTo?: string;
};

const HOUR_MS = 3_600_000;

function extractBookingSlot(meta: unknown): string | null {
  if (!meta || typeof meta !== "object") return null;
  const s = (meta as { bookingSlot?: unknown }).bookingSlot;
  return typeof s === "string" ? s : null;
}

export async function composeCalendarEvents(opts: {
  assignedToFilter?: string;
} = {}): Promise<CalendarEvent[]> {
  const [leads, reminders] = await Promise.all([
    listLeads(),
    listReminders({ pendingOnly: true }),
  ]);
  const events: CalendarEvent[] = [];
  const filter = opts.assignedToFilter?.toLowerCase().trim();
  const now = Date.now();

  for (const lead of leads as LeadRecord[]) {
    if (filter && (lead.assignedTo ?? "").toLowerCase() !== filter) continue;

    const slot = extractBookingSlot(lead.metadata);
    if (slot) {
      const start = new Date(slot);
      if (!isNaN(start.getTime())) {
        events.push({
          uid: `lead-${lead.reference}-booking@chauffage-artisanal.lu`,
          kind: "booking",
          startAt: start.toISOString(),
          endAt: new Date(start.getTime() + HOUR_MS).toISOString(),
          summary: `RDV · ${lead.fullName}`,
          description: `Lead ${lead.reference} · ${lead.commune} · ${lead.services.join(" · ")}`,
          reference: lead.reference,
          assignedTo: lead.assignedTo,
        });
      }
    }

    if (lead.status === "nouveau" && lead.timeline === "urgent") {
      const due = new Date(lead.submittedAt);
      due.setDate(due.getDate() + 1);
      if (due.getTime() >= now - 30 * 86_400_000) {
        events.push({
          uid: `lead-${lead.reference}-urgent@chauffage-artisanal.lu`,
          kind: "urgent",
          startAt: due.toISOString(),
          endAt: new Date(due.getTime() + HOUR_MS).toISOString(),
          summary: `Urgent · ${lead.fullName}`,
          description: `Lead ${lead.reference} marqué urgent — à recontacter sous 24 h`,
          reference: lead.reference,
          assignedTo: lead.assignedTo,
        });
      }
    }

    if (lead.status === "devis_envoye") {
      const due = new Date(lead.submittedAt);
      due.setDate(due.getDate() + 7);
      if (due.getTime() >= now - 30 * 86_400_000) {
        events.push({
          uid: `lead-${lead.reference}-followup@chauffage-artisanal.lu`,
          kind: "follow-up",
          startAt: due.toISOString(),
          endAt: new Date(due.getTime() + HOUR_MS).toISOString(),
          summary: `Relance devis · ${lead.fullName}`,
          description: `Lead ${lead.reference} · devis envoyé sans retour, relance recommandée`,
          reference: lead.reference,
          assignedTo: lead.assignedTo,
        });
      }
    }
  }

  // Rappels actifs
  const leadByRef = new Map(leads.map((l) => [l.reference, l as LeadRecord]));
  for (const r of reminders) {
    const lead = leadByRef.get(r.leadReference);
    if (!lead) continue;
    if (filter && (lead.assignedTo ?? "").toLowerCase() !== filter) continue;
    const start = new Date(r.dueAt);
    if (isNaN(start.getTime())) continue;
    events.push({
      uid: `reminder-${r.id}@chauffage-artisanal.lu`,
      kind: "reminder",
      startAt: start.toISOString(),
      endAt: new Date(start.getTime() + 30 * 60_000).toISOString(),
      summary: `Rappel · ${lead.fullName}`,
      description: r.note || `Rappel programmé sur ${lead.reference}`,
      reference: lead.reference,
      assignedTo: lead.assignedTo,
    });
  }

  events.sort(
    (a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime(),
  );
  return events;
}
