"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowUpRight, Info } from "lucide-react";
import { Eyebrow, Reveal } from "@/components/ui";
import { estimerProjet, type ChauffageActuel, type Logement } from "@/lib/referentiel/estimation";

/**
 * Cas concrets chiffrés — la preuve qui vend ARGENT + SÉCURITÉ (Règle N°1/N°7).
 * AUCUN chiffre inventé : chaque carte est calculée par le moteur déterministe
 * estimerProjet (mêmes formules que /estimation, forfaits Klimabonus vérifiés).
 * Chaque carte deep-link vers l'estimateur pré-rempli → la preuve convertit.
 */

const PROFILS: {
  titre: string;
  commune: string;
  logement: Logement;
  chauffage: ChauffageActuel;
  facture: number;
  param: string;
}[] = [
  { titre: "Maison au mazout", commune: "Mersch", logement: "maison", chauffage: "Mazout", facture: 3200, param: "mazout" },
  { titre: "Maison au gaz", commune: "Bertrange", logement: "maison", chauffage: "Gaz", facture: 2400, param: "gaz" },
  { titre: "Appartement électrique", commune: "Luxembourg", logement: "appartement", chauffage: "Électrique", facture: 2200, param: "electrique" },
];

const CAS = PROFILS.map((p) => ({ ...p, r: estimerProjet({ commune: p.commune, logement: p.logement, chauffage: p.chauffage, factureAnnuelle: p.facture }) }));

const eur = (n: number) => Math.round(n).toLocaleString("fr-FR");

export function Realisations() {
  return (
    <section className="relative py-14 lg:py-20 bg-creme font-ui">
      <div className="container">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 mb-6">
          <div>
            <Eyebrow number="04">Cas concrets chiffrés</Eyebrow>
            <Reveal>
              <h2 className="mt-5 font-display text-display-lg max-w-3xl text-balance text-anthra">
                Ce que ça change, chiffres à l&apos;appui.
              </h2>
            </Reveal>
          </div>
          <Reveal delay={1}>
            <Link
              href="/realisations"
              className="group inline-flex items-center gap-2 text-sm font-mono uppercase tracking-eyebrow text-anthra hover:text-bleu transition-colors self-start lg:self-end"
            >
              Voir nos réalisations
              <ArrowUpRight className="h-4 w-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </Link>
          </Reveal>
        </div>

        <div className="mb-8 lg:mb-10 inline-flex items-center gap-2 text-xs text-muted font-mono uppercase tracking-eyebrow">
          <Info className="h-3 w-3 text-bleu" />
          Cas types calculés par notre moteur d&apos;estimation · forfaits Klimabonus 2026 vérifiés
        </div>

        <div className="grid md:grid-cols-3 gap-4 lg:gap-6">
          {CAS.map((c, i) => (
            <motion.article
              key={c.titre}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.7, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] }}
              className="rounded-3xl border border-pierre bg-white shadow-soft overflow-hidden flex flex-col"
            >
              {/* Profil */}
              <div className="px-6 pt-6">
                <div className="font-mono text-[10px] uppercase tracking-eyebrow text-taupe">
                  {c.commune} · {c.logement === "maison" ? "maison" : "appartement"}
                </div>
                <h3 className="mt-1.5 font-display text-2xl text-anthra tracking-tight">{c.titre}</h3>
                <div className="mt-3 inline-flex items-center gap-2 text-sm">
                  <span className="inline-block h-2 w-2 rounded-full bg-perte" />
                  <span className="text-taupe">
                    Facture : <strong className="text-perte font-semibold">{eur(c.facture)} €/an</strong>
                  </span>
                </div>
              </div>

              {/* Gain — VERT géant */}
              <div className="mt-5 bg-gainBg border-t border-gain/20 px-6 py-5">
                <div className="font-mono text-[10px] uppercase tracking-eyebrow text-gain">Gain sur 10 ans</div>
                <div className="mt-1 font-display text-5xl tracking-tightest text-gain leading-none">
                  +{eur(c.r.gain10ans)} €
                </div>
              </div>

              {/* Détail */}
              <div className="px-6 py-5 text-sm flex-1">
                <div className="flex items-center justify-between">
                  <span className="text-taupe">Économie par an</span>
                  <span className="font-semibold text-gain">+{eur(c.r.economieAnnuelle)} €</span>
                </div>
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-taupe">Klimabonus 2026</span>
                  <span className="font-semibold text-gain">+{eur(c.r.aides.klimabonus)} €</span>
                </div>
                <div className="mt-2 pt-2 border-t border-pierre flex items-center justify-between">
                  <span className="text-taupe">Reste à charge</span>
                  <span className="font-medium text-anthra">{eur(c.r.resteACharge)} €</span>
                </div>
              </div>

              {/* La preuve convertit : même profil, pré-rempli */}
              <Link
                href={`/estimation?commune=${encodeURIComponent(c.commune)}&chauffage=${c.param}`}
                className="group flex items-center justify-between gap-2 px-6 py-4 bg-creme border-t border-pierre text-sm font-semibold text-bleu hover:bg-voile transition-colors"
              >
                Et chez vous ? Votre chiffre en 60 s
                <ArrowUpRight className="h-4 w-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </Link>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}
