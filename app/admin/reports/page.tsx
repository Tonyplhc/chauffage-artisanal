"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Mail,
  Send,
  Loader2,
  CheckCircle2,
  TrendingUp,
  TrendingDown,
  ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

type Stats = {
  leadsReceived: number;
  leadsConverted: number;
  hotLeads: number;
  vsLastWeek: { leadsReceived: number; leadsConverted: number };
  dormantCount: number;
  topHotLeads: {
    reference: string;
    name: string;
    services: string[];
    commune: string;
    score?: number;
  }[];
};

export default function ReportsPage() {
  const router = useRouter();
  const [stats, setStats] = useState<Stats | null>(null);
  const [lastSentAt, setLastSentAt] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const refresh = async () => {
    const res = await fetch("/api/admin/reports/digest", { cache: "no-store" });
    if (res.status === 401) {
      router.replace("/admin/login");
      return;
    }
    const data = await res.json();
    setStats(data.stats);
    setLastSentAt(data.lastSentAt ?? null);
  };

  useEffect(() => {
    refresh();
  }, []);

  const sendNow = async (force: boolean) => {
    setBusy(true);
    setResult(null);
    try {
      const res = await fetch(`/api/admin/reports/digest${force ? "?force=1" : ""}`, {
        method: "POST",
      });
      const data = await res.json();
      if (data.skipped) {
        setResult(
          data.reason === "too_recent"
            ? "Déjà envoyé dans les 7 derniers jours. Utilisez « Forcer ».”"
            : data.reason === "no_admins"
            ? "Aucun compte admin pour recevoir le digest."
            : "Envoi ignoré.",
        );
      } else {
        setResult(`Digest envoyé à ${data.sent} destinataire(s).`);
        await refresh();
      }
    } finally {
      setBusy(false);
    }
  };

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

        <div className="flex items-start justify-between gap-6 flex-wrap mb-8">
          <div>
            <h1 className="font-display text-display-md text-ink">
              Reports hebdomadaires
            </h1>
            <p className="mt-2 text-graphite">
              Digest auto envoyé aux comptes admin chaque semaine.{" "}
              {lastSentAt && (
                <span className="text-muted">
                  · Dernier envoi · {new Date(lastSentAt).toLocaleString("fr-FR")}
                </span>
              )}
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Link
              href="/admin/reports/monthly"
              className="inline-flex items-center gap-2 rounded-full border border-ink/15 bg-white px-5 py-2.5 text-sm hover:border-copper/40 transition-colors"
            >
              <TrendingUp className="h-4 w-4" />
              Voir rapport mensuel
            </Link>
            <button
              onClick={() => sendNow(false)}
              disabled={busy}
              className="inline-flex items-center gap-2 rounded-full border border-ink/15 bg-white px-5 py-2.5 text-sm hover:border-copper/40 transition-colors disabled:opacity-50"
            >
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
              Vérifier & envoyer si nécessaire
            </button>
            <button
              onClick={() => sendNow(true)}
              disabled={busy}
              className={cn(
                "inline-flex items-center gap-2 rounded-full bg-ink text-cream px-5 py-2.5 text-sm font-medium hover:bg-copper transition-colors",
                busy && "opacity-50 cursor-not-allowed",
              )}
            >
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              Forcer envoi maintenant
            </button>
          </div>
        </div>

        {result && (
          <div className="mb-6 p-4 rounded-2xl border border-[#22a06b]/40 bg-[#22a06b]/5 flex items-start gap-3">
            <CheckCircle2 className="h-5 w-5 text-[#22a06b] shrink-0 mt-0.5" />
            <div className="text-sm text-ink">{result}</div>
          </div>
        )}

        {/* Preview */}
        {stats && (
          <div className="rounded-2xl border border-ink/10 bg-white shadow-soft p-6 lg:p-8">
            <div className="font-mono text-[10px] uppercase tracking-eyebrow text-copper mb-6">
              Aperçu du digest qui sera envoyé
            </div>

            <div className="grid grid-cols-3 gap-3 mb-6">
              <Kpi
                label="Leads reçus"
                value={stats.leadsReceived}
                trend={stats.vsLastWeek.leadsReceived}
              />
              <Kpi
                label="Convertis"
                value={stats.leadsConverted}
                trend={stats.vsLastWeek.leadsConverted}
              />
              <Kpi label="Hot leads" value={stats.hotLeads} accent="ember" />
            </div>

            {stats.dormantCount > 0 && (
              <div className="p-4 rounded-xl border border-ember/40 bg-ember/8 text-sm text-ink mb-6">
                ⚠ <strong>{stats.dormantCount}</strong> dossier(s) à relancer.
              </div>
            )}

            <div className="font-mono text-[10px] uppercase tracking-eyebrow text-copper mb-3">
              Top hot leads à traiter
            </div>
            {stats.topHotLeads.length === 0 ? (
              <div className="text-sm text-muted">Aucun hot lead en attente.</div>
            ) : (
              <ul className="grid gap-2">
                {stats.topHotLeads.map((l) => (
                  <li
                    key={l.reference}
                    className="flex items-center gap-3 p-3 rounded-xl bg-cream border border-ink/8"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="text-sm text-ink font-medium truncate">{l.name}</div>
                      <div className="text-xs text-muted truncate">
                        {l.reference} · {l.commune} · {l.services.join(" · ")}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-mono text-lg text-copper tabular-nums">
                        {l.score ?? "—"}
                      </div>
                      <div className="text-[10px] uppercase tracking-eyebrow text-muted">
                        score
                      </div>
                    </div>
                    <Link
                      href={`/admin/leads/${l.reference}`}
                      className="h-9 w-9 grid place-items-center rounded-full bg-white border border-ink/10 text-graphite hover:bg-copper hover:text-cream"
                    >
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        <p className="mt-4 text-xs text-muted">
          Le digest est envoyé automatiquement à chaque chargement de cette page si
          la dernière exécution date de plus de 7 jours (mode démo). En production :
          brancher un cron job hebdomadaire.
        </p>
      </div>
    </div>
  );
}

function Kpi({
  label,
  value,
  trend,
  accent,
}: {
  label: string;
  value: number;
  trend?: number;
  accent?: "ember";
}) {
  return (
    <div className="p-4 rounded-xl bg-cream border border-ink/8">
      <div className="font-mono text-[10px] uppercase tracking-eyebrow text-muted">
        {label}
      </div>
      <div
        className={cn(
          "mt-1 font-display text-3xl tabular-nums",
          accent === "ember" ? "text-ember" : "text-ink",
        )}
      >
        {value}
      </div>
      {trend !== undefined && (
        <div
          className={cn(
            "mt-1 text-xs flex items-center gap-1",
            trend > 0 ? "text-[#22a06b]" : trend < 0 ? "text-ember" : "text-muted",
          )}
        >
          {trend > 0 ? (
            <TrendingUp className="h-3 w-3" />
          ) : trend < 0 ? (
            <TrendingDown className="h-3 w-3" />
          ) : null}
          {trend > 0 ? "+" : ""}
          {trend} vs S-1
        </div>
      )}
    </div>
  );
}
