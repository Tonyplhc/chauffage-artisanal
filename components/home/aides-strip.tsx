"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowUpRight, HandCoins, Building2, Receipt, ShieldCheck } from "lucide-react";
import { Eyebrow, Reveal } from "@/components/ui";

const H = ({ children }: { children: React.ReactNode }) => (
  <strong className="text-copper font-semibold">{children}</strong>
);

type Pillar = { icon: typeof HandCoins; label: string; body: React.ReactNode };

const PILLARS: Pillar[] = [
  {
    icon: HandCoins,
    label: "Klimabonus",
    body: (
      <>
        <H>Programme national</H> d&apos;aides à la rénovation énergétique et aux{" "}
        <H>énergies renouvelables</H>.
      </>
    ),
  },
  {
    icon: Building2,
    label: "Aides communales",
    body: (
      <>
        <H>Klimapakt</H> : votre commune peut ajouter une aide qui se{" "}
        <H>cumule souvent</H> au dispositif national.
      </>
    ),
  },
  {
    icon: Receipt,
    label: "TVA réduite",
    body: (
      <>
        Travaux de logement éligibles à une <H>TVA réduite</H>, sous conditions
        (ancienneté, usage).
      </>
    ),
  },
];

export function AidesStrip() {
  return (
    <section className="relative py-14 lg:py-20 bg-cream border-y border-ink/8 overflow-hidden">
      {/* Background accent */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-32 -right-32 h-96 w-96 rounded-full bg-copper/8 blur-3xl" />
        <div className="absolute -bottom-32 -left-32 h-96 w-96 rounded-full bg-copper/5 blur-3xl" />
      </div>

      <div className="container relative">
        {/* Header */}
        <div className="grid lg:grid-cols-12 gap-10 lg:gap-16 items-end mb-10 lg:mb-14">
          <div className="lg:col-span-7">
            <Eyebrow number="03">Aides énergie au Luxembourg</Eyebrow>
            <Reveal>
              <h2 className="mt-5 font-display text-display-lg text-balance text-ink">
                Une partie de votre projet peut être{" "}
                <em className="not-italic text-copper">soutenue par l&apos;État</em>.
              </h2>
            </Reveal>
            <Reveal delay={1}>
              <p className="mt-6 text-lg text-graphite max-w-2xl leading-relaxed">
                <strong className="text-copper font-semibold">Klimabonus</strong>,{" "}
                <strong className="text-copper font-semibold">aides communales</strong>,{" "}
                <strong className="text-copper font-semibold">TVA réduite</strong> : plusieurs
                dispositifs peuvent alléger le coût d&apos;une pompe à chaleur, d&apos;une rénovation
                ou d&apos;une installation solaire. Nous{" "}
                <strong className="text-copper font-semibold">vérifions l&apos;éligibilité</strong>{" "}
                de votre dossier avant chaque devis.
              </p>
            </Reveal>
          </div>

          <div className="lg:col-span-5">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.6 }}
              className="p-6 rounded-2xl border border-copper/30 bg-white"
            >
              <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-eyebrow text-copper">
                <ShieldCheck className="h-3.5 w-3.5" />
                Notre engagement
              </div>
              <p className="mt-4 text-sm text-graphite leading-relaxed">
                Nous préparons le{" "}
                <strong className="text-copper font-semibold">volet technique du dossier</strong>{" "}
                (schémas, attestations, fiches produits). Le dossier administratif{" "}
                <strong className="text-copper font-semibold">reste à votre nom</strong>.{" "}
                <strong className="text-copper font-semibold">
                  Aucune commission sur prime
                </strong>{" "}
                ne vous est facturée.
              </p>
            </motion.div>
          </div>
        </div>

        {/* 3 pillars */}
        <div className="grid md:grid-cols-3 gap-5 lg:gap-6">
          {PILLARS.map((p, i) => (
            <motion.div
              key={p.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.6, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] }}
              className="group p-7 lg:p-8 rounded-2xl border border-ink/10 bg-white hover:border-copper/40 hover:shadow-lift transition-all"
            >
              <div className="flex items-center justify-between">
                <div className="h-11 w-11 rounded-full bg-copper/10 border border-copper/30 grid place-items-center">
                  <p.icon className="h-5 w-5 text-copper" />
                </div>
                <span className="font-mono text-[9px] uppercase tracking-eyebrow text-muted">
                  0{i + 1}
                </span>
              </div>
              <div className="mt-5 font-display text-2xl text-copper tracking-tight">
                {p.label}
              </div>
              <p className="mt-3 text-sm text-graphite leading-relaxed">{p.body}</p>
            </motion.div>
          ))}
        </div>

        {/* CTA bar */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.6 }}
          className="mt-10 lg:mt-12 p-6 lg:p-7 rounded-2xl border border-ink/10 bg-charcoal flex flex-col md:flex-row md:items-center justify-between gap-5"
        >
          <div className="min-w-0">
            <div className="font-mono text-[10px] uppercase tracking-eyebrow text-copper">
              Page dédiée
            </div>
            <div className="mt-1.5 font-display text-xl lg:text-2xl text-cream tracking-tight">
              Voir le détail des aides par typologie de projet.
            </div>
            <p className="mt-2 text-sm text-cream/70 max-w-xl">
              PAC, chauffage, solaire, rénovation, bornes de recharge — ce qui peut être
              soutenu, ce qui ne l&apos;est pas, et où vérifier à la source.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 shrink-0">
            <Link
              href="/primes-aides"
              className="group inline-flex items-center justify-center gap-2 rounded-full bg-cream text-ink px-6 py-3.5 text-sm font-medium hover:bg-copper hover:text-cream transition-colors"
            >
              Voir les aides
              <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </Link>
            <Link
              href="/devis"
              className="inline-flex items-center justify-center gap-2 rounded-full border border-cream/25 text-cream px-6 py-3.5 text-sm font-medium hover:border-copper hover:text-copper transition-colors"
            >
              Vérifier mon projet
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
