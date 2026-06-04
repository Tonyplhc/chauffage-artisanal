"use client";

/**
 * Bloc d'administration "Données de démo".
 *
 * Affiche le nombre de leads démo actuellement en base, permet d'en générer
 * (idempotent par défaut, option force pour régénérer), et de tout supprimer.
 *
 * Pensé pour deux usages :
 *   1. Démo client : remplir la base avant un rendez-vous pour que les
 *      dashboards aient l'air vivants.
 *   2. Dev : avoir des données réalistes pour itérer sur les vues.
 *
 * Les leads démo ont une référence préfixée `DEV-SEED-` — facile à filtrer
 * ou supprimer en bloc sans toucher aux vrais leads.
 */

import { useEffect, useState, useCallback } from "react";
import {
  Sparkles,
  Loader2,
  Database,
  Trash2,
  RefreshCw,
  Info,
  CheckCircle2,
} from "lucide-react";

type State = {
  count: number;
  busy: "seed" | "force" | "remove" | null;
  message: string | null;
  error: string | null;
};

const INITIAL: State = {
  count: 0,
  busy: null,
  message: null,
  error: null,
};

export function DemoSeedCard() {
  const [s, setS] = useState<State>(INITIAL);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/demo-seed", { cache: "no-store" });
      if (res.ok) {
        const d = await res.json();
        setS((prev) => ({ ...prev, count: d.count ?? 0 }));
      }
    } catch {
      /* silencieux */
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const seed = async (force: boolean) => {
    setS((prev) => ({
      ...prev,
      busy: force ? "force" : "seed",
      error: null,
      message: null,
    }));
    try {
      const res = await fetch("/api/admin/demo-seed", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ force }),
      });
      const d = await res.json();
      if (!res.ok) {
        setS((prev) => ({
          ...prev,
          busy: null,
          error: d?.result?.reason ?? "Erreur",
        }));
        return;
      }
      const r = d.result;
      if (!r.ok) {
        setS((prev) => ({
          ...prev,
          busy: null,
          message: r.reason ?? "Aucune action.",
        }));
        return;
      }
      setS((prev) => ({
        ...prev,
        busy: null,
        count: r.totalAfter,
        message: `${r.inserted} leads démo générés. Total : ${r.totalAfter}.`,
      }));
      await load();
    } catch (e) {
      setS((prev) => ({
        ...prev,
        busy: null,
        error: e instanceof Error ? e.message : "Erreur réseau",
      }));
    }
  };

  const remove = async () => {
    if (
      !confirm(
        "Supprimer tous les leads démo (référence DEV-SEED-…) ? Les vrais leads sont conservés.",
      )
    ) {
      return;
    }
    setS((prev) => ({ ...prev, busy: "remove", error: null, message: null }));
    try {
      const res = await fetch("/api/admin/demo-seed", { method: "DELETE" });
      const d = await res.json();
      if (!res.ok) {
        setS((prev) => ({ ...prev, busy: null, error: "Échec suppression" }));
        return;
      }
      setS((prev) => ({
        ...prev,
        busy: null,
        message: `${d.result.removed} leads démo supprimés.`,
      }));
      await load();
    } catch (e) {
      setS((prev) => ({
        ...prev,
        busy: null,
        error: e instanceof Error ? e.message : "Erreur réseau",
      }));
    }
  };

  const hasSeeds = s.count > 0;

  return (
    <div className="rounded-2xl border border-ink/10 bg-white shadow-soft p-5 lg:p-6">
      <div className="flex items-start gap-4">
        <span className="h-10 w-10 rounded-full grid place-items-center border bg-copper/10 border-copper/30 text-copper shrink-0">
          <Database className="h-4 w-4" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-mono text-[10px] uppercase tracking-eyebrow text-muted">
              Démo & présentation
            </span>
            {hasSeeds && (
              <span className="font-mono text-[10px] uppercase tracking-eyebrow text-copper bg-copper/10 border border-copper/40 px-2 py-0.5 rounded-full">
                {s.count} leads démo
              </span>
            )}
          </div>
          <div className="mt-1 font-display text-xl text-ink">
            Données de démonstration
          </div>
          <p className="mt-1.5 text-sm text-graphite leading-relaxed">
            Générez 80 leads réalistes étalés sur 24 mois pour activer le
            forecast saisonnier, la heatmap géographique, le pricing
            intelligence et tous les dashboards. Les leads démo portent une
            référence préfixée <span className="font-mono text-[11px] bg-cream px-1 py-0.5 rounded">DEV-SEED-</span> —
            ils peuvent être supprimés à tout moment sans toucher aux vrais
            leads.
          </p>

          {s.message && (
            <div className="mt-3 inline-flex items-start gap-2 text-xs text-[#22a06b] bg-[#22a06b]/5 border border-[#22a06b]/20 rounded-lg px-3 py-2">
              <CheckCircle2 className="h-3.5 w-3.5 mt-0.5" />
              {s.message}
            </div>
          )}
          {s.error && (
            <div className="mt-3 inline-flex items-start gap-2 text-xs text-ember bg-ember/5 border border-ember/20 rounded-lg px-3 py-2">
              <Info className="h-3.5 w-3.5 mt-0.5" />
              {s.error}
            </div>
          )}

          <div className="mt-4 flex items-center gap-2 flex-wrap">
            {!hasSeeds && (
              <button
                onClick={() => seed(false)}
                disabled={s.busy !== null}
                className="inline-flex items-center gap-2 rounded-full bg-ink text-cream px-4 py-2 text-sm font-medium hover:bg-copper transition-colors disabled:opacity-50"
              >
                {s.busy === "seed" ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Sparkles className="h-3.5 w-3.5" />
                )}
                Générer 80 leads démo
              </button>
            )}
            {hasSeeds && (
              <>
                <button
                  onClick={() => seed(true)}
                  disabled={s.busy !== null}
                  className="inline-flex items-center gap-2 rounded-full bg-cream border border-ink/15 text-graphite px-4 py-2 text-sm hover:border-copper/40 transition-colors disabled:opacity-50"
                >
                  {s.busy === "force" ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <RefreshCw className="h-3.5 w-3.5" />
                  )}
                  Régénérer
                </button>
                <button
                  onClick={remove}
                  disabled={s.busy !== null}
                  className="inline-flex items-center gap-2 rounded-full bg-cream border border-ember/30 text-ember px-4 py-2 text-sm hover:bg-ember/5 transition-colors disabled:opacity-50"
                >
                  {s.busy === "remove" ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Trash2 className="h-3.5 w-3.5" />
                  )}
                  Supprimer les leads démo
                </button>
              </>
            )}
          </div>

          <p className="mt-3 text-[11px] text-muted">
            Astuce CLI :{" "}
            <span className="font-mono">npm run seed:demo</span> (idem){" "}
            <span className="font-mono">npm run seed:demo:force</span> /{" "}
            <span className="font-mono">npm run seed:demo:remove</span>.
          </p>
        </div>
      </div>
    </div>
  );
}
