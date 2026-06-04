"use client";

/**
 * Dashboard lifecycle des équipements installés.
 *
 * Vue agrégée + liste triée par opportunité commerciale (proche fin de vie en
 * haut). Liens vers la fiche lead pour préparer une démarche commerciale.
 */

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Loader2,
  Cpu,
  AlertTriangle,
  Sparkles,
  ArrowRight,
  TrendingUp,
} from "lucide-react";
import { cn } from "@/lib/utils";

type Equipment = {
  id: string;
  leadReference: string;
  type: string;
  brand: string;
  model: string;
  installedAt?: string;
  warrantyExpiresAt?: string;
  location?: string;
};

type Assessment = {
  equipment: Equipment;
  ageYears: number | null;
  lifespanYears: number;
  wearRatio: number | null;
  status: "new" | "healthy" | "aging" | "near_end" | "end_of_life";
  opportunityScore: number;
  recommendation: string;
};

type Stats = {
  totals: Record<Assessment["status"], number>;
  totalOpportunities: number;
  averageAge: number | null;
};

const STATUS_LABELS = {
  new: "Récent",
  healthy: "En forme",
  aging: "Vieillissant",
  near_end: "Fin de vie proche",
  end_of_life: "Au-delà",
};

const STATUS_COLORS = {
  new: "#22a06b",
  healthy: "#6ba3c5",
  aging: "#b86a36",
  near_end: "#dc5a28",
  end_of_life: "#1e1a15",
};

const TYPE_LABELS: Record<string, string> = {
  chaudiere: "Chaudière",
  pac: "PAC",
  ballon: "Ballon thermo",
  clim: "Climatisation",
  vmc: "VMC",
  solaire: "Solaire",
  regulation: "Régulation",
  autre: "Autre",
};

export default function LifecyclePage() {
  const router = useRouter();
  const [assessments, setAssessments] = useState<Assessment[] | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [filter, setFilter] = useState<Assessment["status"] | "all">("all");

  const load = useCallback(async () => {
    const res = await fetch("/api/admin/equipment/lifecycle", {
      cache: "no-store",
    });
    if (res.status === 401) {
      router.replace("/admin/login");
      return;
    }
    if (res.ok) {
      const d = await res.json();
      setAssessments(d.assessments ?? []);
      setStats(d.stats);
    }
  }, [router]);

  useEffect(() => {
    load();
    const i = setInterval(load, 120_000);
    return () => clearInterval(i);
  }, [load]);

  const filtered = assessments?.filter((a) =>
    filter === "all" ? true : a.status === filter,
  );

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
            Lifecycle équipements
          </h1>
          <p className="mt-2 text-graphite">
            Statut de vieillissement des équipements installés. Score
            d&apos;opportunité commerciale (0-100) pour anticiper les
            renouvellements.
          </p>
        </div>

        {stats && (
          <div className="grid lg:grid-cols-5 gap-3 mb-8">
            <Kpi
              label="Récents"
              value={stats.totals.new}
              color={STATUS_COLORS.new}
            />
            <Kpi
              label="En forme"
              value={stats.totals.healthy}
              color={STATUS_COLORS.healthy}
            />
            <Kpi
              label="Vieillissants"
              value={stats.totals.aging}
              color={STATUS_COLORS.aging}
            />
            <Kpi
              label="Fin proche"
              value={stats.totals.near_end}
              color={STATUS_COLORS.near_end}
            />
            <Kpi
              label="Au-delà"
              value={stats.totals.end_of_life}
              color={STATUS_COLORS.end_of_life}
            />
          </div>
        )}

        {stats && stats.totalOpportunities > 0 && (
          <div className="mb-6 rounded-2xl border border-copper/30 bg-copper/5 p-4 flex items-start gap-3">
            <Sparkles className="h-5 w-5 text-copper shrink-0 mt-0.5" />
            <div>
              <div className="text-sm font-medium text-ink">
                {stats.totalOpportunities} opportunité
                {stats.totalOpportunities > 1 ? "s" : ""} commerciale
                {stats.totalOpportunities > 1 ? "s" : ""} détectée
                {stats.totalOpportunities > 1 ? "s" : ""}
              </div>
              <div className="text-xs text-graphite mt-1">
                Équipements avec un score &gt; 50 — préparer une démarche de
                renouvellement préventif.
              </div>
            </div>
          </div>
        )}

        <div className="flex items-center gap-2 mb-4 flex-wrap">
          {(
            ["all", "near_end", "end_of_life", "aging", "healthy"] as const
          ).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                "px-3 py-1.5 rounded-full text-sm transition-colors",
                filter === f
                  ? "bg-ink text-cream"
                  : "bg-white border border-ink/10 text-graphite hover:border-copper/40",
              )}
            >
              {f === "all"
                ? "Tous"
                : STATUS_LABELS[f]}
            </button>
          ))}
        </div>

        {assessments === null ? (
          <div className="py-16 text-center text-muted">
            <Loader2 className="h-6 w-6 animate-spin mx-auto" />
          </div>
        ) : (filtered?.length ?? 0) === 0 ? (
          <div className="rounded-2xl border border-ink/10 bg-white shadow-soft py-16 text-center text-muted">
            <Cpu className="h-12 w-12 mx-auto opacity-20 text-copper mb-2" />
            <p>Aucun équipement dans cette catégorie.</p>
          </div>
        ) : (
          <ul className="grid gap-3">
            {filtered!.map((a) => (
              <li
                key={a.equipment.id}
                className="rounded-2xl border border-ink/10 bg-white shadow-soft p-5"
              >
                <div className="grid lg:grid-cols-12 gap-3 items-center">
                  <div className="lg:col-span-1">
                    <div
                      className="h-12 w-12 rounded-full grid place-items-center"
                      style={{
                        background: `${STATUS_COLORS[a.status]}1c`,
                        color: STATUS_COLORS[a.status],
                      }}
                    >
                      <Cpu className="h-5 w-5" />
                    </div>
                  </div>
                  <div className="lg:col-span-5 min-w-0">
                    <Link
                      href={`/admin/leads/${a.equipment.leadReference}`}
                      className="text-sm font-medium text-ink hover:text-copper truncate block"
                    >
                      {a.equipment.brand} · {a.equipment.model}
                    </Link>
                    <div className="text-[11px] text-muted font-mono">
                      {TYPE_LABELS[a.equipment.type] ?? a.equipment.type} ·{" "}
                      {a.equipment.leadReference}
                      {a.equipment.location && ` · ${a.equipment.location}`}
                    </div>
                    <div className="text-xs text-graphite mt-1">
                      {a.recommendation}
                    </div>
                  </div>
                  <div className="lg:col-span-3">
                    <div className="text-xs text-muted">Âge / vie</div>
                    <div className="font-mono text-sm text-ink">
                      {a.ageYears === null ? "—" : `${a.ageYears} ans`} /{" "}
                      {a.lifespanYears} ans
                    </div>
                    {a.wearRatio !== null && (
                      <div className="mt-1 h-1.5 bg-cream rounded-full overflow-hidden">
                        <div
                          className="h-full transition-all"
                          style={{
                            width: `${Math.min(100, a.wearRatio * 100)}%`,
                            background: STATUS_COLORS[a.status],
                          }}
                        />
                      </div>
                    )}
                  </div>
                  <div className="lg:col-span-2 text-right">
                    <span
                      className="px-2 py-0.5 rounded-full text-[10px] font-mono uppercase tracking-eyebrow"
                      style={{
                        background: `${STATUS_COLORS[a.status]}1c`,
                        color: STATUS_COLORS[a.status],
                      }}
                    >
                      {STATUS_LABELS[a.status]}
                    </span>
                    <div className="mt-2 inline-flex items-center gap-1 text-xs font-mono text-copper">
                      <TrendingUp className="h-3 w-3" />
                      {a.opportunityScore}/100
                    </div>
                  </div>
                  <div className="lg:col-span-1 text-right">
                    <Link
                      href={`/admin/leads/${a.equipment.leadReference}`}
                      className="h-8 w-8 inline-grid place-items-center rounded-full bg-cream border border-ink/10 text-graphite hover:bg-ink hover:text-cream"
                    >
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}

        <p className="mt-4 text-xs text-muted">
          Durées de vie indicatives basées sur les moyennes industrie.
          L&apos;entretien, la qualité de l&apos;eau et la sollicitation
          affectent la durée réelle. Recoupez avec les comptes-rendus de visite
          pour confirmer.
        </p>
        {/* Suppress unused */}
        <span className="hidden">
          <AlertTriangle className="h-3 w-3" />
        </span>
      </div>
    </div>
  );
}

function Kpi({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div className="rounded-2xl border border-ink/10 bg-white shadow-soft p-4">
      <div
        className="font-mono text-[9px] uppercase tracking-eyebrow"
        style={{ color }}
      >
        {label}
      </div>
      <div
        className="mt-1 font-display text-2xl tabular-nums"
        style={{ color }}
      >
        {value}
      </div>
    </div>
  );
}
