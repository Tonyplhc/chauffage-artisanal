"use client";

/**
 * Gestionnaire de suivi de chantier pour la fiche lead.
 *
 * Édition inline des milestones : titre, statut (planifié/en cours/terminé),
 * dates planifiée et de réalisation. Notes publiques (visibles dans l'espace
 * client) et notes internes (admin uniquement).
 */

import { useEffect, useState, useCallback } from "react";
import {
  Wrench,
  Loader2,
  Plus,
  Save,
  Trash2,
  Check,
  Circle,
  CircleDot,
  CheckCircle2,
} from "lucide-react";
import { cn } from "@/lib/utils";

type Milestone = {
  id: string;
  title: string;
  description?: string;
  status: "planned" | "in_progress" | "done";
  plannedAt?: string;
  completedAt?: string;
};

type Project = {
  leadReference: string;
  milestones: Milestone[];
  notesPublic?: string;
  notesInternal?: string;
  contactName?: string;
  contactPhone?: string;
  createdAt: string;
  updatedAt: string;
};

function statusLabel(s: Milestone["status"]) {
  if (s === "done") return "Terminé";
  if (s === "in_progress") return "En cours";
  return "Planifié";
}

function statusColor(s: Milestone["status"]) {
  if (s === "done") return "#22a06b";
  if (s === "in_progress") return "#b86a36";
  return "#8b847a";
}

function nextStatus(s: Milestone["status"]): Milestone["status"] {
  if (s === "planned") return "in_progress";
  if (s === "in_progress") return "done";
  return "planned";
}

export function LeadProjectBlock({ reference }: { reference: string }) {
  const [project, setProject] = useState<Project | null>(null);
  const [dirty, setDirty] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const res = await fetch(`/api/admin/leads/${reference}/project`, {
      cache: "no-store",
    });
    if (res.ok) {
      const d = await res.json();
      setProject(d.project);
      setDirty(false);
    }
  }, [reference]);

  useEffect(() => {
    load();
  }, [load]);

  const save = async () => {
    if (!project) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/leads/${reference}/project`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          milestones: project.milestones,
          notesPublic: project.notesPublic ?? "",
          notesInternal: project.notesInternal ?? "",
          contactName: project.contactName ?? "",
          contactPhone: project.contactPhone ?? "",
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Erreur");
      setProject(data.project);
      setDirty(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setBusy(false);
    }
  };

  const update = (patch: Partial<Project>) => {
    if (!project) return;
    setProject({ ...project, ...patch });
    setDirty(true);
  };

  const updateMilestone = (id: string, patch: Partial<Milestone>) => {
    if (!project) return;
    setProject({
      ...project,
      milestones: project.milestones.map((m) =>
        m.id === id ? { ...m, ...patch } : m,
      ),
    });
    setDirty(true);
  };

  const cycleStatus = (m: Milestone) => {
    const ns = nextStatus(m.status);
    const patch: Partial<Milestone> = { status: ns };
    if (ns === "done") patch.completedAt = new Date().toISOString();
    if (ns === "planned") patch.completedAt = undefined;
    updateMilestone(m.id, patch);
  };

  const addMilestone = () => {
    if (!project) return;
    update({
      milestones: [
        ...project.milestones,
        {
          id: `tmp-${Date.now()}`,
          title: "Nouvelle étape",
          status: "planned",
        },
      ],
    });
  };

  const removeMilestone = (id: string) => {
    if (!project) return;
    update({
      milestones: project.milestones.filter((m) => m.id !== id),
    });
  };

  if (!project) {
    return (
      <div className="rounded-2xl border border-ink/10 bg-white shadow-soft p-5">
        <Loader2 className="h-4 w-4 animate-spin text-muted" />
      </div>
    );
  }

  const done = project.milestones.filter((m) => m.status === "done").length;
  const total = project.milestones.length;
  const pct = total === 0 ? 0 : (done / total) * 100;

  return (
    <div className="rounded-2xl border border-ink/10 bg-white shadow-soft p-5">
      <div className="flex items-center gap-2 mb-3">
        <Wrench className="h-4 w-4 text-copper" />
        <span className="font-mono text-[10px] uppercase tracking-eyebrow text-copper">
          Suivi de chantier
        </span>
        <span className="ml-auto font-mono text-xs text-muted">
          {done}/{total}
        </span>
      </div>

      {/* Progress bar */}
      <div className="h-2 bg-cream rounded-full overflow-hidden mb-4">
        <div
          className="h-full bg-[#22a06b] rounded-full transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>

      {/* Milestones list */}
      <ul className="grid gap-2 mb-4">
        {project.milestones.map((m) => (
          <li
            key={m.id}
            className="flex items-start gap-2 p-2.5 rounded-xl bg-cream border border-ink/8"
          >
            <button
              onClick={() => cycleStatus(m)}
              className="mt-0.5 h-5 w-5 grid place-items-center shrink-0"
              title={`Statut : ${statusLabel(m.status)}`}
              style={{ color: statusColor(m.status) }}
            >
              {m.status === "done" ? (
                <CheckCircle2 className="h-5 w-5" />
              ) : m.status === "in_progress" ? (
                <CircleDot className="h-5 w-5" />
              ) : (
                <Circle className="h-5 w-5" />
              )}
            </button>
            <div className="min-w-0 flex-1 grid gap-1">
              <input
                value={m.title}
                onChange={(e) =>
                  updateMilestone(m.id, { title: e.target.value })
                }
                className="bg-transparent text-sm font-medium text-ink focus:outline-none w-full"
              />
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  value={m.plannedAt?.slice(0, 10) ?? ""}
                  onChange={(e) =>
                    updateMilestone(m.id, {
                      plannedAt: e.target.value
                        ? new Date(e.target.value).toISOString()
                        : undefined,
                    })
                  }
                  className="bg-white border border-ink/12 rounded-md px-2 py-0.5 text-[11px] font-mono focus:border-copper focus:outline-none"
                />
                <span
                  className="text-[10px] font-mono uppercase tracking-eyebrow"
                  style={{ color: statusColor(m.status) }}
                >
                  {statusLabel(m.status)}
                </span>
                {m.completedAt && (
                  <span className="text-[10px] font-mono text-muted ml-auto">
                    fait{" "}
                    {new Date(m.completedAt).toLocaleDateString("fr-FR", {
                      dateStyle: "short",
                    })}
                  </span>
                )}
              </div>
            </div>
            <button
              onClick={() => removeMilestone(m.id)}
              className="h-6 w-6 grid place-items-center rounded-full bg-white border border-ember/30 text-ember hover:bg-ember hover:text-cream"
              aria-label="Supprimer cette étape"
            >
              <Trash2 className="h-3 w-3" />
            </button>
          </li>
        ))}
      </ul>

      <button
        onClick={addMilestone}
        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-cream border border-ink/10 text-graphite text-xs hover:border-copper/40 hover:text-copper mb-4"
      >
        <Plus className="h-3 w-3" />
        Ajouter une étape
      </button>

      {/* Notes */}
      <div className="grid gap-2 mb-3">
        <label className="block">
          <span className="font-mono text-[10px] uppercase tracking-eyebrow text-muted">
            Note publique (visible dans l&apos;espace client)
          </span>
          <textarea
            rows={2}
            value={project.notesPublic ?? ""}
            onChange={(e) => update({ notesPublic: e.target.value })}
            placeholder="Ex : nous attendons la livraison du Viessmann Vitodens, prévue semaine 12…"
            className="mt-1 w-full bg-cream border border-ink/12 rounded-xl px-3 py-2 text-sm focus:border-copper focus:outline-none resize-none"
          />
        </label>
        <label className="block">
          <span className="font-mono text-[10px] uppercase tracking-eyebrow text-muted">
            Note interne (admin uniquement)
          </span>
          <textarea
            rows={2}
            value={project.notesInternal ?? ""}
            onChange={(e) => update({ notesInternal: e.target.value })}
            placeholder="Notes opérationnelles, contraintes techniques…"
            className="mt-1 w-full bg-cream border border-ink/12 rounded-xl px-3 py-2 text-sm focus:border-copper focus:outline-none resize-none"
          />
        </label>
        <div className="grid grid-cols-2 gap-2">
          <input
            value={project.contactName ?? ""}
            onChange={(e) => update({ contactName: e.target.value })}
            placeholder="Contact dédié (nom)"
            className="bg-cream border border-ink/12 rounded-xl px-3 py-2 text-sm focus:border-copper focus:outline-none"
          />
          <input
            value={project.contactPhone ?? ""}
            onChange={(e) => update({ contactPhone: e.target.value })}
            placeholder="Téléphone direct"
            className="bg-cream border border-ink/12 rounded-xl px-3 py-2 text-sm focus:border-copper focus:outline-none"
          />
        </div>
      </div>

      {error && <div className="text-xs text-ember mb-2">{error}</div>}

      <button
        onClick={save}
        disabled={busy || !dirty}
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition-colors",
          dirty
            ? "bg-ink text-cream hover:bg-copper"
            : "bg-cream border border-ink/10 text-graphite cursor-default",
        )}
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
  );
}
