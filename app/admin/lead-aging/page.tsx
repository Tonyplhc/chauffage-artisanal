"use client";

/**
 * Dashboard lead aging — durées moyennes par transition + bottlenecks.
 */

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Loader2,
  Clock,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  Target,
} from "lucide-react";
import { cn } from "@/lib/utils";

type Transition = {
  key: string;
  from: string;
  to: string;
  count: number;
  meanHours: number;
  medianHours: number;
  p90Hours: number;
  targetHours?: number;
  performanceRatio?: number;
};

type Aging = {
  byTransition: Transition[];
  bottleneck: Transition | null;
  averageTotalDaysToConvert: number | null;
  totalLeads: number;
  convertedLeads: number;
};

const STATUS_LABELS: Record<string, string> = {
  nouveau: "Nouveau",
  contacte: "Contacté",
  devis_envoye: "Devis envoyé",
  converti: "Converti",
  perdu: "Perdu",
};

function formatHours(h: number): string {
  if (h < 1) return `${Math.round(h * 60)} min`;
  if (h < 48) return `${h.toFixed(1)} h`;
  return `${(h / 24).toFixed(1)} j`;
}

export default function LeadAgingPage() {
  const router = useRouter();
  const [aging, setAging] = useState<Aging | null>(null);

  const load = useCallback(async () => {
    const res = await fetch("/api/admin/lead-aging", { cache: "no-store" });
    if (res.status === 401) {
      router.replace("/admin/login");
      return;
    }
    if (res.ok) setAging(await res.json());
  }, [router]);

  useEffect(() => {
    load();
    const i = setInterval(load, 120_000);
    return () => clearInterval(i);
  }, [load]);

  return (
    <div className="min-h-screen bg-cream py-10 lg:py-14">
      <div className="container max-w-5xl">
        <Link
          href="/admin/leads"
          className="inline-flex items-center gap-2 text-sm font-mono uppercase tracking-eyebrow text-graphite hover:text-copper transition-colors mb-6"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Retour pipeline
        </Link>

        <div className="mb-8">
          <h1 className="font-display text-display-md text-ink">
            Lead aging
          </h1>
          <p className="mt-2 text-graphite">
            Durées moyennes par transition du pipeline. Identifie les goulots
            d&apos;étranglement et compare aux SLA cibles.
          </p>
        </div>

        {!aging ? (
          <div className="py-16 text-center text-muted">
            <Loader2 className="h-6 w-6 animate-spin mx-auto" />
          </div>
        ) : (
          <>
            <div className="grid lg:grid-cols-3 gap-4 mb-8">
              <Kpi
                label="Leads dans la base"
                value={String(aging.totalLeads)}
                icon={<Clock className="h-4 w-4" />}
              />
              <Kpi
                label="Convertis"
                value={String(aging.convertedLeads)}
                hint={
                  aging.averageTotalDaysToConvert !== null
                    ? `${aging.averageTotalDaysToConvert} j moyens jusqu'à conversion`
                    : "—"
                }
                color="#22a06b"
                icon={<TrendingUp className="h-4 w-4 text-[#22a06b]" />}
              />
              <Kpi
                label="Bottleneck"
                value={
                  aging.bottleneck
                    ? `${aging.bottleneck.performanceRatio}× la cible`
                    : "—"
                }
                hint={
                  aging.bottleneck
                    ? `${STATUS_LABELS[aging.bottleneck.from]} → ${STATUS_LABELS[aging.bottleneck.to]}`
                    : "Aucun retard"
                }
                color={
                  aging.bottleneck &&
                  aging.bottleneck.performanceRatio &&
                  aging.bottleneck.performanceRatio > 1
                    ? "#dc5a28"
                    : "#22a06b"
                }
                icon={<AlertTriangle className="h-4 w-4" />}
              />
            </div>

            <div className="rounded-2xl border border-ink/10 bg-white shadow-soft overflow-hidden">
              <div className="px-5 py-3 border-b border-ink/8 bg-cream/40 font-mono text-[10px] uppercase tracking-eyebrow text-copper">
                Détail par transition
              </div>
              {aging.byTransition.length === 0 ? (
                <div className="py-12 text-center text-muted text-sm">
                  Pas encore assez d&apos;historique pour calculer les
                  transitions.
                </div>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-cream/30 text-left text-graphite">
                      <th className="px-5 py-2.5 font-mono text-[10px] uppercase tracking-eyebrow">
                        Transition
                      </th>
                      <th className="px-3 py-2.5 font-mono text-[10px] uppercase tracking-eyebrow text-right">
                        Volume
                      </th>
                      <th className="px-3 py-2.5 font-mono text-[10px] uppercase tracking-eyebrow text-right">
                        Moyenne
                      </th>
                      <th className="px-3 py-2.5 font-mono text-[10px] uppercase tracking-eyebrow text-right">
                        Médiane
                      </th>
                      <th className="px-3 py-2.5 font-mono text-[10px] uppercase tracking-eyebrow text-right">
                        P90
                      </th>
                      <th className="px-5 py-2.5 font-mono text-[10px] uppercase tracking-eyebrow text-right">
                        Cible
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-ink/5">
                    {aging.byTransition.map((t) => {
                      const overTarget =
                        t.performanceRatio !== undefined &&
                        t.performanceRatio > 1.1;
                      return (
                        <tr
                          key={t.key}
                          className={cn(
                            overTarget && "bg-ember/5",
                          )}
                        >
                          <td className="px-5 py-3">
                            <div className="inline-flex items-center gap-1.5 text-ink">
                              <span>{STATUS_LABELS[t.from] ?? t.from}</span>
                              <ArrowRight className="h-3 w-3 text-copper" />
                              <span>{STATUS_LABELS[t.to] ?? t.to}</span>
                            </div>
                          </td>
                          <td className="px-3 py-3 text-right font-mono text-graphite tabular-nums">
                            {t.count}
                          </td>
                          <td className="px-3 py-3 text-right font-mono text-ink tabular-nums">
                            {formatHours(t.meanHours)}
                          </td>
                          <td className="px-3 py-3 text-right font-mono text-xs text-muted tabular-nums">
                            {formatHours(t.medianHours)}
                          </td>
                          <td className="px-3 py-3 text-right font-mono text-xs text-muted tabular-nums">
                            {formatHours(t.p90Hours)}
                          </td>
                          <td className="px-5 py-3 text-right">
                            {t.targetHours ? (
                              <span
                                className={cn(
                                  "inline-flex items-center gap-1 font-mono text-xs",
                                  overTarget
                                    ? "text-ember font-medium"
                                    : "text-[#22a06b]",
                                )}
                              >
                                <Target className="h-2.5 w-2.5" />
                                {formatHours(t.targetHours)}
                                {t.performanceRatio && (
                                  <span className="ml-1">
                                    ({t.performanceRatio}×)
                                  </span>
                                )}
                              </span>
                            ) : (
                              <span className="text-muted text-xs">—</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>

            <p className="mt-4 text-xs text-muted">
              SLA cibles indicatives : Nouveau→Contacté 4 h ·
              Contacté→Devis envoyé 72 h · Devis→Converti 14 j ·
              Devis→Perdu 20 j. P90 = 90% des transitions sous cette durée.
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
  icon,
}: {
  label: string;
  value: string;
  hint?: string;
  color?: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-ink/10 bg-white shadow-soft p-5">
      <div
        className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-eyebrow"
        style={{ color: color ?? "#8b847a" }}
      >
        {icon}
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
