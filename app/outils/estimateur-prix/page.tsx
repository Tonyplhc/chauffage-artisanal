"use client";

/**
 * /outils/estimateur-prix — fourchette de prix instantanée.
 *
 * 4 questions → résultat live, sans formulaire. Le but : que le visiteur
 * sache si son projet est dans son ordre de grandeur AVANT le devis.
 * Maximise la conversion : on supprime la question "combien ça coûte ?"
 * qui retient les utilisateurs.
 */

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  Calculator,
  Check,
  Info,
  Sparkles,
  TrendingDown,
} from "lucide-react";
import { Eyebrow, SectionTitle } from "@/components/ui";
import {
  BUILDING_OPTIONS,
  COMPLEXITY_OPTIONS,
  PROJECT_OPTIONS,
  estimatePrice,
  type BuildingType,
  type Complexity,
  type EstimateInput,
  type ProjectType,
} from "@/lib/price-estimator";

export default function EstimateurPrixPage() {
  const [input, setInput] = useState<EstimateInput>({
    projectType: "pac-air-eau",
    buildingType: "maison",
    surfaceM2: 140,
    complexity: "remplacement",
  });

  const result = useMemo(() => estimatePrice(input), [input]);

  const update = <K extends keyof EstimateInput>(k: K, v: EstimateInput[K]) =>
    setInput((s) => ({ ...s, [k]: v }));

  // Lien direct vers /devis avec pré-remplissage (service mappé + surface +
  // bâtiment). ?from= sert uniquement à l'attribution analytics.
  const ESTIMATEUR_SERVICE_MAP: Record<string, string> = {
    "chaudiere-gaz": "chauffage",
    "pac-air-eau": "pac",
    "pac-geothermie": "pac",
    "chauffe-eau-thermo": "sanitaire",
    "salle-de-bain": "sanitaire",
    "climatisation-mono": "clim",
    "ventilation-double-flux": "autre",
  };
  const devisHref = `/devis?from=estimateur&service=${ESTIMATEUR_SERVICE_MAP[input.projectType] ?? "autre"}&surface=${input.surfaceM2}&batiment=${input.buildingType}`;

  return (
    <div className="min-h-screen bg-creme">
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
            <Eyebrow number="OUTIL">Estimateur prix</Eyebrow>
            <h1 className="mt-4 font-display text-display-xl tracking-tightest text-balance text-anthra">
              Combien coûte votre projet,{" "}
              <em className="not-italic text-bleu">en 30 secondes</em> ?
            </h1>
            <p className="mt-5 text-lg lg:text-xl text-taupe leading-relaxed text-balance">
              4 questions, une fourchette indicative immédiate. Pas de formulaire, pas
              d&apos;email à donner. Pour préciser, demandez ensuite un devis détaillé.
            </p>
          </div>
        </div>
      </section>

      {/* Form + Output */}
      <section className="py-12 lg:py-16">
        <div className="container grid lg:grid-cols-12 gap-8 items-start">
          {/* Inputs sticky */}
          <aside className="lg:col-span-5 lg:sticky lg:top-28">
            <div className="rounded-3xl border border-pierre bg-white shadow-soft p-6 lg:p-7">
              <div className="font-mono text-[10px] uppercase tracking-eyebrow text-bleu">
                Votre projet
              </div>
              <h2 className="mt-2 font-display text-2xl text-anthra tracking-tight">
                4 questions
              </h2>

              <div className="mt-7 space-y-7">
                <Field label="Type de projet">
                  <div className="grid grid-cols-2 gap-2">
                    {PROJECT_OPTIONS.map((p) => (
                      <Toggle
                        key={p.id}
                        active={input.projectType === p.id}
                        onClick={() => update("projectType", p.id as ProjectType)}
                        label={p.label}
                      />
                    ))}
                  </div>
                </Field>

                <Field label="Type de bâtiment">
                  <div className="grid grid-cols-3 gap-2">
                    {BUILDING_OPTIONS.map((b) => (
                      <Toggle
                        key={b.id}
                        active={input.buildingType === b.id}
                        onClick={() => update("buildingType", b.id as BuildingType)}
                        label={b.label}
                      />
                    ))}
                  </div>
                </Field>

                <Field
                  label={
                    <>
                      Surface
                      <span className="font-display text-2xl text-bleu ml-2">
                        {input.surfaceM2} m²
                      </span>
                    </>
                  }
                >
                  <input
                    type="range"
                    min={30}
                    max={500}
                    step={10}
                    value={input.surfaceM2}
                    onChange={(e) => update("surfaceM2", Number(e.target.value))}
                    className="w-full accent-bleu"
                    aria-label="Surface concernée"
                  />
                  <div className="mt-1 flex justify-between text-[10px] font-mono uppercase tracking-eyebrow text-muted">
                    <span>30 m²</span>
                    <span>500 m²</span>
                  </div>
                </Field>

                <Field label="Complexité">
                  <div className="space-y-2">
                    {COMPLEXITY_OPTIONS.map((c) => (
                      <button
                        key={c.id}
                        onClick={() => update("complexity", c.id as Complexity)}
                        className={`w-full text-left px-4 py-3 rounded-xl border transition-all ${
                          input.complexity === c.id
                            ? "bg-navy text-creme border-anthra shadow-soft"
                            : "bg-creme text-taupe border-pierre hover:border-bleu/40"
                        }`}
                      >
                        <div className="text-sm font-medium">{c.label}</div>
                        <div
                          className={`text-[11px] mt-0.5 ${
                            input.complexity === c.id ? "text-creme/70" : "text-muted"
                          }`}
                        >
                          {c.hint}
                        </div>
                      </button>
                    ))}
                  </div>
                </Field>
              </div>

              <p className="mt-6 pt-6 border-t border-pierre text-[11px] text-muted leading-relaxed">
                <Info className="inline h-3 w-3 text-bleu mr-1" />
                Fourchette indicative. Un devis ferme nécessite une visite technique pour
                tenir compte de l&apos;isolation, de l&apos;accès et des contraintes
                spécifiques.
              </p>
            </div>
          </aside>

          {/* Results — aria-live polite pour annoncer les changements aux lecteurs d'écran */}
          <div
            className="lg:col-span-7 space-y-6"
            aria-live="polite"
            aria-atomic="false"
            aria-label="Estimation de prix"
          >
            {/* Card principale */}
            <div className="rounded-3xl border border-bleu/30 bg-gradient-to-br from-creme to-white p-7 lg:p-9 shadow-soft">
              <div className="font-mono text-[10px] uppercase tracking-eyebrow text-bleu">
                Fourchette estimée — {result.projectLabel}
              </div>
              <div className="mt-3 font-display text-display-lg tracking-tightest text-anthra">
                {result.min.toLocaleString("fr-LU")} €
                <span className="text-taupe text-3xl mx-2">–</span>
                {result.max.toLocaleString("fr-LU")} €
              </div>
              <div className="mt-2 text-sm text-taupe">
                Prix indicatif TTC posé, hors aides
              </div>

              {result.klimabonusMax > 0 && (
                <div className="mt-7 p-5 rounded-2xl bg-bleu/8 border border-bleu/30">
                  <div className="flex items-start gap-3">
                    <Sparkles className="h-5 w-5 text-bleu mt-0.5 shrink-0" />
                    <div className="min-w-0 flex-1">
                      <div className="font-mono text-[10px] uppercase tracking-eyebrow text-bleu mb-1">
                        Klimabonus déduit
                      </div>
                      <div className="font-display text-2xl text-anthra">
                        {result.netMin.toLocaleString("fr-LU")} €
                        <span className="text-taupe text-lg mx-1.5">–</span>
                        {result.netMax.toLocaleString("fr-LU")} €
                      </div>
                      <div className="text-xs text-taupe mt-1">
                        Aide indicative {result.klimabonusMin.toLocaleString("fr-LU")} –{" "}
                        {result.klimabonusMax.toLocaleString("fr-LU")} € selon dossier
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Décomposition */}
            <div className="rounded-3xl border border-pierre bg-white p-7 lg:p-8">
              <Eyebrow number="01">Décomposition indicative</Eyebrow>
              <h3 className="mt-3 font-display text-xl text-anthra tracking-tight">
                Où va l&apos;argent
              </h3>
              <div className="mt-5 space-y-3">
                {result.breakdown.map((b) => (
                  <div
                    key={b.label}
                    className="flex items-center justify-between gap-4 py-3 border-b border-pierre last:border-0"
                  >
                    <span className="text-sm text-taupe">{b.label}</span>
                    <span className="font-display text-base text-anthra whitespace-nowrap">
                      {b.min.toLocaleString("fr-LU")} – {b.max.toLocaleString("fr-LU")} €
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Hypothèses */}
            <details className="rounded-2xl border border-pierre bg-white p-6 group">
              <summary className="cursor-pointer font-mono text-[11px] uppercase tracking-eyebrow text-taupe hover:text-bleu transition-colors inline-flex items-center gap-1.5">
                <Info className="h-3 w-3" />
                Hypothèses retenues pour ce calcul
              </summary>
              <ul className="mt-4 space-y-2 pl-5 text-xs text-taupe leading-relaxed">
                {result.notes.map((n, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <Check className="h-3 w-3 text-bleu mt-0.5 shrink-0" />
                    <span>{n}</span>
                  </li>
                ))}
              </ul>
            </details>

            {/* CTA */}
            <div className="rounded-3xl bg-navy text-creme p-7 lg:p-9">
              <div className="grid lg:grid-cols-12 gap-6 items-center">
                <div className="lg:col-span-8">
                  <div className="font-mono text-[10px] uppercase tracking-eyebrow text-sable">
                    Préciser le chiffre
                  </div>
                  <h3 className="mt-3 font-display text-2xl lg:text-3xl tracking-tight">
                    Devis détaillé{" "}
                    <em className="not-italic text-sable">gratuit sous 24h</em>.
                  </h3>
                  <p className="mt-3 text-creme/75 leading-relaxed">
                    Visite technique sur place, étude bureau d&apos;études, accompagnement
                    Klimabonus complet, fourchette resserrée sur votre dossier réel.
                  </p>
                </div>
                <div className="lg:col-span-4 flex flex-col gap-2">
                  <Link
                    href={devisHref}
                    className="inline-flex items-center justify-between gap-2 rounded-full bg-creme text-navy px-6 py-3.5 text-sm font-medium hover:bg-bleu hover:text-creme transition-colors group"
                  >
                    Demander un devis
                    <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                  </Link>
                  <Link
                    href="/outils/calculateur-mensualites"
                    className="inline-flex items-center justify-between gap-2 rounded-full bg-terracotta/15 border border-terracotta/40 text-creme px-6 py-3.5 text-sm font-medium hover:bg-terracotta/25 transition-colors"
                  >
                    <span className="inline-flex items-center gap-2">
                      <Calculator className="h-4 w-4" />
                      Calculer mensualités
                    </span>
                    <ArrowUpRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block font-mono text-[10px] uppercase tracking-eyebrow text-taupe">
        {label}
      </label>
      <div className="mt-3">{children}</div>
    </div>
  );
}

function Toggle({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-2.5 rounded-xl border text-[13px] font-medium transition-all leading-tight ${
        active
          ? "bg-navy text-creme border-anthra shadow-soft"
          : "bg-creme text-taupe border-pierre hover:border-bleu/40"
      }`}
    >
      {label}
    </button>
  );
}
