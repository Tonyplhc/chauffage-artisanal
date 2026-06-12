"use client";

/**
 * /outils/economies-energie — calculateur grand-public unifié.
 *
 * 4 champs d'entrée → 3 scénarios calculés en temps réel.
 * Visuel premium, lecture facile, partage vers /devis pré-rempli.
 */

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  ArrowRight,
  Leaf,
  Droplets,
  Sun,
  Info,
  Sparkles,
  TrendingDown,
  Home,
  Building,
  AlertCircle,
  Check,
} from "lucide-react";
import { Eyebrow, SectionTitle } from "@/components/ui";
import {
  calculateSavings,
  type SavingsInput,
  type ScenarioResult,
} from "@/lib/savings-calculator";

const SCENARIO_ICONS = {
  pac: Leaf,
  "ecs-thermo": Droplets,
  pv: Sun,
} as const;

const SCENARIO_HREF = {
  pac: "/devis?from=economies-energie&service=pac",
  "ecs-thermo": "/chauffe-eau-luxembourg",
  pv: "/energies-renouvelables",
} as const;

export default function EconomiesEnergiePage() {
  const [input, setInput] = useState<SavingsInput>({
    buildingType: "maison",
    currentEnergy: "gaz",
    surfaceM2: 140,
    occupants: 4,
  });

  const result = useMemo(() => calculateSavings(input), [input]);

  const update = <K extends keyof SavingsInput>(k: K, v: SavingsInput[K]) =>
    setInput((s) => ({ ...s, [k]: v }));

  return (
    <div className="min-h-screen bg-cream">
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
            <Eyebrow number="OUTIL">Économies d&apos;énergie</Eyebrow>
            <h1 className="mt-4 font-display text-display-xl tracking-tightest text-balance text-ink">
              Combien vous pouvez{" "}
              <em className="not-italic text-copper">économiser par an</em> ?
            </h1>
            <p className="mt-5 text-lg lg:text-xl text-graphite leading-relaxed text-balance">
              4 questions, 3 scénarios calculés en temps réel : pompe à chaleur, chauffe-eau
              thermodynamique, panneaux photovoltaïques. Ordres de grandeur transparents — pas
              de promesse, juste de la pédagogie.
            </p>
          </div>
        </div>
      </section>

      {/* Form + Output */}
      <section className="py-12 lg:py-16">
        <div className="container grid lg:grid-cols-12 gap-8 items-start">
          {/* Inputs sticky */}
          <aside className="lg:col-span-4 lg:sticky lg:top-28">
            <div className="rounded-3xl border border-ink/10 bg-white shadow-soft p-6 lg:p-7">
              <div className="font-mono text-[10px] uppercase tracking-eyebrow text-copper">
                Votre situation
              </div>
              <h2 className="mt-2 font-display text-2xl text-ink tracking-tight">
                4 questions rapides
              </h2>

              <div className="mt-7 space-y-7">
                {/* Building type */}
                <div>
                  <FieldLabel>Type de logement</FieldLabel>
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <Toggle
                      active={input.buildingType === "maison"}
                      onClick={() => update("buildingType", "maison")}
                      icon={<Home className="h-4 w-4" />}
                      label="Maison"
                    />
                    <Toggle
                      active={input.buildingType === "appartement"}
                      onClick={() => update("buildingType", "appartement")}
                      icon={<Building className="h-4 w-4" />}
                      label="Appartement"
                    />
                  </div>
                </div>

                {/* Current energy */}
                <div>
                  <FieldLabel>Énergie actuelle de chauffage</FieldLabel>
                  <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {(["gaz", "fioul", "electrique", "bois"] as const).map((e) => (
                      <Toggle
                        key={e}
                        active={input.currentEnergy === e}
                        onClick={() => update("currentEnergy", e)}
                        label={
                          e === "gaz" ? "Gaz" : e === "fioul" ? "Fioul" : e === "electrique" ? "Électrique" : "Bois"
                        }
                      />
                    ))}
                  </div>
                </div>

                {/* Surface */}
                <div>
                  <FieldLabel>
                    Surface chauffée
                    <span className="font-display text-2xl text-copper ml-2">
                      {input.surfaceM2} m²
                    </span>
                  </FieldLabel>
                  <input
                    type="range"
                    min={40}
                    max={400}
                    step={10}
                    value={input.surfaceM2}
                    onChange={(e) => update("surfaceM2", Number(e.target.value))}
                    className="mt-3 w-full accent-copper"
                    aria-label="Surface chauffée en mètres carrés"
                    aria-valuemin={40}
                    aria-valuemax={400}
                    aria-valuenow={input.surfaceM2}
                    aria-valuetext={`${input.surfaceM2} mètres carrés`}
                  />
                  <div className="mt-1 flex justify-between text-[10px] font-mono uppercase tracking-eyebrow text-muted">
                    <span>40 m²</span>
                    <span>400 m²</span>
                  </div>
                </div>

                {/* Occupants */}
                <div>
                  <FieldLabel>
                    Nombre d&apos;occupants
                    <span className="font-display text-2xl text-copper ml-2">
                      {input.occupants}
                    </span>
                  </FieldLabel>
                  <input
                    type="range"
                    min={1}
                    max={8}
                    step={1}
                    value={input.occupants}
                    onChange={(e) => update("occupants", Number(e.target.value))}
                    className="mt-3 w-full accent-copper"
                    aria-label="Nombre d'occupants du foyer"
                    aria-valuemin={1}
                    aria-valuemax={8}
                    aria-valuenow={input.occupants}
                    aria-valuetext={`${input.occupants} occupant${input.occupants > 1 ? "s" : ""}`}
                  />
                  <div className="mt-1 flex justify-between text-[10px] font-mono uppercase tracking-eyebrow text-muted">
                    <span>1</span>
                    <span>8</span>
                  </div>
                </div>
              </div>

              <p className="mt-6 pt-6 border-t border-ink/8 text-[11px] text-muted leading-relaxed">
                <Info className="inline h-3 w-3 text-copper mr-1" />
                Hypothèses 2026 Luxembourg, prudentes. Ordres de grandeur pour orienter — pas
                un engagement.
              </p>
            </div>
          </aside>

          {/* Results — aria-live polite pour annoncer les mises à jour aux lecteurs d'écran */}
          <div
            className="lg:col-span-8 space-y-6"
            aria-live="polite"
            aria-atomic="false"
            aria-label="Résultats du calculateur"
          >
            {/* Total combiné */}
            <div className="rounded-3xl border border-copper/30 bg-gradient-to-br from-cream to-white p-7 lg:p-8 shadow-soft">
              <div className="flex items-start justify-between flex-wrap gap-3 mb-1">
                <div className="font-mono text-[10px] uppercase tracking-eyebrow text-copper">
                  Potentiel total — scénarios cumulés
                </div>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-copper/10 border border-copper/30 text-[10px] font-mono uppercase tracking-eyebrow text-copper">
                  <Sparkles className="h-3 w-3" />
                  Hypothèses prudentes
                </span>
              </div>

              <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-x-6 gap-y-4">
                <Metric
                  label="Économies / an"
                  value={`${result.combinedAnnualSavings.toLocaleString("fr-LU")} €`}
                  icon={<TrendingDown className="h-4 w-4" />}
                  copper
                />
                <Metric
                  label="CO₂ évité / an"
                  value={`${result.combinedCo2.toLocaleString("fr-LU")} kg`}
                  icon={<Leaf className="h-4 w-4" />}
                />
                <Metric
                  label="Investissement net"
                  value={`${result.combinedNetInvestment.toLocaleString("fr-LU")} €`}
                  hint="Klimabonus indicatif déduit"
                />
              </div>

              <p className="mt-5 text-sm text-graphite leading-relaxed">
                Cumul des scénarios applicables à votre profil. Chaque scénario peut être
                déployé indépendamment — on commence souvent par celui dont le ROI est le plus
                court.
              </p>
            </div>

            {/* Scénarios détaillés */}
            <div className="grid gap-6">
              {result.scenarios.map((s) => (
                <ScenarioCard key={s.id} scenario={s} />
              ))}
            </div>

            {/* CTA final */}
            <div className="rounded-3xl bg-charcoal text-cream p-8 lg:p-10">
              <div className="grid lg:grid-cols-12 gap-6 items-center">
                <div className="lg:col-span-8">
                  <div className="font-mono text-[10px] uppercase tracking-eyebrow text-copper-200">
                    Passer du chiffre au projet
                  </div>
                  <h3 className="mt-3 font-display text-2xl lg:text-3xl tracking-tight">
                    Étude personnalisée{" "}
                    <em className="not-italic text-copper-200">gratuite</em> sous 24h.
                  </h3>
                  <p className="mt-3 text-cream/75 leading-relaxed">
                    Notre bureau d&apos;études affine les chiffres avec votre dossier réel
                    (isolation, exposition, conso historique) et prépare le volet technique
                    Klimabonus.
                  </p>
                </div>
                <div className="lg:col-span-4 flex flex-col gap-2">
                  <Link
                    href={`/devis?from=economies-energie&surface=${input.surfaceM2}&energie=${input.currentEnergy}&batiment=${input.buildingType}`}
                    className="inline-flex items-center justify-between gap-2 rounded-full bg-cream text-charcoal px-6 py-3.5 text-sm font-medium hover:bg-copper hover:text-cream transition-colors group"
                  >
                    Demander un devis
                    <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                  </Link>
                  <Link
                    href="/primes-aides#simulateur"
                    className="inline-flex items-center justify-between gap-2 rounded-full bg-ember/15 border border-ember/40 text-cream px-6 py-3.5 text-sm font-medium hover:bg-ember/25 transition-colors"
                  >
                    Vérifier mon Klimabonus
                    <ArrowUpRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            </div>

            {/* Disclaimer transparence */}
            <div className="rounded-2xl border border-ink/10 bg-white p-6">
              <div className="font-mono text-[10px] uppercase tracking-eyebrow text-copper mb-2">
                Transparence des hypothèses
              </div>
              <p className="text-sm text-graphite leading-relaxed">
                Les chiffres ci-dessus s&apos;appuient sur des hypothèses prudentes 2026 :
                prix kWh gaz 0,11 €, fioul 0,13 €, électricité 0,22 €, bois 0,06 € · SCOP PAC 3,5 · COP
                chauffe-eau thermo 3,0 · production PV 950 kWh/kWc/an · autoconsommation 40 %
                · forfaits Klimabonus 2026 vérifiés. La réalité dépend de votre isolation, de votre
                consommation et des évolutions tarifaires — d&apos;où la nécessité d&apos;une
                visite technique pour un devis ferme.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

/* ──────────────────────── SOUS-COMPOSANTS ──────────────────────── */

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label className="block font-mono text-[10px] uppercase tracking-eyebrow text-graphite">
      {children}
    </label>
  );
}

function Toggle({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon?: React.ReactNode;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-3 rounded-xl border text-sm font-medium transition-all inline-flex items-center justify-center gap-2 ${
        active
          ? "bg-ink text-cream border-ink shadow-soft"
          : "bg-cream text-graphite border-ink/10 hover:border-copper/40"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

function Metric({
  label,
  value,
  icon,
  hint,
  copper,
}: {
  label: string;
  value: string;
  icon?: React.ReactNode;
  hint?: string;
  copper?: boolean;
}) {
  return (
    <div>
      <div className="flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-eyebrow text-muted">
        {icon}
        {label}
      </div>
      <div
        className={`mt-2 font-display text-3xl lg:text-4xl tracking-tight ${
          copper ? "text-copper" : "text-ink"
        }`}
      >
        {value}
      </div>
      {hint && <div className="mt-1 text-[11px] text-muted">{hint}</div>}
    </div>
  );
}

function ScenarioCard({ scenario }: { scenario: ScenarioResult }) {
  const Icon = SCENARIO_ICONS[scenario.id];
  const ctaHref = SCENARIO_HREF[scenario.id];

  if (!scenario.applicable) {
    return (
      <div className="rounded-3xl border border-ink/10 bg-white p-6 lg:p-7 opacity-90">
        <div className="flex items-start gap-4">
          <span className="grid place-items-center h-12 w-12 rounded-full bg-ink/5 border border-ink/10 shrink-0">
            <Icon className="h-5 w-5 text-graphite" />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h3 className="font-display text-xl text-ink tracking-tight">
                {scenario.label}
              </h3>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-ink/5 border border-ink/15 text-[10px] font-mono uppercase tracking-eyebrow text-muted">
                <AlertCircle className="h-3 w-3" />
                Non applicable
              </span>
            </div>
            <p className="mt-1.5 text-sm text-graphite leading-relaxed">
              {scenario.notes[0]}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-3xl border border-ink/10 bg-white p-6 lg:p-8 hover:border-copper/40 hover:shadow-lift transition-all">
      <div className="flex items-start gap-4 mb-5">
        <span className="grid place-items-center h-12 w-12 rounded-full bg-copper/12 border border-copper/30 shrink-0">
          <Icon className="h-5 w-5 text-copper" />
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="font-display text-2xl text-ink tracking-tight">{scenario.label}</h3>
          <p className="mt-1 text-sm text-graphite leading-relaxed">{scenario.description}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-5 gap-y-4 pt-5 border-t border-ink/8">
        <div>
          <div className="text-[10px] font-mono uppercase tracking-eyebrow text-muted">
            Économie / an
          </div>
          <div className="mt-1.5 font-display text-2xl text-gain">
            {scenario.annualSavings.toLocaleString("fr-LU")} €
          </div>
        </div>
        <div>
          <div className="text-[10px] font-mono uppercase tracking-eyebrow text-muted">
            CO₂ évité
          </div>
          <div className="mt-1.5 font-display text-2xl text-ink">
            {scenario.co2Saved.toLocaleString("fr-LU")} kg
          </div>
        </div>
        <div>
          <div className="text-[10px] font-mono uppercase tracking-eyebrow text-muted">
            Investissement net
          </div>
          <div className="mt-1.5 font-display text-2xl text-ink">
            {scenario.netInvestment.toLocaleString("fr-LU")} €
          </div>
          <div className="text-[11px] text-muted">
            Klimabonus :{" "}
            <span className="text-gain font-semibold">
              {scenario.klimabonus.toLocaleString("fr-LU")} €
            </span>
          </div>
        </div>
        <div>
          <div className="text-[10px] font-mono uppercase tracking-eyebrow text-muted">
            ROI
          </div>
          <div className="mt-1.5 font-display text-2xl text-gain">
            {isFinite(scenario.paybackYears) ? `${scenario.paybackYears} ans` : "—"}
          </div>
        </div>
      </div>

      <details className="mt-5 group">
        <summary className="cursor-pointer text-[11px] font-mono uppercase tracking-eyebrow text-graphite hover:text-copper transition-colors inline-flex items-center gap-1.5">
          <Info className="h-3 w-3" />
          Hypothèses du calcul
        </summary>
        <ul className="mt-3 space-y-1.5 pl-4 text-xs text-graphite">
          {scenario.notes.map((n, i) => (
            <li key={i} className="flex items-start gap-2">
              <Check className="h-3 w-3 text-copper mt-0.5 shrink-0" />
              <span>{n}</span>
            </li>
          ))}
        </ul>
      </details>

      <div className="mt-5 pt-5 border-t border-ink/8 flex flex-wrap items-center justify-between gap-3">
        <div className="text-xs text-muted">
          Investissement brut :{" "}
          <span className="text-perte font-semibold">
            {scenario.investment.toLocaleString("fr-LU")} €
          </span>
        </div>
        <Link
          href={ctaHref}
          className="inline-flex items-center gap-2 rounded-full bg-ink text-cream px-4 py-2.5 text-xs font-mono uppercase tracking-eyebrow hover:bg-copper transition-colors group"
        >
          Étudier ce scénario
          <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
        </Link>
      </div>
    </div>
  );
}
