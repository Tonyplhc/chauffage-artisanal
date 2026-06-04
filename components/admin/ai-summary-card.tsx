"use client";

/**
 * Carte "✨ Résumé IA" affichée en haut de la fiche lead.
 *
 * Lazy : le bouton est visible mais l'appel IA ne se déclenche QUE si l'admin
 * clique. Pas de pré-fetch automatique pour économiser les tokens Groq.
 *
 * Pattern Linear : la carte garde le résumé en mémoire pendant la session,
 * bouton "Régénérer" si on veut refresh.
 */

import { useState } from "react";
import { Sparkles, Loader2, RefreshCw, AlertCircle } from "lucide-react";

export function AISummaryCard({ reference }: { reference: string }) {
  const [summary, setSummary] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generate = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/ai/summarize-lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reference }),
      });
      const data = (await res.json()) as {
        summary?: string;
        error?: string;
      };
      if (!res.ok || !data.summary) {
        throw new Error(data.error ?? `HTTP ${res.status}`);
      }
      setSummary(data.summary);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur IA inconnue");
    } finally {
      setLoading(false);
    }
  };

  if (!summary && !loading && !error) {
    return (
      <button
        onClick={generate}
        className="
          group w-full inline-flex items-center gap-2.5 px-4 py-3
          rounded-2xl border border-dashed border-copper/40 bg-copper/5
          text-copper hover:bg-copper/10 hover:border-copper transition-colors
        "
      >
        <span className="grid place-items-center h-7 w-7 rounded-full bg-copper/15">
          <Sparkles className="h-3.5 w-3.5" />
        </span>
        <span className="font-medium text-sm">
          Résumer cette fiche avec l&apos;IA
        </span>
        <span className="ml-auto text-[10px] font-mono uppercase tracking-eyebrow text-copper/70 group-hover:text-copper">
          1 clic · TL;DR + action recommandée
        </span>
      </button>
    );
  }

  return (
    <div className="rounded-2xl border border-copper/30 bg-cream/30 p-4">
      <div className="flex items-center gap-2 mb-2">
        <div className="grid place-items-center h-6 w-6 rounded-full bg-copper/10">
          <Sparkles className="h-3.5 w-3.5 text-copper" />
        </div>
        <div className="font-mono text-[10px] uppercase tracking-eyebrow text-copper">
          Résumé IA
        </div>
        <div className="ml-auto inline-flex items-center gap-2">
          {summary && (
            <button
              onClick={generate}
              disabled={loading}
              className="inline-flex items-center gap-1 text-[10px] font-mono uppercase tracking-eyebrow text-graphite hover:text-copper transition-colors"
            >
              <RefreshCw className={`h-3 w-3 ${loading ? "animate-spin" : ""}`} />
              Régénérer
            </button>
          )}
        </div>
      </div>

      {loading && (
        <div className="flex items-center gap-2 text-sm text-graphite py-2">
          <Loader2 className="h-3.5 w-3.5 animate-spin text-copper" />
          L&apos;IA lit la fiche et résume…
        </div>
      )}

      {error && (
        <div className="flex items-start gap-2 px-3 py-2 rounded-lg bg-ember/8 border border-ember/30 text-xs text-ink">
          <AlertCircle className="h-3.5 w-3.5 text-ember shrink-0 mt-0.5" />
          <div>
            <div className="font-medium">Échec du résumé</div>
            <div className="mt-0.5 text-muted">{error}</div>
          </div>
        </div>
      )}

      {summary && (
        <p className="text-sm text-ink leading-relaxed whitespace-pre-wrap">
          {summary}
        </p>
      )}
    </div>
  );
}
