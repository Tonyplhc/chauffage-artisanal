"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { MapPin, ExternalLink } from "lucide-react";
import { Eyebrow, Reveal } from "@/components/ui";

/**
 * Chaque ville lance l'estimateur pré-rempli sur sa commune (Règle N°2 : tout
 * converge vers l'estimation). Les quartiers/zones sont mappés vers leur
 * commune administrative (référentiel COMMUNES_LU).
 */
const CITIES: { label: string; commune: string }[] = [
  { label: "Luxembourg-Ville", commune: "Luxembourg" },
  { label: "Esch-sur-Alzette", commune: "Esch-sur-Alzette" },
  { label: "Differdange", commune: "Differdange" },
  { label: "Dudelange", commune: "Dudelange" },
  { label: "Pétange", commune: "Pétange" },
  { label: "Strassen", commune: "Strassen" },
  { label: "Bertrange", commune: "Bertrange" },
  { label: "Mamer", commune: "Mamer" },
  { label: "Mersch", commune: "Mersch" },
  { label: "Diekirch", commune: "Diekirch" },
  { label: "Ettelbruck", commune: "Ettelbruck" },
  { label: "Foetz", commune: "Mondercange" },
  { label: "Kirchberg", commune: "Luxembourg" },
  { label: "Cloche d'Or", commune: "Luxembourg" },
  { label: "Belval", commune: "Esch-sur-Alzette" },
  { label: "Mondorf-les-Bains", commune: "Mondorf-les-Bains" },
];

// Coordonnées du Grand-Duché (bbox couvrant tout le pays)
// Nord 50.18°, Sud 49.45°, Est 6.55°, Ouest 5.74°
const LUX_BBOX = "5.7,49.43,6.6,50.2";
// Atelier Chauffage Artisanal à Peppange (vérifié Nominatim Round J)
const PEPPANGE_LAT = 49.5225638;
const PEPPANGE_LON = 6.1276588;
const OSM_EMBED = `https://www.openstreetmap.org/export/embed.html?bbox=${LUX_BBOX}&layer=mapnik&marker=${PEPPANGE_LAT},${PEPPANGE_LON}`;
const OSM_LINK = `https://www.openstreetmap.org/?mlat=${PEPPANGE_LAT}&mlon=${PEPPANGE_LON}#map=10/49.815/6.13`;

export function Zone() {
  return (
    <section className="relative py-14 lg:py-20 bg-cream">
      <div className="container">
        <div className="grid lg:grid-cols-12 gap-10">
          <div className="lg:col-span-5">
            <Eyebrow number="08">Zone d&apos;intervention</Eyebrow>
            <Reveal>
              <h2 className="mt-5 font-display text-display-lg text-balance text-ink">
                <em className="not-italic text-copper">Tout le Grand-Duché</em>. Et au-delà.
              </h2>
            </Reveal>
            <Reveal delay={1}>
              <p className="mt-6 text-graphite">
                Nos équipes interviennent sur{" "}
                <strong className="text-copper font-semibold">
                  l&apos;ensemble du territoire luxembourgeois
                </strong>{" "}
                et dans la{" "}
                <strong className="text-copper font-semibold">
                  Grande Région — Belgique, France, Allemagne
                </strong>{" "}
                — pour les projets sur dossier.
              </p>
            </Reveal>

            <div className="mt-10 grid sm:grid-cols-3 gap-px bg-ink/8 border border-ink/8 rounded-xl overflow-hidden">
              <div className="bg-white px-5 py-6">
                <div className="font-mono text-[10px] uppercase tracking-eyebrow text-muted">
                  Zone
                </div>
                <div className="mt-2 font-display text-2xl text-copper">Grand-Duché</div>
              </div>
              <div className="bg-white px-5 py-6">
                <div className="font-mono text-[10px] uppercase tracking-eyebrow text-muted">
                  Intervention
                </div>
                <div className="mt-2 font-display text-2xl text-copper">Selon disponibilité</div>
              </div>
              <div className="bg-white px-5 py-6">
                <div className="font-mono text-[10px] uppercase tracking-eyebrow text-muted">
                  Astreinte
                </div>
                <div className="mt-2 font-display text-2xl text-copper">Sur demande</div>
              </div>
            </div>
          </div>

          {/* Vraie carte OpenStreetMap du Grand-Duché avec marker sur l'atelier */}
          <div className="lg:col-span-7">
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
              className="relative aspect-[5/4] rounded-3xl overflow-hidden border border-ink/10 bg-linen shadow-soft"
            >
              <iframe
                src={OSM_EMBED}
                title="Carte du Grand-Duché de Luxembourg — zone d'intervention Chauffage Artisanal"
                loading="lazy"
                className="absolute inset-0 w-full h-full"
                style={{ border: 0 }}
              />

              {/* Overlay légère en bas pour le texte de stats */}
              <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-cream/95 via-cream/70 to-transparent p-5 pointer-events-none">
                <div className="flex items-center justify-between gap-3 flex-wrap pointer-events-auto">
                  <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-eyebrow text-ink/80">
                    <MapPin className="h-3 w-3 text-copper" />
                    Grand-Duché de Luxembourg · 2 586 km²
                  </div>
                  <a
                    href={OSM_LINK}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-cream/95 backdrop-blur border border-ink/15 text-[10px] font-mono uppercase tracking-eyebrow text-ink hover:bg-cream transition-colors shadow-soft"
                  >
                    Voir sur OSM
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        <div className="mt-8 flex flex-wrap gap-2.5">
          {CITIES.map((city) => (
            <Link
              key={city.label}
              href={`/estimation?commune=${encodeURIComponent(city.commune)}`}
              title={`Estimer mes économies à ${city.label}`}
              className="px-4 py-1.5 rounded-full border border-ink/12 bg-white text-sm text-graphite hover:border-bleu/50 hover:text-bleu transition-colors"
            >
              {city.label}
            </Link>
          ))}
        </div>
        <p className="mt-3 text-xs text-muted">
          Cliquez sur votre ville pour estimer vos économies — gratuit, 60 secondes.
        </p>
      </div>
    </section>
  );
}
