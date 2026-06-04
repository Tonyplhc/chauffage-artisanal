"use client";

/**
 * Bloc de recommandations d'items pour le devis builder.
 *
 * Affiche les suggestions issues de l'historique des leads convertis
 * similaires. Click "Ajouter" insère la ligne dans le devis courant via
 * une callback.
 */

import { useEffect, useState, useCallback } from "react";
import {
  Sparkles,
  Loader2,
  Plus,
  TrendingUp,
} from "lucide-react";

type Recommendation = {
  description: string;
  unit: string;
  meanQuantity: number;
  meanUnitPrice: number;
  frequency: number;
  score: number;
};

function formatEur(v: number) {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(v);
}

export function QuoteRecommendations({
  reference,
  onApply,
}: {
  reference: string;
  onApply: (line: {
    description: string;
    quantity: number;
    unitPrice: number;
    unit: string;
  }) => void;
}) {
  const [recs, setRecs] = useState<Recommendation[] | null>(null);

  const load = useCallback(async () => {
    const res = await fetch(
      `/api/admin/leads/${reference}/quote-recommendations`,
      { cache: "no-store" },
    );
    if (res.ok) {
      const d = await res.json();
      setRecs(d.recommendations ?? []);
    } else {
      setRecs([]);
    }
  }, [reference]);

  useEffect(() => {
    load();
  }, [load]);

  if (recs === null) {
    return (
      <div className="rounded-2xl border border-ink/10 bg-white shadow-soft p-4">
        <Loader2 className="h-4 w-4 animate-spin text-muted" />
      </div>
    );
  }

  if (recs.length === 0) return null;

  return (
    <div className="rounded-2xl border border-copper/30 bg-copper/5 overflow-hidden mb-6">
      <div className="px-5 py-3 border-b border-copper/20 flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-copper" />
        <span className="font-mono text-[10px] uppercase tracking-eyebrow text-copper">
          Recommandations basées sur l&apos;historique
        </span>
        <span className="ml-auto font-mono text-[10px] text-graphite">
          {recs.length} items
        </span>
      </div>
      <ul className="divide-y divide-copper/10">
        {recs.map((r) => (
          <li
            key={r.description}
            className="px-5 py-3 grid lg:grid-cols-12 gap-3 items-center"
          >
            <div className="lg:col-span-6 min-w-0">
              <div className="text-sm text-ink truncate">{r.description}</div>
              <div className="text-[11px] text-muted font-mono mt-0.5 inline-flex items-center gap-2">
                <TrendingUp className="h-2.5 w-2.5" />
                Vu {r.frequency}× dans des devis similaires
              </div>
            </div>
            <div className="lg:col-span-2 text-right text-xs text-graphite">
              <span className="font-mono">
                {r.meanQuantity} {r.unit}
              </span>
            </div>
            <div className="lg:col-span-2 text-right">
              <div className="font-mono text-sm text-ink">
                {formatEur(r.meanUnitPrice)}
              </div>
              <div className="text-[10px] text-muted">PU moyen</div>
            </div>
            <div className="lg:col-span-2 text-right">
              <button
                onClick={() =>
                  onApply({
                    description: r.description,
                    quantity: r.meanQuantity,
                    unitPrice: r.meanUnitPrice,
                    unit: r.unit,
                  })
                }
                className="inline-flex items-center gap-1 rounded-full bg-ink text-cream px-3 py-1.5 text-xs hover:bg-copper"
              >
                <Plus className="h-3 w-3" />
                Ajouter
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
