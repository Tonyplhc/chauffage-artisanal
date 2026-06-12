"use client";

import { motion } from "framer-motion";
import { Eyebrow, Reveal } from "@/components/ui";

const H = ({ children }: { children: React.ReactNode }) => (
  <strong className="text-bleu font-semibold">{children}</strong>
);

type Milestone = { year: string; title: string; body: React.ReactNode };

const MILESTONES: Milestone[] = [
  {
    year: "1994",
    title: "Fondation",
    body: (
      <>
        Création de l&apos;atelier autour du métier de chauffagiste. La maison se construit sur un{" "}
        <H>savoir-faire artisanal</H> et une <H>exigence de qualité</H>.
      </>
    ),
  },
  {
    year: "Années 2000",
    title: "Transition vers la condensation",
    body: (
      <>
        L&apos;entreprise accompagne ses clients vers les{" "}
        <H>chaudières gaz à condensation</H> et structure son offre autour des{" "}
        <H>marques européennes de référence</H>.
      </>
    ),
  },
  {
    year: "Années 2010",
    title: "Pompes à chaleur",
    body: (
      <>
        Développement du métier des pompes à chaleur résidentielles. Investissement dans la{" "}
        <H>formation continue des techniciens</H>.
      </>
    ),
  },
  {
    year: "Récemment",
    title: "Tertiaire & climatisation",
    body: (
      <>
        Ouverture du <H>pôle climatisation pour les bâtiments tertiaires</H>, avec une démarche
        d&apos;efficacité énergétique étendue.
      </>
    ),
  },
  {
    year: "Aujourd'hui",
    title: "Transition énergétique",
    body: (
      <>
        Offre <H>hybride solaire et pompes à chaleur</H>, audits énergétiques, accompagnement des
        clients dans la réduction de leur consommation.
      </>
    ),
  },
  {
    year: "Demain",
    title: "Maison technique complète",
    body: (
      <>
        Une <H>équipe pluridisciplinaire</H>, un atelier, et une{" "}
        <H>méthode d&apos;intervention partagée</H> pour le chauffage, le sanitaire, la climatisation
        et les énergies renouvelables.
      </>
    ),
  },
];

export function Timeline() {
  return (
    <section className="relative py-14 lg:py-20 bg-creme">
      <div className="container">
        <div className="max-w-3xl">
          <Eyebrow number="03">Trois décennies</Eyebrow>
          <Reveal>
            <h2 className="mt-5 font-display text-display-lg text-balance text-anthra">
              De l&apos;atelier de <em className="not-italic text-bleu">1994</em> à la maison technique d&apos;aujourd&apos;hui.
            </h2>
          </Reveal>
          <Reveal delay={1}>
            <p className="mt-6 text-taupe">
              Une{" "}
              <strong className="text-bleu font-semibold">histoire continue</strong>,{" "}
              <strong className="text-bleu font-semibold">sans discontinuité de direction</strong>. Quelques étapes qui ont
              façonné notre savoir-faire.
            </p>
          </Reveal>
        </div>

        <div className="mt-10 lg:mt-14 relative">
          <div className="absolute left-[7px] md:left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-ink/15 to-transparent" />

          <div className="space-y-10 md:space-y-14">
            {MILESTONES.map((m, i) => (
              <motion.div
                key={m.year}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                className={`relative pl-8 md:pl-0 md:grid md:grid-cols-2 md:gap-16 ${
                  i % 2 === 0 ? "" : "md:[&>div:first-child]:order-2"
                }`}
              >
                <div className={`relative md:px-12 ${i % 2 === 0 ? "md:text-right" : ""}`}>
                  <div
                    className="absolute left-[-29px] md:left-auto md:right-[-7px] md:top-3 top-2 h-3.5 w-3.5 rounded-full bg-bleu ring-4 ring-creme z-10"
                    style={i % 2 === 0 ? {} : { right: "auto", left: "-7px" }}
                  />
                  <div className="font-mono text-xs uppercase tracking-eyebrow text-bleu">
                    {m.year}
                  </div>
                  <h3 className="mt-2 font-display text-3xl lg:text-4xl tracking-tight text-anthra">
                    {m.title}
                  </h3>
                  <p className="mt-3 text-taupe leading-relaxed max-w-md md:ml-auto">{m.body}</p>
                </div>
                <div className="hidden md:block" />
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
