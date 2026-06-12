import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight, Clock } from "lucide-react";
import { PageHeader } from "@/components/ui";
import { HeroAside } from "@/components/hero-aside";
import { Sparkles } from "lucide-react";
import { ARTICLES, CATEGORY_LABELS } from "@/lib/articles";
import { FinalCTA } from "@/components/home/cta";

export const metadata = {
  title: "Actualités · Chauffage Artisanal",
  description:
    "Articles techniques, lectures Klimabonus, retours d'expérience chantier — les actualités de notre bureau d'études.",
};

export default function ActualitesPage() {
  const articles = [...ARTICLES].sort(
    (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime(),
  );
  const [first, ...rest] = articles;

  return (
    <>
      <PageHeader
        number="14"
        eyebrow="Actualités & analyses"
        title={
          <>
            Ce qui se passe sur les{" "}
            <em className="not-italic text-bleu">chantiers et dans les dispositifs</em>.
          </>
        }
        intro="Articles techniques, lectures Klimabonus, retours d'expérience — écrits par notre bureau d'études."
        aside={
          <HeroAside
            icon={Sparkles}
            eyebrow="Sujets couverts"
            items={[
              { label: "Klimabonus & aides", body: "Décryptage des dispositifs en vigueur" },
              { label: "Technique", body: "Choix techno, dimensionnement, pose" },
              { label: "Transition énergétique", body: "Trajectoires raisonnées" },
            ]}
            footnote="Pas de chiffres inventés · vérification systématique"
          />
        }
      />

      {/* Featured */}
      <section className="py-10 lg:py-14 bg-creme">
        <div className="container">
          <div className="font-mono text-[10px] uppercase tracking-eyebrow text-bleu mb-5">
            Dernier article
          </div>
          <Link
            href={`/actualites/${first.slug}`}
            className="group grid lg:grid-cols-12 gap-8 lg:gap-12 items-center rounded-3xl border border-pierre bg-white shadow-soft overflow-hidden hover:border-bleu/40 hover:shadow-lift transition-all"
          >
            <div className="lg:col-span-7 relative aspect-[16/10] lg:aspect-auto lg:h-full bg-pierre">
              <Image
                src={first.cover}
                alt=""
                fill
                sizes="(max-width: 1024px) 100vw, 60vw"
                className="object-cover"
              />
            </div>
            <div className="lg:col-span-5 p-6 lg:pr-10 lg:py-10">
              <div className="flex items-center gap-3 flex-wrap text-xs">
                <span className="font-mono uppercase tracking-eyebrow text-bleu">
                  {CATEGORY_LABELS[first.category]}
                </span>
                <span className="text-muted">·</span>
                <span className="inline-flex items-center gap-1 text-muted">
                  <Clock className="h-3 w-3" /> {first.readingMinutes} min de lecture
                </span>
              </div>
              <h2 className="mt-4 font-display text-3xl lg:text-4xl text-anthra tracking-tight leading-tight">
                {first.title}
              </h2>
              <p className="mt-4 text-taupe leading-relaxed">{first.excerpt}</p>
              <div className="mt-6 inline-flex items-center gap-2 text-sm font-mono uppercase tracking-eyebrow text-anthra group-hover:text-bleu transition-colors">
                Lire l&apos;article
                <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </div>
            </div>
          </Link>
        </div>
      </section>

      {/* Grid */}
      {rest.length > 0 && (
        <section className="py-10 lg:py-14 bg-creme">
          <div className="container">
            <div className="font-mono text-[10px] uppercase tracking-eyebrow text-bleu mb-5">
              Autres articles
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {rest.map((a) => (
                <ArticleCard key={a.slug} article={a} />
              ))}
            </div>
          </div>
        </section>
      )}

      <FinalCTA />
    </>
  );
}

function ArticleCard({ article }: { article: (typeof ARTICLES)[number] }) {
  return (
    <Link
      href={`/actualites/${article.slug}`}
      className="group block rounded-2xl border border-pierre bg-white overflow-hidden hover:border-bleu/40 hover:shadow-lift transition-all"
    >
      <div className="relative aspect-[16/10] bg-pierre">
        <Image
          src={article.cover}
          alt=""
          fill
          sizes="(max-width: 768px) 100vw, 33vw"
          className="object-cover group-hover:scale-105 transition-transform duration-700"
        />
      </div>
      <div className="p-5 lg:p-6">
        <div className="flex items-center gap-3 text-xs">
          <span className="font-mono uppercase tracking-eyebrow text-bleu">
            {CATEGORY_LABELS[article.category]}
          </span>
          <span className="text-muted">·</span>
          <span className="inline-flex items-center gap-1 text-muted">
            <Clock className="h-3 w-3" /> {article.readingMinutes} min
          </span>
        </div>
        <h3 className="mt-3 font-display text-xl text-anthra tracking-tight leading-snug">
          {article.title}
        </h3>
        <p className="mt-2 text-sm text-taupe leading-relaxed line-clamp-3">
          {article.excerpt}
        </p>
        <div className="mt-4 inline-flex items-center gap-2 text-xs font-mono uppercase tracking-eyebrow text-anthra group-hover:text-bleu transition-colors">
          Lire
          <ArrowUpRight className="h-3 w-3" />
        </div>
      </div>
    </Link>
  );
}
