"use client";

/**
 * Éditeur de règles custom de scoring lead.
 *
 * Les règles s'ajoutent au scoring par défaut (lib/lead-scoring.ts).
 * Chaque règle = condition sur un champ + delta points.
 */

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Loader2,
  Plus,
  Trash2,
  Save,
  Check,
  Code,
  Info,
} from "lucide-react";
import { cn } from "@/lib/utils";

type Rule = {
  id: string;
  label: string;
  field: string;
  op: "eq" | "in" | "contains" | "gte" | "lte" | "exists";
  value: string | number | string[];
  points: number;
  enabled: boolean;
};

const FIELD_SUGGESTIONS = [
  { field: "commune", label: "Commune", ops: ["eq", "contains", "in"] },
  { field: "services", label: "Services choisis", ops: ["in", "contains"] },
  { field: "level", label: "Niveau (hot/warm/cold)", ops: ["eq"] },
  { field: "score", label: "Score base", ops: ["gte", "lte"] },
  { field: "surface", label: "Surface m²", ops: ["gte", "lte"] },
  { field: "timeline", label: "Timeline", ops: ["eq", "in"] },
  { field: "budget", label: "Budget", ops: ["eq", "in"] },
  { field: "buildingType", label: "Type bâtiment", ops: ["eq"] },
  { field: "currentEnergy", label: "Énergie actuelle", ops: ["eq", "in"] },
  { field: "construction", label: "Neuf / rénov", ops: ["eq"] },
  { field: "preferredChannel", label: "Canal préféré", ops: ["eq"] },
  { field: "metadata.tags", label: "Tags assignés", ops: ["contains", "in"] },
  { field: "assignedTo", label: "Assigné à", ops: ["eq", "exists"] },
];

const OP_LABELS: Record<Rule["op"], string> = {
  eq: "égal à",
  in: "dans la liste",
  contains: "contient",
  gte: "supérieur ou égal à",
  lte: "inférieur ou égal à",
  exists: "défini",
};

export default function ScoringRulesPage() {
  const router = useRouter();
  const [rules, setRules] = useState<Rule[] | null>(null);
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const res = await fetch("/api/admin/scoring-rules", { cache: "no-store" });
    if (res.status === 401) {
      router.replace("/admin/login");
      return;
    }
    if (res.ok) {
      const d = await res.json();
      setRules(d.rules ?? []);
      setUpdatedAt(d.updatedAt);
      setDirty(false);
    }
  }, [router]);

  useEffect(() => {
    load();
  }, [load]);

  const update = (id: string, patch: Partial<Rule>) => {
    if (!rules) return;
    setRules(rules.map((r) => (r.id === id ? { ...r, ...patch } : r)));
    setDirty(true);
  };

  const add = () => {
    if (!rules) return;
    setRules([
      ...rules,
      {
        id: `tmp-${Date.now()}`,
        label: "Nouvelle règle",
        field: "commune",
        op: "eq",
        value: "",
        points: 5,
        enabled: true,
      },
    ]);
    setDirty(true);
  };

  const remove = (id: string) => {
    if (!rules) return;
    setRules(rules.filter((r) => r.id !== id));
    setDirty(true);
  };

  const save = async () => {
    if (!rules) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/scoring-rules", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rules }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error ?? "Erreur");
      setRules(d.rules);
      setUpdatedAt(d.updatedAt);
      setDirty(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-cream py-10 lg:py-14">
      <div className="container max-w-4xl">
        <Link
          href="/admin/leads"
          className="inline-flex items-center gap-2 text-sm font-mono uppercase tracking-eyebrow text-graphite hover:text-copper transition-colors mb-6"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Retour pipeline
        </Link>

        <div className="flex items-start justify-between gap-4 flex-wrap mb-8">
          <div>
            <h1 className="font-display text-display-md text-ink">
              Règles scoring custom
            </h1>
            <p className="mt-2 text-graphite">
              Ajoute / soustrait des points au scoring par défaut selon vos
              propres critères. Évaluation à chaque lecture (pas de recalcul
              persisté).
              {updatedAt && (
                <span className="text-muted">
                  {" "}
                  · Modifié {new Date(updatedAt).toLocaleString("fr-FR")}
                </span>
              )}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={add}
              className="inline-flex items-center gap-1.5 rounded-full bg-white border border-ink/15 px-4 py-2 text-sm hover:border-copper/40"
            >
              <Plus className="h-3.5 w-3.5" />
              Règle
            </button>
            <button
              onClick={save}
              disabled={busy || !dirty}
              className="inline-flex items-center gap-1.5 rounded-full bg-ink text-cream px-4 py-2 text-sm hover:bg-copper disabled:opacity-40"
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
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl border border-ember/40 bg-ember/5 text-sm text-ember">
            {error}
          </div>
        )}

        <div className="mb-6 rounded-2xl border border-copper/30 bg-copper/5 p-4 flex items-start gap-2">
          <Info className="h-4 w-4 text-copper shrink-0 mt-0.5" />
          <div className="text-xs text-graphite leading-relaxed">
            Champs disponibles :{" "}
            {FIELD_SUGGESTIONS.map((f) => (
              <code key={f.field} className="font-mono bg-white px-1 mx-0.5 rounded">
                {f.field}
              </code>
            ))}
            . Opérateurs : eq, in (liste séparée par virgule), contains, gte,
            lte, exists.
          </div>
        </div>

        {rules === null ? (
          <div className="py-16 text-center text-muted">
            <Loader2 className="h-6 w-6 animate-spin mx-auto" />
          </div>
        ) : rules.length === 0 ? (
          <div className="rounded-2xl border border-ink/10 bg-white shadow-soft py-16 text-center text-muted">
            <Code className="h-12 w-12 mx-auto opacity-20 text-copper mb-2" />
            <p>Aucune règle custom — le scoring par défaut s&apos;applique.</p>
          </div>
        ) : (
          <ul className="grid gap-3">
            {rules.map((r) => (
              <li
                key={r.id}
                className={cn(
                  "rounded-2xl border bg-white shadow-soft p-4",
                  r.enabled ? "border-ink/10" : "border-ink/5 opacity-60",
                )}
              >
                <div className="grid gap-2">
                  <div className="flex items-center gap-2">
                    <input
                      value={r.label}
                      onChange={(e) => update(r.id, { label: e.target.value })}
                      placeholder="Libellé descriptif…"
                      className="flex-1 bg-cream border border-ink/12 rounded-xl px-3 py-2 text-sm font-medium focus:border-copper focus:outline-none"
                    />
                    <label className="inline-flex items-center gap-1 text-xs text-graphite cursor-pointer">
                      <input
                        type="checkbox"
                        checked={r.enabled}
                        onChange={(e) =>
                          update(r.id, { enabled: e.target.checked })
                        }
                      />
                      Actif
                    </label>
                    <button
                      onClick={() => remove(r.id)}
                      className="h-7 w-7 grid place-items-center rounded-full bg-cream border border-ember/30 text-ember hover:bg-ember hover:text-cream"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                  <div className="grid lg:grid-cols-12 gap-2">
                    <input
                      value={r.field}
                      onChange={(e) => update(r.id, { field: e.target.value })}
                      placeholder="champ"
                      list={`fields-${r.id}`}
                      className="lg:col-span-4 bg-cream border border-ink/12 rounded-xl px-3 py-2 text-xs font-mono focus:border-copper focus:outline-none"
                    />
                    <datalist id={`fields-${r.id}`}>
                      {FIELD_SUGGESTIONS.map((f) => (
                        <option key={f.field} value={f.field}>
                          {f.label}
                        </option>
                      ))}
                    </datalist>
                    <select
                      value={r.op}
                      onChange={(e) =>
                        update(r.id, { op: e.target.value as Rule["op"] })
                      }
                      className="lg:col-span-3 bg-cream border border-ink/12 rounded-xl px-3 py-2 text-xs focus:border-copper focus:outline-none"
                    >
                      {(Object.entries(OP_LABELS) as [Rule["op"], string][]).map(
                        ([k, label]) => (
                          <option key={k} value={k}>
                            {label}
                          </option>
                        ),
                      )}
                    </select>
                    <input
                      value={String(r.value)}
                      onChange={(e) => update(r.id, { value: e.target.value })}
                      disabled={r.op === "exists"}
                      placeholder="valeur"
                      className="lg:col-span-3 bg-cream border border-ink/12 rounded-xl px-3 py-2 text-xs font-mono focus:border-copper focus:outline-none disabled:opacity-50"
                    />
                    <div className="lg:col-span-2 inline-flex items-center gap-1 bg-cream border border-ink/12 rounded-xl px-2 py-1">
                      <input
                        type="number"
                        value={r.points}
                        onChange={(e) =>
                          update(r.id, { points: Number(e.target.value) })
                        }
                        className="flex-1 bg-transparent text-sm font-mono tabular-nums text-right focus:outline-none"
                      />
                      <span className="text-[10px] text-muted">pts</span>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}

        <p className="mt-4 text-xs text-muted">
          Astuce : commencez par tester avec un petit bonus (+5). Les leads
          existants ne sont pas recalculés — l&apos;effet est visible sur les
          nouveaux et à la prochaine update de leur statut.
        </p>
      </div>
    </div>
  );
}
