"use client";

/**
 * Dashboard productivité — comparaison heures planifiées vs pointées par tech.
 *
 * Plages : 7 j, 30 j, 90 j, mois en cours. Indicateur d'efficacité (1.0 =
 * pile à l'heure, > 1 = dépassement).
 */

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Loader2,
  Clock,
  TrendingUp,
  TrendingDown,
  User,
} from "lucide-react";
import { cn } from "@/lib/utils";

type Row = {
  technicianEmail: string;
  plannedMinutes: number;
  actualMinutes: number;
  slotsTotal: number;
  slotsCompleted: number;
  efficiency: number | null;
};

const RANGES = [
  { id: "7d", label: "7 j" },
  { id: "30d", label: "30 j" },
  { id: "90d", label: "90 j" },
  { id: "month", label: "Mois en cours" },
] as const;

function rangeBounds(id: (typeof RANGES)[number]["id"]): {
  from: string;
  to: string;
} {
  const now = new Date();
  const to = new Date(now);
  to.setHours(23, 59, 59, 0);
  const from = new Date(now);
  if (id === "7d") from.setDate(now.getDate() - 7);
  else if (id === "30d") from.setDate(now.getDate() - 30);
  else if (id === "90d") from.setDate(now.getDate() - 90);
  else if (id === "month") {
    from.setDate(1);
    from.setHours(0, 0, 0, 0);
  }
  return { from: from.toISOString(), to: to.toISOString() };
}

function formatHours(min: number): string {
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m === 0 ? `${h} h` : `${h} h ${m}`;
}

export default function ProductivityPage() {
  const router = useRouter();
  const [rows, setRows] = useState<Row[] | null>(null);
  const [range, setRange] = useState<(typeof RANGES)[number]["id"]>("7d");

  const load = useCallback(async () => {
    const { from, to } = rangeBounds(range);
    const res = await fetch(
      `/api/admin/productivity?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`,
      { cache: "no-store" },
    );
    if (res.status === 401) {
      router.replace("/admin/login");
      return;
    }
    if (res.ok) {
      const d = await res.json();
      setRows(d.rows ?? []);
    }
  }, [router, range]);

  useEffect(() => {
    load();
    const i = setInterval(load, 60_000);
    return () => clearInterval(i);
  }, [load]);

  const totals = rows?.reduce(
    (acc, r) => {
      acc.planned += r.plannedMinutes;
      acc.actual += r.actualMinutes;
      acc.slotsTotal += r.slotsTotal;
      acc.slotsCompleted += r.slotsCompleted;
      return acc;
    },
    { planned: 0, actual: 0, slotsTotal: 0, slotsCompleted: 0 },
  );

  return (
    <div className="min-h-screen bg-cream py-10 lg:py-14">
      <div className="container max-w-5xl">
        <Link
          href="/admin/dispatch"
          className="inline-flex items-center gap-2 text-sm font-mono uppercase tracking-eyebrow text-graphite hover:text-copper transition-colors mb-6"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Retour planning
        </Link>

        <div className="flex items-start justify-between gap-3 flex-wrap mb-8">
          <div>
            <h1 className="font-display text-display-md text-ink">
              Productivité techniciens
            </h1>
            <p className="mt-2 text-graphite">
              Compare le temps planifié et le temps réellement pointé (clock-in
              / clock-out) par technicien.
            </p>
          </div>
          <div className="flex items-center gap-2">
            {RANGES.map((r) => (
              <button
                key={r.id}
                onClick={() => setRange(r.id)}
                className={cn(
                  "px-3 py-1.5 rounded-full text-sm transition-colors",
                  range === r.id
                    ? "bg-ink text-cream"
                    : "bg-white border border-ink/10 text-graphite hover:border-copper/40",
                )}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>

        {totals && (
          <div className="grid lg:grid-cols-4 gap-4 mb-8">
            <Kpi
              label="Slots planifiés"
              value={String(totals.slotsTotal)}
              hint={`${totals.slotsCompleted} pointés complets`}
              icon={<Clock className="h-4 w-4" />}
            />
            <Kpi
              label="Heures planifiées"
              value={formatHours(totals.planned)}
              icon={<Clock className="h-4 w-4 text-copper" />}
              accent="copper"
            />
            <Kpi
              label="Heures réelles"
              value={formatHours(totals.actual)}
              hint={
                totals.planned > 0
                  ? `${Math.round((totals.actual / totals.planned) * 100)}% du planifié`
                  : "—"
              }
              icon={<Clock className="h-4 w-4 text-[#22a06b]" />}
              accent="success"
            />
            <Kpi
              label="Techniciens actifs"
              value={String(rows?.length ?? 0)}
              icon={<User className="h-4 w-4" />}
            />
          </div>
        )}

        <div className="rounded-2xl border border-ink/10 bg-white shadow-soft overflow-hidden">
          <div className="px-5 py-3 border-b border-ink/8 bg-cream/40 font-mono text-[10px] uppercase tracking-eyebrow text-copper">
            Détail par technicien
          </div>
          {rows === null ? (
            <div className="py-12 text-center text-muted">
              <Loader2 className="h-5 w-5 animate-spin mx-auto" />
            </div>
          ) : rows.length === 0 ? (
            <div className="py-12 text-center text-muted">
              <Clock className="h-12 w-12 mx-auto opacity-20 text-copper mb-2" />
              <p>Aucun slot dans cette plage.</p>
            </div>
          ) : (
            <ul className="divide-y divide-ink/8">
              {rows.map((r) => {
                const variance =
                  r.efficiency === null ? null : r.efficiency - 1;
                const onTrack =
                  variance === null
                    ? null
                    : Math.abs(variance) < 0.1
                      ? "ok"
                      : variance > 0
                        ? "over"
                        : "under";
                return (
                  <li
                    key={r.technicianEmail}
                    className="px-5 py-4 grid lg:grid-cols-12 gap-3 items-center"
                  >
                    <div className="lg:col-span-4 min-w-0">
                      <div className="text-sm font-medium text-ink truncate">
                        {r.technicianEmail}
                      </div>
                      <div className="text-[11px] text-muted">
                        {r.slotsCompleted}/{r.slotsTotal} slots pointés
                      </div>
                    </div>
                    <div className="lg:col-span-3 text-right">
                      <div className="text-xs text-muted">Planifié</div>
                      <div className="font-mono text-sm text-ink">
                        {formatHours(r.plannedMinutes)}
                      </div>
                    </div>
                    <div className="lg:col-span-3 text-right">
                      <div className="text-xs text-muted">Réel</div>
                      <div className="font-mono text-sm text-copper">
                        {formatHours(r.actualMinutes)}
                      </div>
                    </div>
                    <div className="lg:col-span-2 text-right">
                      {r.efficiency !== null && onTrack && (
                        <div
                          className={cn(
                            "inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-mono",
                            onTrack === "ok"
                              ? "bg-[#22a06b]/10 text-[#22a06b]"
                              : onTrack === "over"
                                ? "bg-ember/10 text-ember"
                                : "bg-copper/10 text-copper",
                          )}
                        >
                          {onTrack === "ok" ? (
                            <Clock className="h-3 w-3" />
                          ) : onTrack === "over" ? (
                            <TrendingUp className="h-3 w-3" />
                          ) : (
                            <TrendingDown className="h-3 w-3" />
                          )}
                          {variance !== null && variance >= 0 ? "+" : ""}
                          {variance !== null
                            ? `${Math.round(variance * 100)}%`
                            : "—"}
                        </div>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <p className="mt-4 text-xs text-muted">
          Pour activer le pointage, ajouter une UI clock-in/out sur le planning
          (W23.2) qui pointe via{" "}
          <code>POST /api/admin/dispatch/[id]/clock</code>.
        </p>
      </div>
    </div>
  );
}

function Kpi({
  icon,
  label,
  value,
  hint,
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  hint?: string;
  accent?: "copper" | "success";
}) {
  return (
    <div className="rounded-2xl border border-ink/10 bg-white shadow-soft p-5">
      <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-eyebrow text-muted">
        {icon}
        {label}
      </div>
      <div
        className={`mt-2 font-display text-2xl tabular-nums ${
          accent === "copper"
            ? "text-copper"
            : accent === "success"
              ? "text-[#22a06b]"
              : "text-ink"
        }`}
      >
        {value}
      </div>
      {hint && <div className="text-xs text-muted mt-1">{hint}</div>}
    </div>
  );
}
