"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowUpRight, TrendingDown } from "lucide-react";
import { DEMO_SIMULATION as S } from "@/lib/demo-data";

/**
 * Teaser « Économies » — déclencheur de lead. AUCUNE logique de calcul ici :
 * les chiffres viennent de DEMO_SIMULATION (lib/demo-data.ts), centralisés et
 * remplaçables par le vrai moteur avant production.
 *
 * Convention couleur : VERT = gain, ROUGE = coût (données financières
 * uniquement). Le bleu reste réservé aux CTA.
 */
const eur = (n: number) => n.toLocaleString("fr-FR");

export function Economies() {
  const apresPct = Math.round((S.coutApresAnnuel / S.coutActuelAnnuel) * 100);
  const gain10 = S.economieAnnuelle * S.projectionAnnees;

  return (
    <section id="economies" className="relative py-14 lg:py-20 bg-creme font-ui">
      <div className="container grid lg:grid-cols-2 gap-10 lg:gap-14 items-center">
        {/* Texte */}
        <div>
          <div className="font-mono text-[10px] uppercase tracking-eyebrow text-taupe">01 — Simulateur</div>
          <h2 className="mt-4 font-display text-display-lg text-balance text-anthra">
            Combien pouvez-vous économiser ?
          </h2>
          <p className="mt-6 text-lg text-taupe max-w-md leading-relaxed">
            Votre coût de chauffage aujourd&apos;hui comparé à une pompe à chaleur — sur
            votre consommation réelle, aides déduites.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-3">
            <Link
              href="/estimation"
              className="group inline-flex items-center justify-center gap-2 rounded-full bg-bleu text-creme px-6 py-3.5 text-sm font-semibold hover:bg-navy transition-colors"
            >
              Estimer mes économies · 60 s
              <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </Link>
            <Link
              href="/devis"
              className="inline-flex items-center justify-center gap-2 rounded-full border border-pierre text-anthra px-6 py-3.5 text-sm font-semibold hover:border-bleu hover:text-bleu transition-colors"
            >
              Demander une étude
            </Link>
          </div>
        </div>

        {/* Carte JACKPOT — rouge = coût, vert = gain */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.6 }}
          className="rounded-3xl bg-white border border-pierre shadow-lift overflow-hidden"
        >
          {/* Comparatif coût */}
          <div className="px-7 lg:px-8 pt-7">
            <div className="font-mono text-[10px] uppercase tracking-eyebrow text-muted">Votre gain estimé</div>

            {/* Aujourd'hui — ROUGE */}
            <div className="mt-5">
              <div className="flex items-baseline justify-between gap-3">
                <span className="text-sm text-taupe">
                  Aujourd&apos;hui · <strong className="text-anthra font-semibold">{S.energieActuelle}</strong>
                </span>
                <span className="font-display text-2xl text-perte tracking-tight">
                  {eur(S.coutActuelAnnuel)} €<span className="text-base text-perte/70">/an</span>
                </span>
              </div>
              <div className="mt-2 h-2.5 rounded-full bg-perteBg overflow-hidden">
                <div className="h-full rounded-full bg-perte" style={{ width: "100%" }} />
              </div>
            </div>

            {/* Demain — neutre */}
            <div className="mt-4">
              <div className="flex items-baseline justify-between gap-3">
                <span className="text-sm text-taupe">
                  Demain · <strong className="text-anthra font-semibold">{S.solution}</strong>
                </span>
                <span className="font-display text-2xl text-anthra tracking-tight">
                  {eur(S.coutApresAnnuel)} €<span className="text-base text-muted">/an</span>
                </span>
              </div>
              {/* Barre empilée : neutre (ce qu'on paie encore) + VERT (économie) */}
              <div className="mt-2 h-2.5 rounded-full bg-anthra/8 overflow-hidden flex">
                <div className="h-full bg-anthra/30" style={{ width: `${apresPct}%` }} />
                <div className="h-full bg-gain" style={{ width: `${100 - apresPct}%` }} />
              </div>
              <div className="mt-1.5 flex items-center gap-1.5 text-[11px] text-taupe">
                <span className="inline-block h-2 w-2 rounded-full bg-gain" />
                Part économisée
              </div>
            </div>
          </div>

          {/* Économie — VERT géant */}
          <div className="mt-7 bg-gainBg border-t border-gain/20 px-7 lg:px-8 py-7">
            <div className="flex items-center gap-2 text-gain">
              <TrendingDown className="h-5 w-5" strokeWidth={2.4} />
              <span className="font-mono text-[10px] uppercase tracking-eyebrow">Vous économisez</span>
            </div>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="font-display text-7xl lg:text-8xl tracking-tightest text-gain leading-none">
                {eur(S.economieAnnuelle)}
              </span>
              <span className="font-display text-3xl text-gain/70">€/an</span>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <span className="px-3 py-1.5 rounded-full bg-gain text-white text-xs font-semibold">
                −{S.reductionFacturePct} % sur votre facture
              </span>
              <span className="px-3 py-1.5 rounded-full bg-white border border-gain/30 text-gain text-xs font-semibold">
                + jusqu&apos;à {eur(S.aidesPossibles)} € d&apos;aides
              </span>
            </div>
          </div>

          {/* Détail : budget · aides · reste à charge · projection 10 ans */}
          <div className="px-7 lg:px-8 py-6 border-t border-pierre text-sm">
            <div className="flex items-center justify-between">
              <span className="text-taupe">Budget installation (estim.)</span>
              <span className="text-anthra font-medium">{eur(S.budgetInstallation)} €</span>
            </div>
            <div className="mt-2.5 flex items-center justify-between">
              <span className="text-taupe">Aides déduites</span>
              <span className="text-gain font-semibold">− {eur(S.aidesPossibles)} €</span>
            </div>
            <div className="mt-3 pt-3 border-t border-pierre flex items-center justify-between">
              <span className="font-semibold text-anthra">Reste à charge</span>
              <span className="font-display text-2xl text-anthra">{eur(S.resteACharge)} €</span>
            </div>
            <div className="mt-3 pt-3 border-t border-pierre flex items-center justify-between">
              <span className="text-taupe">Gain projeté sur {S.projectionAnnees} ans</span>
              <span className="font-display text-xl text-gain">+ {eur(gain10)} €</span>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
