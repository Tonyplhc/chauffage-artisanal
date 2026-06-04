"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { Check, ArrowUpRight } from "lucide-react";
import { Eyebrow, PageHeader, Reveal, SectionTitle } from "@/components/ui";
import { Faq, type FaqItem } from "@/components/faq";
import { SystemComparator, type Scenario } from "@/components/system-comparator";
import { FinalCTA } from "@/components/home/cta";
import { buildServiceJsonLd, type ServiceCategory } from "@/lib/service-schema";

export type ServiceBlock = {
  number: string;
  eyebrow: string;
  title: React.ReactNode;
  intro: React.ReactNode;
  heroImg: string;
  features: { title: string; body: string }[];
  benefits: string[];
  metrics?: { value: string; label: string }[];
  catalog?: { name: string; tag: string; body: string }[];
  aside?: React.ReactNode;
  faq?: FaqItem[];
  comparators?: Scenario[];
  extraBlocks?: React.ReactNode;
  /**
   * Catégorie de service pour le markup Schema.org Service.
   * Si fourni, injecte le JSON-LD correspondant pour les rich results.
   */
  serviceCategory?: ServiceCategory;
  /** URL canonique pour le markup Service (ex: /chauffage). */
  serviceUrlPath?: string;
};

export function ServicePage(props: ServiceBlock) {
  return (
    <>
      {/* JSON-LD Service — rich result Google par catégorie de prestation */}
      {props.serviceCategory && props.serviceUrlPath && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(
              buildServiceJsonLd(props.serviceCategory, props.serviceUrlPath),
            ),
          }}
        />
      )}
      <PageHeader
        number={props.number}
        eyebrow={props.eyebrow}
        title={props.title}
        intro={props.intro}
        aside={props.aside}
      />

      {/* Hero image */}
      <section className="relative -mt-8">
        <div className="container">
          <div className="relative aspect-[21/9] rounded-3xl overflow-hidden border border-ink/8 bg-stone shadow-card">
            <Image
              src={props.heroImg}
              alt=""
              fill
              priority
              fetchPriority="high"
              sizes="(max-width: 768px) 100vw, (max-width: 1280px) 90vw, 1200px"
              quality={82}
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-charcoal/30 to-transparent" />
          </div>
        </div>
      </section>

      {/* Metrics strip */}
      {props.metrics && (
        <section className="py-10 lg:py-12 bg-cream">
          <div className="container grid grid-cols-2 md:grid-cols-4 gap-px bg-ink/8 border border-ink/8 rounded-2xl overflow-hidden">
            {props.metrics.map((m, i) => (
              <motion.div
                key={m.label}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: i * 0.08 }}
                className="bg-white p-6 lg:p-7"
              >
                <div className="font-display text-4xl text-copper">{m.value}</div>
                <div className="mt-2 text-sm text-muted">{m.label}</div>
              </motion.div>
            ))}
          </div>
        </section>
      )}

      {/* Features */}
      <section className="py-16 lg:py-20 bg-linen border-y border-ink/8">
        <div className="container">
          <div className="max-w-3xl mb-10">
            <Eyebrow number="01">Notre approche</Eyebrow>
            <Reveal>
              <SectionTitle className="mt-4">La technique, mais surtout la méthode.</SectionTitle>
            </Reveal>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-px bg-ink/8 border border-ink/8 rounded-2xl overflow-hidden">
            {props.features.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.6, delay: (i % 3) * 0.1 }}
                className="bg-white p-6 lg:p-7"
              >
                <div className="font-mono text-[10px] uppercase tracking-eyebrow text-copper">
                  0{i + 1}
                </div>
                <h3 className="mt-3 font-display text-2xl text-ink tracking-tight">{f.title}</h3>
                <p className="mt-2 text-graphite leading-relaxed text-sm">{f.body}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-14 lg:py-20 bg-cream">
        <div className="container grid lg:grid-cols-12 gap-10 items-start">
          <div className="lg:col-span-5 lg:sticky lg:top-28">
            <Eyebrow number="02">Bénéfices</Eyebrow>
            <Reveal>
              <SectionTitle className="mt-4">Ce que vous obtenez, mesurable.</SectionTitle>
            </Reveal>
            <p className="mt-5 text-graphite leading-relaxed">
              Pas d&apos;effet d&apos;annonce — uniquement ce que l&apos;installation vous
              apporte concrètement, dans la durée. Chaque point est repris dans le devis
              et tracé jusqu&apos;à la mise en service.
            </p>
            <a
              href="/devis"
              className="mt-7 inline-flex items-center gap-2 rounded-full bg-ink text-cream px-5 py-3 text-sm font-medium hover:bg-copper transition-colors"
            >
              Demander un devis
              <ArrowUpRight className="h-4 w-4" />
            </a>
          </div>
          <div className="lg:col-span-7">
            <ul className="grid gap-3">
              {props.benefits.map((b, i) => (
                <motion.li
                  key={b}
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: i * 0.05 }}
                  className="flex items-start gap-4 p-5 rounded-2xl border border-ink/8 bg-white hover:border-copper/40 transition-colors shadow-soft"
                >
                  <span className="mt-0.5 grid place-items-center h-7 w-7 rounded-full bg-copper/15 border border-copper/40 shrink-0">
                    <Check className="h-3.5 w-3.5 text-copper" />
                  </span>
                  <span className="text-graphite">{b}</span>
                </motion.li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Catalogue */}
      {props.catalog && (
        <section className="py-16 lg:py-20 bg-linen border-y border-ink/8">
          <div className="container">
            <div className="max-w-3xl mb-10">
              <Eyebrow number="03">Catalogue</Eyebrow>
              <Reveal>
                <SectionTitle className="mt-4">Les équipements que nous installons.</SectionTitle>
              </Reveal>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {props.catalog.map((c, i) => (
                <motion.div
                  key={c.name}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{ duration: 0.6, delay: (i % 3) * 0.08 }}
                  className="group p-6 rounded-2xl border border-ink/10 bg-white hover:border-copper/40 hover:shadow-lift transition-all"
                >
                  <div className="flex items-start justify-between gap-3">
                    <h4 className="font-display text-xl text-ink">{c.name}</h4>
                    <span className="font-mono text-[10px] uppercase tracking-eyebrow text-copper bg-copper/10 border border-copper/30 px-2 py-1 rounded-full">
                      {c.tag}
                    </span>
                  </div>
                  <p className="mt-3 text-sm text-graphite leading-relaxed">{c.body}</p>
                  <div className="mt-5 inline-flex items-center gap-2 text-xs font-mono uppercase tracking-eyebrow text-graphite group-hover:text-copper transition-colors">
                    Fiche technique
                    <ArrowUpRight className="h-3 w-3" />
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {props.comparators && props.comparators.length > 0 && (
        <SystemComparator
          scenarios={props.comparators}
          number="04"
          eyebrow="Avant / après"
        />
      )}

      {props.extraBlocks}

      {props.faq && props.faq.length > 0 && (
        <Faq
          items={props.faq}
          number={props.comparators && props.comparators.length > 0 ? "05" : "04"}
          eyebrow="Questions fréquentes"
        />
      )}

      <FinalCTA />
    </>
  );
}
