"use client";

/**
 * Dashboard ROI marketing par source d'acquisition.
 *
 * Saisie du budget marketing par source → calcul CAC + ROI.
 */

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Loader2,
  TrendingUp,
  TrendingDown,
  Globe,
  Save,
} from "lucide-react";
import { cn } from "@/lib/utils";

type Channel = {
  source: string;
  leads: number;
  converted: number;
  conversionRate: number;
  totalRevenueEur: number;
  averageDealEur: number;
  estimatedLtvEur: number;
  monthlySpendEur: number | null;
  cacEur: number | null;
  roi: number | null;
  scoreLabel: "excellent" | "good" | "neutral" | "loss";
};

type Report = {
  channels: Channel[];
  totals: {
    leads: number;
    converted: number;
    totalRevenueEur: number;
    totalSpendEur: number;
    overallRoi: number | null;
  };
};

const LABEL_COLORS = {
  excellent: "#22a06b",
  good: "#6ba3c5",
  neutral: "#b86a36",
  loss: "#dc5a28",
};

function formatEur(v: number, compact = false) {
  if (compact && Math.abs(v) >= 1000) {
    return `${(v / 1000).toFixed(1).replace(/\.0$/, "")} k€`;
  }
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(v);
}

export default function MarketingRoiPage() {
  const router = useRouter();
  const [report, setReport] = useState<Report | null>(null);
  const [windowMonths, setWindowMonths] = useState(6);
  const [editing, setEditing] = useState<string | null>(null);
  const [draftSpend, setDraftSpend] = useState<number>(0);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const res = await fetch(
      `/api/admin/marketing-roi?months=${windowMonths}`,
      { cache: "no-store" },
    );
    if (res.status === 401) {
      router.replace("/admin/login");
      return;
    }
    if (res.ok) {
      const d = await res.json();
      setReport(d.report);
    }
  }, [router, windowMonths]);

  useEffect(() => {
    load();
  }, [load]);

  const saveSpend = async (source: string) => {
    setBusy(true);
    try {
      await fetch("/api/admin/marketing-roi", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ source, monthlyEur: draftSpend }),
      });
      setEditing(null);
      await load();
    } finally {
      setBusy(false);
    }
  };

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
              ROI marketing
            </h1>
            <p className="mt-2 text-graphite">
              CAC + LTV + ROI par canal d&apos;acquisition. Saisissez le budget
              marketing mensuel par source pour activer les calculs.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs text-graphite">Fenêtre :</label>
            <select
              value={windowMonths}
              onChange={(e) => setWindowMonths(Number(e.target.value))}
              className="bg-white border border-ink/15 rounded-full px-3 py-1.5 text-sm focus:border-copper focus:outline-none"
            >
              <option value={3}>3 mois</option>
              <option value={6}>6 mois</option>
              <option value={12}>12 mois</option>
              <option value={24}>24 mois</option>
            </select>
          </div>
        </div>

        {!report ? (
          <div className="py-16 text-center text-muted">
            <Loader2 className="h-6 w-6 animate-spin mx-auto" />
          </div>
        ) : (
          <>
            <div className="grid lg:grid-cols-4 gap-4 mb-8">
              <Kpi
                label="Leads cumulés"
                value={String(report.totals.leads)}
                hint={`${report.totals.converted} convertis`}
              />
              <Kpi
                label="CA estimé"
                value={formatEur(report.totals.totalRevenueEur, true)}
              />
              <Kpi
                label="Dépense totale"
                value={
                  report.totals.totalSpendEur === 0
                    ? "—"
                    : formatEur(report.totals.totalSpendEur, true)
                }
                hint={`${windowMonths} mois`}
              />
              <Kpi
                label="ROI global"
                value={
                  report.totals.overallRoi === null
                    ? "—"
                    : `${report.totals.overallRoi}×`
                }
                color={
                  report.totals.overallRoi && report.totals.overallRoi >= 1
                    ? "#22a06b"
                    : report.totals.overallRoi !== null
                      ? "#dc5a28"
                      : undefined
                }
              />
            </div>

            <div className="rounded-2xl border border-ink/10 bg-white shadow-soft overflow-hidden">
              <div className="px-5 py-3 border-b border-ink/8 bg-cream/40 font-mono text-[10px] uppercase tracking-eyebrow text-copper">
                Détail par canal
              </div>
              {report.channels.length === 0 ? (
                <div className="py-12 text-center text-muted text-sm">
                  Pas encore de données. Capturez les UTM via les liens
                  marketing.
                </div>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-cream/30 text-left text-graphite">
                      <th className="px-5 py-2.5 font-mono text-[10px] uppercase tracking-eyebrow">
                        Source
                      </th>
                      <th className="px-3 py-2.5 font-mono text-[10px] uppercase tracking-eyebrow text-right">
                        Leads
                      </th>
                      <th className="px-3 py-2.5 font-mono text-[10px] uppercase tracking-eyebrow text-right">
                        Convert.
                      </th>
                      <th className="px-3 py-2.5 font-mono text-[10px] uppercase tracking-eyebrow text-right">
                        Deal moy.
                      </th>
                      <th className="px-3 py-2.5 font-mono text-[10px] uppercase tracking-eyebrow text-right">
                        LTV
                      </th>
                      <th className="px-3 py-2.5 font-mono text-[10px] uppercase tracking-eyebrow text-right">
                        Budget/mois
                      </th>
                      <th className="px-3 py-2.5 font-mono text-[10px] uppercase tracking-eyebrow text-right">
                        CAC
                      </th>
                      <th className="px-5 py-2.5 font-mono text-[10px] uppercase tracking-eyebrow text-right">
                        ROI
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-ink/5">
                    {report.channels.map((c) => (
                      <tr key={c.source} className="hover:bg-cream/40 group">
                        <td className="px-5 py-3">
                          <span className="inline-flex items-center gap-1.5 text-ink font-medium">
                            <Globe className="h-3.5 w-3.5 text-copper" />
                            {c.source}
                          </span>
                        </td>
                        <td className="px-3 py-3 text-right font-mono text-ink tabular-nums">
                          {c.leads}
                        </td>
                        <td className="px-3 py-3 text-right">
                          <span className="font-mono text-ink tabular-nums">
                            {c.converted}
                          </span>
                          <div className="text-[10px] text-muted font-mono">
                            {Math.round(c.conversionRate * 100)}%
                          </div>
                        </td>
                        <td className="px-3 py-3 text-right font-mono text-ink tabular-nums">
                          {c.averageDealEur > 0
                            ? formatEur(c.averageDealEur)
                            : "—"}
                        </td>
                        <td className="px-3 py-3 text-right font-mono text-xs text-graphite tabular-nums">
                          {c.estimatedLtvEur > 0
                            ? formatEur(c.estimatedLtvEur)
                            : "—"}
                        </td>
                        <td className="px-3 py-3 text-right">
                          {editing === c.source ? (
                            <div className="inline-flex items-center gap-1">
                              <input
                                type="number"
                                value={draftSpend}
                                onChange={(e) =>
                                  setDraftSpend(Number(e.target.value) || 0)
                                }
                                className="w-20 bg-cream border border-ink/12 rounded-md px-2 py-0.5 text-xs font-mono tabular-nums focus:border-copper focus:outline-none"
                                autoFocus
                              />
                              <button
                                onClick={() => saveSpend(c.source)}
                                disabled={busy}
                                className="h-6 w-6 grid place-items-center rounded-full bg-ink text-cream hover:bg-copper"
                              >
                                <Save className="h-3 w-3" />
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => {
                                setEditing(c.source);
                                setDraftSpend(c.monthlySpendEur ?? 0);
                              }}
                              className="font-mono text-xs text-copper hover:underline"
                            >
                              {c.monthlySpendEur !== null
                                ? formatEur(c.monthlySpendEur)
                                : "définir"}
                            </button>
                          )}
                        </td>
                        <td className="px-3 py-3 text-right font-mono text-ink tabular-nums">
                          {c.cacEur !== null ? formatEur(c.cacEur) : "—"}
                        </td>
                        <td className="px-5 py-3 text-right">
                          {c.roi !== null ? (
                            <span
                              className="inline-flex items-center gap-1 font-mono font-medium tabular-nums"
                              style={{ color: LABEL_COLORS[c.scoreLabel] }}
                            >
                              {c.roi >= 1 ? (
                                <TrendingUp className="h-3 w-3" />
                              ) : (
                                <TrendingDown className="h-3 w-3" />
                              )}
                              {c.roi.toFixed(2)}×
                            </span>
                          ) : (
                            <span className="text-muted text-xs">—</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            <p className="mt-4 text-xs text-muted">
              CAC = budget × {windowMonths} mois / convertis · LTV = deal moyen
              + 10 ans × entretien estimé 200 €/an · ROI = CA / dépense.
              Cliquez sur un budget pour le modifier.
            </p>
          </>
        )}
        {/* Suppress unused */}
        <span className="hidden">
          <TrendingUp className="h-3 w-3" />
        </span>
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
