"use client";

/**
 * Heat map pipeline value par commune Luxembourg.
 *
 * Tableau visuel avec barres d'intensité — pas de carte vectorielle SVG en V1
 * (nécessiterait un dataset géographique). Triable + filtrable.
 */

import { useEffect, useState, useCallback, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Loader2,
  MapPin,
  Flame,
  Trophy,
  TrendingUp,
} from "lucide-react";
import { cn } from "@/lib/utils";

type Commune = {
  commune: string;
  leadCount: number;
  hotCount: number;
  convertedCount: number;
  lostCount: number;
  conversionRate: number;
  pipelineValueEur: number;
  weightedPipelineEur: number;
  realizedRevenueEur: number;
  averageDealEur: number;
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

type SortKey = "value" | "leads" | "conversion" | "weighted";

export default function GeoPipelinePage() {
  const router = useRouter();
  const [communes, setCommunes] = useState<Commune[] | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>("value");
  const [search, setSearch] = useState("");

  const load = useCallback(async () => {
    const res = await fetch("/api/admin/geo-pipeline", { cache: "no-store" });
    if (res.status === 401) {
      router.replace("/admin/login");
      return;
    }
    if (res.ok) {
      const d = await res.json();
      setCommunes(d.communes ?? []);
    }
  }, [router]);

  useEffect(() => {
    load();
    const i = setInterval(load, 120_000);
    return () => clearInterval(i);
  }, [load]);

  const filtered = useMemo(() => {
    if (!communes) return null;
    const q = search.trim().toLowerCase();
    let out = q
      ? communes.filter((c) => c.commune.toLowerCase().includes(q))
      : communes;
    out = [...out].sort((a, b) => {
      if (sortKey === "leads") return b.leadCount - a.leadCount;
      if (sortKey === "conversion") return b.conversionRate - a.conversionRate;
      if (sortKey === "weighted")
        return b.weightedPipelineEur - a.weightedPipelineEur;
      return (
        b.pipelineValueEur + b.realizedRevenueEur -
        (a.pipelineValueEur + a.realizedRevenueEur)
      );
    });
    return out;
  }, [communes, search, sortKey]);

  const maxValue = useMemo(() => {
    if (!filtered || filtered.length === 0) return 1;
    return Math.max(
      ...filtered.map((c) => c.pipelineValueEur + c.realizedRevenueEur),
    );
  }, [filtered]);

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
            Heat map géographique
          </h1>
          <p className="mt-2 text-graphite">
            Pipeline value + CA réalisé par commune. Identifie les zones
            premium et les opportunités sous-exploitées.
          </p>
        </div>

        <div className="flex items-center gap-2 mb-6 flex-wrap">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher commune…"
            className="flex-1 min-w-[200px] bg-white border border-ink/15 rounded-full px-4 py-2 text-sm focus:border-copper focus:outline-none"
          />
          {(
            [
              { id: "value", label: "Valeur totale" },
              { id: "weighted", label: "Forecast pondéré" },
              { id: "leads", label: "Volume leads" },
              { id: "conversion", label: "Conversion %" },
            ] as { id: SortKey; label: string }[]
          ).map((s) => (
            <button
              key={s.id}
              onClick={() => setSortKey(s.id)}
              className={cn(
                "px-3 py-1.5 rounded-full text-sm transition-colors",
                sortKey === s.id
                  ? "bg-ink text-cream"
                  : "bg-white border border-ink/10 text-graphite hover:border-copper/40",
              )}
            >
              {s.label}
            </button>
          ))}
        </div>

        {filtered === null ? (
          <div className="py-16 text-center text-muted">
            <Loader2 className="h-6 w-6 animate-spin mx-auto" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-2xl border border-ink/10 bg-white shadow-soft py-16 text-center text-muted">
            <MapPin className="h-12 w-12 mx-auto opacity-20 text-copper mb-2" />
            <p>Aucune commune dans les résultats.</p>
          </div>
        ) : (
          <ul className="grid gap-2">
            {filtered.map((c) => {
              const total = c.pipelineValueEur + c.realizedRevenueEur;
              const intensity = total / maxValue;
              return (
                <li
                  key={c.commune}
                  className="rounded-2xl border border-ink/10 bg-white shadow-soft p-4"
                >
                  <div className="grid lg:grid-cols-12 gap-3 items-center">
                    <div className="lg:col-span-3 min-w-0">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-copper shrink-0" />
                        <span className="text-sm font-medium text-ink truncate">
                          {c.commune}
                        </span>
                      </div>
                      <div className="text-[11px] text-muted mt-0.5 inline-flex items-center gap-2">
                        <span className="inline-flex items-center gap-0.5">
                          {c.leadCount} leads
                        </span>
                        {c.hotCount > 0 && (
                          <span className="inline-flex items-center gap-0.5 text-ember">
                            <Flame className="h-2.5 w-2.5" />
                            {c.hotCount} hot
                          </span>
                        )}
                        {c.convertedCount > 0 && (
                          <span className="inline-flex items-center gap-0.5 text-[#22a06b]">
                            <Trophy className="h-2.5 w-2.5" />
                            {c.convertedCount}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="lg:col-span-4">
                      <div className="h-2 rounded-full bg-cream overflow-hidden">
                        <div
                          className="h-full transition-all"
                          style={{
                            width: `${Math.max(2, intensity * 100)}%`,
                            background: `rgba(184,106,54,${Math.max(0.3, intensity)})`,
                          }}
                        />
                      </div>
                      <div className="text-[10px] text-muted font-mono mt-1">
                        Pipeline + CA
                      </div>
                    </div>
                    <div className="lg:col-span-2 text-right">
                      <div className="text-xs text-muted">Pipeline ouvert</div>
                      <div className="font-mono text-sm text-ink tabular-nums">
                        {formatEur(c.pipelineValueEur, true)}
                      </div>
                      <div className="text-[10px] text-copper font-mono tabular-nums">
                        pondéré {formatEur(c.weightedPipelineEur, true)}
                      </div>
                    </div>
                    <div className="lg:col-span-2 text-right">
                      <div className="text-xs text-muted">CA réalisé</div>
                      <div className="font-mono text-sm text-[#22a06b] tabular-nums">
                        {formatEur(c.realizedRevenueEur, true)}
                      </div>
                    </div>
                    <div className="lg:col-span-1 text-right">
                      <div className="text-xs text-muted">Conv.</div>
                      <div
                        className={cn(
                          "font-mono text-sm tabular-nums inline-flex items-center gap-0.5",
                          c.conversionRate >= 0.5
                            ? "text-[#22a06b]"
                            : c.conversionRate >= 0.3
                              ? "text-copper"
                              : "text-graphite",
                        )}
                      >
                        <TrendingUp className="h-2.5 w-2.5" />
                        {Math.round(c.conversionRate * 100)}%
                      </div>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}

        <p className="mt-4 text-xs text-muted">
          Pipeline pondéré = valeur lead × probabilité statut (10/25/55%).
          Conversion % calculée sur dossiers décidés (convertis + perdus).
        </p>
      </div>
    </div>
  );
}
