"use client";

/**
 * Page de gestion + suivi des objectifs mensuels.
 *
 * Affiche le mois courant en grand (progress bars + pace + projection), puis
 * un formulaire pour fixer/modifier les cibles, puis un historique des mois
 * passés avec progression réalisée.
 */

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Loader2,
  Target,
  TrendingUp,
  TrendingDown,
  Trophy,
  Euro,
  Inbox,
  Save,
} from "lucide-react";
import { cn } from "@/lib/utils";

type Goal = {
  period: string;
  leadsTarget: number;
  convertedTarget: number;
  revenueTarget: number;
  createdAt: string;
  updatedAt: string;
};

type Progress = {
  period: string;
  goal: Goal | null;
  leadsCount: number;
  convertedCount: number;
  revenue: number;
  leadsProgress: number | null;
  convertedProgress: number | null;
  revenueProgress: number | null;
  monthElapsed: number;
  leadsPace: number | null;
  convertedPace: number | null;
  revenuePace: number | null;
  leadsProjected: number;
  convertedProjected: number;
  revenueProjected: number;
};

function formatEur(v: number, compact = false) {
  if (compact && Math.abs(v) >= 1000) {
    if (Math.abs(v) >= 1_000_000)
      return `${(v / 1_000_000).toFixed(1).replace(/\.0$/, "")} M€`;
    return `${(v / 1000).toFixed(v % 1000 === 0 ? 0 : 1).replace(/\.0$/, "")} k€`;
  }
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(v);
}

function paceLabel(pace: number | null): {
  label: string;
  color: string;
  icon: typeof TrendingUp;
} {
  if (pace === null)
    return { label: "—", color: "#8b847a", icon: TrendingUp };
  if (pace >= 1.1) return { label: "En avance", color: "#22a06b", icon: TrendingUp };
  if (pace >= 0.9) return { label: "À l'heure", color: "#b86a36", icon: TrendingUp };
  return { label: "En retard", color: "#dc5a28", icon: TrendingDown };
}

export default function GoalsPage() {
  const router = useRouter();
  const [progress, setProgress] = useState<Progress | null>(null);
  const [goals, setGoals] = useState<Goal[] | null>(null);
  const [draft, setDraft] = useState({
    leadsTarget: 0,
    convertedTarget: 0,
    revenueTarget: 0,
  });
  const [dirty, setDirty] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const [pr, gr] = await Promise.all([
      fetch("/api/admin/goals/current", { cache: "no-store" }),
      fetch("/api/admin/goals", { cache: "no-store" }),
    ]);
    if (pr.status === 401 || gr.status === 401) {
      router.replace("/admin/login");
      return;
    }
    if (pr.ok) {
      const d = await pr.json();
      setProgress(d.progress);
      if (d.progress.goal) {
        setDraft({
          leadsTarget: d.progress.goal.leadsTarget,
          convertedTarget: d.progress.goal.convertedTarget,
          revenueTarget: d.progress.goal.revenueTarget,
        });
      }
    }
    if (gr.ok) {
      const d = await gr.json();
      setGoals(d.goals ?? []);
    }
  }, [router]);

  useEffect(() => {
    load();
    const i = setInterval(load, 60_000);
    return () => clearInterval(i);
  }, [load]);

  const save = async () => {
    if (!progress) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/goals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ period: progress.period, ...draft }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Erreur");
      setDirty(false);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setBusy(false);
    }
  };

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
            Objectifs mensuels
          </h1>
          <p className="mt-2 text-graphite">
            Cibles mensuelles avec suivi de progression en temps réel et
            projection fin de mois si le rythme actuel se maintient.
          </p>
        </div>

        {!progress ? (
          <div className="py-16 text-center text-muted">
            <Loader2 className="h-6 w-6 animate-spin mx-auto" />
          </div>
        ) : (
          <>
            {/* Mois courant */}
            <div className="rounded-2xl border border-ink/10 bg-white shadow-soft p-6 mb-6">
              <div className="flex items-center justify-between gap-2 mb-5">
                <div>
                  <div className="font-mono text-[10px] uppercase tracking-eyebrow text-copper">
                    Mois en cours · {progress.period}
                  </div>
                  <div className="text-xs text-muted mt-0.5">
                    {Math.round(progress.monthElapsed * 100)}% du mois écoulé
                  </div>
                </div>
                <div className="w-32 h-1.5 bg-cream rounded-full overflow-hidden">
                  <div
                    className="h-full bg-copper transition-all"
                    style={{ width: `${progress.monthElapsed * 100}%` }}
                  />
                </div>
              </div>

              <div className="grid gap-4">
                <ProgressRow
                  icon={Inbox}
                  label="Leads reçus"
                  actual={progress.leadsCount}
                  target={progress.goal?.leadsTarget ?? 0}
                  progress={progress.leadsProgress}
                  pace={progress.leadsPace}
                  projected={progress.leadsProjected}
                  format={(n) => String(n)}
                />
                <ProgressRow
                  icon={Trophy}
                  label="Conversions"
                  actual={progress.convertedCount}
                  target={progress.goal?.convertedTarget ?? 0}
                  progress={progress.convertedProgress}
                  pace={progress.convertedPace}
                  projected={progress.convertedProjected}
                  format={(n) => String(n)}
                  accent="success"
                />
                <ProgressRow
                  icon={Euro}
                  label="Chiffre d'affaires réalisé"
                  actual={progress.revenue}
                  target={progress.goal?.revenueTarget ?? 0}
                  progress={progress.revenueProgress}
                  pace={progress.revenuePace}
                  projected={progress.revenueProjected}
                  format={(n) => formatEur(n, true)}
                  accent="copper"
                />
              </div>
            </div>

            {/* Édition des cibles */}
            <div className="rounded-2xl border border-ink/10 bg-white shadow-soft p-6 mb-6">
              <div className="flex items-center gap-2 mb-4">
                <Target className="h-4 w-4 text-copper" />
                <h2 className="font-display text-xl text-ink">
                  Définir les cibles
                </h2>
              </div>
              <div className="grid lg:grid-cols-3 gap-4">
                <NumberField
                  label="Leads / mois"
                  value={draft.leadsTarget}
                  onChange={(v) => {
                    setDraft({ ...draft, leadsTarget: v });
                    setDirty(true);
                  }}
                />
                <NumberField
                  label="Conversions / mois"
                  value={draft.convertedTarget}
                  onChange={(v) => {
                    setDraft({ ...draft, convertedTarget: v });
                    setDirty(true);
                  }}
                />
                <NumberField
                  label="CA / mois (€)"
                  value={draft.revenueTarget}
                  onChange={(v) => {
                    setDraft({ ...draft, revenueTarget: v });
                    setDirty(true);
                  }}
                  step={1000}
                />
              </div>
              {error && (
                <div className="mt-3 text-xs text-ember">{error}</div>
              )}
              <div className="mt-4 flex items-center gap-2">
                <button
                  onClick={save}
                  disabled={busy || !dirty}
                  className="inline-flex items-center gap-1.5 rounded-full bg-ink text-cream px-4 py-2 text-sm hover:bg-copper disabled:opacity-40"
                >
                  {busy ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Save className="h-3.5 w-3.5" />
                  )}
                  {dirty ? "Enregistrer les cibles" : "À jour"}
                </button>
                <span className="text-[11px] text-muted">
                  Valeur à 0 = métrique désactivée pour le mois.
                </span>
              </div>
            </div>

            {/* Historique */}
            {goals && goals.length > 0 && (
              <div className="rounded-2xl border border-ink/10 bg-white shadow-soft overflow-hidden">
                <div className="px-5 py-3 border-b border-ink/8 bg-cream/40 font-mono text-[10px] uppercase tracking-eyebrow text-copper">
                  Historique des objectifs
                </div>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-cream/30 text-left text-graphite">
                      <th className="px-5 py-2.5 font-mono text-[10px] uppercase tracking-eyebrow">
                        Période
                      </th>
                      <th className="px-3 py-2.5 font-mono text-[10px] uppercase tracking-eyebrow text-right">
                        Leads cible
                      </th>
                      <th className="px-3 py-2.5 font-mono text-[10px] uppercase tracking-eyebrow text-right">
                        Conv. cible
                      </th>
                      <th className="px-5 py-2.5 font-mono text-[10px] uppercase tracking-eyebrow text-right">
                        CA cible
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-ink/5">
                    {goals.map((g) => (
                      <tr key={g.period}>
                        <td className="px-5 py-2.5 font-mono text-ink">
                          {g.period}
                        </td>
                        <td className="px-3 py-2.5 text-right font-mono text-ink tabular-nums">
                          {g.leadsTarget || "—"}
                        </td>
                        <td className="px-3 py-2.5 text-right font-mono text-ink tabular-nums">
                          {g.convertedTarget || "—"}
                        </td>
                        <td className="px-5 py-2.5 text-right font-mono text-ink tabular-nums">
                          {g.revenueTarget
                            ? formatEur(g.revenueTarget, true)
                            : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function ProgressRow({
  icon: Icon,
  label,
  actual,
  target,
  progress,
  pace,
  projected,
  format,
  accent,
}: {
  icon: typeof Inbox;
  label: string;
  actual: number;
  target: number;
  progress: number | null;
  pace: number | null;
  projected: number;
  format: (n: number) => string;
  accent?: "success" | "copper";
}) {
  const paceInfo = paceLabel(pace);
  const PaceIcon = paceInfo.icon;
  const pct = progress === null ? 0 : Math.min(100, progress * 100);
  const barColor =
    accent === "success" ? "#22a06b" : accent === "copper" ? "#b86a36" : "#1e1a15";
  return (
    <div>
      <div className="flex items-center gap-2 mb-1">
        <Icon className="h-3.5 w-3.5 text-graphite" />
        <span className="text-sm text-ink font-medium">{label}</span>
        <span className="ml-auto font-mono text-sm text-ink tabular-nums">
          {format(actual)}
        </span>
        {target > 0 && (
          <span className="text-[11px] text-muted">/ {format(target)}</span>
        )}
      </div>
      <div className="h-2 bg-cream rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all"
          style={{
            width: `${pct}%`,
            background: barColor,
          }}
        />
      </div>
      <div className="mt-1 flex items-center justify-between text-[11px]">
        {progress !== null && target > 0 ? (
          <span className="text-muted">
            {Math.round(progress * 100)}% de la cible
          </span>
        ) : (
          <span className="text-muted">Pas de cible définie</span>
        )}
        {pace !== null && (
          <span
            className={cn("inline-flex items-center gap-1")}
            style={{ color: paceInfo.color }}
          >
            <PaceIcon className="h-2.5 w-2.5" />
            {paceInfo.label} · proj. {format(projected)}
          </span>
        )}
      </div>
    </div>
  );
}

function NumberField({
  label,
  value,
  onChange,
  step = 1,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  step?: number;
}) {
  return (
    <label className="block">
      <span className="font-mono text-[10px] uppercase tracking-eyebrow text-muted">
        {label}
      </span>
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(Number(e.target.value) || 0)}
        step={step}
        min={0}
        className="mt-1 w-full bg-cream border border-ink/12 rounded-xl px-3 py-2 text-sm font-mono tabular-nums focus:border-copper focus:outline-none"
      />
    </label>
  );
}
