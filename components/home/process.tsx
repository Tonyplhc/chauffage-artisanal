"use client";

import { motion } from "framer-motion";
import { Eyebrow, Reveal } from "@/components/ui";

type Step = {
  nr: string;
  title: string;
  body: string;
  /** Dernière étape mise en avant (carte navy). */
  highlight?: boolean;
};

const STEPS: Step[] = [
  { nr: "01", title: "Étude", body: "Visite technique et analyse de vos besoins, sur place." },
  { nr: "02", title: "Devis", body: "Proposition chiffrée détaillée, remise sous 24 h." },
  { nr: "03", title: "Aides", body: "Montage du volet technique du dossier Klimabonus et primes." },
  { nr: "04", title: "Installation", body: "Pose par nos techniciens, dans les délais annoncés." },
  {
    nr: "05",
    title: "Mise en service",
    body: "Réglages, explications d'usage et garantie installation.",
    highlight: true,
  },
];

export function Process() {
  return (
    <section className="relative py-14 lg:py-20 bg-creme border-y border-pierre font-ui">
      <div className="container">
        <div className="max-w-3xl mb-10 lg:mb-14">
          <Eyebrow number="04">Déroulement</Eyebrow>
          <Reveal>
            <h2 className="mt-5 font-display text-display-lg text-balance text-anthra">
              Comment se déroule <em className="not-italic text-bleu">votre projet</em> ?
            </h2>
          </Reveal>
          <Reveal delay={1}>
            <p className="mt-6 text-taupe">
              Un parcours clair, du premier contact à la mise en service —{" "}
              <strong className="text-bleu font-semibold">sans mauvaise surprise</strong>.
            </p>
          </Reveal>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {STEPS.map((step, i) => (
            <motion.div
              key={step.nr}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.7, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] }}
              className={
                step.highlight
                  ? "relative p-6 rounded-2xl bg-navy text-creme border border-navy"
                  : "relative p-6 rounded-2xl bg-sable border border-pierre"
              }
            >
              <div
                className={
                  step.highlight
                    ? "font-display text-4xl tracking-tighter text-bleuvif/70"
                    : "font-display text-4xl tracking-tighter text-bleu/30"
                }
              >
                {step.nr}
              </div>
              <h3
                className={
                  step.highlight
                    ? "mt-3 font-display text-xl tracking-tight"
                    : "mt-3 font-display text-xl tracking-tight text-anthra"
                }
              >
                {step.title}
              </h3>
              <p
                className={
                  step.highlight
                    ? "mt-2 text-sm text-creme/70 leading-relaxed"
                    : "mt-2 text-sm text-taupe leading-relaxed"
                }
              >
                {step.body}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
