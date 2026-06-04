"use client";

import { motion } from "framer-motion";
import { Eyebrow, Reveal } from "@/components/ui";
import { Calendar, Building2, Users, ShieldCheck } from "lucide-react";

const STATS = [
  {
    icon: Calendar,
    label: "Année de fondation",
    value: "1994",
    caption: "Continuité de direction depuis l'origine",
  },
  {
    icon: Building2,
    label: "Champ d'intervention",
    value: "Tout le Luxembourg",
    caption: "& Grande Région sur projet",
  },
  {
    icon: Users,
    label: "Approche",
    value: "Équipe technique",
    caption: "Pluridisciplinaire en interne",
  },
  {
    icon: ShieldCheck,
    label: "Engagement",
    value: "Long terme",
    caption: "Entretien & dépannage sur durée",
  },
];

export function Stats() {
  return (
    <section className="relative py-14 lg:py-20 bg-cream">
      <div className="container">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 mb-10 lg:mb-14">
          <div>
            <Eyebrow number="01">La maison</Eyebrow>
            <Reveal>
              <h2 className="mt-5 font-display text-display-lg max-w-2xl text-balance text-ink">
                Une entreprise familiale ancrée dans le <em className="not-italic text-copper">temps long</em>.
              </h2>
            </Reveal>
          </div>
          <Reveal delay={1}>
            <p className="max-w-sm text-graphite">
              Notre identité repose sur la{" "}
              <strong className="text-copper font-semibold">continuité</strong> : la{" "}
              <strong className="text-copper font-semibold">même direction technique</strong>, le{" "}
              <strong className="text-copper font-semibold">même atelier</strong>, et une méthode
              d&apos;intervention{" "}
              <strong className="text-copper font-semibold">
                qui ne change pas selon la taille du chantier
              </strong>
              .
            </p>
          </Reveal>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-px bg-ink/8 border border-ink/8 rounded-2xl overflow-hidden">
          {STATS.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] }}
              className="bg-white p-6 lg:p-8"
            >
              <div className="h-10 w-10 rounded-full bg-copper/10 border border-copper/30 grid place-items-center">
                <s.icon className="h-4 w-4 text-copper" />
              </div>
              <div className="mt-6 font-mono text-[10px] uppercase tracking-eyebrow text-copper">
                0{i + 1}
              </div>
              <div className="mt-2 font-display text-3xl lg:text-4xl tracking-tightest text-copper">
                {s.value}
              </div>
              <div className="mt-4 text-ink font-medium">{s.label}</div>
              <div className="mt-1 text-sm text-muted">{s.caption}</div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
