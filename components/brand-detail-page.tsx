/**
 * <BrandDetailPage> — gabarit unique pour les pages /marques/[slug].
 *
 * Logique : on capte les requêtes "Vaillant Luxembourg installateur",
 * "Viessmann Luxembourg", etc., en montrant qu'on maîtrise la gamme
 * constructeur (positioning, modèles phares, garanties, partenariat).
 *
 * Le CTA pousse vers /devis avec ?marque=slug — le configurateur peut
 * pré-sélectionner la marque souhaitée à l'étape correspondante.
 */

import Link from "next/link";
import { ArrowUpRight, ArrowLeft, Award, Check, MapPin } from "lucide-react";
import { Eyebrow, SectionTitle } from "@/components/ui";
import type { Brand } from "@/lib/brands-content";
import { CATEGORY_LABELS } from "@/lib/brands-content";
import { buildAlternates } from "@/lib/seo-alternates";

export function BrandDetailPage({ brand }: { brand: Brand }) {
  // JSON-LD Service (rich result) + BreadcrumbList (meilleur affichage SERP)
  const serviceLd = {
    "@context": "https://schema.org",
    "@type": "Service",
    name: `Installation et maintenance ${brand.name} au Luxembourg`,
    description: brand.meta.description,
    provider: {
      "@type": "LocalBusiness",
      name: "Chauffage Artisanal",
      address: {
        "@type": "PostalAddress",
        addressCountry: "LU",
        addressLocality: "Luxembourg",
      },
    },
    brand: {
      "@type": "Brand",
      name: brand.name,
      logo: undefined,
    },
    areaServed: { "@type": "Country", name: "Luxembourg" },
    serviceType: brand.categories.map((c) => CATEGORY_LABELS[c] ?? c).join(", "),
    url: `https://www.chauffage-artisanal.lu/marques/${brand.slug}`,
  };
  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Accueil",
        item: "https://www.chauffage-artisanal.lu",
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Marques",
        item: "https://www.chauffage-artisanal.lu/marques",
      },
      {
        "@type": "ListItem",
        position: 3,
        name: brand.name,
        item: `https://www.chauffage-artisanal.lu/marques/${brand.slug}`,
      },
    ],
  };

  return (
    <>
      {/* JSON-LD pour rich results Google */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }}
      />
      {/* Hero */}
      <section className="relative pt-12 lg:pt-16 pb-12 lg:pb-16 bg-cream border-b border-ink/8 overflow-hidden">
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 25% 35%, rgba(184,106,54,0.30), transparent 55%), radial-gradient(circle at 75% 75%, rgba(184,106,54,0.18), transparent 55%)",
          }}
        />
        <div className="container relative">
          <Link
            href="/marques"
            className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-eyebrow text-graphite hover:text-copper transition-colors mb-6"
          >
            <ArrowLeft className="h-3 w-3" />
            Toutes les marques
          </Link>

          <div className="grid lg:grid-cols-12 gap-10 items-start">
            <div className="lg:col-span-7">
              <Eyebrow number={brand.origin}>{brand.hero.eyebrow}</Eyebrow>
              <h1 className="mt-4 font-display text-display-xl tracking-tightest text-balance text-ink">
                {brand.hero.title}{" "}
                <em className="not-italic text-copper">{brand.hero.titleHighlight}</em>
              </h1>
              <p className="mt-5 text-lg lg:text-xl text-graphite leading-relaxed text-balance">
                {brand.hero.intro}
              </p>
              <div className="mt-7 flex flex-wrap items-center gap-3">
                <Link
                  href={`/devis?marque=${brand.slug}`}
                  className="inline-flex items-center gap-2 rounded-full bg-ink text-cream px-6 py-3.5 text-sm font-medium hover:bg-copper transition-colors group"
                >
                  Devis avec {brand.name}
                  <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </Link>
                <Link
                  href="/contact"
                  className="inline-flex items-center gap-2 rounded-full bg-white border border-ink/15 text-ink px-6 py-3.5 text-sm font-medium hover:border-copper/40 transition-colors"
                >
                  Parler à un expert
                </Link>
              </div>
            </div>

            {/* Sidebar fiche identité */}
            <aside className="lg:col-span-5">
              <div className="rounded-2xl border border-copper/30 bg-white p-6 lg:p-7 shadow-soft">
                <div className="flex items-center gap-3 mb-5">
                  <span className="grid place-items-center h-10 w-10 rounded-full bg-copper/12 border border-copper/30">
                    <Award className="h-5 w-5 text-copper" />
                  </span>
                  <div>
                    <div className="font-mono text-[10px] uppercase tracking-eyebrow text-copper">
                      Fiche marque
                    </div>
                    <div className="font-display text-xl text-ink">{brand.name}</div>
                  </div>
                </div>
                <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
                  <dt className="text-muted font-mono text-[10px] uppercase tracking-eyebrow">
                    Origine
                  </dt>
                  <dd className="text-ink font-medium">{brand.origin}</dd>
                  <dt className="text-muted font-mono text-[10px] uppercase tracking-eyebrow">
                    Fondée en
                  </dt>
                  <dd className="text-ink font-medium">{brand.since}</dd>
                  <dt className="text-muted font-mono text-[10px] uppercase tracking-eyebrow">
                    Domaines
                  </dt>
                  <dd className="text-ink font-medium">
                    {brand.categories.map((c) => CATEGORY_LABELS[c] ?? c).join(" · ")}
                  </dd>
                  <dt className="text-muted font-mono text-[10px] uppercase tracking-eyebrow">
                    Au LU
                  </dt>
                  <dd className="text-ink font-medium">
                    <span className="inline-flex items-center gap-1.5">
                      <MapPin className="h-3 w-3 text-copper" />
                      Installateur agréé
                    </span>
                  </dd>
                </dl>
                <div className="mt-5 pt-5 border-t border-ink/8 text-xs text-graphite leading-relaxed">
                  {brand.partnershipNote}
                </div>
              </div>
            </aside>
          </div>
        </div>
      </section>

      {/* Positioning */}
      <section className="py-14 lg:py-20 bg-linen border-b border-ink/8">
        <div className="container max-w-3xl">
          <Eyebrow number="01">Positionnement</Eyebrow>
          <SectionTitle className="mt-4">
            Pourquoi {brand.name} <em className="not-italic text-copper">a sa place</em> dans
            notre catalogue.
          </SectionTitle>
          <p className="mt-6 text-lg text-graphite leading-relaxed">{brand.positioning}</p>
        </div>
      </section>

      {/* Why us avec cette marque */}
      <section className="py-14 lg:py-20 bg-cream">
        <div className="container">
          <div className="max-w-3xl mb-10">
            <Eyebrow number="02">Notre valeur ajoutée</Eyebrow>
            <SectionTitle className="mt-4">
              Ce qu&apos;on apporte sur les installations{" "}
              <em className="not-italic text-copper">{brand.name}</em>.
            </SectionTitle>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-px bg-ink/8 border border-ink/8 rounded-2xl overflow-hidden">
            {brand.whyUs.map((w, i) => (
              <div key={w.title} className="bg-white p-6 lg:p-7">
                <div className="font-mono text-[10px] uppercase tracking-eyebrow text-copper">
                  0{i + 1}
                </div>
                <h3 className="mt-3 font-display text-xl text-ink tracking-tight">{w.title}</h3>
                <p className="mt-2 text-sm text-graphite leading-relaxed">{w.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Gammes phares */}
      <section className="py-14 lg:py-20 bg-linen border-y border-ink/8">
        <div className="container">
          <div className="max-w-3xl mb-10">
            <Eyebrow number="03">Catalogue</Eyebrow>
            <SectionTitle className="mt-4">
              Les gammes <em className="not-italic text-copper">phares</em> que nous installons.
            </SectionTitle>
            <p className="mt-5 text-graphite leading-relaxed">
              Sélection orientée disponibilité pièces, robustesse long terme et adéquation au
              marché luxembourgeois.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {brand.flagships.map((f) => (
              <div
                key={f.range}
                className="group p-6 rounded-2xl border border-ink/10 bg-white hover:border-copper/40 hover:shadow-lift transition-all"
              >
                <div className="flex items-start justify-between gap-3">
                  <h4 className="font-display text-xl text-ink tracking-tight">{f.range}</h4>
                  <span className="font-mono text-[10px] uppercase tracking-eyebrow text-copper bg-copper/10 border border-copper/30 px-2 py-1 rounded-full whitespace-nowrap">
                    {f.type}
                  </span>
                </div>
                <p className="mt-3 text-sm text-graphite leading-relaxed">{f.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Garantie + partenariat */}
      <section className="py-14 lg:py-20 bg-cream">
        <div className="container grid lg:grid-cols-2 gap-6">
          <div className="rounded-2xl border border-ink/10 bg-white p-7 lg:p-8">
            <div className="font-mono text-[10px] uppercase tracking-eyebrow text-copper">
              Garantie
            </div>
            <h3 className="mt-3 font-display text-2xl text-ink tracking-tight">
              Garanties constructeur {brand.name}
            </h3>
            <p className="mt-4 text-graphite leading-relaxed">{brand.warrantyNote}</p>
            <p className="mt-3 text-sm text-muted leading-relaxed">
              Les conditions exactes sont précisées au devis et au procès-verbal de mise en
              service. L&apos;entretien annuel est généralement obligatoire pour le maintien
              de la garantie.
            </p>
          </div>
          <div className="rounded-2xl border border-copper/30 bg-gradient-to-br from-cream to-white p-7 lg:p-8">
            <div className="font-mono text-[10px] uppercase tracking-eyebrow text-copper">
              Partenariat
            </div>
            <h3 className="mt-3 font-display text-2xl text-ink tracking-tight">
              Notre relation avec {brand.name}
            </h3>
            <p className="mt-4 text-graphite leading-relaxed">{brand.partnershipNote}</p>
            <ul className="mt-5 space-y-2 text-sm text-graphite">
              <li className="flex items-start gap-2">
                <Check className="h-4 w-4 text-copper mt-0.5 shrink-0" />
                Techniciens formés sur la gamme
              </li>
              <li className="flex items-start gap-2">
                <Check className="h-4 w-4 text-copper mt-0.5 shrink-0" />
                Accès au support technique constructeur
              </li>
              <li className="flex items-start gap-2">
                <Check className="h-4 w-4 text-copper mt-0.5 shrink-0" />
                Suivi des évolutions de gamme
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* CTA final */}
      <section className="py-16 lg:py-20 bg-charcoal text-cream">
        <div className="container text-center max-w-3xl mx-auto">
          <div className="font-mono text-[11px] uppercase tracking-eyebrow text-copper-200">
            Démarrer
          </div>
          <h2 className="mt-4 font-display text-display-lg tracking-tightest text-balance">
            Une installation {brand.name} <em className="not-italic text-copper-200">précise</em>,
            de bout en bout.
          </h2>
          <p className="mt-5 text-cream/75 text-lg leading-relaxed">
            Décrivez votre projet — nous étudions la gamme {brand.name} la plus adaptée et vous
            remettons un devis détaillé sous 24h.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href={`/devis?marque=${brand.slug}`}
              className="inline-flex items-center gap-2 rounded-full bg-cream text-charcoal px-7 py-4 text-sm font-medium hover:bg-copper hover:text-cream transition-colors group"
            >
              Devis avec {brand.name}
              <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </Link>
            <Link
              href="/marques"
              className="inline-flex items-center gap-2 rounded-full bg-ember/15 border border-ember/50 text-cream px-7 py-4 text-sm font-medium hover:bg-ember/25 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Toutes les marques
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}

export function buildBrandMetadata(brand: Brand) {
  const canonical = `/marques/${brand.slug}`;
  return {
    title: brand.meta.title,
    description: brand.meta.description,
    alternates: buildAlternates(canonical),
    openGraph: {
      title: brand.meta.title,
      description: brand.meta.description,
      url: canonical,
      type: "website" as const,
    },
  };
}
