/**
 * <OsmMap /> — embed OpenStreetMap natif via iframe.
 *
 * Stratégie : pas de bibliothèque JS (Leaflet, MapLibre) — l'iframe officiel
 * OSM suffit pour afficher un marker précis sur l'adresse réelle. Avantages :
 *   - Zéro dépendance (pas d'install)
 *   - Zéro clé API (pas de quota, pas de tracking)
 *   - Pas de JS supplémentaire à charger (perf)
 *   - Pas de FOUC (chargement progressif)
 *
 * Coordonnées : géocodées via Nominatim depuis l'adresse officielle
 * 28a rue de Crauthem, L-3390 Peppange (canton Esch-sur-Alzette, Lëtzebuerg).
 * Source : OpenStreetMap / Nominatim, place_id 118549968.
 */

import { COMPANY } from "@/lib/company-info";

// Coordonnées vérifiées Nominatim (osm_id 12026741727)
const LAT = 49.5225638;
const LON = 6.1276588;
// Boîte englobante pour le cadrage initial (zoom ~17)
const DELTA = 0.003;
const BBOX = `${LON - DELTA},${LAT - DELTA},${LON + DELTA},${LAT + DELTA}`;

const EMBED_URL = `https://www.openstreetmap.org/export/embed.html?bbox=${BBOX}&layer=mapnik&marker=${LAT},${LON}`;
const LINK_URL = `https://www.openstreetmap.org/?mlat=${LAT}&mlon=${LON}#map=18/${LAT}/${LON}`;

export function OsmMap({
  className = "",
  height = "aspect-[21/9]",
}: {
  className?: string;
  height?: string;
}) {
  return (
    <div
      className={`relative ${height} rounded-3xl overflow-hidden border border-ink/10 bg-linen ${className}`}
    >
      <iframe
        src={EMBED_URL}
        title={`Carte OpenStreetMap — ${COMPANY.shortName} à Peppange`}
        loading="lazy"
        className="absolute inset-0 w-full h-full"
        style={{ border: 0 }}
      />
      {/* Lien direct vers OSM en plein écran (overlay discret en bas) */}
      <a
        href={LINK_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="absolute bottom-3 right-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-cream/95 backdrop-blur border border-ink/15 text-[10px] font-mono uppercase tracking-eyebrow text-ink hover:bg-cream transition-colors shadow-soft"
      >
        Voir sur OSM
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="10"
          height="10"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
        >
          <path d="M7 17L17 7M17 7H8M17 7V16" />
        </svg>
      </a>
    </div>
  );
}
