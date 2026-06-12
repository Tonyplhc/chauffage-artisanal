"use client";

/**
 * Calculateur public de déperditions thermiques et dimensionnement.
 *
 * Outil pédagogique pour aider les visiteurs à estimer leurs besoins de
 * chauffage et l'intérêt d'une bascule vers une PAC. Toujours indicatif —
 * un devis détaillé reste nécessaire.
 */

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  Thermometer,
  Flame,
  Leaf,
  Zap,
  ArrowRight,
  Calculator,
  Snowflake,
  Home,
  Info,
} from "lucide-react";
import {
  computeHeatLoss,
  ISOLATION_COEFFICIENTS,
  type IsolationLevel,
  type EnergySource,
} from "@/lib/heat-loss";

const ENERGY_LABELS: Record<EnergySource, string> = {
  fioul: "Fioul",
  gaz: "Gaz",
  electrique: "Électrique",
  bois: "Bois / pellets",
  pac: "Pompe à chaleur",
  inconnu: "Je ne sais pas",
};

function formatEur(v: number | null) {
  if (v === null) return "—";
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(v);
}

export default function CalculateurPage() {
  const [surface, setSurface] = useState(140);
  const [height, setHeight] = useState(2.5);
  const [isolation, setIsolation] = useState<IsolationLevel>("good");
  const [withDhw, setWithDhw] = useState(true);
  const [occupants, setOccupants] = useState(4);
  const [currentEnergy, setCurrentEnergy] = useState<EnergySource>("gaz");
  const [targetEnergy, setTargetEnergy] = useState<EnergySource>("pac");

  const result = useMemo(
    () =>
      computeHeatLoss({
        surfaceM2: surface,
        ceilingHeightM: height,
        isolation,
        withDhw,
        occupants,
        currentEnergy,
        targetEnergy,
      }),
    [surface, height, isolation, withDhw, occupants, currentEnergy, targetEnergy],
  );

  return (
    <div className="bg-creme min-h-screen">
      <section className="pt-16 lg:pt-24 pb-12">
        <div className="container max-w-4xl">
          <div className="inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-eyebrow text-bleu bg-bleu/10 border border-bleu/20 px-3 py-1 rounded-full mb-4">
            <Calculator className="h-3 w-3" />
            Outil de pré-dimensionnement
          </div>
          <h1 className="font-display text-display-md lg:text-display-lg text-anthra">
            Quelle puissance de chauffage pour votre maison ?
          </h1>
          <p className="mt-4 text-taupe max-w-2xl">
            Estimez vos déperditions thermiques et la puissance de chaudière ou
            de pompe à chaleur recommandée. Outil indicatif — un bilan
            thermique complet reste nécessaire pour un devis précis.
          </p>
        </div>
      </section>

      <section className="pb-24">
        <div className="container max-w-5xl">
          <div className="grid lg:grid-cols-12 gap-6">
            {/* Form */}
            <div className="lg:col-span-7 rounded-3xl border border-pierre bg-white shadow-soft p-6 lg:p-8">
              <div className="grid gap-5">
                <Field
                  label="Surface habitable"
                  hint="m² chauffés"
                  icon={<Home className="h-4 w-4" />}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="range"
                      min={40}
                      max={400}
                      step={5}
                      value={surface}
                      onChange={(e) => setSurface(Number(e.target.value))}
                      className="flex-1"
                    />
                    <span className="font-display text-2xl tabular-nums text-anthra min-w-[80px] text-right">
                      {surface} m²
                    </span>
                  </div>
                </Field>

                <Field
                  label="Hauteur sous plafond"
                  hint="moyenne"
                  icon={<Home className="h-4 w-4" />}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="range"
                      min={2.2}
                      max={3.5}
                      step={0.1}
                      value={height}
                      onChange={(e) => setHeight(Number(e.target.value))}
                      className="flex-1"
                    />
                    <span className="font-mono text-lg text-anthra min-w-[80px] text-right">
                      {height.toFixed(1)} m
                    </span>
                  </div>
                </Field>

                <Field
                  label="Niveau d'isolation"
                  icon={<Snowflake className="h-4 w-4" />}
                >
                  <div className="grid gap-1.5">
                    {(
                      Object.keys(ISOLATION_COEFFICIENTS) as IsolationLevel[]
                    ).map((k) => {
                      const cfg = ISOLATION_COEFFICIENTS[k];
                      return (
                        <button
                          key={k}
                          onClick={() => setIsolation(k)}
                          className={`text-left px-3 py-2 rounded-xl border transition-colors ${
                            isolation === k
                              ? "border-bleu bg-bleu/8"
                              : "border-pierre bg-creme hover:border-bleu/40"
                          }`}
                        >
                          <div className="text-sm font-medium text-anthra">
                            {cfg.label}
                          </div>
                          <div className="text-[11px] text-muted">
                            {cfg.period} · G = {cfg.g}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </Field>

                <Field
                  label="Énergie actuelle"
                  hint="pour estimer les économies"
                  icon={<Flame className="h-4 w-4" />}
                >
                  <select
                    value={currentEnergy}
                    onChange={(e) =>
                      setCurrentEnergy(e.target.value as EnergySource)
                    }
                    className="w-full bg-creme border border-pierre rounded-xl px-3 py-2.5 text-sm focus:border-bleu focus:outline-none"
                  >
                    {Object.entries(ENERGY_LABELS).map(([k, label]) => (
                      <option key={k} value={k}>
                        {label}
                      </option>
                    ))}
                  </select>
                </Field>

                <Field
                  label="Énergie cible (projet)"
                  icon={<Leaf className="h-4 w-4" />}
                >
                  <select
                    value={targetEnergy}
                    onChange={(e) =>
                      setTargetEnergy(e.target.value as EnergySource)
                    }
                    className="w-full bg-creme border border-pierre rounded-xl px-3 py-2.5 text-sm focus:border-bleu focus:outline-none"
                  >
                    <option value="pac">Pompe à chaleur</option>
                    <option value="gaz">Gaz à condensation</option>
                    <option value="bois">Bois / pellets</option>
                    <option value="electrique">Électrique</option>
                  </select>
                </Field>

                <Field
                  label="Eau chaude sanitaire"
                  icon={<Zap className="h-4 w-4" />}
                >
                  <div className="flex items-center gap-2">
                    <label className="inline-flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={withDhw}
                        onChange={(e) => setWithDhw(e.target.checked)}
                      />
                      <span className="text-sm text-anthra">
                        Inclure la production ECS
                      </span>
                    </label>
                    {withDhw && (
                      <div className="ml-auto flex items-center gap-2 text-sm text-taupe">
                        <span className="font-mono">{occupants}</span>
                        <span>personnes</span>
                        <input
                          type="range"
                          min={1}
                          max={8}
                          value={occupants}
                          onChange={(e) =>
                            setOccupants(Number(e.target.value))
                          }
                          className="w-24"
                        />
                      </div>
                    )}
                  </div>
                </Field>
              </div>
            </div>

            {/* Result */}
            <div className="lg:col-span-5 grid gap-4">
              <div className="rounded-3xl bg-navy text-creme p-6 shadow-lift">
                <div className="font-mono text-[10px] uppercase tracking-eyebrow text-bleu">
                  Puissance recommandée
                </div>
                <div className="mt-2 font-display text-5xl tabular-nums">
                  {result.totalKW} kW
                </div>
                <div className="text-xs text-creme/70 mt-2">
                  Dont {result.recommendedKW} kW chauffage
                  {result.dhwKW > 0 && (
                    <> · {result.dhwKW} kW ECS</>
                  )}
                </div>
                <div className="mt-4 pt-4 border-t border-creme/15 text-xs text-creme/80 grid gap-1">
                  <div className="flex justify-between">
                    <span>Volume chauffé</span>
                    <span className="font-mono">{result.volumeM3} m³</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Déperditions</span>
                    <span className="font-mono">
                      {result.heatLossW.toLocaleString("fr-FR")} W
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>ΔT base</span>
                    <span className="font-mono">{result.deltaT} °C</span>
                  </div>
                </div>
              </div>

              {result.savingsEur !== null && (
                <div
                  className={`rounded-3xl border p-6 shadow-soft ${
                    result.savingsEur > 0
                      ? "bg-[#2E7D5A]/8 border-[#2E7D5A]/30"
                      : "bg-creme border-pierre"
                  }`}
                >
                  <div className="font-mono text-[10px] uppercase tracking-eyebrow text-bleu mb-1">
                    Économies projetées / an
                  </div>
                  <div
                    className={`font-display text-3xl tabular-nums ${
                      result.savingsEur > 0 ? "text-[#2E7D5A]" : "text-anthra"
                    }`}
                  >
                    {result.savingsEur > 0 ? "+" : ""}
                    {formatEur(result.savingsEur)}
                  </div>
                  <div className="text-xs text-taupe mt-2 grid gap-1">
                    <div className="flex justify-between">
                      <span>Coût actuel ({ENERGY_LABELS[currentEnergy]})</span>
                      <span className="font-mono">
                        {formatEur(result.currentAnnualCostEur)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Coût cible ({ENERGY_LABELS[targetEnergy]})</span>
                      <span className="font-mono">
                        {formatEur(result.targetAnnualCostEur)}
                      </span>
                    </div>
                  </div>
                  {result.co2SavedKgPerYear && result.co2SavedKgPerYear > 0 && (
                    <div className="mt-3 pt-3 border-t border-pierre text-[11px] text-taupe inline-flex items-center gap-1">
                      <Leaf className="h-3 w-3 text-[#2E7D5A]" />
                      ~{Math.round(result.co2SavedKgPerYear).toLocaleString("fr-FR")}{" "}
                      kg CO₂ évités / an
                    </div>
                  )}
                </div>
              )}

              <div className="rounded-3xl border border-bleu/30 bg-bleu/5 p-5">
                <div className="font-mono text-[10px] uppercase tracking-eyebrow text-bleu mb-2 inline-flex items-center gap-1">
                  <Info className="h-3 w-3" />
                  Méthode
                </div>
                <p className="text-xs text-taupe leading-relaxed">
                  Calcul simplifié : Volume × G × ΔT. Le coefficient G dépend
                  de l&apos;isolation (voir norme). Pour un dimensionnement
                  réel, on procède à une étude par paroi avec valeurs U et
                  ponts thermiques. Tarifs énergie indicatifs Luxembourg, à
                  affiner.
                </p>
              </div>

              <Link
                href={`/devis?from=deperditions&service=${targetEnergy === "pac" ? "pac" : "chauffage"}&surface=${surface}&energie=${currentEnergy}`}
                className="rounded-3xl bg-bleu text-creme p-6 shadow-soft text-center hover:bg-terracotta transition-colors group"
              >
                <Thermometer className="h-7 w-7 mx-auto mb-2" />
                <div className="font-display text-xl">
                  Demander un devis détaillé
                </div>
                <p className="text-xs text-creme/80 mt-1">
                  Bilan thermique précis sous 24 h
                </p>
                <span className="mt-3 inline-flex items-center gap-1 text-xs font-mono">
                  Continuer
                  <ArrowRight className="h-3 w-3 group-hover:translate-x-1 transition-transform" />
                </span>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function Field({
  label,
  hint,
  icon,
  children,
}: {
  label: string;
  hint?: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="font-mono text-[10px] uppercase tracking-eyebrow text-muted mb-1.5 flex items-center gap-1.5">
        {icon}
        {label}
        {hint && <span className="text-muted/70 normal-case">· {hint}</span>}
      </label>
      {children}
    </div>
  );
}
