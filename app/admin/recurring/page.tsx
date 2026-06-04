"use client";

/**
 * Tableau des tâches admin récurrentes (audit prix, revue catalogue, etc.).
 */

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Loader2,
  Plus,
  Check,
  Repeat,
  Calendar,
  AlertTriangle,
  Trash2,
  Pause,
  Play,
} from "lucide-react";
import { cn } from "@/lib/utils";

type Task = {
  id: string;
  title: string;
  description?: string;
  category?: string;
  frequency: "daily" | "weekly" | "monthly" | "quarterly" | "yearly";
  nextDueAt: string;
  lastDoneAt?: string;
  owner?: string;
  status: "active" | "paused";
};

type Stats = {
  total: number;
  active: number;
  paused: number;
  overdue: number;
  dueWithin7d: number;
};

const FREQ_LABELS = {
  daily: "Quotidien",
  weekly: "Hebdo",
  monthly: "Mensuel",
  quarterly: "Trimestriel",
  yearly: "Annuel",
};

const SUGGESTIONS = [
  { title: "Revue mensuelle catalogue prix", frequency: "monthly", category: "Catalogue" },
  { title: "Audit trimestriel certifications techniciens", frequency: "quarterly", category: "RH" },
  { title: "Vérification annuelle des contrats fournisseurs", frequency: "yearly", category: "Fournisseurs" },
  { title: "Backup hebdomadaire base", frequency: "weekly", category: "Tech" },
  { title: "Revue mensuelle pipeline value", frequency: "monthly", category: "Commercial" },
];

export default function RecurringTasksPage() {
  const router = useRouter();
  const [tasks, setTasks] = useState<Task[] | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [creating, setCreating] = useState(false);
  const [draft, setDraft] = useState<{
    title: string;
    category: string;
    frequency: Task["frequency"];
    description: string;
  }>({
    title: "",
    category: "",
    frequency: "monthly",
    description: "",
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const res = await fetch("/api/admin/recurring-tasks", {
      cache: "no-store",
    });
    if (res.status === 401) {
      router.replace("/admin/login");
      return;
    }
    if (res.ok) {
      const d = await res.json();
      setTasks(d.tasks ?? []);
      setStats(d.stats);
    }
  }, [router]);

  useEffect(() => {
    load();
    const i = setInterval(load, 60_000);
    return () => clearInterval(i);
  }, [load]);

  const create = async () => {
    if (!draft.title.trim()) {
      setError("Titre requis");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/recurring-tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(draft),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error ?? "Erreur");
      setCreating(false);
      setDraft({
        title: "",
        category: "",
        frequency: "monthly",
        description: "",
      });
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setBusy(false);
    }
  };

  const markDone = async (id: string) => {
    await fetch(`/api/admin/recurring-tasks/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ markDone: true }),
    });
    await load();
  };

  const toggleStatus = async (t: Task) => {
    await fetch(`/api/admin/recurring-tasks/${t.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        status: t.status === "active" ? "paused" : "active",
      }),
    });
    await load();
  };

  const remove = async (id: string, title: string) => {
    if (!confirm(`Supprimer « ${title} » ?`)) return;
    await fetch(`/api/admin/recurring-tasks/${id}`, { method: "DELETE" });
    await load();
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
              Tâches récurrentes
            </h1>
            <p className="mt-2 text-graphite">
              Checklist d&apos;opérations à ne pas oublier : revue catalogue,
              audits, vérifications certifs…
            </p>
          </div>
          {!creating && (
            <button
              onClick={() => setCreating(true)}
              className="inline-flex items-center gap-2 rounded-full bg-ink text-cream px-5 py-2.5 text-sm hover:bg-copper"
            >
              <Plus className="h-4 w-4" />
              Nouvelle tâche
            </button>
          )}
        </div>

        {stats && (
          <div className="grid lg:grid-cols-4 gap-3 mb-8">
            <Kpi label="Actives" value={stats.active} />
            <Kpi
              label="En pause"
              value={stats.paused}
              color="#8b847a"
            />
            <Kpi
              label="En retard"
              value={stats.overdue}
              color={stats.overdue > 0 ? "#dc5a28" : "#8b847a"}
            />
            <Kpi
              label="Dans 7 j"
              value={stats.dueWithin7d}
              color={stats.dueWithin7d > 0 ? "#b86a36" : "#8b847a"}
            />
          </div>
        )}

        {error && (
          <div className="mb-4 p-3 rounded-xl border border-ember/40 bg-ember/5 text-sm text-ember">
            {error}
          </div>
        )}

        {creating && (
          <div className="mb-6 rounded-2xl border border-copper/40 bg-white shadow-soft p-5">
            <div className="font-mono text-[10px] uppercase tracking-eyebrow text-copper mb-3">
              Nouvelle tâche
            </div>
            <div className="grid gap-2">
              <input
                value={draft.title}
                onChange={(e) =>
                  setDraft({ ...draft, title: e.target.value })
                }
                placeholder="Titre"
                className="bg-cream border border-ink/12 rounded-xl px-3 py-2 text-sm focus:border-copper focus:outline-none"
                autoFocus
              />
              <div className="grid grid-cols-2 gap-2">
                <select
                  value={draft.frequency}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      frequency: e.target.value as Task["frequency"],
                    })
                  }
                  className="bg-cream border border-ink/12 rounded-xl px-3 py-2 text-sm focus:border-copper focus:outline-none"
                >
                  {(Object.entries(FREQ_LABELS) as [Task["frequency"], string][]).map(
                    ([k, label]) => (
                      <option key={k} value={k}>
                        {label}
                      </option>
                    ),
                  )}
                </select>
                <input
                  value={draft.category}
                  onChange={(e) =>
                    setDraft({ ...draft, category: e.target.value })
                  }
                  placeholder="Catégorie"
                  className="bg-cream border border-ink/12 rounded-xl px-3 py-2 text-sm focus:border-copper focus:outline-none"
                />
              </div>
              <textarea
                rows={2}
                value={draft.description}
                onChange={(e) =>
                  setDraft({ ...draft, description: e.target.value })
                }
                placeholder="Description / checklist…"
                className="bg-cream border border-ink/12 rounded-xl px-3 py-2 text-sm focus:border-copper focus:outline-none resize-none"
              />
              <div className="flex items-center gap-2 flex-wrap text-xs">
                <span className="text-muted">Suggestions :</span>
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s.title}
                    onClick={() =>
                      setDraft({
                        ...draft,
                        title: s.title,
                        category: s.category,
                        frequency: s.frequency as Task["frequency"],
                      })
                    }
                    className="px-2 py-0.5 rounded-full bg-cream border border-ink/10 text-graphite hover:border-copper/40 hover:text-copper"
                  >
                    {s.title}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={create}
                  disabled={busy}
                  className="inline-flex items-center gap-1.5 rounded-full bg-ink text-cream px-3 py-1.5 text-xs hover:bg-copper disabled:opacity-50"
                >
                  {busy ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <Check className="h-3 w-3" />
                  )}
                  Créer
                </button>
                <button
                  onClick={() => {
                    setCreating(false);
                    setError(null);
                  }}
                  className="text-xs text-graphite hover:text-ink"
                >
                  Annuler
                </button>
              </div>
            </div>
          </div>
        )}

        {tasks === null ? (
          <div className="py-16 text-center text-muted">
            <Loader2 className="h-6 w-6 animate-spin mx-auto" />
          </div>
        ) : tasks.length === 0 ? (
          <div className="rounded-2xl border border-ink/10 bg-white shadow-soft py-16 text-center text-muted">
            <Repeat className="h-12 w-12 mx-auto opacity-20 text-copper mb-2" />
            <p>Aucune tâche récurrente.</p>
          </div>
        ) : (
          <ul className="grid gap-3">
            {tasks.map((t) => {
              const overdue = new Date(t.nextDueAt).getTime() < Date.now();
              const isPaused = t.status === "paused";
              return (
                <li
                  key={t.id}
                  className={cn(
                    "rounded-2xl border bg-white shadow-soft p-4",
                    overdue && !isPaused
                      ? "border-ember/30 bg-ember/5"
                      : "border-ink/10",
                    isPaused && "opacity-60",
                  )}
                >
                  <div className="flex items-start gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-medium text-ink">
                          {t.title}
                        </span>
                        {t.category && (
                          <span className="text-[10px] font-mono uppercase tracking-eyebrow text-copper bg-copper/10 px-2 py-0.5 rounded-full">
                            {t.category}
                          </span>
                        )}
                        <span className="text-[10px] font-mono uppercase tracking-eyebrow text-graphite bg-cream border border-ink/8 px-2 py-0.5 rounded-full">
                          {FREQ_LABELS[t.frequency]}
                        </span>
                      </div>
                      {t.description && (
                        <p className="text-xs text-graphite mt-1 whitespace-pre-wrap">
                          {t.description}
                        </p>
                      )}
                      <div className="text-[11px] text-muted mt-1 font-mono inline-flex items-center gap-2">
                        <Calendar className="h-2.5 w-2.5" />
                        Prochaine :{" "}
                        <span
                          className={
                            overdue && !isPaused ? "text-ember font-medium" : ""
                          }
                        >
                          {new Date(t.nextDueAt).toLocaleDateString("fr-FR", {
                            dateStyle: "medium",
                          })}
                        </span>
                        {t.lastDoneAt && (
                          <span>
                            · Dernière :{" "}
                            {new Date(t.lastDoneAt).toLocaleDateString("fr-FR")}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => markDone(t.id)}
                        disabled={isPaused}
                        className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-[#22a06b]/10 text-[#22a06b] border border-[#22a06b]/30 text-[10px] hover:bg-[#22a06b] hover:text-cream disabled:opacity-50"
                      >
                        <Check className="h-2.5 w-2.5" />
                        Fait
                      </button>
                      <button
                        onClick={() => toggleStatus(t)}
                        className="h-6 w-6 grid place-items-center rounded-full bg-cream border border-ink/8 text-graphite hover:bg-ink hover:text-cream"
                        title={isPaused ? "Reprendre" : "Mettre en pause"}
                      >
                        {isPaused ? (
                          <Play className="h-3 w-3" />
                        ) : (
                          <Pause className="h-3 w-3" />
                        )}
                      </button>
                      <button
                        onClick={() => remove(t.id, t.title)}
                        className="h-6 w-6 grid place-items-center rounded-full bg-cream border border-ember/30 text-ember hover:bg-ember hover:text-cream"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}

        {/* Suppress unused */}
        <span className="hidden">
          <AlertTriangle className="h-3 w-3" />
        </span>
      </div>
    </div>
  );
}

function Kpi({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color?: string;
}) {
  return (
    <div className="rounded-2xl border border-ink/10 bg-white shadow-soft p-4">
      <div
        className="font-mono text-[9px] uppercase tracking-eyebrow"
        style={{ color: color ?? "#8b847a" }}
      >
        {label}
      </div>
      <div
        className="mt-1 font-display text-2xl tabular-nums"
        style={{ color: color ?? "#1e1a15" }}
      >
        {value}
      </div>
    </div>
  );
}
