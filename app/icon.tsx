/**
 * Icône PWA / favicon — génération automatique via Next.js ImageResponse.
 * Next.js produit /icon (32x32) qui sert de favicon par défaut.
 *
 * Design : flamme cuivre stylisée sur fond crème, cohérent avec
 * l'identité de l'atelier (cuivre #b86a36, crème #f6f0e4).
 */

import { ImageResponse } from "next/og";

// Static export — Next.js pré-rend l'icône au build, pas par requête
export const dynamic = "force-static";
export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#f6f0e4",
          borderRadius: "8px",
        }}
      >
        <svg
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M12 2c1.5 3 4 4.5 4 8a4 4 0 11-8 0c0-1.5.5-2.5 1.5-3.5C10.5 5 11 3.5 12 2z"
            fill="#b86a36"
          />
        </svg>
      </div>
    ),
    size,
  );
}
