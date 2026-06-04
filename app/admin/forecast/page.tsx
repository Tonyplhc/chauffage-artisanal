"use client";

/**
 * Forecast prédictif saisonnier — projection N mois sur leads + conversions + CA.
 *
 * Affiche historique 24 mois, index de saisonnalité par mois calendaire,
 * projection horizon variable, baseline + slope explicites.
 */

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Loader2,
  TrendingUp,
  AlertTriangle,
  CalendarRange,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";

type HistMonth = {
  year: number;
  month: number;
  label: string;
  leads: number;
  conversions: number;
  revenueEur: number;
};

type Forecast = {
  year: number;
  month: number;
  label: string;
  forecastLeads: number;
  forecastConversions: number;
  forecastRevenueEur: number;
  seasonalIndex: number;
  uncertaintyPct: number;
};

type Report = {
  history: HistMonth[];
  seasonal: {
    byCalendarMonth: Record<number, number>;
    yearsPerMonth: Record<number, number>;
  };
  baseline: {
    rollingAvg6: number;
    monthlySlope: number;
    conversionRate: number;
    avgDealEur: number;
  };
  forecast: Forecast[];
  lowConfidence: boolean;
  lowConfidenceReason?: string;
};

const MONTH_SHORT_FR = [
  "Jan",
  "Fév",
  "Mar",
  "Avr",
  "Mai",
  "Jun",
  "Jul",
  "Aoû",
  "Sep",
  "Oct",
  "Nov",
  "Déc",
];

function formatEur(v: number, compact = false) {
  if (compact && Math.abs(v) >= 1000) {
    if (Math.abs(v) >= 1_000_000) {
      return `${(v / 1_000_000).toFixed(1).replace(/\.0$/, "")} M€`;
    }
    return `${(v / 1000).toFixed(1).replace(/\.0$/, "")} k€`;
  }
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(v);
}

export default function ForecastPage() {
  const router = useRouter();
  const [report, setReport] = useState<Report | null>(null);
  const [horizon, setHorizon] = useState(6);

  const load = useCallback(async () => {
    const res = await fetch(`/api/admin/forecast?months=${horizon}`, {
      cache: "no-store",
    });
    if (res.status === 401) {
      router.replace("/admin/login");
      return;
    }
    if (res.ok) {
      const d = await res.json();
      setReport(d.report);
    }
  }, [router, horizon]);

  useEffect(() => {
    load();
  }, [load]);

  const maxHistLeads =
    report?.history && report.history.length > 0
      ? Math.max(...report.history.map((h) => h.leads), 1)
      : 1;
  const maxForecastLeads =
    report?.forecast && report.forecast.length > 0
      ? Math.max(...report.forecast.map((f) => f.forecastLeads), 1)
      : 1;
  const overallMax = Math.max(maxHistLeads, maxForecastLeads, 1);

  const totalForecastLeads =
    report?.forecast.reduce((s, f) => s + f.forecastLeads, 0) ?? 0;
  const totalForecastConv =
    report?.forecast.reduce((s, f) => s + f.forecastConversions, 0) ?? 0;
  const totalForecastRev =
    report?.forecast.reduce((s, f) => s + f.forecastRevenueEur, 0) ?? 0;

  return (
    <div className="min-h-screen bg-cream py-10 lg:py-14">
      <div className="container max-w-6xl">
        <Link
          href="/admin/leads"
          className="inline-flex items-center gap-2 text-sm font-mono uppercase tracking-eyebrow text-graphite hover:text-copper transition-colors mb-6"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Retour pipeline
        </Link>

        <div className="flex items-start justify-between gap-3 flex-wrap mb-8">
          <div>
            <h1 className="font-display text-display-md text-ink">
              Forecast saisonnier
            </h1>
            <p className="mt-2 text-graphite max-w-2xl">
              Projection des leads, conversions et CA sur les prochains mois en
              combinant tendance (moyenne mobile + pente) et index de
              saisonnalité calculé sur l&apos;historique.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs text-graphite">Horizon :</label>
            <select
              value={horizon}
              onChange={(e) => setHorizon(Number(e.target.value))}
              className="bg-white border border-ink/15 rounded-full px-3 py-1.5 text-sm focus:border-copper focus:outline-none"
            >
              <option value={3}>3 mois</option>
              <option value={6}>6 mois</option>
              <option value={9}>9 mois</option>
              <option value={12}>12 mois</option>
            </select>
          </div>
        </div>

        {!report ? (
          <div className="py-16 text-center text-muted">
            <Loader2 className="h-6 w-6 animate-spin mx-auto" />
          </div>
        ) : (
          <>
            {report.lowConfidence && (
              <div className="mb-6 rounded-xl border border-copper/30 bg-copper/5 px-4 py-3 text-sm text-copper flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
                <div>
                  <div className="font-medium">Confiance faible</div>
                  <div className="text-xs mt-0.5">
                    {report.lowConfidenceReason}
                  </div>
                </div>
              </div>
            )}

            <div className="grid lg:grid-cols-4 gap-4 mb-8">
              <Kpi
                label={`Total leads (${horizon} m)`}
                value={String(totalForecastLeads)}
                hint="projetés"
              />
              <Kpi
                label="Conversions estimées"
                value={String(totalForecastConv)}
                hint={`${Math.round(report.baseline.conversionRate * 100)}% conv. historique`}
              />
              <Kpi
                label="CA projeté"
                value={formatEur(totalForecastRev, true)}
                hint={`deal moy. ${formatEur(report.baseline.avgDealEur, true)}`}
              />
              <Kpi
                label="Tendance mensuelle"
                value={`${report.baseline.monthlySlope > 0 ? "+" : ""}${report.baseline.monthlySlope}`}
                hint={`baseline ${report.baseline.rollingAvg6.toFixed(1)} leads/m`}
                color={
                  report.baseline.monthlySlope >= 0 ? "#22a06b" : "#dc5a28"
                }
              />
            </div>

            {/* Index saisonnier */}
            <div className="rounded-2xl border border-ink/10 bg-white shadow-soft overflow-hidden mb-8">
              <div className="px-5 py-3 border-b border-ink/8 bg-cream/40 flex items-center gap-2">
                <CalendarRange className="h-4 w-4 text-copper" />
                <span className="font-mono text-[10px] uppercase tracking-eyebrow text-copper">
                  Index de saisonnalité (1.00 = moyenne)
                </span>
              </div>
              <div className="p-5 grid grid-cols-6 lg:grid-cols-12 gap-2">
                {MONTH_SHORT_FR.map((label, i) => {
                  const m = i + 1;
                  const idx = report.seasonal.byCalendarMonth[m] ?? 1;
                  const years = report.seasonal.yearsPerMonth[m] ?? 0;
                  const heightPct = Math.min(100, idx * 50);
                  return (
                    <div key={m} className="flex flex-col items-center gap-1">
                      <div className="h-16 w-full flex items-end justify-center">
                        <div
                          className="w-3/4 rounded-t-md transition-all"
                          style={{
                            height: `${heightPct}%`,
                            background:
                              idx >= 1.1
                                ? "#22a06b"
                                : idx <= 0.9
                                  ? "#b86a36"
                                  : "#8b847a",
                            opacity: years === 0 ? 0.15 : 0.6 + Math.min(0.4, years * 0.2),
                          }}
                        />
                      </div>
                      <div className="text-[10px] font-mono text-graphite">
                        {label}
                      </div>
                      <div
                        className={cn(
                          "text-[10px] font-mono tabular-nums",
                          idx >= 1.1
                            ? "text-[#22a06b]"
                            : idx <= 0.9
                              ? "text-copper"
                              : "text-muted",
                        )}
                      >
                        {idx.toFixed(2)}
                      </div>
                      {years > 0 && (
                        <div className="text-[9px] text-muted">
                          {years} an{years > 1 ? "s" : ""}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Historique + Forecast côte à côte */}
            <div className="rounded-2xl border border-ink/10 bg-white shadow-soft overflow-hidden mb-6">
              <div className="px-5 py-3 border-b border-ink/8 bg-cream/40 flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-copper" />
                <span className="font-mono text-[10px] uppercase tracking-eyebrow text-copper">
                  Historique + projection (leads / mois)
                </span>
              </div>
              <div className="p-5 overflow-x-auto">
                <div className="flex items-end gap-1 min-w-max">
                  {report.history.map((h) => {
                    const heightPct = (h.leads / overallMax) * 100;
                    return (
                      <div
                        key={`hist-${h.year}-${h.month}`}
                        className="flex flex-col items-center w-10"
                      >
                        <div className="h-32 w-full flex items-end justify-center">
                          <div
                            className="w-3/4 rounded-t-sm bg-graphite/40"
                            style={{ height: `${heightPct}%` }}
                            title={`${h.label}: ${h.leads} leads, ${h.conversions} convertis`}
                          />
                        </div>
                        <div className="text-[9px] font-mono text-graphite mt-1 tabular-nums">
                          {h.leads}
                        </div>
                        <div className="text-[8px] text-muted">
                          {MONTH_SHORT_FR[h.month - 1]}
                        </div>
                      </div>
                    );
                  })}
                  {/* Séparateur */}
                  <div className="self-stretch w-px bg-copper/30 mx-2" />
                  {report.forecast.map((f) => {
                    const heightPct = (f.forecastLeads / overallMax) * 100;
                    return (
                      <div
                        key={`fc-${f.year}-${f.month}`}
                        className="flex flex-col items-center w-10"
                      >
                        <div className="h-32 w-full flex items-end justify-center relative">
                          <div
                            className="w-3/4 rounded-t-sm"
                            style={{
                              height: `${heightPct}%`,
                              background:
                                "repeating-linear-gradient(45deg, rgba(184,106,54,0.65) 0 4px, rgba(184,106,54,0.35) 4px 8px)",
                            }}
                            title={`${f.label}: ${f.forecastLeads} leads (±${f.uncertaintyPct}%)`}
                          />
                        </div>
                        <div className="text-[9px] font-mono text-copper mt-1 tabular-nums">
                          {f.forecastLeads}
                        </div>
                        <div className="text-[8px] text-copper">
                          {MONTH_SHORT_FR[f.month - 1]}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Détail mois projetés */}
            <div className="rounded-2xl border border-ink/10 bg-white shadow-soft overflow-hidden">
              <div className="px-5 py-3 border-b border-ink/8 bg-cream/40 flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-copper" />
                <span className="font-mono text-[10px] uppercase tracking-eyebrow text-copper">
                  Détail projection
                </span>
              </div>
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-cream/30 text-left text-graphite">
                    <th className="px-5 py-2.5 font-mono text-[10px] uppercase tracking-eyebrow">
                      Mois
                    </th>
                    <th className="px-3 py-2.5 font-mono text-[10px] uppercase tracking-eyebrow text-right">
                      Index sais.
                    </th>
                    <th className="px-3 py-2.5 font-mono text-[10px] uppercase tracking-eyebrow text-right">
                      Leads
                    </th>
                    <th className="px-3 py-2.5 font-mono text-[10px] uppercase tracking-eyebrow text-right">
                      Conversions
                    </th>
                    <th className="px-3 py-2.5 font-mono text-[10px] uppercase tracking-eyebrow text-right">
                      CA
                    </th>
                    <th className="px-5 py-2.5 font-mono text-[10px] uppercase tracking-eyebrow text-right">
                      Incertitude
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ink/5">
                  {report.forecast.map((f) => (
                    <tr key={`row-${f.year}-${f.month}`}>
                      <td className="px-5 py-3 text-ink font-medium">
                        {f.label}
                      </td>
                      <td className="px-3 py-3 text-right">
                        <span
                          className={cn(
                            "font-mono text-xs tabular-nums",
                            f.seasonalIndex >= 1.1
                              ? "text-[#22a06b]"
                              : f.seasonalIndex <= 0.9
                                ? "text-copper"
                                : "text-graphite",
                          )}
                        >
                          {f.seasonalIndex.toFixed(2)}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-right font-mono text-ink tabular-nums">
                        {f.forecastLeads}
                      </td>
                      <td className="px-3 py-3 text-right font-mono text-graphite tabular-nums">
                        {f.forecastConversions}
                      </td>
                      <td className="px-3 py-3 text-right font-mono text-ink tabular-nums">
                        {formatEur(f.forecastRevenueEur, true)}
                      </td>
                      <td className="px-5 py-3 text-right">
                        <span className="font-mono text-xs text-muted tabular-nums">
                          ±{f.uncertaintyPct}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <p className="mt-4 text-xs text-muted">
              Méthode : moyenne mobile 6 mois + pente régression linéaire 12
              mois × index saisonnier (mois calendaire). CA projeté = leads ×
              taux conversion historique × deal moyen. Incertitude croît avec
              l&apos;horizon. Pas d&apos;ARIMA — projection naïve volontairement
              auditable.
            </p>
          </>
        )}
      </div>
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
    <div className="rounded-2xl border border-ink/10 bg-white shadow-soft p-5">
      <div
        className="font-mono text-[10px] uppercase tracking-eyebrow"
        style={{ color: color ?? "#8b847a" }}
      >
        {label}
      </div>
      <div
        className="mt-2 font-display text-2xl tabular-nums"
        style={{ color: color ?? "#1e1a15" }}
      >
        {value}
      </div>
      {hint && <div className="text-xs text-muted mt-1">{hint}</div>}
    </div>
  );
}
