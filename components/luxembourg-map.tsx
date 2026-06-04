"use client";

/**
 * Carte interactive du Luxembourg avec les communes desservies.
 *
 * Approche : SVG inline (aucune dépendance Mapbox / Leaflet → bundle léger).
 * Le tracé du Grand-Duché est simplifié — pas une carte cadastrale, juste
 * une silhouette reconnaissable avec le bon ratio.
 *
 * Les coordonnées relatives des communes (x/y entre 0 et 1) sont calibrées
 * à la main pour respecter la géographie réelle. Si le client veut une carte
 * cadastrale plus tard, on pourra brancher Mapbox sans réécrire l'UX.
 */

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowUpRight, MapPin } from "lucide-react";
import type { Commune } from "@/lib/communes";

type Marker = {
  slug: string;
  name: string;
  x: number; // % gauche (0 = left, 1 = right)
  y: number; // % top (0 = top, 1 = bottom)
  size?: "lg" | "md" | "sm";
};

// Coordonnées relatives calibrées sur la silhouette du tracé ci-dessous.
// Pas géolocalisées au mètre — mais reconnaissables (Esch sud, Diekirch nord, etc.).
const MARKERS: Marker[] = [
  { slug: "luxembourg-ville", name: "Luxembourg-Ville", x: 0.52, y: 0.62, size: "lg" },
  { slug: "esch-sur-alzette", name: "Esch-sur-Alzette", x: 0.34, y: 0.82, size: "lg" },
  { slug: "differdange", name: "Differdange", x: 0.22, y: 0.76, size: "md" },
  { slug: "strassen", name: "Strassen", x: 0.46, y: 0.6, size: "md" },
  { slug: "bertrange", name: "Bertrange", x: 0.42, y: 0.65, size: "md" },
];

// Villes additionnelles non-cliquables pour le repère géographique
const OTHER_CITIES: Marker[] = [
  { slug: "diekirch", name: "Diekirch", x: 0.55, y: 0.28 },
  { slug: "ettelbruck", name: "Ettelbruck", x: 0.52, y: 0.32 },
  { slug: "mersch", name: "Mersch", x: 0.5, y: 0.46 },
  { slug: "wiltz", name: "Wiltz", x: 0.42, y: 0.18 },
  { slug: "echternach", name: "Echternach", x: 0.78, y: 0.42 },
  { slug: "remich", name: "Remich", x: 0.78, y: 0.74 },
  { slug: "dudelange", name: "Dudelange", x: 0.48, y: 0.86 },
];

export function LuxembourgMap({ communes }: { communes: Commune[] }) {
  const [hovered, setHovered] = useState<string | null>(null);
  const activeMarkerSet = new Set(communes.map((c) => c.slug));
  const activeMarkers = MARKERS.filter((m) => activeMarkerSet.has(m.slug));

  return (
    <div className="relative rounded-3xl border border-ink/10 bg-gradient-to-br from-cream to-linen overflow-hidden">
      <svg
        viewBox="0 0 400 500"
        className="block w-full h-auto"
        aria-label="Carte du Grand-Duché de Luxembourg"
      >
        <defs>
          <linearGradient id="lux-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(184,106,54,0.06)" />
            <stop offset="100%" stopColor="rgba(184,106,54,0.14)" />
          </linearGradient>
          <pattern id="lux-grid" width="48" height="48" patternUnits="userSpaceOnUse">
            <path
              d="M 48 0 L 0 0 0 48"
              fill="none"
              stroke="rgba(42,37,30,0.04)"
              strokeWidth="1"
            />
          </pattern>
          <radialGradient id="ping" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="rgba(184,106,54,0.6)" />
            <stop offset="100%" stopColor="rgba(184,106,54,0)" />
          </radialGradient>
        </defs>

        <rect width="100%" height="100%" fill="url(#lux-grid)" />

        {/* Silhouette simplifiée du Grand-Duché */}
        <path
          d="M 200 30
             L 240 50
             L 255 75
             L 265 105
             L 260 135
             L 280 160
             L 295 195
             L 305 225
             L 300 255
             L 315 285
             L 320 315
             L 315 345
             L 300 370
             L 280 390
             L 255 410
             L 225 430
             L 195 450
             L 165 460
             L 140 445
             L 120 415
             L 105 385
             L 95 350
             L 92 320
             L 100 285
             L 110 250
             L 115 220
             L 120 185
             L 130 155
             L 145 125
             L 158 95
             L 170 65
             L 185 45 Z"
          fill="url(#lux-grad)"
          stroke="rgba(184,106,54,0.5)"
          strokeWidth="1.5"
          strokeDasharray="4 3"
        />

        {/* Other cities (non-cliquables) */}
        {OTHER_CITIES.map((c) => (
          <g key={c.slug}>
            <circle
              cx={c.x * 400}
              cy={c.y * 500}
              r={1.8}
              fill="rgba(42,37,30,0.35)"
            />
            <text
              x={c.x * 400 + 6}
              y={c.y * 500 + 3}
              fontSize="9"
              fontFamily="JetBrains Mono, monospace"
              fill="rgba(42,37,30,0.45)"
              style={{ letterSpacing: "0.05em" }}
            >
              {c.name}
            </text>
          </g>
        ))}

        {/* Markers actifs — communes desservies */}
        {activeMarkers.map((m) => {
          const r = m.size === "lg" ? 6 : m.size === "md" ? 4.5 : 3.5;
          const isHovered = hovered === m.slug;
          return (
            <g
              key={m.slug}
              onMouseEnter={() => setHovered(m.slug)}
              onMouseLeave={() => setHovered(null)}
              style={{ cursor: "pointer" }}
            >
              {/* Halo ping */}
              <motion.circle
                cx={m.x * 400}
                cy={m.y * 500}
                r={r * 4}
                fill="url(#ping)"
                initial={{ opacity: 0 }}
                animate={{ opacity: isHovered ? 0.95 : [0.4, 0.7, 0.4] }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />
              {/* Dot */}
              <circle
                cx={m.x * 400}
                cy={m.y * 500}
                r={r}
                fill="#b86a36"
                stroke="#f6f0e4"
                strokeWidth={isHovered ? 3 : 2}
              />
              {/* Label */}
              <g style={{ transform: `translate(${m.x * 400 + 12}px, ${m.y * 500 + 5}px)` }}>
                <text
                  fontSize="11"
                  fontWeight="600"
                  fontFamily="JetBrains Mono, monospace"
                  fill="#2a251e"
                  style={{ letterSpacing: "0.04em" }}
                >
                  {m.name}
                </text>
              </g>
            </g>
          );
        })}

        {/* Compass / boussole */}
        <g transform="translate(355, 50)">
          <circle cx="0" cy="0" r="16" fill="#ffffff" stroke="rgba(42,37,30,0.15)" strokeWidth="1" />
          <text
            x="0"
            y="3"
            fontSize="9"
            fontFamily="JetBrains Mono, monospace"
            textAnchor="middle"
            fill="#b86a36"
            fontWeight="600"
          >
            N
          </text>
          <path d="M 0 -10 L -3 -6 L 0 -8 L 3 -6 Z" fill="#b86a36" />
        </g>

        {/* Légende coin bas */}
        <g transform="translate(30, 460)">
          <text
            fontSize="9"
            fontFamily="JetBrains Mono, monospace"
            fill="rgba(42,37,30,0.5)"
            style={{ letterSpacing: "0.18em", textTransform: "uppercase" }}
          >
            Grand-Duché de Luxembourg · 2 586 km²
          </text>
        </g>
      </svg>

      {/* Detail card du marker hovered */}
      {hovered && (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute bottom-4 left-4 right-4 sm:right-auto sm:max-w-xs bg-white border border-ink/10 rounded-2xl shadow-lift p-4"
        >
          {(() => {
            const m = activeMarkers.find((x) => x.slug === hovered)!;
            const c = communes.find((x) => x.slug === m.slug);
            if (!c) return null;
            return (
              <div>
                <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-eyebrow text-copper">
                  <MapPin className="h-3 w-3" />
                  Zone desservie
                </div>
                <div className="mt-2 font-display text-xl text-ink tracking-tight">
                  {c.name}
                </div>
                <p className="mt-2 text-xs text-graphite leading-relaxed line-clamp-3">
                  {c.context}
                </p>
                <Link
                  href={`/zones/${c.slug}`}
                  className="mt-3 inline-flex items-center gap-1.5 text-xs font-mono uppercase tracking-eyebrow text-ink hover:text-copper transition-colors"
                >
                  Voir la page commune
                  <ArrowUpRight className="h-3 w-3" />
                </Link>
              </div>
            );
          })()}
        </motion.div>
      )}
    </div>
  );
}
