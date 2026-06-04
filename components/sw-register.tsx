"use client";

import { useEffect } from "react";

/**
 * Enregistre le Service Worker au montage. En dev, on désactive — le SW se met
 * trop souvent en travers du HMR.
 */
export function SwRegister() {
  useEffect(() => {
    if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return;
    if (process.env.NODE_ENV !== "production") {
      // Désinstallation en dev pour ne pas piéger les rebuilds
      navigator.serviceWorker
        .getRegistrations()
        .then((regs) => regs.forEach((r) => r.unregister()))
        .catch(() => {});
      return;
    }
    navigator.serviceWorker
      .register("/sw.js", { scope: "/" })
      .catch(() => {
        // Échec silencieux
      });
  }, []);
  return null;
}
