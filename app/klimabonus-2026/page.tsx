import Link from "next/link";
import {
  ArrowUpRight,
  CheckCircle2,
  Info,
  ExternalLink,
  Phone,
  AlertCircle,
} from "lucide-react";
import { Eyebrow, SectionTitle } from "@/components/ui";
import {
  KLIMABONUS_BAREMES,
  KLIMABONUS_CUMULS,
  KLIMABONUS_HOTLINE,
  KLIMABONUS_NEWS_2026,
  KLIMABONUS_RULES,
  KLIMABONUS_SIMULATOR,
  KLIMABONUS_SOURCE_OFFICIAL,
} from "@/lib/klimabonus-2026";
import { buildAlternates } from "@/lib/seo-alternates";

export const metadata = {
  title:
    "Klimabonus 2026 Luxembourg — Barèmes officiels, conditions, sources",
  description:
    "Montants Klimabonus 2026 vérifiés sur guichet.public.lu : PAC jusqu'à 10 000 €, géothermique 12 000 €, biomasse 8 000 €, isolation 35-115 €/m². Conditions, cumuls, sources officielles.",
  alternates: buildAlternates("/klimabonus-2026"),
};

export default function KlimabonusPage() {
  return (
    <>
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
          <div className="max-w-3xl">
            <Eyebrow number="2026">Klimabonus officiel</Eyebrow>
            <h1 className="mt-4 font-display text-display-xl tracking-tightest text-balance text-ink">
              Klimabonus 2026 :{" "}
              <em className="not-italic text-copper">barèmes vérifiés</em>, sources officielles.
            </h1>
            <p className="mt-5 text-lg lg:text-xl text-graphite leading-relaxed text-balance">
              Tous les montants ci-dessous proviennent directement de{" "}
              <a
                href={KLIMABONUS_SOURCE_OFFICIAL}
                target="_blank"
                rel="noopener noreferrer"
                className="text-copper underline decoration-copper/30 hover:decoration-copper"
              >
                guichet.public.lu
              </a>{" "}
              (Administration luxembourgeoise). À jour au 6 janvier 2026 — régime valable
              jusqu&apos;au 31 décembre 2035.
            </p>
            <div className="mt-7 flex flex-wrap items-center gap-3">
              <a
                href={KLIMABONUS_SIMULATOR}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-full bg-ink text-cream px-6 py-3.5 text-sm font-medium hover:bg-copper transition-colors group"
              >
                Simulateur officiel Klima-Agence
                <ExternalLink className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </a>
              <a
                href={`tel:${KLIMABONUS_HOTLINE.replace(/[^+\d]/g, "")}`}
                className="inline-flex items-center gap-2 rounded-full bg-white border border-ink/15 text-ink px-6 py-3.5 text-sm font-medium hover:border-copper/40 transition-colors"
              >
                <Phone className="h-4 w-4" />
                Guichet unique : {KLIMABONUS_HOTLINE}
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Nouveautés 2026 */}
      <section className="py-14 lg:py-16 bg-linen border-b border-ink/8">
        <div className="container">
          <div className="max-w-3xl mb-8">
            <Eyebrow number="01">Nouveautés 2026</Eyebrow>
            <SectionTitle className="mt-4">
              Ce qui <em className="not-italic text-copper">change</em> au 1er janvier 2026.
            </SectionTitle>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {KLIMABONUS_NEWS_2026.map((n) => (
              <div
                key={n}
                className="flex items-start gap-3 p-4 rounded-2xl bg-white border border-copper/30"
              >
                <CheckCircle2 className="h-4 w-4 text-copper mt-0.5 shrink-0" />
                <span className="text-sm text-ink leading-relaxed">{n}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Barèmes par projet */}
      <section className="py-14 lg:py-20 bg-cream">
        <div className="container">
          <div className="max-w-3xl mb-10">
            <Eyebrow number="02">Barèmes par projet</Eyebrow>
            <SectionTitle className="mt-4">
              Montants <em className="not-italic text-copper">officiels</em> par type
              d&apos;installation.
            </SectionTitle>
          </div>

          <div className="grid gap-5">
            {KLIMABONUS_BAREMES.map((b) => (
              <article
                key={b.id}
                className="rounded-3xl border border-ink/10 bg-white p-6 lg:p-8"
              >
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-display text-2xl text-ink tracking-tight">
                        {b.label}
                      </h3>
                      {b.status === "à confirmer" && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-ember/10 border border-ember/40 text-[10px] font-mono uppercase tracking-eyebrow text-ember">
                          <AlertCircle className="h-3 w-3" />
                          À confirmer
                        </span>
                      )}
                      {b.status === "confirmé" && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-copper/10 border border-copper/30 text-[10px] font-mono uppercase tracking-eyebrow text-copper">
                          <CheckCircle2 className="h-3 w-3" />
                          Confirmé
                        </span>
                      )}
                    </div>
                    <div className="mt-2 font-display text-3xl text-copper">
                      {b.amount}
                    </div>
                  </div>
                </div>

                <div className="mt-6 grid sm:grid-cols-2 gap-3">
                  {b.details.map((d, i) => (
                    <div
                      key={i}
                      className="p-3 rounded-xl bg-cream border border-ink/8"
                    >
                      <div className="text-[11px] font-mono uppercase tracking-eyebrow text-muted">
                        {d.context}
                      </div>
                      <div className="mt-1 text-sm font-medium text-ink">{d.amount}</div>
                    </div>
                  ))}
                </div>

                {b.bonuses && b.bonuses.length > 0 && (
                  <div className="mt-5 p-4 rounded-2xl bg-copper/5 border border-copper/30">
                    <div className="font-mono text-[10px] uppercase tracking-eyebrow text-copper mb-2">
                      Bonus cumulables
                    </div>
                    <ul className="space-y-1.5">
                      {b.bonuses.map((bonus, i) => (
                        <li
                          key={i}
                          className="text-sm text-ink flex items-start gap-2"
                        >
                          <span className="text-copper mt-0.5">+</span>
                          <span>{bonus}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="mt-5">
                  <div className="font-mono text-[10px] uppercase tracking-eyebrow text-muted mb-2">
                    Conditions principales
                  </div>
                  <ul className="space-y-1.5">
                    {b.conditions.map((c, i) => (
                      <li key={i} className="text-sm text-graphite flex items-start gap-2">
                        <span className="text-copper mt-0.5">•</span>
                        <span>{c}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mt-5 pt-5 border-t border-ink/8 flex items-center justify-between gap-3 flex-wrap text-xs text-muted">
                  <div>
                    Source officielle ·{" "}
                    <a
                      href={b.source}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline decoration-graphite/30 hover:text-copper transition-colors"
                    >
                      guichet.public.lu
                    </a>
                  </div>
                  <div>Mise à jour : {b.lastUpdated}</div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Règles transverses */}
      <section className="py-14 lg:py-20 bg-linen border-y border-ink/8">
        <div className="container">
          <div className="max-w-3xl mb-10">
            <Eyebrow number="03">À savoir absolument</Eyebrow>
            <SectionTitle className="mt-4">
              Conditions <em className="not-italic text-copper">transverses</em> à toutes les
              aides.
            </SectionTitle>
          </div>
          <div className="grid md:grid-cols-2 gap-5">
            {KLIMABONUS_RULES.map((r) => (
              <div
                key={r.title}
                className="rounded-2xl border border-copper/30 bg-white p-6"
              >
                <div className="flex items-start gap-3">
                  <Info className="h-5 w-5 text-copper mt-0.5 shrink-0" />
                  <div className="min-w-0">
                    <h3 className="font-display text-lg text-ink tracking-tight">
                      {r.title}
                    </h3>
                    <p className="mt-2 text-sm text-graphite leading-relaxed">{r.body}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Cumuls */}
      <section className="py-14 lg:py-20 bg-cream">
        <div className="container">
          <div className="max-w-3xl mb-10">
            <Eyebrow number="04">Cumuls confirmés</Eyebrow>
            <SectionTitle className="mt-4">
              Le Klimabonus se{" "}
              <em className="not-italic text-copper">cumule</em> avec d&apos;autres aides.
            </SectionTitle>
          </div>
          <div className="grid gap-3">
            {KLIMABONUS_CUMULS.map((c) => (
              <div
                key={c.label}
                className="flex items-start gap-3 p-5 rounded-2xl border border-ink/10 bg-white"
              >
                <CheckCircle2 className="h-5 w-5 text-copper mt-0.5 shrink-0" />
                <div className="min-w-0">
                  <div className="font-display text-base text-ink">{c.label}</div>
                  <div className="mt-1 text-sm text-graphite">{c.body}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 lg:py-20 bg-charcoal text-cream">
        <div className="container text-center max-w-3xl mx-auto">
          <div className="font-mono text-[11px] uppercase tracking-eyebrow text-copper-200">
            Aide constituée du dossier
          </div>
          <h2 className="mt-4 font-display text-display-lg tracking-tightest text-balance">
            Nous préparons le volet technique{" "}
            <em className="not-italic text-copper-200">de votre dossier Klimabonus</em>.
          </h2>
          <p className="mt-5 text-cream/75 text-lg leading-relaxed">
            Schémas, fiches produits, attestations conformité — la partie technique est de
            notre ressort. Vous gardez le dossier administratif à votre nom.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/devis"
              className="inline-flex items-center gap-2 rounded-full bg-cream text-charcoal px-7 py-4 text-sm font-medium hover:bg-copper hover:text-cream transition-colors group"
            >
              Demander un devis
              <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </Link>
            <a
              href={KLIMABONUS_SIMULATOR}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full bg-ember/15 border border-ember/40 text-cream px-7 py-4 text-sm font-medium hover:bg-ember/25 transition-colors"
            >
              <ExternalLink className="h-4 w-4" />
              Simulateur officiel
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
