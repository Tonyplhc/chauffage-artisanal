import type { Metadata } from "next";
import { Quote as QuoteIcon, Star, Facebook, ExternalLink, Info } from "lucide-react";
import { listPublicTestimonials } from "@/lib/testimonials-store";

export const metadata: Metadata = {
  title: "Témoignages clients",
  description:
    "Ce que disent nos clients après leurs projets de chauffage, climatisation et énergies renouvelables au Luxembourg.",
};

export const dynamic = "force-dynamic";

export default async function TemoignagesPage() {
  const testimonials = await listPublicTestimonials();
  const averageScore =
    testimonials.length === 0
      ? null
      : testimonials.reduce((s, t) => s + t.score, 0) / testimonials.length;

  // JSON-LD AggregateRating + Review array — déclenche les étoiles dans la SERP Google.
  // Les scores en base sont sur 10 ; schema.org attend une échelle bestRating/worstRating.
  // On expose bestRating: 10 (compatible avec nos données natives).
  // Garde anti-fausse-preuve : tant que seuls des témoignages "seed" (démo)
  // existent, on n'émet AUCUNE AggregateRating/Review (pas de fausses étoiles
  // dans Google). Réactivé automatiquement dès qu'un vrai avis est approuvé.
  const hasRealTestimonials =
    testimonials.length > 0 && !testimonials.every((t) => t.id.startsWith("seed-"));
  const reviewsLd =
    hasRealTestimonials && averageScore !== null
      ? {
          "@context": "https://schema.org",
          "@type": "LocalBusiness",
          name: "Chauffage Artisanal",
          url: "https://www.chauffage-artisanal.lu",
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: averageScore.toFixed(1),
            bestRating: "10",
            worstRating: "0",
            reviewCount: testimonials.length,
          },
          review: testimonials.slice(0, 20).map((t) => ({
            "@type": "Review",
            author: { "@type": "Person", name: t.displayName },
            datePublished: t.publishedAt,
            reviewRating: {
              "@type": "Rating",
              ratingValue: t.score,
              bestRating: "10",
              worstRating: "0",
            },
            reviewBody: t.comment,
          })),
        }
      : null;

  return (
    <div className="bg-cream">
      {/* JSON-LD pour rich results Google (étoiles dans la SERP) */}
      {reviewsLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(reviewsLd) }}
        />
      )}
      {/* Hero */}
      <section className="relative pt-16 lg:pt-24 pb-12 lg:pb-16">
        <div className="container max-w-5xl text-center">
          <div className="inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-eyebrow text-copper bg-copper/10 border border-copper/20 px-3 py-1 rounded-full">
            <Star className="h-3 w-3" />
            Paroles de clients
          </div>
          <h1 className="mt-4 font-display text-display-md lg:text-display-lg text-ink">
            Ce qu&apos;ils en disent
          </h1>
          <p className="mt-4 text-graphite max-w-2xl mx-auto">
            Témoignages partagés après leur projet — pompe à chaleur,
            climatisation, chaudière, sanitaire ou énergies renouvelables.
            Recueillis et publiés avec leur accord.
          </p>
          {averageScore !== null && testimonials.length >= 3 && (
            <div className="mt-8 inline-flex items-center gap-3 p-5 rounded-2xl bg-white border border-ink/10 shadow-soft">
              <span className="font-display text-3xl tabular-nums text-copper">
                {averageScore.toFixed(1)}
              </span>
              <div className="text-left">
                <div className="text-xs font-mono uppercase tracking-eyebrow text-muted">
                  Score moyen
                </div>
                <div className="text-sm text-ink">
                  Sur {testimonials.length} témoignages publiés
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Grid */}
      <section className="pb-20 lg:pb-32">
        <div className="container max-w-6xl">
          {/* Bandeau social proof externe — page Facebook officielle existante */}
          <div className="mb-10 p-5 lg:p-6 rounded-2xl bg-cream border border-ink/10 flex flex-col sm:flex-row items-center sm:items-start gap-4">
            <Facebook className="h-8 w-8 text-copper shrink-0" />
            <div className="flex-1 min-w-0 text-center sm:text-left">
              <div className="font-mono text-[10px] uppercase tracking-eyebrow text-copper">
                Suivez-nous sur Facebook
              </div>
              <div className="mt-1 text-sm text-graphite leading-relaxed">
                Actualités de l&apos;atelier, retours clients, nouveaux chantiers — page officielle
                @ChauffageArtisanal&nbsp;Sàrl
              </div>
            </div>
            <a
              href="https://www.facebook.com/RJNALMEIDA/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full bg-ink text-cream px-5 py-2.5 text-sm font-medium hover:bg-copper transition-colors shrink-0"
            >
              Voir la page
              <ExternalLink className="h-4 w-4" />
            </a>
          </div>

          {testimonials.length === 0 ? (
            <div className="text-center py-16">
              <QuoteIcon className="h-12 w-12 mx-auto opacity-20 text-copper mb-2" />
              <p className="text-graphite">
                Pas encore de témoignage public à afficher.
              </p>
              <p className="text-xs text-muted mt-1">
                Les premiers retours arrivent bientôt — revenez nous voir.
              </p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
              {testimonials.map((t, i) => (
                <article
                  key={t.id}
                  className="p-6 lg:p-8 rounded-3xl bg-white border border-ink/10 shadow-soft hover:shadow-lift transition-shadow flex flex-col"
                  style={{
                    transform: `translateY(${(i % 3) * 4}px)`,
                  }}
                >
                  <QuoteIcon className="h-8 w-8 text-copper opacity-30 mb-3" />
                  <blockquote className="flex-1 text-base text-ink leading-relaxed">
                    « {t.comment} »
                  </blockquote>
                  <div className="mt-5 pt-5 border-t border-ink/8 flex items-center justify-between">
                    <div>
                      <div className="text-sm font-medium text-ink">
                        {t.displayName}
                      </div>
                      {t.commune && (
                        <div className="text-xs text-muted">{t.commune}</div>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      {Array.from({ length: 10 }).map((_, idx) => (
                        <span
                          key={idx}
                          className={`h-1.5 w-1.5 rounded-full ${
                            idx < t.score ? "bg-copper" : "bg-cream"
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}

          {testimonials.length > 0 && (
            <div className="mt-10 p-5 rounded-2xl border border-ink/10 bg-white text-xs text-graphite leading-relaxed flex items-start gap-3">
              <Info className="h-4 w-4 text-copper mt-0.5 shrink-0" />
              <p>
                Page en cours d&apos;alimentation. Les premiers témoignages affichés sont des
                exemples représentatifs de retours clients en attendant le déploiement du système
                NPS post-installation (formulaire d&apos;avis envoyé 7 jours après chaque
                intervention). Ils seront remplacés au fil de l&apos;eau par les vrais retours
                collectés et approuvés par les clients.
              </p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
