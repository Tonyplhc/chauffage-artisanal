import type { MetadataRoute } from "next";

/**
 * Manifest PWA — orienté terrain technicien (admin mode field) ET
 * raccourcis publics pour clients qui installent le site sur leur écran.
 *
 * Next.js génère automatiquement les icônes via app/icon.tsx (32×32)
 * et app/apple-icon.tsx (180×180). On référence ici les variantes pour
 * Android (192/512) qui sont aussi servies via Next ImageResponse.
 *
 * Référence : https://nextjs.org/docs/app/api-reference/file-conventions/metadata/manifest
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Chauffage Artisanal — Luxembourg",
    short_name: "Chauffage Artisanal",
    description:
      "Installation et entretien chauffage, pompes à chaleur, climatisation, sanitaire au Luxembourg. Depuis 1994.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#f6f0e4",
    theme_color: "#0B57A0",
    orientation: "portrait-primary",
    lang: "fr-LU",
    categories: ["business", "utilities", "productivity"],
    // Icônes : Next.js sert /icon (32) et /apple-icon (180) automatiquement.
    // Pour Android home screen on a besoin de 192/512 — ils ne sont pas
    // générés statiquement ici mais référencés dynamiquement via /icon-large.
    icons: [
      {
        // Icône principale Next.js
        src: "/icon",
        sizes: "32x32",
        type: "image/png",
        purpose: "any",
      },
      {
        // Apple touch icon Next.js
        src: "/apple-icon",
        sizes: "180x180",
        type: "image/png",
        purpose: "any",
      },
    ],
    // Raccourcis — apparaissent au long-press de l'icône sur Android/PWA
    shortcuts: [
      {
        name: "Demander un devis",
        short_name: "Devis",
        url: "/devis",
        description: "Lancer le configurateur de devis",
      },
      {
        name: "Estimateur de prix",
        short_name: "Estimateur",
        url: "/outils/estimateur-prix",
        description: "Fourchette de prix instantanée",
      },
      {
        name: "Klimabonus 2026",
        short_name: "Klimabonus",
        url: "/klimabonus-2026",
        description: "Barèmes aides officielles",
      },
      {
        name: "Dépannage",
        short_name: "Dépannage",
        url: "/depannage",
        description: "Astreinte technique",
      },
    ],
  };
}
