"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowUpRight, Info } from "lucide-react";
import { Eyebrow, Reveal } from "@/components/ui";

const PROJECTS = [
  {
    img: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=1600&auto=format&fit=crop",
    type: "Villa privée",
    place: "Luxembourg",
    title: "Hybride solaire thermique + pompe à chaleur",
    metric: "Cas d'usage typique",
    year: "Exemple",
  },
  {
    img: "https://images.unsplash.com/photo-1497366216548-37526070297c?q=80&w=1600&auto=format&fit=crop",
    type: "Bureau tertiaire",
    place: "Luxembourg",
    title: "Climatisation centralisée tertiaire",
    metric: "Cas d'usage typique",
    year: "Exemple",
  },
  {
    img: "https://images.unsplash.com/photo-1568605114967-8130f3a36994?q=80&w=1600&auto=format&fit=crop",
    type: "Maison passive",
    place: "Luxembourg",
    title: "Pompe à chaleur & ventilation double flux",
    metric: "Cas d'usage typique",
    year: "Exemple",
  },
  {
    img: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?q=80&w=1600&auto=format&fit=crop",
    type: "Résidentiel collectif",
    place: "Luxembourg",
    title: "Chaufferie collective à condensation",
    metric: "Cas d'usage typique",
    year: "Exemple",
  },
];

export function Realisations() {
  return (
    <section className="relative py-14 lg:py-20 bg-cream">
      <div className="container">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 mb-6">
          <div>
            <Eyebrow number="04">Exemples de réalisations</Eyebrow>
            <Reveal>
              <h2 className="mt-5 font-display text-display-lg max-w-3xl text-balance text-ink">
                Quatre situations typiques que nous adressons.
              </h2>
            </Reveal>
          </div>
          <Reveal delay={1}>
            <Link
              href="/realisations"
              className="group inline-flex items-center gap-2 text-sm font-mono uppercase tracking-eyebrow text-ink hover:text-copper transition-colors self-start lg:self-end"
            >
              Voir tous les cas d&apos;usage
              <ArrowUpRight className="h-4 w-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </Link>
          </Reveal>
        </div>

        {/* Disclaimer */}
        <div className="mb-8 lg:mb-10 inline-flex items-center gap-2 text-xs text-muted font-mono uppercase tracking-eyebrow">
          <Info className="h-3 w-3 text-copper" />
          Photos d&apos;illustration · cas typiques · galerie projets clients en cours de constitution
        </div>

        <div className="grid md:grid-cols-2 gap-6 lg:gap-8">
          {PROJECTS.map((p, i) => (
            <motion.div
              key={p.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.8, delay: (i % 2) * 0.12, ease: [0.22, 1, 0.36, 1] }}
              className={`group relative ${i % 2 === 1 ? "md:mt-16" : ""}`}
            >
              <div className="relative aspect-[4/5] rounded-3xl overflow-hidden bg-stone shadow-card">
                <Image
                  src={p.img}
                  alt=""
                  fill
                  sizes="(max-width: 768px) 100vw, 50vw"
                  className="object-cover group-hover:scale-105 transition-transform duration-1000"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-charcoal/70 via-charcoal/10 to-transparent" />

                <div className="absolute top-5 left-5 right-5 flex items-center justify-between">
                  <span className="font-mono text-[10px] uppercase tracking-eyebrow text-ink bg-cream/90 backdrop-blur-md border border-ink/10 px-3 py-1.5 rounded-full">
                    {p.type} · {p.place}
                  </span>
                  <span className="font-mono text-[10px] uppercase tracking-eyebrow text-cream/90 bg-charcoal/40 backdrop-blur-md border border-cream/15 px-2.5 py-1 rounded-full">
                    {p.year}
                  </span>
                </div>

                <div className="absolute bottom-6 left-6 right-6">
                  <div className="font-mono text-[10px] uppercase tracking-eyebrow text-copper mb-3">
                    {p.metric}
                  </div>
                  <h3 className="font-display text-2xl lg:text-3xl text-cream tracking-tight text-balance">
                    {p.title}
                  </h3>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
