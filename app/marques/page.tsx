/**
 * /marques — hub encyclopédie des 9 marques partenaires.
 *
 * Objectifs :
 *   - capter les requêtes "marques chauffage Luxembourg", "installateur multi-marques"
 *   - servir de page de réassurance commerciale ("on travaille avec les meilleurs")
 *   - point d'entrée pour les recherches marque-spécifiques avant /devis
 */

import Link from "next/link";
import { ArrowUpRight, Award, MapPin } from "lucide-react";
import { Eyebrow, SectionTitle } from "@/components/ui";
import { BRANDS, BRAND_SLUGS, CATEGORY_LABELS } from "@/lib/brands-content";

export const metadata = {
  title: "Marques · Encyclopédie installateur Luxembourg",
  description:
    "Notre catalogue de marques partenaires au Luxembourg : Vaillant, Viessmann, Daikin, Mitsubishi, Buderus, Atlantic, Bosch, De Dietrich, Hoval. Choix orienté disponibilité pièces et durabilité.",
  alternates: { canonical: "/marques" },
};

export default function MarquesHub() {
  const brands = BRAND_SLUGS.map((s) => BRANDS[s]);

  return (
    <>
      {/* Hero */}
      <section className="relative pt-12 lg:pt-16 pb-12 lg:pb-16 bg-creme border-b border-pierre overflow-hidden">
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 20% 30%, rgba(11,87,160,0.35), transparent 55%), radial-gradient(circle at 80% 70%, rgba(11,87,160,0.18), transparent 55%)",
          }}
        />
        <div className="container relative">
          <div className="max-w-3xl">
            <Eyebrow number="00">Encyclopédie des marques</Eyebrow>
            <h1 className="mt-4 font-display text-display-xl tracking-tightest text-balance text-anthra">
              Les marques que nous{" "}
              <em className="not-italic text-bleu">installons et maîtrisons</em>.
            </h1>
            <p className="mt-5 text-lg lg:text-xl text-taupe leading-relaxed text-balance">
              Vaillant, Viessmann, Daikin, Mitsubishi, Buderus, Atlantic, Bosch, De Dietrich,
              Hoval — sélection orientée disponibilité pièces, robustesse long terme et
              cohérence avec les contraintes luxembourgeoises.
            </p>
            <div className="mt-7 flex flex-wrap items-center gap-3">
              <Link
                href="/devis"
                className="inline-flex items-center gap-2 rounded-full bg-navy text-creme px-6 py-3.5 text-sm font-medium hover:bg-bleu transition-colors group"
              >
                Demander un devis
                <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </Link>
              <span className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-eyebrow text-taupe">
                <MapPin className="h-3 w-3 text-bleu" />9 partenaires constructeur · Luxembourg
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Grille des marques */}
      <section className="py-16 lg:py-20 bg-creme border-b border-pierre">
        <div className="container">
          <div className="max-w-3xl mb-10">
            <Eyebrow number="01">Catalogue</Eyebrow>
            <SectionTitle className="mt-4">
              9 marques sélectionnées,{" "}
              <em className="not-italic text-bleu">aucune au hasard</em>.
            </SectionTitle>
            <p className="mt-5 text-taupe leading-relaxed">
              Cliquez sur une marque pour découvrir notre positionnement, les gammes phares que
              nous installons et les conditions de garantie.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {brands.map((b) => (
              <Link
                key={b.slug}
                href={`/marques/${b.slug}`}
                className={`group p-6 lg:p-7 rounded-2xl border bg-white hover:shadow-lift transition-all flex flex-col ${
                  b.verifiedPartner
                    ? "border-bleu/40 shadow-soft"
                    : "border-pierre hover:border-bleu/40"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="font-mono text-[10px] uppercase tracking-eyebrow text-bleu">
                      {b.origin} · {b.since}
                    </div>
                    <h2 className="mt-2 font-display text-2xl text-anthra tracking-tight">
                      {b.name}
                    </h2>
                    {b.verifiedPartner && (
                      <span className="mt-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-bleu text-creme text-[9px] font-mono uppercase tracking-eyebrow">
                        Partenaire vérifié
                      </span>
                    )}
                  </div>
                  <span className="grid place-items-center h-9 w-9 rounded-full bg-bleu/12 border border-bleu/30 shrink-0">
                    <Award className="h-4 w-4 text-bleu" />
                  </span>
                </div>
                <p className="mt-4 text-sm text-taupe leading-relaxed flex-1">
                  {b.shortPitch}
                </p>
                <div className="mt-5 flex flex-wrap gap-1.5">
                  {b.categories.map((c) => (
                    <span
                      key={c}
                      className="text-[10px] font-mono uppercase tracking-eyebrow text-taupe bg-creme border border-pierre px-2 py-0.5 rounded-full"
                    >
                      {CATEGORY_LABELS[c] ?? c}
                    </span>
                  ))}
                </div>
                <div className="mt-5 pt-5 border-t border-pierre inline-flex items-center justify-between text-xs font-mono uppercase tracking-eyebrow text-taupe group-hover:text-bleu transition-colors">
                  Voir la fiche
                  <ArrowUpRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Bandeau pédagogique */}
      <section className="py-14 lg:py-20 bg-creme">
        <div className="container grid lg:grid-cols-12 gap-10 items-start">
          <div className="lg:col-span-7">
            <Eyebrow number="02">Notre méthode</Eyebrow>
            <SectionTitle className="mt-4">
              Comment on choisit{" "}
              <em className="not-italic text-bleu">la bonne marque</em> pour votre projet.
            </SectionTitle>
            <p className="mt-5 text-taupe leading-relaxed">
              Le choix de la marque n&apos;est jamais cosmétique — il dépend de la puissance
              cible, du carburant, de la disponibilité pièces sur 15-20 ans, de la complexité du
              SAV et du budget. Nous proposons toujours au moins deux marques sur les devis
              significatifs.
            </p>
            <ul className="mt-6 space-y-3 text-sm text-taupe">
              <li className="flex items-start gap-3 p-4 rounded-2xl border border-pierre bg-white">
                <span className="font-mono text-[10px] uppercase tracking-eyebrow text-bleu shrink-0 mt-0.5">
                  01
                </span>
                <span>
                  <strong className="text-anthra">Disponibilité pièces sur 15-20 ans</strong> —
                  une chaudière dure le temps de ses pièces détachées. On évite les marques
                  exotiques.
                </span>
              </li>
              <li className="flex items-start gap-3 p-4 rounded-2xl border border-pierre bg-white">
                <span className="font-mono text-[10px] uppercase tracking-eyebrow text-bleu shrink-0 mt-0.5">
                  02
                </span>
                <span>
                  <strong className="text-anthra">Support technique constructeur</strong> — accès
                  au support en cas de panne complexe, pas un appel SAV anonyme.
                </span>
              </li>
              <li className="flex items-start gap-3 p-4 rounded-2xl border border-pierre bg-white">
                <span className="font-mono text-[10px] uppercase tracking-eyebrow text-bleu shrink-0 mt-0.5">
                  03
                </span>
                <span>
                  <strong className="text-anthra">Cohérence budget / durée de vie</strong> —
                  premium quand justifié, accessible quand pertinent. Pas de surfacturation par
                  prestige de marque.
                </span>
              </li>
            </ul>
          </div>
          <aside className="lg:col-span-5 lg:sticky lg:top-28">
            <div className="rounded-2xl border border-bleu/30 bg-gradient-to-br from-creme to-white p-7 shadow-soft">
              <div className="font-mono text-[10px] uppercase tracking-eyebrow text-bleu">
                Devis multi-marques
              </div>
              <h3 className="mt-3 font-display text-2xl text-anthra tracking-tight">
                Indiquez une préférence ou laissez-nous comparer
              </h3>
              <p className="mt-4 text-sm text-taupe leading-relaxed">
                Sur le configurateur, vous pouvez préciser une marque souhaitée. Si vous
                préférez qu&apos;on compare, nous proposerons 2 marques pertinentes pour votre
                projet, avec écart de prix justifié.
              </p>
              <Link
                href="/devis"
                className="mt-6 inline-flex items-center justify-between gap-2 rounded-full bg-navy text-creme px-5 py-3.5 text-sm font-medium hover:bg-bleu transition-colors w-full group"
              >
                Lancer mon devis
                <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </Link>
            </div>
          </aside>
        </div>
      </section>
    </>
  );
}
