"use client";

/**
 * Analytics par source d'acquisition.
 *
 * Breakdown par source (utm_source ou referrer si UTM absent), par campagne
 * (utm_campaign), top referrers. Conversion rate calculée parmi les leads
 * « décidés » (converti + perdu).
 */

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Loader2,
  Megaphone,
  Globe,
  TrendingUp,
  Flame,
} from "lucide-react";

type SourceStats = {
  bySource: {
    source: string;
    medium?: string;
    leads: number;
    hot: number;
    converted: number;
    lost: number;
    conversionRate: number;
  }[];
  byCampaign: {
    campaign: string;
    leads: number;
    converted: number;
    conversionRate: number;
  }[];
  topReferrers: { referrer: string; count: number }[];
  total: number;
};

export default function SourcesPage() {
  const router = useRouter();
  const [stats, setStats] = useState<SourceStats | null>(null);
  const [asOf, setAsOf] = useState<string | null>(null);

  const load = useCallback(async () => {
    const res = await fetch("/api/admin/sources", { cache: "no-store" });
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
    const i = setInterval(load, 60_000);
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
            Sources d&apos;acquisition
          </h1>
          <p className="mt-2 text-graphite">
            Performance par canal de provenance (UTM, referrer, direct).
            Conversion calculée parmi les dossiers fermés (convertis + perdus).
            {asOf && (
              <span className="text-muted">
                {" "}
                · {new Date(asOf).toLocaleString("fr-FR")}
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
            {/* Sources principales */}
            <div className="rounded-2xl border border-ink/10 bg-white shadow-soft overflow-hidden mb-6">
              <div className="px-5 py-3 border-b border-ink/8 bg-cream/40 flex items-center gap-2">
                <Globe className="h-4 w-4 text-copper" />
                <span className="font-mono text-[10px] uppercase tracking-eyebrow text-copper">
                  Par source ({stats.bySource.length})
                </span>
              </div>
              {stats.bySource.length === 0 ? (
                <div className="py-12 text-center text-muted text-sm">
                  Pas encore de leads attribués.
                </div>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-cream/30 text-graphite text-left">
                      <th className="px-5 py-3 font-mono text-[10px] uppercase tracking-eyebrow">
                        Source
                      </th>
                      <th className="px-3 py-3 font-mono text-[10px] uppercase tracking-eyebrow text-right">
                        Leads
                      </th>
                      <th className="px-3 py-3 font-mono text-[10px] uppercase tracking-eyebrow text-right">
                        Hot
                      </th>
                      <th className="px-3 py-3 font-mono text-[10px] uppercase tracking-eyebrow text-right">
                        Convertis
                      </th>
                      <th className="px-3 py-3 font-mono text-[10px] uppercase tracking-eyebrow text-right">
                        Perdus
                      </th>
                      <th className="px-5 py-3 font-mono text-[10px] uppercase tracking-eyebrow text-right">
                        Conv. rate
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-ink/5">
                    {stats.bySource.map((s) => (
                      <tr key={`${s.source}-${s.medium ?? ""}`}>
                        <td className="px-5 py-3">
                          <div className="text-ink font-medium">
                            {s.source}
                          </div>
                          {s.medium && (
                            <div className="text-[11px] text-muted font-mono">
                              {s.medium}
                            </div>
                          )}
                        </td>
                        <td className="px-3 py-3 text-right font-mono text-ink tabular-nums">
                          {s.leads}
                        </td>
                        <td className="px-3 py-3 text-right">
                          {s.hot > 0 ? (
                            <span className="inline-flex items-center gap-1 text-ember font-mono tabular-nums">
                              <Flame className="h-3 w-3" />
                              {s.hot}
                            </span>
                          ) : (
                            <span className="text-muted font-mono">0</span>
                          )}
                        </td>
                        <td className="px-3 py-3 text-right font-mono text-[#22a06b] tabular-nums">
                          {s.converted}
                        </td>
                        <td className="px-3 py-3 text-right font-mono text-graphite tabular-nums">
                          {s.lost}
                        </td>
                        <td className="px-5 py-3 text-right">
                          <span className="font-mono text-copper text-sm tabular-nums">
                            {s.converted + s.lost === 0
                              ? "—"
                              : `${Math.round(s.conversionRate * 100)}%`}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* Campagnes */}
            {stats.byCampaign.length > 0 && (
              <div className="rounded-2xl border border-ink/10 bg-white shadow-soft overflow-hidden mb-6">
                <div className="px-5 py-3 border-b border-ink/8 bg-cream/40 flex items-center gap-2">
                  <Megaphone className="h-4 w-4 text-copper" />
                  <span className="font-mono text-[10px] uppercase tracking-eyebrow text-copper">
                    Par campagne ({stats.byCampaign.length})
                  </span>
                </div>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-cream/30 text-graphite text-left">
                      <th className="px-5 py-3 font-mono text-[10px] uppercase tracking-eyebrow">
                        Campagne
                      </th>
                      <th className="px-3 py-3 font-mono text-[10px] uppercase tracking-eyebrow text-right">
                        Leads
                      </th>
                      <th className="px-3 py-3 font-mono text-[10px] uppercase tracking-eyebrow text-right">
                        Convertis
                      </th>
                      <th className="px-5 py-3 font-mono text-[10px] uppercase tracking-eyebrow text-right">
                        Taux
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-ink/5">
                    {stats.byCampaign.map((c) => (
                      <tr key={c.campaign}>
                        <td className="px-5 py-3 text-ink truncate max-w-md">
                          {c.campaign}
                        </td>
                        <td className="px-3 py-3 text-right font-mono text-ink tabular-nums">
                          {c.leads}
                        </td>
                        <td className="px-3 py-3 text-right font-mono text-[#22a06b] tabular-nums">
                          {c.converted}
                        </td>
                        <td className="px-5 py-3 text-right font-mono text-copper tabular-nums">
                          {c.leads === 0
                            ? "—"
                            : `${Math.round(c.conversionRate * 100)}%`}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Top referrers */}
            {stats.topReferrers.length > 0 && (
              <div className="rounded-2xl border border-ink/10 bg-white shadow-soft overflow-hidden">
                <div className="px-5 py-3 border-b border-ink/8 bg-cream/40 flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-copper" />
                  <span className="font-mono text-[10px] uppercase tracking-eyebrow text-copper">
                    Top referrers
                  </span>
                </div>
                <ul className="divide-y divide-ink/8">
                  {stats.topReferrers.map((r, i) => (
                    <li
                      key={r.referrer}
                      className="px-5 py-2.5 flex items-center gap-3"
                    >
                      <span className="h-6 w-6 grid place-items-center rounded-full bg-copper/10 text-copper text-xs font-mono">
                        {i + 1}
                      </span>
                      <span className="flex-1 text-sm text-ink truncate font-mono">
                        {r.referrer}
                      </span>
                      <span className="font-mono text-sm text-graphite tabular-nums">
                        {r.count}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <p className="mt-4 text-xs text-muted">
              Capté côté client via UTM params + referrer à la première
              visite (sessionStorage). RGPD-compatible : aucune cookie tiers,
              aucune IP enregistrée.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
