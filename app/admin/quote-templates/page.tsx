"use client";

/**
 * Gestion des templates de devis.
 *
 * Liste à gauche, éditeur à droite. Ajout/suppression de lignes inline, calcul
 * du total HT/TTC en temps réel.
 */

import { useEffect, useMemo, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Plus,
  Loader2,
  Trash2,
  Save,
  FileStack,
  Copy,
  Check,
  Search,
  Filter,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import { cn } from "@/lib/utils";

type Line = {
  description: string;
  quantity: number;
  unitPrice: number;
  unit?: string;
};

type Template = {
  id: string;
  name: string;
  description?: string;
  category?: string;
  lines: Line[];
  tvaRate: number;
  createdAt: string;
  updatedAt: string;
  usageCount: number;
};

function formatEur(v: number) {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(v);
}

export default function QuoteTemplatesPage() {
  const router = useRouter();
  const [templates, setTemplates] = useState<Template[] | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Template | null>(null);
  const [dirty, setDirty] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);

  const load = useCallback(async () => {
    const res = await fetch("/api/admin/quote-templates", { cache: "no-store" });
    if (res.status === 401) {
      router.replace("/admin/login");
      return;
    }
    if (res.ok) {
      const data = await res.json();
      setTemplates(data.templates ?? []);
    }
  }, [router]);

  useEffect(() => {
    load();
  }, [load]);

  // Charge le template actif dans draft
  useEffect(() => {
    if (!templates || !activeId) return;
    const t = templates.find((x) => x.id === activeId);
    if (t) {
      setDraft(JSON.parse(JSON.stringify(t)));
      setDirty(false);
    }
  }, [activeId, templates]);

  const createNew = async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/quote-templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: `Nouveau template — ${new Date().toLocaleDateString("fr-LU")}`,
          description:
            "Décrire ici le périmètre du template (ex: PAC air/eau remplacement chaudière standard)",
          category: "Général",
          lines: [
            {
              description: "Fourniture de l'équipement principal",
              quantity: 1,
              unitPrice: 0,
              unit: "unité",
            },
            {
              description: "Pose et raccordement",
              quantity: 1,
              unitPrice: 0,
              unit: "forfait",
            },
            {
              description: "Mise en service et formation client",
              quantity: 1,
              unitPrice: 0,
              unit: "forfait",
            },
          ],
          tvaRate: 3,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Erreur");
      await load();
      setActiveId(data.template.id);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setBusy(false);
    }
  };

  const duplicate = async (template: Template) => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/quote-templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: `${template.name} (copie)`,
          description: template.description,
          category: template.category,
          lines: template.lines.map((l) => ({ ...l })),
          tvaRate: template.tvaRate,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Erreur");
      await load();
      setActiveId(data.template.id);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setBusy(false);
    }
  };

  // Catégories uniques pour le filtre
  const categories = useMemo(() => {
    if (!templates) return [];
    const set = new Set<string>();
    for (const t of templates) {
      if (t.category) set.add(t.category);
    }
    return Array.from(set).sort();
  }, [templates]);

  // Filtre client (search + catégorie)
  const filteredTemplates = useMemo(() => {
    if (!templates) return null;
    const q = searchQuery.trim().toLowerCase();
    return templates.filter((t) => {
      if (categoryFilter && t.category !== categoryFilter) return false;
      if (!q) return true;
      return (
        t.name.toLowerCase().includes(q) ||
        (t.description?.toLowerCase().includes(q) ?? false) ||
        t.lines.some((l) => l.description.toLowerCase().includes(q))
      );
    });
  }, [templates, searchQuery, categoryFilter]);

  // Total HT de chaque template (pour affichage en card)
  const totalsByTemplate = useMemo(() => {
    if (!templates) return {} as Record<string, number>;
    const out: Record<string, number> = {};
    for (const t of templates) {
      out[t.id] = t.lines.reduce((s, l) => s + l.quantity * l.unitPrice, 0);
    }
    return out;
  }, [templates]);

  const save = async () => {
    if (!draft || !activeId) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/quote-templates/${activeId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: draft.name,
          description: draft.description ?? "",
          category: draft.category ?? "",
          lines: draft.lines,
          tvaRate: draft.tvaRate,
        }),
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
    if (!activeId || !draft) return;
    if (!confirm(`Supprimer le template « ${draft.name} » ?`)) return;
    setBusy(true);
    try {
      await fetch(`/api/admin/quote-templates/${activeId}`, { method: "DELETE" });
      setActiveId(null);
      setDraft(null);
      await load();
    } finally {
      setBusy(false);
    }
  };

  const totals = useMemo(() => {
    if (!draft) return { ht: 0, tva: 0, ttc: 0 };
    const ht = draft.lines.reduce(
      (s, l) => s + Number(l.quantity || 0) * Number(l.unitPrice || 0),
      0,
    );
    const tva = ht * (draft.tvaRate / 100);
    return { ht, tva, ttc: ht + tva };
  }, [draft]);

  const updateLine = (i: number, patch: Partial<Line>) => {
    if (!draft) return;
    const next = { ...draft, lines: [...draft.lines] };
    next.lines[i] = { ...next.lines[i], ...patch };
    setDraft(next);
    setDirty(true);
  };

  const addLine = () => {
    if (!draft) return;
    setDraft({
      ...draft,
      lines: [
        ...draft.lines,
        { description: "", quantity: 1, unitPrice: 0, unit: "forfait" },
      ],
    });
    setDirty(true);
  };

  const removeLine = (i: number) => {
    if (!draft) return;
    setDraft({ ...draft, lines: draft.lines.filter((_, idx) => idx !== i) });
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
              Templates de devis
            </h1>
            <p className="mt-2 text-graphite">
              Bundles d&apos;items réutilisables. Appliqués en 1 clic depuis le
              quote builder d&apos;un lead.
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
            Nouveau template
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
            <div className="px-4 py-3 border-b border-ink/8 bg-cream/40">
              <div className="flex items-center justify-between gap-2 mb-2.5">
                <div className="font-mono text-[10px] uppercase tracking-eyebrow text-copper">
                  Templates ({filteredTemplates?.length ?? 0}
                  {templates && filteredTemplates && filteredTemplates.length !== templates.length
                    ? ` / ${templates.length}`
                    : ""}
                  )
                </div>
              </div>
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Rechercher (nom, description, ligne…)"
                  className="w-full pl-8 pr-3 py-1.5 text-sm rounded-lg border border-ink/12 bg-white focus:outline-none focus:border-copper/50"
                />
              </div>
              {/* Filtres catégorie */}
              {categories.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  <button
                    onClick={() => setCategoryFilter(null)}
                    className={cn(
                      "px-2 py-0.5 rounded-full text-[10px] font-mono uppercase tracking-eyebrow border transition-colors",
                      categoryFilter === null
                        ? "bg-ink text-cream border-ink"
                        : "bg-white text-graphite border-ink/15 hover:border-copper/40",
                    )}
                  >
                    Toutes
                  </button>
                  {categories.map((c) => (
                    <button
                      key={c}
                      onClick={() =>
                        setCategoryFilter((cur) => (cur === c ? null : c))
                      }
                      className={cn(
                        "px-2 py-0.5 rounded-full text-[10px] font-mono uppercase tracking-eyebrow border transition-colors",
                        categoryFilter === c
                          ? "bg-copper text-cream border-copper"
                          : "bg-white text-graphite border-ink/15 hover:border-copper/40",
                      )}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="flex-1 overflow-y-auto">
              {templates === null ? (
                <div className="py-8 text-center text-muted">
                  <Loader2 className="h-5 w-5 animate-spin mx-auto" />
                </div>
              ) : filteredTemplates && filteredTemplates.length === 0 ? (
                <div className="py-12 px-6 text-center">
                  <FileStack className="h-10 w-10 mx-auto opacity-30 text-copper mb-3" />
                  {templates.length === 0 ? (
                    <>
                      <p className="text-sm text-ink font-medium">
                        Aucun template encore.
                      </p>
                      <p className="text-xs text-muted mt-1">
                        Créez votre premier bundle d&apos;items réutilisables.
                      </p>
                      <button
                        onClick={createNew}
                        disabled={busy}
                        className="mt-4 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-copper/10 border border-copper/30 text-copper text-xs font-medium hover:bg-copper hover:text-cream transition-colors"
                      >
                        <Plus className="h-3 w-3" />
                        Créer le premier
                      </button>
                    </>
                  ) : (
                    <>
                      <p className="text-sm text-ink font-medium">
                        Aucun résultat.
                      </p>
                      <p className="text-xs text-muted mt-1">
                        Essayez d&apos;autres mots-clés ou retirez le filtre catégorie.
                      </p>
                      <button
                        onClick={() => {
                          setSearchQuery("");
                          setCategoryFilter(null);
                        }}
                        className="mt-3 text-xs text-copper hover:underline"
                      >
                        Réinitialiser les filtres
                      </button>
                    </>
                  )}
                </div>
              ) : (
                <ul>
                  {filteredTemplates?.map((t) => {
                    const total = totalsByTemplate[t.id] ?? 0;
                    return (
                      <li key={t.id}>
                        <button
                          onClick={() => setActiveId(t.id)}
                          className={cn(
                            "w-full text-left px-4 py-3 border-b border-ink/8 last:border-0 transition-colors",
                            activeId === t.id
                              ? "bg-cream/80 border-l-2 border-l-copper"
                              : "hover:bg-cream/30",
                          )}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <span className="text-sm font-medium text-ink line-clamp-2">
                              {t.name}
                            </span>
                            {t.usageCount > 0 && (
                              <span
                                className="font-mono text-[10px] text-copper tabular-nums shrink-0 inline-flex items-center gap-0.5"
                                title="Utilisations"
                              >
                                <TrendingUp className="h-2.5 w-2.5" />
                                {t.usageCount}×
                              </span>
                            )}
                          </div>
                          {t.description && (
                            <p className="text-[11px] text-muted mt-0.5 line-clamp-1">
                              {t.description}
                            </p>
                          )}
                          <div className="mt-2 flex items-center gap-2 flex-wrap">
                            {t.category && (
                              <span className="text-[9px] font-mono uppercase tracking-eyebrow text-copper bg-copper/10 border border-copper/30 px-1.5 py-0.5 rounded-full">
                                {t.category}
                              </span>
                            )}
                            <span className="text-[10px] text-muted">
                              {t.lines.length} ligne{t.lines.length > 1 ? "s" : ""}
                            </span>
                            {total > 0 && (
                              <span className="text-[10px] font-mono tabular-nums text-ink ml-auto">
                                {formatEur(total)} HT
                              </span>
                            )}
                          </div>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>

          {/* Éditeur */}
          <div className="lg:col-span-8 rounded-2xl border border-ink/10 bg-white shadow-soft overflow-hidden flex flex-col">
            {draft ? (
              <>
                <div className="px-5 py-3 border-b border-ink/8 bg-cream/40 grid gap-2">
                  <input
                    value={draft.name}
                    onChange={(e) => {
                      setDraft({ ...draft, name: e.target.value });
                      setDirty(true);
                    }}
                    placeholder="Nom du template"
                    className="bg-transparent text-base font-medium text-ink focus:outline-none placeholder:text-muted"
                  />
                  <div className="flex items-center gap-2">
                    <input
                      value={draft.category ?? ""}
                      onChange={(e) => {
                        setDraft({ ...draft, category: e.target.value });
                        setDirty(true);
                      }}
                      placeholder="Catégorie"
                      className="bg-white border border-ink/12 rounded-full px-3 py-1 text-xs focus:border-copper focus:outline-none w-36"
                    />
                    <input
                      value={draft.description ?? ""}
                      onChange={(e) => {
                        setDraft({ ...draft, description: e.target.value });
                        setDirty(true);
                      }}
                      placeholder="Description courte (optionnelle)"
                      className="bg-white border border-ink/12 rounded-full px-3 py-1 text-xs focus:border-copper focus:outline-none flex-1"
                    />
                    <label className="text-xs text-graphite inline-flex items-center gap-1.5">
                      TVA
                      <input
                        type="number"
                        min={0}
                        max={100}
                        step={0.5}
                        value={draft.tvaRate}
                        onChange={(e) => {
                          setDraft({
                            ...draft,
                            tvaRate: Number(e.target.value),
                          });
                          setDirty(true);
                        }}
                        className="bg-white border border-ink/12 rounded-md px-2 py-1 text-xs font-mono w-14 focus:border-copper focus:outline-none"
                      />
                      %
                    </label>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto px-5 py-3">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-graphite">
                        <th className="font-mono text-[10px] uppercase tracking-eyebrow pb-2">
                          Description
                        </th>
                        <th className="font-mono text-[10px] uppercase tracking-eyebrow pb-2 w-20 text-right">
                          Qté
                        </th>
                        <th className="font-mono text-[10px] uppercase tracking-eyebrow pb-2 w-20 text-right">
                          Unité
                        </th>
                        <th className="font-mono text-[10px] uppercase tracking-eyebrow pb-2 w-28 text-right">
                          PU HT
                        </th>
                        <th className="font-mono text-[10px] uppercase tracking-eyebrow pb-2 w-28 text-right">
                          Total
                        </th>
                        <th className="w-8" />
                      </tr>
                    </thead>
                    <tbody>
                      {draft.lines.map((l, i) => (
                        <tr key={i} className="border-t border-ink/8">
                          <td className="py-1.5 pr-2">
                            <input
                              value={l.description}
                              onChange={(e) =>
                                updateLine(i, { description: e.target.value })
                              }
                              placeholder="Description ligne…"
                              className="w-full bg-cream/50 border border-transparent hover:border-ink/12 focus:border-copper focus:bg-white rounded-lg px-2 py-1 text-sm focus:outline-none"
                            />
                          </td>
                          <td className="py-1.5 pr-2">
                            <input
                              type="number"
                              value={l.quantity}
                              onChange={(e) =>
                                updateLine(i, {
                                  quantity: Number(e.target.value),
                                })
                              }
                              className="w-full text-right bg-cream/50 border border-transparent hover:border-ink/12 focus:border-copper focus:bg-white rounded-lg px-2 py-1 text-sm font-mono focus:outline-none"
                            />
                          </td>
                          <td className="py-1.5 pr-2">
                            <input
                              value={l.unit ?? ""}
                              onChange={(e) =>
                                updateLine(i, { unit: e.target.value })
                              }
                              className="w-full text-right bg-cream/50 border border-transparent hover:border-ink/12 focus:border-copper focus:bg-white rounded-lg px-2 py-1 text-xs font-mono focus:outline-none"
                            />
                          </td>
                          <td className="py-1.5 pr-2">
                            <input
                              type="number"
                              value={l.unitPrice}
                              onChange={(e) =>
                                updateLine(i, {
                                  unitPrice: Number(e.target.value),
                                })
                              }
                              className="w-full text-right bg-cream/50 border border-transparent hover:border-ink/12 focus:border-copper focus:bg-white rounded-lg px-2 py-1 text-sm font-mono focus:outline-none"
                            />
                          </td>
                          <td className="py-1.5 pr-2 text-right font-mono text-sm text-ink tabular-nums">
                            {formatEur(
                              Number(l.quantity || 0) *
                                Number(l.unitPrice || 0),
                            )}
                          </td>
                          <td className="py-1.5 pl-1">
                            <button
                              onClick={() => removeLine(i)}
                              className="h-6 w-6 grid place-items-center rounded-full bg-cream border border-ember/30 text-ember hover:bg-ember hover:text-cream"
                              aria-label="Supprimer cette ligne"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <button
                    onClick={addLine}
                    className="mt-3 inline-flex items-center gap-1.5 text-xs text-copper hover:underline"
                  >
                    <Plus className="h-3 w-3" />
                    Ajouter une ligne
                  </button>
                </div>

                <div className="px-5 py-3 border-t border-ink/8 bg-white grid gap-2">
                  <div className="grid grid-cols-3 gap-3 text-sm">
                    <Totals label="HT" value={totals.ht} />
                    <Totals label={`TVA ${draft.tvaRate}%`} value={totals.tva} />
                    <Totals label="TTC" value={totals.ttc} highlight />
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={save}
                      disabled={busy || !dirty}
                      className="inline-flex items-center gap-1.5 rounded-full bg-ink text-cream px-4 py-2 text-sm font-medium hover:bg-copper disabled:opacity-40 transition-colors"
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
                      {draft.lines.length} lignes ·{" "}
                      {draft.usageCount} utilisations
                    </span>
                    <button
                      onClick={() => duplicate(draft)}
                      disabled={busy}
                      title="Créer une copie de ce template (utile pour partir d'une base existante)"
                      className="inline-flex items-center gap-1.5 rounded-full bg-white border border-ink/15 text-ink px-3 py-2 text-sm hover:border-copper/40 hover:text-copper transition-colors disabled:opacity-40"
                    >
                      <Copy className="h-3.5 w-3.5" />
                      Dupliquer
                    </button>
                    <button
                      onClick={remove}
                      className="inline-flex items-center gap-1.5 rounded-full bg-white border border-ember/40 text-ember px-3 py-2 text-sm hover:bg-ember/10"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Supprimer
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="h-full grid place-items-center p-8">
                <div className="text-center max-w-md">
                  <div className="inline-grid place-items-center h-16 w-16 rounded-full bg-copper/10 border border-copper/20 mb-4">
                    <Sparkles className="h-7 w-7 text-copper" />
                  </div>
                  <h3 className="font-display text-xl text-ink tracking-tight">
                    Sélectionnez un template à gauche
                  </h3>
                  <p className="mt-2 text-sm text-graphite leading-relaxed">
                    Cliquez sur un template existant pour le modifier, ou créez-en un
                    nouveau. Les templates s&apos;appliquent en 1 clic depuis le quote
                    builder d&apos;un lead.
                  </p>
                  {templates && templates.length > 0 && (
                    <div className="mt-6 p-4 rounded-2xl bg-cream border border-ink/10 text-left">
                      <div className="font-mono text-[10px] uppercase tracking-eyebrow text-copper mb-2">
                        Top 3 les plus utilisés
                      </div>
                      <ul className="space-y-1">
                        {templates
                          .slice()
                          .sort((a, b) => b.usageCount - a.usageCount)
                          .slice(0, 3)
                          .map((t) => (
                            <li key={t.id}>
                              <button
                                onClick={() => setActiveId(t.id)}
                                className="w-full text-left flex items-center justify-between gap-2 py-1.5 px-2 rounded-lg hover:bg-white transition-colors text-xs"
                              >
                                <span className="text-ink truncate">{t.name}</span>
                                <span className="font-mono text-copper tabular-nums shrink-0">
                                  {t.usageCount}×
                                </span>
                              </button>
                            </li>
                          ))}
                      </ul>
                    </div>
                  )}
                  <button
                    onClick={createNew}
                    disabled={busy}
                    className="mt-5 inline-flex items-center gap-1.5 rounded-full bg-ink text-cream px-4 py-2 text-xs font-medium hover:bg-copper transition-colors"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Créer un nouveau template
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        <p className="mt-4 text-xs text-muted">
          Application : depuis la fiche d&apos;un lead → quote builder → bouton
          « Charger un template ». Le template injecte ses lignes dans le devis
          brouillon, à ajuster avant envoi.
        </p>

        {/* Suppress unused */}
        <span className="hidden">
          <Copy className="h-3 w-3" />
        </span>
      </div>
    </div>
  );
}

function Totals({
  label,
  value,
  highlight,
}: {
  label: string;
  value: number;
  highlight?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-xl px-3 py-2 border",
        highlight
          ? "bg-ink text-cream border-ink"
          : "bg-cream border-ink/8 text-ink",
      )}
    >
      <div
        className={cn(
          "font-mono text-[10px] uppercase tracking-eyebrow",
          highlight ? "text-cream/70" : "text-muted",
        )}
      >
        {label}
      </div>
      <div className="text-sm font-mono tabular-nums">{formatEur(value)}</div>
    </div>
  );
}
