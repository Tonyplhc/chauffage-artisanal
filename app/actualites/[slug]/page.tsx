import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowUpRight, Clock, User, Info, AlertCircle, Sparkles } from "lucide-react";
import { ARTICLES, CATEGORY_LABELS, getArticle, getRelatedArticles } from "@/lib/articles";
import { FinalCTA } from "@/components/home/cta";

export const dynamic = "force-static";
export const dynamicParams = false;

export function generateStaticParams() {
  return ARTICLES.map((a) => ({ slug: a.slug }));
}

export function generateMetadata({ params }: { params: { slug: string } }) {
  const a = getArticle(params.slug);
  if (!a) return { title: "Article introuvable · Chauffage Artisanal" };
  return {
    title: a.title,
    description: a.excerpt,
    openGraph: { title: a.title, description: a.excerpt, images: [{ url: a.cover }] },
  };
}

export default function ArticlePage({ params }: { params: { slug: string } }) {
  const a = getArticle(params.slug);
  if (!a) notFound();
  const related = getRelatedArticles(params.slug);
  const formattedDate = new Date(a.publishedAt).toLocaleDateString("fr-FR", {
    year: "numeric",
    month: "long",
  });

  return (
    <>
      {/* JSON-LD Article — rich result Google News / Discover */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Article",
            headline: a.title,
            description: a.excerpt,
            datePublished: a.publishedAt,
            author: { "@type": "Organization", name: "Chauffage Artisanal" },
            publisher: {
              "@type": "Organization",
              name: "Chauffage Artisanal",
              url: "https://www.chauffage-artisanal.lu",
            },
            image: [a.cover],
            articleSection: CATEGORY_LABELS[a.category],
          }),
        }}
      />

      {/* Header */}
      <section className="relative pt-12 lg:pt-16 pb-8 bg-cream">
        <div className="container max-w-4xl">
          <Link
            href="/actualites"
            className="inline-flex items-center gap-2 text-sm font-mono uppercase tracking-eyebrow text-graphite hover:text-copper transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Toutes les actualités
          </Link>
          <div className="mt-6 flex items-center gap-3 flex-wrap text-xs">
            <span className="font-mono uppercase tracking-eyebrow text-copper">
              {CATEGORY_LABELS[a.category]}
            </span>
            <span className="text-muted">·</span>
            <span className="inline-flex items-center gap-1 text-muted">
              <Clock className="h-3 w-3" /> {a.readingMinutes} min de lecture
            </span>
            <span className="text-muted">·</span>
            <span className="text-muted">{formattedDate}</span>
          </div>
          <h1 className="mt-5 font-display text-4xl lg:text-5xl tracking-tight text-ink text-balance leading-tight">
            {a.title}
          </h1>
          <p className="mt-5 text-lg text-graphite max-w-2xl leading-relaxed">{a.excerpt}</p>
          <div className="mt-6 inline-flex items-center gap-2 text-xs text-muted font-mono uppercase tracking-eyebrow">
            <User className="h-3 w-3 text-copper" />
            {a.author}
          </div>
        </div>
      </section>

      {/* Cover */}
      <section className="bg-cream">
        <div className="container max-w-5xl">
          <div className="relative aspect-[21/9] rounded-3xl overflow-hidden bg-stone shadow-soft">
            <Image
              src={a.cover}
              alt=""
              fill
              priority
              sizes="(max-width: 1024px) 100vw, 1000px"
              className="object-cover"
            />
          </div>
        </div>
      </section>

      {/* Body */}
      <section className="py-10 lg:py-14 bg-cream">
        <div className="container max-w-3xl">
          <article className="space-y-5">
            {a.body.map((b, i) => (
              <Block key={i} block={b} />
            ))}
          </article>
        </div>
      </section>

      {/* Related */}
      {related.length > 0 && (
        <section className="py-10 lg:py-14 bg-linen border-y border-ink/8">
          <div className="container">
            <div className="font-mono text-[10px] uppercase tracking-eyebrow text-copper mb-5">
              À lire aussi
            </div>
            <div className="grid md:grid-cols-2 gap-6">
              {related.map((r) => (
                <Link
                  key={r.slug}
                  href={`/actualites/${r.slug}`}
                  className="group flex items-center gap-5 p-5 rounded-2xl border border-ink/10 bg-white hover:border-copper/40 hover:shadow-lift transition-all"
                >
                  <div className="relative h-20 w-20 rounded-xl overflow-hidden bg-stone shrink-0">
                    <Image
                      src={r.cover}
                      alt=""
                      fill
                      sizes="80px"
                      className="object-cover"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-mono text-[10px] uppercase tracking-eyebrow text-copper">
                      {CATEGORY_LABELS[r.category]}
                    </div>
                    <div className="mt-1 font-display text-base text-ink leading-tight line-clamp-2">
                      {r.title}
                    </div>
                  </div>
                  <ArrowUpRight className="h-4 w-4 text-graphite group-hover:text-copper shrink-0" />
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      <FinalCTA />
    </>
  );
}

function Block({ block }: { block: import("@/lib/articles").ArticleBlock }) {
  switch (block.type) {
    case "p":
      return (
        <p className="text-lg text-graphite leading-relaxed">{block.text}</p>
      );
    case "h2":
      return (
        <h2 className="mt-10 mb-3 font-display text-2xl lg:text-3xl text-ink tracking-tight">
          {block.text}
        </h2>
      );
    case "h3":
      return (
        <h3 className="mt-6 mb-2 font-display text-xl text-ink tracking-tight">
          {block.text}
        </h3>
      );
    case "quote":
      return (
        <blockquote className="border-l-2 border-copper pl-5 my-4 italic text-graphite">
          {block.text}
          {block.cite && (
            <cite className="block mt-2 not-italic text-sm font-mono uppercase tracking-eyebrow text-muted">
              — {block.cite}
            </cite>
          )}
        </blockquote>
      );
    case "list":
      return (
        <ul className="space-y-2.5 my-3">
          {block.items.map((it, i) => (
            <li key={i} className="flex gap-3 text-base text-graphite leading-relaxed">
              <span className="mt-2 h-1.5 w-1.5 rounded-full bg-copper shrink-0" />
              <span>{it}</span>
            </li>
          ))}
        </ul>
      );
    case "callout": {
      const tone = block.tone;
      const Icon = tone === "warning" ? AlertCircle : tone === "highlight" ? Sparkles : Info;
      const color =
        tone === "warning" ? "#dc5a28" : tone === "highlight" ? "#b86a36" : "#6ba3c5";
      return (
        <div
          className="my-6 p-5 lg:p-6 rounded-2xl border"
          style={{ background: `${color}10`, borderColor: `${color}55` }}
        >
          <div className="flex items-start gap-3">
            <span
              className="h-9 w-9 rounded-full grid place-items-center border shrink-0"
              style={{ background: `${color}22`, borderColor: `${color}55`, color }}
            >
              <Icon className="h-4 w-4" />
            </span>
            <div>
              <div
                className="font-mono text-[10px] uppercase tracking-eyebrow"
                style={{ color }}
              >
                {block.title}
              </div>
              <p className="mt-2 text-base text-ink leading-relaxed">{block.body}</p>
            </div>
          </div>
        </div>
      );
    }
    default:
      return null;
  }
}
