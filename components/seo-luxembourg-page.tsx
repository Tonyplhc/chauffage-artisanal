/**
 * <SeoLuxembourgPage> — gabarit unique pour les 9 pages SEO Luxembourg.
 *
 * Cible : requêtes Google volumineuses au LU (chauffage Luxembourg, pompe à
 * chaleur Luxembourg, etc.). Stratégie content-first :
 *   - hero ample avec H1 contenant le mot-clé exact
 *   - 4 USP en grid (preuves chiffrées + valeurs)
 *   - FAQ 4-6 questions (déclenche rich snippets FAQPage via JSON-LD)
 *   - maillage interne croisé entre pages SEO
 *   - CTA devis ancré bas de page
 *
 * Composant server-friendly côté arborescence : il ne dépend que du contenu
 * statique du fichier `lib/seo-luxembourg-content.ts`. Les sous-composants
 * client (Faq accordéon, animations) sont importés tels quels.
 */

import Link from "next/link";
import { ArrowUpRight, Check, MapPin, Phone } from "lucide-react";
import { Faq } from "@/components/faq";
import { Eyebrow, SectionTitle } from "@/components/ui";
import type { SeoPage } from "@/lib/seo-luxembourg-content";
import { buildAlternates } from "@/lib/seo-alternates";

export function SeoLuxembourgPage({ page }: { page: SeoPage }) {
  // JSON-LD LocalBusiness + Service — boost SEO local Luxembourg.
  // Le FAQ JSON-LD est déjà injecté par <Faq /> plus bas.
  const localBusinessLd = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: `Chauffage Artisanal — ${page.meta.h1Keyword}`,
    description: page.meta.description,
    url: `https://www.chauffage-artisanal.lu/${page.slug}`,
    areaServed: {
      "@type": "Country",
      name: "Luxembourg",
    },
    address: {
      "@type": "PostalAddress",
      addressCountry: "LU",
      addressLocality: "Luxembourg",
    },
    knowsAbout: page.usps.map((u) => u.title),
  };
  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Accueil", item: "https://www.chauffage-artisanal.lu" },
      {
        "@type": "ListItem",
        position: 2,
        name: page.hero.eyebrow,
        item: `https://www.chauffage-artisanal.lu/${page.slug}`,
      },
    ],
  };

  return (
    <>
      {/* JSON-LD pour SEO Luxembourg + breadcrumb */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessLd) }}
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
              "radial-gradient(circle at 20% 30%, rgba(184,106,54,0.35), transparent 55%), radial-gradient(circle at 80% 70%, rgba(184,106,54,0.18), transparent 55%)",
          }}
        />
        <div className="container relative">
          <div className="max-w-3xl">
            <Eyebrow number="LU">{page.hero.eyebrow}</Eyebrow>
            <h1 className="mt-4 font-display text-display-xl tracking-tightest text-balance text-ink">
              {page.hero.title}{" "}
              <em className="not-italic text-copper">{page.hero.titleHighlight}</em>
            </h1>
            <p className="mt-5 text-lg lg:text-xl text-graphite leading-relaxed text-balance">
              {page.hero.intro}
            </p>
            <div className="mt-7 flex flex-wrap items-center gap-3">
              <Link
                href="/devis"
                className="inline-flex items-center gap-2 rounded-full bg-ink text-cream px-6 py-3.5 text-sm font-medium hover:bg-copper transition-colors group"
              >
                Demander un devis
                <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </Link>
              <Link
                href="/contact"
                className="inline-flex items-center gap-2 rounded-full bg-white border border-ink/15 text-ink px-6 py-3.5 text-sm font-medium hover:border-copper/40 transition-colors"
              >
                <Phone className="h-4 w-4" />
                Nous appeler
              </Link>
              <span className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-eyebrow text-graphite">
                <MapPin className="h-3 w-3 text-copper" />
                Luxembourg-Ville · Grande Région
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* USPs */}
      <section className="py-16 lg:py-20 bg-linen border-b border-ink/8">
        <div className="container">
          <div className="max-w-3xl mb-10">
            <Eyebrow number="01">Pourquoi nous</Eyebrow>
            <SectionTitle className="mt-4">
              Ce qui distingue notre intervention{" "}
              <em className="not-italic text-copper">au Luxembourg</em>.
            </SectionTitle>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-px bg-ink/8 border border-ink/8 rounded-2xl overflow-hidden">
            {page.usps.map((u, i) => (
              <div key={u.title} className="bg-white p-6 lg:p-7 flex flex-col">
                <div className="font-mono text-[10px] uppercase tracking-eyebrow text-copper">
                  0{i + 1}
                </div>
                <h3 className="mt-3 font-display text-xl text-ink tracking-tight">
                  {u.title}
                </h3>
                <p className="mt-2 text-sm text-graphite leading-relaxed">{u.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA intermédiaire + maillage interne */}
      <section className="py-14 lg:py-20 bg-cream">
        <div className="container grid lg:grid-cols-12 gap-10 items-start">
          <div className="lg:col-span-7">
            <Eyebrow number="02">Aller plus loin</Eyebrow>
            <SectionTitle className="mt-4">
              Les sujets <em className="not-italic text-copper">liés</em> qu&apos;on traite aussi.
            </SectionTitle>
            <p className="mt-5 text-graphite leading-relaxed max-w-2xl">
              Un projet rarement isolé : remplacement de chauffage, mise à jour de l&apos;eau
              chaude, ventilation cohérente, dimensionnement Klimabonus. Voici les pages utiles
              en lien avec votre recherche.
            </p>
            <ul className="mt-7 grid sm:grid-cols-2 gap-3">
              {page.internalLinks.map((l) => (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    className="group flex items-center justify-between gap-3 p-4 rounded-2xl border border-ink/10 bg-white hover:border-copper/40 transition-colors"
                  >
                    <span className="flex items-center gap-3 min-w-0">
                      <span className="grid place-items-center h-7 w-7 rounded-full bg-copper/12 border border-copper/30 shrink-0">
                        <Check className="h-3.5 w-3.5 text-copper" />
                      </span>
                      <span className="text-sm text-ink font-medium truncate">{l.label}</span>
                    </span>
                    <ArrowUpRight className="h-4 w-4 text-graphite group-hover:text-copper transition-colors shrink-0" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <aside className="lg:col-span-5 lg:sticky lg:top-28">
            <div className="rounded-2xl border border-copper/30 bg-gradient-to-br from-cream to-white p-7 shadow-soft">
              <div className="font-mono text-[10px] uppercase tracking-eyebrow text-copper">
                Devis sous 24h
              </div>
              <h3 className="mt-3 font-display text-2xl text-ink tracking-tight">
                {page.ctaLine}
              </h3>
              <div className="mt-6 flex flex-col gap-3">
                <Link
                  href="/devis"
                  className="inline-flex items-center justify-between gap-2 rounded-full bg-ink text-cream px-5 py-3.5 text-sm font-medium hover:bg-copper transition-colors group"
                >
                  Lancer mon devis
                  <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </Link>
                <Link
                  href="/primes-aides#simulateur"
                  className="inline-flex items-center justify-between gap-2 rounded-full bg-cream border border-ink/15 text-ink px-5 py-3.5 text-sm font-medium hover:border-copper/40 transition-colors"
                >
                  Estimer mon Klimabonus
                  <ArrowUpRight className="h-4 w-4" />
                </Link>
              </div>
              <p className="mt-5 text-xs text-muted leading-relaxed">
                Réponse rapide · Étude personnalisée · Pas de pression commerciale.
              </p>
            </div>
          </aside>
        </div>
      </section>

      {/* FAQ — JSON-LD inclus dans le composant Faq */}
      <Faq
        items={page.faqs}
        number="03"
        eyebrow="FAQ Luxembourg"
        title={`Questions fréquentes sur ${page.meta.h1Keyword}.`}
        intro="Les réponses synthétiques aux questions qu'on nous pose le plus souvent — pour orienter votre projet avant la visite technique."
      />

      {/* CTA final */}
      <section className="py-16 lg:py-20 bg-charcoal text-cream">
        <div className="container text-center max-w-3xl mx-auto">
          <div className="font-mono text-[11px] uppercase tracking-eyebrow text-copper-200">
            Démarrer
          </div>
          <h2 className="mt-4 font-display text-display-lg tracking-tightest text-balance">
            On revient vers vous{" "}
            <em className="not-italic text-copper-200">dans la demi-journée</em>.
          </h2>
          <p className="mt-5 text-cream/75 text-lg leading-relaxed">
            Décrivez votre projet en 2 minutes — visite gratuite, devis détaillé sous 24h, pas
            d&apos;abonnement déguisé.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/devis"
              className="inline-flex items-center gap-2 rounded-full bg-cream text-charcoal px-7 py-4 text-sm font-medium hover:bg-copper hover:text-cream transition-colors group"
            >
              Demander un devis
              <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </Link>
            <Link
              href="/depannage-luxembourg"
              className="inline-flex items-center gap-2 rounded-full bg-ember/15 border border-ember/50 text-cream px-7 py-4 text-sm font-medium hover:bg-ember/25 transition-colors"
            >
              <Phone className="h-4 w-4" />
              Dépannage 24/7
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}

/**
 * Génère les metadata Next.js (title, description, canonical) à partir
 * du contenu de la page SEO. À utiliser dans le `export const metadata`
 * de chaque page wrapper.
 */
export function buildSeoMetadata(page: SeoPage) {
  const canonical = `/${page.slug}`;
  return {
    title: page.meta.title,
    description: page.meta.description,
    alternates: buildAlternates(canonical),
    openGraph: {
      title: page.meta.title,
      description: page.meta.description,
      url: canonical,
      type: "website" as const,
    },
    twitter: {
      card: "summary_large_image" as const,
      title: page.meta.title,
      description: page.meta.description,
    },
  };
}
