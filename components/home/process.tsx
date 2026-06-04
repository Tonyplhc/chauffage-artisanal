"use client";

import { motion } from "framer-motion";
import { Eyebrow, Reveal } from "@/components/ui";

const H = ({ children }: { children: React.ReactNode }) => (
  <strong className="text-copper font-semibold">{children}</strong>
);

type Step = {
  nr: string;
  title: string;
  body: React.ReactNode;
  duration: string;
};

const STEPS: Step[] = [
  {
    nr: "01",
    title: "Diagnostic & audit",
    body: (
      <>
        <H>Visite technique gratuite</H>. Mesures thermiques, relevés réseau, étude des
        contraintes du bâtiment. <H>Rapport remis sous 5 jours</H>.
      </>
    ),
    duration: "1 semaine",
  },
  {
    nr: "02",
    title: "Dimensionnement & devis",
    body: (
      <>
        Étude réalisée par notre <H>bureau interne</H>. Simulation énergétique,{" "}
        <H>calcul des primes CEE Luxembourg</H>, devis détaillé poste par poste.
      </>
    ),
    duration: "10 jours",
  },
  {
    nr: "03",
    title: "Installation propre",
    body: (
      <>
        <H>Équipe dédiée</H>, planning communiqué semaine par semaine,{" "}
        <H>photos quotidiennes</H>, protection des sols et nettoyage en fin de journée.
      </>
    ),
    duration: "2 à 6 semaines",
  },
  {
    nr: "04",
    title: "Mise en service & SAV",
    body: (
      <>
        Tests sous charge, formation à l&apos;usage, transmission du dossier complet.{" "}
        <H>Suivi 12 mois inclus</H> et contrat d&apos;entretien optionnel.
      </>
    ),
    duration: "Engagement 10 ans",
  },
];

export function Process() {
  return (
    <section className="relative py-14 lg:py-20 bg-linen border-y border-ink/8">
      <div className="container">
        <div className="max-w-3xl mb-10 lg:mb-14">
          <Eyebrow number="05">Le processus</Eyebrow>
          <Reveal>
            <h2 className="mt-5 font-display text-display-lg text-balance text-ink">
              Quatre étapes, <em className="not-italic text-copper">zéro improvisation</em>.
            </h2>
          </Reveal>
          <Reveal delay={1}>
            <p className="mt-6 text-graphite">
              Notre méthode est{" "}
              <strong className="text-copper font-semibold">la même</strong>{" "}
              qu&apos;il s&apos;agisse d&apos;une chaudière à{" "}
              <strong className="text-copper font-semibold">4 000 €</strong> ou
              d&apos;une chaufferie tertiaire à{" "}
              <strong className="text-copper font-semibold">400 000 €</strong>.
            </p>
          </Reveal>
        </div>

        <div className="grid lg:grid-cols-4 gap-px bg-ink/8 border border-ink/8 rounded-2xl overflow-hidden">
          {STEPS.map((step, i) => (
            <motion.div
              key={step.nr}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.7, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] }}
              className="relative bg-white p-6 lg:p-8 flex flex-col"
            >
              <div className="font-display text-5xl text-copper/70 tracking-tighter">
                {step.nr}
              </div>
              <h3 className="mt-6 font-display text-2xl text-ink tracking-tight">{step.title}</h3>
              <p className="mt-3 text-graphite leading-relaxed text-sm flex-1">{step.body}</p>
              <div className="mt-6 pt-6 border-t border-ink/10 font-mono text-[10px] uppercase tracking-eyebrow text-copper">
                {step.duration}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
