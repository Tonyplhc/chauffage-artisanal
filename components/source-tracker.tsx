"use client";

/**
 * Capteur de source d'acquisition.
 *
 * Sur le premier mount d'une session (sessionStorage), capture les UTM params
 * de l'URL + le referrer + la landing page, et persiste pour réutilisation au
 * submit du devis.
 *
 * Aucun rendu — composant invisible.
 */

import { useEffect } from "react";
import { captureAndStoreSource } from "@/lib/source-tracking";

export function SourceTracker() {
  useEffect(() => {
    captureAndStoreSource();
  }, []);
  return null;
}
