"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowUpRight, Phone, Check } from "lucide-react";
import { ease } from "@/components/ui";
import { useI18n } from "@/components/i18n-provider";
import { useExperiment } from "@/components/experiment-provider";
import { Logo } from "@/components/brand/logo";
import { COMPANY } from "@/lib/company-info";
import { COMMUNES_LU } from "@/lib/referentiel/estimation";

export function Hero() {
  const { t } = useI18n();
  const router = useRouter();
  useExperiment("home_hero_cta");

  // Mini-lanceur de l'estimateur (commune + chauffage → /estimation pré-rempli).
  const [hCommune, setHCommune] = useState("Luxembourg");
  const [hChauffage, setHChauffage] = useState("mazout");
  function lancerEstimation() {
    router.push(`/estimation?commune=${encodeURIComponent(hCommune)}&chauffage=${hChauffage}`);
  }

  const proofs = [
    t.hero.proofFounded,
    `${t.hero.proofCompany} (RCS ${COMPANY.registry.rcsLuxembourg})`,
    t.hero.proofPartners,
  ];

  return (
    <section className="relative overflow-hidden bg-creme font-ui">
      <div className="container relative pt-12 lg:pt-20 pb-14 lg:pb-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
          {/* Colonne texte */}
          <div className="lg:col-span-7">
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease }}
              className="flex items-center gap-3 font-mono text-[11px] uppercase tracking-eyebrow text-bleu"
            >
              <span className="text-taupe">{t.hero.eyebrowEst}</span>
              <span className="h-px w-10 bg-bleu/40" />
              <span>{t.hero.eyebrowRegion}</span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9, ease, delay: 0.05 }}
              className="mt-6 font-display text-display-lg tracking-tightest text-anthra text-balance max-w-[16ch]"
            >
              {t.hero.titleBefore}{" "}
              <em className="not-italic text-bleu">{t.hero.titleHighlight}</em>
              {t.hero.titleAfter}
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease, delay: 0.15 }}
              className="mt-6 text-lg text-taupe max-w-xl"
            >
              {t.hero.subtitle}
            </motion.p>

            {/* Lanceur estimateur — le produit cœur : commune + chauffage → /estimation */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease, delay: 0.25 }}
              className="mt-8 max-w-xl"
            >
              <div className="rounded-2xl border border-pierre bg-white/75 backdrop-blur p-4 shadow-soft">
                <div className="font-mono text-[10px] uppercase tracking-eyebrow text-bleu mb-3">
                  Estimez vos économies en 60 s · gratuit
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <label className="block">
                    <span className="text-[11px] text-taupe ml-1">Votre commune</span>
                    <select
                      value={hCommune}
                      onChange={(e) => setHCommune(e.target.value)}
                      className="mt-1 w-full rounded-xl border border-pierre bg-creme px-3.5 py-3 text-sm text-anthra focus:border-bleu outline-none"
                    >
                      {COMMUNES_LU.map((c) => (
                        <option key={c} value={c}>
                          {c === "Luxembourg" ? "Luxembourg-Ville" : c === "Autre" ? "Autre commune" : c}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="block">
                    <span className="text-[11px] text-taupe ml-1">Chauffage actuel</span>
                    <select
                      value={hChauffage}
                      onChange={(e) => setHChauffage(e.target.value)}
                      className="mt-1 w-full rounded-xl border border-pierre bg-creme px-3.5 py-3 text-sm text-anthra focus:border-bleu outline-none"
                    >
                      <option value="mazout">Mazout</option>
                      <option value="gaz">Gaz</option>
                      <option value="electrique">Électrique</option>
                      <option value="bois">Bois / pellets</option>
                      <option value="autre">Autre</option>
                    </select>
                  </label>
                </div>
                <button
                  onClick={lancerEstimation}
                  className="mt-3 w-full group inline-flex items-center justify-center gap-2 rounded-full bg-bleu text-creme px-7 py-3.5 text-sm font-semibold hover:bg-navy transition-all duration-300 hover:-translate-y-0.5"
                >
                  Voir mon potentiel
                  <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </button>
              </div>
              <a
                href={`tel:${COMPANY.phone.tel}`}
                className="mt-3 group inline-flex items-center justify-center gap-2 rounded-full bg-creme border border-terracotta/40 text-terracotta px-7 py-3 text-sm font-semibold hover:bg-terracotta/10 transition-all"
              >
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-terracotta opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-terracotta" />
                </span>
                <Phone className="h-4 w-4" />
                {t.hero.depannage}
              </a>
            </motion.div>

            {/* Preuves above-the-fold (réelles) */}
            <motion.ul
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease, delay: 0.35 }}
              className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-taupe"
            >
              {proofs.map((p) => (
                <li key={p} className="inline-flex items-center gap-1.5">
                  <Check className="h-3.5 w-3.5 text-bleu shrink-0" />
                  {p}
                </li>
              ))}
            </motion.ul>
          </div>

          {/* Colonne image + carte engagement */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease, delay: 0.2 }}
            className="lg:col-span-5"
          >
            <div className="relative aspect-[4/5] rounded-[28px] overflow-hidden shadow-lift bg-sable">
              {/* [DEMO] visuel placeholder — à remplacer par une vraie photo de chantier */}
              <Image
                src="https://images.pexels.com/photos/1571460/pexels-photo-1571460.jpeg?auto=compress&w=1600"
                alt="Intérieur résidentiel luxembourgeois — confort thermique"
                fill
                priority
                fetchPriority="high"
                sizes="(max-width: 1024px) 100vw, 460px"
                quality={80}
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-navy/55 via-navy/10 to-transparent" />

              {/* Carte engagement — co-branding logo réel */}
              <div className="absolute bottom-5 left-5 right-5 bg-creme/95 backdrop-blur rounded-2xl p-4 shadow-soft">
                <div className="flex items-center justify-between gap-3 pb-3 mb-3 border-b border-pierre">
                  <Logo heightClass="h-7" />
                  <span className="font-mono text-[9px] uppercase tracking-eyebrow text-taupe">
                    {t.hero.cardLabel}
                  </span>
                </div>
                <div className="font-display text-2xl text-anthra leading-tight">
                  {t.hero.cardTitle}
                </div>
                <div className="text-sm text-taupe">{t.hero.cardSub}</div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
