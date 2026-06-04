"use client";

/**
 * Barre de vues enregistrées pour le pipeline admin.
 *
 * Affiche les vues disponibles (privées + partagées) sous forme de chips.
 * Click → applique l'état (status/search/timeFilter/sortKey/assigneeFilter)
 * au pipeline parent.
 *
 * Bouton "Enregistrer cette vue" → prompt name + checkbox shared.
 * Survol d'une vue → bouton supprimer (uniquement owner).
 */

import { useEffect, useState, useCallback } from "react";
import {
  Bookmark,
  BookmarkPlus,
  Trash2,
  Loader2,
  Users,
  Check,
} from "lucide-react";
import { cn } from "@/lib/utils";

export type ViewState = {
  status: string;
  search: string;
  timeFilter: string;
  sortKey: string;
  assigneeFilter: string;
};

type SavedView = {
  id: string;
  name: string;
  ownerEmail?: string;
  isShared: boolean;
  state: ViewState;
  createdAt: string;
  updatedAt: string;
};

function statesEqual(a: ViewState, b: ViewState): boolean {
  return (
    a.status === b.status &&
    a.search === b.search &&
    a.timeFilter === b.timeFilter &&
    a.sortKey === b.sortKey &&
    a.assigneeFilter === b.assigneeFilter
  );
}

function isDefaultState(s: ViewState): boolean {
  return (
    s.status === "all" &&
    !s.search &&
    s.timeFilter === "all" &&
    s.sortKey === "date" &&
    s.assigneeFilter === "all"
  );
}

export function SavedViewsBar({
  currentState,
  onApply,
  currentUserEmail,
}: {
  currentState: ViewState;
  onApply: (s: ViewState) => void;
  currentUserEmail?: string;
}) {
  const [views, setViews] = useState<SavedView[] | null>(null);
  const [saving, setSaving] = useState(false);
  const [showSaveForm, setShowSaveForm] = useState(false);
  const [draftName, setDraftName] = useState("");
  const [draftShared, setDraftShared] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const res = await fetch("/api/admin/views", { cache: "no-store" });
    if (res.ok) {
      const data = await res.json();
      setViews(data.views ?? []);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const save = async () => {
    if (!draftName.trim()) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/views", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: draftName.trim(),
          isShared: draftShared,
          state: currentState,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Erreur");
      setShowSaveForm(false);
      setDraftName("");
      setDraftShared(false);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: string, name: string) => {
    if (!confirm(`Supprimer la vue « ${name} » ?`)) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/views/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        alert(data.error ?? "Erreur");
      }
      await load();
    } finally {
      setSaving(false);
    }
  };

  const isCurrentSavable = !isDefaultState(currentState);

  return (
    <div className="rounded-2xl border border-ink/10 bg-white shadow-soft p-3 mb-4">
      <div className="flex items-center gap-2 flex-wrap">
        <div className="font-mono text-[10px] uppercase tracking-eyebrow text-copper inline-flex items-center gap-1.5 px-2">
          <Bookmark className="h-3 w-3" />
          Vues
        </div>
        {views === null ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin text-muted" />
        ) : views.length === 0 ? (
          <span className="text-xs text-muted">
            Aucune vue enregistrée pour l&apos;instant.
          </span>
        ) : (
          views.map((v) => {
            const isActive = statesEqual(v.state, currentState);
            const isOwner =
              !!currentUserEmail && v.ownerEmail === currentUserEmail;
            return (
              <div key={v.id} className="group inline-flex items-center">
                <button
                  onClick={() => onApply(v.state)}
                  className={cn(
                    "inline-flex items-center gap-1.5 px-3 py-1 rounded-l-full text-xs font-medium transition-colors",
                    isActive
                      ? "bg-ink text-cream"
                      : "bg-cream border border-ink/10 text-graphite hover:border-copper/40",
                    !isOwner && "rounded-r-full",
                  )}
                >
                  {isActive && <Check className="h-3 w-3" />}
                  {v.name}
                  {v.isShared && (
                    <Users
                      className={cn(
                        "h-2.5 w-2.5",
                        isActive ? "text-cream/70" : "text-muted",
                      )}
                    />
                  )}
                </button>
                {isOwner && (
                  <button
                    onClick={() => remove(v.id, v.name)}
                    disabled={saving}
                    className={cn(
                      "h-[26px] px-1.5 rounded-r-full text-xs transition-colors",
                      isActive
                        ? "bg-ink text-cream/70 hover:bg-ember"
                        : "bg-cream border border-l-0 border-ink/10 text-muted hover:text-ember hover:border-ember/40",
                    )}
                    title="Supprimer cette vue"
                    aria-label={`Supprimer ${v.name}`}
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                )}
              </div>
            );
          })
        )}
        <div className="ml-auto">
          {!showSaveForm ? (
            <button
              onClick={() => setShowSaveForm(true)}
              disabled={!isCurrentSavable}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs bg-copper/10 text-copper border border-copper/30 hover:bg-copper hover:text-cream transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              title={
                isCurrentSavable
                  ? "Enregistrer les filtres actuels comme nouvelle vue"
                  : "Filtres par défaut — appliquez des filtres avant d'enregistrer"
              }
            >
              <BookmarkPlus className="h-3 w-3" />
              Enregistrer
            </button>
          ) : (
            <div className="flex items-center gap-2 bg-cream border border-copper/30 rounded-full pl-3 pr-1 py-0.5">
              <input
                value={draftName}
                onChange={(e) => setDraftName(e.target.value)}
                placeholder="Nom de la vue…"
                className="bg-transparent text-xs focus:outline-none w-44"
                autoFocus
              />
              <label className="inline-flex items-center gap-1 text-[10px] text-graphite cursor-pointer">
                <input
                  type="checkbox"
                  checked={draftShared}
                  onChange={(e) => setDraftShared(e.target.checked)}
                  className="h-3 w-3"
                />
                partagée
              </label>
              <button
                onClick={save}
                disabled={saving || !draftName.trim()}
                className="h-6 px-2 rounded-full bg-ink text-cream text-[10px] font-medium hover:bg-copper disabled:opacity-50"
              >
                {saving ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  "OK"
                )}
              </button>
              <button
                onClick={() => {
                  setShowSaveForm(false);
                  setError(null);
                }}
                className="text-[10px] text-graphite hover:text-ink px-1"
              >
                ×
              </button>
            </div>
          )}
        </div>
      </div>
      {error && (
        <div className="mt-2 text-xs text-ember">{error}</div>
      )}
    </div>
  );
}
