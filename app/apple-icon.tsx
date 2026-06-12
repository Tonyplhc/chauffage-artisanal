/**
 * Apple touch icon — 180x180 PNG généré par Next.js ImageResponse.
 * Utilisé par iOS quand le visiteur ajoute le site à l'écran d'accueil.
 *
 * Le fond cuivre rempli (pas crème) donne un meilleur rendu iOS où
 * l'icône est croppée en cercle ou superellipse selon la version.
 */

import { ImageResponse } from "next/og";

// Static export — Next.js pré-rend l'icône au build, pas par requête
export const dynamic = "force-static";
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#0B57A0",
        }}
      >
        <svg
          width="110"
          height="110"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M12 2c1.5 3 4 4.5 4 8a4 4 0 11-8 0c0-1.5.5-2.5 1.5-3.5C10.5 5 11 3.5 12 2z"
            fill="#f6f0e4"
          />
          <path
            d="M9 14c1 1.5 4.5 1.5 6 0"
            stroke="#f6f0e4"
            strokeWidth="1.2"
            strokeLinecap="round"
          />
        </svg>
      </div>
    ),
    size,
  );
}
