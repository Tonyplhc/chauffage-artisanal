"use client";

/**
 * Bloc tags pour la page de détail d'un lead.
 *
 * Affiche les tags actuellement assignés (lus dans lead.metadata.tags), permet
 * d'en ajouter depuis le dictionnaire global via un popover, et d'en retirer en
 * cliquant sur la croix dans la pill.
 *
 * PUT /api/admin/leads/[reference]/tags avec la liste complète des tagIds.
 */

import { useEffect, useState, useCallback } from "react";
import { Plus, Loader2, X as XIcon, Tag as TagIcon } from "lucide-react";
import Link from "next/link";
import { TagPill, type TagShape } from "./tag-pill";

export function LeadTagsBlock({
  reference,
  initialTagIds = [],
}: {
  reference: string;
  initialTagIds?: string[];
}) {
  const [dict, setDict] = useState<TagShape[]>([]);
  const [assigned, setAssigned] = useState<string[]>(initialTagIds);
  const [picking, setPicking] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  const loadDict = useCallback(async () => {
    const res = await fetch("/api/admin/tags", { cache: "no-store" });
    if (res.ok) {
      const data = await res.json();
      setDict(data.tags ?? []);
    }
  }, []);

  const loadAssigned = useCallback(async () => {
    const res = await fetch(`/api/admin/leads/${reference}/tags`, {
      cache: "no-store",
    });
    if (res.ok) {
      const data = await res.json();
      setAssigned(data.tagIds ?? []);
    }
    setLoaded(true);
  }, [reference]);

  useEffect(() => {
    loadDict();
    loadAssigned();
  }, [loadDict, loadAssigned]);

  const persist = async (next: string[]) => {
    setBusy(true);
    setError(null);
    const prev = assigned;
    setAssigned(next); // optimistic
    try {
      const res = await fetch(`/api/admin/leads/${reference}/tags`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tagIds: next }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Erreur");
      }
    } catch (e) {
      setAssigned(prev); // revert
      setError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setBusy(false);
    }
  };

  const assignedTags = assigned
    .map((id) => dict.find((t) => t.id === id))
    .filter((t): t is TagShape => !!t);

  const remainingTags = dict.filter((t) => !assigned.includes(t.id));

  return (
    <div className="rounded-2xl border border-ink/10 bg-white shadow-soft p-5">
      <div className="flex items-center justify-between mb-3">
        <div className="font-mono text-[10px] uppercase tracking-eyebrow text-copper inline-flex items-center gap-1.5">
          <TagIcon className="h-3 w-3" />
          Tags
        </div>
        {busy && <Loader2 className="h-3.5 w-3.5 animate-spin text-copper" />}
      </div>

      {loaded && assignedTags.length === 0 && !picking && (
        <div className="text-sm text-muted mb-3">
          Aucun tag assigné.{" "}
          {dict.length === 0 && (
            <Link
              href="/admin/tags"
              className="text-copper underline underline-offset-2 hover:no-underline"
            >
              Créer le premier
            </Link>
          )}
        </div>
      )}

      {assignedTags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {assignedTags.map((t) => (
            <TagPill
              key={t.id}
              tag={t}
              onRemove={() => persist(assigned.filter((id) => id !== t.id))}
            />
          ))}
        </div>
      )}

      {error && (
        <div className="mb-2 text-xs text-ember">{error}</div>
      )}

      {!picking ? (
        <button
          onClick={() => setPicking(true)}
          disabled={dict.length === 0}
          className="inline-flex items-center gap-1.5 text-xs text-graphite hover:text-copper disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Plus className="h-3.5 w-3.5" />
          {assignedTags.length === 0 ? "Ajouter un tag" : "Ajouter d'autres tags"}
        </button>
      ) : (
        <div className="border-t border-ink/8 pt-3">
          <div className="flex items-center justify-between mb-2">
            <div className="text-xs text-muted">
              Cliquez pour ajouter au lead
            </div>
            <button
              onClick={() => setPicking(false)}
              className="h-6 w-6 grid place-items-center rounded-full bg-cream border border-ink/10 text-graphite hover:bg-ink hover:text-cream"
              aria-label="Fermer"
            >
              <XIcon className="h-3 w-3" />
            </button>
          </div>
          {remainingTags.length === 0 ? (
            <div className="text-xs text-muted">
              Tous les tags du dictionnaire sont déjà assignés.{" "}
              <Link
                href="/admin/tags"
                className="text-copper underline underline-offset-2"
              >
                Créer un nouveau tag
              </Link>
            </div>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {remainingTags.map((t) => (
                <button
                  key={t.id}
                  onClick={() => persist([...assigned, t.id])}
                  className="transition-transform hover:scale-105"
                >
                  <TagPill tag={t} />
                </button>
              ))}
            </div>
          )}
          <div className="mt-3 pt-2 border-t border-ink/8">
            <Link
              href="/admin/tags"
              className="text-[11px] text-copper hover:underline"
            >
              Gérer le dictionnaire de tags →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
