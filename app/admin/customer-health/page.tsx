"use client";

/**
 * Dashboard customer health — tri par pires scores pour identifier rapidement
 * les clients à risque.
 */

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Loader2,
  Heart,
  AlertTriangle,
  Smile,
  ArrowRight,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import { cn } from "@/lib/utils";

type Label = "excellent" | "healthy" | "at_risk" | "critical";

const LABEL_FR: Record<Label, string> = {
  excellent: "Excellent",
  healthy: "En forme",
  at_risk: "À risque",
  critical: "Critique",
};

const LABEL_COLORS: Record<Label, string> = {
  excellent: "#22a06b",
  healthy: "#6ba3c5",
  at_risk: "#b86a36",
  critical: "#dc5a28",
};

type Factor = {
  label: string;
  delta: number;
  reason: string;
};

type Assessment = {
  lead: {
    reference: string;
    fullName: string;
    email: string;
    convertedAt?: string;
  };
  score: number;
  label: Label;
  factors: Factor[];
};

type Stats = {
  total: number;
  excellent: number;
  healthy: number;
  atRisk: number;
  critical: number;
  averageScore: number;
};

export default function CustomerHealthPage() {
  const router = useRouter();
  const [assessments, setAssessments] = useState<Assessment[] | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [filter, setFilter] = useState<Label | "all">("all");

  const load = useCallback(async () => {
    const res = await fetch("/api/admin/customer-health", {
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
    filter === "all" ? true : a.label === filter,
  );

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
            Customer health
          </h1>
          <p className="mt-2 text-graphite">
            Score santé des clients post-conversion (NPS, contrat entretien,
            paiements, sentiment). Tri par pires en premier pour action
            prioritaire.
          </p>
        </div>

        {stats && (
          <div className="grid lg:grid-cols-5 gap-3 mb-8">
            <Kpi label="Total" value={String(stats.total)} />
            <Kpi
              label="Score moyen"
              value={String(stats.averageScore)}
              color={stats.averageScore >= 50 ? "#22a06b" : "#dc5a28"}
            />
            {(
              ["excellent", "healthy", "at_risk", "critical"] as Label[]
            ).map((l) => (
              <Kpi
                key={l}
                label={LABEL_FR[l]}
                value={String(stats[l === "at_risk" ? "atRisk" : l])}
                color={LABEL_COLORS[l]}
              />
            ))}
          </div>
        )}

        <div className="flex items-center gap-2 mb-4 flex-wrap">
          <button
            onClick={() => setFilter("all")}
            className={cn(
              "px-3 py-1.5 rounded-full text-sm transition-colors",
              filter === "all"
                ? "bg-ink text-cream"
                : "bg-white border border-ink/10 text-graphite hover:border-copper/40",
            )}
          >
            Tous
          </button>
          {(
            ["critical", "at_risk", "healthy", "excellent"] as Label[]
          ).map((l) => (
            <button
              key={l}
              onClick={() => setFilter(l)}
              className={cn(
                "px-3 py-1.5 rounded-full text-sm transition-colors inline-flex items-center gap-1.5",
                filter === l
                  ? "bg-ink text-cream"
                  : "bg-white border border-ink/10 text-graphite hover:border-copper/40",
              )}
            >
              <span
                className="h-2 w-2 rounded-full"
                style={{ background: LABEL_COLORS[l] }}
              />
              {LABEL_FR[l]}
            </button>
          ))}
        </div>

        {assessments === null ? (
          <div className="py-16 text-center text-muted">
            <Loader2 className="h-6 w-6 animate-spin mx-auto" />
          </div>
        ) : (filtered?.length ?? 0) === 0 ? (
          <div className="rounded-2xl border border-ink/10 bg-white shadow-soft py-16 text-center text-muted">
            <Heart className="h-12 w-12 mx-auto opacity-20 text-copper mb-2" />
            <p>Aucun client dans cette catégorie.</p>
          </div>
        ) : (
          <ul className="grid gap-3">
            {filtered!.map((a) => (
              <li
                key={a.lead.reference}
                className="rounded-2xl border border-ink/10 bg-white shadow-soft p-5"
              >
                <div className="flex items-start gap-3 mb-3">
                  <div
                    className="h-14 w-14 rounded-full grid place-items-center font-display tabular-nums shrink-0"
                    style={{
                      background: `${LABEL_COLORS[a.label]}20`,
                      color: LABEL_COLORS[a.label],
                    }}
                  >
                    {a.score}
                  </div>
                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/admin/leads/${a.lead.reference}`}
                      className="text-base font-medium text-ink hover:text-copper truncate block"
                    >
                      {a.lead.fullName}
                    </Link>
                    <div className="text-[11px] text-muted font-mono">
                      {a.lead.reference} · {a.lead.email}
                    </div>
                  </div>
                  <span
                    className="px-3 py-0.5 rounded-full text-[10px] font-mono uppercase tracking-eyebrow"
                    style={{
                      background: `${LABEL_COLORS[a.label]}20`,
                      color: LABEL_COLORS[a.label],
                    }}
                  >
                    {LABEL_FR[a.label]}
                  </span>
                  <Link
                    href={`/admin/leads/${a.lead.reference}`}
                    className="h-8 w-8 grid place-items-center rounded-full bg-cream border border-ink/10 hover:bg-ink hover:text-cream"
                  >
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
                {a.factors.length > 0 && (
                  <ul className="grid gap-1 pt-3 border-t border-ink/5">
                    {a.factors.slice(0, 5).map((f, i) => (
                      <li
                        key={i}
                        className="flex items-center gap-2 text-xs"
                      >
                        {f.delta > 0 ? (
                          <TrendingUp className="h-3 w-3 text-[#22a06b] shrink-0" />
                        ) : f.delta < 0 ? (
                          <TrendingDown className="h-3 w-3 text-ember shrink-0" />
                        ) : (
                          <AlertTriangle className="h-3 w-3 text-muted shrink-0" />
                        )}
                        <span className="text-ink font-medium">
                          {f.label}
                        </span>
                        <span className="text-muted">— {f.reason}</span>
                        <span
                          className="ml-auto font-mono tabular-nums"
                          style={{
                            color:
                              f.delta > 0
                                ? "#22a06b"
                                : f.delta < 0
                                  ? "#dc5a28"
                                  : "#8b847a",
                          }}
                        >
                          {f.delta > 0 ? "+" : ""}
                          {f.delta}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ul>
        )}
        {/* Suppress unused */}
        <span className="hidden">
          <Smile className="h-3 w-3" />
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
  value: string;
  color?: string;
}) {
  return (
    <div className="rounded-2xl border border-ink/10 bg-white shadow-soft p-4">
      <div
        className="font-mono text-[9px] uppercase tracking-eyebrow"
        style={{ color: color ?? "#8b847a" }}
      >
        {label}
      </div>
      <div
        className="mt-1 font-display text-2xl tabular-nums"
        style={{ color: color ?? "#1e1a15" }}
      >
        {value}
      </div>
    </div>
  );
}
