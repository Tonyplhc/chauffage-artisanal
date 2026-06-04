"use client";

/**
 * Dashboard sentiment — vue agrégée des sentiments détectés sur NPS, chat,
 * commentaires lead. Top 30 messages négatifs flaggés pour traitement.
 */

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Loader2,
  Smile,
  Frown,
  Meh,
  MessageSquare,
  Star,
  AlertTriangle,
} from "lucide-react";

type Snapshot = {
  positive: number;
  neutral: number;
  negative: number;
  total: number;
  averageScore: number;
};

type Flagged = {
  source: "nps" | "chat" | "comment";
  text: string;
  reference?: string;
  at: string;
  score: number;
};

const SOURCE_LABELS = {
  nps: "NPS",
  chat: "Chat",
  comment: "Commentaire",
};

export default function SentimentPage() {
  const router = useRouter();
  const [data, setData] = useState<{
    snapshots: { nps: Snapshot; chat: Snapshot; comments: Snapshot };
    flagged: Flagged[];
  } | null>(null);

  const load = useCallback(async () => {
    const res = await fetch("/api/admin/sentiment", { cache: "no-store" });
    if (res.status === 401) {
      router.replace("/admin/login");
      return;
    }
    if (res.ok) {
      const d = await res.json();
      setData(d);
    }
  }, [router]);

  useEffect(() => {
    load();
    const i = setInterval(load, 60_000);
    return () => clearInterval(i);
  }, [load]);

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
            Sentiment analyse
          </h1>
          <p className="mt-2 text-graphite">
            Détection rules-based sur NPS, conversations chat et commentaires
            internes. Signal indicatif — utile pour repérer les dossiers
            tendus.
          </p>
        </div>

        {!data ? (
          <div className="py-16 text-center text-muted">
            <Loader2 className="h-6 w-6 animate-spin mx-auto" />
          </div>
        ) : (
          <>
            <div className="grid lg:grid-cols-3 gap-4 mb-8">
              <SentimentCard
                label="NPS"
                icon={<Star className="h-4 w-4" />}
                snap={data.snapshots.nps}
              />
              <SentimentCard
                label="Chat live"
                icon={<MessageSquare className="h-4 w-4" />}
                snap={data.snapshots.chat}
              />
              <SentimentCard
                label="Commentaires"
                icon={<MessageSquare className="h-4 w-4" />}
                snap={data.snapshots.comments}
              />
            </div>

            <div className="rounded-2xl border border-ink/10 bg-white shadow-soft overflow-hidden">
              <div className="px-5 py-3 border-b border-ink/8 bg-cream/40 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-ember" />
                <span className="font-mono text-[10px] uppercase tracking-eyebrow text-ember">
                  Messages flaggés négatifs ({data.flagged.length})
                </span>
              </div>
              {data.flagged.length === 0 ? (
                <div className="py-12 text-center text-muted">
                  <Smile className="h-12 w-12 mx-auto opacity-30 text-[#22a06b] mb-2" />
                  <p>Aucun message négatif détecté.</p>
                </div>
              ) : (
                <ul className="divide-y divide-ink/8">
                  {data.flagged.map((f, i) => (
                    <li key={i} className="px-5 py-3">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-mono uppercase tracking-eyebrow text-ember bg-ember/10 px-2 py-0.5 rounded-full">
                          {SOURCE_LABELS[f.source]}
                        </span>
                        {f.reference && (
                          <Link
                            href={
                              f.source === "chat"
                                ? "/admin/chat"
                                : `/admin/leads/${f.reference}`
                            }
                            className="text-xs text-copper hover:underline font-mono"
                          >
                            {f.reference}
                          </Link>
                        )}
                        <span className="ml-auto font-mono text-[10px] text-graphite tabular-nums">
                          score {f.score.toFixed(2)}
                        </span>
                      </div>
                      <p className="text-sm text-graphite italic">
                        « {f.text} »
                      </p>
                      <div className="text-[10px] font-mono text-muted mt-1">
                        {new Date(f.at).toLocaleString("fr-FR")}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <p className="mt-4 text-xs text-muted">
              Analyse basée sur un dictionnaire FR de mots polarisés
              (intensifieurs + négateurs). Pas de ML — c&apos;est un signal,
              pas un verdict. Pour brancher un modèle plus avancé, exposer la
              fonction <code>analyzeSentiment()</code> côté serveur.
            </p>
          </>
        )}
      </div>
    </div>
  );
}

function SentimentCard({
  label,
  icon,
  snap,
}: {
  label: string;
  icon: React.ReactNode;
  snap: Snapshot;
}) {
  const pct = (n: number) => (snap.total === 0 ? 0 : (n / snap.total) * 100);
  return (
    <div className="rounded-2xl border border-ink/10 bg-white shadow-soft p-5">
      <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-eyebrow text-muted mb-2">
        {icon}
        {label}
      </div>
      <div className="font-display text-3xl tabular-nums text-ink">
        {snap.total}
      </div>
      <div className="text-xs text-muted mb-3">messages analysés</div>
      {snap.total > 0 && (
        <>
          <div className="h-2 rounded-full bg-cream overflow-hidden mb-2 flex">
            <div
              className="bg-[#22a06b]"
              style={{ width: `${pct(snap.positive)}%` }}
            />
            <div
              className="bg-muted"
              style={{ width: `${pct(snap.neutral)}%` }}
            />
            <div
              className="bg-ember"
              style={{ width: `${pct(snap.negative)}%` }}
            />
          </div>
          <div className="grid grid-cols-3 gap-1 text-[10px] font-mono tabular-nums">
            <div className="text-[#22a06b] inline-flex items-center gap-1">
              <Smile className="h-2.5 w-2.5" />
              {snap.positive}
            </div>
            <div className="text-graphite text-center inline-flex items-center justify-center gap-1">
              <Meh className="h-2.5 w-2.5" />
              {snap.neutral}
            </div>
            <div className="text-ember text-right inline-flex items-center justify-end gap-1">
              <Frown className="h-2.5 w-2.5" />
              {snap.negative}
            </div>
          </div>
          <div className="mt-2 text-[10px] text-muted text-center">
            Score moyen :{" "}
            <span className="font-mono">{snap.averageScore.toFixed(2)}</span>
          </div>
        </>
      )}
    </div>
  );
}
