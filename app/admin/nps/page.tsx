"use client";

/**
 * Dashboard NPS — vue d'ensemble des enquêtes post-conversion.
 *
 * KPIs : NPS, score moyen, taux de réponse, breakdown détracteurs/passifs/promoteurs.
 * Liste des réponses récentes avec commentaires.
 *
 * Bouton "Envoyer les enquêtes en attente" → POST /api/admin/nps/process.
 */

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Loader2,
  Star,
  Mail,
  CheckCircle2,
  Heart,
  AlertTriangle,
  MessageSquare,
  ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

type Survey = {
  id: string;
  leadReference: string;
  recipientEmail: string;
  recipientName: string;
  sentAt: string;
  respondedAt?: string;
  score?: number;
  comment?: string;
};

type Stats = {
  sent: number;
  responded: number;
  responseRate: number;
  averageScore: number | null;
  promoters: number;
  passives: number;
  detractors: number;
  nps: number | null;
  recent: Survey[];
};

function scoreColor(score: number) {
  if (score <= 6) return "#dc5a28";
  if (score <= 8) return "#b86a36";
  return "#22a06b";
}

export default function NpsPage() {
  const router = useRouter();
  const [stats, setStats] = useState<Stats | null>(null);
  const [asOf, setAsOf] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const load = useCallback(async () => {
    const res = await fetch("/api/admin/nps", { cache: "no-store" });
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
  }, [load]);

  const processSurveys = async () => {
    setProcessing(true);
    setResult(null);
    try {
      const res = await fetch("/api/admin/nps/process", { method: "POST" });
      const data = await res.json();
      setResult(
        data.created > 0
          ? `${data.created} enquête(s) envoyée(s).`
          : `Aucune enquête à envoyer pour l'instant.${
              data.skipped?.length ? ` ${data.skipped.length} en attente délai de grâce.` : ""
            }`,
      );
      await load();
    } finally {
      setProcessing(false);
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

        <div className="flex items-start justify-between gap-4 flex-wrap mb-8">
          <div>
            <h1 className="font-display text-display-md text-ink">
              NPS post-conversion
            </h1>
            <p className="mt-2 text-graphite">
              Enquêtes envoyées 7 jours après chaque conversion. Mesure de la
              satisfaction client.
              {asOf && (
                <span className="text-muted">
                  {" "}
                  · {new Date(asOf).toLocaleString("fr-FR")}
                </span>
              )}
            </p>
          </div>
          <button
            onClick={processSurveys}
            disabled={processing}
            className="inline-flex items-center gap-2 rounded-full bg-ink text-cream px-5 py-2.5 text-sm font-medium hover:bg-copper transition-colors disabled:opacity-50"
          >
            {processing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Mail className="h-4 w-4" />
            )}
            Vérifier & envoyer
          </button>
        </div>

        {result && (
          <div className="mb-6 p-3 rounded-xl border border-[#22a06b]/40 bg-[#22a06b]/5 text-sm text-ink flex items-start gap-2">
            <CheckCircle2 className="h-4 w-4 text-[#22a06b] shrink-0 mt-0.5" />
            <span>{result}</span>
          </div>
        )}

        {stats === null ? (
          <div className="py-16 text-center text-muted">
            <Loader2 className="h-6 w-6 animate-spin mx-auto" />
          </div>
        ) : stats.sent === 0 ? (
          <div className="rounded-2xl border border-ink/10 bg-white shadow-soft py-16 text-center">
            <Star className="h-12 w-12 mx-auto opacity-30 text-copper mb-2" />
            <p className="text-ink font-medium">
              Aucune enquête envoyée pour l&apos;instant.
            </p>
            <p className="text-xs text-muted mt-1">
              Les enquêtes partent automatiquement 7 jours après la conversion
              d&apos;un lead.
            </p>
          </div>
        ) : (
          <>
            {/* KPIs */}
            <div className="grid lg:grid-cols-4 gap-4 mb-8">
              <Kpi
                label="Score NPS"
                value={stats.nps === null ? "—" : `${stats.nps}`}
                hint="Promoteurs − Détracteurs (%)"
                accent={
                  stats.nps === null
                    ? "neutral"
                    : stats.nps >= 50
                    ? "success"
                    : stats.nps >= 0
                    ? "neutral"
                    : "warn"
                }
                icon={<Heart className="h-4 w-4" />}
              />
              <Kpi
                label="Score moyen"
                value={
                  stats.averageScore === null
                    ? "—"
                    : `${stats.averageScore.toFixed(1)}/10`
                }
                hint={`${stats.responded} réponses`}
                icon={<Star className="h-4 w-4" />}
              />
              <Kpi
                label="Taux réponse"
                value={`${Math.round(stats.responseRate * 100)}%`}
                hint={`${stats.responded}/${stats.sent} envoyées`}
                icon={<Mail className="h-4 w-4" />}
              />
              <Kpi
                label="Breakdown"
                value=""
                customContent={
                  <div className="mt-2 grid gap-1 text-xs">
                    <BreakdownLine
                      label="Promoteurs"
                      count={stats.promoters}
                      color="#22a06b"
                    />
                    <BreakdownLine
                      label="Passifs"
                      count={stats.passives}
                      color="#b86a36"
                    />
                    <BreakdownLine
                      label="Détracteurs"
                      count={stats.detractors}
                      color="#dc5a28"
                    />
                  </div>
                }
              />
            </div>

            {/* Réponses récentes */}
            <div className="rounded-2xl border border-ink/10 bg-white shadow-soft overflow-hidden">
              <div className="px-5 py-3 border-b border-ink/8 bg-cream/40 flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-copper" />
                <span className="font-mono text-[10px] uppercase tracking-eyebrow text-copper">
                  Activité récente ({stats.recent.length})
                </span>
              </div>
              <ul className="divide-y divide-ink/8">
                {stats.recent.map((s) => {
                  const hasResponded = !!s.respondedAt;
                  return (
                    <li
                      key={s.id}
                      className="px-5 py-4 grid lg:grid-cols-12 gap-3 items-start"
                    >
                      <div className="lg:col-span-1">
                        {hasResponded && s.score !== undefined ? (
                          <div
                            className="h-10 w-10 rounded-full grid place-items-center font-display text-base tabular-nums"
                            style={{
                              background: `${scoreColor(s.score)}1c`,
                              color: scoreColor(s.score),
                            }}
                          >
                            {s.score}
                          </div>
                        ) : (
                          <div className="h-10 w-10 rounded-full bg-cream border border-ink/10 grid place-items-center">
                            <Mail className="h-4 w-4 text-muted" />
                          </div>
                        )}
                      </div>
                      <div className="lg:col-span-7 min-w-0">
                        <div className="text-sm font-medium text-ink truncate">
                          {s.recipientName}
                        </div>
                        <div className="text-xs text-muted font-mono">
                          {s.leadReference} · {s.recipientEmail}
                        </div>
                        {s.comment && (
                          <div className="mt-2 p-2 rounded-lg bg-cream/40 border border-ink/5 text-sm text-graphite italic">
                            « {s.comment} »
                          </div>
                        )}
                      </div>
                      <div className="lg:col-span-3 text-xs text-muted">
                        <div>
                          Envoyée{" "}
                          {new Date(s.sentAt).toLocaleString("fr-FR", {
                            dateStyle: "short",
                            timeStyle: "short",
                          })}
                        </div>
                        {hasResponded && (
                          <div className="text-[#22a06b]">
                            Répondue{" "}
                            {new Date(s.respondedAt!).toLocaleString("fr-FR", {
                              dateStyle: "short",
                              timeStyle: "short",
                            })}
                          </div>
                        )}
                      </div>
                      <div className="lg:col-span-1 flex justify-end">
                        <Link
                          href={`/admin/leads/${s.leadReference}`}
                          className="h-8 w-8 grid place-items-center rounded-full bg-cream border border-ink/10 text-graphite hover:bg-ink hover:text-cream"
                          title="Ouvrir le lead"
                        >
                          <ArrowRight className="h-3.5 w-3.5" />
                        </Link>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>

            <p className="mt-4 text-xs text-muted">
              Méthode : 0-6 = détracteurs · 7-8 = passifs · 9-10 = promoteurs.
              NPS = % promoteurs − % détracteurs. Délai de grâce de 7 j après
              conversion avant envoi de l&apos;enquête.
            </p>
          </>
        )}

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
  hint,
  accent,
  icon,
  customContent,
}: {
  label: string;
  value: string;
  hint?: string;
  accent?: "success" | "warn" | "neutral";
  icon?: React.ReactNode;
  customContent?: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-ink/10 bg-white shadow-soft p-5">
      <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-eyebrow text-muted">
        {icon}
        {label}
      </div>
      {!customContent && (
        <div
          className={cn(
            "mt-2 font-display text-3xl tabular-nums",
            accent === "success"
              ? "text-[#22a06b]"
              : accent === "warn"
              ? "text-ember"
              : "text-ink",
          )}
        >
          {value}
        </div>
      )}
      {customContent}
      {hint && <div className="mt-1 text-xs text-muted">{hint}</div>}
    </div>
  );
}

function BreakdownLine({
  label,
  count,
  color,
}: {
  label: string;
  count: number;
  color: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="h-2 w-2 rounded-full" style={{ background: color }} />
      <span className="text-graphite">{label}</span>
      <span className="ml-auto font-mono text-ink tabular-nums">{count}</span>
    </div>
  );
}
