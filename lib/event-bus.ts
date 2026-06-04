/**
 * Event bus minimaliste en mémoire pour broadcaster des événements admin
 * (nouveau lead, transition de statut, etc.) à toutes les connexions SSE
 * ouvertes.
 *
 * Limites volontaires :
 *   - Single-process : ne survit pas à un restart, ne synchronise pas entre
 *     instances Vercel. Pour multi-instance, on passerait par Redis Pub/Sub
 *     ou Supabase Realtime — pas la peine en démo.
 *   - Pas de persistance des événements ratés : si l'admin n'est pas connecté,
 *     l'événement est perdu (les emails / webhooks restent la couche fiable).
 *
 * Robustesse :
 *   - Le subscriber peut planter sans casser les autres
 *   - L'event bus n'a pas de notion de "queue" — c'est du best-effort live
 */

type Listener = (event: BusEvent) => void;

export type BusEvent =
  | {
      type: "lead.created";
      at: string;
      reference: string;
      fullName: string;
      services: string[];
      commune: string;
      level?: "hot" | "warm" | "cold";
      score?: number;
    }
  | {
      type: "lead.status_changed";
      at: string;
      reference: string;
      from: string;
      to: string;
    }
  | {
      type: "lead.reminder_fired";
      at: string;
      reference: string;
      note: string;
      dueAt: string;
    };

const listeners = new Set<Listener>();

export function subscribe(fn: Listener): () => void {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

export function publish(event: BusEvent): void {
  for (const l of listeners) {
    try {
      l(event);
    } catch {
      // un subscriber qui plante n'affecte pas les autres
    }
  }
}

export function listenerCount(): number {
  return listeners.size;
}
