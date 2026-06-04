"use client";

/**
 * Knowledge base interne — wiki d'équipe.
 *
 * Layout 2 colonnes : liste à gauche (recherche + catégorie), éditeur à
 * droite avec preview rendu côté serveur via PATCH (debounced 800 ms).
 */

import { useEffect, useState, useMemo, useCallback, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Plus,
  Loader2,
  Search,
  Library,
  Trash2,
  Save,
  Check,
  Eye,
  Edit3,
} from "lucide-react";
import { cn } from "@/lib/utils";

type Article = {
  id: string;
  slug: string;
  title: string;
  category: string;
  content: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  updatedBy?: string;
};

export default function KbPage() {
  const router = useRouter();
  const [articles, setArticles] = useState<Article[] | null>(null);
  const [categories, setCategories] = useState<string[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Article | null>(null);
  const [rendered, setRendered] = useState<string>("");
  const [tab, setTab] = useState<"edit" | "preview">("edit");
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState<string>("");
  const [busy, setBusy] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const renderTimer = useRef<number | null>(null);

  const load = useCallback(async () => {
    const url = new URL("/api/admin/kb", window.location.origin);
    if (catFilter) url.searchParams.set("category", catFilter);
    if (search.trim()) url.searchParams.set("search", search);
    const res = await fetch(url.toString(), { cache: "no-store" });
    if (res.status === 401) {
      router.replace("/admin/login");
      return;
    }
    if (res.ok) {
      const d = await res.json();
      setArticles(d.articles ?? []);
      setCategories(d.categories ?? []);
    }
  }, [router, search, catFilter]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!activeId) {
      setDraft(null);
      setRendered("");
      return;
    }
    fetch(`/api/admin/kb/${activeId}`, { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d) {
          setDraft(d.article);
          setRendered(d.rendered ?? "");
          setDirty(false);
        }
      });
  }, [activeId]);

  const renderPreview = useCallback(async (content: string) => {
    // Live render appel PATCH avec content uniquement — pas idéal, on garde
    // simple en V1. Mieux : exporter renderMarkdownLight côté client. À faire
    // si charge serveur trop élevée.
    try {
      const res = await fetch("/api/admin/kb/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      if (res.ok) {
        const d = await res.json();
        setRendered(d.rendered ?? "");
      }
    } catch {
      // ignore
    }
  }, []);

  // Live preview debounced
  useEffect(() => {
    if (!draft || tab !== "preview") return;
    if (renderTimer.current) window.clearTimeout(renderTimer.current);
    renderTimer.current = window.setTimeout(() => {
      renderPreview(draft.content);
    }, 600);
    return () => {
      if (renderTimer.current) window.clearTimeout(renderTimer.current);
    };
  }, [draft?.content, tab, renderPreview]);

  const update = (patch: Partial<Article>) => {
    if (!draft) return;
    setDraft({ ...draft, ...patch });
    setDirty(true);
  };

  const createNew = async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/kb", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: "Nouvel article",
          category: catFilter || "Général",
          content: "# Titre\n\nÉcrivez le contenu ici…",
        }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error ?? "Erreur");
      await load();
      setActiveId(d.article.id);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setBusy(false);
    }
  };

  const save = async () => {
    if (!draft || !activeId) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/kb/${activeId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: draft.title,
          category: draft.category,
          content: draft.content,
          tags: draft.tags,
        }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error ?? "Erreur");
      setDraft(d.article);
      setRendered(d.rendered);
      setDirty(false);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    if (!activeId) return;
    if (!confirm("Supprimer cet article ?")) return;
    await fetch(`/api/admin/kb/${activeId}`, { method: "DELETE" });
    setActiveId(null);
    await load();
  };

  const filteredCats = useMemo(() => categories, [categories]);

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
              Knowledge base
            </h1>
            <p className="mt-2 text-graphite">
              Procédures, fiches techniques, FAQ équipe.{" "}
              <span className="text-muted">
                · {articles?.length ?? 0} article
                {(articles?.length ?? 0) > 1 ? "s" : ""}
              </span>
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
            Nouvel article
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
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Rechercher…"
                className="bg-transparent text-sm focus:outline-none flex-1"
              />
            </div>
            {filteredCats.length > 0 && (
              <div className="px-3 py-2 border-b border-ink/8 flex items-center gap-1 flex-wrap">
                <button
                  onClick={() => setCatFilter("")}
                  className={cn(
                    "px-2 py-0.5 rounded-full text-[10px] font-mono uppercase tracking-eyebrow",
                    catFilter === ""
                      ? "bg-ink text-cream"
                      : "bg-cream border border-ink/10 text-graphite hover:border-copper/40",
                  )}
                >
                  Toutes
                </button>
                {filteredCats.map((c) => (
                  <button
                    key={c}
                    onClick={() => setCatFilter(c)}
                    className={cn(
                      "px-2 py-0.5 rounded-full text-[10px] font-mono uppercase tracking-eyebrow",
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
              {articles === null ? (
                <div className="py-8 text-center text-muted">
                  <Loader2 className="h-5 w-5 animate-spin mx-auto" />
                </div>
              ) : articles.length === 0 ? (
                <div className="py-12 text-center text-muted">
                  <Library className="h-10 w-10 mx-auto opacity-30 mb-2" />
                  <p className="text-sm">Aucun article.</p>
                </div>
              ) : (
                <ul>
                  {articles.map((a) => (
                    <li key={a.id}>
                      <button
                        onClick={() => setActiveId(a.id)}
                        className={cn(
                          "w-full text-left px-4 py-3 border-b border-ink/8 last:border-0 transition-colors",
                          activeId === a.id
                            ? "bg-cream/60"
                            : "hover:bg-cream/30",
                        )}
                      >
                        <div className="text-sm font-medium text-ink truncate">
                          {a.title}
                        </div>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="text-[10px] font-mono uppercase tracking-eyebrow text-copper">
                            {a.category}
                          </span>
                          <span className="text-[11px] text-muted">
                            ·{" "}
                            {new Date(a.updatedAt).toLocaleDateString("fr-FR")}
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
            {!draft ? (
              <div className="h-full grid place-items-center text-muted">
                <div className="text-center">
                  <Library className="h-12 w-12 mx-auto opacity-20" />
                  <p className="mt-3 text-sm">
                    Sélectionnez ou créez un article.
                  </p>
                </div>
              </div>
            ) : (
              <>
                <div className="px-5 py-3 border-b border-ink/8 bg-cream/40 grid gap-2">
                  <input
                    value={draft.title}
                    onChange={(e) => update({ title: e.target.value })}
                    className="bg-transparent text-base font-medium text-ink focus:outline-none"
                  />
                  <div className="flex items-center gap-2">
                    <input
                      value={draft.category}
                      onChange={(e) => update({ category: e.target.value })}
                      placeholder="Catégorie"
                      className="bg-white border border-ink/12 rounded-full px-3 py-1 text-xs focus:border-copper focus:outline-none w-36"
                    />
                    <input
                      value={draft.tags.join(", ")}
                      onChange={(e) =>
                        update({
                          tags: e.target.value
                            .split(",")
                            .map((t) => t.trim())
                            .filter(Boolean),
                        })
                      }
                      placeholder="Tags séparés par virgule"
                      className="flex-1 bg-white border border-ink/12 rounded-full px-3 py-1 text-xs focus:border-copper focus:outline-none"
                    />
                  </div>
                </div>
                <div className="border-b border-ink/8 flex items-center gap-1 px-2">
                  {(["edit", "preview"] as const).map((t) => (
                    <button
                      key={t}
                      onClick={() => setTab(t)}
                      className={cn(
                        "inline-flex items-center gap-1 px-3 py-2 text-xs font-mono uppercase tracking-eyebrow border-b-2 transition-colors",
                        tab === t
                          ? "border-copper text-copper"
                          : "border-transparent text-graphite hover:text-ink",
                      )}
                    >
                      {t === "edit" ? (
                        <>
                          <Edit3 className="h-3 w-3" />
                          Markdown
                        </>
                      ) : (
                        <>
                          <Eye className="h-3 w-3" />
                          Aperçu
                        </>
                      )}
                    </button>
                  ))}
                </div>
                {tab === "edit" ? (
                  <textarea
                    value={draft.content}
                    onChange={(e) => update({ content: e.target.value })}
                    placeholder="Contenu markdown…"
                    className="flex-1 px-5 py-4 bg-cream/10 text-sm text-ink focus:outline-none resize-none font-mono leading-relaxed"
                  />
                ) : (
                  <div
                    className="flex-1 overflow-y-auto px-5 py-4 bg-white text-ink kb-rendered"
                    dangerouslySetInnerHTML={{ __html: rendered }}
                  />
                )}
                <div className="px-5 py-3 border-t border-ink/8 bg-white flex items-center gap-2">
                  <button
                    onClick={save}
                    disabled={busy || !dirty}
                    className="inline-flex items-center gap-1.5 rounded-full bg-ink text-cream px-4 py-2 text-sm font-medium hover:bg-copper disabled:opacity-40"
                  >
                    {busy ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : dirty ? (
                      <Save className="h-3.5 w-3.5" />
                    ) : (
                      <Check className="h-3.5 w-3.5" />
                    )}
                    {dirty ? "Enregistrer" : "À jour"}
                  </button>
                  <span className="ml-auto text-[11px] text-muted">
                    {draft.content.length} car ·{" "}
                    {draft.updatedBy && (
                      <>par {draft.updatedBy} · </>
                    )}
                    {new Date(draft.updatedAt).toLocaleString("fr-FR")}
                  </span>
                  <button
                    onClick={remove}
                    className="inline-flex items-center gap-1.5 rounded-full bg-white border border-ember/40 text-ember px-3 py-2 text-sm hover:bg-ember/10"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Supprimer
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <style jsx global>{`
        .kb-rendered .kb-h1 {
          font-family: Georgia, serif;
          font-size: 2rem;
          line-height: 1.1;
          margin: 0.5em 0 0.25em;
          color: #1e1a15;
        }
        .kb-rendered .kb-h2 {
          font-family: Georgia, serif;
          font-size: 1.4rem;
          margin: 1em 0 0.25em;
          color: #1e1a15;
        }
        .kb-rendered .kb-h3 {
          font-size: 1.1rem;
          font-weight: 600;
          margin: 0.75em 0 0.2em;
          color: #2a251e;
        }
        .kb-rendered .kb-p {
          margin: 0.4em 0;
          line-height: 1.6;
        }
        .kb-rendered .kb-ul,
        .kb-rendered .kb-ol {
          padding-left: 1.25em;
          margin: 0.4em 0;
        }
        .kb-rendered .kb-ul {
          list-style: disc;
        }
        .kb-rendered .kb-ol {
          list-style: decimal;
        }
        .kb-rendered .kb-link {
          color: #b86a36;
          text-decoration: underline;
          text-underline-offset: 2px;
        }
        .kb-rendered .kb-code {
          background: rgba(184, 106, 54, 0.1);
          color: #94532a;
          padding: 0 0.25em;
          border-radius: 3px;
          font-family: ui-monospace, monospace;
          font-size: 0.92em;
        }
        .kb-rendered .kb-pre {
          background: #1e1a15;
          color: #f6f0e4;
          padding: 0.75em 1em;
          border-radius: 0.5em;
          overflow-x: auto;
          margin: 0.5em 0;
          font-size: 0.85em;
        }
      `}</style>
    </div>
  );
}
