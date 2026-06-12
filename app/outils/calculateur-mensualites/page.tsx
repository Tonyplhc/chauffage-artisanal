"use client";

/**
 * /outils/calculateur-mensualites — calcul de mensualité d'emprunt.
 *
 * Objectif : lever l'objection prix. Beaucoup de projets sont reportés
 * parce que "30 000 €" sonne énorme. Le même projet à "295 €/mois sur
 * 10 ans" change complètement la décision.
 *
 * Hypothèses : taux indicatifs LU 2026 (3-5 % selon profil). L'utilisateur
 * voit les chiffres en temps réel.
 */

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  Calculator,
  Info,
  TrendingUp,
  Wallet,
  Calendar,
} from "lucide-react";
import { Eyebrow } from "@/components/ui";

export default function CalculateurMensualitesPage() {
  const [amount, setAmount] = useState(30000);
  const [years, setYears] = useState(10);
  const [rate, setRate] = useState(4.0); // % annuel

  const result = useMemo(() => calculateLoan(amount, years, rate), [amount, years, rate]);

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
            <Eyebrow number="OUTIL">Mensualités</Eyebrow>
            <h1 className="mt-4 font-display text-display-xl tracking-tightest text-balance text-anthra">
              30 000 €,{" "}
              <em className="not-italic text-bleu">c&apos;est combien par mois</em> ?
            </h1>
            <p className="mt-5 text-lg lg:text-xl text-taupe leading-relaxed text-balance">
              Calculateur de mensualité d&apos;emprunt pour votre projet thermique.
              Hypothèses indicatives LU 2026 — pour orienter, pas pour décider à votre place.
            </p>
          </div>
        </div>
      </section>

      {/* Calculator */}
      <section className="py-12 lg:py-16">
        <div className="container grid lg:grid-cols-12 gap-8 items-start">
          {/* Inputs */}
          <aside className="lg:col-span-5 lg:sticky lg:top-28">
            <div className="rounded-3xl border border-pierre bg-white shadow-soft p-6 lg:p-7">
              <div className="font-mono text-[10px] uppercase tracking-eyebrow text-bleu">
                Paramètres
              </div>
              <h2 className="mt-2 font-display text-2xl text-anthra tracking-tight">
                Votre emprunt
              </h2>

              <div className="mt-7 space-y-7">
                {/* Montant */}
                <div>
                  <label className="block font-mono text-[10px] uppercase tracking-eyebrow text-taupe">
                    Montant à emprunter
                    <span className="font-display text-2xl text-anthra ml-2">
                      {amount.toLocaleString("fr-LU")} €
                    </span>
                  </label>
                  <input
                    type="range"
                    min={5000}
                    max={150000}
                    step={1000}
                    value={amount}
                    onChange={(e) => setAmount(Number(e.target.value))}
                    className="mt-3 w-full accent-bleu"
                    aria-label="Montant à emprunter"
                  />
                  <div className="mt-1 flex justify-between text-[10px] font-mono uppercase tracking-eyebrow text-muted">
                    <span>5 000 €</span>
                    <span>150 000 €</span>
                  </div>
                </div>

                {/* Durée */}
                <div>
                  <label className="block font-mono text-[10px] uppercase tracking-eyebrow text-taupe">
                    Durée d&apos;emprunt
                    <span className="font-display text-2xl text-bleu ml-2">
                      {years} ans
                    </span>
                  </label>
                  <input
                    type="range"
                    min={2}
                    max={20}
                    step={1}
                    value={years}
                    onChange={(e) => setYears(Number(e.target.value))}
                    className="mt-3 w-full accent-bleu"
                    aria-label="Durée en années"
                  />
                  <div className="mt-1 flex justify-between text-[10px] font-mono uppercase tracking-eyebrow text-muted">
                    <span>2 ans</span>
                    <span>20 ans</span>
                  </div>
                </div>

                {/* Taux */}
                <div>
                  <label className="block font-mono text-[10px] uppercase tracking-eyebrow text-taupe">
                    Taux annuel
                    <span className="font-display text-2xl text-bleu ml-2">
                      {rate.toFixed(1)} %
                    </span>
                  </label>
                  <input
                    type="range"
                    min={1}
                    max={8}
                    step={0.1}
                    value={rate}
                    onChange={(e) => setRate(Number(e.target.value))}
                    className="mt-3 w-full accent-bleu"
                    aria-label="Taux d'intérêt annuel"
                  />
                  <div className="mt-1 flex justify-between text-[10px] font-mono uppercase tracking-eyebrow text-muted">
                    <span>1 %</span>
                    <span>8 %</span>
                  </div>
                </div>
              </div>

              <p className="mt-6 pt-6 border-t border-pierre text-[11px] text-muted leading-relaxed">
                <Info className="inline h-3 w-3 text-bleu mr-1" />
                Calcul indicatif (mensualité constante). Le taux réel dépend de votre
                établissement bancaire, durée, garanties, profil emprunteur.
              </p>
            </div>
          </aside>

          {/* Results — aria-live polite pour annoncer les changements aux lecteurs d'écran */}
          <div
            className="lg:col-span-7 space-y-6"
            aria-live="polite"
            aria-atomic="false"
            aria-label="Résultats du calcul de mensualités"
          >
            {/* Card principale mensualité */}
            <div className="rounded-3xl border border-bleu/30 bg-gradient-to-br from-creme to-white p-7 lg:p-9 shadow-soft">
              <div className="font-mono text-[10px] uppercase tracking-eyebrow text-bleu">
                Mensualité — {years} ans à {rate.toFixed(1)} %
              </div>
              {/* Montant = donnée financière neutre (coût) → anthra, pas bleu (Règle 6) */}
              <div className="mt-3 font-display text-display-lg tracking-tightest text-anthra">
                {result.monthly.toLocaleString("fr-LU")} €
                <span className="text-taupe text-2xl ml-2">/ mois</span>
              </div>
              <div className="mt-2 text-sm text-taupe">
                Pendant {years * 12} mensualités
              </div>
            </div>

            {/* Métriques additionnelles */}
            <div className="grid sm:grid-cols-3 gap-4">
              <Metric
                icon={<Wallet className="h-4 w-4" />}
                label="Capital emprunté"
                value={`${amount.toLocaleString("fr-LU")} €`}
              />
              <Metric
                icon={<TrendingUp className="h-4 w-4" />}
                label="Intérêts totaux"
                value={`${result.totalInterest.toLocaleString("fr-LU")} €`}
                accent
              />
              <Metric
                icon={<Calendar className="h-4 w-4" />}
                label="Coût total"
                value={`${result.totalCost.toLocaleString("fr-LU")} €`}
              />
            </div>

            {/* Tableau comparatif durées */}
            <div className="rounded-3xl border border-pierre bg-white p-7 lg:p-8">
              <Eyebrow number="01">Comparaison durées</Eyebrow>
              <h3 className="mt-3 font-display text-xl text-anthra tracking-tight">
                Mensualité selon la durée d&apos;emprunt
              </h3>
              <p className="mt-2 text-sm text-taupe">
                Pour {amount.toLocaleString("fr-LU")} € à {rate.toFixed(1)} % annuel
              </p>
              <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[5, 10, 15, 20].map((y) => {
                  const sim = calculateLoan(amount, y, rate);
                  const isCurrent = y === years;
                  return (
                    <button
                      key={y}
                      onClick={() => setYears(y)}
                      className={`p-4 rounded-xl border text-left transition-all ${
                        isCurrent
                          ? "bg-navy text-creme border-anthra shadow-soft"
                          : "bg-creme border-pierre hover:border-bleu/40"
                      }`}
                    >
                      <div
                        className={`text-[10px] font-mono uppercase tracking-eyebrow ${
                          isCurrent ? "text-creme/70" : "text-muted"
                        }`}
                      >
                        {y} ans
                      </div>
                      <div className="mt-1.5 font-display text-xl tracking-tight">
                        {sim.monthly.toLocaleString("fr-LU")} €
                      </div>
                      <div
                        className={`text-[11px] mt-0.5 ${
                          isCurrent ? "text-creme/60" : "text-muted"
                        }`}
                      >
                        +{sim.totalInterest.toLocaleString("fr-LU")} € intérêts
                      </div>
                    </button>
                  );
                })}
              </div>
              <p className="mt-5 text-xs text-taupe leading-relaxed">
                Plus la durée est longue, plus la mensualité est faible — mais plus le coût
                total des intérêts augmente. L&apos;équilibre dépend de votre capacité
                d&apos;épargne mensuelle.
              </p>
            </div>

            {/* CTA */}
            <div className="rounded-3xl bg-navy text-creme p-7 lg:p-9">
              <div className="grid lg:grid-cols-12 gap-6 items-center">
                <div className="lg:col-span-8">
                  <div className="font-mono text-[10px] uppercase tracking-eyebrow text-sable">
                    Aller plus loin
                  </div>
                  <h3 className="mt-3 font-display text-2xl lg:text-3xl tracking-tight">
                    Combien coûte{" "}
                    <em className="not-italic text-sable">votre projet</em> précisément ?
                  </h3>
                  <p className="mt-3 text-creme/75 leading-relaxed">
                    Utilisez d&apos;abord l&apos;estimateur de prix pour avoir une
                    fourchette, puis demandez un devis détaillé pour préciser la mensualité
                    exacte.
                  </p>
                </div>
                <div className="lg:col-span-4 flex flex-col gap-2">
                  <Link
                    href="/outils/estimateur-prix"
                    className="inline-flex items-center justify-between gap-2 rounded-full bg-creme text-navy px-6 py-3.5 text-sm font-medium hover:bg-bleu hover:text-creme transition-colors group"
                  >
                    <span className="inline-flex items-center gap-2">
                      <Calculator className="h-4 w-4" />
                      Estimer le projet
                    </span>
                    <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                  </Link>
                  <Link
                    href="/devis"
                    className="inline-flex items-center justify-between gap-2 rounded-full bg-terracotta/15 border border-terracotta/40 text-creme px-6 py-3.5 text-sm font-medium hover:bg-terracotta/25 transition-colors"
                  >
                    Demander un devis
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

/**
 * Calcul mensualité d'emprunt à taux fixe et mensualité constante.
 * Formule classique : M = C × t / (1 - (1+t)^-n)
 *   M = mensualité
 *   C = capital emprunté
 *   t = taux mensuel = taux annuel / 12
 *   n = nombre de mensualités
 */
function calculateLoan(amount: number, years: number, ratePercent: number) {
  const n = years * 12;
  const t = ratePercent / 100 / 12;
  const monthly =
    t === 0 ? amount / n : (amount * t) / (1 - Math.pow(1 + t, -n));
  const totalCost = monthly * n;
  const totalInterest = totalCost - amount;
  return {
    monthly: Math.round(monthly),
    totalCost: Math.round(totalCost),
    totalInterest: Math.round(totalInterest),
  };
}

function Metric({
  icon,
  label,
  value,
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border p-5 ${
        accent ? "border-perte/20 bg-perteBg" : "border-pierre bg-white"
      }`}
    >
      <div className="flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-eyebrow text-muted">
        {icon}
        {label}
      </div>
      {/* accent = intérêts (argent perdu) → sémaphore rouge (Règle 6) */}
      <div
        className={`mt-2 font-display text-2xl tracking-tight ${
          accent ? "text-perte" : "text-anthra"
        }`}
      >
        {value}
      </div>
    </div>
  );
}
