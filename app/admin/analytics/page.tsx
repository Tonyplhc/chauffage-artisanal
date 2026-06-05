"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Eye,
  Users,
  TrendingUp,
  Globe,
  Monitor,
  Smartphone,
  Tablet,
  Activity,
  FileText,
  Calculator,
  Sparkles,
  Clock,
  Database,
  RefreshCw,
  Phone,
  Mail,
} from "lucide-react";
import type { AnalyticsAggregates } from "@/lib/analytics-store";
import { cn } from "@/lib/utils";

export default function AdminAnalyticsPage() {
  const router = useRouter();
  const [data, setData] = useState<AnalyticsAggregates | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async () => {
    setRefreshing(true);
    const res = await fetch("/api/admin/analytics", { cache: "no-store" });
    if (res.status === 401) {
      router.replace("/admin/login");
      return;
    }
    const json = await res.json();
    setData(json);
    setRefreshing(false);
  };

  useEffect(() => {
    fetchData();
    // Auto-refresh toutes les 30s (live feed pertinent)
    const interval = setInterval(fetchData, 30_000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  return (
    <div className="min-h-screen bg-cream py-10 lg:py-14">
      <div className="container max-w-7xl">
        <Link
          href="/admin/leads"
          className="inline-flex items-center gap-2 text-sm font-mono uppercase tracking-eyebrow text-graphite hover:text-copper transition-colors mb-6"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Retour pipeline
        </Link>

        <div className="mb-8 flex items-start justify-between flex-wrap gap-4">
          <div>
            <h1 className="font-display text-display-md text-ink">Analytics</h1>
            <p className="mt-2 text-graphite text-base">
              Tracking maison · privacy-first · pas de cookie · pas d&apos;identifiant unique.
            </p>
          </div>
          <div className="flex items-center gap-2">
            {data?.storageMode && (
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-mono uppercase tracking-eyebrow border ${
                  data.storageMode === "memory"
                    ? "bg-ember/10 border-ember/30 text-ember"
                    : "bg-copper/10 border-copper/30 text-copper"
                }`}
                title={
                  data.storageMode === "memory"
                    ? "Mode mémoire — données perdues au cold start Vercel"
                    : "Mode fichier — persistance disque"
                }
              >
                <Database className="h-3 w-3" />
                Stockage : {data.storageMode === "memory" ? "mémoire" : "fichier"}
              </span>
            )}
            <button
              onClick={fetchData}
              disabled={refreshing}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-ink text-cream text-xs font-medium hover:bg-copper transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`h-3 w-3 ${refreshing ? "animate-spin" : ""}`} />
              Rafraîchir
            </button>
          </div>
        </div>

        {data === null ? (
          <div className="rounded-2xl bg-white border border-ink/10 p-12 text-center text-muted">
            Chargement…
          </div>
        ) : data.pageviews === 0 ? (
          <div className="rounded-2xl bg-white border border-ink/10 p-12 text-center">
            <div className="text-graphite">Pas encore de données.</div>
            <div className="mt-2 text-sm text-muted">
              Naviguez sur le site public pour générer des pageviews.
            </div>
          </div>
        ) : (
          <>
            {data.storageMode === "memory" && (
              <div className="mb-6 rounded-2xl border border-ember/30 bg-ember/5 px-4 py-3 text-sm text-graphite">
                Données analytics en mémoire : les statistiques peuvent être réinitialisées au redémarrage.
              </div>
            )}

            {/* KPIs conversion (lecture 30 s) */}
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-6">
              <KpiTile label="Devis envoyés (30j)" value={data.conversion.counts.submitted} icon={FileText} accent="green" />
              <KpiTile label="Appels (clics tél.)" value={data.conversion.counts.phoneClicks} icon={Phone} accent="copper" />
              <KpiTile label="Contacts envoyés" value={data.conversion.counts.contactSubmitted} icon={Mail} accent="copper" />
              <KpiTile
                label="Conversion tunnel"
                value={data.conversion.rates.tunnel === null ? "—" : `${data.conversion.rates.tunnel}%`}
                icon={TrendingUp}
                accent="green"
              />
              <KpiTile
                label="Top outil (devis)"
                value={(() => {
                  const t = data.conversion.byTool.find((x) => x.from !== "direct" && x.submitted > 0);
                  return t ? `${t.from} (${t.submitted})` : "—";
                })()}
                icon={Calculator}
                accent="copper"
                small
              />
            </div>

            {/* KPIs */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
              <KpiTile label="Pageviews" value={data.pageviews} icon={Eye} accent="copper" />
              <KpiTile
                label="Sessions uniques"
                value={data.uniqueSessions}
                icon={Users}
                accent="green"
              />
              <KpiTile
                label="Pages / session"
                value={
                  data.uniqueSessions > 0
                    ? (data.pageviews / data.uniqueSessions).toFixed(1)
                    : "—"
                }
                icon={TrendingUp}
                accent="copper"
              />
              <KpiTile
                label="Top page"
                value={
                  data.topPaths[0]
                    ? `${data.topPaths[0].path} (${data.topPaths[0].count})`
                    : "—"
                }
                icon={Globe}
                accent="copper"
                small
              />
            </div>

            {/* Activité 30j */}
            <Panel title="Activité — 30 derniers jours" subtitle={`${data.pageviews} pageviews cumulés`}>
              <ActivityChart series={data.last30Days} />
            </Panel>

            <div className="mt-6 grid lg:grid-cols-2 gap-6">
              <Panel title="Pages les plus consultées" subtitle="Top 15">
                <BarList
                  items={data.topPaths.map((p) => ({
                    label: p.path,
                    value: p.count,
                  }))}
                />
              </Panel>
              <Panel title="Sources de trafic" subtitle="Top referers (hors site)">
                {data.topReferers.length === 0 ? (
                  <div className="text-sm text-muted">
                    Aucun referer externe pour l&apos;instant.
                  </div>
                ) : (
                  <BarList
                    items={data.topReferers.map((r) => ({
                      label: r.host,
                      value: r.count,
                    }))}
                  />
                )}
              </Panel>
            </div>

            <div className="mt-6 grid lg:grid-cols-2 gap-6">
              <Panel title="Navigateurs" subtitle="Répartition des familles">
                <BarList
                  items={data.byBrowser.map((b) => ({
                    label: b.browser,
                    value: b.count,
                  }))}
                />
              </Panel>
              <Panel title="Appareils" subtitle="Mobile / desktop / tablet">
                <DeviceDistribution data={data.byDevice} />
              </Panel>
            </div>

            {/* Tunnel devis — événements réels */}
            <Panel
              title="Tunnel devis (30 jours)"
              subtitle={
                data.conversion.biggestLeak
                  ? `Plus grosse fuite : ${data.conversion.biggestLeak.from} → ${data.conversion.biggestLeak.to} (−${Math.round(data.conversion.biggestLeak.dropRate * 100)}%)`
                  : "Sessions par étape du configurateur"
              }
            >
              <DevisFunnel conversion={data.conversion} />
            </Panel>

            <div className="mt-6 grid lg:grid-cols-2 gap-6">
              <Panel title="Attribution par outil" subtitle="Devis générés par source (from)">
                <ToolAttribution rows={data.conversion.byTool} />
              </Panel>
              <Panel title="Comparatif canaux" subtitle="Devis · Contact · Téléphone (clics)">
                <BarList
                  items={[
                    { label: "Devis envoyés", value: data.conversion.channels.devis },
                    { label: "Contacts envoyés", value: data.conversion.channels.contact },
                    { label: "Téléphone (clics)", value: data.conversion.channels.phone },
                  ]}
                />
              </Panel>
            </div>

            <div className="mt-6">
              <Panel title="Téléphone par surface" subtitle="Clics tel: par emplacement de CTA">
                {data.conversion.phoneBySurface.length === 0 ? (
                  <div className="text-sm text-muted">Aucun clic téléphone pour l&apos;instant.</div>
                ) : (
                  <BarList
                    items={data.conversion.phoneBySurface.map((p) => ({ label: p.surface, value: p.count }))}
                  />
                )}
              </Panel>
            </div>

            {/* Activity by hour + live feed */}
            <div className="mt-6 grid lg:grid-cols-2 gap-6">
              <Panel title="Trafic par heure" subtitle="Heures locales Luxembourg">
                <HourBars hours={data.byHour} />
              </Panel>
              <Panel
                title="Activité en direct"
                subtitle={`${data.recentEvents.length} derniers événements`}
              >
                <LiveFeed events={data.recentEvents} />
              </Panel>
            </div>

            <div className="mt-6 p-5 rounded-2xl border border-ink/10 bg-white">
              <div className="font-mono text-[10px] uppercase tracking-eyebrow text-copper mb-2">
                Données conservées
              </div>
              <ul className="grid sm:grid-cols-2 gap-2 text-xs text-graphite">
                <li>✓ Pathname de la page consultée</li>
                <li>✓ Famille de navigateur (Chrome, Firefox…)</li>
                <li>✓ Type d&apos;appareil (mobile/desktop/tablet)</li>
                <li>✓ Hash de session journalier (anonyme, change chaque jour)</li>
                <li>✗ Pas de cookie tiers</li>
                <li>✗ Pas d&apos;identifiant unique persistant</li>
                <li>✗ Pas d&apos;IP brute (hashée + tronquée)</li>
                <li>✗ Pas de profiling marketing</li>
              </ul>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/* ─────────────── Panels et charts ─────────────── */

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
      <div className="mb-4">
        <div className="font-mono text-xs uppercase tracking-eyebrow text-copper">
          {title}
        </div>
        {subtitle && <div className="mt-1 text-sm text-muted">{subtitle}</div>}
      </div>
      {children}
    </div>
  );
}

function KpiTile({
  label,
  value,
  icon: Icon,
  accent,
  small,
}: {
  label: string;
  value: number | string;
  icon: typeof Eye;
  accent: "copper" | "green";
  small?: boolean;
}) {
  const accentClass =
    accent === "green"
      ? "bg-[#22a06b]/10 border-[#22a06b]/30 text-[#22a06b]"
      : "bg-copper/10 border-copper/30 text-copper";
  return (
    <div className="p-4 rounded-2xl bg-white border border-ink/10 shadow-soft">
      <div className="flex items-center gap-3">
        <span className={cn("h-10 w-10 rounded-full grid place-items-center border", accentClass)}>
          <Icon className="h-4 w-4" />
        </span>
        <div className="min-w-0">
          <div className="font-mono text-[10px] uppercase tracking-eyebrow text-muted">
            {label}
          </div>
          <div
            className={cn(
              "mt-0.5 font-display text-ink tabular-nums",
              small ? "text-base truncate max-w-[180px]" : "text-2xl",
            )}
          >
            {value}
          </div>
        </div>
      </div>
    </div>
  );
}

function ActivityChart({
  series,
}: {
  series: { date: string; pageviews: number; uniqueSessions: number }[];
}) {
  const max = Math.max(...series.map((s) => s.pageviews), 1);
  return (
    <div
      className="grid gap-0.5"
      style={{ gridTemplateColumns: `repeat(${series.length}, minmax(0, 1fr))` }}
    >
      {series.map((s) => {
        const h = (s.pageviews / max) * 100;
        const d = new Date(s.date);
        return (
          <div
            key={s.date}
            title={`${d.toLocaleDateString("fr-FR", { day: "numeric", month: "short" })} · ${s.pageviews} pv · ${s.uniqueSessions} sessions`}
            className="h-24 flex items-end justify-center"
          >
            <div
              className="w-full rounded-sm transition-colors"
              style={{
                height: `${Math.max(h, s.pageviews > 0 ? 6 : 2)}%`,
                background: s.pageviews > 0 ? "#b86a36" : "#e3d8c5",
              }}
            />
          </div>
        );
      })}
    </div>
  );
}

function BarList({ items }: { items: { label: string; value: number }[] }) {
  const max = Math.max(...items.map((i) => i.value), 1);
  return (
    <div className="space-y-2.5">
      {items.map((it) => (
        <div key={it.label}>
          <div className="flex items-center justify-between text-sm mb-1">
            <span className="text-ink truncate mr-2">{it.label}</span>
            <span className="font-mono text-xs text-muted tabular-nums shrink-0">
              {it.value}
            </span>
          </div>
          <div className="h-1.5 rounded-full overflow-hidden bg-ink/5">
            <div
              className="h-full bg-copper rounded-full"
              style={{ width: `${(it.value / max) * 100}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function DeviceDistribution({
  data,
}: {
  data: Record<"mobile" | "desktop" | "tablet", number>;
}) {
  const total = data.mobile + data.desktop + data.tablet;
  if (total === 0) return <div className="text-sm text-muted">Aucune donnée.</div>;
  const items = [
    { key: "desktop", label: "Desktop", value: data.desktop, icon: Monitor, color: "#b86a36" },
    { key: "mobile", label: "Mobile", value: data.mobile, icon: Smartphone, color: "#22a06b" },
    { key: "tablet", label: "Tablet", value: data.tablet, icon: Tablet, color: "#6ba3c5" },
  ];
  return (
    <div>
      <div className="flex h-3 rounded-full overflow-hidden bg-ink/5 mb-5">
        {items.map((it) => {
          const w = (it.value / total) * 100;
          if (w === 0) return null;
          return (
            <div
              key={it.key}
              style={{ width: `${w}%`, background: it.color }}
              className="h-full"
            />
          );
        })}
      </div>
      <div className="grid gap-2">
        {items.map((it) => (
          <div
            key={it.key}
            className="flex items-center gap-3 px-3 py-2 rounded-xl bg-cream border border-ink/8"
          >
            <span
              className="h-7 w-7 rounded-full grid place-items-center"
              style={{ background: `${it.color}15`, color: it.color }}
            >
              <it.icon className="h-3.5 w-3.5" />
            </span>
            <div className="text-sm text-ink font-medium flex-1">{it.label}</div>
            <div className="font-mono text-sm text-graphite tabular-nums">
              {it.value}
              <span className="text-muted ml-1.5 text-xs">
                ({Math.round((it.value / total) * 100)}%)
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}


/* ─────────────── Tunnel devis (events) ─────────────── */

function DevisFunnel({ conversion }: { conversion: AnalyticsAggregates["conversion"] }) {
  const stages = conversion.funnel;
  const max = Math.max(...stages.map((s) => s.sessions), 1);
  return (
    <div className="space-y-2.5">
      {stages.map((s, i) => {
        const isLeak = !!conversion.biggestLeak && conversion.biggestLeak.to === s.label;
        return (
          <div key={s.key}>
            <div className="flex items-center justify-between text-sm mb-1">
              <span className="text-ink truncate mr-2">{s.label}</span>
              <span className="font-mono text-xs text-muted tabular-nums shrink-0">
                {s.sessions} · {s.pctOfArrived}%
                {i > 0 && s.dropFromPrev > 0 && (
                  <span className={isLeak ? "text-ember ml-1.5" : "text-muted ml-1.5"}>
                    −{s.dropFromPrev}%
                  </span>
                )}
              </span>
            </div>
            <div className="h-1.5 rounded-full overflow-hidden bg-ink/5">
              <div
                className="h-full rounded-full"
                style={{
                  width: `${(s.sessions / max) * 100}%`,
                  background: isLeak ? "#dc5a28" : "#b86a36",
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function ToolAttribution({ rows }: { rows: AnalyticsAggregates["conversion"]["byTool"] }) {
  if (rows.length === 0) return <div className="text-sm text-muted">Aucune donnée.</div>;
  return (
    <div className="space-y-1">
      <div className="grid grid-cols-[1fr_auto_auto_auto] gap-3 text-[10px] font-mono uppercase tracking-eyebrow text-muted px-1">
        <span>Outil (from)</span>
        <span className="text-right">Arrivées</span>
        <span className="text-right">Devis</span>
        <span className="text-right">Taux</span>
      </div>
      {rows.map((r) => (
        <div
          key={r.from}
          className="grid grid-cols-[1fr_auto_auto_auto] gap-3 items-center text-sm px-1 py-1.5 rounded-lg odd:bg-cream"
        >
          <span className="text-ink truncate">{r.from}</span>
          <span className="font-mono text-muted tabular-nums text-right">{r.arrived}</span>
          <span className="font-mono text-ink tabular-nums text-right">{r.submitted}</span>
          <span className="font-mono text-muted tabular-nums text-right">
            {r.convRate === null ? "—" : `${r.convRate}%`}
          </span>
        </div>
      ))}
    </div>
  );
}

/* ─────────────── Distribution par heure ─────────────── */

function HourBars({ hours }: { hours: number[] }) {
  const max = Math.max(...hours, 1);
  return (
    <div>
      <div className="flex items-end gap-px h-32">
        {hours.map((count, h) => {
          const pct = (count / max) * 100;
          return (
            <div
              key={h}
              className="flex-1 flex flex-col justify-end items-center group relative"
            >
              <div
                className="w-full rounded-t-sm bg-copper/30 hover:bg-copper transition-colors"
                style={{ height: `${pct}%`, minHeight: count > 0 ? "2px" : "0" }}
                title={`${h}h : ${count} pageviews`}
              />
            </div>
          );
        })}
      </div>
      <div className="mt-2 flex justify-between text-[9px] font-mono text-muted">
        <span>00h</span>
        <span>06h</span>
        <span>12h</span>
        <span>18h</span>
        <span>23h</span>
      </div>
    </div>
  );
}

/* ─────────────── Live feed des derniers events ─────────────── */

function LiveFeed({ events }: { events: AnalyticsEvent[] }) {
  if (events.length === 0) {
    return <div className="text-sm text-muted">Aucun événement.</div>;
  }
  return (
    <ul className="space-y-1.5 max-h-72 overflow-y-auto pr-2">
      {events.slice(0, 15).map((e) => {
        const date = new Date(e.at);
        const time = date.toLocaleTimeString("fr-LU", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        });
        return (
          <li
            key={e.id}
            className="flex items-center gap-2 text-xs px-2 py-1.5 rounded-lg bg-cream border border-ink/5"
          >
            <Clock className="h-3 w-3 text-muted shrink-0" />
            <span className="font-mono text-muted shrink-0 tabular-nums">{time}</span>
            <span
              className={`px-1.5 py-0.5 rounded text-[9px] font-mono uppercase shrink-0 ${
                e.type === "pageview"
                  ? "bg-copper/10 text-copper"
                  : "bg-ember/10 text-ember"
              }`}
            >
              {e.type}
            </span>
            <span className="font-mono text-ink truncate flex-1">{e.path}</span>
            {e.device && (
              <span className="text-muted text-[10px] shrink-0">{e.device}</span>
            )}
          </li>
        );
      })}
    </ul>
  );
}

// Re-import du type pour le composant LiveFeed
type AnalyticsEvent = AnalyticsAggregates["recentEvents"][number];
