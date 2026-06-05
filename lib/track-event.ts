/**
 * Helper analytics client — émet un événement nommé NON identifiant vers
 * /api/analytics (type "event"). Le store/schéma supportent déjà ce format.
 *
 * Garanties :
 *   - Silencieux (try/catch) et non bloquant : un échec analytics n'impacte
 *     JAMAIS l'UX (fetch keepalive, erreurs avalées).
 *   - RGPD : ne JAMAIS passer de PII en meta (nom, email, téléphone, commune,
 *     message, ou toute saisie libre). Meta autorisée = valeurs catégorielles
 *     ou numériques : from, step, subject, surface, service, ctaSurface.
 */
export type TrackMeta = Record<string, string | number | boolean>;

export function trackEvent(name: string, meta?: TrackMeta): void {
  if (typeof window === "undefined") return;
  try {
    void fetch("/api/analytics", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "event",
        name,
        path: window.location.pathname,
        meta,
      }),
      keepalive: true,
    }).catch(() => {});
  } catch {
    // best-effort — l'analytics ne doit jamais bloquer l'UX
  }
}
