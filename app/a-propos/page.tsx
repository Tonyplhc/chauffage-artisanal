"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowUpRight, Building2 } from "lucide-react";
import { PageHeader, Eyebrow, Reveal, SectionTitle } from "@/components/ui";
import { HeroAside } from "@/components/hero-aside";
import { Timeline } from "@/components/home/timeline";
import { Partners } from "@/components/home/partners";
import { FinalCTA } from "@/components/home/cta";

const VALUES = [
  {
    title: "Le geste avant la marge",
    body: "Une pose mal faite finit toujours par coûter plus cher. Nous prenons le temps qu'il faut, et nous facturons à juste prix — jamais à la pression.",
  },
  {
    title: "Une maison, pas une plateforme",
    body: "Pas de sous-traitance déguisée. Chaque technicien qui entre chez vous porte notre badge, signe notre charte, dépend de notre direction technique.",
  },
  {
    title: "Mesurer, prouver, montrer",
    body: "COP mesurés, factures avant/après, photos en cours de chantier. Nous documentons tout, parce que dire qu'on est sérieux ne suffit pas.",
  },
  {
    title: "Vivre vingt ans avec ce qu'on installe",
    body: "Nous refusons d'installer ce que nous ne saurions pas dépanner en 2040. Pas de bricolage importé, pas de modèle confidentiel.",
  },
];

const TEAM = [
  { name: "Direction technique", role: "Pilotage et vision long terme", img: "https://images.unsplash.com/photo-1560250097-0b93528c311a?q=80&w=600&auto=format&fit=crop" },
  { name: "Bureau d'études", role: "Dimensionnement & simulations", img: "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?q=80&w=600&auto=format&fit=crop" },
  { name: "Atelier chauffage", role: "Installation & mise en service", img: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=600&auto=format&fit=crop" },
  { name: "Tertiaire & climatisation", role: "Projets bureaux et commerces", img: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=600&auto=format&fit=crop" },
];

export default function AProposPage() {
  return (
    <>
      <PageHeader
        number="09"
        eyebrow="À propos"
        title={
          <>
            Une maison technique <em className="not-italic text-copper">à taille humaine</em>, à
            l'ambition très claire.
          </>
        }
        intro={
          <>
            Fondée en <strong className="text-copper font-semibold">1994</strong>, Chauffage Artisanal s&apos;est construite autour d&apos;un métier — le chauffage — et d&apos;une discipline : faire bien, faire durer.
          </>
        }
        aside={
          <HeroAside
            icon={Building2}
            eyebrow="La maison en bref"
            items={[
              { label: "Depuis 1994", body: "Continuité de direction depuis l'origine" },
              { label: "Atelier Luxembourg", body: "Équipe pluridisciplinaire en interne" },
              { label: "Six métiers", body: "Chauffage, PAC, clim, sanitaire, EnR, SAV" },
            ]}
            footnote="Une maison technique à taille humaine"
          />
        }
      />

      {/* Photo d'équipe */}
      <section className="relative bg-cream">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.9 }}
            className="relative aspect-[21/9] rounded-3xl overflow-hidden bg-stone shadow-card"
          >
            <Image
              src="https://images.pexels.com/photos/8961069/pexels-photo-8961069.jpeg?auto=compress&w=2400"
              alt=""
              fill
              priority
              sizes="100vw"
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-charcoal/60 via-charcoal/10 to-transparent" />
            <div className="absolute bottom-8 left-8 right-8 flex items-end justify-between">
              <div>
                <div className="font-mono text-[10px] uppercase tracking-eyebrow text-cream/95 bg-charcoal/40 backdrop-blur-md px-3 py-1.5 rounded-full inline-flex">
                  Notre équipe
                </div>
                <div className="font-display text-5xl text-cream mt-3">Une maison technique</div>
              </div>
              <div className="font-mono text-xs text-cream/80 hidden md:block">
                Foetz · Luxembourg
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* VALEURS */}
      <section className="py-14 lg:py-20 bg-cream">
        <div className="container">
          <div className="grid lg:grid-cols-12 gap-12">
            <div className="lg:col-span-5">
              <Eyebrow number="01">Nos engagements</Eyebrow>
              <Reveal>
                <SectionTitle className="mt-4">
                  Quatre principes qui n&apos;ont pas bougé <em className="not-italic text-copper">depuis 1994</em>.
                </SectionTitle>
              </Reveal>
            </div>
            <div className="lg:col-span-7 grid gap-4">
              {VALUES.map((v, i) => (
                <motion.div
                  key={v.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{ duration: 0.6, delay: i * 0.08 }}
                  className="p-6 lg:p-8 rounded-2xl border border-ink/10 bg-white hover:border-copper/40 hover:shadow-lift transition-all"
                >
                  <div className="font-mono text-[10px] uppercase tracking-eyebrow text-copper">
                    0{i + 1}
                  </div>
                  <h3 className="mt-3 font-display text-2xl text-ink tracking-tight">{v.title}</h3>
                  <p className="mt-3 text-graphite leading-relaxed">{v.body}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <Timeline />

      {/* ÉQUIPE DIRECTION */}
      <section className="py-14 lg:py-20 bg-linen border-y border-ink/8">
        <div className="container">
          <div className="max-w-3xl mb-10">
            <Eyebrow number="03">Direction</Eyebrow>
            <Reveal>
              <SectionTitle className="mt-4">Vos interlocuteurs au quotidien.</SectionTitle>
            </Reveal>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {TEAM.map((m, i) => (
              <motion.div
                key={m.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: i * 0.08 }}
              >
                <div className="relative aspect-[4/5] rounded-2xl overflow-hidden bg-stone shadow-soft">
                  <Image
                    src={m.img}
                    alt={m.name}
                    fill
                    sizes="(max-width: 768px) 50vw, 25vw"
                    className="object-cover hover:scale-105 transition-transform duration-700"
                  />
                </div>
                <div className="mt-4">
                  <div className="font-display text-xl text-ink">{m.name}</div>
                  <div className="text-sm text-muted mt-0.5">{m.role}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <Partners />

      {/* Rappel recrutement */}
      <section className="py-12 lg:py-14 bg-cream">
        <div className="container">
          <div className="grid lg:grid-cols-12 gap-10 items-center">
            <div className="lg:col-span-7">
              <Eyebrow number="04">Rejoindre l'équipe</Eyebrow>
              <h2 className="mt-4 font-display text-display-md text-balance text-ink">
                Une maison technique{" "}
                <em className="not-italic text-copper">grandit avec ses gens</em>.
              </h2>
              <p className="mt-5 text-graphite text-lg max-w-2xl">
                Si la méthode et les valeurs que vous venez de lire correspondent à ce que vous
                cherchez en tant que professionnel, nous serons ravis de vous rencontrer. Postes
                ouverts en permanence pour les techniciens chauffagistes, frigoristes, plombiers,
                apprentis et bureau d&apos;études.
              </p>
            </div>
            <div className="lg:col-span-5 flex lg:justify-end">
              <Link
                href="/recrutement"
                className="group inline-flex items-center justify-center gap-2 rounded-full bg-ink text-cream px-7 py-4 text-sm font-medium hover:bg-copper transition-all hover:-translate-y-0.5"
              >
                Découvrir les postes
                <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      <FinalCTA />
    </>
  );
}
