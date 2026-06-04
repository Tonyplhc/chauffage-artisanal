"use client";

/**
 * Bouton "✨ Rédiger avec l'IA" — à brancher sur n'importe quel <textarea>.
 *
 * Usage :
 *   <textarea value={text} onChange={...} ref={taRef} />
 *   <AIDraftButton
 *     kind="email"
 *     context="(résumé de la fiche)"
 *     onResult={setText}
 *   />
 *
 * Ouvre un mini-prompt inline, envoie au /api/admin/ai/draft, remplit le champ
 * avec la réponse. Style discret : un petit lien copper qui se transforme en
 * popover quand cliqué.
 */

import { useState, useRef, useEffect } from "react";
import { Sparkles, Loader2, X, AlertCircle, RefreshCw } from "lucide-react";

type DraftKind = "email" | "comment" | "note" | "quote_item";

type Props = {
  kind: DraftKind;
  /** Contexte texte à donner à l'IA (résumé fiche / sujet email / etc.) */
  context?: string;
  /** Appelé avec le texte généré pour qu'on remplisse le formulaire */
  onResult: (text: string) => void;
  /** Texte d'amorce du brief (placeholder de la mini-textarea) */
  placeholder?: string;
  /** Petit ou normal */
  size?: "sm" | "md";
};

const LABELS: Record<DraftKind, { cta: string; placeholder: string }> = {
  email: {
    cta: "Rédiger avec l'IA",
    placeholder: "Ex : relance polie devis envoyé il y a 7 jours sans retour",
  },
  comment: {
    cta: "Suggérer un commentaire",
    placeholder: "Ex : client semble hésitant, contacter dans 2 jours",
  },
  note: {
    cta: "Suggérer une note",
    placeholder: "Ex : besoin de remonter une mesure sur place avant chiffrage",
  },
  quote_item: {
    cta: "Description IA",
    placeholder: "Ex : pose chaudière condensation gaz 24kW avec ballon 200L",
  },
};

export function AIDraftButton({
  kind,
  context,
  onResult,
  placeholder,
  size = "md",
}: Props) {
  const [open, setOpen] = useState(false);
  const [brief, setBrief] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 50);
  }, [open]);

  const submit = async () => {
    if (!brief.trim() || loading) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/ai/draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind, brief: brief.trim(), context }),
      });
      const data = (await res.json()) as { text?: string; error?: string; hint?: string };
      if (!res.ok || !data.text) {
        throw new Error(data.error ?? `HTTP ${res.status}`);
      }
      onResult(data.text);
      setOpen(false);
      setBrief("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur IA inconnue");
    } finally {
      setLoading(false);
    }
  };

  const labels = LABELS[kind];

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`
          inline-flex items-center gap-1.5 text-copper hover:text-ember transition-colors
          ${size === "sm" ? "text-[10px] font-mono uppercase tracking-eyebrow" : "text-xs font-medium"}
        `}
        title="Demander à l'IA de rédiger ce champ"
      >
        <Sparkles className={size === "sm" ? "h-3 w-3" : "h-3.5 w-3.5"} />
        {labels.cta}
      </button>
    );
  }

  return (
    <div className="mt-2 p-3 rounded-xl border border-copper/30 bg-cream/40">
      <div className="flex items-center justify-between mb-2">
        <div className="inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-eyebrow text-copper">
          <Sparkles className="h-3 w-3" />
          {labels.cta}
        </div>
        <button
          type="button"
          onClick={() => {
            setOpen(false);
            setBrief("");
            setError(null);
          }}
          className="text-graphite hover:text-ink"
          aria-label="Annuler"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
      <textarea
        ref={inputRef}
        value={brief}
        onChange={(e) => setBrief(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
            e.preventDefault();
            submit();
          }
          if (e.key === "Escape") {
            setOpen(false);
            setBrief("");
          }
        }}
        disabled={loading}
        rows={2}
        placeholder={placeholder ?? labels.placeholder}
        className="w-full bg-white border border-ink/10 rounded-lg px-3 py-2 text-sm text-ink placeholder:text-muted focus:border-copper focus:outline-none focus:ring-2 focus:ring-copper/20 transition-all disabled:opacity-50 resize-none"
      />
      {error && (
        <div className="mt-2 flex items-start gap-1.5 text-[11px] text-ember">
          <AlertCircle className="h-3 w-3 shrink-0 mt-0.5" />
          {error}
        </div>
      )}
      <div className="mt-2 flex items-center justify-between gap-2">
        <span className="text-[10px] text-muted">
          ⌘/Ctrl + Entrée pour envoyer
        </span>
        <button
          type="button"
          onClick={submit}
          disabled={loading || !brief.trim()}
          className="inline-flex items-center gap-1.5 bg-ink text-cream px-3 py-1.5 rounded-full text-xs font-medium hover:bg-copper disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? (
            <>
              <Loader2 className="h-3 w-3 animate-spin" />
              Rédaction…
            </>
          ) : (
            <>
              <RefreshCw className="h-3 w-3" />
              Générer
            </>
          )}
        </button>
      </div>
    </div>
  );
}
