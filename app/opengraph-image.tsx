import { ImageResponse } from "next/og";

/**
 * Open Graph image globale.
 *
 * Notes Next.js 14 sur Windows :
 *   - `next/og` sous Node + path avec espaces casse au chargement de la font
 *     par défaut (fileURLToPath). On force donc `runtime = "edge"` qui contourne.
 *   - `background: "#xxx"` est interprété comme background-IMAGE par satori et
 *     échoue. On utilise systématiquement `backgroundColor` et `backgroundImage`
 *     (jamais `background` court).
 */

export const runtime = "edge";
export const alt = "Chauffage Artisanal — Atelier thermique luxembourgeois depuis 1994";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          backgroundColor: "#f6f0e4",
          display: "flex",
          flexDirection: "column",
          padding: 80,
        }}
      >
        {/* Eyebrow */}
        <div
          style={{
            color: "#0B57A0",
            fontSize: 22,
            textTransform: "uppercase",
            letterSpacing: 8,
            display: "flex",
            alignItems: "center",
            gap: 24,
          }}
        >
          <span>Chauffage Artisanal</span>
          <span
            style={{
              width: 60,
              height: 1,
              backgroundColor: "rgba(11,87,160,0.5)",
              display: "flex",
            }}
          />
          <span style={{ color: "#8b847a" }}>Luxembourg · Depuis 1994</span>
        </div>

        {/* Titre */}
        <div
          style={{
            marginTop: "auto",
            color: "#2a251e",
            fontSize: 92,
            lineHeight: 1.05,
            letterSpacing: -3,
            display: "flex",
            flexWrap: "wrap",
            gap: 18,
          }}
        >
          <span>Le confort thermique</span>
          <span style={{ color: "#0B57A0" }}>nouvelle génération</span>
          <span>au Luxembourg.</span>
        </div>

        {/* Footer */}
        <div
          style={{
            marginTop: 56,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            paddingTop: 28,
            borderTop: "1px solid rgba(42,37,30,0.18)",
            color: "#4a4338",
            fontSize: 24,
          }}
        >
          <div style={{ display: "flex" }}>
            Chauffage · PAC · Climatisation · Sanitaire · Énergies renouvelables
          </div>
          <div
            style={{
              display: "flex",
              padding: "14px 28px",
              borderRadius: 9999,
              backgroundColor: "#2A2724",
              color: "#f6f0e4",
              fontSize: 22,
            }}
          >
            chauffage-artisanal.lu
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
