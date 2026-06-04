"use client";

/**
 * Dashboard parrainage — vue d'ensemble des parrains et de leur impact.
 */

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Loader2,
  Heart,
  Trophy,
  Eye,
  ArrowRight,
  Users,
} from "lucide-react";

type Summary = {
  referrer: {
    reference: string;
    fullName: string;
    commune: string;
    status: string;
    submittedAt: string;
  };
  stats: {
    clickCount: number;
    createdAt: string;
    lastClickAt?: string;
  };
  brought: number;
  converted: number;
  broughtLeads: {
    reference: string;
    fullName: string;
    status: string;
    submittedAt: string;
  }[];
};

const STATUS_LABELS: Record<string, string> = {
  nouveau: "Nouveau",
  contacte: "Contacté",
  devis_envoye: "Devis envoyé",
  converti: "Converti",
  perdu: "Perdu",
};

export default function ReferralsPage() {
  const router = useRouter();
  const [referrals, setReferrals] = useState<Summary[] | null>(null);

  const load = useCallback(async () => {
    const res = await fetch("/api/admin/referrals", { cache: "no-store" });
    if (res.status === 401) {
      router.replace("/admin/login");
      return;
    }
    if (res.ok) {
      const data = await res.json();
      setReferrals(data.referrals ?? []);
    }
  }, [router]);

  useEffect(() => {
    load();
    const i = setInterval(load, 60_000);
    return () => clearInterval(i);
  }, [load]);

  const totals = referrals?.reduce(
    (acc, r) => {
      acc.referrers += 1;
      acc.clicks += r.stats.clickCount;
      acc.brought += r.brought;
      acc.converted += r.converted;
      return acc;
    },
    { referrers: 0, clicks: 0, brought: 0, converted: 0 },
  ) ?? { referrers: 0, clicks: 0, brought: 0, converted: 0 };

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
            Programme de parrainage
          </h1>
          <p className="mt-2 text-graphite">
            Chaque client converti peut obtenir un lien personnel à partager.
            Un visiteur arrivant via ce lien est attribué à son parrain pour
            geste commercial éventuel.
          </p>
        </div>

        {/* KPIs */}
        <div className="grid lg:grid-cols-4 gap-4 mb-8">
          <Kpi
            label="Parrains potentiels"
            value={String(totals.referrers)}
            icon={<Users className="h-4 w-4" />}
          />
          <Kpi
            label="Clicks cumulés"
            value={String(totals.clicks)}
            icon={<Eye className="h-4 w-4" />}
          />
          <Kpi
            label="Leads parrainés"
            value={String(totals.brought)}
            icon={<Heart className="h-4 w-4 text-copper" />}
            accent="copper"
          />
          <Kpi
            label="Convertis via parrains"
            value={String(totals.converted)}
            icon={<Trophy className="h-4 w-4 text-[#22a06b]" />}
            accent="success"
          />
        </div>

        {referrals === null ? (
          <div className="py-16 text-center text-muted">
            <Loader2 className="h-6 w-6 animate-spin mx-auto" />
          </div>
        ) : referrals.length === 0 ? (
          <div className="rounded-2xl border border-ink/10 bg-white shadow-soft py-16 text-center text-muted">
            <Heart className="h-12 w-12 mx-auto opacity-20 text-copper mb-2" />
            <p>Aucun parrain pour l&apos;instant.</p>
            <p className="text-xs mt-1">
              Chaque lead converti peut obtenir un lien depuis sa fiche.
            </p>
          </div>
        ) : (
          <ul className="grid gap-3">
            {referrals.map((r) => (
              <li
                key={r.referrer.reference}
                className="rounded-2xl border border-ink/10 bg-white shadow-soft p-5"
              >
                <div className="flex items-start gap-3 mb-3">
                  <div
                    className="h-12 w-12 rounded-full grid place-items-center shrink-0"
                    style={{
                      background: "rgba(184,106,54,0.12)",
                      color: "#b86a36",
                    }}
                  >
                    <Heart className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/admin/leads/${r.referrer.reference}`}
                      className="text-base font-medium text-ink hover:text-copper truncate block"
                    >
                      {r.referrer.fullName}
                    </Link>
                    <div className="text-xs text-muted font-mono">
                      {r.referrer.reference} · {r.referrer.commune} · converti
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-right">
                    <Stat label="Clicks" value={r.stats.clickCount} />
                    <Stat label="Leads" value={r.brought} accent="copper" />
                    <Stat
                      label="Convertis"
                      value={r.converted}
                      accent="success"
                    />
                  </div>
                </div>
                {r.broughtLeads.length > 0 && (
                  <div className="pt-3 border-t border-ink/8">
                    <div className="font-mono text-[10px] uppercase tracking-eyebrow text-muted mb-2">
                      Filleuls
                    </div>
                    <ul className="grid gap-1">
                      {r.broughtLeads.map((b) => (
                        <li key={b.reference}>
                          <Link
                            href={`/admin/leads/${b.reference}`}
                            className="flex items-center gap-2 text-sm hover:bg-cream/40 px-2 py-1 -mx-2 rounded-lg transition-colors"
                          >
                            <span className="text-ink truncate flex-1">
                              {b.fullName}
                            </span>
                            <span className="text-[10px] font-mono uppercase tracking-eyebrow text-graphite bg-cream border border-ink/8 px-2 py-0.5 rounded-full">
                              {STATUS_LABELS[b.status] ?? b.status}
                            </span>
                            <ArrowRight className="h-3 w-3 text-muted" />
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function Kpi({
  icon,
  label,
  value,
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  accent?: "copper" | "success";
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
            : "text-ink"
        }`}
      >
        {value}
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  accent,
}: {
  label: string;
  value: number;
  accent?: "copper" | "success";
}) {
  return (
    <div className="min-w-[60px]">
      <div
        className={`font-mono text-lg tabular-nums ${
          accent === "copper"
            ? "text-copper"
            : accent === "success"
            ? "text-[#22a06b]"
            : "text-ink"
        }`}
      >
        {value}
      </div>
      <div className="text-[10px] font-mono uppercase tracking-eyebrow text-muted">
        {label}
      </div>
    </div>
  );
}
