import type { MetadataRoute } from "next";

const BASE = process.env.PUBLIC_URL ?? "https://www.chauffage-artisanal.lu";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin", "/api/admin"],
      },
    ],
    sitemap: `${BASE}/sitemap.xml`,
    host: BASE,
  };
}
