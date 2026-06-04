"use client";

/**
 * Hook React pour récupérer un variant d'A/B test côté client.
 *
 * Assignation visitor-id : persistée en cookie `ca-visitor` 1 an.
 * Le hook fait l'appel API au premier rendu d'une cible donnée.
 */

import { useEffect, useState } from "react";

function ensureVisitorId(): string {
  if (typeof document === "undefined") return "ssr";
  const match = document.cookie.match(/ca-visitor=([^;]+)/);
  if (match) return match[1];
  const id = Array.from(crypto.getRandomValues(new Uint8Array(8)))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  document.cookie = `ca-visitor=${id}; path=/; max-age=${60 * 60 * 24 * 365}; SameSite=Lax`;
  return id;
}

export function useExperiment(target: string): {
  loading: boolean;
  variant: string | null;
  config: Record<string, string | number | boolean>;
} {
  const [state, setState] = useState<{
    loading: boolean;
    variant: string | null;
    config: Record<string, string | number | boolean>;
  }>({
    loading: true,
    variant: null,
    config: {},
  });

  useEffect(() => {
    const visitor = ensureVisitorId();
    fetch(`/api/experiment?target=${encodeURIComponent(target)}&visitor=${visitor}`, {
      cache: "no-store",
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data) {
          setState({
            loading: false,
            variant: data.variant ?? null,
            config: (data.config ?? {}) as Record<string, string | number | boolean>,
          });
        } else {
          setState((s) => ({ ...s, loading: false }));
        }
      })
      .catch(() => setState((s) => ({ ...s, loading: false })));
  }, [target]);

  return state;
}
