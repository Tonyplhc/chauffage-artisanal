"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowUpRight, Phone, Star, ShieldCheck, Wrench } from "lucide-react";
import { ease } from "@/components/ui";
import { useI18n } from "@/components/i18n-provider";
import { useExperiment } from "@/components/experiment-provider";

export function Hero() {
  const { t } = useI18n();
  const exp = useExperiment("home_hero_cta");
  const devisCtaLabel =
    (exp.config.ctaText as string | undefined) ?? t.hero.devisCta;
  return (
    <section className="relative overflow-hidden bg-cream">
      <div className="container relative pt-12 lg:pt-16 pb-10 lg:pb-16">
        {/* Wordmark + intro */}
        <div className="grid lg:grid-cols-12 gap-10 lg:gap-12 items-end pb-10 lg:pb-14">
          <div className="lg:col-span-7">
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease }}
              className="flex items-center gap-3 font-mono text-[11px] uppercase tracking-eyebrow text-copper"
            >
              <span className="text-muted">{t.hero.eyebrowEst}</span>
              <span className="h-px w-10 bg-copper/50" />
              <span>{t.hero.eyebrowAtelier}</span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9, ease, delay: 0.05 }}
              className="mt-6 font-display text-display-2xl tracking-tightest text-ink text-balance max-w-[20ch]"
            >
              {t.hero.titlePart1}{" "}
              <em className="not-italic text-copper">{t.hero.titleHighlight}</em>{" "}
              {t.hero.titlePart2}
            </motion.h1>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease, delay: 0.2 }}
            className="lg:col-span-5 lg:pl-8 flex flex-col justify-between gap-10 lg:gap-12 h-full"
          >
            {/* Manifeste éditorial — visible toutes tailles */}
            <div>
              <div className="font-mono text-[10px] uppercase tracking-eyebrow text-copper">
                {t.hero.principleEyebrow}
              </div>
              <blockquote className="mt-3 lg:mt-4 font-display text-xl sm:text-2xl xl:text-3xl tracking-tight text-ink leading-snug text-balance">
                {t.hero.principleQuote}{" "}
                <em className="not-italic text-copper">{t.hero.titleHighlight === "neue Generation" ? "auf die Methode kommt es an" : t.hero.titleHighlight === "thermal comfort" ? "it's the method" : "c'est la méthode"}</em>.
              </blockquote>
              <div className="mt-4 lg:mt-5 pt-4 lg:pt-5 border-t border-ink/10 flex items-center justify-between gap-3">
                <div className="font-mono text-[10px] uppercase tracking-eyebrow text-muted truncate">
                  {t.hero.principleAttribution}
                </div>
                <Link
                  href="/savoir-faire"
                  className="group shrink-0 inline-flex items-center gap-1 text-xs font-mono uppercase tracking-eyebrow text-ink hover:text-copper transition-colors"
                >
                  {t.hero.methodLink}
                  <ArrowUpRight className="h-3 w-3 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </Link>
              </div>
            </div>

            <div>
              <p className="text-lg text-graphite text-balance max-w-md">
                <strong className="text-copper font-semibold">
                  {t.hero.eyebrowEst.replace(/Est\. |Seit /, "Depuis ")}
                </strong>{" "}
                {t.hero.introBody}
              </p>
              <div className="mt-7 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <Link
                  href="/devis"
                  className="group inline-flex items-center justify-center gap-2 rounded-full bg-ink text-cream px-6 py-3.5 text-sm font-medium hover:bg-copper transition-all duration-300 hover:-translate-y-0.5"
                >
                  {devisCtaLabel}
                  <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </Link>
                <Link
                  href="/depannage"
                  className="group inline-flex items-center justify-center gap-2 rounded-full bg-cream border border-ember/30 text-ink px-6 py-3.5 text-sm font-medium hover:border-ember hover:bg-ember/10 transition-all"
                >
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-ember opacity-75"></span>
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-ember"></span>
                  </span>
                  <Phone className="h-4 w-4" />
                  {t.hero.depannage}
                </Link>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Cinematic image */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease, delay: 0.3 }}
          className="relative aspect-[21/10] lg:aspect-[21/8] rounded-[28px] overflow-hidden bg-stone shadow-lift"
        >
          <Image
            src="https://images.pexels.com/photos/1571460/pexels-photo-1571460.jpeg?auto=compress&w=2400"
            alt="Intérieur résidentiel luxembourgeois — confort thermique premium"
            fill
            priority
            fetchPriority="high"
            sizes="(max-width: 768px) 100vw, (max-width: 1280px) 90vw, 1200px"
            quality={82}
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-charcoal/40 via-transparent to-transparent" />
          <div className="absolute bottom-6 left-6 right-6 lg:bottom-10 lg:left-10 lg:right-10 flex items-end justify-between">
            <div>
              <div className="font-mono text-[10px] uppercase tracking-eyebrow text-cream/90 bg-charcoal/40 backdrop-blur-md border border-cream/15 px-3 py-1.5 rounded-full inline-flex">
                Projet 2025 · Villa Strassen
              </div>
            </div>
            <div className="hidden md:block font-mono text-[10px] uppercase tracking-eyebrow text-cream/80">
              Pompe à chaleur géothermique
            </div>
          </div>
        </motion.div>
      </div>

      {/* Trust badges */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease, delay: 0.5 }}
        className="relative border-t border-ink/8 bg-linen/60"
      >
        <div className="container grid grid-cols-2 lg:grid-cols-4 divide-y lg:divide-y-0 lg:divide-x divide-ink/10">
          <Badge
            icon={<Star className="h-4 w-4 fill-copper text-copper" />}
            label="Avis clients"
            value="Recommandés"
            sub="Bouche-à-oreille local"
          />
          <Badge
            icon={<ShieldCheck className="h-4 w-4 text-copper" />}
            label="Engagement"
            value="Qualité durable"
            sub="Maintenance long terme"
          />
          <Badge
            icon={<Wrench className="h-4 w-4 text-copper" />}
            label="Expérience"
            value="Depuis 1994"
            sub="Continuité de direction"
          />
          <Badge
            icon={<span className="font-mono text-xs text-copper">LU</span>}
            label="Zone"
            value="Luxembourg"
            sub="& Grande Région"
          />
        </div>
      </motion.div>
    </section>
  );
}

function Badge({
  icon,
  label,
  value,
  sub,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub: string;
}) {
  return (
    <div className="px-4 lg:px-8 py-5 lg:py-6 flex items-center gap-4">
      <div className="grid place-items-center h-10 w-10 rounded-full bg-copper/12 border border-copper/30 shrink-0">
        {icon}
      </div>
      <div className="min-w-0">
        <div className="font-mono text-[10px] uppercase tracking-eyebrow text-muted">{label}</div>
        <div className="font-display text-xl text-ink leading-tight truncate">{value}</div>
        <div className="text-xs text-muted truncate">{sub}</div>
      </div>
    </div>
  );
}
