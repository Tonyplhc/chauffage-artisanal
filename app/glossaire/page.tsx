import Link from "next/link";
import { ArrowUpRight, BookOpen, ExternalLink } from "lucide-react";
import { Eyebrow, SectionTitle } from "@/components/ui";
import {
  buildGlossaryJsonLd,
  CATEGORY_LABELS,
  GLOSSARY,
  type Term,
} from "@/lib/glossary-content";
import { COMPANY } from "@/lib/company-info";
import { buildAlternates } from "@/lib/seo-alternates";

export const metadata = {
  title: "Glossaire HVAC Luxembourg — Termes techniques et réglementaires",
  description:
    "Glossaire des termes techniques et réglementaires du chauffage, climatisation et ventilation au Luxembourg : SCOP, COP, n50, F-Gas III, Klimabonus, SCRB…",
  alternates: buildAlternates("/glossaire"),
};

export default function GlossairePage() {
  // Grouper par catégorie pour navigation
  const byCategory: Record<string, Term[]> = {};
  for (const t of GLOSSARY) {
    byCategory[t.category] ??= [];
    byCategory[t.category].push(t);
  }
  const categories = Object.keys(byCategory) as (keyof typeof CATEGORY_LABELS)[];

  const jsonLd = buildGlossaryJsonLd(`${COMPANY.url}/glossaire`);

  return (
    <>
      {/* JSON-LD DefinedTermSet pour rich snippets Google */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Hero */}
      <section className="relative pt-12 lg:pt-16 pb-10 lg:pb-12 bg-creme border-b border-pierre overflow-hidden">
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 20% 30%, rgba(11,87,160,0.35), transparent 55%), radial-gradient(circle at 80% 70%, rgba(11,87,160,0.18), transparent 55%)",
          }}
        />
        <div className="container relative">
          <div className="max-w-3xl">
            <Eyebrow number="A→Z">Glossaire HVAC</Eyebrow>
            <h1 className="mt-4 font-display text-display-xl tracking-tightest text-balance text-anthra">
              Le vocabulaire du métier,{" "}
              <em className="not-italic text-bleu">défini précisément</em>.
            </h1>
            <p className="mt-5 text-lg lg:text-xl text-taupe leading-relaxed text-balance">
              {GLOSSARY.length} termes techniques et réglementaires du chauffage, de la
              climatisation et de la ventilation au Luxembourg — du COP de votre PAC au RGD
              applicable, en passant par le n50 du Blower Door.
            </p>
          </div>
        </div>
      </section>

      {/* Navigation catégories */}
      <section className="py-8 bg-creme border-b border-pierre sticky top-16 md:top-20 z-20 backdrop-blur-md">
        <div className="container">
          <div className="flex items-center gap-2 flex-wrap">
            <BookOpen className="h-4 w-4 text-bleu" />
            <span className="font-mono text-[10px] uppercase tracking-eyebrow text-taupe mr-2">
              Catégories :
            </span>
            {categories.map((c) => (
              <a
                key={c}
                href={`#cat-${c}`}
                className="text-xs px-3 py-1.5 rounded-full bg-white border border-pierre text-taupe hover:border-bleu hover:text-bleu transition-colors"
              >
                {CATEGORY_LABELS[c]} ({byCategory[c].length})
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* Termes par catégorie */}
      <section className="py-12 lg:py-16 bg-creme">
        <div className="container">
          {categories.map((c) => (
            <div key={c} id={`cat-${c}`} className="mb-12 scroll-mt-32">
              <div className="mb-6">
                <Eyebrow>{CATEGORY_LABELS[c]}</Eyebrow>
                <SectionTitle className="mt-2">
                  {CATEGORY_LABELS[c]} —{" "}
                  <span className="text-muted text-base font-normal">
                    {byCategory[c].length} termes
                  </span>
                </SectionTitle>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                {byCategory[c].map((t) => (
                  <article
                    key={t.slug}
                    id={t.slug}
                    className="p-5 lg:p-6 rounded-2xl border border-pierre bg-white hover:border-bleu/40 transition-colors scroll-mt-32"
                  >
                    <h3 className="font-display text-xl text-anthra tracking-tight">
                      {t.term}
                    </h3>
                    {t.alternateNames && t.alternateNames.length > 0 && (
                      <div className="mt-1 text-xs text-muted italic">
                        Aussi appelé : {t.alternateNames.join(", ")}
                      </div>
                    )}
                    <p className="mt-3 text-sm text-taupe leading-relaxed">
                      {t.definition}
                    </p>
                    {t.context && (
                      <div className="mt-3 p-3 rounded-xl bg-creme border border-pierre">
                        <div className="font-mono text-[10px] uppercase tracking-eyebrow text-bleu mb-1">
                          Contexte
                        </div>
                        <p className="text-xs text-taupe leading-relaxed">{t.context}</p>
                      </div>
                    )}
                    {t.source && (
                      <a
                        href={t.source.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-3 text-xs text-taupe hover:text-bleu inline-flex items-center gap-1.5"
                      >
                        <span className="underline decoration-taupe/30">
                          {t.source.label}
                        </span>
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </article>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="py-14 bg-navy text-creme">
        <div className="container text-center max-w-3xl mx-auto">
          <h2 className="font-display text-2xl lg:text-3xl tracking-tight">
            Une question technique{" "}
            <em className="not-italic text-sable">non traitée ici</em> ?
          </h2>
          <p className="mt-3 text-creme/75 leading-relaxed">
            On répond directement au téléphone ou par email — pas de chatbot, pas de
            répondeur impersonnel.
          </p>
          <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 rounded-full bg-creme text-navy px-6 py-3 text-sm font-medium hover:bg-bleu hover:text-creme transition-colors group"
            >
              Nous contacter
              <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </Link>
            <Link
              href="/devis"
              className="inline-flex items-center gap-2 rounded-full bg-terracotta/15 border border-terracotta/40 text-creme px-6 py-3 text-sm font-medium hover:bg-terracotta/25 transition-colors"
            >
              Demander un devis
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
