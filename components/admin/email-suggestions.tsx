"use client";

/**
 * Bloc "Suggestions de réponses" sur la fiche lead.
 *
 * Génère 3-6 brouillons contextualisés (statut, sentiment, ancienneté) via
 * `/api/admin/leads/{ref}/suggestions`. L'admin peut copier le sujet ou le
 * corps pour le coller dans son client email / le quote builder / un email
 * template éditable.
 *
 * Important : ce ne sont QUE des brouillons. Le call-to-action est
 * volontairement "Copier" — pas "Envoyer" — pour conserver le contrôle
 * éditorial. Pas d'envoi automatique sans relecture humaine.
 */

import { useEffect, useState, useCallback } from "react";
import {
  Sparkles,
  Loader2,
  Copy,
  CheckCircle2,
  Mail,
  AlertTriangle,
  RefreshCw,
} from "lucide-react";
import { cn } from "@/lib/utils";

type Tone = "neutre" | "chaleureux" | "ferme" | "rassurant";

type Suggestion = {
  id: string;
  title: string;
  subject: string;
  body: string;
  tone: Tone;
  relevance: number;
  why: string;
};

type Response = {
  suggestions: Suggestion[];
  context: {
    lastClientMessageAt: string | null;
    hasClientMessage: boolean;
  };
};

const TONE_LABEL: Record<Tone, string> = {
  neutre: "Neutre",
  chaleureux: "Chaleureux",
  ferme: "Ferme",
  rassurant: "Rassurant",
};

const TONE_COLOR: Record<Tone, string> = {
  neutre: "#8b847a",
  chaleureux: "#22a06b",
  ferme: "#94532a",
  rassurant: "#6ba3c5",
};

export function EmailSuggestions({ reference }: { reference: string }) {
  const [data, setData] = useState<Response | null>(null);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/leads/${reference}/suggestions`, {
        cache: "no-store",
      });
      if (!res.ok) {
        throw new Error(
          res.status === 401
            ? "Session expirée"
            : "Impossible de charger les suggestions",
        );
      }
      setData(await res.json());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur inconnue");
    } finally {
      setLoading(false);
    }
  }, [reference]);

  useEffect(() => {
    load();
  }, [load]);

  const copy = async (id: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(id);
      setTimeout(() => setCopied(null), 1800);
    } catch {
      // fallback : selectionner / prompt
      window.prompt("Copier manuellement :", text);
    }
  };

  return (
    <div className="rounded-2xl border border-ink/10 bg-white shadow-soft overflow-hidden">
      <div className="px-5 py-3 border-b border-ink/8 bg-cream/40 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-copper" />
          <span className="font-mono text-[10px] uppercase tracking-eyebrow text-copper">
            Suggestions de réponses
          </span>
        </div>
        <button
          onClick={load}
          disabled={loading}
          className="text-[10px] font-mono uppercase tracking-eyebrow text-graphite hover:text-copper inline-flex items-center gap-1 transition-colors"
        >
          <RefreshCw className={cn("h-3 w-3", loading && "animate-spin")} />
          Rafraîchir
        </button>
      </div>

      {error ? (
        <div className="px-5 py-6 text-center text-sm text-ember inline-flex items-center justify-center gap-2 w-full">
          <AlertTriangle className="h-4 w-4" />
          {error}
        </div>
      ) : data === null ? (
        <div className="py-10 text-center text-muted">
          <Loader2 className="h-5 w-5 animate-spin mx-auto" />
        </div>
      ) : data.suggestions.length === 0 ? (
        <div className="py-10 text-center text-muted text-sm">
          Aucune suggestion pour ce contexte. Le statut ou l&apos;ancienneté
          du lead ne déclenche aucune règle pour le moment.
        </div>
      ) : (
        <ul className="divide-y divide-ink/8">
          {data.suggestions.map((s) => {
            const open = expanded === s.id;
            return (
              <li key={s.id}>
                <button
                  onClick={() => setExpanded(open ? null : s.id)}
                  className="w-full text-left px-5 py-3 hover:bg-cream/40 transition-colors"
                >
                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className="inline-block h-2 w-2 rounded-full"
                          style={{ background: TONE_COLOR[s.tone] }}
                        />
                        <span className="font-medium text-ink text-sm">
                          {s.title}
                        </span>
                        <span
                          className="font-mono text-[10px] uppercase tracking-eyebrow"
                          style={{ color: TONE_COLOR[s.tone] }}
                        >
                          {TONE_LABEL[s.tone]}
                        </span>
                      </div>
                      <p className="mt-0.5 text-[11px] text-muted">{s.why}</p>
                    </div>
                    <div className="font-mono text-[10px] uppercase tracking-eyebrow text-graphite tabular-nums">
                      {s.relevance}%
                    </div>
                  </div>
                </button>
                {open && (
                  <div className="px-5 pb-4 -mt-1 space-y-3">
                    <div className="rounded-xl border border-ink/8 bg-cream/40 p-3">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <div>
                          <div className="font-mono text-[10px] uppercase tracking-eyebrow text-copper">
                            Sujet
                          </div>
                          <div className="text-sm text-ink mt-0.5">
                            {s.subject}
                          </div>
                        </div>
                        <button
                          onClick={() => copy(`${s.id}-subject`, s.subject)}
                          className="inline-flex items-center gap-1 text-[10px] font-mono uppercase tracking-eyebrow text-graphite hover:text-copper"
                        >
                          {copied === `${s.id}-subject` ? (
                            <>
                              <CheckCircle2 className="h-3 w-3 text-[#22a06b]" />
                              Copié
                            </>
                          ) : (
                            <>
                              <Copy className="h-3 w-3" />
                              Copier
                            </>
                          )}
                        </button>
                      </div>
                    </div>

                    <div className="rounded-xl border border-ink/8 bg-cream/40 p-3">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <div className="font-mono text-[10px] uppercase tracking-eyebrow text-copper">
                          Corps
                        </div>
                        <button
                          onClick={() => copy(`${s.id}-body`, s.body)}
                          className="inline-flex items-center gap-1 text-[10px] font-mono uppercase tracking-eyebrow text-graphite hover:text-copper"
                        >
                          {copied === `${s.id}-body` ? (
                            <>
                              <CheckCircle2 className="h-3 w-3 text-[#22a06b]" />
                              Copié
                            </>
                          ) : (
                            <>
                              <Copy className="h-3 w-3" />
                              Copier
                            </>
                          )}
                        </button>
                      </div>
                      <pre className="text-xs text-graphite whitespace-pre-wrap font-sans leading-relaxed">
                        {s.body}
                      </pre>
                    </div>

                    <div className="text-[10px] text-muted inline-flex items-center gap-1">
                      <Mail className="h-3 w-3" />
                      Brouillon à coller dans votre client mail — relisez avant
                      envoi.
                    </div>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}

      <div className="px-5 py-2.5 border-t border-ink/8 bg-cream/20 text-[10px] text-muted">
        Moteur déterministe local (pas de LLM, pas d&apos;appel externe).
        Templates écrits à la main, variables interpolées côté serveur.
      </div>
    </div>
  );
}
