import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ArrowUpRight, Award, Check, MapPin } from "lucide-react";
import { Eyebrow, SectionTitle } from "@/components/ui";
import { CATEGORY_LABELS, type Brand } from "@/lib/brands-content";
import {
  buildVerdict,
  generateAllPairs,
  getPair,
} from "@/lib/brand-comparator";
import { buildAlternates } from "@/lib/seo-alternates";

export const dynamic = "force-static";
export const dynamicParams = false;

export function generateStaticParams() {
  return generateAllPairs().map((p) => ({ slug: p.slug }));
}

export function generateMetadata({ params }: { params: { slug: string } }) {
  const pair = getPair(params.slug);
  if (!pair) return { title: "Comparaison introuvable" };
  return {
    title: `${pair.a.name} vs ${pair.b.name} au Luxembourg — Comparaison installateur`,
    description: `Comparatif ${pair.a.name} (${pair.a.origin}, ${pair.a.since}) et ${pair.b.name} (${pair.b.origin}, ${pair.b.since}) : positionnement, gammes phares, garanties, quand choisir l'un ou l'autre.`,
    alternates: buildAlternates(`/marques/comparer/${pair.slug}`),
    openGraph: {
      title: `${pair.a.name} vs ${pair.b.name} Luxembourg`,
      description: `Comparatif installateur des marques ${pair.a.name} et ${pair.b.name} au Luxembourg.`,
      type: "website",
    },
  };
}

export default function CompareBrandsPage({
  params,
}: {
  params: { slug: string };
}) {
  const pair = getPair(params.slug);
  if (!pair) notFound();

  const { a, b } = pair;
  const verdict = buildVerdict(a, b);

  // JSON-LD : BreadcrumbList pour rich result Google
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
        name: "Comparer",
        item: "https://www.chauffage-artisanal.lu/marques",
      },
      {
        "@type": "ListItem",
        position: 4,
        name: `${a.name} vs ${b.name}`,
        item: `https://www.chauffage-artisanal.lu/marques/comparer/${pair.slug}`,
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }}
      />

      {/* Hero */}
      <section className="relative pt-12 lg:pt-16 pb-10 lg:pb-12 bg-cream border-b border-ink/8 overflow-hidden">
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 20% 30%, rgba(184,106,54,0.35), transparent 55%), radial-gradient(circle at 80% 70%, rgba(184,106,54,0.18), transparent 55%)",
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

          <div className="max-w-3xl">
            <Eyebrow number="VS">Comparaison · Luxembourg</Eyebrow>
            <h1 className="mt-4 font-display text-display-xl tracking-tightest text-balance text-ink">
              {a.name} <em className="not-italic text-copper">vs</em> {b.name}
            </h1>
            <p className="mt-5 text-lg lg:text-xl text-graphite leading-relaxed text-balance">
              Comparatif honnête entre {a.name} ({a.origin}, depuis {a.since}) et {b.name}{" "}
              ({b.origin}, depuis {b.since}) — positionnement, gammes, points forts. Nous
              installons et entretenons les deux marques au Luxembourg.
            </p>
            <div className="mt-7 flex flex-wrap items-center gap-3">
              <Link
                href="/devis"
                className="inline-flex items-center gap-2 rounded-full bg-ink text-cream px-6 py-3.5 text-sm font-medium hover:bg-copper transition-colors group"
              >
                Nous demander conseil
                <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </Link>
              <span className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-eyebrow text-graphite">
                <MapPin className="h-3 w-3 text-copper" />
                Installateur agréé pour les deux marques
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Side-by-side identité */}
      <section className="py-14 lg:py-20 bg-linen border-b border-ink/8">
        <div className="container">
          <div className="max-w-3xl mb-10">
            <Eyebrow number="01">Identités</Eyebrow>
            <SectionTitle className="mt-4">
              Deux fabricants <em className="not-italic text-copper">aux ADN distincts</em>.
            </SectionTitle>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <BrandColumn brand={a} />
            <BrandColumn brand={b} />
          </div>
        </div>
      </section>

      {/* Verdict — quand choisir quoi */}
      <section className="py-14 lg:py-20 bg-cream">
        <div className="container">
          <div className="max-w-3xl mb-10">
            <Eyebrow number="02">Notre avis</Eyebrow>
            <SectionTitle className="mt-4">
              Quand choisir <em className="not-italic text-copper">l&apos;un ou l&apos;autre</em>.
            </SectionTitle>
            <p className="mt-5 text-graphite leading-relaxed">
              Pas de classement absolu — chacune a son contexte. Voici nos
              recommandations d&apos;orientation.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <VerdictCard
              brand={a}
              title={`Quand choisir ${a.name}`}
              body={verdict.whenChooseA}
            />
            <VerdictCard
              brand={b}
              title={`Quand choisir ${b.name}`}
              body={verdict.whenChooseB}
            />
          </div>

          <div className="mt-8 rounded-2xl border border-ink/10 bg-white p-6 lg:p-7">
            <div className="font-mono text-[10px] uppercase tracking-eyebrow text-copper mb-2">
              Point commun
            </div>
            <p className="text-graphite leading-relaxed">{verdict.commonGround}</p>
          </div>
        </div>
      </section>

      {/* Gammes phares côte-à-côte */}
      <section className="py-14 lg:py-20 bg-linen border-y border-ink/8">
        <div className="container">
          <div className="max-w-3xl mb-10">
            <Eyebrow number="03">Catalogue comparé</Eyebrow>
            <SectionTitle className="mt-4">
              Les <em className="not-italic text-copper">gammes phares</em> côte à côte.
            </SectionTitle>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            <FlagshipsList brand={a} />
            <FlagshipsList brand={b} />
          </div>
        </div>
      </section>

      {/* CTA final */}
      <section className="py-16 lg:py-20 bg-charcoal text-cream">
        <div className="container text-center max-w-3xl mx-auto">
          <div className="font-mono text-[11px] uppercase tracking-eyebrow text-copper-200">
            On vous aide à trancher
          </div>
          <h2 className="mt-4 font-display text-display-lg tracking-tightest text-balance">
            {a.name} ou {b.name} ?{" "}
            <em className="not-italic text-copper-200">Décidons ensemble.</em>
          </h2>
          <p className="mt-5 text-cream/75 text-lg leading-relaxed">
            La meilleure marque pour vous dépend de votre projet réel (puissance, isolation,
            budget, contraintes). Décrivez-le, nous proposons une recommandation argumentée.
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
              href={`/marques/${a.slug}`}
              className="inline-flex items-center gap-2 rounded-full bg-ember/15 border border-ember/40 text-cream px-7 py-4 text-sm font-medium hover:bg-ember/25 transition-colors"
            >
              Fiche {a.name}
            </Link>
            <Link
              href={`/marques/${b.slug}`}
              className="inline-flex items-center gap-2 rounded-full bg-ember/15 border border-ember/40 text-cream px-7 py-4 text-sm font-medium hover:bg-ember/25 transition-colors"
            >
              Fiche {b.name}
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}

function BrandColumn({ brand }: { brand: Brand }) {
  return (
    <div className="rounded-2xl border border-ink/10 bg-white p-6 lg:p-7">
      <div className="flex items-center gap-3 mb-4">
        <span className="grid place-items-center h-10 w-10 rounded-full bg-copper/12 border border-copper/30">
          <Award className="h-5 w-5 text-copper" />
        </span>
        <div>
          <div className="font-mono text-[10px] uppercase tracking-eyebrow text-copper">
            {brand.origin} · {brand.since}
          </div>
          <div className="font-display text-2xl text-ink tracking-tight">{brand.name}</div>
        </div>
      </div>
      <p className="text-sm text-graphite leading-relaxed mb-4">{brand.positioning}</p>
      <div className="flex flex-wrap gap-1.5 mb-4">
        {brand.categories.map((c) => (
          <span
            key={c}
            className="text-[10px] font-mono uppercase tracking-eyebrow text-graphite bg-cream border border-ink/10 px-2 py-0.5 rounded-full"
          >
            {CATEGORY_LABELS[c] ?? c}
          </span>
        ))}
      </div>
      <Link
        href={`/marques/${brand.slug}`}
        className="inline-flex items-center gap-1.5 text-xs font-mono uppercase tracking-eyebrow text-graphite hover:text-copper transition-colors"
      >
        Fiche complète {brand.name}
        <ArrowUpRight className="h-3 w-3" />
      </Link>
    </div>
  );
}

function VerdictCard({
  brand,
  title,
  body,
}: {
  brand: Brand;
  title: string;
  body: string;
}) {
  return (
    <div className="rounded-2xl border border-copper/30 bg-white p-6 lg:p-7 shadow-soft">
      <div className="font-mono text-[10px] uppercase tracking-eyebrow text-copper mb-2">
        {brand.name}
      </div>
      <h3 className="font-display text-xl text-ink tracking-tight mb-3">{title}</h3>
      <p className="text-sm text-graphite leading-relaxed">{body}</p>
    </div>
  );
}

function FlagshipsList({ brand }: { brand: Brand }) {
  return (
    <div className="rounded-2xl border border-ink/10 bg-white p-6 lg:p-7">
      <div className="font-mono text-[10px] uppercase tracking-eyebrow text-copper mb-2">
        Gammes phares
      </div>
      <h3 className="font-display text-2xl text-ink tracking-tight mb-5">{brand.name}</h3>
      <ul className="space-y-3">
        {brand.flagships.map((f) => (
          <li key={f.range} className="flex items-start gap-3 pb-3 border-b border-ink/8 last:border-0">
            <Check className="h-4 w-4 text-copper mt-1 shrink-0" />
            <div className="min-w-0">
              <div className="font-medium text-ink">{f.range}</div>
              <div className="text-[11px] font-mono uppercase tracking-eyebrow text-copper">
                {f.type}
              </div>
              <p className="mt-1 text-xs text-graphite leading-relaxed">{f.body}</p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
