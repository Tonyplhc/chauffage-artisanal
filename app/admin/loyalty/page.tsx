"use client";

/**
 * Dashboard programme de fidélité — comptes clients + paliers.
 */

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Loader2,
  Award,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";

type Tier = "bronze" | "silver" | "gold" | "platinum";

const TIER_LABELS: Record<Tier, string> = {
  bronze: "Bronze",
  silver: "Argent",
  gold: "Or",
  platinum: "Platine",
};

const TIER_COLORS: Record<Tier, string> = {
  bronze: "#94532a",
  silver: "#8b847a",
  gold: "#d4a017",
  platinum: "#1e1a15",
};

const TIER_THRESHOLDS: Record<Tier, number> = {
  bronze: 0,
  silver: 150,
  gold: 400,
  platinum: 1000,
};

type Account = {
  leadReference: string;
  clientName: string;
  email: string;
  points: number;
  tier: Tier;
};

type Stats = {
  totalAccounts: number;
  totalPoints: number;
  byTier: Record<Tier, number>;
};

export default function LoyaltyPage() {
  const router = useRouter();
  const [accounts, setAccounts] = useState<Account[] | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [filter, setFilter] = useState<Tier | "all">("all");

  const load = useCallback(async () => {
    const res = await fetch("/api/admin/loyalty", { cache: "no-store" });
    if (res.status === 401) {
      router.replace("/admin/login");
      return;
    }
    if (res.ok) {
      const d = await res.json();
      setAccounts(d.accounts ?? []);
      setStats(d.stats);
    }
  }, [router]);

  useEffect(() => {
    load();
    const i = setInterval(load, 60_000);
    return () => clearInterval(i);
  }, [load]);

  const filtered = accounts?.filter((a) =>
    filter === "all" ? true : a.tier === filter,
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
          <div className="inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-eyebrow text-copper bg-copper/10 border border-copper/20 px-3 py-1 rounded-full">
            <Award className="h-3 w-3" />
            Programme fidélité
          </div>
          <h1 className="mt-3 font-display text-display-md text-ink">
            Comptes clients
          </h1>
          <p className="mt-2 text-graphite">
            Points cumulés par conversion (+100), parrainage (+50), entretien
            actif (+25), NPS promoteur (+30). Paliers automatiques.
          </p>
        </div>

        {stats && (
          <div className="grid lg:grid-cols-5 gap-3 mb-8">
            <Kpi
              label="Total comptes"
              value={String(stats.totalAccounts)}
            />
            {(["bronze", "silver", "gold", "platinum"] as Tier[]).map((t) => (
              <Kpi
                key={t}
                label={TIER_LABELS[t]}
                value={String(stats.byTier[t])}
                color={TIER_COLORS[t]}
                hint={`≥ ${TIER_THRESHOLDS[t]} pts`}
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
          {(["platinum", "gold", "silver", "bronze"] as Tier[]).map((t) => (
            <button
              key={t}
              onClick={() => setFilter(t)}
              className={cn(
                "px-3 py-1.5 rounded-full text-sm transition-colors inline-flex items-center gap-1.5",
                filter === t
                  ? "bg-ink text-cream"
                  : "bg-white border border-ink/10 text-graphite hover:border-copper/40",
              )}
            >
              <span
                className="h-2 w-2 rounded-full"
                style={{ background: TIER_COLORS[t] }}
              />
              {TIER_LABELS[t]}
            </button>
          ))}
        </div>

        {accounts === null ? (
          <div className="py-16 text-center text-muted">
            <Loader2 className="h-6 w-6 animate-spin mx-auto" />
          </div>
        ) : (filtered?.length ?? 0) === 0 ? (
          <div className="rounded-2xl border border-ink/10 bg-white shadow-soft py-16 text-center text-muted">
            <Award className="h-12 w-12 mx-auto opacity-20 text-copper mb-2" />
            <p>Aucun compte dans cette catégorie.</p>
            <p className="text-xs mt-1">
              Les comptes se créent automatiquement à la conversion d&apos;un
              lead.
            </p>
          </div>
        ) : (
          <ul className="grid gap-3">
            {filtered!.map((a) => (
              <li
                key={a.leadReference}
                className="rounded-2xl border border-ink/10 bg-white shadow-soft p-5"
              >
                <Link
                  href={`/admin/leads/${a.leadReference}`}
                  className="grid lg:grid-cols-12 gap-3 items-center hover:opacity-90"
                >
                  <div className="lg:col-span-1">
                    <div
                      className="h-12 w-12 rounded-full grid place-items-center"
                      style={{
                        background: `${TIER_COLORS[a.tier]}20`,
                        color: TIER_COLORS[a.tier],
                      }}
                    >
                      <Award className="h-5 w-5" />
                    </div>
                  </div>
                  <div className="lg:col-span-5 min-w-0">
                    <div className="text-sm font-medium text-ink">
                      {a.clientName}
                    </div>
                    <div className="text-[11px] text-muted font-mono">
                      {a.leadReference} · {a.email}
                    </div>
                  </div>
                  <div className="lg:col-span-3">
                    <span
                      className="px-3 py-0.5 rounded-full text-[10px] font-mono uppercase tracking-eyebrow"
                      style={{
                        background: `${TIER_COLORS[a.tier]}20`,
                        color: TIER_COLORS[a.tier],
                      }}
                    >
                      {TIER_LABELS[a.tier]}
                    </span>
                  </div>
                  <div className="lg:col-span-2 text-right">
                    <div className="font-display text-2xl tabular-nums text-ink">
                      {a.points}
                    </div>
                    <div className="text-[10px] font-mono uppercase tracking-eyebrow text-muted">
                      points
                    </div>
                  </div>
                  <div className="lg:col-span-1 text-right">
                    <ArrowRight className="h-3.5 w-3.5 text-muted ml-auto" />
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}

        <p className="mt-4 text-xs text-muted">
          Les points sont attribués automatiquement (conversion, parrainage,
          contrat actif, NPS). Ajustement manuel possible depuis la fiche
          lead.
        </p>
        {/* Suppress unused */}
        <span className="hidden">
          <Sparkles className="h-3 w-3" />
        </span>
      </div>
    </div>
  );
}

function Kpi({
  label,
  value,
  color,
  hint,
}: {
  label: string;
  value: string;
  color?: string;
  hint?: string;
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
      {hint && <div className="text-[10px] text-muted mt-0.5">{hint}</div>}
    </div>
  );
}
