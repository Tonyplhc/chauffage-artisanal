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
  Zap,
  Leaf,
} from "lucide-react";
import { simulateRoi } from "@/lib/roi-simulator";
import { formatEur } from "@/lib/formatters";
import {
  PRIX_ENERGIE,
  SCOP_PAC_AIR_EAU,
  computeAides,
  besoinChaleurKwh,
  dimensionnerPac,
  PRIX_CHAUFFAGE,
  RENDEMENT_CHAUFFAGE,
} from "@/lib/referentiel";

/**
 * Règle N°3 + N°5 : le client n'entre QUE ce qu'il connaît (chauffage actuel,
 * logement, facture annuelle). Besoins kWh, budget PAC, forfait Klimabonus et
 * prix énergie sont DÉDUITS automatiquement du référentiel — rien d'inventé,
 * mêmes briques de calcul que l'estimateur (/estimation).
 */
type Energie = "Gaz" | "Mazout" | "Électrique" | "Bois";
type LogementChoix = "maison" | "appartement";

/**
 * Caractéristiques expertes du chauffage actuel (scénario comparatif « je garde
 * et remplace à l'identique »). Prix/rendements lus du référentiel ; coût de
 * remplacement et entretien = hypothèses métier visibles et ajustables.
 */
const ENERGIES: Record<
  Energie,
  { chip: string; label: string; equipLabel: string; equipCost: number; entretien: number; fossile: boolean }
> = {
  Gaz: {
    chip: "Chaudière gaz",
    label: "gaz",
    equipLabel: "Chaudière gaz condensation neuve",
    equipCost: 8000,
    entretien: 200,
    fossile: true,
  },
  Mazout: {
    chip: "Chaudière mazout",
    label: "mazout",
    equipLabel: "Chaudière mazout neuve",
    equipCost: 9500,
    entretien: 250,
    fossile: true,
  },
  "Électrique": {
    chip: "Électrique",
    label: "électrique",
    equipLabel: "Convecteurs électriques neufs",
    equipCost: 3000,
    entretien: 0,
    fossile: false,
  },
  Bois: {
    chip: "Bois / pellets",
    label: "bois",
    equipLabel: "Chaudière bois/pellets neuve",
    equipCost: 15000,
    entretien: 300,
    fossile: false,
  },
};

export default function RoiPacPage() {
  // ── Ce que le client connaît ──
  const [energie, setEnergie] = useState<Energie>("Gaz");
  const [logement, setLogement] = useState<LogementChoix>("maison");
  const [facture, setFacture] = useState(2800);

  // ── Hypothèses avancées (pré-remplies référentiel, modifiables) ──
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [gasInitial, setGasInitial] = useState(ENERGIES.Gaz.equipCost);
  const [elecPrice, setElecPrice] = useState<number>(PRIX_ENERGIE.electricite);
  const [scop, setScop] = useState<number>(SCOP_PAC_AIR_EAU);
  const [inflation, setInflation] = useState(3);

  function choisirEnergie(e: Energie) {
    setEnergie(e);
    setGasInitial(ENERGIES[e].equipCost); // re-cale le comparatif sur la nouvelle énergie
  }

  // ── Déduit automatiquement (référentiel — mêmes formules que /estimation) ──
  const conf = ENERGIES[energie];
  const energiePrice = PRIX_CHAUFFAGE[energie];
  const rendement = RENDEMENT_CHAUFFAGE[energie];
  const annualKwh = useMemo(() => Math.round(besoinChaleurKwh(energie, facture)), [energie, facture]);
  const pac = useMemo(() => dimensionnerPac(annualKwh), [annualKwh]);
  const klima = useMemo(
    () =>
      computeAides({
        equipement: "pac-air-eau",
        logement: logement === "maison" ? "unifamilial" : "collectif",
        remplacementFossile: conf.fossile,
      }).klimabonus,
    [logement, conf.fossile],
  );
  const labelEnergie = conf.label;

  const result = useMemo(
    () =>
      simulateRoi({
        annualKwhNeeds: annualKwh,
        gasInitialCost: gasInitial,
        pacInitialCost: pac.budget,
        klimabonusAid: klima,
        gasPricePerKwh: energiePrice,
        gasEfficiency: rendement,
        gasAnnualMaintenance: conf.entretien,
        electricityPricePerKwh: elecPrice,
        pacScop: scop,
        energyInflation: inflation / 100,
      }),
    [annualKwh, gasInitial, pac.budget, klima, energiePrice, rendement, conf.entretien, elecPrice, scop, inflation],
  );

  const maxCumulative = useMemo(() => {
    return Math.max(
      ...result.rows.flatMap((r) => [r.gasCumulative, r.pacCumulative]),
    );
  }, [result.rows]);

  return (
    <div className="min-h-screen bg-creme py-12 lg:py-16">
      <div className="container max-w-6xl">
        <div className="mb-8">
          <Link
            href="/"
            className="text-xs font-mono uppercase tracking-eyebrow text-taupe hover:text-bleu"
          >
            ← Retour accueil
          </Link>
          <h1 className="mt-4 font-display text-display-md text-anthra">
            ROI sur 20 ans — PAC vs votre chauffage actuel
          </h1>
          <p className="mt-2 text-taupe max-w-2xl">
            Entrez seulement ce que vous connaissez : votre chauffage, votre
            logement, votre facture. On calcule le reste automatiquement —
            besoins, budget PAC, aides — avec les mêmes données vérifiées que
            notre estimateur. Toutes les hypothèses restent visibles et
            modifiables.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Inputs */}
          <div className="space-y-4">
            <div className="rounded-2xl border border-pierre bg-white shadow-soft p-5">
              <div className="font-mono text-[10px] uppercase tracking-eyebrow text-bleu mb-3">
                Votre situation — 3 réponses suffisent
              </div>

              <Field label="Votre chauffage actuel">
                <div className="grid grid-cols-2 gap-2">
                  {(Object.keys(ENERGIES) as Energie[]).map((e) => (
                    <button
                      key={e}
                      onClick={() => choisirEnergie(e)}
                      className={`rounded-xl border px-3 py-2.5 text-sm font-medium transition ${
                        energie === e
                          ? "border-bleu bg-voile text-bleu"
                          : "border-pierre bg-white text-taupe hover:border-bleu/50"
                      }`}
                    >
                      {ENERGIES[e].chip}
                    </button>
                  ))}
                </div>
              </Field>

              <Field label="Votre logement">
                <div className="grid grid-cols-2 gap-2">
                  {(
                    [
                      { v: "maison", l: "Maison" },
                      { v: "appartement", l: "Appartement" },
                    ] as { v: LogementChoix; l: string }[]
                  ).map((o) => (
                    <button
                      key={o.v}
                      onClick={() => setLogement(o.v)}
                      className={`rounded-xl border px-3 py-2.5 text-sm font-medium transition ${
                        logement === o.v
                          ? "border-bleu bg-voile text-bleu"
                          : "border-pierre bg-white text-taupe hover:border-bleu/50"
                      }`}
                    >
                      {o.l}
                    </button>
                  ))}
                </div>
              </Field>

              <Field
                label={`Votre facture de chauffage : ${formatEur(facture)} /an`}
              >
                <input
                  type="range"
                  min="800"
                  max="6000"
                  step="100"
                  value={facture}
                  onChange={(e) => setFacture(Number(e.target.value))}
                  className="w-full accent-bleu"
                />
              </Field>
            </div>

            {/* Tout le reste est déduit du référentiel — rien à connaître, rien d'inventé */}
            <div className="rounded-2xl border border-gain/20 bg-gainBg p-5">
              <div className="font-mono text-[10px] uppercase tracking-eyebrow text-gain mb-3">
                Calculé automatiquement pour vous
              </div>
              <dl className="space-y-2 text-sm">
                <div className="flex items-baseline justify-between gap-3">
                  <dt className="text-taupe">Besoins de chauffage</dt>
                  <dd className="font-medium text-anthra tabular-nums">
                    ≈ {(annualKwh / 1000).toFixed(1).replace(".", ",")} MWh/an
                  </dd>
                </div>
                <div className="flex items-baseline justify-between gap-3">
                  <dt className="text-taupe">PAC recommandée</dt>
                  <dd className="font-medium text-anthra tabular-nums">≈ {String(pac.puissanceKw).replace(".", ",")} kW</dd>
                </div>
                <div className="flex items-baseline justify-between gap-3">
                  <dt className="text-taupe">Budget installation</dt>
                  <dd className="font-medium text-anthra tabular-nums">≈ {formatEur(pac.budget)}</dd>
                </div>
                <div className="flex items-baseline justify-between gap-3">
                  <dt className="text-taupe">
                    Klimabonus 2026 ({logement === "maison" ? "maison" : "appartement"}
                    {conf.fossile ? " · sortie fossile" : ""})
                  </dt>
                  <dd className="font-display text-lg text-gain tabular-nums">+ {formatEur(klima)}</dd>
                </div>
              </dl>
              <p className="mt-3 text-[11px] text-muted">
                Déduits de votre facture (prix {labelEnergie} {energiePrice.toFixed(2).replace(".", ",")} €/kWh,
                rendement {Math.round(rendement * 100)} %) · forfait Klimabonus vérifié sur guichet.public.lu —
                mêmes calculs que notre estimateur.
              </p>
            </div>

            <button
              onClick={() => setShowAdvanced((s) => !s)}
              className="w-full text-xs text-bleu hover:underline text-left inline-flex items-center gap-1"
            >
              <Settings2 className="h-3 w-3" />
              {showAdvanced ? "Masquer" : "Afficher"} les hypothèses avancées
            </button>

            {showAdvanced && (
              <div className="rounded-2xl border border-pierre bg-white shadow-soft p-5 text-xs">
                <Field label={`${conf.equipLabel} (comparatif) : ${formatEur(gasInitial)}`}>
                  <input
                    type="range"
                    min="1000"
                    max="20000"
                    step="500"
                    value={gasInitial}
                    onChange={(e) => setGasInitial(Number(e.target.value))}
                    className="w-full accent-bleu"
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
                    className="w-full accent-bleu"
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
                    className="w-full accent-bleu"
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
                    className="w-full accent-bleu"
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
                color={result.initial.overInvestment > 0 ? "#C0392B" : "#2E7D5A"}
              />
              <Kpi
                label="Année de break-even"
                value={
                  result.breakEvenYear !== null
                    ? `Année ${result.breakEvenYear}`
                    : "Jamais"
                }
                hint="Quand la PAC devient cumulativement moins chère"
                color={result.breakEvenYear !== null ? "#2E7D5A" : "#8B847A"}
              />
              <Kpi
                label="Économies 20 ans"
                value={formatEur(result.totalSavings, true)}
                hint={
                  result.totalSavings > 0
                    ? "en faveur de la PAC"
                    : `en faveur du ${labelEnergie}`
                }
                color={result.totalSavings > 0 ? "#2E7D5A" : "#C0392B"}
              />
            </div>

            {/* Graph */}
            <div className="rounded-2xl border border-pierre bg-white shadow-soft p-5">
              <div className="font-mono text-[10px] uppercase tracking-eyebrow text-bleu mb-3">
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
                      className="flex-1 h-full flex items-end gap-0.5 relative"
                      title={`Année ${r.year}: gaz ${formatEur(r.gasCumulative, true)}, PAC ${formatEur(r.pacCumulative, true)}`}
                    >
                      <div
                        className="flex-1 bg-terracotta/60 rounded-t-sm"
                        style={{ height: `${gasHeight}%` }}
                      />
                      <div
                        className="flex-1 bg-gain/60 rounded-t-sm"
                        style={{ height: `${pacHeight}%` }}
                      />
                      {isBreakEven && (
                        <div className="absolute -top-3 left-1/2 -translate-x-1/2 text-[8px] font-mono text-bleu">
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
                <span className="inline-flex items-center gap-1.5 capitalize">
                  <span className="h-2 w-2 rounded-sm bg-terracotta/60" />
                  {energie === "Électrique" ? (
                    <Zap className="h-3 w-3 text-terracotta" />
                  ) : energie === "Bois" ? (
                    <Leaf className="h-3 w-3 text-terracotta" />
                  ) : (
                    <Flame className="h-3 w-3 text-terracotta" />
                  )}
                  {labelEnergie}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-sm bg-gain/60" />
                  <Snowflake className="h-3 w-3 text-gain" />
                  PAC
                </span>
              </div>
            </div>

            {/* Table résumé */}
            <div className="rounded-2xl border border-pierre bg-white shadow-soft overflow-hidden">
              <div className="px-5 py-3 border-b border-pierre bg-creme/40 font-mono text-[10px] uppercase tracking-eyebrow text-bleu">
                Détail par tranches (chaque 5 ans)
              </div>
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-creme/30 text-left text-taupe text-xs">
                    <th className="px-5 py-2">Année</th>
                    <th className="px-3 py-2 text-right capitalize">Cumul {labelEnergie}</th>
                    <th className="px-3 py-2 text-right">Cumul PAC</th>
                    <th className="px-5 py-2 text-right">Δ (PAC − {labelEnergie})</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-pierre">
                  {[5, 10, 15, 20].map((y) => {
                    const r = result.rows.find((x) => x.year === y);
                    if (!r) return null;
                    return (
                      <tr key={y}>
                        <td className="px-5 py-2 text-anthra">Année {y}</td>
                        <td className="px-3 py-2 text-right font-mono text-anthra tabular-nums">
                          {formatEur(r.gasCumulative, true)}
                        </td>
                        <td className="px-3 py-2 text-right font-mono text-anthra tabular-nums">
                          {formatEur(r.pacCumulative, true)}
                        </td>
                        <td
                          className="px-5 py-2 text-right font-mono tabular-nums"
                          style={{
                            color: r.cumulativeDelta < 0 ? "#2E7D5A" : "#C0392B",
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

            <div className="rounded-2xl border border-bleu/30 bg-bleu/5 p-5 text-xs text-taupe">
              <Info className="h-4 w-4 text-bleu mb-2" />
              <p>
                <strong>Hypothèses retenues :</strong> prix {labelEnergie}{" "}
                {energiePrice.toFixed(2).replace(".", ",")} €/kWh · rendement chaudière{" "}
                {Math.round(rendement * 100)} % · SCOP PAC {result.assumptions.pacScop} · entretien{" "}
                {labelEnergie} {result.assumptions.gasAnnualMaintenance} €/an · entretien PAC{" "}
                {result.assumptions.pacAnnualMaintenance} €/an · inflation énergie{" "}
                {(result.assumptions.energyInflation * 100).toFixed(1)} %/an. Besoins et budget
                déduits de votre facture (référentiel commun à l&apos;estimateur). Forfait
                Klimabonus 2026 vérifié sur guichet.public.lu. Aucune valeur résiduelle
                équipement en fin de période.
              </p>
            </div>

            <div className="rounded-2xl border border-pierre bg-sable/60 p-5 flex items-center justify-between gap-3 flex-wrap">
              <div>
                <div className="font-display text-base text-anthra">
                  Cette simulation vous parle ?
                </div>
                <p className="text-sm text-taupe mt-1">
                  Discutons-en avec un dimensionnement précis et une vraie offre.
                </p>
              </div>
              <Link
                href="/estimation"
                className="inline-flex items-center gap-2 rounded-full bg-navy text-creme px-4 py-2 text-sm hover:bg-bleu transition-colors"
              >
                Estimer mes économies · 60 s
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
      <div className="text-xs text-taupe mb-1">{label}</div>
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
    <div className="rounded-2xl border border-pierre bg-white shadow-soft p-4">
      <div
        className="font-mono text-[10px] uppercase tracking-eyebrow"
        style={{ color: color ?? "#8b847a" }}
      >
        {label}
      </div>
      <div
        className="mt-1 font-display text-xl tabular-nums"
        style={{ color: color ?? "#2A2724" }}
      >
        {value}
      </div>
      {hint && <div className="text-[11px] text-muted mt-1">{hint}</div>}
    </div>
  );
}
