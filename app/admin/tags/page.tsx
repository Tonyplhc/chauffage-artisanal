"use client";

/**
 * Gestion du dictionnaire de tags admin.
 *
 * Création (label + couleur), édition inline, suppression. La suppression ne
 * casse rien côté leads — les références orphelines sont juste ignorées par
 * le rendu.
 */

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Plus,
  Trash2,
  Loader2,
  Check,
  X as XIcon,
  Tag as TagIcon,
  Edit2,
} from "lucide-react";
import { cn } from "@/lib/utils";

type Tag = {
  id: string;
  label: string;
  color: string;
  createdAt: string;
  updatedAt: string;
};

const PRESET_COLORS = [
  "#b86a36",
  "#dc5a28",
  "#22a06b",
  "#6ba3c5",
  "#94532a",
  "#7a5cc6",
  "#c63b7a",
  "#8b847a",
  "#1e1a15",
  "#d4a017",
];

export default function TagsAdminPage() {
  const router = useRouter();
  const [tags, setTags] = useState<Tag[] | null>(null);
  const [creating, setCreating] = useState(false);
  const [draft, setDraft] = useState<{ label: string; color: string }>({
    label: "",
    color: PRESET_COLORS[0],
  });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<{ label: string; color: string }>({
    label: "",
    color: PRESET_COLORS[0],
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const res = await fetch("/api/admin/tags", { cache: "no-store" });
    if (res.status === 401) {
      router.replace("/admin/login");
      return;
    }
    if (res.ok) {
      const data = await res.json();
      setTags(data.tags ?? []);
    }
  }, [router]);

  useEffect(() => {
    load();
  }, [load]);

  const createTag = async () => {
    if (!draft.label.trim()) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/tags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(draft),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Erreur");
      setCreating(false);
      setDraft({ label: "", color: PRESET_COLORS[0] });
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setBusy(false);
    }
  };

  const saveEdit = async (id: string) => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/tags/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editDraft),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Erreur");
      setEditingId(null);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setBusy(false);
    }
  };

  const removeTag = async (id: string, label: string) => {
    if (!confirm(`Supprimer le tag « ${label} » ?`)) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/tags/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Erreur");
      }
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-cream py-10 lg:py-14">
      <div className="container max-w-3xl">
        <Link
          href="/admin/leads"
          className="inline-flex items-center gap-2 text-sm font-mono uppercase tracking-eyebrow text-graphite hover:text-copper transition-colors mb-6"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Retour pipeline
        </Link>

        <div className="flex items-start justify-between gap-4 flex-wrap mb-8">
          <div>
            <h1 className="font-display text-display-md text-ink">Tags</h1>
            <p className="mt-2 text-graphite">
              Catégorisez vos leads avec des étiquettes personnalisées
              réutilisables dans le pipeline et les automations.
            </p>
          </div>
          {!creating && (
            <button
              onClick={() => setCreating(true)}
              className="inline-flex items-center gap-2 rounded-full bg-ink text-cream px-5 py-2.5 text-sm font-medium hover:bg-copper transition-colors"
            >
              <Plus className="h-4 w-4" />
              Nouveau tag
            </button>
          )}
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl border border-ember/40 bg-ember/5 text-sm text-ember">
            {error}
          </div>
        )}

        {creating && (
          <div className="mb-6 rounded-2xl border border-copper/40 bg-white shadow-soft p-5">
            <div className="font-mono text-[10px] uppercase tracking-eyebrow text-copper mb-3">
              Nouveau tag
            </div>
            <div className="grid gap-3">
              <input
                value={draft.label}
                onChange={(e) =>
                  setDraft((d) => ({ ...d, label: e.target.value }))
                }
                placeholder="Label (ex : VIP, à rappeler, prêt résidence…)"
                className="bg-cream border border-ink/12 rounded-xl px-4 py-2.5 text-sm focus:border-copper focus:outline-none"
                autoFocus
              />
              <ColorPicker
                value={draft.color}
                onChange={(c) => setDraft((d) => ({ ...d, color: c }))}
              />
              <Preview label={draft.label || "Aperçu"} color={draft.color} />
              <div className="flex items-center gap-2">
                <button
                  onClick={createTag}
                  disabled={busy || !draft.label.trim()}
                  className="inline-flex items-center gap-2 rounded-full bg-ink text-cream px-4 py-2 text-sm font-medium hover:bg-copper disabled:opacity-50 transition-colors"
                >
                  {busy ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Check className="h-4 w-4" />
                  )}
                  Créer
                </button>
                <button
                  onClick={() => {
                    setCreating(false);
                    setDraft({ label: "", color: PRESET_COLORS[0] });
                    setError(null);
                  }}
                  className="text-sm text-graphite hover:text-ink"
                >
                  Annuler
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="rounded-2xl border border-ink/10 bg-white shadow-soft overflow-hidden">
          {tags === null ? (
            <div className="py-12 text-center text-muted">
              <Loader2 className="h-5 w-5 animate-spin mx-auto" />
            </div>
          ) : tags.length === 0 ? (
            <div className="py-16 text-center text-muted">
              <TagIcon className="h-10 w-10 mx-auto opacity-30 mb-2" />
              <p>Aucun tag pour l&apos;instant.</p>
              <p className="text-xs mt-1">Créez votre premier tag ci-dessus.</p>
            </div>
          ) : (
            <ul className="divide-y divide-ink/8">
              {tags.map((t) => {
                const isEdit = editingId === t.id;
                return (
                  <li key={t.id} className="p-4">
                    {isEdit ? (
                      <div className="grid gap-3">
                        <input
                          value={editDraft.label}
                          onChange={(e) =>
                            setEditDraft((d) => ({
                              ...d,
                              label: e.target.value,
                            }))
                          }
                          className="bg-cream border border-ink/12 rounded-xl px-4 py-2 text-sm focus:border-copper focus:outline-none"
                        />
                        <ColorPicker
                          value={editDraft.color}
                          onChange={(c) =>
                            setEditDraft((d) => ({ ...d, color: c }))
                          }
                        />
                        <Preview
                          label={editDraft.label || t.label}
                          color={editDraft.color}
                        />
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => saveEdit(t.id)}
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
                            onClick={() => setEditingId(null)}
                            className="text-xs text-graphite hover:text-ink"
                          >
                            Annuler
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-3">
                        <Pill color={t.color} label={t.label} />
                        <span className="font-mono text-[10px] text-muted">
                          {t.id}
                        </span>
                        <div className="ml-auto flex items-center gap-1">
                          <button
                            onClick={() => {
                              setEditingId(t.id);
                              setEditDraft({ label: t.label, color: t.color });
                            }}
                            className="h-8 w-8 grid place-items-center rounded-full bg-cream border border-ink/8 text-graphite hover:bg-ink hover:text-cream transition-colors"
                            title="Modifier"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => removeTag(t.id, t.label)}
                            className="h-8 w-8 grid place-items-center rounded-full bg-cream border border-ember/30 text-ember hover:bg-ember hover:text-cream transition-colors"
                            title="Supprimer"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

function ColorPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (c: string) => void;
}) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      {PRESET_COLORS.map((c) => (
        <button
          key={c}
          type="button"
          onClick={() => onChange(c)}
          className={cn(
            "h-8 w-8 rounded-full border-2 transition-all",
            value === c ? "border-ink scale-110" : "border-transparent",
          )}
          style={{ background: c }}
          aria-label={`Couleur ${c}`}
        />
      ))}
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="#rrggbb"
        className="bg-cream border border-ink/12 rounded-lg px-2 py-1 text-xs font-mono w-24"
      />
    </div>
  );
}

function Preview({ label, color }: { label: string; color: string }) {
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="text-muted">Aperçu :</span>
      <Pill label={label} color={color} />
    </div>
  );
}

function Pill({ label, color }: { label: string; color: string }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium"
      style={{
        background: `${color}1c`,
        color,
        border: `1px solid ${color}40`,
      }}
    >
      <span
        className="h-1.5 w-1.5 rounded-full"
        style={{ background: color }}
      />
      {label}
    </span>
  );
}

// Tiny no-op to suppress unused warning if XIcon isn't used yet
void XIcon;
