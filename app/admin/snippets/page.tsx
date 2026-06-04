"use client";

/**
 * Gestion de la snippet library.
 *
 * Liste à gauche (recherche + filtre catégorie), éditeur à droite pour la
 * snippet sélectionnée. Bouton « Nouveau snippet » crée puis ouvre l'édition.
 */

import { useEffect, useMemo, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Plus,
  Search,
  Loader2,
  Trash2,
  Save,
  Copy,
  Check,
  Code,
  Library,
  X as XIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

type Snippet = {
  id: string;
  title: string;
  category: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  usageCount: number;
};

const VARIABLES = [
  { token: "{{lead.fullName}}", hint: "Nom complet du lead" },
  { token: "{{lead.commune}}", hint: "Commune" },
  { token: "{{lead.reference}}", hint: "Référence DEV-…" },
  { token: "{{brand.name}}", hint: "Nom de la marque" },
  { token: "{{brand.phone}}", hint: "Téléphone marque" },
];

export default function SnippetsAdminPage() {
  const router = useRouter();
  const [snippets, setSnippets] = useState<Snippet[] | null>(null);
  const [categories, setCategories] = useState<string[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [draft, setDraft] = useState<{
    title: string;
    category: string;
    content: string;
  }>({ title: "", category: "Général", content: "" });
  const [filter, setFilter] = useState("");
  const [catFilter, setCatFilter] = useState<string>("");
  const [busy, setBusy] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const res = await fetch("/api/admin/snippets", { cache: "no-store" });
    if (res.status === 401) {
      router.replace("/admin/login");
      return;
    }
    if (res.ok) {
      const data = await res.json();
      setSnippets(data.snippets ?? []);
      setCategories(data.categories ?? []);
    }
  }, [router]);

  useEffect(() => {
    load();
  }, [load]);

  // Sélectionne la première snippet par défaut quand on charge
  useEffect(() => {
    if (!activeId && snippets && snippets.length > 0) {
      setActiveId(snippets[0].id);
    }
  }, [snippets, activeId]);

  // Synchronise le draft avec la snippet active
  useEffect(() => {
    if (!snippets || !activeId) return;
    const s = snippets.find((x) => x.id === activeId);
    if (s) {
      setDraft({ title: s.title, category: s.category, content: s.content });
      setDirty(false);
    }
  }, [activeId, snippets]);

  const filtered = useMemo(() => {
    if (!snippets) return null;
    const q = filter.trim().toLowerCase();
    return snippets.filter((s) => {
      if (catFilter && s.category !== catFilter) return false;
      if (!q) return true;
      return (
        s.title.toLowerCase().includes(q) ||
        s.content.toLowerCase().includes(q) ||
        s.category.toLowerCase().includes(q)
      );
    });
  }, [snippets, filter, catFilter]);

  const createNew = async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/snippets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: "Nouveau snippet",
          category: catFilter || "Général",
          content: "Bonjour {{lead.fullName}},\n\n",
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Erreur");
      await load();
      setActiveId(data.snippet.id);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setBusy(false);
    }
  };

  const save = async () => {
    if (!activeId) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/snippets/${activeId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(draft),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Erreur");
      await load();
      setDirty(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    if (!activeId) return;
    const cur = snippets?.find((s) => s.id === activeId);
    if (!confirm(`Supprimer « ${cur?.title ?? activeId} » ?`)) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/snippets/${activeId}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Erreur");
      }
      setActiveId(null);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setBusy(false);
    }
  };

  const copyContent = async () => {
    try {
      await navigator.clipboard.writeText(draft.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {}
  };

  const insertVar = (token: string) => {
    setDraft((d) => ({ ...d, content: d.content + token }));
    setDirty(true);
  };

  return (
    <div className="min-h-screen bg-cream py-8 lg:py-10">
      <div className="container max-w-7xl">
        <Link
          href="/admin/leads"
          className="inline-flex items-center gap-2 text-sm font-mono uppercase tracking-eyebrow text-graphite hover:text-copper transition-colors mb-6"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Retour pipeline
        </Link>

        <div className="flex items-start justify-between gap-4 flex-wrap mb-6">
          <div>
            <h1 className="font-display text-display-md text-ink">
              Bibliothèque de snippets
            </h1>
            <p className="mt-2 text-graphite">
              Réponses-types réutilisables dans le chat, les emails et les
              notes. Variables {`{{lead.…}}`} interpolées au moment de l&apos;insertion.
            </p>
          </div>
          <button
            onClick={createNew}
            disabled={busy}
            className="inline-flex items-center gap-2 rounded-full bg-ink text-cream px-5 py-2.5 text-sm font-medium hover:bg-copper transition-colors disabled:opacity-50"
          >
            {busy ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Plus className="h-4 w-4" />
            )}
            Nouveau snippet
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl border border-ember/40 bg-ember/5 text-sm text-ember">
            {error}
          </div>
        )}

        <div className="grid lg:grid-cols-12 gap-4 h-[75vh]">
          {/* Liste */}
          <div className="lg:col-span-4 rounded-2xl border border-ink/10 bg-white shadow-soft overflow-hidden flex flex-col">
            <div className="px-4 py-3 border-b border-ink/8 bg-cream/40 flex items-center gap-2">
              <Search className="h-4 w-4 text-muted" />
              <input
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                placeholder="Filtrer…"
                className="bg-transparent text-sm focus:outline-none flex-1 placeholder:text-muted"
              />
            </div>
            {categories.length > 0 && (
              <div className="px-3 py-2 border-b border-ink/8 flex items-center gap-1 flex-wrap">
                <button
                  onClick={() => setCatFilter("")}
                  className={cn(
                    "px-2.5 py-1 rounded-full text-[11px] font-medium",
                    catFilter === ""
                      ? "bg-ink text-cream"
                      : "bg-cream border border-ink/10 text-graphite hover:border-copper/40",
                  )}
                >
                  Toutes
                </button>
                {categories.map((c) => (
                  <button
                    key={c}
                    onClick={() => setCatFilter(c)}
                    className={cn(
                      "px-2.5 py-1 rounded-full text-[11px] font-medium",
                      catFilter === c
                        ? "bg-ink text-cream"
                        : "bg-cream border border-ink/10 text-graphite hover:border-copper/40",
                    )}
                  >
                    {c}
                  </button>
                ))}
              </div>
            )}
            <div className="flex-1 overflow-y-auto">
              {filtered === null ? (
                <div className="py-8 text-center text-muted">
                  <Loader2 className="h-5 w-5 animate-spin mx-auto" />
                </div>
              ) : filtered.length === 0 ? (
                <div className="py-12 text-center text-muted">
                  <Library className="h-10 w-10 mx-auto opacity-30 mb-2" />
                  <p className="text-sm">Aucun snippet.</p>
                </div>
              ) : (
                <ul>
                  {filtered.map((s) => (
                    <li key={s.id}>
                      <button
                        onClick={() => setActiveId(s.id)}
                        className={cn(
                          "w-full text-left px-4 py-3 border-b border-ink/8 last:border-0 transition-colors",
                          activeId === s.id
                            ? "bg-cream/60"
                            : "hover:bg-cream/30",
                        )}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-sm font-medium text-ink truncate">
                            {s.title}
                          </span>
                          {s.usageCount > 0 && (
                            <span className="font-mono text-[10px] text-muted tabular-nums">
                              {s.usageCount}×
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="text-[10px] font-mono uppercase tracking-eyebrow text-copper">
                            {s.category}
                          </span>
                          <span className="text-[11px] text-muted truncate">
                            · {s.content.slice(0, 80)}
                          </span>
                        </div>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {/* Éditeur */}
          <div className="lg:col-span-8 rounded-2xl border border-ink/10 bg-white shadow-soft overflow-hidden flex flex-col">
            {activeId ? (
              <>
                <div className="px-5 py-3 border-b border-ink/8 bg-cream/40 flex items-center gap-2">
                  <input
                    value={draft.title}
                    onChange={(e) => {
                      setDraft((d) => ({ ...d, title: e.target.value }));
                      setDirty(true);
                    }}
                    placeholder="Titre du snippet"
                    className="bg-transparent text-base font-medium text-ink focus:outline-none flex-1 placeholder:text-muted"
                  />
                  <input
                    value={draft.category}
                    onChange={(e) => {
                      setDraft((d) => ({ ...d, category: e.target.value }));
                      setDirty(true);
                    }}
                    placeholder="Catégorie"
                    className="bg-white border border-ink/12 rounded-full px-3 py-1 text-xs focus:border-copper focus:outline-none w-36"
                  />
                </div>
                <div className="px-5 py-3 border-b border-ink/8 flex items-center gap-2 flex-wrap text-xs">
                  <span className="font-mono text-[10px] uppercase tracking-eyebrow text-muted">
                    Variables
                  </span>
                  {VARIABLES.map((v) => (
                    <button
                      key={v.token}
                      onClick={() => insertVar(v.token)}
                      title={v.hint}
                      className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-cream border border-ink/8 text-graphite hover:border-copper/40 hover:text-copper font-mono"
                    >
                      <Code className="h-2.5 w-2.5" />
                      {v.token}
                    </button>
                  ))}
                </div>
                <textarea
                  value={draft.content}
                  onChange={(e) => {
                    setDraft((d) => ({ ...d, content: e.target.value }));
                    setDirty(true);
                  }}
                  className="flex-1 px-5 py-4 bg-cream/10 text-sm text-ink focus:outline-none resize-none font-mono leading-relaxed"
                  placeholder="Contenu du snippet…"
                />
                <div className="px-5 py-3 border-t border-ink/8 bg-white flex items-center gap-2 flex-wrap">
                  <button
                    onClick={save}
                    disabled={busy || !dirty}
                    className="inline-flex items-center gap-1.5 rounded-full bg-ink text-cream px-4 py-2 text-sm font-medium hover:bg-copper disabled:opacity-40 transition-colors"
                  >
                    {busy ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Save className="h-3.5 w-3.5" />
                    )}
                    {dirty ? "Enregistrer" : "Enregistré"}
                  </button>
                  <button
                    onClick={copyContent}
                    className="inline-flex items-center gap-1.5 rounded-full bg-white border border-ink/15 px-4 py-2 text-sm hover:border-copper/40 transition-colors"
                  >
                    {copied ? (
                      <Check className="h-3.5 w-3.5 text-[#22a06b]" />
                    ) : (
                      <Copy className="h-3.5 w-3.5" />
                    )}
                    {copied ? "Copié !" : "Copier"}
                  </button>
                  <span className="ml-auto text-[11px] text-muted">
                    {draft.content.length} car ·{" "}
                    {snippets?.find((s) => s.id === activeId)?.usageCount ?? 0}{" "}
                    insertions
                  </span>
                  <button
                    onClick={remove}
                    className="inline-flex items-center gap-1.5 rounded-full bg-white border border-ember/40 text-ember px-3 py-2 text-sm hover:bg-ember/10 transition-colors"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Supprimer
                  </button>
                </div>
              </>
            ) : (
              <div className="h-full grid place-items-center text-muted">
                <div className="text-center">
                  <Library className="h-12 w-12 mx-auto opacity-20" />
                  <p className="mt-3 text-sm">
                    Sélectionnez un snippet à gauche ou créez-en un nouveau.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Suppress unused warning
void XIcon;
