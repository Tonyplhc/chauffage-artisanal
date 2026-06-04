"use client";

/**
 * Section FAQ accordéon + JSON-LD FAQPage (rich result Google).
 *
 * - L'UI utilise les `<details>` natifs pour rester accessible + clavier-friendly.
 * - Le JSON-LD est généré côté serveur (no-script) pour être lu par les
 *   robots indexeurs (rich snippets FAQPage).
 *
 * Discipline éditoriale : pas de question dont la réponse promet un délai, un
 * prix ou une garantie chiffrée — toutes les réponses sont qualitatives.
 */

import { useState } from "react";
import { Plus, Minus, MessageCircle } from "lucide-react";
import { Eyebrow, Reveal, SectionTitle } from "@/components/ui";

export type FaqItem = {
  q: string;
  a: string;
};

export function Faq({
  items,
  eyebrow = "Questions fréquentes",
  number,
  title,
  intro,
}: {
  items: FaqItem[];
  eyebrow?: string;
  number?: string;
  title?: string;
  intro?: string;
}) {
  return (
    <section className="py-14 lg:py-20 bg-cream">
      <div className="container">
        <div className="grid lg:grid-cols-12 gap-10 items-start">
          <div className="lg:col-span-5 lg:sticky lg:top-28">
            <Eyebrow number={number}>{eyebrow}</Eyebrow>
            <Reveal>
              <SectionTitle className="mt-4">
                {title ?? (
                  <>
                    Les questions <em className="not-italic text-copper">qu&apos;on nous pose</em>{" "}
                    le plus souvent.
                  </>
                )}
              </SectionTitle>
            </Reveal>
            <Reveal delay={1}>
              <p className="mt-5 text-graphite leading-relaxed">
                {intro ??
                  "Réponses synthétiques. Pour les questions qui dépendent de votre projet, le mieux reste d'en parler en visite technique."}
              </p>
            </Reveal>
            <a
              href="/contact"
              className="mt-6 inline-flex items-center gap-2 rounded-full bg-ink text-cream px-5 py-3 text-sm font-medium hover:bg-copper transition-colors"
            >
              <MessageCircle className="h-4 w-4" />
              Poser une autre question
            </a>
          </div>

          <div className="lg:col-span-7">
            <div className="grid gap-3">
              {items.map((item, i) => (
                <FaqRow key={item.q} item={item} index={i} />
              ))}
            </div>
          </div>
        </div>

        {/* JSON-LD FAQPage — pour rich snippets Google */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "FAQPage",
              mainEntity: items.map((it) => ({
                "@type": "Question",
                name: it.q,
                acceptedAnswer: { "@type": "Answer", text: it.a },
              })),
            }),
          }}
        />
      </div>
    </section>
  );
}

function FaqRow({ item, index }: { item: FaqItem; index: number }) {
  const [open, setOpen] = useState(false);
  return (
    <div
      className={`rounded-2xl border bg-white transition-all ${
        open ? "border-copper/40 shadow-soft" : "border-ink/10 hover:border-copper/30"
      }`}
    >
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full text-left px-5 lg:px-6 py-4 lg:py-5 flex items-start justify-between gap-4"
        aria-expanded={open}
      >
        <div className="flex items-start gap-4 min-w-0">
          <span className="font-mono text-[10px] uppercase tracking-eyebrow text-copper mt-1 shrink-0">
            0{index + 1}
          </span>
          <span className="text-base lg:text-lg font-medium text-ink">{item.q}</span>
        </div>
        <span
          className={`h-8 w-8 rounded-full grid place-items-center border shrink-0 transition-colors ${
            open
              ? "bg-copper border-copper text-cream"
              : "bg-cream border-ink/12 text-graphite"
          }`}
        >
          {open ? <Minus className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
        </span>
      </button>
      {open && (
        <div className="px-5 lg:px-6 pb-5 lg:pb-6 pl-[68px] lg:pl-[80px] text-sm lg:text-base text-graphite leading-relaxed">
          {item.a}
        </div>
      )}
    </div>
  );
}
