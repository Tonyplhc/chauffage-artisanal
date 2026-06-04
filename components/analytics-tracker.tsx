"use client";

/**
 * Tracker analytics côté client.
 *
 * Envoie un événement pageview à chaque changement de pathname.
 * Skip explicite :
 *   - Zones /admin/* (la team n'a pas besoin d'être trackée)
 *   - Pages tokenisées (/devis/recap, /devis/officiel, /espace) — pas
 *     d'analytics sur les pages privées du client.
 *
 * Pas de batching pour la démo — on envoie au fil de l'eau. Pour scaler,
 * on pourrait batcher avec sendBeacon sur unload.
 */

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

function shouldSkip(path: string): boolean {
  if (path.startsWith("/admin")) return true;
  if (path.startsWith("/api/")) return true;
  if (path.startsWith("/devis/recap/")) return true;
  if (path.startsWith("/devis/officiel/")) return true;
  if (path.startsWith("/espace/")) return true;
  return false;
}

export function AnalyticsTracker() {
  const pathname = usePathname();
  const lastSent = useRef<string | null>(null);

  useEffect(() => {
    if (!pathname) return;
    if (shouldSkip(pathname)) return;
    if (lastSent.current === pathname) return;
    lastSent.current = pathname;

    fetch("/api/analytics", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "pageview", path: pathname }),
      keepalive: true,
    }).catch(() => {
      // silent fail
    });
  }, [pathname]);

  return null;
}
