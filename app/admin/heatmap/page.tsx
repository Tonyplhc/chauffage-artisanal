"use client";

/**
 * Page heatmap d'arrivée des leads (jour × heure).
 *
 * Visualisation : grille 7×24, intensité copper proportionnelle au compte.
 * Vue de gauche : la grille. Vue de droite : insights (peak, plage conseillée,
 * top 5 cellules).
 */

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Loader2,
  Calendar,
  Clock,
  Sparkles,
  TrendingUp,
} from "lucide-react";

type Heatmap = {
  matrix: number[][];
  rowTotals: number[];
  colTotals: number[];
  total: number;
  peak: { count: number; day: number; hour: number } | null;
  peakDay: { day: number; count: number } | null;
  peakHour: { hour: number; count: number } | null;
  topCells: { day: number; hour: number; count: number }[];
  recommendedHourRange: { from: number; to: number } | null;
};

const DAYS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];
const DAYS_FULL = [
  "Lundi",
  "Mardi",
  "Mercredi",
  "Jeudi",
  "Vendredi",
  "Samedi",
  "Dimanche",
];

function hourLabel(h: number): string {
  return `${h.toString().padStart(2, "0")}h`;
}

function colorFor(intensity: number): string {
  // intensity 0..1 → opacity copper
  if (intensity === 0) return "rgba(184,106,54,0)";
  // floor à un minimum visible
  const opacity = Math.max(0.08, intensity);
  return `rgba(184,106,54,${opacity})`;
}

export default function HeatmapPage() {
  const router = useRouter();
  const [heatmap, setHeatmap] = useState<Heatmap | null>(null);

  const load = useCallback(async () => {
    const res = await fetch("/api/admin/heatmap", { cache: "no-store" });
    if (res.status === 401) {
      router.replace("/admin/login");
      return;
    }
    if (res.ok) {
      const data = await res.json();
      setHeatmap(data.heatmap);
    }
  }, [router]);

  useEffect(() => {
    load();
    const i = setInterval(load, 60_000);
    return () => clearInterval(i);
  }, [load]);

  const max = heatmap
    ? Math.max(1, ...heatmap.matrix.flatMap((r) => r))
    : 1;

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
            Heatmap d&apos;activité
          </h1>
          <p className="mt-2 text-graphite">
            Quand est-ce que vos leads arrivent ? Heure × jour de la semaine sur
            l&apos;ensemble des soumissions enregistrées.
          </p>
        </div>

        {heatmap === null ? (
          <div className="py-16 text-center text-muted">
            <Loader2 className="h-6 w-6 animate-spin mx-auto" />
          </div>
        ) : heatmap.total === 0 ? (
          <div className="rounded-2xl border border-ink/10 bg-white shadow-soft py-16 text-center text-muted">
            Pas encore assez de données pour générer la heatmap.
          </div>
        ) : (
          <div className="grid lg:grid-cols-12 gap-4">
            {/* Grid heatmap */}
            <div className="lg:col-span-9 rounded-2xl border border-ink/10 bg-white shadow-soft p-5 overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr>
                    <th className="text-left font-mono text-[10px] uppercase tracking-eyebrow text-muted pr-2 py-1 w-12">
                      Jour
                    </th>
                    {Array.from({ length: 24 }).map((_, h) => (
                      <th
                        key={h}
                        className="font-mono text-[9px] text-muted text-center font-normal"
                      >
                        {h % 3 === 0 ? hourLabel(h) : "·"}
                      </th>
                    ))}
                    <th className="font-mono text-[10px] uppercase tracking-eyebrow text-muted text-right pl-2 w-10">
                      Σ
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {heatmap.matrix.map((row, d) => (
                    <tr key={d}>
                      <td className="pr-2 font-mono text-[11px] text-graphite">
                        {DAYS[d]}
                      </td>
                      {row.map((count, h) => {
                        const intensity = count / max;
                        return (
                          <td
                            key={h}
                            className="p-0.5"
                            title={`${DAYS_FULL[d]} ${hourLabel(h)} · ${count} lead${count > 1 ? "s" : ""}`}
                          >
                            <div
                              className="aspect-square min-w-[12px] rounded-sm border border-ink/5 transition-transform hover:scale-150 hover:z-10 relative cursor-default"
                              style={{ background: colorFor(intensity) }}
                            >
                              {count > 0 && intensity > 0.55 && (
                                <span className="absolute inset-0 grid place-items-center font-mono text-[8px] text-cream tabular-nums">
                                  {count}
                                </span>
                              )}
                            </div>
                          </td>
                        );
                      })}
                      <td className="pl-2 font-mono text-[11px] text-ink text-right tabular-nums">
                        {heatmap.rowTotals[d]}
                      </td>
                    </tr>
                  ))}
                  <tr>
                    <td className="pt-2 font-mono text-[10px] uppercase tracking-eyebrow text-muted">
                      Σ
                    </td>
                    {heatmap.colTotals.map((c, h) => (
                      <td
                        key={h}
                        className="pt-2 font-mono text-[10px] text-graphite text-center tabular-nums"
                      >
                        {c || ""}
                      </td>
                    ))}
                    <td className="pt-2 pl-2 font-mono text-[11px] text-copper text-right tabular-nums">
                      {heatmap.total}
                    </td>
                  </tr>
                </tbody>
              </table>
              <div className="mt-4 flex items-center gap-2 text-[10px] font-mono text-muted">
                <span>Intensité</span>
                {[0.05, 0.25, 0.5, 0.75, 1].map((i) => (
                  <div
                    key={i}
                    className="h-3 w-6 rounded-sm border border-ink/5"
                    style={{ background: colorFor(i) }}
                  />
                ))}
                <span>= 0 à {max}</span>
              </div>
            </div>

            {/* Insights */}
            <div className="lg:col-span-3 grid gap-4">
              <Insight
                icon={<Sparkles className="h-4 w-4" />}
                label="Plage conseillée"
                value={
                  heatmap.recommendedHourRange
                    ? `${hourLabel(heatmap.recommendedHourRange.from)} – ${hourLabel(
                        heatmap.recommendedHourRange.to + 1,
                      )}`
                    : "—"
                }
                hint="Fenêtre 3 h la plus chargée"
              />
              <Insight
                icon={<Calendar className="h-4 w-4" />}
                label="Jour pic"
                value={
                  heatmap.peakDay
                    ? DAYS_FULL[heatmap.peakDay.day]
                    : "—"
                }
                hint={
                  heatmap.peakDay
                    ? `${heatmap.peakDay.count} leads cumulés`
                    : undefined
                }
              />
              <Insight
                icon={<Clock className="h-4 w-4" />}
                label="Heure pic"
                value={
                  heatmap.peakHour ? hourLabel(heatmap.peakHour.hour) : "—"
                }
                hint={
                  heatmap.peakHour
                    ? `${heatmap.peakHour.count} leads cumulés`
                    : undefined
                }
              />
              <div className="rounded-2xl border border-ink/10 bg-white shadow-soft p-4">
                <div className="font-mono text-[10px] uppercase tracking-eyebrow text-copper inline-flex items-center gap-1 mb-2">
                  <TrendingUp className="h-3 w-3" />
                  Top créneaux
                </div>
                {heatmap.topCells.length === 0 ? (
                  <div className="text-xs text-muted">Aucun.</div>
                ) : (
                  <ul className="grid gap-1.5">
                    {heatmap.topCells.map((c, i) => (
                      <li
                        key={`${c.day}-${c.hour}`}
                        className="flex items-center gap-2 text-xs"
                      >
                        <span className="h-5 w-5 grid place-items-center rounded-full bg-copper/10 text-copper text-[10px] font-mono">
                          {i + 1}
                        </span>
                        <span className="flex-1 text-ink">
                          {DAYS[c.day]} {hourLabel(c.hour)}
                        </span>
                        <span className="font-mono text-graphite tabular-nums">
                          {c.count}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
        )}

        <p className="mt-4 text-xs text-muted">
          Heatmap construite sur la fonction `submittedAt` côté serveur — les
          fuseaux horaires des visiteurs ne sont pas normalisés. Utilisez la
          plage conseillée comme heuristique, pas comme vérité absolue.
        </p>
      </div>
    </div>
  );
}

function Insight({
  icon,
  label,
  value,
  hint,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="rounded-2xl border border-ink/10 bg-white shadow-soft p-4">
      <div className="font-mono text-[10px] uppercase tracking-eyebrow text-muted inline-flex items-center gap-1">
        {icon}
        {label}
      </div>
      <div className="mt-1 font-display text-xl text-ink">{value}</div>
      {hint && <div className="text-[11px] text-muted mt-0.5">{hint}</div>}
    </div>
  );
}
