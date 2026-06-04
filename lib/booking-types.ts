/**
 * Types et constantes RDV — extraits pour usage client + serveur.
 *
 * Aucune dépendance Node (pas de node:fs, node:crypto), peut donc être importé
 * par les Client Components sans casser le bundling Webpack.
 *
 * Le store fichier vit dans `lib/booking-store.ts` et reste server-only.
 */

export type BookingPurpose = "visite-technique" | "entretien" | "depannage" | "autre";

export const PURPOSE_LABELS: Record<BookingPurpose, string> = {
  "visite-technique": "Visite technique pour devis",
  entretien: "Entretien annuel programmé",
  depannage: "Dépannage non-urgent",
  autre: "Autre raison",
};

export type Booking = {
  id: string;
  slotIso: string;
  durationMin: number;
  purpose: BookingPurpose;
  fullName: string;
  email: string;
  phone: string;
  commune?: string;
  notes?: string;
  createdAt: string;
  status: "pending" | "confirmed" | "cancelled";
};
