"use client";

import Image from "next/image";
import { Reveal, Eyebrow, Button } from "@/components/ui";

export function RecruitmentTeaser() {
  return (
    <section className="relative py-14 lg:py-20 bg-linen border-y border-ink/8">
      <div className="container">
        <div className="grid lg:grid-cols-12 gap-10 items-center">
          <div className="lg:col-span-6 relative aspect-[4/5] lg:aspect-square rounded-3xl overflow-hidden bg-stone shadow-card">
            <Image
              src="https://images.pexels.com/photos/8961069/pexels-photo-8961069.jpeg?auto=compress&w=1600"
              alt="L'équipe Chauffage Artisanal à l'atelier"
              fill
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-charcoal/65 via-charcoal/15 to-transparent" />
            <div className="absolute bottom-8 left-8 right-8 flex items-end justify-between">
              <div>
                <div className="font-mono text-[10px] uppercase tracking-eyebrow text-cream/95 bg-charcoal/30 backdrop-blur-md px-3 py-1.5 rounded-full inline-flex">
                  Notre équipe
                </div>
                <div className="font-display text-4xl text-cream mt-3">
                  Pluridisciplinaire
                </div>
              </div>
              <div className="font-mono text-xs text-cream/80 hidden md:block">LUXEMBOURG</div>
            </div>
          </div>

          <div className="lg:col-span-6">
            <Eyebrow number="09">Recrutement</Eyebrow>
            <Reveal>
              <h2 className="mt-5 font-display text-display-lg text-balance text-ink">
                Nous recrutons des techniciens qui veulent{" "}
                <em className="not-italic text-copper">travailler proprement</em>.
              </h2>
            </Reveal>
            <Reveal delay={1}>
              <p className="mt-6 text-graphite text-lg">
                <strong className="text-copper font-semibold">Frigoriste</strong>,{" "}
                <strong className="text-copper font-semibold">chauffagiste</strong>,{" "}
                <strong className="text-copper font-semibold">plombier</strong>,{" "}
                <strong className="text-copper font-semibold">apprenti</strong>,{" "}
                <strong className="text-copper font-semibold">alternant</strong> : si vous aimez le{" "}
                <strong className="text-copper font-semibold">geste technique bien fait</strong>,
                l&apos;équipement neuf et les chantiers où l&apos;on{" "}
                <strong className="text-copper font-semibold">
                  prend le temps de réfléchir
                </strong>
                , parlons-nous.
              </p>
            </Reveal>
            <Reveal delay={2}>
              <ul className="mt-8 grid sm:grid-cols-2 gap-x-8 gap-y-3 text-sm text-graphite">
                {[
                  { label: "Rémunération", rest: "attractive négociée" },
                  { label: "Outillage", rest: "et équipements pros" },
                  { label: "Formation continue", rest: "encouragée" },
                  { label: "Véhicule", rest: "pour les techniciens" },
                  { label: "Couverture santé", rest: "selon poste" },
                  { label: "Équilibre de vie", rest: "respecté" },
                ].map((b) => (
                  <li key={b.label} className="flex gap-2 items-start">
                    <span className="mt-1.5 h-1 w-1 rounded-full bg-copper shrink-0" />
                    <span>
                      <strong className="text-copper font-semibold">{b.label}</strong>{" "}
                      {b.rest}
                    </span>
                  </li>
                ))}
              </ul>
            </Reveal>
            <Reveal delay={3}>
              <div className="mt-10 flex flex-wrap gap-3">
                <Button href="/recrutement" variant="primary">
                  Voir les postes ouverts
                </Button>
                <Button href="/a-propos" variant="ghost">
                  Découvrir la maison
                </Button>
              </div>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}
