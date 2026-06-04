"use client";

/**
 * Suivi budgétaire des projets — prévu (devis) vs réalisé (facturé) + marge.
 */

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Loader2,
  Calculator,
  TrendingUp,
  TrendingDown,
  ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

type Budget = {
  leadReference: string;
  fullName: string;
  quoteHt: number;
  quoteTtc: number;
  invoicedHt: number;
  invoicedTtc: number;
  workedMinutes: number;
  estimatedMaterialCost: number;
  estimatedLaborCost: number;
  estimatedTotalCost: number;
  grossMarginEur: number;
  grossMarginPct: number | null;
  varianceHtEur: number;
  varianceHtPct: number | null;
};

type Stats = {
  projects: number;
  totalQuoteHt: number;
  totalInvoicedHt: number;
  totalEstimatedCost: number;
  totalGrossMargin: number;
  averageMarginPct: number | null;
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

function formatHours(min: number) {
  const h = Math.floor(min / 60);
  const m = min % 60;
  if (h === 0) return `${m} min`;
  return m === 0 ? `${h} h` : `${h} h ${m}`;
}

export default function ProjectBudgetsPage() {
  const router = useRouter();
  const [budgets, setBudgets] = useState<Budget[] | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);

  const load = useCallback(async () => {
    const res = await fetch("/api/admin/project-budgets", {
      cache: "no-store",
    });
    if (res.status === 401) {
      router.replace("/admin/login");
      return;
    }
    if (res.ok) {
      const d = await res.json();
      setBudgets(d.budgets ?? []);
      setStats(d.stats);
    }
  }, [router]);

  useEffect(() => {
    load();
    const i = setInterval(load, 120_000);
    return () => clearInterval(i);
  }, [load]);

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

        <div className="mb-8">
          <h1 className="font-display text-display-md text-ink">
            Budgets projets
          </h1>
          <p className="mt-2 text-graphite">
            Comparaison prévu (devis) vs réalisé (facturé) avec estimation de
            marge brute (matériel 50% du HT facturé + main-d&apos;œuvre =
            heures pointées × taux horaire technicien).
          </p>
        </div>

        {stats && (
          <div className="grid lg:grid-cols-4 gap-4 mb-8">
            <Kpi
              label="Projets"
              value={String(stats.projects)}
              hint="convertis"
            />
            <Kpi
              label="CA facturé HT"
              value={formatEur(stats.totalInvoicedHt, true)}
              hint={`vs ${formatEur(stats.totalQuoteHt, true)} devisé`}
            />
            <Kpi
              label="Marge brute estimée"
              value={formatEur(stats.totalGrossMargin, true)}
              hint={
                stats.averageMarginPct !== null
                  ? `${stats.averageMarginPct}% moyenne`
                  : "—"
              }
              color={stats.totalGrossMargin >= 0 ? "#22a06b" : "#dc5a28"}
            />
            <Kpi
              label="Coûts estimés"
              value={formatEur(stats.totalEstimatedCost, true)}
              hint="matériel + MO"
            />
          </div>
        )}

        <div className="rounded-2xl border border-ink/10 bg-white shadow-soft overflow-hidden">
          <div className="px-5 py-3 border-b border-ink/8 bg-cream/40 font-mono text-[10px] uppercase tracking-eyebrow text-copper">
            Détail par projet
          </div>
          {budgets === null ? (
            <div className="py-12 text-center text-muted">
              <Loader2 className="h-5 w-5 animate-spin mx-auto" />
            </div>
          ) : budgets.length === 0 ? (
            <div className="py-12 text-center text-muted text-sm">
              Aucun projet converti.
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-cream/30 text-left text-graphite">
                  <th className="px-5 py-2.5 font-mono text-[10px] uppercase tracking-eyebrow">
                    Client
                  </th>
                  <th className="px-3 py-2.5 font-mono text-[10px] uppercase tracking-eyebrow text-right">
                    Devis HT
                  </th>
                  <th className="px-3 py-2.5 font-mono text-[10px] uppercase tracking-eyebrow text-right">
                    Facturé HT
                  </th>
                  <th className="px-3 py-2.5 font-mono text-[10px] uppercase tracking-eyebrow text-right">
                    Écart
                  </th>
                  <th className="px-3 py-2.5 font-mono text-[10px] uppercase tracking-eyebrow text-right">
                    Heures
                  </th>
                  <th className="px-5 py-2.5 font-mono text-[10px] uppercase tracking-eyebrow text-right">
                    Marge
                  </th>
                  <th />
                </tr>
              </thead>
              <tbody className="divide-y divide-ink/5">
                {budgets.map((b) => (
                  <tr key={b.leadReference} className="hover:bg-cream/40 group">
                    <td className="px-5 py-3">
                      <Link
                        href={`/admin/leads/${b.leadReference}`}
                        className="text-ink font-medium hover:text-copper"
                      >
                        {b.fullName}
                      </Link>
                      <div className="text-[10px] font-mono text-muted">
                        {b.leadReference}
                      </div>
                    </td>
                    <td className="px-3 py-3 text-right font-mono text-ink tabular-nums">
                      {formatEur(b.quoteHt)}
                    </td>
                    <td className="px-3 py-3 text-right font-mono text-ink tabular-nums">
                      {formatEur(b.invoicedHt)}
                    </td>
                    <td className="px-3 py-3 text-right">
                      {b.varianceHtPct !== null ? (
                        <span
                          className={cn(
                            "inline-flex items-center gap-0.5 font-mono text-xs",
                            b.varianceHtPct > 5
                              ? "text-[#22a06b]"
                              : b.varianceHtPct < -5
                                ? "text-ember"
                                : "text-graphite",
                          )}
                        >
                          {b.varianceHtPct > 0 ? (
                            <TrendingUp className="h-2.5 w-2.5" />
                          ) : b.varianceHtPct < 0 ? (
                            <TrendingDown className="h-2.5 w-2.5" />
                          ) : null}
                          {b.varianceHtPct > 0 ? "+" : ""}
                          {b.varianceHtPct}%
                        </span>
                      ) : (
                        <span className="text-muted text-xs">—</span>
                      )}
                    </td>
                    <td className="px-3 py-3 text-right font-mono text-xs text-graphite">
                      {b.workedMinutes > 0 ? formatHours(b.workedMinutes) : "—"}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <div
                        className="font-mono tabular-nums"
                        style={{
                          color:
                            b.grossMarginEur >= 0 ? "#22a06b" : "#dc5a28",
                        }}
                      >
                        {formatEur(b.grossMarginEur)}
                      </div>
                      {b.grossMarginPct !== null && (
                        <div className="text-[10px] font-mono text-muted">
                          {b.grossMarginPct}%
                        </div>
                      )}
                    </td>
                    <td className="pr-3 py-3">
                      <Link
                        href={`/admin/leads/${b.leadReference}`}
                        className="opacity-0 group-hover:opacity-100 transition-opacity inline-flex items-center"
                      >
                        <ArrowRight className="h-3.5 w-3.5 text-copper" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <p className="mt-4 text-xs text-muted">
          Méthodologie : coût matériel estimé à 50% du HT facturé. Pour
          précision réelle, brancher les factures fournisseur. Coût
          main-d&apos;œuvre basé sur le pointage clock-in/out × taux horaire
          défini sur le profil technicien (défaut 45 €/h).
        </p>
        {/* Suppress unused */}
        <span className="hidden">
          <Calculator className="h-3 w-3" />
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
