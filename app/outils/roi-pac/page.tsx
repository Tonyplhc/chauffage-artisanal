"use client";

/**
 * Simulateur ROI 20 ans : PAC air/eau vs chaudière gaz.
 *
 * Pédagogique : montre le coût cumulé année par année, l'année de break-even,
 * et l'économie totale sur 20 ans. Toutes les hypothèses sont visibles et
 * modifiables.
 */

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  TrendingUp,
  Info,
  Flame,
  Snowflake,
  ArrowRight,
  Settings2,
} from "lucide-react";
import { simulateRoi } from "@/lib/roi-simulator";
import { formatEur } from "@/lib/formatters";

export default function RoiPacPage() {
  const [annualKwh, setAnnualKwh] = useState(18000);
  const [gasInitial, setGasInitial] = useState(6000);
  const [pacInitial, setPacInitial] = useState(20000);
  const [klima, setKlima] = useState(6000);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const [gasPrice, setGasPrice] = useState(0.11);
  const [elecPrice, setElecPrice] = useState(0.22);
  const [scop, setScop] = useState(3.5);
  const [inflation, setInflation] = useState(3);

  const result = useMemo(
    () =>
      simulateRoi({
        annualKwhNeeds: annualKwh,
        gasInitialCost: gasInitial,
        pacInitialCost: pacInitial,
        klimabonusAid: klima,
        gasPricePerKwh: gasPrice,
        electricityPricePerKwh: elecPrice,
        pacScop: scop,
        energyInflation: inflation / 100,
      }),
    [annualKwh, gasInitial, pacInitial, klima, gasPrice, elecPrice, scop, inflation],
  );

  const maxCumulative = useMemo(() => {
    return Math.max(
      ...result.rows.flatMap((r) => [r.gasCumulative, r.pacCumulative]),
    );
  }, [result.rows]);

  return (
    <div className="min-h-screen bg-cream py-12 lg:py-16">
      <div className="container max-w-6xl">
        <div className="mb-8">
          <Link
            href="/"
            className="text-xs font-mono uppercase tracking-eyebrow text-graphite hover:text-copper"
          >
            ← Retour accueil
          </Link>
          <h1 className="mt-4 font-display text-display-md text-ink">
            ROI sur 20 ans — PAC vs chaudière gaz
          </h1>
          <p className="mt-2 text-graphite max-w-2xl">
            Comparez le coût cumulé d&apos;une chaudière gaz condensation et
            d&apos;une pompe à chaleur air/eau sur 20 ans. Toutes les
            hypothèses sont visibles et modifiables.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Inputs */}
          <div className="space-y-4">
            <div className="rounded-2xl border border-ink/10 bg-white shadow-soft p-5">
              <div className="font-mono text-[10px] uppercase tracking-eyebrow text-copper mb-3">
                Votre projet
              </div>

              <Field label={`Besoins annuels : ${(annualKwh / 1000).toFixed(0)} MWh`}>
                <input
                  type="range"
                  min="6000"
                  max="40000"
                  step="500"
                  value={annualKwh}
                  onChange={(e) => setAnnualKwh(Number(e.target.value))}
                  className="w-full accent-copper"
                />
              </Field>

              <Field label={`Investissement chaudière gaz : ${formatEur(gasInitial)}`}>
                <input
                  type="range"
                  min="2500"
                  max="12000"
                  step="500"
                  value={gasInitial}
                  onChange={(e) => setGasInitial(Number(e.target.value))}
                  className="w-full accent-copper"
                />
              </Field>

              <Field label={`Investissement PAC : ${formatEur(pacInitial)}`}>
                <input
                  type="range"
                  min="10000"
                  max="40000"
                  step="500"
                  value={pacInitial}
                  onChange={(e) => setPacInitial(Number(e.target.value))}
                  className="w-full accent-copper"
                />
              </Field>

              <Field label={`Aide Klimabonus : ${formatEur(klima)}`}>
                <input
                  type="range"
                  min="0"
                  max="15000"
                  step="500"
                  value={klima}
                  onChange={(e) => setKlima(Number(e.target.value))}
                  className="w-full accent-copper"
                />
              </Field>
            </div>

            <button
              onClick={() => setShowAdvanced((s) => !s)}
              className="w-full text-xs text-copper hover:underline text-left inline-flex items-center gap-1"
            >
              <Settings2 className="h-3 w-3" />
              {showAdvanced ? "Masquer" : "Afficher"} les hypothèses avancées
            </button>

            {showAdvanced && (
              <div className="rounded-2xl border border-ink/10 bg-white shadow-soft p-5 text-xs">
                <Field label={`Prix kWh gaz : ${gasPrice.toFixed(2)} €`}>
                  <input
                    type="range"
                    min="0.05"
                    max="0.20"
                    step="0.01"
                    value={gasPrice}
                    onChange={(e) => setGasPrice(Number(e.target.value))}
                    className="w-full accent-copper"
                  />
                </Field>
                <Field label={`Prix kWh élec : ${elecPrice.toFixed(2)} €`}>
                  <input
                    type="range"
                    min="0.15"
                    max="0.35"
                    step="0.01"
                    value={elecPrice}
                    onChange={(e) => setElecPrice(Number(e.target.value))}
                    className="w-full accent-copper"
                  />
                </Field>
                <Field label={`SCOP PAC : ${scop.toFixed(1)}`}>
                  <input
                    type="range"
                    min="2.5"
                    max="4.5"
                    step="0.1"
                    value={scop}
                    onChange={(e) => setScop(Number(e.target.value))}
                    className="w-full accent-copper"
                  />
                </Field>
                <Field label={`Inflation énergie : ${inflation} %/an`}>
                  <input
                    type="range"
                    min="0"
                    max="10"
                    step="0.5"
                    value={inflation}
                    onChange={(e) => setInflation(Number(e.target.value))}
                    className="w-full accent-copper"
                  />
                </Field>
              </div>
            )}
          </div>

          {/* Result */}
          <div className="lg:col-span-2 space-y-4">
            <div className="grid lg:grid-cols-3 gap-3">
              <Kpi
                label="Sur-investissement initial"
                value={formatEur(result.initial.overInvestment)}
                hint={`PAC nette : ${formatEur(result.initial.pacNetCost)}`}
                color={result.initial.overInvestment > 0 ? "#dc5a28" : "#22a06b"}
              />
              <Kpi
                label="Année de break-even"
                value={
                  result.breakEvenYear !== null
                    ? `Année ${result.breakEvenYear}`
                    : "Jamais"
                }
                hint="Quand la PAC devient cumulativement moins chère"
                color={result.breakEvenYear !== null ? "#22a06b" : "#8b847a"}
              />
              <Kpi
                label="Économies 20 ans"
                value={formatEur(result.totalSavings, true)}
                hint={
                  result.totalSavings > 0
                    ? "en faveur de la PAC"
                    : "en faveur du gaz"
                }
                color={result.totalSavings > 0 ? "#22a06b" : "#dc5a28"}
              />
            </div>

            {/* Graph */}
            <div className="rounded-2xl border border-ink/10 bg-white shadow-soft p-5">
              <div className="font-mono text-[10px] uppercase tracking-eyebrow text-copper mb-3">
                Coût cumulé année par année
              </div>
              <div className="flex items-end gap-1 h-48">
                {result.rows.map((r) => {
                  const gasHeight = (r.gasCumulative / maxCumulative) * 100;
                  const pacHeight = (r.pacCumulative / maxCumulative) * 100;
                  const isBreakEven = r.year === result.breakEvenYear;
                  return (
                    <div
                      key={r.year}
                      className="flex-1 flex items-end gap-0.5 relative"
                      title={`Année ${r.year}: gaz ${formatEur(r.gasCumulative, true)}, PAC ${formatEur(r.pacCumulative, true)}`}
                    >
                      <div
                        className="flex-1 bg-ember/60 rounded-t-sm"
                        style={{ height: `${gasHeight}%` }}
                      />
                      <div
                        className="flex-1 bg-[#22a06b]/60 rounded-t-sm"
                        style={{ height: `${pacHeight}%` }}
                      />
                      {isBreakEven && (
                        <div className="absolute -top-3 left-1/2 -translate-x-1/2 text-[8px] font-mono text-copper">
                          ↓
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              <div className="mt-2 flex justify-between text-[10px] font-mono text-muted">
                <span>Année 1</span>
                <span>Année {result.assumptions.years}</span>
              </div>
              <div className="mt-3 flex items-center gap-4 text-[11px]">
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-sm bg-ember/60" />
                  <Flame className="h-3 w-3 text-ember" />
                  Gaz
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-sm bg-[#22a06b]/60" />
                  <Snowflake className="h-3 w-3 text-[#22a06b]" />
                  PAC
                </span>
              </div>
            </div>

            {/* Table résumé */}
            <div className="rounded-2xl border border-ink/10 bg-white shadow-soft overflow-hidden">
              <div className="px-5 py-3 border-b border-ink/8 bg-cream/40 font-mono text-[10px] uppercase tracking-eyebrow text-copper">
                Détail par tranches (chaque 5 ans)
              </div>
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-cream/30 text-left text-graphite text-xs">
                    <th className="px-5 py-2">Année</th>
                    <th className="px-3 py-2 text-right">Cumul gaz</th>
                    <th className="px-3 py-2 text-right">Cumul PAC</th>
                    <th className="px-5 py-2 text-right">Δ (PAC − gaz)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ink/5">
                  {[5, 10, 15, 20].map((y) => {
                    const r = result.rows.find((x) => x.year === y);
                    if (!r) return null;
                    return (
                      <tr key={y}>
                        <td className="px-5 py-2 text-ink">Année {y}</td>
                        <td className="px-3 py-2 text-right font-mono text-ink tabular-nums">
                          {formatEur(r.gasCumulative, true)}
                        </td>
                        <td className="px-3 py-2 text-right font-mono text-ink tabular-nums">
                          {formatEur(r.pacCumulative, true)}
                        </td>
                        <td
                          className="px-5 py-2 text-right font-mono tabular-nums"
                          style={{
                            color: r.cumulativeDelta < 0 ? "#22a06b" : "#dc5a28",
                          }}
                        >
                          {r.cumulativeDelta > 0 ? "+" : ""}
                          {formatEur(r.cumulativeDelta, true)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="rounded-2xl border border-copper/30 bg-copper/5 p-5 text-xs text-graphite">
              <Info className="h-4 w-4 text-copper mb-2" />
              <p>
                <strong>Hypothèses retenues :</strong> rendement chaudière
                95%, SCOP PAC {result.assumptions.pacScop}, entretien gaz{" "}
                {result.assumptions.gasAnnualMaintenance} €/an, entretien PAC{" "}
                {result.assumptions.pacAnnualMaintenance} €/an, prix actuels
                Lux, inflation énergie {(result.assumptions.energyInflation * 100).toFixed(1)}%/an.
                Aucune valeur résiduelle équipement en fin de période.
              </p>
            </div>

            <div className="rounded-2xl border border-ink/10 bg-ink/5 p-5 flex items-center justify-between gap-3 flex-wrap">
              <div>
                <div className="font-display text-base text-ink">
                  Cette simulation vous parle ?
                </div>
                <p className="text-sm text-graphite mt-1">
                  Discutons-en avec un dimensionnement précis et une vraie offre.
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
            <strong>Limites du simulateur</strong> — Les prix de l&apos;énergie
            et les conditions d&apos;aide évoluent. Cette simulation reflète
            les hypothèses saisies et n&apos;est pas un engagement. Pour un
            chiffrage précis, demandez un devis professionnel intégrant votre
            cas réel.
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
}: {
  label: string;
  value: string;
  hint?: string;
  color?: string;
}) {
  return (
    <div className="rounded-2xl border border-ink/10 bg-white shadow-soft p-4">
      <div
        className="font-mono text-[10px] uppercase tracking-eyebrow"
        style={{ color: color ?? "#8b847a" }}
      >
        {label}
      </div>
      <div
        className="mt-1 font-display text-xl tabular-nums"
        style={{ color: color ?? "#1e1a15" }}
      >
        {value}
      </div>
      {hint && <div className="text-[11px] text-muted mt-1">{hint}</div>}
    </div>
  );
}
