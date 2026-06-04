"use client";

/**
 * Bloc valeur estimée pour la fiche lead.
 *
 * Affiche la valeur courante (explicit ou déduite du budget) + l'éditeur
 * inline. Bouton "Retirer" pour revenir à l'estimation automatique.
 */

import { useEffect, useState } from "react";
import { Euro, Loader2, Check, X as XIcon, Sparkles } from "lucide-react";

type ValueState = {
  value: number;
  explicit: boolean;
  suggested: number;
  budget: string;
};

function formatEur(v: number) {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(v);
}

export function LeadValueBlock({ reference }: { reference: string }) {
  const [state, setState] = useState<ValueState | null>(null);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<string>("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    const res = await fetch(`/api/admin/leads/${reference}/value`, {
      cache: "no-store",
    });
    if (res.ok) {
      const data = await res.json();
      setState(data);
      setDraft(String(data.value));
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reference]);

  const save = async (raw: string | null) => {
    setBusy(true);
    setError(null);
    try {
      let value: number | null;
      if (raw === null) {
        value = null;
      } else {
        const n = Number(raw.replace(/[^\d.]/g, ""));
        if (!Number.isFinite(n) || n < 0) {
          throw new Error("Valeur invalide");
        }
        value = Math.round(n);
      }
      const res = await fetch(`/api/admin/leads/${reference}/value`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ value }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Erreur");
      setEditing(false);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setBusy(false);
    }
  };

  if (!state) {
    return (
      <div className="rounded-2xl border border-ink/10 bg-white shadow-soft p-5">
        <Loader2 className="h-4 w-4 animate-spin text-muted" />
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-ink/10 bg-white shadow-soft p-5">
      <div className="flex items-center justify-between mb-2">
        <div className="font-mono text-[10px] uppercase tracking-eyebrow text-copper inline-flex items-center gap-1.5">
          <Euro className="h-3 w-3" />
          Valeur estimée
        </div>
        {!state.explicit && (
          <span
            className="font-mono text-[10px] text-muted inline-flex items-center gap-1"
            title={`Déduite du budget annoncé : ${state.budget}`}
          >
            <Sparkles className="h-2.5 w-2.5" />
            auto
          </span>
        )}
      </div>

      {!editing ? (
        <>
          <div className="font-display text-3xl tabular-nums text-ink">
            {formatEur(state.value)}
          </div>
          <div className="mt-2 flex items-center gap-2 text-xs">
            <button
              onClick={() => {
                setDraft(String(state.value));
                setEditing(true);
              }}
              className="text-copper hover:underline"
            >
              {state.explicit ? "Modifier" : "Fixer une valeur"}
            </button>
            {state.explicit && (
              <button
                onClick={() => save(null)}
                disabled={busy}
                className="text-graphite hover:text-ink"
              >
                {busy ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  "Retirer (revenir à auto)"
                )}
              </button>
            )}
          </div>
        </>
      ) : (
        <div className="grid gap-2">
          <div className="flex items-center gap-1.5 bg-cream border border-ink/12 rounded-xl px-3 py-2 focus-within:border-copper">
            <Euro className="h-3.5 w-3.5 text-muted" />
            <input
              type="text"
              inputMode="numeric"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              autoFocus
              className="flex-1 bg-transparent text-base font-mono tabular-nums focus:outline-none"
            />
          </div>
          {error && <div className="text-xs text-ember">{error}</div>}
          <div className="flex items-center gap-2">
            <button
              onClick={() => save(draft)}
              disabled={busy}
              className="inline-flex items-center gap-1.5 rounded-full bg-ink text-cream px-3 py-1.5 text-xs hover:bg-copper disabled:opacity-50"
            >
              {busy ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <Check className="h-3 w-3" />
              )}
              Enregistrer
            </button>
            <button
              onClick={() => {
                setEditing(false);
                setError(null);
                setDraft(String(state.value));
              }}
              className="inline-flex items-center gap-1 text-xs text-graphite hover:text-ink"
            >
              <XIcon className="h-3 w-3" />
              Annuler
            </button>
            {state.suggested > 0 && (
              <button
                onClick={() => setDraft(String(state.suggested))}
                className="ml-auto text-[11px] text-copper hover:underline"
              >
                Suggéré : {formatEur(state.suggested)}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
