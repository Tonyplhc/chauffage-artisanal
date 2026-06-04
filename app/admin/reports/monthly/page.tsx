"use client";

/**
 * Rapport mensuel admin avec comparaisons MoM (mois précédent) et YoY (N-1).
 *
 * Sélecteur de période en haut, KPIs principaux avec deltas, blocs détaillés :
 * top communes, répartition services, entonnoir statuts.
 */

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  Minus,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Calendar,
} from "lucide-react";
import { cn } from "@/lib/utils";

const SERVICE_LABELS: Record<string, string> = {
  chauffage: "Chauffage",
  pac: "Pompe à chaleur",
  clim: "Climatisation",
  sanitaire: "Sanitaire",
  enr: "Énergies renouvelables",
  depannage: "Dépannage",
  autre: "Autre",
};

const STATUS_LABELS: Record<string, string> = {
  nouveau: "Nouveau",
  contacte: "Contacté",
  devis_envoye: "Devis envoyé",
  converti: "Converti",
  perdu: "Perdu",
};

type Kpis = {
  leadsReceived: number;
  leadsHot: number;
  leadsConverted: number;
  leadsLost: number;
  conversionRate: number;
};

type Delta = { abs: number; pct: number | null };

type Comparison = {
  leadsReceived: Delta;
  leadsHot: Delta;
  leadsConverted: Delta;
  conversionRate: Delta;
};

type Report = {
  period: { year: number; month: number; label: string };
  kpis: Kpis;
  prevMonth: { kpis: Kpis; period: { label: string } };
  prevYear: { kpis: Kpis; period: { label: string } };
  vsPrevMonth: Comparison;
  vsPrevYear: Comparison;
  topCommunes: { name: string; count: number }[];
  serviceSplit: { service: string; count: number }[];
  statusFunnel: { status: string; count: number }[];
  totalsForContext: { allTimeLeads: number };
};

type AvailableMonth = {
  year: number;
  month: number;
  label: string;
  count: number;
};

function shiftMonth(year: number, month: number, delta: number) {
  const idx = (year * 12 + (month - 1)) + delta;
  return { year: Math.floor(idx / 12), month: (idx % 12) + 1 };
}

export default function MonthlyReportPage() {
  const router = useRouter();
  const now = new Date();
  const [year, setYear] = useState(now.getUTCFullYear());
  const [month, setMonth] = useState(now.getUTCMonth() + 1);
  const [report, setReport] = useState<Report | null>(null);
  const [available, setAvailable] = useState<AvailableMonth[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(
    async (y: number, m: number) => {
      setLoading(true);
      const res = await fetch(
        `/api/admin/reports/monthly?year=${y}&month=${m}`,
        { cache: "no-store" },
      );
      if (res.status === 401) {
        router.replace("/admin/login");
        return;
      }
      if (res.ok) {
        const data = await res.json();
        setReport(data.report);
        setAvailable(data.available ?? []);
      }
      setLoading(false);
    },
    [router],
  );

  useEffect(() => {
    load(year, month);
  }, [load, year, month]);

  const go = (delta: number) => {
    const next = shiftMonth(year, month, delta);
    setYear(next.year);
    setMonth(next.month);
  };

  return (
    <div className="min-h-screen bg-cream py-10 lg:py-14">
      <div className="container max-w-6xl">
        <Link
          href="/admin/reports"
          className="inline-flex items-center gap-2 text-sm font-mono uppercase tracking-eyebrow text-graphite hover:text-copper transition-colors mb-6"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Retour reports hebdo
        </Link>

        <div className="flex items-start justify-between gap-6 flex-wrap mb-8">
          <div>
            <h1 className="font-display text-display-md text-ink">
              Rapport mensuel
            </h1>
            <p className="mt-2 text-graphite">
              Comparaisons mois précédent (MoM) et même mois N-1 (YoY).
              {report?.totalsForContext.allTimeLeads !== undefined && (
                <span className="text-muted">
                  {" "}
                  · {report.totalsForContext.allTimeLeads} leads cumulés
                </span>
              )}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => go(-1)}
              className="h-10 w-10 grid place-items-center rounded-full border border-ink/15 bg-white hover:border-copper/40 transition-colors"
              aria-label="Mois précédent"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <div className="inline-flex items-center gap-2 rounded-full border border-ink/15 bg-white px-4 py-2 text-sm font-medium text-ink">
              <Calendar className="h-4 w-4 text-copper" />
              {report?.period.label ?? "…"}
            </div>
            <button
              onClick={() => go(1)}
              className="h-10 w-10 grid place-items-center rounded-full border border-ink/15 bg-white hover:border-copper/40 transition-colors"
              aria-label="Mois suivant"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        {available.length > 0 && (
          <div className="mb-6 flex items-center gap-2 flex-wrap">
            <span className="font-mono text-[10px] uppercase tracking-eyebrow text-muted">
              Mois avec données :
            </span>
            {available.slice(0, 12).map((a) => {
              const isActive = a.year === year && a.month === month;
              return (
                <button
                  key={`${a.year}-${a.month}`}
                  onClick={() => {
                    setYear(a.year);
                    setMonth(a.month);
                  }}
                  className={cn(
                    "px-3 py-1 rounded-full text-xs font-medium transition-colors",
                    isActive
                      ? "bg-ink text-cream"
                      : "bg-white border border-ink/10 text-graphite hover:border-copper/40",
                  )}
                >
                  {a.label}
                  <span
                    className={cn(
                      "ml-1.5 font-mono text-[10px]",
                      isActive ? "text-cream/70" : "text-muted",
                    )}
                  >
                    {a.count}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {loading && !report && (
          <div className="py-16 text-center text-muted">
            <Loader2 className="h-6 w-6 animate-spin mx-auto" />
          </div>
        )}

        {report && (
          <>
            {/* KPIs avec triple comparaison */}
            <div className="grid lg:grid-cols-4 gap-4 mb-8">
              <KpiCard
                label="Leads reçus"
                value={report.kpis.leadsReceived}
                vsPrevMonth={report.vsPrevMonth.leadsReceived}
                vsPrevYear={report.vsPrevYear.leadsReceived}
                prevMonthLabel={report.prevMonth.period.label}
                prevYearLabel={report.prevYear.period.label}
              />
              <KpiCard
                label="Hot leads"
                value={report.kpis.leadsHot}
                vsPrevMonth={report.vsPrevMonth.leadsHot}
                vsPrevYear={report.vsPrevYear.leadsHot}
                prevMonthLabel={report.prevMonth.period.label}
                prevYearLabel={report.prevYear.period.label}
                accent="ember"
              />
              <KpiCard
                label="Convertis"
                value={report.kpis.leadsConverted}
                vsPrevMonth={report.vsPrevMonth.leadsConverted}
                vsPrevYear={report.vsPrevYear.leadsConverted}
                prevMonthLabel={report.prevMonth.period.label}
                prevYearLabel={report.prevYear.period.label}
                accent="success"
              />
              <KpiCard
                label="Taux conversion"
                value={`${Math.round(report.kpis.conversionRate * 100)}%`}
                rawValue={report.kpis.conversionRate}
                vsPrevMonth={report.vsPrevMonth.conversionRate}
                vsPrevYear={report.vsPrevYear.conversionRate}
                prevMonthLabel={report.prevMonth.period.label}
                prevYearLabel={report.prevYear.period.label}
                deltaIsRatio
              />
            </div>

            <div className="grid lg:grid-cols-3 gap-4 mb-8">
              {/* Top communes */}
              <Panel title="Top communes">
                {report.topCommunes.length === 0 ? (
                  <EmptyMsg text="Aucune donnée." />
                ) : (
                  <ul className="grid gap-2">
                    {report.topCommunes.map((c, i) => (
                      <li
                        key={c.name}
                        className="flex items-center gap-3 p-2.5 rounded-xl bg-cream border border-ink/8"
                      >
                        <span className="h-7 w-7 grid place-items-center rounded-full bg-copper/10 text-copper text-xs font-mono">
                          {i + 1}
                        </span>
                        <span className="flex-1 text-sm text-ink truncate">
                          {c.name}
                        </span>
                        <span className="font-mono text-sm text-graphite tabular-nums">
                          {c.count}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </Panel>

              {/* Service split */}
              <Panel title="Répartition services">
                {report.serviceSplit.length === 0 ? (
                  <EmptyMsg text="Aucune donnée." />
                ) : (
                  <BarList
                    items={report.serviceSplit.map((s) => ({
                      label: SERVICE_LABELS[s.service] ?? s.service,
                      count: s.count,
                    }))}
                  />
                )}
              </Panel>

              {/* Status funnel */}
              <Panel title="Entonnoir statuts">
                <BarList
                  items={report.statusFunnel.map((s) => ({
                    label: STATUS_LABELS[s.status] ?? s.status,
                    count: s.count,
                  }))}
                  accent="ink"
                />
              </Panel>
            </div>

            {/* Récap comparatif */}
            <div className="rounded-2xl border border-ink/10 bg-white shadow-soft overflow-hidden">
              <div className="px-6 py-4 border-b border-ink/8 bg-cream/40 font-mono text-[10px] uppercase tracking-eyebrow text-copper">
                Tableau comparatif
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left bg-cream/30 text-graphite">
                      <th className="px-6 py-3 font-mono text-[10px] uppercase tracking-eyebrow">
                        Indicateur
                      </th>
                      <th className="px-4 py-3 font-mono text-[10px] uppercase tracking-eyebrow text-right">
                        {report.period.label}
                      </th>
                      <th className="px-4 py-3 font-mono text-[10px] uppercase tracking-eyebrow text-right">
                        {report.prevMonth.period.label}
                      </th>
                      <th className="px-4 py-3 font-mono text-[10px] uppercase tracking-eyebrow text-right">
                        {report.prevYear.period.label}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-ink/5">
                    <CompareRow
                      label="Leads reçus"
                      now={report.kpis.leadsReceived}
                      prevM={report.prevMonth.kpis.leadsReceived}
                      prevY={report.prevYear.kpis.leadsReceived}
                    />
                    <CompareRow
                      label="Hot leads"
                      now={report.kpis.leadsHot}
                      prevM={report.prevMonth.kpis.leadsHot}
                      prevY={report.prevYear.kpis.leadsHot}
                    />
                    <CompareRow
                      label="Convertis"
                      now={report.kpis.leadsConverted}
                      prevM={report.prevMonth.kpis.leadsConverted}
                      prevY={report.prevYear.kpis.leadsConverted}
                    />
                    <CompareRow
                      label="Perdus"
                      now={report.kpis.leadsLost}
                      prevM={report.prevMonth.kpis.leadsLost}
                      prevY={report.prevYear.kpis.leadsLost}
                    />
                    <CompareRow
                      label="Taux conversion"
                      now={report.kpis.conversionRate}
                      prevM={report.prevMonth.kpis.conversionRate}
                      prevY={report.prevYear.kpis.conversionRate}
                      formatter={(v) => `${Math.round(v * 100)}%`}
                    />
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function KpiCard({
  label,
  value,
  rawValue,
  vsPrevMonth,
  vsPrevYear,
  prevMonthLabel,
  prevYearLabel,
  accent,
  deltaIsRatio,
}: {
  label: string;
  value: number | string;
  rawValue?: number;
  vsPrevMonth: Delta;
  vsPrevYear: Delta;
  prevMonthLabel: string;
  prevYearLabel: string;
  accent?: "ember" | "success";
  deltaIsRatio?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-ink/10 bg-white shadow-soft p-5">
      <div className="font-mono text-[10px] uppercase tracking-eyebrow text-muted">
        {label}
      </div>
      <div
        className={cn(
          "mt-2 font-display text-4xl tabular-nums",
          accent === "ember"
            ? "text-ember"
            : accent === "success"
            ? "text-[#22a06b]"
            : "text-ink",
        )}
      >
        {value}
      </div>
      <div className="mt-3 pt-3 border-t border-ink/5 grid gap-1.5">
        <DeltaLine
          label={`vs ${prevMonthLabel}`}
          delta={vsPrevMonth}
          deltaIsRatio={deltaIsRatio}
        />
        <DeltaLine
          label={`vs ${prevYearLabel}`}
          delta={vsPrevYear}
          deltaIsRatio={deltaIsRatio}
        />
      </div>
      {/* tooltip silencieux pour rappeler la valeur brute */}
      {rawValue !== undefined && <span className="sr-only">{rawValue}</span>}
    </div>
  );
}

function DeltaLine({
  label,
  delta,
  deltaIsRatio,
}: {
  label: string;
  delta: Delta;
  deltaIsRatio?: boolean;
}) {
  const trend = delta.abs > 0 ? "up" : delta.abs < 0 ? "down" : "flat";
  const Icon =
    trend === "up" ? TrendingUp : trend === "down" ? TrendingDown : Minus;
  const color =
    trend === "up"
      ? "text-[#22a06b]"
      : trend === "down"
      ? "text-ember"
      : "text-muted";

  const absLabel = deltaIsRatio
    ? `${delta.abs >= 0 ? "+" : ""}${(delta.abs * 100).toFixed(1)} pts`
    : `${delta.abs >= 0 ? "+" : ""}${delta.abs}`;
  const pctLabel =
    delta.pct === null
      ? ""
      : ` (${delta.pct >= 0 ? "+" : ""}${Math.round(delta.pct * 100)}%)`;

  return (
    <div className={cn("flex items-center gap-1.5 text-xs", color)}>
      <Icon className="h-3 w-3" />
      <span className="font-mono">
        {absLabel}
        {pctLabel}
      </span>
      <span className="text-muted ml-auto truncate">{label}</span>
    </div>
  );
}

function Panel({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-ink/10 bg-white shadow-soft overflow-hidden">
      <div className="px-5 py-3 border-b border-ink/8 bg-cream/40 font-mono text-[10px] uppercase tracking-eyebrow text-copper">
        {title}
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}

function EmptyMsg({ text }: { text: string }) {
  return <div className="py-6 text-center text-sm text-muted">{text}</div>;
}

function BarList({
  items,
  accent,
}: {
  items: { label: string; count: number }[];
  accent?: "ink";
}) {
  const max = Math.max(1, ...items.map((i) => i.count));
  return (
    <ul className="grid gap-2">
      {items.map((it) => (
        <li key={it.label}>
          <div className="flex items-baseline justify-between gap-2 mb-1">
            <span className="text-sm text-ink truncate">{it.label}</span>
            <span className="font-mono text-xs text-graphite tabular-nums">
              {it.count}
            </span>
          </div>
          <div className="h-1.5 rounded-full bg-cream overflow-hidden">
            <div
              className={cn(
                "h-full rounded-full transition-all",
                accent === "ink" ? "bg-ink" : "bg-copper",
              )}
              style={{ width: `${(it.count / max) * 100}%` }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}

function CompareRow({
  label,
  now,
  prevM,
  prevY,
  formatter,
}: {
  label: string;
  now: number;
  prevM: number;
  prevY: number;
  formatter?: (v: number) => string;
}) {
  const f = formatter ?? ((v: number) => String(v));
  return (
    <tr>
      <td className="px-6 py-3 text-ink">{label}</td>
      <td className="px-4 py-3 text-right font-mono text-ink tabular-nums">
        {f(now)}
      </td>
      <td className="px-4 py-3 text-right font-mono text-graphite tabular-nums">
        {f(prevM)}
      </td>
      <td className="px-4 py-3 text-right font-mono text-graphite tabular-nums">
        {f(prevY)}
      </td>
    </tr>
  );
}
