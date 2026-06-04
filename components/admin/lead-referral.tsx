"use client";

/**
 * Bloc parrainage pour la fiche lead.
 *
 * Visible uniquement si le lead est "converti". Affiche le lien personnel,
 * permet de le copier en 1 clic, et montre le compteur de clicks/filleuls.
 */

import { useEffect, useState, useCallback } from "react";
import {
  Heart,
  Copy,
  Check,
  Loader2,
  Eye,
  Users,
  Trophy,
} from "lucide-react";

type Data = {
  url: string;
  token: string;
  stats?: { clickCount: number; lastClickAt?: string };
  brought: number;
  converted: number;
};

export function LeadReferralBlock({
  reference,
  isConverted,
}: {
  reference: string;
  isConverted: boolean;
}) {
  const [data, setData] = useState<Data | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!isConverted) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/admin/leads/${reference}/referral-link`,
        { cache: "no-store" },
      );
      const d = await res.json();
      if (!res.ok) {
        setError(d.error ?? "Erreur");
        return;
      }
      setData(d);
    } finally {
      setLoading(false);
    }
  }, [reference, isConverted]);

  useEffect(() => {
    load();
  }, [load]);

  if (!isConverted) return null;

  const copy = async () => {
    if (!data) return;
    try {
      await navigator.clipboard.writeText(data.url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {}
  };

  return (
    <div className="rounded-2xl border border-copper/30 bg-copper/5 p-5">
      <div className="flex items-center gap-2 mb-3">
        <Heart className="h-4 w-4 text-copper" />
        <span className="font-mono text-[10px] uppercase tracking-eyebrow text-copper">
          Programme de parrainage
        </span>
        {loading && <Loader2 className="ml-auto h-3 w-3 animate-spin text-copper" />}
      </div>

      {error && (
        <div className="text-xs text-ember mb-2">{error}</div>
      )}

      {data && (
        <>
          <p className="text-xs text-graphite mb-3">
            Lien personnel à partager. Toute soumission devis arrivant via ce
            lien sera attribuée à ce parrain.
          </p>
          <div className="flex items-stretch gap-2 mb-3">
            <input
              readOnly
              value={data.url}
              className="flex-1 bg-white border border-ink/12 rounded-xl px-3 py-2 text-xs font-mono focus:border-copper focus:outline-none"
              onClick={(e) => e.currentTarget.select()}
            />
            <button
              onClick={copy}
              className="inline-flex items-center gap-1.5 rounded-xl bg-ink text-cream px-3 py-2 text-xs hover:bg-copper transition-colors"
            >
              {copied ? (
                <Check className="h-3 w-3" />
              ) : (
                <Copy className="h-3 w-3" />
              )}
              {copied ? "Copié" : "Copier"}
            </button>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <Stat
              icon={<Eye className="h-3 w-3" />}
              label="Clicks"
              value={data.stats?.clickCount ?? 0}
            />
            <Stat
              icon={<Users className="h-3 w-3" />}
              label="Leads amenés"
              value={data.brought}
              accent="copper"
            />
            <Stat
              icon={<Trophy className="h-3 w-3" />}
              label="Convertis"
              value={data.converted}
              accent="success"
            />
          </div>
        </>
      )}
    </div>
  );
}

function Stat({
  icon,
  label,
  value,
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  accent?: "copper" | "success";
}) {
  const color =
    accent === "copper" ? "#b86a36" : accent === "success" ? "#22a06b" : "#1e1a15";
  return (
    <div
      className="rounded-xl bg-white border border-ink/8 p-2 text-center"
      style={{ color }}
    >
      <div className="font-mono text-xl tabular-nums">{value}</div>
      <div className="font-mono text-[9px] uppercase tracking-eyebrow text-muted inline-flex items-center gap-0.5 mt-0.5">
        {icon}
        {label}
      </div>
    </div>
  );
}
