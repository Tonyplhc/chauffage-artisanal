"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Plus,
  Trash2,
  Save,
  Beaker,
  TrendingUp,
  Trophy,
  Loader2,
} from "lucide-react";
import type { Experiment } from "@/lib/experiments-store";
import { cn } from "@/lib/utils";

const EMPTY_EXP: Omit<Experiment, "id"> = {
  name: "Nouvelle expérience",
  description: "",
  enabled: true,
  target: "home_hero_cta",
  conversionEvent: "devis_submitted",
  variants: [
    { id: "a", label: "A (contrôle)", weight: 50, config: { ctaText: "Demander un devis" } },
    { id: "b", label: "B", weight: 50, config: { ctaText: "Obtenir mon devis gratuit" } },
  ],
  exposures: {},
  conversions: {},
};

export default function ExperimentsPage() {
  const router = useRouter();
  const [exps, setExps] = useState<Experiment[] | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Experiment | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = async () => {
    const res = await fetch("/api/admin/experiments", { cache: "no-store" });
    if (res.status === 401) {
      router.replace("/admin/login");
      return;
    }
    const data = await res.json();
    setExps(data.experiments ?? []);
    if (!activeId && data.experiments?.[0]) {
      setActiveId(data.experiments[0].id);
      setDraft(data.experiments[0]);
    }
  };

  useEffect(() => {
    refresh();
    const i = setInterval(refresh, 10_000);
    return () => clearInterval(i);
  }, []);

  useEffect(() => {
    if (activeId && exps) {
      const e = exps.find((x) => x.id === activeId);
      if (e) setDraft(e);
    }
  }, [activeId, exps]);

  const createNew = () => {
    const id = `exp-${Date.now()}`;
    const exp: Experiment = { ...EMPTY_EXP, id };
    setExps((es) => (es ? [...es, exp] : [exp]));
    setActiveId(id);
    setDraft(exp);
  };

  const save = async () => {
    if (!draft) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/experiments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(draft),
      });
      const data = await res.json();
      if (res.ok) await refresh();
      else setError(data.error ?? "Erreur");
    } finally {
      setBusy(false);
    }
  };

  const remove = async (id: string) => {
    if (!confirm("Supprimer cette expérience ?")) return;
    const res = await fetch(`/api/admin/experiments?id=${encodeURIComponent(id)}`, {
      method: "DELETE",
    });
    if (res.ok) {
      setActiveId(null);
      setDraft(null);
      await refresh();
    }
  };

  const updateVariant = (i: number, patch: Partial<Experiment["variants"][0]>) => {
    if (!draft) return;
    const variants = [...draft.variants];
    variants[i] = { ...variants[i], ...patch };
    setDraft({ ...draft, variants });
  };

  const addVariant = () => {
    if (!draft || draft.variants.length >= 6) return;
    const id = String.fromCharCode("a".charCodeAt(0) + draft.variants.length);
    setDraft({
      ...draft,
      variants: [
        ...draft.variants,
        { id, label: id.toUpperCase(), weight: 50, config: {} },
      ],
    });
  };

  const removeVariant = (i: number) => {
    if (!draft || draft.variants.length <= 2) return;
    setDraft({ ...draft, variants: draft.variants.filter((_, idx) => idx !== i) });
  };

  return (
    <div className="min-h-screen bg-cream py-10 lg:py-14">
      <div className="container max-w-7xl">
        <Link
          href="/admin/leads"
          className="inline-flex items-center gap-2 text-sm font-mono uppercase tracking-eyebrow text-graphite hover:text-copper transition-colors mb-6"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Retour pipeline
        </Link>

        <div className="flex items-start justify-between gap-4 mb-8 flex-wrap">
          <div>
            <h1 className="font-display text-display-md text-ink">
              A/B testing
            </h1>
            <p className="mt-2 text-graphite">
              Tester des variantes du site et mesurer la conversion réelle.
            </p>
          </div>
          <button
            onClick={createNew}
            className="inline-flex items-center gap-2 rounded-full bg-ink text-cream px-5 py-2.5 text-sm font-medium hover:bg-copper transition-colors"
          >
            <Plus className="h-4 w-4" />
            Nouvelle expérience
          </button>
        </div>

        <div className="grid lg:grid-cols-12 gap-6">
          {/* Liste */}
          <div className="lg:col-span-4">
            <div className="rounded-2xl border border-ink/10 bg-white shadow-soft p-3">
              {exps === null ? (
                <div className="p-6 text-center text-muted text-sm">Chargement…</div>
              ) : exps.length === 0 ? (
                <div className="p-6 text-center text-muted text-sm">
                  Aucune expérience.
                </div>
              ) : (
                <ul className="grid gap-1">
                  {exps.map((e) => (
                    <li key={e.id}>
                      <button
                        onClick={() => setActiveId(e.id)}
                        className={cn(
                          "w-full text-left px-4 py-3 rounded-xl transition-colors flex items-start gap-3",
                          activeId === e.id
                            ? "bg-ink text-cream"
                            : "bg-cream/50 hover:bg-cream text-ink",
                        )}
                      >
                        <Beaker
                          className={cn(
                            "h-4 w-4 mt-0.5 shrink-0",
                            e.enabled ? "text-copper" : "text-muted",
                          )}
                        />
                        <div className="min-w-0 flex-1">
                          <div className="font-medium text-sm truncate flex items-center gap-2">
                            {e.name}
                            {!e.enabled && (
                              <span className="text-[9px] font-mono uppercase opacity-60">
                                Off
                              </span>
                            )}
                          </div>
                          <div
                            className={cn(
                              "text-xs truncate",
                              activeId === e.id ? "text-cream/70" : "text-muted",
                            )}
                          >
                            {e.variants.length} variants · {countTotal(e.exposures)} exp.
                          </div>
                        </div>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Doc */}
            <div className="mt-4 p-4 rounded-2xl border border-copper/30 bg-copper/5">
              <div className="font-mono text-[10px] uppercase tracking-eyebrow text-copper mb-2">
                Cibles supportées
              </div>
              <ul className="text-xs text-graphite space-y-1.5">
                <li>
                  <code className="font-mono">home_hero_cta</code> — texte du CTA principal sur le hero
                </li>
                <li>
                  <code className="font-mono">devis_step1_intro</code> — intro du configurateur devis
                </li>
              </ul>
            </div>
          </div>

          {/* Éditeur */}
          <div className="lg:col-span-8">
            {draft ? (
              <div className="rounded-2xl border border-ink/10 bg-white shadow-soft p-6 lg:p-8">
                <div className="grid sm:grid-cols-12 gap-3 mb-5">
                  <input
                    type="text"
                    value={draft.name}
                    onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                    className="sm:col-span-7 bg-cream border border-ink/12 rounded-xl px-4 py-2.5 text-base text-ink focus:border-copper focus:outline-none"
                    placeholder="Nom de l'expérience"
                  />
                  <select
                    value={draft.target}
                    onChange={(e) => setDraft({ ...draft, target: e.target.value as Experiment["target"] })}
                    className="sm:col-span-3 bg-cream border border-ink/12 rounded-xl px-4 py-2.5 text-sm text-ink focus:border-copper focus:outline-none"
                  >
                    <option value="home_hero_cta">Home hero CTA</option>
                    <option value="devis_step1_intro">Devis intro</option>
                  </select>
                  <button
                    onClick={() => setDraft({ ...draft, enabled: !draft.enabled })}
                    className={cn(
                      "sm:col-span-2 rounded-xl px-3 py-2.5 text-sm border",
                      draft.enabled
                        ? "border-[#22a06b]/40 bg-[#22a06b]/8 text-[#22a06b]"
                        : "border-ink/15 bg-white text-graphite",
                    )}
                  >
                    {draft.enabled ? "Active" : "Off"}
                  </button>
                </div>

                <input
                  type="text"
                  value={draft.description}
                  onChange={(e) => setDraft({ ...draft, description: e.target.value })}
                  placeholder="Hypothèse / description (interne)"
                  className="w-full bg-cream border border-ink/12 rounded-xl px-4 py-2.5 text-sm text-ink focus:border-copper focus:outline-none mb-5"
                />

                <div className="font-mono text-[10px] uppercase tracking-eyebrow text-copper mb-3 flex items-center justify-between">
                  <span>Variants</span>
                  <button
                    onClick={addVariant}
                    disabled={draft.variants.length >= 6}
                    className="text-xs text-graphite hover:text-copper inline-flex items-center gap-1 disabled:opacity-30"
                  >
                    <Plus className="h-3 w-3" />
                    Ajouter
                  </button>
                </div>
                <div className="grid gap-3 mb-6">
                  {draft.variants.map((v, i) => {
                    const exp = draft.exposures[v.id] ?? 0;
                    const conv = draft.conversions[v.id] ?? 0;
                    const rate = exp > 0 ? (conv / exp) * 100 : 0;
                    const isWinner = isCurrentWinner(draft, v.id);
                    return (
                      <div
                        key={v.id}
                        className={cn(
                          "p-4 rounded-xl border-2 transition-colors",
                          isWinner ? "border-[#22a06b]/40 bg-[#22a06b]/5" : "border-ink/8 bg-cream",
                        )}
                      >
                        <div className="grid sm:grid-cols-12 gap-3 mb-3 items-start">
                          <input
                            type="text"
                            value={v.label}
                            onChange={(e) => updateVariant(i, { label: e.target.value })}
                            className="sm:col-span-5 bg-white border border-ink/12 rounded-lg px-3 py-2 text-sm focus:border-copper focus:outline-none"
                          />
                          <div className="sm:col-span-3 flex items-center gap-2">
                            <input
                              type="number"
                              min={1}
                              max={100}
                              value={v.weight}
                              onChange={(e) => updateVariant(i, { weight: Number(e.target.value) || 1 })}
                              className="w-full bg-white border border-ink/12 rounded-lg px-3 py-2 text-sm tabular-nums focus:border-copper focus:outline-none"
                            />
                            <span className="text-xs text-muted">poids</span>
                          </div>
                          <div className="sm:col-span-3 flex items-center gap-2 text-xs">
                            <TrendingUp className="h-3.5 w-3.5 text-copper" />
                            <span className="tabular-nums">
                              {conv}/{exp} · {rate.toFixed(1)}%
                            </span>
                          </div>
                          <button
                            onClick={() => removeVariant(i)}
                            disabled={draft.variants.length <= 2}
                            className="sm:col-span-1 h-9 w-9 grid place-items-center rounded-lg text-graphite hover:text-ember disabled:opacity-30"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                        <div>
                          <div className="font-mono text-[10px] uppercase tracking-eyebrow text-muted mb-1.5">
                            Config (JSON · propagé au front)
                          </div>
                          <textarea
                            rows={3}
                            value={JSON.stringify(v.config, null, 2)}
                            onChange={(e) => {
                              try {
                                const parsed = JSON.parse(e.target.value);
                                updateVariant(i, { config: parsed });
                              } catch {
                                // ignore invalid JSON pendant la saisie
                              }
                            }}
                            className="w-full bg-white border border-ink/12 rounded-lg px-3 py-2 text-xs text-ink font-mono focus:border-copper focus:outline-none resize-none"
                          />
                        </div>
                        {isWinner && (
                          <div className="mt-2 flex items-center gap-2 text-xs text-[#22a06b]">
                            <Trophy className="h-3.5 w-3.5" />
                            Variant en tête (statistiquement provisoire)
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {error && (
                  <div className="mb-4 p-3 rounded-xl border border-ember/40 bg-ember/5 text-sm text-ember">
                    {error}
                  </div>
                )}

                <div className="flex items-center justify-between gap-3 pt-5 border-t border-ink/8">
                  <button
                    onClick={() => remove(draft.id)}
                    className="text-sm text-graphite hover:text-ember inline-flex items-center gap-1.5"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Supprimer
                  </button>
                  <button
                    onClick={save}
                    disabled={busy}
                    className={cn(
                      "inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium transition-colors",
                      busy ? "bg-ink/15 text-ink/40" : "bg-ink text-cream hover:bg-copper",
                    )}
                  >
                    {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    Enregistrer
                  </button>
                </div>
              </div>
            ) : (
              <div className="rounded-2xl border border-ink/10 bg-white p-12 text-center">
                <Beaker className="h-10 w-10 mx-auto text-ink/15" />
                <p className="mt-4 text-graphite">
                  Sélectionnez une expérience ou créez-en une nouvelle.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function countTotal(record: Record<string, number>): number {
  return Object.values(record).reduce((s, n) => s + n, 0);
}

function isCurrentWinner(exp: Experiment, variantId: string): boolean {
  let best = "";
  let bestRate = -1;
  for (const v of exp.variants) {
    const e = exp.exposures[v.id] ?? 0;
    if (e < 20) return false; // pas assez de données
    const c = exp.conversions[v.id] ?? 0;
    const rate = c / e;
    if (rate > bestRate) {
      bestRate = rate;
      best = v.id;
    }
  }
  return best === variantId;
}
