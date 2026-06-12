"use client";

/**
 * Calculateur d'autoconsommation photovoltaïque — outil d'orientation.
 *
 * Discipline éditoriale stricte :
 *   - Aucune promesse de rentabilité chiffrée précise (les tarifs et primes
 *     évoluent trop vite).
 *   - On sort des ordres de grandeur qualitatifs (kWh/an, % autoconso) basés
 *     sur des moyennes du secteur publié.
 *   - Toujours assorti d'une recommandation : "vérification précise à faire
 *     en étude personnalisée".
 *
 * Hypothèses simplifiées du modèle (calibrées sur ordres de grandeur LU/EU) :
 *   - Production : ~950 kWh/an par kWc en moyenne au Luxembourg
 *   - Autoconso sans PAC ni stockage : ~30%
 *   - Autoconso avec PAC seule : ~45%
 *   - Autoconso avec PAC + stockage : ~70%
 *   - 1 kWc ≈ 5-6 m² de panneaux modernes (monocristallin)
 */

import { useState, useMemo } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Sun,
  Zap,
  Battery,
  Leaf,
  ArrowUpRight,
  Info,
} from "lucide-react";
import { Eyebrow, Reveal, SectionTitle } from "@/components/ui";

const PROD_PER_KWC = 950; // kWh/an au Luxembourg, ordre de grandeur

type AutoconsoBaseline = {
  label: string;
  rate: number; // % autoconso 0..1
};

const BASELINES: Record<string, AutoconsoBaseline> = {
  pv_only: { label: "PV seul", rate: 0.3 },
  pv_pac: { label: "PV + pompe à chaleur", rate: 0.45 },
  pv_pac_battery: { label: "PV + PAC + stockage batterie", rate: 0.7 },
};

export function PVAutoconsumptionCalculator() {
  const [kwc, setKwc] = useState<number>(6);
  const [annualConsumption, setAnnualConsumption] = useState<number>(5000);
  const [scenario, setScenario] = useState<keyof typeof BASELINES>("pv_pac");

  const results = useMemo(() => {
    const annualProduction = Math.round(kwc * PROD_PER_KWC);
    const baseline = BASELINES[scenario];
    const autoconsommedKwh = Math.round(
      Math.min(annualProduction, annualConsumption * baseline.rate * 2), // cap par prod
    );
    const realAutoconsoRate = annualProduction > 0
      ? Math.min(1, autoconsommedKwh / annualProduction)
      : 0;
    const consumptionCoveredRate = annualConsumption > 0
      ? Math.min(1, autoconsommedKwh / annualConsumption)
      : 0;
    const surplusKwh = Math.max(0, annualProduction - autoconsommedKwh);
    const panelSurfaceM2 = Math.round(kwc * 5.5);
    return {
      annualProduction,
      autoconsommedKwh,
      realAutoconsoRate,
      consumptionCoveredRate,
      surplusKwh,
      panelSurfaceM2,
      baseline,
    };
  }, [kwc, annualConsumption, scenario]);

  const verdict = getVerdict(results.consumptionCoveredRate, results.realAutoconsoRate);

  return (
    <section className="py-14 lg:py-20 bg-cream border-y border-ink/8">
      <div className="container">
        <div className="max-w-3xl mb-10">
          <Eyebrow number="05">Simulateur autoconsommation</Eyebrow>
          <Reveal>
            <SectionTitle className="mt-4">
              Que peut produire <em className="not-italic text-copper">votre toiture</em> ?
            </SectionTitle>
          </Reveal>
          <Reveal delay={1}>
            <p className="mt-5 text-graphite leading-relaxed">
              Estimation d&apos;ordre de grandeur — un audit énergétique reste
              indispensable pour chiffrer précisément votre projet.
            </p>
          </Reveal>
        </div>

        <div className="grid lg:grid-cols-12 gap-6">
          {/* Sliders */}
          <div className="lg:col-span-5 p-6 lg:p-8 rounded-3xl border border-ink/10 bg-white shadow-soft">
            <div className="font-mono text-[10px] uppercase tracking-eyebrow text-copper mb-5">
              Vos paramètres
            </div>

            <SliderInput
              icon={Sun}
              label="Puissance installée"
              value={kwc}
              setValue={setKwc}
              min={2}
              max={20}
              step={0.5}
              unit="kWc"
              hint={`Équivaut à ~${results.panelSurfaceM2} m² de panneaux`}
            />

            <div className="mt-7">
              <SliderInput
                icon={Zap}
                label="Consommation annuelle du logement"
                value={annualConsumption}
                setValue={setAnnualConsumption}
                min={2000}
                max={20000}
                step={500}
                unit="kWh/an"
                hint="Visible sur votre dernière facture annuelle"
              />
            </div>

            <div className="mt-7">
              <div className="font-mono text-[10px] uppercase tracking-eyebrow text-muted mb-3">
                Architecture
              </div>
              <div className="grid gap-2">
                {(Object.keys(BASELINES) as Array<keyof typeof BASELINES>).map((k) => (
                  <button
                    key={k}
                    onClick={() => setScenario(k)}
                    className={`text-left px-4 py-3 rounded-xl border transition-all flex items-center justify-between gap-3 ${
                      scenario === k
                        ? "border-copper bg-copper/8"
                        : "border-ink/10 bg-cream hover:border-copper/40"
                    }`}
                  >
                    <span className="flex items-center gap-3">
                      {k === "pv_only" ? (
                        <Sun className="h-4 w-4 text-copper" />
                      ) : k === "pv_pac" ? (
                        <Leaf className="h-4 w-4 text-copper" />
                      ) : (
                        <Battery className="h-4 w-4 text-copper" />
                      )}
                      <span className="text-sm text-ink font-medium">
                        {BASELINES[k].label}
                      </span>
                    </span>
                    <span className="font-mono text-xs text-muted tabular-nums">
                      ~{Math.round(BASELINES[k].rate * 100)}%
                    </span>
                  </button>
                ))}
              </div>
              <p className="mt-3 text-xs text-muted leading-relaxed">
                Le couplage PAC + stockage maximise l&apos;autoconsommation : la
                PAC tourne quand le PV produit, le stockage absorbe le surplus.
              </p>
            </div>
          </div>

          {/* Résultats */}
          <div className="lg:col-span-7 grid gap-4 content-start">
            {/* Verdict */}
            <motion.div
              key={verdict.headline}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="p-6 lg:p-8 rounded-3xl border bg-white shadow-soft"
              style={{ borderColor: verdict.borderColor }}
            >
              <div className="flex items-start gap-4">
                <span
                  className="h-11 w-11 rounded-full grid place-items-center shrink-0"
                  style={{ background: verdict.bgColor, color: verdict.color }}
                >
                  <Sun className="h-5 w-5" />
                </span>
                <div>
                  <div
                    className="font-mono text-[10px] uppercase tracking-eyebrow"
                    style={{ color: verdict.color }}
                  >
                    Verdict d&apos;orientation
                  </div>
                  <p className="mt-2 text-base lg:text-lg text-ink leading-snug">
                    {verdict.headline}
                  </p>
                </div>
              </div>
            </motion.div>

            {/* KPIs grid */}
            <div className="grid sm:grid-cols-2 gap-4">
              <KpiTile
                label="Production estimée"
                value={`${results.annualProduction.toLocaleString("fr-FR")} kWh`}
                sub="par an, ordre de grandeur"
                accent="copper"
              />
              <KpiTile
                label="Autoconsommée"
                value={`${results.autoconsommedKwh.toLocaleString("fr-FR")} kWh`}
                sub={`${Math.round(results.realAutoconsoRate * 100)}% de la production`}
                accent="green"
              />
              <KpiTile
                label="Couverture conso"
                value={`${Math.round(results.consumptionCoveredRate * 100)}%`}
                sub={`sur ${annualConsumption.toLocaleString("fr-FR")} kWh annuels`}
                accent="copper"
              />
              <KpiTile
                label="Surplus injecté"
                value={`${results.surplusKwh.toLocaleString("fr-FR")} kWh`}
                sub="rachat encadré selon contrat"
                accent="muted"
              />
            </div>

            {/* CTA */}
            <div className="p-5 lg:p-6 rounded-2xl border border-ink/10 bg-charcoal text-cream">
              <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                <div>
                  <div className="font-mono text-[10px] uppercase tracking-eyebrow text-copper">
                    Étape suivante
                  </div>
                  <div className="mt-1.5 font-display text-lg text-cream">
                    Vérifions ces chiffres sur votre toiture.
                  </div>
                  <p className="mt-1 text-sm text-cream/70 max-w-xl">
                    Audit énergétique, étude d&apos;ombrage, dimensionnement précis.
                  </p>
                </div>
                <Link
                  href="/devis?from=pv-autoconso&service=enr"
                  className="inline-flex items-center gap-2 rounded-full bg-cream text-charcoal px-5 py-3 text-sm font-medium hover:bg-copper hover:text-cream transition-colors shrink-0"
                >
                  Demander une étude
                  <ArrowUpRight className="h-4 w-4" />
                </Link>
              </div>
            </div>

            {/* Disclaimer */}
            <div className="p-4 rounded-xl bg-ember/5 border border-ember/30 flex items-start gap-3 text-xs text-graphite">
              <Info className="h-4 w-4 text-ember shrink-0 mt-0.5" />
              <span>
                Estimations d&apos;ordre de grandeur basées sur des moyennes du secteur
                (≈ 950 kWh/an par kWc au Luxembourg). Les performances réelles dépendent
                de l&apos;orientation, l&apos;inclinaison, l&apos;ombrage et la
                technologie retenue.
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function SliderInput({
  icon: Icon,
  label,
  value,
  setValue,
  min,
  max,
  step,
  unit,
  hint,
}: {
  icon: typeof Sun;
  label: string;
  value: number;
  setValue: (v: number) => void;
  min: number;
  max: number;
  step: number;
  unit: string;
  hint?: string;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span className="font-mono text-[10px] uppercase tracking-eyebrow text-muted inline-flex items-center gap-2">
          <Icon className="h-3.5 w-3.5 text-copper" />
          {label}
        </span>
        <span className="font-display text-xl text-copper tabular-nums">
          {value.toLocaleString("fr-FR")} {unit}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => setValue(Number(e.target.value))}
        className="w-full accent-copper cursor-pointer"
      />
      {hint && <div className="mt-1.5 text-xs text-muted">{hint}</div>}
    </div>
  );
}

function KpiTile({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: string;
  sub: string;
  accent: "copper" | "green" | "muted";
}) {
  const accentClass =
    accent === "green"
      ? "text-[#22a06b]"
      : accent === "muted"
      ? "text-graphite"
      : "text-copper";
  return (
    <div className="p-5 rounded-2xl border border-ink/10 bg-white">
      <div className="font-mono text-[10px] uppercase tracking-eyebrow text-muted">
        {label}
      </div>
      <div className={`mt-2 font-display text-2xl lg:text-3xl ${accentClass} tabular-nums`}>
        {value}
      </div>
      <div className="mt-1 text-xs text-muted">{sub}</div>
    </div>
  );
}

function getVerdict(
  coveredRate: number,
  autoconsoRate: number,
): { headline: string; color: string; bgColor: string; borderColor: string } {
  if (coveredRate >= 0.6) {
    return {
      headline:
        "Votre installation pourrait couvrir une part majeure de vos besoins — architecture très pertinente.",
      color: "#22a06b",
      bgColor: "rgba(34,160,107,0.12)",
      borderColor: "rgba(34,160,107,0.4)",
    };
  }
  if (coveredRate >= 0.3) {
    return {
      headline:
        "Architecture cohérente — couverture significative, surplus injecté à valoriser.",
      color: "#b86a36",
      bgColor: "rgba(184,106,54,0.12)",
      borderColor: "rgba(184,106,54,0.4)",
    };
  }
  return {
    headline:
      "Production probablement insuffisante pour ce profil de consommation — revoir la puissance installée ou ajouter du stockage.",
    color: "#dc5a28",
    bgColor: "rgba(220,90,40,0.12)",
    borderColor: "rgba(220,90,40,0.4)",
  };
}
