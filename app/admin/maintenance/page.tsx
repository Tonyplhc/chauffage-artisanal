"use client";

/**
 * Dashboard contrats d'entretien — vue d'ensemble des récurrences.
 */

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Loader2,
  Plus,
  Wrench,
  Calendar,
  AlertTriangle,
  Trophy,
  CheckCircle2,
  ArrowRight,
  FileText,
} from "lucide-react";
import { cn } from "@/lib/utils";

type Contract = {
  id: string;
  contractNumber: string;
  leadReference: string;
  clientName: string;
  type: "chaudiere" | "pac" | "clim" | "sanitaire" | "autre";
  equipment: string;
  frequency: "annual" | "biannual" | "quarterly";
  startDate: string;
  nextDueAt: string;
  lastVisitAt?: string;
  amountAnnualEur?: number;
  status: "active" | "paused" | "expired";
};

type Stats = {
  total: number;
  active: number;
  paused: number;
  expired: number;
  dueWithin30d: number;
  dueWithin90d: number;
  overdue: number;
  recurringRevenueAnnual: number;
};

const TYPE_LABELS = {
  chaudiere: "Chaudière",
  pac: "Pompe à chaleur",
  clim: "Climatisation",
  sanitaire: "Sanitaire",
  autre: "Autre",
};

const FREQ_LABELS = {
  annual: "1×/an",
  biannual: "2×/an",
  quarterly: "4×/an",
};

function formatEur(value: number, compact = false) {
  if (compact && Math.abs(value) >= 1000)
    return `${(value / 1000).toFixed(value % 1000 === 0 ? 0 : 1).replace(/\.0$/, "")} k€`;
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(value);
}

function urgencyOf(nextDueAt: string): "overdue" | "soon" | "later" {
  const due = new Date(nextDueAt).getTime();
  const now = Date.now();
  if (due < now) return "overdue";
  if (due < now + 30 * 86_400_000) return "soon";
  return "later";
}

export default function MaintenancePage() {
  const router = useRouter();
  const [contracts, setContracts] = useState<Contract[] | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [filter, setFilter] = useState<"active" | "all">("active");

  const load = useCallback(async () => {
    const res = await fetch("/api/admin/maintenance", { cache: "no-store" });
    if (res.status === 401) {
      router.replace("/admin/login");
      return;
    }
    if (res.ok) {
      const d = await res.json();
      setContracts(d.contracts ?? []);
      setStats(d.stats);
    }
  }, [router]);

  useEffect(() => {
    load();
    const i = setInterval(load, 60_000);
    return () => clearInterval(i);
  }, [load]);

  const filtered = contracts?.filter((c) =>
    filter === "active" ? c.status === "active" : true,
  );

  const startVisit = async (contractId: string) => {
    const res = await fetch(`/api/admin/maintenance/${contractId}/visits`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    if (res.ok) {
      const data = await res.json();
      router.push(`/admin/visits/${data.visit.id}`);
    }
  };

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
            Contrats d&apos;entretien
          </h1>
          <p className="mt-2 text-graphite">
            Suivi des contrats récurrents (chaudière, PAC, clim). Un rappel
            automatique est créé sur le lead quand l&apos;échéance approche.
          </p>
        </div>

        {stats && (
          <div className="grid lg:grid-cols-4 gap-4 mb-8">
            <Kpi
              icon={<Wrench className="h-4 w-4" />}
              label="Actifs"
              value={String(stats.active)}
              hint={`${stats.total} au total`}
            />
            <Kpi
              icon={<AlertTriangle className="h-4 w-4 text-ember" />}
              label="En retard"
              value={String(stats.overdue)}
              accent={stats.overdue > 0 ? "warn" : undefined}
            />
            <Kpi
              icon={<Calendar className="h-4 w-4 text-copper" />}
              label="Dans 30 j"
              value={String(stats.dueWithin30d)}
              hint={`+ ${stats.dueWithin90d} sous 90 j`}
              accent={stats.dueWithin30d > 0 ? "copper" : undefined}
            />
            <Kpi
              icon={<Trophy className="h-4 w-4 text-[#22a06b]" />}
              label="Revenu annuel"
              value={formatEur(stats.recurringRevenueAnnual, true)}
              hint="récurrent indicatif"
              accent="success"
            />
          </div>
        )}

        <div className="flex items-center gap-2 mb-4">
          {(["active", "all"] as const).map((f) => (
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
              {f === "active" ? "Actifs" : "Tous"}
            </button>
          ))}
        </div>

        <div className="rounded-2xl border border-ink/10 bg-white shadow-soft overflow-hidden">
          {contracts === null ? (
            <div className="py-12 text-center text-muted">
              <Loader2 className="h-5 w-5 animate-spin mx-auto" />
            </div>
          ) : (filtered?.length ?? 0) === 0 ? (
            <div className="py-16 text-center text-muted">
              <Wrench className="h-12 w-12 mx-auto opacity-20 text-copper mb-2" />
              <p>Aucun contrat dans cette vue.</p>
              <p className="text-xs mt-1">
                Depuis la fiche d&apos;un lead converti → bouton « Contrat
                d&apos;entretien ».
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-ink/8">
              {filtered!.map((c) => {
                const urgency = urgencyOf(c.nextDueAt);
                return (
                  <li key={c.id}>
                    <Link
                      href={`/admin/leads/${c.leadReference}`}
                      className="grid lg:grid-cols-12 gap-3 items-center px-5 py-3 hover:bg-cream/40 transition-colors group"
                    >
                      <div className="lg:col-span-4 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs text-copper">
                            {c.contractNumber}
                          </span>
                          {c.status === "active" && (
                            <CheckCircle2 className="h-3 w-3 text-[#22a06b]" />
                          )}
                        </div>
                        <div className="text-sm text-ink font-medium mt-0.5 truncate">
                          {c.clientName}
                        </div>
                        <div className="text-[11px] text-muted font-mono truncate">
                          {c.leadReference}
                        </div>
                      </div>
                      <div className="lg:col-span-3 min-w-0">
                        <div className="text-sm text-graphite truncate">
                          {TYPE_LABELS[c.type]} · {FREQ_LABELS[c.frequency]}
                        </div>
                        <div className="text-[11px] text-muted truncate">
                          {c.equipment}
                        </div>
                      </div>
                      <div className="lg:col-span-3">
                        <div className="text-xs text-muted">
                          Prochaine visite
                        </div>
                        <div
                          className={cn(
                            "text-sm font-mono",
                            urgency === "overdue"
                              ? "text-ember"
                              : urgency === "soon"
                                ? "text-copper"
                                : "text-ink",
                          )}
                        >
                          {new Date(c.nextDueAt).toLocaleDateString("fr-FR", {
                            dateStyle: "medium",
                          })}
                        </div>
                      </div>
                      <div className="lg:col-span-2 text-right">
                        {c.amountAnnualEur ? (
                          <div className="font-mono text-sm text-ink">
                            {formatEur(c.amountAnnualEur)}/an
                          </div>
                        ) : (
                          <div className="text-xs text-muted">—</div>
                        )}
                        <ArrowRight className="inline-block h-3 w-3 text-muted opacity-0 group-hover:opacity-100 transition-opacity mt-1" />
                      </div>
                    </Link>
                    <div className="px-5 pb-3 flex items-center justify-end gap-2">
                      <button
                        onClick={() => startVisit(c.id)}
                        className="inline-flex items-center gap-1.5 rounded-full bg-copper/10 border border-copper/30 text-copper px-3 py-1 text-xs hover:bg-copper hover:text-cream"
                      >
                        <FileText className="h-3 w-3" />
                        Nouveau compte-rendu
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <p className="mt-4 text-xs text-muted">
          Un rappel est créé automatiquement sur le lead quand l&apos;échéance
          d&apos;un contrat actif est dans moins de 30 jours. Le rappel est
          conservé jusqu&apos;à enregistrement de la visite.
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
  accent?: "copper" | "warn" | "success";
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
            : accent === "warn"
              ? "text-ember"
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
