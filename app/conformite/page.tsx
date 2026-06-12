import Link from "next/link";
import {
  ArrowUpRight,
  CheckCircle2,
  ExternalLink,
  ShieldCheck,
  Info,
  Award,
} from "lucide-react";
import { Eyebrow, SectionTitle } from "@/components/ui";
import { CATEGORY_LABELS, CONFORMITE_RULES } from "@/lib/conformite-content";
import { buildAlternates } from "@/lib/seo-alternates";

export const metadata = {
  title:
    "Conformité réglementaire HVAC Luxembourg 2026 — RGD, F-Gas III, SCRB",
  description:
    "Obligations réelles HVAC au Luxembourg : inspection chaudière, fluides frigorigènes F-Gas III, étanchéité climatisation, réception SCRB, TVA logement 3 %. Textes officiels cités.",
  alternates: buildAlternates("/conformite"),
};

export default function ConformitePage() {
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
            <Eyebrow number="🇱🇺">Réglementation HVAC</Eyebrow>
            <h1 className="mt-4 font-display text-display-xl tracking-tightest text-balance text-ink">
              Conformité HVAC Luxembourg —{" "}
              <em className="not-italic text-copper">textes officiels cités</em>.
            </h1>
            <p className="mt-5 text-lg lg:text-xl text-graphite leading-relaxed text-balance">
              Le secteur du chauffage et de la climatisation est encadré au Luxembourg par
              plusieurs RGD et règlements UE. Voici les obligations qui s&apos;appliquent
              vraiment, leurs textes de référence, et ce qu&apos;elles signifient pour vous.
            </p>
            <div className="mt-7 grid sm:grid-cols-3 gap-3">
              <div className="flex items-center gap-2 p-3 rounded-2xl border border-copper/30 bg-white">
                <ShieldCheck className="h-4 w-4 text-copper shrink-0" />
                <div className="text-xs">
                  <div className="font-mono uppercase tracking-eyebrow text-copper">
                    7 obligations
                  </div>
                  <div className="text-ink">Documentées et sourcées</div>
                </div>
              </div>
              <div className="flex items-center gap-2 p-3 rounded-2xl border border-ink/10 bg-white">
                <Award className="h-4 w-4 text-copper shrink-0" />
                <div className="text-xs">
                  <div className="font-mono uppercase tracking-eyebrow text-copper">
                    Sources légales
                  </div>
                  <div className="text-ink">Legilux + Eur-Lex</div>
                </div>
              </div>
              <div className="flex items-center gap-2 p-3 rounded-2xl border border-ink/10 bg-white">
                <CheckCircle2 className="h-4 w-4 text-copper shrink-0" />
                <div className="text-xs">
                  <div className="font-mono uppercase tracking-eyebrow text-copper">
                    Mise à jour
                  </div>
                  <div className="text-ink">2026</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Rules détaillées */}
      <section className="py-14 lg:py-20 bg-cream">
        <div className="container">
          <div className="max-w-3xl mb-10">
            <Eyebrow number="01">Obligations détaillées</Eyebrow>
            <SectionTitle className="mt-4">
              Ce que la loi <em className="not-italic text-copper">impose</em> réellement.
            </SectionTitle>
            <p className="mt-5 text-graphite leading-relaxed">
              On entend souvent « l&apos;entretien chaudière est annuel obligatoire au LU ».
              C&apos;est inexact — la loi impose une INSPECTION périodique (2 ans fioul/bois, 4
              ans gaz). L&apos;entretien annuel est une bonne pratique imposée par les
              constructeurs et les assurances, pas un RGD. Distinguer compte.
            </p>
          </div>

          <div className="grid gap-5">
            {CONFORMITE_RULES.map((rule) => (
              <article
                key={rule.id}
                id={rule.id}
                className="rounded-3xl border border-ink/10 bg-white p-6 lg:p-8"
              >
                <div className="flex items-start justify-between gap-4 flex-wrap mb-4">
                  <div className="min-w-0 flex-1">
                    <div className="font-mono text-[10px] uppercase tracking-eyebrow text-copper mb-1">
                      {CATEGORY_LABELS[rule.category]}
                    </div>
                    <h3 className="font-display text-2xl text-ink tracking-tight">
                      {rule.title}
                    </h3>
                  </div>
                </div>

                <p className="text-sm text-graphite leading-relaxed">{rule.obligation}</p>

                {/* Détails */}
                <div className="mt-5">
                  <div className="font-mono text-[10px] uppercase tracking-eyebrow text-muted mb-2">
                    Conditions / fréquences
                  </div>
                  <ul className="space-y-1.5">
                    {rule.details.map((d, i) => (
                      <li key={i} className="text-sm text-graphite flex items-start gap-2">
                        <span className="text-copper mt-0.5">•</span>
                        <span>{d}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Sources légales */}
                <div className="mt-5">
                  <div className="font-mono text-[10px] uppercase tracking-eyebrow text-muted mb-2">
                    Textes de référence
                  </div>
                  <ul className="space-y-2">
                    {rule.legalSource.map((s, i) => (
                      <li key={i}>
                        <a
                          href={s.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-ink hover:text-copper transition-colors inline-flex items-center gap-1.5 group"
                        >
                          <span className="underline decoration-graphite/30 group-hover:decoration-copper">
                            {s.label}
                          </span>
                          <ExternalLink className="h-3 w-3 opacity-60" />
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Certifications */}
                {rule.certifyingBodies && rule.certifyingBodies.length > 0 && (
                  <div className="mt-5 p-4 rounded-2xl bg-copper/5 border border-copper/30">
                    <div className="font-mono text-[10px] uppercase tracking-eyebrow text-copper mb-2">
                      Organismes certificateurs au Luxembourg
                    </div>
                    <ul className="space-y-1.5">
                      {rule.certifyingBodies.map((c, i) => (
                        <li key={i} className="text-sm text-ink flex items-start gap-2">
                          <Award className="h-3.5 w-3.5 text-copper mt-0.5 shrink-0" />
                          <span>{c}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Sanctions */}
                {rule.sanctions && (
                  <div className="mt-5 p-4 rounded-2xl bg-ember/5 border border-ember/30">
                    <div className="font-mono text-[10px] uppercase tracking-eyebrow text-ember mb-2">
                      Sanctions / conséquences
                    </div>
                    <p className="text-sm text-ink leading-relaxed">{rule.sanctions}</p>
                  </div>
                )}
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Note transparence */}
      <section className="py-12 bg-linen border-y border-ink/8">
        <div className="container max-w-3xl">
          <div className="p-6 rounded-2xl border border-ink/10 bg-white">
            <div className="flex items-start gap-3">
              <Info className="h-5 w-5 text-copper mt-0.5 shrink-0" />
              <div>
                <div className="font-mono text-[10px] uppercase tracking-eyebrow text-copper mb-2">
                  Limites de cette synthèse
                </div>
                <p className="text-sm text-graphite leading-relaxed">
                  Cette page synthétise les textes officiels les plus pertinents pour le secteur
                  HVAC luxembourgeois. Elle ne se substitue pas à un conseil juridique
                  personnalisé. Pour les cas complexes (tertiaire, copropriété, situations
                  mixtes), nous orientons vers le Guichet Unique des aides au logement —{" "}
                  <a
                    href="tel:+35280021010"
                    className="text-copper hover:underline"
                  >
                    (+352) 80021010
                  </a>{" "}
                  — ou la Chambre des Métiers SCRB pour les installations gaz.
                </p>
                <p className="mt-3 text-sm text-graphite leading-relaxed">
                  Certains points (seuil ancienneté TVA 3 % rénovation, RGD performance
                  énergétique des bâtiments 2026) sont à vérifier ponctuellement sur la fiche
                  officielle correspondante — les sources publiées convergent mais peuvent
                  comporter des décalages temporaires lors des transitions législatives.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 lg:py-20 bg-charcoal text-cream">
        <div className="container text-center max-w-3xl mx-auto">
          <div className="font-mono text-[11px] uppercase tracking-eyebrow text-copper-200">
            Conformité opérationnelle
          </div>
          <h2 className="mt-4 font-display text-display-lg tracking-tightest text-balance">
            On gère le volet{" "}
            <em className="not-italic text-copper-200">réglementaire</em> avec votre projet.
          </h2>
          <p className="mt-5 text-cream/75 text-lg leading-relaxed">
            Inscription au SCRB, attestation fluides cat I, dossier Klimabonus, déclaration
            étanchéité annuelle — les pas administratifs sont notre métier autant que les pas
            techniques.
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
              href="/klimabonus-2026"
              className="inline-flex items-center gap-2 rounded-full bg-ember/15 border border-ember/40 text-cream px-7 py-4 text-sm font-medium hover:bg-ember/25 transition-colors"
            >
              Klimabonus 2026
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
