"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ShieldCheck, Thermometer, Wallet, ArrowUpRight } from "lucide-react";
import { Eyebrow, Reveal } from "@/components/ui";

/**
 * Traitement des 3 objections du particulier (Règle N°1 : on vend ARGENT +
 * SÉCURITÉ ; Règle N°7 : réduction du risque avant l'action). Pas de faux
 * témoignages — des engagements vérifiables, formulés sur les vraies questions.
 * Témoignages clients réels à publier ici après accord écrit.
 */

const OBJECTIONS = [
  {
    icon: Wallet,
    question: "« Vais-je vraiment toucher les aides ? »",
    reponse:
      "Oui, si le dossier est fait dans le bon ordre. Nous demandons l'accord de principe AVANT la signature du devis — aucune aide n'est rétroactive. Le dossier est monté à votre nom, et nous ne prenons aucune commission sur vos primes.",
    engagement: "Accord de principe avant devis · 0 commission sur prime",
  },
  {
    icon: Thermometer,
    question: "« Une pompe à chaleur suffira-t-elle en plein hiver ? »",
    reponse:
      "Une PAC bien dimensionnée, oui. Nous calculons la puissance sur vos besoins réels — pas au forfait — et installons du matériel Viessmann, Buderus ou De Dietrich. Et c'est la même maison qui dépanne depuis 1994.",
    engagement: "Dimensionnement calculé · partenaires agréés · SAV maison",
  },
  {
    icon: ShieldCheck,
    question: "« Combien ça va vraiment me coûter ? »",
    reponse:
      "Vous le voyez avant même de nous parler : budget, aides déduites et reste à charge sont affichés dans l'estimation en ligne. Le chiffrage ferme vient ensuite, après une visite technique gratuite et sans engagement.",
    engagement: "Chiffres affichés avant tout contact · visite gratuite",
    cta: { label: "Voir mon chiffre en 60 s", href: "/estimation" },
  },
];

export function Testimonials() {
  return (
    <section className="relative py-14 lg:py-20 bg-linen border-y border-ink/8 font-ui">
      <div className="container relative">
        <div className="max-w-3xl mb-10">
          <Eyebrow number="07">Avant de vous lancer</Eyebrow>
          <Reveal>
            <h2 className="mt-5 font-display text-display-lg text-balance text-ink">
              Les trois questions que <em className="not-italic text-copper">tout le monde</em> se pose.
            </h2>
          </Reveal>
        </div>

        <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
          {OBJECTIONS.map((o, i) => (
            <motion.article
              key={o.question}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.7, delay: i * 0.12, ease: [0.22, 1, 0.36, 1] }}
              className="relative rounded-3xl border border-ink/10 bg-white p-8 lg:p-9 flex flex-col shadow-soft"
            >
              <span className="grid place-items-center h-10 w-10 rounded-full bg-voile mb-6">
                <o.icon className="h-5 w-5 text-bleu" />
              </span>
              <h3 className="font-display text-xl lg:text-2xl text-ink leading-snug text-balance">
                {o.question}
              </h3>
              <p className="mt-4 text-sm text-graphite leading-relaxed flex-1">{o.reponse}</p>
              <div className="mt-6 pt-5 border-t border-ink/10">
                <div className="text-[11px] font-mono uppercase tracking-eyebrow text-taupe">
                  {o.engagement}
                </div>
                {o.cta && (
                  <Link
                    href={o.cta.href}
                    className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-bleu hover:text-navy transition-colors"
                  >
                    {o.cta.label}
                    <ArrowUpRight className="h-4 w-4" />
                  </Link>
                )}
              </div>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}
