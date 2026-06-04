"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Plus,
  Save,
  Trash2,
  Zap,
  Loader2,
  AlertCircle,
  Power,
} from "lucide-react";
import type { AutomationRule, Condition, Action } from "@/lib/automations-store";
import { cn } from "@/lib/utils";

const EMPTY_RULE: Omit<AutomationRule, "id" | "createdAt" | "updatedAt"> = {
  name: "Nouvelle règle",
  enabled: true,
  trigger: "lead.created",
  conditions: [],
  actions: [{ type: "setStatus", status: "contacte" }],
  runs: 0,
};

export default function AutomationsPage() {
  const router = useRouter();
  const [rules, setRules] = useState<AutomationRule[] | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [draft, setDraft] = useState<AutomationRule | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = async () => {
    const res = await fetch("/api/admin/automations", { cache: "no-store" });
    if (res.status === 401) {
      router.replace("/admin/login");
      return;
    }
    const data = await res.json();
    setRules(data.rules ?? []);
    if (!activeId && data.rules?.[0]) {
      setActiveId(data.rules[0].id);
      setDraft(data.rules[0]);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  useEffect(() => {
    if (activeId && rules) {
      const r = rules.find((x) => x.id === activeId);
      if (r) setDraft(r);
    }
  }, [activeId, rules]);

  const createNew = () => {
    const id = `rule-${Date.now()}`;
    const rule: AutomationRule = { ...EMPTY_RULE, id };
    setRules((rs) => (rs ? [...rs, rule] : [rule]));
    setActiveId(id);
    setDraft(rule);
  };

  const save = async () => {
    if (!draft) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/automations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(draft),
      });
      const data = await res.json();
      if (res.ok) {
        await refresh();
      } else {
        setError(data.error ?? "Erreur");
      }
    } finally {
      setBusy(false);
    }
  };

  const remove = async (id: string) => {
    if (!confirm("Supprimer cette règle ?")) return;
    const res = await fetch(`/api/admin/automations?id=${encodeURIComponent(id)}`, {
      method: "DELETE",
    });
    if (res.ok) {
      setActiveId(null);
      setDraft(null);
      await refresh();
    }
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
              Automations
            </h1>
            <p className="mt-2 text-graphite">
              Règles if-then pour automatiser les actions sur les nouveaux leads.
            </p>
          </div>
          <button
            onClick={createNew}
            className="inline-flex items-center gap-2 rounded-full bg-ink text-cream px-5 py-2.5 text-sm font-medium hover:bg-copper transition-colors"
          >
            <Plus className="h-4 w-4" />
            Nouvelle règle
          </button>
        </div>

        <div className="grid lg:grid-cols-12 gap-6">
          {/* Liste */}
          <div className="lg:col-span-4">
            <div className="rounded-2xl border border-ink/10 bg-white shadow-soft p-3">
              {rules === null ? (
                <div className="p-6 text-center text-muted text-sm">Chargement…</div>
              ) : rules.length === 0 ? (
                <div className="p-6 text-center text-muted text-sm">
                  Aucune règle. Cliquez « Nouvelle règle » pour commencer.
                </div>
              ) : (
                <ul className="grid gap-1">
                  {rules.map((r) => (
                    <li key={r.id}>
                      <button
                        onClick={() => setActiveId(r.id)}
                        className={cn(
                          "w-full text-left px-4 py-3 rounded-xl transition-colors flex items-start gap-3",
                          activeId === r.id
                            ? "bg-ink text-cream"
                            : "bg-cream/50 hover:bg-cream text-ink",
                        )}
                      >
                        <Zap
                          className={cn(
                            "h-4 w-4 mt-0.5 shrink-0",
                            r.enabled
                              ? activeId === r.id
                                ? "text-copper"
                                : "text-copper"
                              : "text-muted",
                          )}
                        />
                        <div className="min-w-0 flex-1">
                          <div className="font-medium text-sm truncate flex items-center gap-2">
                            {r.name}
                            {!r.enabled && (
                              <span
                                className="text-[9px] font-mono uppercase tracking-eyebrow opacity-60"
                              >
                                Off
                              </span>
                            )}
                          </div>
                          <div
                            className={cn(
                              "text-xs truncate",
                              activeId === r.id ? "text-cream/70" : "text-muted",
                            )}
                          >
                            {r.conditions.length === 0
                              ? "Tous nouveaux leads"
                              : `${r.conditions.length} condition(s)`}{" "}
                            · {r.actions.length} action(s) · {r.runs ?? 0}×
                          </div>
                        </div>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Aide */}
            <div className="mt-4 p-4 rounded-2xl border border-copper/30 bg-copper/5">
              <div className="font-mono text-[10px] uppercase tracking-eyebrow text-copper mb-2">
                Exemple de règle
              </div>
              <p className="text-xs text-graphite leading-relaxed">
                « Si <code className="font-mono">level = hot</code> ET{" "}
                <code className="font-mono">timeline = urgent</code> → envoyer
                template « 1er contact » + ajouter note ‘à rappeler dans 1h’. »
              </p>
            </div>
          </div>

          {/* Éditeur */}
          <div className="lg:col-span-8">
            {draft ? (
              <RuleEditor
                draft={draft}
                onChange={setDraft}
                onSave={save}
                onDelete={() => remove(draft.id)}
                busy={busy}
              />
            ) : (
              <div className="rounded-2xl border border-ink/10 bg-white p-12 text-center">
                <AlertCircle className="h-10 w-10 mx-auto text-ink/15" />
                <p className="mt-4 text-graphite">
                  Sélectionnez une règle à gauche, ou créez-en une nouvelle.
                </p>
              </div>
            )}
            {error && (
              <div className="mt-4 p-3 rounded-xl border border-ember/40 bg-ember/5 text-sm text-ember">
                {error}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─────────────── Editor ─────────────── */

function RuleEditor({
  draft,
  onChange,
  onSave,
  onDelete,
  busy,
}: {
  draft: AutomationRule;
  onChange: (r: AutomationRule) => void;
  onSave: () => void;
  onDelete: () => void;
  busy: boolean;
}) {
  const addCondition = () => {
    onChange({
      ...draft,
      conditions: [
        ...draft.conditions,
        { field: "level", op: "in", values: ["hot"] } as Condition,
      ],
    });
  };

  const removeCondition = (i: number) => {
    onChange({
      ...draft,
      conditions: draft.conditions.filter((_, idx) => idx !== i),
    });
  };

  const updateCondition = (i: number, cond: Condition) => {
    const next = [...draft.conditions];
    next[i] = cond;
    onChange({ ...draft, conditions: next });
  };

  const addAction = () => {
    onChange({
      ...draft,
      actions: [...draft.actions, { type: "addNote", text: "" } as Action],
    });
  };

  const removeAction = (i: number) => {
    if (draft.actions.length <= 1) return;
    onChange({ ...draft, actions: draft.actions.filter((_, idx) => idx !== i) });
  };

  const updateAction = (i: number, action: Action) => {
    const next = [...draft.actions];
    next[i] = action;
    onChange({ ...draft, actions: next });
  };

  return (
    <div className="rounded-2xl border border-ink/10 bg-white shadow-soft p-6 lg:p-8">
      <div className="grid sm:grid-cols-12 gap-3 items-start mb-6">
        <input
          type="text"
          value={draft.name}
          onChange={(e) => onChange({ ...draft, name: e.target.value })}
          className="sm:col-span-8 bg-cream border border-ink/12 rounded-xl px-4 py-2.5 text-base text-ink focus:border-copper focus:outline-none"
          placeholder="Nom de la règle"
        />
        <button
          onClick={() => onChange({ ...draft, enabled: !draft.enabled })}
          className={cn(
            "sm:col-span-2 inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium border transition-colors",
            draft.enabled
              ? "border-[#22a06b]/40 bg-[#22a06b]/8 text-[#22a06b]"
              : "border-ink/15 bg-white text-graphite",
          )}
        >
          <Power className="h-3.5 w-3.5" />
          {draft.enabled ? "Active" : "Désactivée"}
        </button>
        <button
          onClick={onDelete}
          className="sm:col-span-2 inline-flex items-center justify-center gap-2 rounded-xl border border-ember/40 px-4 py-2.5 text-sm text-ember hover:bg-ember/10 transition-colors"
        >
          <Trash2 className="h-3.5 w-3.5" />
          Supprimer
        </button>
      </div>

      {/* WHEN */}
      <div className="font-mono text-[10px] uppercase tracking-eyebrow text-copper mb-2">
        Quand
      </div>
      <div className="p-3 rounded-xl bg-cream border border-ink/8 mb-5">
        <span className="text-sm text-graphite">Un nouveau lead est créé.</span>
      </div>

      {/* IF */}
      <div className="flex items-center justify-between mb-2">
        <div className="font-mono text-[10px] uppercase tracking-eyebrow text-copper">
          Si (toutes les conditions ci-dessous matchent — AND)
        </div>
        <button
          onClick={addCondition}
          className="text-xs font-mono uppercase tracking-eyebrow text-graphite hover:text-copper inline-flex items-center gap-1"
        >
          <Plus className="h-3 w-3" />
          Ajouter
        </button>
      </div>
      <div className="grid gap-2 mb-5">
        {draft.conditions.length === 0 ? (
          <div className="p-3 rounded-xl bg-cream border border-ink/8 text-sm text-muted text-center">
            Aucune condition · la règle s&apos;applique à <strong>tous</strong> les nouveaux leads.
          </div>
        ) : (
          draft.conditions.map((c, i) => (
            <ConditionRow
              key={i}
              cond={c}
              onChange={(next) => updateCondition(i, next)}
              onRemove={() => removeCondition(i)}
            />
          ))
        )}
      </div>

      {/* THEN */}
      <div className="flex items-center justify-between mb-2">
        <div className="font-mono text-[10px] uppercase tracking-eyebrow text-copper">
          Alors (actions appliquées dans l&apos;ordre)
        </div>
        <button
          onClick={addAction}
          className="text-xs font-mono uppercase tracking-eyebrow text-graphite hover:text-copper inline-flex items-center gap-1"
        >
          <Plus className="h-3 w-3" />
          Ajouter
        </button>
      </div>
      <div className="grid gap-2 mb-6">
        {draft.actions.map((a, i) => (
          <ActionRow
            key={i}
            action={a}
            onChange={(next) => updateAction(i, next)}
            onRemove={() => removeAction(i)}
            canRemove={draft.actions.length > 1}
          />
        ))}
      </div>

      {/* Save */}
      <div className="pt-5 border-t border-ink/8 flex items-center justify-between gap-3">
        <span className="text-xs text-muted">
          {draft.runs ?? 0} exécution(s) ·{" "}
          {draft.lastRunAt
            ? `dernière · ${new Date(draft.lastRunAt).toLocaleString("fr-FR")}`
            : "jamais déclenchée"}
        </span>
        <button
          onClick={onSave}
          disabled={busy}
          className={cn(
            "inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium transition-colors",
            busy ? "bg-ink/15 text-ink/40 cursor-not-allowed" : "bg-ink text-cream hover:bg-copper",
          )}
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Enregistrer
        </button>
      </div>
    </div>
  );
}

function ConditionRow({
  cond,
  onChange,
  onRemove,
}: {
  cond: Condition;
  onChange: (c: Condition) => void;
  onRemove: () => void;
}) {
  return (
    <div className="p-3 rounded-xl bg-cream border border-ink/8 flex gap-2 items-start flex-wrap">
      <select
        value={cond.field}
        onChange={(e) => {
          const field = e.target.value as Condition["field"];
          if (field === "level") onChange({ field: "level", op: "in", values: ["hot"] });
          else if (field === "timeline")
            onChange({ field: "timeline", op: "in", values: ["urgent"] });
          else if (field === "budget")
            onChange({ field: "budget", op: "in", values: ["40plus"] });
          else if (field === "service")
            onChange({ field: "service", op: "contains", values: ["pac"] });
          else if (field === "surface") onChange({ field: "surface", op: ">=", value: 200 });
          else if (field === "commune")
            onChange({ field: "commune", op: "equals", value: "Luxembourg-Ville" });
        }}
        className="bg-white border border-ink/12 rounded-lg px-3 py-2 text-sm focus:border-copper focus:outline-none"
      >
        <option value="level">Niveau (hot/warm/cold)</option>
        <option value="timeline">Délai</option>
        <option value="budget">Budget</option>
        <option value="service">Service</option>
        <option value="surface">Surface (m²)</option>
        <option value="commune">Commune</option>
      </select>

      {cond.field === "level" || cond.field === "timeline" || cond.field === "budget" || cond.field === "service" ? (
        <>
          <select
            value={cond.op}
            onChange={(e) => onChange({ ...cond, op: e.target.value } as typeof cond)}
            className="bg-white border border-ink/12 rounded-lg px-3 py-2 text-sm focus:border-copper focus:outline-none"
          >
            <option value={cond.field === "service" ? "contains" : "in"}>
              {cond.field === "service" ? "Inclut" : "Est"}
            </option>
            <option value={cond.field === "service" ? "not_contains" : "not_in"}>
              {cond.field === "service" ? "N'inclut pas" : "N'est pas"}
            </option>
          </select>
          <input
            type="text"
            placeholder="valeurs séparées par virgule"
            value={(cond.values as string[]).join(",")}
            onChange={(e) => {
              const values = e.target.value
                .split(",")
                .map((v) => v.trim())
                .filter(Boolean);
              if (values.length > 0) {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                onChange({ ...cond, values: values as any });
              }
            }}
            className="flex-1 min-w-[160px] bg-white border border-ink/12 rounded-lg px-3 py-2 text-sm font-mono focus:border-copper focus:outline-none"
          />
        </>
      ) : cond.field === "surface" ? (
        <>
          <select
            value={cond.op}
            onChange={(e) => onChange({ ...cond, op: e.target.value as typeof cond.op })}
            className="bg-white border border-ink/12 rounded-lg px-3 py-2 text-sm focus:border-copper focus:outline-none"
          >
            <option value=">=">≥</option>
            <option value="<=">≤</option>
            <option value="==">=</option>
          </select>
          <input
            type="number"
            value={cond.value}
            onChange={(e) => onChange({ ...cond, value: Number(e.target.value) || 0 })}
            className="w-24 bg-white border border-ink/12 rounded-lg px-3 py-2 text-sm font-mono focus:border-copper focus:outline-none tabular-nums"
          />
          <span className="px-2 py-2 text-sm text-muted">m²</span>
        </>
      ) : (
        // commune
        <>
          <select
            value={cond.op}
            onChange={(e) => onChange({ ...cond, op: e.target.value as typeof cond.op })}
            className="bg-white border border-ink/12 rounded-lg px-3 py-2 text-sm focus:border-copper focus:outline-none"
          >
            <option value="equals">Égale</option>
            <option value="contains">Contient</option>
          </select>
          <input
            type="text"
            value={cond.value}
            onChange={(e) => onChange({ ...cond, value: e.target.value })}
            placeholder="Luxembourg-Ville"
            className="flex-1 min-w-[160px] bg-white border border-ink/12 rounded-lg px-3 py-2 text-sm focus:border-copper focus:outline-none"
          />
        </>
      )}

      <button
        onClick={onRemove}
        className="h-9 w-9 grid place-items-center rounded-lg text-graphite hover:text-ember hover:bg-ember/10 transition-colors"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );
}

function ActionRow({
  action,
  onChange,
  onRemove,
  canRemove,
}: {
  action: Action;
  onChange: (a: Action) => void;
  onRemove: () => void;
  canRemove: boolean;
}) {
  return (
    <div className="p-3 rounded-xl bg-cream border border-ink/8 flex gap-2 items-start flex-wrap">
      <select
        value={action.type}
        onChange={(e) => {
          const t = e.target.value as Action["type"];
          if (t === "setStatus") onChange({ type: "setStatus", status: "contacte" });
          else if (t === "sendTemplate") onChange({ type: "sendTemplate", templateId: "first-contact" });
          else if (t === "addNote") onChange({ type: "addNote", text: "" });
        }}
        className="bg-white border border-ink/12 rounded-lg px-3 py-2 text-sm focus:border-copper focus:outline-none"
      >
        <option value="setStatus">Changer statut</option>
        <option value="sendTemplate">Envoyer template email</option>
        <option value="addNote">Ajouter une note</option>
      </select>

      {action.type === "setStatus" && (
        <select
          value={action.status}
          onChange={(e) => onChange({ ...action, status: e.target.value as typeof action.status })}
          className="bg-white border border-ink/12 rounded-lg px-3 py-2 text-sm focus:border-copper focus:outline-none"
        >
          <option value="nouveau">Nouveau</option>
          <option value="contacte">Contacté</option>
          <option value="devis_envoye">Devis envoyé</option>
          <option value="converti">Converti</option>
          <option value="perdu">Perdu</option>
        </select>
      )}

      {action.type === "sendTemplate" && (
        <input
          type="text"
          value={action.templateId}
          onChange={(e) => onChange({ ...action, templateId: e.target.value })}
          placeholder="ID du template (ex: first-contact)"
          className="flex-1 min-w-[200px] bg-white border border-ink/12 rounded-lg px-3 py-2 text-sm font-mono focus:border-copper focus:outline-none"
        />
      )}

      {action.type === "addNote" && (
        <input
          type="text"
          value={action.text}
          onChange={(e) => onChange({ ...action, text: e.target.value })}
          placeholder="Note à ajouter"
          className="flex-1 min-w-[200px] bg-white border border-ink/12 rounded-lg px-3 py-2 text-sm focus:border-copper focus:outline-none"
        />
      )}

      <button
        onClick={onRemove}
        disabled={!canRemove}
        className="h-9 w-9 grid place-items-center rounded-lg text-graphite hover:text-ember hover:bg-ember/10 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );
}
