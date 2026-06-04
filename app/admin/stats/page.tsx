"use client";

/**
 * Tableau de bord stats admin.
 *
 * Pas de dépendance graphique externe — tout est SVG inline pour rester léger
 * et imprimable. Données récupérées via /api/admin/leads (déjà existant).
 */

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  RefreshCw,
  Inbox,
  Phone,
  FileText,
  Trophy,
  X as XIcon,
  Flame,
  Snowflake,
  Clock,
  TrendingUp,
} from "lucide-react";
import type { LeadRecord } from "@/lib/devis-schema";
import { LEVEL_LABELS, LEVEL_COLORS } from "@/lib/lead-scoring";
import { cn } from "@/lib/utils";

const SERVICE_LABEL: Record<LeadRecord["services"][number], string> = {
  chauffage: "Chauffage",
  pac: "PAC",
  clim: "Clim",
  sanitaire: "Sanitaire",
  enr: "EnR",
  depannage: "Dépannage",
  autre: "Autre",
};

const STATUS_LABEL: Record<LeadRecord["status"], string> = {
  nouveau: "Nouveau",
  contacte: "Contacté",
  devis_envoye: "Devis envoyé",
  converti: "Converti",
  perdu: "Perdu",
};

const STATUS_COLOR: Record<LeadRecord["status"], string> = {
  nouveau: "#b86a36",
  contacte: "#6ba3c5",
  devis_envoye: "#94532a",
  converti: "#22a06b",
  perdu: "#8b847a",
};

export default function AdminStatsPage() {
  const router = useRouter();
  const [leads, setLeads] = useState<LeadRecord[] | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const refresh = async () => {
    setRefreshing(true);
    try {
      const res = await fetch("/api/admin/leads", { cache: "no-store" });
      if (res.status === 401) {
        router.replace("/admin/login");
        return;
      }
      const data = await res.json();
      setLeads(data.leads ?? []);
    } catch {
      setLeads([]);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  const stats = useMemo(() => {
    if (!leads) return null;
    return computeStats(leads);
  }, [leads]);

  return (
    <div className="min-h-screen bg-cream py-10 lg:py-14">
      <div className="container max-w-7xl">
        {/* Header */}
        <div className="flex items-start justify-between gap-6 flex-wrap mb-8">
          <div>
            <div className="font-mono text-xs uppercase tracking-eyebrow text-copper">
              Pipeline interne · démo
            </div>
            <h1 className="mt-3 font-display text-display-md text-ink">
              Statistiques
            </h1>
            <p className="mt-2 text-graphite text-base">
              Funnel de conversion, dynamique 30 jours, répartition par service et par niveau.
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Link
              href="/admin/leads"
              className="inline-flex items-center gap-2 rounded-full border border-ink/15 px-5 py-2.5 text-base bg-white hover:border-copper/40 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Retour pipeline
            </Link>
            <button
              onClick={refresh}
              className="inline-flex items-center gap-2 rounded-full border border-ink/15 px-5 py-2.5 text-base bg-white hover:border-copper/40 transition-colors"
            >
              <RefreshCw className={cn("h-4 w-4", refreshing && "animate-spin")} />
              Actualiser
            </button>
          </div>
        </div>

        {leads === null ? (
          <div className="rounded-2xl bg-white border border-ink/10 p-12 text-center text-muted">
            Chargement des statistiques…
          </div>
        ) : !stats || stats.total === 0 ? (
          <div className="rounded-2xl bg-white border border-ink/10 p-12 text-center">
            <div className="text-graphite">Aucune donnée à afficher pour l&apos;instant.</div>
            <div className="mt-2 text-sm text-muted">
              Les statistiques s&apos;activent dès qu&apos;un lead est enregistré.
            </div>
          </div>
        ) : (
          <>
            {/* KPI top row */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
              <BigKpi
                label="Total demandes"
                value={stats.total}
                hint={`${stats.last30Days} sur 30 jours`}
                icon={Inbox}
                accent="copper"
              />
              <BigKpi
                label="Taux de conversion"
                value={stats.conversionRate !== null ? `${stats.conversionRate}%` : "—"}
                hint={`${stats.converted} convertis / ${stats.closed} fermés`}
                icon={TrendingUp}
                accent="green"
              />
              <BigKpi
                label="Hot leads"
                value={stats.hot}
                hint={`${stats.hotNouveau} non traités`}
                icon={Flame}
                accent="ember"
              />
              <BigKpi
                label="Délai moyen 1er contact"
                value={stats.avgFirstContactHours !== null ? `${stats.avgFirstContactHours}h` : "—"}
                hint="entre soumission et statut « contacté »"
                icon={Clock}
                accent="copper"
              />
            </div>

            {/* Funnel + Level distribution */}
            <div className="grid lg:grid-cols-2 gap-6 mb-6">
              <Panel title="Funnel de conversion" subtitle="Distribution actuelle des statuts">
                <Funnel data={stats.byStatus} total={stats.total} />
              </Panel>

              <Panel title="Niveau des leads" subtitle="Scoring automatique (hot / tiède / froid)">
                <LevelDistribution
                  hot={stats.byLevel.hot}
                  warm={stats.byLevel.warm}
                  cold={stats.byLevel.cold}
                  unscored={stats.byLevel.unscored}
                />
              </Panel>
            </div>

            {/* Activity over 30 days */}
            <div className="mb-6">
              <Panel
                title="Activité — 30 derniers jours"
                subtitle={`${stats.last30Days} demandes reçues sur la période`}
              >
                <ActivityChart series={stats.daily} />
              </Panel>
            </div>

            {/* Service breakdown */}
            <div className="grid lg:grid-cols-2 gap-6">
              <Panel
                title="Répartition par service"
                subtitle="Tous statuts confondus, multi-services comptés sur chaque ligne"
              >
                <ServiceBars data={stats.byService} />
              </Panel>

              <Panel
                title="Répartition par budget"
                subtitle="Indication client au moment de la demande"
              >
                <ServiceBars data={stats.byBudget} />
              </Panel>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/* ─────────────── Compute stats ─────────────── */

function computeStats(leads: LeadRecord[]) {
  const total = leads.length;
  const now = Date.now();
  const day = 86_400_000;

  // Status counts
  const byStatus: Record<LeadRecord["status"], number> = {
    nouveau: 0,
    contacte: 0,
    devis_envoye: 0,
    converti: 0,
    perdu: 0,
  };
  for (const l of leads) byStatus[l.status]++;

  const converted = byStatus.converti;
  const closed = byStatus.converti + byStatus.perdu;
  const conversionRate = closed > 0 ? Math.round((converted / closed) * 100) : null;

  // Last 30 days
  const last30Days = leads.filter(
    (l) => now - new Date(l.submittedAt).getTime() <= 30 * day,
  ).length;

  // Daily series 30 days (bucket aligned to day, oldest first)
  const daily: { date: string; count: number }[] = [];
  for (let i = 29; i >= 0; i--) {
    const start = now - i * day;
    const date = new Date(start);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
    daily.push({ date: key, count: 0 });
  }
  const dailyIdx = new Map(daily.map((d, i) => [d.date, i]));
  for (const l of leads) {
    const d = new Date(l.submittedAt);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    const i = dailyIdx.get(key);
    if (i !== undefined) daily[i].count++;
  }

  // Level distribution
  const byLevel = { hot: 0, warm: 0, cold: 0, unscored: 0 };
  for (const l of leads) {
    if (l.level === "hot") byLevel.hot++;
    else if (l.level === "warm") byLevel.warm++;
    else if (l.level === "cold") byLevel.cold++;
    else byLevel.unscored++;
  }
  const hot = byLevel.hot;
  const hotNouveau = leads.filter(
    (l) => l.status === "nouveau" && l.level === "hot",
  ).length;

  // Service breakdown — multi-services count on each
  const services = ["chauffage", "pac", "clim", "sanitaire", "enr", "depannage", "autre"] as const;
  const byService = services.map((s) => ({
    label: SERVICE_LABEL[s],
    value: leads.filter((l) => l.services.includes(s)).length,
  }));

  // Budget breakdown
  const budgets = ["less10", "10-20", "20-40", "40plus", "inconnu"] as const;
  const budgetLabels: Record<(typeof budgets)[number], string> = {
    less10: "< 10 k€",
    "10-20": "10-20 k€",
    "20-40": "20-40 k€",
    "40plus": "> 40 k€",
    inconnu: "Inconnu",
  };
  const byBudget = budgets.map((b) => ({
    label: budgetLabels[b],
    value: leads.filter((l) => l.budget === b).length,
  }));

  // Délai moyen 1er contact — calculé à partir de l'audit log statusHistory.
  // Premier passage "nouveau" → "contacte" (ou tout statut non-nouveau).
  const firstContactDelays: number[] = [];
  for (const l of leads) {
    const hist = l.statusHistory ?? [];
    const firstTransition = hist.find((h) => h.from === "nouveau" && h.to !== "nouveau");
    if (firstTransition) {
      const submittedMs = new Date(l.submittedAt).getTime();
      const transitionMs = new Date(firstTransition.at).getTime();
      const hours = (transitionMs - submittedMs) / 3_600_000;
      if (hours >= 0) firstContactDelays.push(hours);
    }
  }
  const avgFirstContactHours: number | null =
    firstContactDelays.length > 0
      ? Math.round(
          (firstContactDelays.reduce((a, b) => a + b, 0) / firstContactDelays.length) * 10,
        ) / 10
      : null;

  return {
    total,
    byStatus,
    converted,
    closed,
    conversionRate,
    last30Days,
    daily,
    byLevel,
    hot,
    hotNouveau,
    byService,
    byBudget,
    avgFirstContactHours,
  };
}

/* ─────────────── Cards & panels ─────────────── */

function BigKpi({
  label,
  value,
  hint,
  icon: Icon,
  accent,
}: {
  label: string;
  value: number | string;
  hint?: string;
  icon: any;
  accent: "copper" | "ember" | "green";
}) {
  const accentClass =
    accent === "ember"
      ? "bg-ember/10 border-ember/30 text-ember"
      : accent === "green"
      ? "bg-[#22a06b]/10 border-[#22a06b]/30 text-[#22a06b]"
      : "bg-copper/10 border-copper/30 text-copper";
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-5 rounded-2xl bg-white border border-ink/10 shadow-soft"
    >
      <div className="flex items-center gap-3">
        <span
          className={cn("h-11 w-11 rounded-full grid place-items-center border", accentClass)}
        >
          <Icon className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="font-mono text-xs uppercase tracking-eyebrow text-muted">{label}</div>
          <div className="mt-1 font-display text-3xl text-ink tabular-nums">{value}</div>
        </div>
      </div>
      {hint && <div className="mt-3 text-xs text-muted">{hint}</div>}
    </motion.div>
  );
}

function Panel({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="p-6 lg:p-7 rounded-2xl bg-white border border-ink/10 shadow-soft">
      <div className="mb-5">
        <div className="font-mono text-xs uppercase tracking-eyebrow text-copper">
          {title}
        </div>
        {subtitle && <div className="mt-1 text-sm text-muted">{subtitle}</div>}
      </div>
      {children}
    </div>
  );
}

/* ─────────────── Funnel ─────────────── */

function Funnel({
  data,
  total,
}: {
  data: Record<LeadRecord["status"], number>;
  total: number;
}) {
  const STAGES: Exclude<LeadRecord["status"], "perdu">[] = [
    "nouveau",
    "contacte",
    "devis_envoye",
    "converti",
  ];
  const STAGE_ICON = {
    nouveau: Inbox,
    contacte: Phone,
    devis_envoye: FileText,
    converti: Trophy,
  } as const;
  // Cumulatif : à partir de "nouveau" on inclut aussi les statuts plus avancés
  // (un lead "converti" a forcément été "contacté" un jour).
  const order: Record<LeadRecord["status"], number> = {
    nouveau: 0,
    contacte: 1,
    devis_envoye: 2,
    converti: 3,
    perdu: -1,
  };
  const cumulative = (stage: LeadRecord["status"]) => {
    const lvl = order[stage];
    return (Object.keys(data) as LeadRecord["status"][])
      .filter((s) => order[s] >= lvl && s !== "perdu")
      .reduce((acc, s) => acc + data[s], 0);
  };

  const counts = STAGES.map((s) => ({
    stage: s,
    label: STATUS_LABEL[s],
    color: STATUS_COLOR[s],
    icon: STAGE_ICON[s],
    raw: data[s],
    cumul: cumulative(s),
  }));
  const max = Math.max(...counts.map((c) => c.cumul), 1);

  return (
    <div className="space-y-3">
      {counts.map((c, i) => {
        const pct = Math.round((c.cumul / max) * 100);
        const conv = total > 0 ? Math.round((c.cumul / total) * 100) : 0;
        return (
          <div key={c.stage} className="relative">
            <div className="flex items-center gap-3 mb-1.5">
              <span
                className="h-7 w-7 rounded-full grid place-items-center border shrink-0"
                style={{ background: `${c.color}15`, borderColor: `${c.color}55`, color: c.color }}
              >
                <c.icon className="h-3.5 w-3.5" />
              </span>
              <div className="text-sm text-ink font-medium flex-1">{c.label}</div>
              <div className="font-mono text-sm text-graphite tabular-nums">
                {c.cumul}
                {total > 0 && (
                  <span className="text-muted ml-1.5 text-xs">({conv}%)</span>
                )}
              </div>
            </div>
            <div
              className="h-2 rounded-full overflow-hidden bg-ink/5"
              style={{ marginLeft: 40 }}
            >
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={{ duration: 0.7, delay: i * 0.1 }}
                className="h-full rounded-full"
                style={{ background: c.color }}
              />
            </div>
          </div>
        );
      })}
      {data.perdu > 0 && (
        <div className="mt-5 pt-4 border-t border-ink/8 flex items-center gap-3">
          <span
            className="h-7 w-7 rounded-full grid place-items-center border shrink-0"
            style={{ background: `${STATUS_COLOR.perdu}15`, borderColor: `${STATUS_COLOR.perdu}55`, color: STATUS_COLOR.perdu }}
          >
            <XIcon className="h-3.5 w-3.5" />
          </span>
          <div className="text-sm text-muted flex-1">Dossiers perdus</div>
          <div className="font-mono text-sm text-muted tabular-nums">{data.perdu}</div>
        </div>
      )}
    </div>
  );
}

/* ─────────────── Level distribution ─────────────── */

function LevelDistribution({
  hot,
  warm,
  cold,
  unscored,
}: {
  hot: number;
  warm: number;
  cold: number;
  unscored: number;
}) {
  const total = hot + warm + cold + unscored;
  if (total === 0) return <div className="text-sm text-muted">Aucune donnée.</div>;
  const items = [
    { key: "hot" as const, label: LEVEL_LABELS.hot, value: hot, color: LEVEL_COLORS.hot, icon: Flame },
    { key: "warm" as const, label: LEVEL_LABELS.warm, value: warm, color: LEVEL_COLORS.warm, icon: TrendingUp },
    { key: "cold" as const, label: LEVEL_LABELS.cold, value: cold, color: LEVEL_COLORS.cold, icon: Snowflake },
  ];

  return (
    <div>
      {/* Stacked horizontal bar */}
      <div className="flex h-3 rounded-full overflow-hidden bg-ink/5 mb-5">
        {items.map((it) => {
          const w = (it.value / total) * 100;
          if (w === 0) return null;
          return (
            <motion.div
              key={it.key}
              initial={{ width: 0 }}
              animate={{ width: `${w}%` }}
              transition={{ duration: 0.7 }}
              style={{ background: it.color }}
              className="h-full"
            />
          );
        })}
      </div>

      {/* Legend rows */}
      <div className="grid gap-2">
        {items.map((it) => (
          <div
            key={it.key}
            className="flex items-center gap-3 px-3 py-2 rounded-xl bg-cream border border-ink/8"
          >
            <span
              className="h-7 w-7 rounded-full grid place-items-center border shrink-0"
              style={{ background: `${it.color}15`, borderColor: `${it.color}55`, color: it.color }}
            >
              <it.icon className="h-3.5 w-3.5" />
            </span>
            <div className="text-sm text-ink font-medium flex-1">{it.label}</div>
            <div className="font-mono text-sm text-graphite tabular-nums">
              {it.value}
              <span className="text-muted ml-1.5 text-xs">
                ({total > 0 ? Math.round((it.value / total) * 100) : 0}%)
              </span>
            </div>
          </div>
        ))}
        {unscored > 0 && (
          <div className="text-xs text-muted px-3">
            {unscored} lead{unscored > 1 ? "s" : ""} sans score (anciens dossiers avant
            scoring auto)
          </div>
        )}
      </div>
    </div>
  );
}

/* ─────────────── Activity chart (sparkline + bars) ─────────────── */

function ActivityChart({ series }: { series: { date: string; count: number }[] }) {
  const max = Math.max(...series.map((s) => s.count), 1);
  const width = 100; // viewBox arbitrary
  const height = 40;
  const points = series
    .map(
      (s, i) =>
        `${(i / (series.length - 1)) * width},${height - (s.count / max) * height}`,
    )
    .join(" ");

  return (
    <div>
      {/* SVG sparkline */}
      <svg
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="none"
        className="w-full h-24 mb-4"
      >
        <defs>
          <linearGradient id="spark" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#b86a36" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#b86a36" stopOpacity="0" />
          </linearGradient>
        </defs>
        <polyline
          points={`0,${height} ${points} ${width},${height}`}
          fill="url(#spark)"
          stroke="none"
        />
        <polyline points={points} fill="none" stroke="#b86a36" strokeWidth="1" />
      </svg>

      {/* Bar grid */}
      <div
        className="grid gap-0.5"
        style={{ gridTemplateColumns: `repeat(${series.length}, minmax(0, 1fr))` }}
      >
        {series.map((s) => {
          const h = (s.count / max) * 100;
          const d = new Date(s.date);
          const tooltip = `${d.toLocaleDateString("fr-FR", { day: "numeric", month: "short" })} · ${s.count} demande${s.count > 1 ? "s" : ""}`;
          return (
            <div
              key={s.date}
              title={tooltip}
              className="relative h-12 flex items-end justify-center group"
            >
              <div
                className="w-full rounded-sm transition-colors"
                style={{
                  height: `${Math.max(h, s.count > 0 ? 6 : 2)}%`,
                  background: s.count > 0 ? "#b86a36" : "#e3d8c5",
                }}
              />
            </div>
          );
        })}
      </div>
      <div className="mt-3 flex justify-between font-mono text-[10px] uppercase tracking-eyebrow text-muted">
        <span>{formatShort(series[0].date)}</span>
        <span>aujourd&apos;hui</span>
      </div>
    </div>
  );
}

function formatShort(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "short" });
}

/* ─────────────── Generic horizontal bars ─────────────── */

function ServiceBars({ data }: { data: { label: string; value: number }[] }) {
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <div className="space-y-3">
      {data.map((d, i) => {
        const pct = (d.value / max) * 100;
        return (
          <div key={d.label}>
            <div className="flex items-center justify-between text-sm mb-1.5">
              <span className="text-ink">{d.label}</span>
              <span className="font-mono text-muted tabular-nums">{d.value}</span>
            </div>
            <div className="h-2 rounded-full overflow-hidden bg-ink/5">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={{ duration: 0.6, delay: i * 0.05 }}
                className="h-full bg-copper rounded-full"
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
