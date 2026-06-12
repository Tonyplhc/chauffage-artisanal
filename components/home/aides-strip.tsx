"use client";

import Link from "next/link";
import { ArrowUpRight, ShieldCheck } from "lucide-react";
import { DEMO_AIDES } from "@/lib/demo-data";

/**
 * Section « Aides Luxembourg ».
 * - Emphase en ANTHRACITE (plus de gras bleu `<H>`) : la hiérarchie vient de
 *   la graisse, pas de la couleur.
 * - Les MONTANTS d'aides = données financières (gain) → affichés en VERT.
 * - Le bleu est réservé au CTA. Montants centralisés dans lib/demo-data.ts.
 */
const eur = (n: number) => n.toLocaleString("fr-FR");

export function AidesStrip() {
  return (
    <section className="relative py-14 lg:py-20 bg-creme border-y border-pierre font-ui">
      <div className="container">
        <div className="max-w-2xl">
          <div className="font-mono text-[10px] uppercase tracking-eyebrow text-taupe">02 — Aides Luxembourg</div>
          <h2 className="mt-4 font-display text-display-lg text-balance text-anthra">
            Jusqu&apos;à 12 000 € d&apos;aides. On s&apos;occupe de tout.
          </h2>
          <p className="mt-6 text-lg text-taupe leading-relaxed">
            <strong className="text-anthra font-semibold">Klimabonus</strong>,{" "}
            <strong className="text-anthra font-semibold">aides communales</strong> et{" "}
            <strong className="text-anthra font-semibold">TVA à 3 %</strong> cumulables. Nous montons le volet
            technique du dossier ; l&apos;administratif{" "}
            <strong className="text-anthra font-semibold">reste à votre nom</strong>, et{" "}
            <strong className="text-anthra font-semibold">aucune commission sur prime</strong> n&apos;est facturée.
          </p>
        </div>

        {/* Montants = données financières (gain) → VERT pour les forfaits */}
        <div className="mt-10 grid sm:grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
          <article className="p-6 rounded-2xl bg-gainBg border border-gain/20">
            <div className="font-display text-3xl text-gain tracking-tight">{eur(DEMO_AIDES.pacAirEau)} €</div>
            <div className="mt-1 text-sm text-taupe">PAC air/eau</div>
          </article>
          <article className="p-6 rounded-2xl bg-gainBg border border-gain/20">
            <div className="font-display text-3xl text-gain tracking-tight">{eur(DEMO_AIDES.geothermie)} €</div>
            <div className="mt-1 text-sm text-taupe">Géothermie</div>
          </article>
          <article className="p-6 rounded-2xl bg-white border border-pierre">
            <div className="font-display text-3xl text-anthra tracking-tight">+ Enoprimes</div>
            <div className="mt-1 text-sm text-taupe">Cumulables</div>
          </article>
          <article className="p-6 rounded-2xl bg-white border border-pierre">
            <div className="font-display text-3xl text-anthra tracking-tight">TVA 3 %</div>
            <div className="mt-1 text-sm text-taupe">Logement</div>
          </article>
        </div>

        {/* Parcours administratif (neutre) */}
        <div className="mt-8 flex flex-wrap items-center gap-x-3 gap-y-2 text-sm text-taupe">
          <span className="px-3 py-1.5 rounded-full bg-white border border-pierre">1 · Analyse</span>
          <span className="text-pierre">→</span>
          <span className="px-3 py-1.5 rounded-full bg-white border border-pierre">2 · Dossier (MyGuichet)</span>
          <span className="text-pierre">→</span>
          <span className="px-3 py-1.5 rounded-full bg-white border border-pierre">3 · Validation</span>
          <span className="text-pierre">→</span>
          <span className="px-3 py-1.5 rounded-full bg-white border border-pierre">4 · Installation</span>
        </div>

        {/* Engagement + CTA (le seul bleu de la section) */}
        <div className="mt-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-6 rounded-2xl bg-white border border-pierre">
          <div className="flex items-start gap-3">
            <span className="grid place-items-center h-9 w-9 rounded-full bg-sable shrink-0">
              <ShieldCheck className="h-4 w-4 text-brun" />
            </span>
            <p className="text-sm text-taupe max-w-xl">
              Dossier monté pour vous, <strong className="text-anthra font-semibold">à votre nom</strong>, sans
              commission sur prime.
            </p>
          </div>
          <Link
            href="/estimation"
            className="group inline-flex items-center justify-center gap-2 rounded-full bg-bleu text-creme px-6 py-3.5 text-sm font-semibold hover:bg-navy transition-colors shrink-0"
          >
            Voir mes aides · 60 s
            <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </Link>
        </div>
      </div>
    </section>
  );
}
