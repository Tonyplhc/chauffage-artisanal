"use client";

import { motion } from "framer-motion";
import { Quote, Info } from "lucide-react";
import { Eyebrow, Reveal } from "@/components/ui";

const TESTIMONIALS = [
  {
    quote:
      "Le type de retour que nous cherchons à obtenir d'un gestionnaire immobilier : un chantier mené sans interruption pour les locataires, et un dossier transmis proprement.",
    role: "Profil — Gestionnaire de patrimoine",
    place: "Cas typique · résidentiel collectif",
  },
  {
    quote:
      "Le type d'attente d'un architecte d'intérieur : un devis clair, un bureau d'études qui explique chaque poste, et une équipe technique qui respecte la finition.",
    role: "Profil — Architecte d'intérieur",
    place: "Cas typique · rénovation résidentielle",
  },
  {
    quote:
      "Pour un responsable immobilier tertiaire, ce qui compte est la fiabilité dans la durée : un contrat d'entretien tenu, et une astreinte qui répond.",
    role: "Profil — Direction immobilière tertiaire",
    place: "Cas typique · bureaux & commerces",
  },
];

export function Testimonials() {
  return (
    <section className="relative py-14 lg:py-20 bg-linen border-y border-ink/8">
      <div className="container relative">
        <div className="max-w-3xl mb-6">
          <Eyebrow number="07">Profils clients que nous servons</Eyebrow>
          <Reveal>
            <h2 className="mt-5 font-display text-display-lg text-balance text-ink">
              Quelques <em className="not-italic text-copper">attentes typiques</em> de nos interlocuteurs.
            </h2>
          </Reveal>
        </div>

        <div className="mb-8 lg:mb-10 inline-flex items-center gap-2 text-xs text-muted font-mono uppercase tracking-eyebrow">
          <Info className="h-3 w-3 text-copper" />
          Formulations illustratives · témoignages clients à publier après accord écrit
        </div>

        <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
          {TESTIMONIALS.map((t, i) => (
            <motion.figure
              key={t.role}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.7, delay: i * 0.12, ease: [0.22, 1, 0.36, 1] }}
              className="relative rounded-3xl border border-ink/10 bg-white p-8 lg:p-10 flex flex-col shadow-soft"
            >
              <Quote className="h-6 w-6 text-copper mb-6" />
              <blockquote className="font-display text-xl lg:text-2xl text-ink leading-snug text-balance flex-1">
                &ldquo;{t.quote}&rdquo;
              </blockquote>
              <figcaption className="mt-8 pt-6 border-t border-ink/10">
                <div className="font-medium text-ink">{t.role}</div>
                <div className="mt-1 text-xs text-muted font-mono uppercase tracking-eyebrow">
                  {t.place}
                </div>
              </figcaption>
            </motion.figure>
          ))}
        </div>
      </div>
    </section>
  );
}
