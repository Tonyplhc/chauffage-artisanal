"use client";

import { Eyebrow, Reveal } from "@/components/ui";

const PARTNERS = [
  "Viessmann",
  "Daikin",
  "Buderus",
  "Vaillant",
  "Mitsubishi Electric",
  "Atlantic",
  "Bosch",
  "Stiebel Eltron",
  "Hoval",
  "De Dietrich",
];

export function Partners() {
  return (
    <section className="py-12 lg:py-16 bg-creme overflow-hidden">
      <div className="container mb-8">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
          <div>
            <Eyebrow number="06">Partenaires constructeurs</Eyebrow>
            <Reveal>
              <h2 className="mt-5 font-display text-3xl lg:text-4xl tracking-tight max-w-2xl text-balance text-anthra">
                Certifiés par les <em className="not-italic text-bleu">meilleurs constructeurs européens</em>.
              </h2>
            </Reveal>
          </div>
          <Reveal delay={1}>
            <p className="text-taupe text-sm max-w-xs">
              <strong className="text-bleu font-semibold">Stock pièces détachées toutes marques</strong> ·{" "}
              <strong className="text-bleu font-semibold">Techniciens formés en usine</strong>
            </p>
          </Reveal>
        </div>
      </div>

      <div className="relative">
        <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-creme to-transparent z-10" />
        <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-creme to-transparent z-10" />

        <div className="overflow-hidden">
          <div className="marquee flex gap-12 lg:gap-20 whitespace-nowrap items-center">
            {[...PARTNERS, ...PARTNERS].map((p, i) => (
              <div
                key={`${p}-${i}`}
                className="font-display text-3xl lg:text-5xl tracking-tighter text-anthra/25 hover:text-anthra transition-colors duration-500"
              >
                {p}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
