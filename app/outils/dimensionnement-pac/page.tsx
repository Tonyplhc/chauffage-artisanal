"use client";

/**
 * Calculateur public de dimensionnement PAC.
 *
 * Outil pédagogique pour estimer la puissance d'une pompe à chaleur selon
 * surface, isolation et type de PAC. Méthode transparente détaillée en bas
 * de page. Ne se substitue pas à un audit thermique professionnel.
 */

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  Calculator,
  Flame,
  Snowflake,
  Info,
  ArrowRight,
  Zap,
} from "lucide-react";
import {
  calculatePacSizing,
  ISOLATION_G,
  ISOLATION_LABELS,
  PAC_SCOP,
  type IsolationLevel,
  type PacType,
} from "@/lib/pac-sizing";

export default function PacSizingPage() {
  const [surface, setSurface] = useState(150);
  const [ceiling, setCeiling] = useState(2.5);
  const [isolation, setIsolation] = useState<IsolationLevel>("renov-complete");
  const [pacType, setPacType] = useState<PacType>("air-eau");

  const result = useMemo(
    () =>
      calculatePacSizing({
        surface,
        ceilingHeight: ceiling,
        isolation,
        pacType,
      }),
    [surface, ceiling, isolation, pacType],
  );

  return (
    <div className="min-h-screen bg-cream py-12 lg:py-16">
      <div className="container max-w-5xl">
        <div className="mb-8">
          <Link
            href="/"
            className="text-xs font-mono uppercase tracking-eyebrow text-graphite hover:text-copper"
          >
            ← Retour accueil
          </Link>
          <h1 className="mt-4 font-display text-display-md text-ink">
            Dimensionnement pompe à chaleur
          </h1>
          <p className="mt-2 text-graphite max-w-2xl">
            Estimez la puissance PAC adaptée à votre bâtiment. Méthode
            simplifiée mais transparente, calibrée pour le climat luxembourgeois.
            Pour un dimensionnement officiel, demandez un{" "}
            <Link href="/devis" className="text-copper underline">
              audit technique
            </Link>
            .
          </p>
        </div>

        <div className="grid lg:grid-cols-5 gap-6">
          {/* Inputs */}
          <div className="lg:col-span-2 space-y-4">
            <div className="rounded-2xl border border-ink/10 bg-white shadow-soft p-5">
              <div className="font-mono text-[10px] uppercase tracking-eyebrow text-copper mb-3">
                Votre bâtiment
              </div>

              <Field label={`Surface chauffée : ${surface} m²`}>
                <input
                  type="range"
                  min="40"
                  max="500"
                  step="5"
                  value={surface}
                  onChange={(e) => setSurface(Number(e.target.value))}
                  className="w-full accent-copper"
                />
              </Field>

              <Field label={`Hauteur sous plafond : ${ceiling.toFixed(1)} m`}>
                <input
                  type="range"
                  min="2.2"
                  max="4.0"
                  step="0.1"
                  value={ceiling}
                  onChange={(e) => setCeiling(Number(e.target.value))}
                  className="w-full accent-copper"
                />
              </Field>

              <Field label="Niveau d'isolation">
                <select
                  value={isolation}
                  onChange={(e) =>
                    setIsolation(e.target.value as IsolationLevel)
                  }
                  className="w-full bg-cream border border-ink/12 rounded-lg px-3 py-2 text-sm focus:border-copper focus:outline-none"
                >
                  {Object.entries(ISOLATION_LABELS).map(([k, v]) => (
                    <option key={k} value={k}>
                      {v} (G = {ISOLATION_G[k as IsolationLevel]})
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Type de PAC envisagée">
                <div className="grid grid-cols-3 gap-2">
                  {(Object.keys(PAC_SCOP) as PacType[]).map((t) => (
                    <button
                      key={t}
                      onClick={() => setPacType(t)}
                      className={`rounded-lg border px-2 py-2 text-xs transition-colors ${
                        pacType === t
                          ? "bg-ink text-cream border-ink"
                          : "bg-cream border-ink/12 text-graphite hover:border-copper/40"
                      }`}
                    >
                      {PAC_SCOP[t].label}
                    </button>
                  ))}
                </div>
              </Field>
            </div>

            <div className="rounded-2xl border border-copper/30 bg-copper/5 p-5 text-xs text-graphite">
              <Info className="h-4 w-4 text-copper mb-2" />
              <p>
                Méthode : <span className="font-mono">P = V × G × ΔT</span>{" "}
                avec V = surface × hauteur, G coefficient de déperdition, ΔT
                écart température (30 K Lux). Marge de sécurité 15% appliquée.
              </p>
            </div>
          </div>

          {/* Results */}
          <div className="lg:col-span-3 space-y-4">
            <div className="rounded-2xl border border-ink/10 bg-white shadow-soft p-5">
              <div className="font-mono text-[10px] uppercase tracking-eyebrow text-copper mb-4">
                Estimation
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Kpi
                  label="Puissance requise"
                  value={`${result.requiredPowerKw} kW`}
                  hint="Pour maintenir 20°C par −10°C extérieur"
                  icon={Flame}
                />
                <Kpi
                  label="PAC recommandée"
                  value={`${result.recommendedPacKw} kW`}
                  hint="Avec marge sécurité 15%"
                  icon={Snowflake}
                  color="#22a06b"
                />
                <Kpi
                  label="SCOP attendu"
                  value={`${result.expectedScop.min} – ${result.expectedScop.max}`}
                  hint={`Moyen ${result.expectedScop.mid.toFixed(1)} en climat Lux`}
                />
                <Kpi
                  label="Conso électrique estimée"
                  value={`${(result.estimatedAnnualKwh / 1000).toFixed(1)} MWh/an`}
                  hint={`${result.annualOperatingHours} h équivalentes pleine puissance`}
                  icon={Zap}
                />
              </div>
            </div>

            <div className="rounded-2xl border border-ink/10 bg-white shadow-soft p-5">
              <div className="font-mono text-[10px] uppercase tracking-eyebrow text-copper mb-3">
                Détail du calcul
              </div>
              <table className="w-full text-sm">
                <tbody className="divide-y divide-ink/5">
                  <Row label="Volume chauffé" value={`${result.volume} m³`} />
                  <Row
                    label="Coefficient G (déperdition)"
                    value={`${result.gCoefficient} W/m³.K`}
                  />
                  <Row label="ΔT base Luxembourg" value={`${result.deltaT} K`} />
                  <Row
                    label="Puissance thermique brute"
                    value={`${result.requiredPowerKw} kW`}
                  />
                  <Row
                    label="Avec marge 15%"
                    value={`${result.recommendedPacKw} kW`}
                  />
                </tbody>
              </table>
            </div>

            {result.notes.length > 0 && (
              <div className="rounded-2xl border border-ember/20 bg-ember/5 p-5">
                <div className="font-mono text-[10px] uppercase tracking-eyebrow text-ember mb-2">
                  Conseils
                </div>
                <ul className="space-y-1.5 text-sm text-graphite">
                  {result.notes.map((n, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-ember mt-1.5 inline-block h-1 w-1 rounded-full bg-ember shrink-0" />
                      <span>{n}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="rounded-2xl border border-ink/10 bg-ink/5 p-5 flex items-center justify-between gap-3 flex-wrap">
              <div>
                <div className="font-display text-base text-ink">
                  Besoin d&apos;un dimensionnement précis ?
                </div>
                <p className="text-sm text-graphite mt-1">
                  Notre équipe se déplace pour un audit complet et un devis
                  chiffré.
                </p>
              </div>
              <Link
                href="/devis"
                className="inline-flex items-center gap-2 rounded-full bg-ink text-cream px-4 py-2 text-sm hover:bg-copper transition-colors"
              >
                Demander un devis
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        </div>

        <div className="mt-10 text-xs text-muted max-w-3xl">
          <p>
            <strong>Limites de l&apos;outil</strong> — Estimation simplifiée
            ne tenant pas compte des apports solaires, des occupants, de
            l&apos;eau chaude sanitaire, ni du bilan thermique pièce par pièce.
            Pour un dimensionnement officiel conforme aux normes RT2012 /
            RT2020 / Klimabonus, faire réaliser un audit thermique
            professionnel.
          </p>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-3">
      <div className="text-xs text-graphite mb-1">{label}</div>
      {children}
    </div>
  );
}

function Kpi({
  label,
  value,
  hint,
  color,
  icon: Icon,
}: {
  label: string;
  value: string;
  hint?: string;
  color?: string;
  icon?: typeof Flame;
}) {
  return (
    <div className="rounded-xl bg-cream/40 p-3">
      <div
        className="font-mono text-[10px] uppercase tracking-eyebrow inline-flex items-center gap-1.5"
        style={{ color: color ?? "#8b847a" }}
      >
        {Icon && <Icon className="h-3 w-3" />}
        {label}
      </div>
      <div
        className="mt-1 font-display text-xl tabular-nums"
        style={{ color: color ?? "#1e1a15" }}
      >
        {value}
      </div>
      {hint && <div className="text-[11px] text-muted mt-0.5">{hint}</div>}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <tr>
      <td className="py-2 text-graphite">{label}</td>
      <td className="py-2 text-right font-mono text-ink tabular-nums">
        {value}
      </td>
    </tr>
  );
}
