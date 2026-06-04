"use client";

/**
 * Pipeline value & forecast.
 *
 * KPIs : pipeline ouvert (somme + pondérée), CA réalisé, top opportunités.
 * Breakdown par statut avec probabilités et valeur pondérée.
 */

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Loader2,
  TrendingUp,
  Trophy,
  ArrowRight,
  Euro,
  Calculator,
  Sparkles,
} from "lucide-react";

type StatusKey = "nouveau" | "contacte" | "devis_envoye" | "converti" | "perdu";

const STATUS_LABEL: Record<StatusKey, string> = {
  nouveau: "Nouveau",
  contacte: "Contacté",
  devis_envoye: "Devis envoyé",
  converti: "Converti",
  perdu: "Perdu",
};

const STATUS_COLOR: Record<StatusKey, string> = {
  nouveau: "#b86a36",
  contacte: "#6ba3c5",
  devis_envoye: "#94532a",
  converti: "#22a06b",
  perdu: "#8b847a",
};

type Stats = {
  openValue: number;
  openWeightedValue: number;
  openCount: number;
  byStatus: Record<
    StatusKey,
    {
      count: number;
      value: number;
      weightedValue: number;
      probability: number;
    }
  >;
  realizedValue: number;
  lostValue: number;
  topOpen: {
    reference: string;
    fullName: string;
    commune: string;
    status: StatusKey;
    services: string[];
    value: number;
    weightedValue: number;
    probability: number;
    explicit: boolean;
  }[];
};

function fmt(value: number, compact = false) {
  if (compact && Math.abs(value) >= 1000) {
    if (Math.abs(value) >= 1_000_000) {
      return `${(value / 1_000_000).toFixed(1).replace(/\.0$/, "")} M€`;
    }
    return `${(value / 1000).toFixed(value % 1000 === 0 ? 0 : 1).replace(/\.0$/, "")} k€`;
  }
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(value);
}

export default function PipelineValuePage() {
  const router = useRouter();
  const [stats, setStats] = useState<Stats | null>(null);
  const [asOf, setAsOf] = useState<string | null>(null);

  const load = useCallback(async () => {
    const res = await fetch("/api/admin/pipeline-value", { cache: "no-store" });
    if (res.status === 401) {
      router.replace("/admin/login");
      return;
    }
    if (res.ok) {
      const data = await res.json();
      setStats(data.stats);
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
            Pipeline value & forecast
          </h1>
          <p className="mt-2 text-graphite">
            Valeur estimée par opportunité, forecast pondéré par la probabilité
            de conversion associée au statut.{" "}
            {asOf && (
              <span className="text-muted">
                · Recalculé {new Date(asOf).toLocaleString("fr-FR")}
              </span>
            )}
          </p>
        </div>

        {stats === null ? (
          <div className="py-16 text-center text-muted">
            <Loader2 className="h-6 w-6 animate-spin mx-auto" />
          </div>
        ) : (
          <>
            {/* KPIs */}
            <div className="grid lg:grid-cols-4 gap-4 mb-8">
              <Kpi
                icon={<Calculator className="h-4 w-4" />}
                label="Pipeline ouvert"
                value={fmt(stats.openValue, true)}
                hint={`${stats.openCount} opportunités · valeur brute`}
              />
              <Kpi
                icon={<TrendingUp className="h-4 w-4 text-copper" />}
                label="Forecast pondéré"
                value={fmt(stats.openWeightedValue, true)}
                hint="Σ valeur × probabilité par statut"
                accent="copper"
              />
              <Kpi
                icon={<Trophy className="h-4 w-4 text-[#22a06b]" />}
                label="CA réalisé"
                value={fmt(stats.realizedValue, true)}
                hint={`${stats.byStatus.converti.count} convertis`}
                accent="success"
              />
              <Kpi
                icon={<Euro className="h-4 w-4 text-muted" />}
                label="Manqué"
                value={fmt(stats.lostValue, true)}
                hint={`${stats.byStatus.perdu.count} perdus`}
                accent="muted"
              />
            </div>

            {/* Breakdown par statut */}
            <div className="rounded-2xl border border-ink/10 bg-white shadow-soft overflow-hidden mb-8">
              <div className="px-5 py-3 border-b border-ink/8 bg-cream/40 font-mono text-[10px] uppercase tracking-eyebrow text-copper">
                Décomposition par stade
              </div>
              <div className="divide-y divide-ink/8">
                {(["nouveau", "contacte", "devis_envoye", "converti", "perdu"] as StatusKey[]).map(
                  (s) => {
                    const b = stats.byStatus[s];
                    const maxOpen = Math.max(
                      stats.byStatus.nouveau.value,
                      stats.byStatus.contacte.value,
                      stats.byStatus.devis_envoye.value,
                      stats.byStatus.converti.value,
                    );
                    const pct = maxOpen === 0 ? 0 : (b.value / maxOpen) * 100;
                    return (
                      <div
                        key={s}
                        className="px-5 py-4 grid lg:grid-cols-12 gap-4 items-center"
                      >
                        <div className="lg:col-span-3 flex items-center gap-2">
                          <span
                            className="h-2.5 w-2.5 rounded-full"
                            style={{ background: STATUS_COLOR[s] }}
                          />
                          <span className="text-sm text-ink font-medium">
                            {STATUS_LABEL[s]}
                          </span>
                          <span className="text-[10px] font-mono text-muted ml-auto lg:ml-0">
                            {Math.round(b.probability * 100)}%
                          </span>
                        </div>
                        <div className="lg:col-span-5">
                          <div className="h-1.5 rounded-full bg-cream overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all"
                              style={{
                                width: `${pct}%`,
                                background: STATUS_COLOR[s],
                              }}
                            />
                          </div>
                          <div className="mt-1 text-[11px] text-muted">
                            {b.count} lead{b.count > 1 ? "s" : ""}
                          </div>
                        </div>
                        <div className="lg:col-span-2 text-right">
                          <div className="text-xs text-muted">Valeur</div>
                          <div className="font-mono text-sm text-ink tabular-nums">
                            {fmt(b.value, true)}
                          </div>
                        </div>
                        <div className="lg:col-span-2 text-right">
                          <div className="text-xs text-muted">Pondérée</div>
                          <div className="font-mono text-sm text-copper tabular-nums">
                            {fmt(b.weightedValue, true)}
                          </div>
                        </div>
                      </div>
                    );
                  },
                )}
              </div>
            </div>

            {/* Top opportunités ouvertes */}
            <div className="rounded-2xl border border-ink/10 bg-white shadow-soft overflow-hidden">
              <div className="px-5 py-3 border-b border-ink/8 bg-cream/40 flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-copper" />
                <span className="font-mono text-[10px] uppercase tracking-eyebrow text-copper">
                  Top opportunités ouvertes
                </span>
                <span className="ml-auto font-mono text-[10px] text-muted">
                  triées par valeur pondérée
                </span>
              </div>
              {stats.topOpen.length === 0 ? (
                <div className="py-12 text-center text-muted text-sm">
                  Aucune opportunité ouverte.
                </div>
              ) : (
                <ul className="divide-y divide-ink/8">
                  {stats.topOpen.map((o) => (
                    <li key={o.reference}>
                      <Link
                        href={`/admin/leads/${o.reference}`}
                        className="grid lg:grid-cols-12 gap-3 items-center px-5 py-3 hover:bg-cream/40 transition-colors group"
                      >
                        <div className="lg:col-span-5 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-ink truncate">
                              {o.fullName}
                            </span>
                            {!o.explicit && (
                              <span
                                className="text-[10px] font-mono uppercase tracking-eyebrow text-muted"
                                title="Valeur déduite du budget — pas explicitement fixée"
                              >
                                · estim.
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-muted truncate">
                            {o.reference} · {o.commune}
                          </div>
                        </div>
                        <div className="lg:col-span-3 flex items-center gap-2">
                          <span
                            className="px-2 py-0.5 rounded-full text-[10px] font-mono uppercase tracking-eyebrow"
                            style={{
                              background: `${STATUS_COLOR[o.status]}1c`,
                              color: STATUS_COLOR[o.status],
                            }}
                          >
                            {STATUS_LABEL[o.status]}
                          </span>
                          <span className="text-[10px] font-mono text-muted">
                            {Math.round(o.probability * 100)}%
                          </span>
                        </div>
                        <div className="lg:col-span-2 text-right">
                          <div className="font-mono text-sm text-ink tabular-nums">
                            {fmt(o.value)}
                          </div>
                          <div className="text-[10px] text-muted">brut</div>
                        </div>
                        <div className="lg:col-span-2 text-right">
                          <div className="font-mono text-sm text-copper tabular-nums">
                            {fmt(o.weightedValue)}
                          </div>
                          <div className="text-[10px] text-muted">pondéré</div>
                        </div>
                        <ArrowRight className="hidden lg:block h-3.5 w-3.5 text-muted opacity-0 group-hover:opacity-100 transition-opacity" />
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <p className="mt-4 text-xs text-muted">
              Probabilités par défaut : nouveau 10 % · contacté 25 % · devis
              envoyé 55 % · converti 100 %. Valeur par lead = explicite (admin)
              ou déduite du budget annoncé. Modifiable sur la fiche du lead.
            </p>
          </>
        )}
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
  accent?: "copper" | "success" | "muted";
}) {
  return (
    <div className="rounded-2xl border border-ink/10 bg-white shadow-soft p-5">
      <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-eyebrow text-muted">
        {icon}
        {label}
      </div>
      <div
        className={`mt-2 font-display text-3xl tabular-nums ${
          accent === "copper"
            ? "text-copper"
            : accent === "success"
            ? "text-[#22a06b]"
            : accent === "muted"
            ? "text-graphite"
            : "text-ink"
        }`}
      >
        {value}
      </div>
      {hint && <div className="mt-1 text-xs text-muted">{hint}</div>}
    </div>
  );
}
