"use client";

/**
 * Planning auto-calculé.
 *
 * UI minimaliste : on définit (1) la liste de techs disponibles avec leurs
 * compétences/charge max/absences, (2) les interventions à placer (avec
 * effectif requis), puis on clique "Calculer le planning du mois" → on voit
 * les assignations + les non-planifiables avec raison.
 *
 * V1 stocke les inputs en localStorage pour pouvoir tester sans backend dédié.
 * V+1 : récupération auto depuis dispatch-store + tech-profiles-store.
 */

import { useState, useEffect, useCallback } from "react";
import {
  Wand2,
  Plus,
  Trash2,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Users,
  Wrench,
  Loader2,
} from "lucide-react";
import {
  AdminPageShell,
  KpiCard,
  SectionCard,
  EmptyState,
} from "@/components/admin/ui-kit";
import {
  DEFAULT_TEMPLATES,
  type AvailableTech,
  type InterventionToSchedule,
  type PlanningResult,
  type ServiceTag,
  type PriorityLevel,
} from "@/lib/planning-auto";
import { formatDateShort } from "@/lib/formatters";

const SERVICES: { id: ServiceTag; label: string }[] = [
  { id: "chaudiere", label: "Chaudière" },
  { id: "pac", label: "PAC" },
  { id: "clim", label: "Climatisation" },
  { id: "sanitaire", label: "Sanitaire" },
  { id: "enr", label: "ENR" },
  { id: "depannage", label: "Dépannage" },
  { id: "entretien", label: "Entretien" },
];

const PRIORITIES: { id: PriorityLevel; label: string; color: string }[] = [
  { id: "urgent", label: "Urgent", color: "#dc5a28" },
  { id: "haute", label: "Haute", color: "#b86a36" },
  { id: "normale", label: "Normale", color: "#6ba3c5" },
  { id: "basse", label: "Basse", color: "#8b847a" },
];

const STORAGE = "ca-planning-auto-inputs-v1";

type StoredInputs = {
  techs: AvailableTech[];
  interventions: InterventionToSchedule[];
};

const DEFAULT_INPUTS: StoredInputs = {
  techs: [
    {
      id: "t1",
      displayName: "Tech 1",
      servicesCovered: ["chaudiere", "pac", "depannage", "entretien"],
      maxPerDay: 3,
      absences: [],
    },
    {
      id: "t2",
      displayName: "Tech 2",
      servicesCovered: ["chaudiere", "sanitaire"],
      maxPerDay: 3,
      absences: [],
    },
    {
      id: "t3",
      displayName: "Tech 3",
      servicesCovered: ["pac", "clim", "enr"],
      maxPerDay: 3,
      absences: [],
    },
  ],
  interventions: [],
};

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

export default function PlanningAutoPage() {
  const [inputs, setInputs] = useState<StoredInputs>(DEFAULT_INPUTS);
  const [result, setResult] = useState<PlanningResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE);
      if (raw) setInputs(JSON.parse(raw));
    } catch {}
  }, []);

  const persist = useCallback((next: StoredInputs) => {
    setInputs(next);
    try {
      localStorage.setItem(STORAGE, JSON.stringify(next));
    } catch {}
  }, []);

  const addTech = () => {
    const id = `t${Date.now().toString(36).slice(-4)}`;
    persist({
      ...inputs,
      techs: [
        ...inputs.techs,
        {
          id,
          displayName: `Tech ${inputs.techs.length + 1}`,
          servicesCovered: ["chaudiere"],
          maxPerDay: 3,
          absences: [],
        },
      ],
    });
  };

  const updateTech = (id: string, patch: Partial<AvailableTech>) => {
    persist({
      ...inputs,
      techs: inputs.techs.map((t) => (t.id === id ? { ...t, ...patch } : t)),
    });
  };

  const removeTech = (id: string) => {
    persist({ ...inputs, techs: inputs.techs.filter((t) => t.id !== id) });
  };

  const addIntervention = () => {
    const id = `i${Date.now().toString(36).slice(-5)}`;
    const tpl = DEFAULT_TEMPLATES[0];
    persist({
      ...inputs,
      interventions: [
        ...inputs.interventions,
        {
          id,
          template: tpl,
          preferredDate: todayIso(),
          priority: "normale",
          title: tpl.label,
        },
      ],
    });
  };

  const updateIntervention = (
    id: string,
    patch: Partial<InterventionToSchedule>,
  ) => {
    persist({
      ...inputs,
      interventions: inputs.interventions.map((i) =>
        i.id === id ? { ...i, ...patch } : i,
      ),
    });
  };

  const removeIntervention = (id: string) => {
    persist({
      ...inputs,
      interventions: inputs.interventions.filter((i) => i.id !== id),
    });
  };

  const calc = async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/planning-auto", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          interventions: inputs.interventions,
          techs: inputs.techs,
          maxShiftDays: 14,
        }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error ?? "Erreur");
      setResult(d.result);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setBusy(false);
    }
  };

  const techById = new Map(inputs.techs.map((t) => [t.id, t]));
  const interById = new Map(inputs.interventions.map((i) => [i.id, i]));

  return (
    <AdminPageShell
      title="Planning auto-calculé"
      description="Définis les techs disponibles et les interventions à placer. L'algo trouve la meilleure répartition en tenant compte des compétences, des absences et de la priorité."
      actions={
        <button
          onClick={calc}
          disabled={busy || inputs.interventions.length === 0}
          className="inline-flex items-center gap-2 bg-ink text-cream px-5 py-2.5 rounded-full text-sm hover:bg-copper transition-colors disabled:opacity-50"
        >
          {busy ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Wand2 className="h-4 w-4" />
          )}
          Calculer le planning
        </button>
      }
    >
      {error && (
        <div className="mb-4 rounded-xl border border-ember/30 bg-ember/5 px-4 py-3 text-sm text-ember">
          {error}
        </div>
      )}

      <div className="grid lg:grid-cols-4 gap-4 mb-6">
        <KpiCard label="Techs" value={String(inputs.techs.length)} />
        <KpiCard label="Interventions à placer" value={String(inputs.interventions.length)} />
        <KpiCard
          label="Planifiées"
          value={String(result?.assignments.length ?? 0)}
          color={result ? "#22a06b" : undefined}
        />
        <KpiCard
          label="Non planifiables"
          value={String(result?.unassigned.length ?? 0)}
          color={result && result.unassigned.length > 0 ? "#dc5a28" : undefined}
        />
      </div>

      {/* Techs */}
      <SectionCard icon={Users} eyebrow="Techniciens disponibles" className="mb-6">
        <div className="p-5 space-y-3">
          {inputs.techs.map((t) => (
            <div key={t.id} className="rounded-xl bg-cream/40 p-3 grid lg:grid-cols-12 gap-2 items-center">
              <input
                value={t.displayName}
                onChange={(e) => updateTech(t.id, { displayName: e.target.value })}
                className="lg:col-span-2 bg-white border border-ink/12 rounded-md px-2 py-1.5 text-sm"
              />
              <div className="lg:col-span-6 flex flex-wrap gap-1">
                {SERVICES.map((s) => {
                  const checked = t.servicesCovered.includes(s.id);
                  return (
                    <button
                      key={s.id}
                      onClick={() =>
                        updateTech(t.id, {
                          servicesCovered: checked
                            ? t.servicesCovered.filter((x) => x !== s.id)
                            : [...t.servicesCovered, s.id],
                        })
                      }
                      className={`text-[10px] px-2 py-0.5 rounded-full border transition-colors ${
                        checked
                          ? "bg-ink text-cream border-ink"
                          : "bg-white border-ink/12 text-graphite hover:border-copper/40"
                      }`}
                    >
                      {s.label}
                    </button>
                  );
                })}
              </div>
              <div className="lg:col-span-1 flex items-center gap-1 text-xs">
                <span className="text-muted">Max/j :</span>
                <input
                  type="number"
                  min={1}
                  max={10}
                  value={t.maxPerDay ?? 3}
                  onChange={(e) =>
                    updateTech(t.id, { maxPerDay: Number(e.target.value) || 1 })
                  }
                  className="w-12 bg-white border border-ink/12 rounded-md px-1 py-0.5 text-xs text-right"
                />
              </div>
              <div className="lg:col-span-2 text-xs">
                <span className="text-muted">Absences :</span>{" "}
                <input
                  value={(t.absences ?? []).join(",")}
                  onChange={(e) =>
                    updateTech(t.id, {
                      absences: e.target.value
                        .split(",")
                        .map((s) => s.trim())
                        .filter(Boolean),
                    })
                  }
                  placeholder="YYYY-MM-DD,..."
                  className="w-full bg-white border border-ink/12 rounded-md px-2 py-1 text-xs font-mono"
                />
              </div>
              <button
                onClick={() => removeTech(t.id)}
                className="lg:col-span-1 text-graphite hover:text-ember justify-self-end"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
          <button
            onClick={addTech}
            className="text-xs text-copper hover:underline inline-flex items-center gap-1"
          >
            <Plus className="h-3 w-3" /> Ajouter un tech
          </button>
        </div>
      </SectionCard>

      {/* Interventions */}
      <SectionCard icon={Wrench} eyebrow="Interventions à placer" className="mb-6">
        <div className="p-5 space-y-3">
          {inputs.interventions.length === 0 ? (
            <EmptyState
              icon={Wrench}
              title="Aucune intervention"
              body="Ajoutez les interventions à placer (issues des devis acceptés, des entretiens à programmer, etc.)"
            />
          ) : (
            inputs.interventions.map((i) => (
              <div key={i.id} className="rounded-xl bg-cream/40 p-3 grid lg:grid-cols-12 gap-2 items-center">
                <input
                  value={i.title}
                  onChange={(e) => updateIntervention(i.id, { title: e.target.value })}
                  className="lg:col-span-3 bg-white border border-ink/12 rounded-md px-2 py-1.5 text-sm"
                  placeholder="Titre"
                />
                <select
                  value={`${i.template.service}|${i.template.label}`}
                  onChange={(e) => {
                    const [service, label] = e.target.value.split("|");
                    const tpl =
                      DEFAULT_TEMPLATES.find(
                        (t) => t.service === service && t.label === label,
                      ) ?? DEFAULT_TEMPLATES[0];
                    updateIntervention(i.id, { template: tpl });
                  }}
                  className="lg:col-span-3 bg-white border border-ink/12 rounded-md px-2 py-1.5 text-xs"
                >
                  {DEFAULT_TEMPLATES.map((t) => (
                    <option key={t.label} value={`${t.service}|${t.label}`}>
                      {t.label} ({t.requiredHeadcount} tech, {t.estimatedHours}h)
                    </option>
                  ))}
                </select>
                <input
                  type="date"
                  value={i.preferredDate}
                  onChange={(e) => updateIntervention(i.id, { preferredDate: e.target.value })}
                  className="lg:col-span-2 bg-white border border-ink/12 rounded-md px-2 py-1.5 text-xs"
                />
                <select
                  value={i.priority}
                  onChange={(e) => updateIntervention(i.id, { priority: e.target.value as PriorityLevel })}
                  className="lg:col-span-2 bg-white border border-ink/12 rounded-md px-2 py-1.5 text-xs"
                >
                  {PRIORITIES.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.label}
                    </option>
                  ))}
                </select>
                <input
                  value={i.leadReference ?? ""}
                  onChange={(e) => updateIntervention(i.id, { leadReference: e.target.value || undefined })}
                  placeholder="DEV-…"
                  className="lg:col-span-1 bg-white border border-ink/12 rounded-md px-2 py-1.5 text-xs font-mono"
                />
                <button
                  onClick={() => removeIntervention(i.id)}
                  className="lg:col-span-1 text-graphite hover:text-ember justify-self-end"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))
          )}
          <button
            onClick={addIntervention}
            className="text-xs text-copper hover:underline inline-flex items-center gap-1"
          >
            <Plus className="h-3 w-3" /> Ajouter une intervention
          </button>
        </div>
      </SectionCard>

      {/* Résultat */}
      {result && (
        <>
          <SectionCard icon={CheckCircle2} eyebrow={`Planifié (${result.assignments.length})`} className="mb-4">
            {result.assignments.length === 0 ? (
              <EmptyState icon={Calendar} title="Rien planifié" body="Vérifie tes inputs." />
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-cream/30 text-left text-xs text-graphite">
                    <th className="px-5 py-2 font-mono uppercase tracking-eyebrow">Intervention</th>
                    <th className="px-3 py-2 font-mono uppercase tracking-eyebrow">Date</th>
                    <th className="px-3 py-2 font-mono uppercase tracking-eyebrow">Décalage</th>
                    <th className="px-5 py-2 font-mono uppercase tracking-eyebrow">Tech(s)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ink/5">
                  {result.assignments.map((a) => {
                    const inter = interById.get(a.interventionId);
                    const techs = a.assignedTechIds
                      .map((tid) => techById.get(tid)?.displayName ?? tid)
                      .join(", ");
                    return (
                      <tr key={a.interventionId} className="hover:bg-cream/30">
                        <td className="px-5 py-2.5 text-ink">{inter?.title ?? a.interventionId}</td>
                        <td className="px-3 py-2.5 font-mono text-xs text-ink">
                          {formatDateShort(a.scheduledDate)}
                        </td>
                        <td className="px-3 py-2.5 text-xs">
                          {a.shiftDays === 0 ? (
                            <span className="text-[#22a06b]">Date demandée</span>
                          ) : (
                            <span className="text-copper">+{a.shiftDays} j</span>
                          )}
                        </td>
                        <td className="px-5 py-2.5 text-xs text-graphite">{techs}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </SectionCard>

          {result.unassigned.length > 0 && (
            <SectionCard icon={AlertTriangle} eyebrow={`Non planifiable (${result.unassigned.length})`} accentColor="#dc5a28">
              <ul className="divide-y divide-ink/5">
                {result.unassigned.map((u) => {
                  const inter = interById.get(u.interventionId);
                  return (
                    <li key={u.interventionId} className="px-5 py-3 text-sm">
                      <div className="text-ink font-medium">{inter?.title ?? u.interventionId}</div>
                      <div className="text-xs text-ember mt-0.5">{u.reason}</div>
                    </li>
                  );
                })}
              </ul>
            </SectionCard>
          )}

          <div className="mt-4 rounded-xl border border-ink/10 bg-white shadow-soft p-4">
            <div className="font-mono text-[10px] uppercase tracking-eyebrow text-copper mb-2">
              Charge par tech sur la période
            </div>
            <div className="flex flex-wrap gap-2 text-xs">
              {inputs.techs.map((t) => (
                <span
                  key={t.id}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cream/40"
                >
                  <span className="text-ink font-medium">{t.displayName}</span>
                  <span className="font-mono text-copper">
                    {result.techLoad[t.id] ?? 0} interv.
                  </span>
                </span>
              ))}
            </div>
          </div>
        </>
      )}

      <p className="mt-6 text-xs text-muted">
        Algorithme greedy : trie par priorité (urgent d&apos;abord), puis pour chaque intervention
        avance jour par jour jusqu&apos;à trouver assez de techs compétents et disponibles. En cas
        d&apos;absence, le bouton Calculer relance pour redistribuer.
      </p>
    </AdminPageShell>
  );
}
