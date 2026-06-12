import type { MetadataRoute } from "next";

const BASE = process.env.PUBLIC_URL ?? "https://www.chauffage-artisanal.lu";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // Espaces privés / tokenisés : hors index (admin, portail client,
        // portail équipement, devis officiels à lien signé)
        disallow: ["/admin", "/api/", "/espace/", "/equipement/", "/devis/officiel/"],
      },
    ],
    sitemap: `${BASE}/sitemap.xml`,
    host: BASE,
  };
}
