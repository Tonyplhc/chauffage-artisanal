"use client";

/**
 * Dashboard SLA — temps de premier contact par niveau.
 *
 * KPIs globaux + détail par niveau (hot/warm/cold) + table des leads
 * actuellement à risque (encore nouveaux et proche/au-delà de la cible).
 */

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Loader2,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Flame,
  Thermometer,
  Snowflake,
  ArrowRight,
} from "lucide-react";
import { LEVEL_COLORS, LEVEL_LABELS, type LeadLevel } from "@/lib/lead-scoring";
import { cn } from "@/lib/utils";

type Stats = {
  total: number;
  measured: number;
  ok: number;
  breach: number;
  pending: number;
  warning: number;
  na: number;
  complianceRate: number;
  avgResponseMs: number | null;
  byLevel: Record<
    LeadLevel,
    {
      total: number;
      ok: number;
      breach: number;
      pending: number;
      avgResponseMs: number | null;
    }
  >;
  atRisk: {
    reference: string;
    fullName: string;
    commune: string;
    level: LeadLevel | undefined;
    elapsedMs: number;
    targetMs: number;
    status: "breach" | "warning" | "ok" | "pending" | "na";
    submittedAt: string;
  }[];
};

type Target = { level: LeadLevel; minutes: number; label: string };

function formatDuration(ms: number): string {
  if (ms < 0) ms = 0;
  const min = Math.floor(ms / 60_000);
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  const rm = min % 60;
  if (h < 24) return rm === 0 ? `${h} h` : `${h} h ${rm} min`;
  const d = Math.floor(h / 24);
  const rh = h % 24;
  return rh === 0 ? `${d} j` : `${d} j ${rh} h`;
}

export default function SlaPage() {
  const router = useRouter();
  const [stats, setStats] = useState<Stats | null>(null);
  const [targets, setTargets] = useState<Record<LeadLevel, Target> | null>(null);
  const [asOf, setAsOf] = useState<string | null>(null);

  const load = useCallback(async () => {
    const res = await fetch("/api/admin/sla", { cache: "no-store" });
    if (res.status === 401) {
      router.replace("/admin/login");
      return;
    }
    if (res.ok) {
      const data = await res.json();
      setStats(data.stats);
      setTargets(data.targets);
      setAsOf(data.asOf);
    }
  }, [router]);

  useEffect(() => {
    load();
    const i = setInterval(load, 30_000);
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
            SLA premier contact
          </h1>
          <p className="mt-2 text-graphite">
            Cibles de temps de réponse par niveau de lead. Mesuré sur la
            première transition de statut hors de « nouveau ».{" "}
            {asOf && (
              <span className="text-muted">
                · Recalculé {new Date(asOf).toLocaleString("fr-FR")}
              </span>
            )}
          </p>
        </div>

        {stats === null || targets === null ? (
          <div className="py-16 text-center text-muted">
            <Loader2 className="h-6 w-6 animate-spin mx-auto" />
          </div>
        ) : (
          <>
            {/* KPIs globaux */}
            <div className="grid lg:grid-cols-4 gap-4 mb-8">
              <Kpi
                label="Respect SLA"
                value={`${Math.round(stats.complianceRate * 100)}%`}
                hint={`${stats.ok}/${stats.measured || 0} mesurés`}
                accent={
                  stats.complianceRate >= 0.85
                    ? "success"
                    : stats.complianceRate >= 0.6
                    ? "neutral"
                    : "warn"
                }
              />
              <Kpi
                label="Délai moyen"
                value={
                  stats.avgResponseMs === null
                    ? "—"
                    : formatDuration(stats.avgResponseMs)
                }
                hint={`sur ${stats.measured} leads mesurés`}
              />
              <Kpi
                label="À risque"
                value={String(stats.atRisk.length)}
                hint={`${stats.warning} warning + ${stats.atRisk.filter((r) => r.status === "breach").length} breach`}
                accent={stats.atRisk.length > 0 ? "warn" : "success"}
              />
              <Kpi
                label="Cibles"
                value=""
                customContent={
                  <div className="mt-2 grid gap-1 text-xs">
                    <TargetLine level="hot" label="Hot" target={targets.hot} />
                    <TargetLine level="warm" label="Warm" target={targets.warm} />
                    <TargetLine level="cold" label="Cold" target={targets.cold} />
                  </div>
                }
              />
            </div>

            {/* Détail par niveau */}
            <div className="grid lg:grid-cols-3 gap-4 mb-8">
              {(["hot", "warm", "cold"] as LeadLevel[]).map((lvl) => {
                const b = stats.byLevel[lvl];
                const rate =
                  b.ok + b.breach === 0 ? null : b.ok / (b.ok + b.breach);
                const Icon =
                  lvl === "hot" ? Flame : lvl === "warm" ? Thermometer : Snowflake;
                return (
                  <div
                    key={lvl}
                    className="rounded-2xl border border-ink/10 bg-white shadow-soft p-5"
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <Icon
                        className="h-4 w-4"
                        style={{ color: LEVEL_COLORS[lvl] }}
                      />
                      <span className="font-mono text-[10px] uppercase tracking-eyebrow text-muted">
                        {LEVEL_LABELS[lvl]}
                      </span>
                      <span className="ml-auto font-mono text-[10px] text-muted">
                        cible {targets[lvl].label}
                      </span>
                    </div>
                    <div className="font-display text-3xl tabular-nums text-ink">
                      {rate === null ? "—" : `${Math.round(rate * 100)}%`}
                    </div>
                    <div className="mt-2 text-xs text-muted">
                      {b.total} leads ·{" "}
                      <span className="text-[#22a06b]">{b.ok} OK</span>
                      {b.breach > 0 && (
                        <>
                          {" · "}
                          <span className="text-ember">{b.breach} breach</span>
                        </>
                      )}
                      {b.pending > 0 && (
                        <>
                          {" · "}
                          <span className="text-copper">{b.pending} en cours</span>
                        </>
                      )}
                    </div>
                    {b.avgResponseMs !== null && (
                      <div className="mt-3 pt-3 border-t border-ink/5 text-xs">
                        <span className="text-muted">Délai moyen : </span>
                        <span className="text-ink font-mono">
                          {formatDuration(b.avgResponseMs)}
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Leads à risque */}
            <div className="rounded-2xl border border-ink/10 bg-white shadow-soft overflow-hidden">
              <div className="px-5 py-3 border-b border-ink/8 bg-cream/40 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-ember" />
                <span className="font-mono text-[10px] uppercase tracking-eyebrow text-ember">
                  Leads nouveaux à risque
                </span>
                <span className="ml-auto font-mono text-xs text-muted">
                  {stats.atRisk.length}
                </span>
              </div>
              {stats.atRisk.length === 0 ? (
                <div className="py-12 text-center text-muted">
                  <CheckCircle2 className="h-10 w-10 mx-auto text-[#22a06b] opacity-50 mb-2" />
                  <p className="text-sm">
                    Aucun lead à risque. Pipeline en règle.
                  </p>
                </div>
              ) : (
                <ul className="divide-y divide-ink/8">
                  {stats.atRisk.map((r) => {
                    const ratio = r.targetMs > 0 ? r.elapsedMs / r.targetMs : 0;
                    const overBy = r.elapsedMs - r.targetMs;
                    return (
                      <li key={r.reference}>
                        <Link
                          href={`/admin/leads/${r.reference}`}
                          className="flex items-center gap-4 px-5 py-3 hover:bg-cream/40 transition-colors group"
                        >
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium text-ink truncate">
                                {r.fullName}
                              </span>
                              {r.level && (
                                <span
                                  className="px-2 py-0.5 rounded-full text-[10px] font-mono uppercase tracking-eyebrow"
                                  style={{
                                    background: `${LEVEL_COLORS[r.level]}1c`,
                                    color: LEVEL_COLORS[r.level],
                                  }}
                                >
                                  {LEVEL_LABELS[r.level]}
                                </span>
                              )}
                              <span
                                className={cn(
                                  "px-2 py-0.5 rounded-full text-[10px] font-mono uppercase tracking-eyebrow",
                                  r.status === "breach"
                                    ? "bg-ember/10 text-ember"
                                    : "bg-copper/10 text-copper",
                                )}
                              >
                                {r.status === "breach" ? "Breach" : "Warning"}
                              </span>
                            </div>
                            <div className="text-xs text-muted mt-0.5">
                              {r.reference} · {r.commune} ·{" "}
                              {new Date(r.submittedAt).toLocaleString("fr-FR")}
                            </div>
                            <div className="mt-1.5 h-1 w-full bg-cream rounded-full overflow-hidden">
                              <div
                                className={cn(
                                  "h-full transition-all",
                                  r.status === "breach"
                                    ? "bg-ember"
                                    : "bg-copper",
                                )}
                                style={{ width: `${Math.min(100, ratio * 100)}%` }}
                              />
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <div className="flex items-center gap-1 justify-end text-sm font-mono text-ink tabular-nums">
                              <Clock className="h-3 w-3 text-muted" />
                              {formatDuration(r.elapsedMs)}
                            </div>
                            <div
                              className={cn(
                                "text-[10px] mt-0.5",
                                r.status === "breach"
                                  ? "text-ember"
                                  : "text-copper",
                              )}
                            >
                              {r.status === "breach"
                                ? `+${formatDuration(Math.max(0, overBy))} sur cible`
                                : "Approche cible"}
                            </div>
                          </div>
                          <ArrowRight className="h-4 w-4 text-muted opacity-0 group-hover:opacity-100 transition-opacity" />
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>

            <p className="mt-4 text-xs text-muted">
              SLA en V1 : pas de calendrier d&apos;heures ouvrées. Les cibles
              comptent en temps réel. Pour une version avec business hours,
              brancher la lib `lib/sla-tracker.ts` sur une grille calendaire.
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
  accent,
  customContent,
}: {
  label: string;
  value: string;
  hint?: string;
  accent?: "success" | "warn" | "neutral";
  customContent?: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-ink/10 bg-white shadow-soft p-5">
      <div className="font-mono text-[10px] uppercase tracking-eyebrow text-muted">
        {label}
      </div>
      {!customContent && (
        <div
          className={cn(
            "mt-2 font-display text-3xl tabular-nums",
            accent === "success"
              ? "text-[#22a06b]"
              : accent === "warn"
              ? "text-ember"
              : "text-ink",
          )}
        >
          {value}
        </div>
      )}
      {customContent}
      {hint && <div className="mt-2 text-xs text-muted">{hint}</div>}
    </div>
  );
}

function TargetLine({
  level,
  label,
  target,
}: {
  level: LeadLevel;
  label: string;
  target: Target;
}) {
  return (
    <div className="flex items-center gap-2">
      <span
        className="h-2 w-2 rounded-full"
        style={{ background: LEVEL_COLORS[level] }}
      />
      <span className="text-graphite">{label}</span>
      <span className="ml-auto font-mono text-ink">{target.label}</span>
    </div>
  );
}
