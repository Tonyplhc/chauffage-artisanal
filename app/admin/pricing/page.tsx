"use client";

/**
 * Pricing intelligence — analyse des prix devis par segment.
 */

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Loader2,
  Tag,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

type Segment = {
  segment: string;
  service?: string;
  buildingType?: string;
  count: number;
  meanEur: number;
  medianEur: number;
  stdEur: number;
  minEur: number;
  maxEur: number;
  coefVariation: number | null;
};

type Outlier = {
  leadReference: string;
  fullName: string;
  service: string;
  buildingType: string;
  quoteHt: number;
  segmentMeanEur: number;
  deviationSigma: number;
  kind: "high" | "low";
};

type Report = {
  segments: Segment[];
  outliers: Outlier[];
  totalQuotes: number;
};

const SERVICE_LABELS: Record<string, string> = {
  chauffage: "Chauffage",
  pac: "Pompe à chaleur",
  clim: "Climatisation",
  sanitaire: "Sanitaire",
  enr: "ENR",
  depannage: "Dépannage",
  autre: "Autre",
};

const BUILDING_LABELS: Record<string, string> = {
  maison: "Maison",
  appartement: "Appartement",
  collectif: "Collectif",
  tertiaire: "Tertiaire",
  autre: "Autre",
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

export default function PricingPage() {
  const router = useRouter();
  const [report, setReport] = useState<Report | null>(null);

  const load = useCallback(async () => {
    const res = await fetch("/api/admin/pricing", { cache: "no-store" });
    if (res.status === 401) {
      router.replace("/admin/login");
      return;
    }
    if (res.ok) setReport(await res.json());
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
            Pricing intelligence
          </h1>
          <p className="mt-2 text-graphite">
            Analyse des prix devis par segment (service × type bâtiment).
            Détection des devis aberrants à plus de 1.5σ de la moyenne du
            segment.
          </p>
        </div>

        {!report ? (
          <div className="py-16 text-center text-muted">
            <Loader2 className="h-6 w-6 animate-spin mx-auto" />
          </div>
        ) : (
          <>
            <div className="rounded-2xl border border-ink/10 bg-white shadow-soft overflow-hidden mb-8">
              <div className="px-5 py-3 border-b border-ink/8 bg-cream/40 flex items-center gap-2">
                <Tag className="h-4 w-4 text-copper" />
                <span className="font-mono text-[10px] uppercase tracking-eyebrow text-copper">
                  Segments ({report.segments.length}) · {report.totalQuotes} devis
                  total
                </span>
              </div>
              {report.segments.length === 0 ? (
                <div className="py-12 text-center text-muted text-sm">
                  Pas encore assez de devis pour analyser.
                </div>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-cream/30 text-left text-graphite">
                      <th className="px-5 py-2.5 font-mono text-[10px] uppercase tracking-eyebrow">
                        Segment
                      </th>
                      <th className="px-3 py-2.5 font-mono text-[10px] uppercase tracking-eyebrow text-right">
                        N
                      </th>
                      <th className="px-3 py-2.5 font-mono text-[10px] uppercase tracking-eyebrow text-right">
                        Moyenne HT
                      </th>
                      <th className="px-3 py-2.5 font-mono text-[10px] uppercase tracking-eyebrow text-right">
                        Médiane
                      </th>
                      <th className="px-3 py-2.5 font-mono text-[10px] uppercase tracking-eyebrow text-right">
                        Min – Max
                      </th>
                      <th className="px-5 py-2.5 font-mono text-[10px] uppercase tracking-eyebrow text-right">
                        Dispersion
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-ink/5">
                    {report.segments.map((s) => (
                      <tr key={s.segment}>
                        <td className="px-5 py-3 text-ink">
                          <div className="font-medium">
                            {SERVICE_LABELS[s.service ?? ""] ?? s.service}
                          </div>
                          <div className="text-[11px] text-muted">
                            {BUILDING_LABELS[s.buildingType ?? ""] ??
                              s.buildingType}
                          </div>
                        </td>
                        <td className="px-3 py-3 text-right font-mono text-ink tabular-nums">
                          {s.count}
                        </td>
                        <td className="px-3 py-3 text-right font-mono text-ink tabular-nums">
                          {formatEur(s.meanEur, true)}
                        </td>
                        <td className="px-3 py-3 text-right font-mono text-xs text-graphite tabular-nums">
                          {formatEur(s.medianEur, true)}
                        </td>
                        <td className="px-3 py-3 text-right font-mono text-xs text-muted tabular-nums">
                          {formatEur(s.minEur, true)} –{" "}
                          {formatEur(s.maxEur, true)}
                        </td>
                        <td className="px-5 py-3 text-right">
                          {s.coefVariation !== null ? (
                            <span
                              className={cn(
                                "font-mono text-xs",
                                s.coefVariation < 0.3
                                  ? "text-[#22a06b]"
                                  : s.coefVariation < 0.5
                                    ? "text-copper"
                                    : "text-ember",
                              )}
                            >
                              CV {(s.coefVariation * 100).toFixed(0)}%
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

            <div className="rounded-2xl border border-ink/10 bg-white shadow-soft overflow-hidden">
              <div className="px-5 py-3 border-b border-ink/8 bg-cream/40 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-ember" />
                <span className="font-mono text-[10px] uppercase tracking-eyebrow text-ember">
                  Devis aberrants ({report.outliers.length})
                </span>
              </div>
              {report.outliers.length === 0 ? (
                <div className="py-12 text-center text-muted text-sm">
                  Aucun devis aberrant détecté.
                </div>
              ) : (
                <ul className="divide-y divide-ink/8">
                  {report.outliers.map((o) => (
                    <li key={o.leadReference}>
                      <Link
                        href={`/admin/leads/${o.leadReference}`}
                        className="grid lg:grid-cols-12 gap-3 items-center px-5 py-3 hover:bg-cream/40 transition-colors group"
                      >
                        <div className="lg:col-span-4 min-w-0">
                          <div className="text-sm font-medium text-ink truncate">
                            {o.fullName}
                          </div>
                          <div className="text-[11px] text-muted font-mono">
                            {o.leadReference}
                          </div>
                        </div>
                        <div className="lg:col-span-3 text-xs text-graphite">
                          {SERVICE_LABELS[o.service] ?? o.service} ·{" "}
                          {BUILDING_LABELS[o.buildingType] ?? o.buildingType}
                        </div>
                        <div className="lg:col-span-2 text-right">
                          <div className="font-mono text-sm text-ink tabular-nums">
                            {formatEur(o.quoteHt)}
                          </div>
                          <div className="text-[10px] text-muted">
                            moy. {formatEur(o.segmentMeanEur, true)}
                          </div>
                        </div>
                        <div className="lg:col-span-2 text-right">
                          <span
                            className={cn(
                              "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-mono",
                              o.kind === "high"
                                ? "bg-[#22a06b]/10 text-[#22a06b]"
                                : "bg-ember/10 text-ember",
                            )}
                          >
                            {o.kind === "high" ? (
                              <TrendingUp className="h-3 w-3" />
                            ) : (
                              <TrendingDown className="h-3 w-3" />
                            )}
                            {o.deviationSigma > 0 ? "+" : ""}
                            {o.deviationSigma}σ
                          </span>
                        </div>
                        <div className="lg:col-span-1 text-right">
                          <ArrowRight className="h-3.5 w-3.5 text-muted ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <p className="mt-4 text-xs text-muted">
              CV = écart-type / moyenne. CV &lt; 30% = prix cohérents,
              30-50% = variance modérée, &gt; 50% = grande dispersion à
              investiguer. σ = écart à la moyenne du segment.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
