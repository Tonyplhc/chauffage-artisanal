"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Mail,
  Eye,
  MousePointerClick,
  TrendingUp,
} from "lucide-react";
import { cn } from "@/lib/utils";

type Tracking = {
  id: string;
  kind: "template" | "newsletter" | "campaign" | "quote";
  refKey: string;
  recipientHash: string;
  createdAt: string;
  opens: number;
  clicks: number;
  lastOpenAt?: string;
  lastClickAt?: string;
  clickedUrls: Record<string, number>;
};

const KIND_LABELS: Record<Tracking["kind"], string> = {
  template: "Template",
  newsletter: "Newsletter",
  campaign: "Campagne",
  quote: "Devis",
};

const KIND_COLORS: Record<Tracking["kind"], string> = {
  template: "#b86a36",
  newsletter: "#6ba3c5",
  campaign: "#94532a",
  quote: "#22a06b",
};

export default function EmailTrackingPage() {
  const router = useRouter();
  const [data, setData] = useState<{
    tracking: Tracking[];
    totals: { sent: number; opens: number; clicks: number };
    rates: { openRate: number; clickRate: number };
    byKind: Record<string, { sent: number; opens: number; clicks: number }>;
  } | null>(null);

  useEffect(() => {
    (async () => {
      const res = await fetch("/api/admin/email-tracking", { cache: "no-store" });
      if (res.status === 401) {
        router.replace("/admin/login");
        return;
      }
      const json = await res.json();
      setData(json);
    })();
  }, [router]);

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
          <h1 className="font-display text-display-md text-ink">Email tracking</h1>
          <p className="mt-2 text-graphite">
            Taux d&apos;ouverture et de clic des emails envoyés depuis l&apos;admin.
          </p>
        </div>

        {data === null ? (
          <div className="rounded-2xl bg-white border border-ink/10 p-12 text-center text-muted">
            Chargement…
          </div>
        ) : data.totals.sent === 0 ? (
          <div className="rounded-2xl bg-white border border-ink/10 p-12 text-center">
            <Mail className="h-10 w-10 mx-auto text-ink/15" />
            <p className="mt-3 text-graphite">
              Aucun email tracké pour l&apos;instant. Les emails envoyés via
              templates et newsletters seront automatiquement trackés.
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
              <Kpi
                label="Envoyés"
                value={data.totals.sent}
                icon={Mail}
                accent="copper"
              />
              <Kpi
                label="Ouvertures"
                value={data.totals.opens}
                icon={Eye}
                accent="copper"
                hint={`${Math.round(data.rates.openRate * 100)}% taux ouverture`}
              />
              <Kpi
                label="Clics"
                value={data.totals.clicks}
                icon={MousePointerClick}
                accent="green"
                hint={`${Math.round(data.rates.clickRate * 100)}% taux clic`}
              />
              <Kpi
                label="CTR / open"
                value={
                  data.totals.opens > 0
                    ? `${Math.round((data.totals.clicks / data.totals.opens) * 100)}%`
                    : "—"
                }
                icon={TrendingUp}
                accent="copper"
              />
            </div>

            {/* Par type */}
            <div className="rounded-2xl bg-white border border-ink/10 shadow-soft p-6 mb-6">
              <div className="font-mono text-[10px] uppercase tracking-eyebrow text-copper mb-4">
                Performance par type d&apos;email
              </div>
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {(Object.keys(data.byKind) as Tracking["kind"][]).map((k) => {
                  const b = data.byKind[k];
                  const open = b.sent > 0 ? (b.opens / b.sent) * 100 : 0;
                  const click = b.sent > 0 ? (b.clicks / b.sent) * 100 : 0;
                  return (
                    <div
                      key={k}
                      className="p-4 rounded-xl border bg-cream"
                      style={{ borderColor: `${KIND_COLORS[k]}40` }}
                    >
                      <div
                        className="font-mono text-[10px] uppercase tracking-eyebrow"
                        style={{ color: KIND_COLORS[k] }}
                      >
                        {KIND_LABELS[k]}
                      </div>
                      <div className="mt-2 text-sm text-ink">
                        {b.sent} envoyé{b.sent > 1 ? "s" : ""}
                      </div>
                      <div className="mt-1 text-xs text-graphite">
                        Open: {open.toFixed(0)}% · Click: {click.toFixed(0)}%
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Liste */}
            <div className="rounded-2xl bg-white border border-ink/10 shadow-soft overflow-hidden">
              <div className="px-5 py-3 border-b border-ink/8">
                <div className="font-mono text-[10px] uppercase tracking-eyebrow text-copper">
                  Détail des envois ({data.tracking.length})
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-cream/40 text-left text-xs font-mono uppercase tracking-eyebrow text-muted">
                    <tr>
                      <th className="px-5 py-3">Type · réf</th>
                      <th className="px-5 py-3">Envoyé le</th>
                      <th className="px-5 py-3">Ouvertures</th>
                      <th className="px-5 py-3">Clics</th>
                      <th className="px-5 py-3">Dernière activité</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.tracking.map((t) => (
                      <tr key={t.id} className="border-b border-ink/8 last:border-0">
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-2">
                            <span
                              className="font-mono text-[10px] uppercase tracking-eyebrow px-2 py-0.5 rounded-full"
                              style={{
                                background: `${KIND_COLORS[t.kind]}15`,
                                color: KIND_COLORS[t.kind],
                                border: `1px solid ${KIND_COLORS[t.kind]}55`,
                              }}
                            >
                              {KIND_LABELS[t.kind]}
                            </span>
                            <code className="font-mono text-xs text-graphite truncate">
                              {t.refKey}
                            </code>
                          </div>
                        </td>
                        <td className="px-5 py-3 text-graphite text-xs tabular-nums">
                          {new Date(t.createdAt).toLocaleString("fr-FR", {
                            dateStyle: "short",
                            timeStyle: "short",
                          })}
                        </td>
                        <td className="px-5 py-3 tabular-nums">
                          <span
                            className={cn(
                              t.opens > 0 ? "text-ink font-medium" : "text-muted",
                            )}
                          >
                            {t.opens}
                          </span>
                        </td>
                        <td className="px-5 py-3 tabular-nums">
                          <span
                            className={cn(
                              t.clicks > 0 ? "text-[#22a06b] font-medium" : "text-muted",
                            )}
                          >
                            {t.clicks}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-xs text-muted tabular-nums">
                          {t.lastClickAt
                            ? new Date(t.lastClickAt).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" })
                            : t.lastOpenAt
                            ? new Date(t.lastOpenAt).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" })
                            : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function Kpi({
  label,
  value,
  icon: Icon,
  accent,
  hint,
}: {
  label: string;
  value: number | string;
  icon: typeof Mail;
  accent: "copper" | "green";
  hint?: string;
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
          <div className="mt-0.5 font-display text-2xl text-ink tabular-nums">{value}</div>
        </div>
      </div>
      {hint && <div className="mt-2 text-xs text-muted">{hint}</div>}
    </div>
  );
}
