"use client";

/**
 * Planning hebdomadaire des techniciens.
 *
 * Grille jour × heure pour chaque technicien. Click vide = créer slot.
 * Click slot = éditer/supprimer. Conflits flaggés en rouge.
 */

import { useEffect, useState, useMemo, useCallback } from "react";
import { PlanningTabs } from "@/components/admin/planning-tabs";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Plus,
  Calendar,
  X as XIcon,
  Trash2,
  AlertTriangle,
} from "lucide-react";
import { cn } from "@/lib/utils";

type Slot = {
  id: string;
  technicianEmail: string;
  leadReference?: string;
  kind: "intervention" | "rdv" | "admin" | "formation";
  title: string;
  notes?: string;
  startAt: string;
  durationMin: number;
  location?: string;
};

const KIND_COLORS = {
  intervention: { bg: "#b86a36", text: "white" },
  rdv: { bg: "#6ba3c5", text: "white" },
  admin: { bg: "#8b847a", text: "white" },
  formation: { bg: "#7a5cc6", text: "white" },
};

const HOURS = Array.from({ length: 11 }, (_, i) => 8 + i); // 8h → 18h
const DAYS_FR = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

function startOfWeek(d: Date): Date {
  const day = (d.getDay() + 6) % 7;
  const r = new Date(d);
  r.setDate(d.getDate() - day);
  r.setHours(0, 0, 0, 0);
  return r;
}

function addDays(d: Date, n: number): Date {
  const r = new Date(d);
  r.setDate(d.getDate() + n);
  return r;
}

function sameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export default function DispatchPage() {
  const router = useRouter();
  const [cursor, setCursor] = useState<Date>(startOfWeek(new Date()));
  const [slots, setSlots] = useState<Slot[] | null>(null);
  const [conflicts, setConflicts] = useState<Set<string>>(new Set());
  const [technicians, setTechnicians] = useState<string[]>([]);
  const [editing, setEditing] = useState<Partial<Slot> | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const weekStart = cursor;
  const weekEnd = addDays(weekStart, 7);

  const load = useCallback(async () => {
    const url = new URL("/api/admin/dispatch", window.location.origin);
    url.searchParams.set("from", weekStart.toISOString());
    url.searchParams.set("to", weekEnd.toISOString());
    const res = await fetch(url.toString(), { cache: "no-store" });
    if (res.status === 401) {
      router.replace("/admin/login");
      return;
    }
    if (res.ok) {
      const d = await res.json();
      setSlots(d.slots ?? []);
      setConflicts(new Set<string>(d.conflicts ?? []));
      setTechnicians(d.technicians ?? []);
    }
  }, [router, weekStart, weekEnd]);

  useEffect(() => {
    load();
  }, [load]);

  const days = useMemo(
    () => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)),
    [weekStart],
  );

  const slotsByDay = useMemo(() => {
    const map = new Map<string, Slot[]>();
    if (!slots) return map;
    for (const d of days) {
      const k = d.toDateString();
      map.set(k, []);
    }
    for (const s of slots) {
      const day = new Date(s.startAt);
      const k = day.toDateString();
      const list = map.get(k);
      if (list) list.push(s);
    }
    return map;
  }, [slots, days]);

  const openCreate = (day: Date, hour: number) => {
    const start = new Date(day);
    start.setHours(hour, 0, 0, 0);
    setEditing({
      kind: "intervention",
      technicianEmail: technicians[0] ?? "",
      title: "",
      durationMin: 60,
      startAt: start.toISOString(),
    });
    setError(null);
  };

  const save = async () => {
    if (!editing) return;
    if (!editing.technicianEmail?.trim() || !editing.title?.trim()) {
      setError("Technicien et titre requis");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const url = editing.id
        ? `/api/admin/dispatch/${editing.id}`
        : "/api/admin/dispatch";
      const method = editing.id ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          technicianEmail: editing.technicianEmail,
          leadReference: editing.leadReference,
          kind: editing.kind,
          title: editing.title,
          notes: editing.notes,
          startAt: editing.startAt,
          durationMin: editing.durationMin,
          location: editing.location,
        }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error ?? "Erreur");
      setEditing(null);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    if (!editing?.id) return;
    if (!confirm("Supprimer cette intervention ?")) return;
    await fetch(`/api/admin/dispatch/${editing.id}`, { method: "DELETE" });
    setEditing(null);
    await load();
  };

  return (
    <div className="min-h-screen bg-cream py-8 lg:py-10">
      <div className="container max-w-[1400px]">
        <PlanningTabs />

        <div className="flex items-start justify-between gap-3 flex-wrap mb-6">
          <div>
            <h1 className="font-display text-display-md text-ink">
              Planning techniciens
            </h1>
            <p className="mt-2 text-graphite">
              Vue semaine, 1 ligne par jour. Cliquez sur un créneau libre pour
              planifier. Conflits flaggés.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCursor(addDays(weekStart, -7))}
              className="h-9 w-9 grid place-items-center rounded-full border border-ink/15 bg-white hover:border-copper/40"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={() => setCursor(startOfWeek(new Date()))}
              className="inline-flex items-center gap-1.5 rounded-full bg-white border border-ink/15 px-3 py-1.5 text-sm hover:border-copper/40"
            >
              <Calendar className="h-3.5 w-3.5 text-copper" />
              Aujourd&apos;hui
            </button>
            <div className="text-sm font-mono text-ink px-3">
              Semaine du{" "}
              {weekStart.toLocaleDateString("fr-FR", {
                day: "2-digit",
                month: "long",
              })}
            </div>
            <button
              onClick={() => setCursor(addDays(weekStart, 7))}
              className="h-9 w-9 grid place-items-center rounded-full border border-ink/15 bg-white hover:border-copper/40"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        {slots === null ? (
          <div className="py-16 text-center text-muted">
            <Loader2 className="h-6 w-6 animate-spin mx-auto" />
          </div>
        ) : (
          <div className="rounded-2xl border border-ink/10 bg-white shadow-soft overflow-hidden">
            <div className="grid grid-cols-[80px_repeat(7,minmax(0,1fr))] text-xs border-b border-ink/10 bg-cream/40">
              <div className="px-3 py-2 font-mono text-[10px] uppercase tracking-eyebrow text-muted">
                Heure
              </div>
              {days.map((d) => {
                const isToday = sameDay(d, new Date());
                return (
                  <div
                    key={d.toDateString()}
                    className={cn(
                      "px-3 py-2 font-mono text-[10px] uppercase tracking-eyebrow text-center",
                      isToday ? "text-copper font-bold" : "text-graphite",
                    )}
                  >
                    {DAYS_FR[(d.getDay() + 6) % 7]} {d.getDate()}
                  </div>
                );
              })}
            </div>
            <div className="grid grid-cols-[80px_repeat(7,minmax(0,1fr))]">
              {HOURS.map((h) => (
                <div key={`row-${h}`} className="contents">
                  <div className="px-3 py-2 border-t border-ink/8 font-mono text-[10px] text-muted text-right">
                    {h}h
                  </div>
                  {days.map((d) => {
                    const list = slotsByDay.get(d.toDateString()) ?? [];
                    const cellSlots = list.filter((s) => {
                      const t = new Date(s.startAt);
                      return t.getHours() === h;
                    });
                    return (
                      <div
                        key={`cell-${d.toDateString()}-${h}`}
                        onClick={() => openCreate(d, h)}
                        className="border-t border-l border-ink/5 min-h-[60px] p-1 hover:bg-cream/40 cursor-pointer relative"
                      >
                        {cellSlots.map((s) => {
                          const isConflict = conflicts.has(s.id);
                          const k = KIND_COLORS[s.kind];
                          return (
                            <button
                              key={s.id}
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditing(s);
                                setError(null);
                              }}
                              className={cn(
                                "block w-full text-left px-2 py-1 rounded-md text-[11px] mb-0.5 transition-all hover:opacity-90",
                                isConflict && "ring-2 ring-ember ring-offset-1",
                              )}
                              style={{
                                background: k.bg,
                                color: k.text,
                              }}
                            >
                              <div className="font-medium truncate">
                                {isConflict && (
                                  <AlertTriangle className="h-2.5 w-2.5 inline mr-1" />
                                )}
                                {s.title}
                              </div>
                              <div className="text-[9px] opacity-80 font-mono truncate">
                                {s.technicianEmail.split("@")[0]} ·{" "}
                                {s.durationMin} min
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        )}

        <p className="mt-4 text-xs text-muted">
          {conflicts.size > 0 && (
            <span className="text-ember">
              ⚠ {conflicts.size} créneau{conflicts.size > 1 ? "x" : ""} en
              conflit — vérifiez l&apos;ordonnancement.{" "}
            </span>
          )}
          {technicians.length} technicien{technicians.length > 1 ? "s" : ""}{" "}
          avec des slots cette semaine.
        </p>
      </div>

      {/* Modal édition */}
      {editing && (
        <div
          className="fixed inset-0 z-50 bg-charcoal/50 backdrop-blur-sm grid place-items-center p-4"
          onClick={() => setEditing(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl border border-ink/10 max-w-md w-full p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display text-lg text-ink">
                {editing.id ? "Modifier le slot" : "Nouveau slot"}
              </h3>
              <button
                onClick={() => setEditing(null)}
                className="h-7 w-7 grid place-items-center rounded-full bg-cream border border-ink/10 hover:bg-ink hover:text-cream"
              >
                <XIcon className="h-3 w-3" />
              </button>
            </div>

            <div className="grid gap-3">
              <input
                value={editing.title ?? ""}
                onChange={(e) =>
                  setEditing({ ...editing, title: e.target.value })
                }
                placeholder="Titre (ex : Pose chaudière chez M. Dupont)"
                className="bg-cream border border-ink/12 rounded-xl px-3 py-2 text-sm focus:border-copper focus:outline-none"
                autoFocus
              />
              <div className="grid grid-cols-2 gap-2">
                <input
                  value={editing.technicianEmail ?? ""}
                  onChange={(e) =>
                    setEditing({
                      ...editing,
                      technicianEmail: e.target.value,
                    })
                  }
                  placeholder="Technicien (email)"
                  list="techs"
                  className="bg-cream border border-ink/12 rounded-xl px-3 py-2 text-sm focus:border-copper focus:outline-none"
                />
                <datalist id="techs">
                  {technicians.map((t) => (
                    <option key={t} value={t} />
                  ))}
                </datalist>
                <select
                  value={editing.kind ?? "intervention"}
                  onChange={(e) =>
                    setEditing({
                      ...editing,
                      kind: e.target.value as Slot["kind"],
                    })
                  }
                  className="bg-cream border border-ink/12 rounded-xl px-3 py-2 text-sm focus:border-copper focus:outline-none"
                >
                  <option value="intervention">Intervention</option>
                  <option value="rdv">RDV</option>
                  <option value="admin">Admin</option>
                  <option value="formation">Formation</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="datetime-local"
                  value={editing.startAt?.slice(0, 16) ?? ""}
                  onChange={(e) =>
                    setEditing({
                      ...editing,
                      startAt: new Date(e.target.value).toISOString(),
                    })
                  }
                  className="bg-cream border border-ink/12 rounded-xl px-3 py-2 text-sm focus:border-copper focus:outline-none"
                />
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={editing.durationMin ?? 60}
                    onChange={(e) =>
                      setEditing({
                        ...editing,
                        durationMin: Number(e.target.value) || 60,
                      })
                    }
                    step={15}
                    min={15}
                    className="flex-1 bg-cream border border-ink/12 rounded-xl px-3 py-2 text-sm font-mono focus:border-copper focus:outline-none"
                  />
                  <span className="text-xs text-muted">min</span>
                </div>
              </div>
              <input
                value={editing.location ?? ""}
                onChange={(e) =>
                  setEditing({ ...editing, location: e.target.value })
                }
                placeholder="Lieu (optionnel)"
                className="bg-cream border border-ink/12 rounded-xl px-3 py-2 text-sm focus:border-copper focus:outline-none"
              />
              <input
                value={editing.leadReference ?? ""}
                onChange={(e) =>
                  setEditing({ ...editing, leadReference: e.target.value })
                }
                placeholder="Référence lead (optionnel)"
                className="bg-cream border border-ink/12 rounded-xl px-3 py-2 text-sm font-mono focus:border-copper focus:outline-none"
              />
              <textarea
                rows={2}
                value={editing.notes ?? ""}
                onChange={(e) =>
                  setEditing({ ...editing, notes: e.target.value })
                }
                placeholder="Notes…"
                className="bg-cream border border-ink/12 rounded-xl px-3 py-2 text-sm focus:border-copper focus:outline-none resize-none"
              />
            </div>

            {error && (
              <div className="mt-3 text-xs text-ember">{error}</div>
            )}

            {/* Time tracking (clock-in / clock-out) — uniquement sur slots existants */}
            {editing.id && (
              <div className="mt-3 p-3 rounded-xl bg-cream/60 border border-ink/8 flex items-center gap-2 text-xs">
                <span className="font-mono text-[10px] uppercase tracking-eyebrow text-muted">
                  Pointage
                </span>
                <button
                  onClick={async () => {
                    if (!editing.id) return;
                    await fetch(`/api/admin/dispatch/${editing.id}/clock`, {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ action: "in" }),
                    });
                    setEditing(null);
                    load();
                  }}
                  className="inline-flex items-center gap-1 rounded-full bg-[#22a06b] text-cream px-2 py-1 text-[10px] hover:opacity-90"
                >
                  Arrivée
                </button>
                <button
                  onClick={async () => {
                    if (!editing.id) return;
                    await fetch(`/api/admin/dispatch/${editing.id}/clock`, {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ action: "out" }),
                    });
                    setEditing(null);
                    load();
                  }}
                  className="inline-flex items-center gap-1 rounded-full bg-ink text-cream px-2 py-1 text-[10px] hover:bg-copper"
                >
                  Fin
                </button>
                <a
                  href="/admin/productivity"
                  className="ml-auto text-[10px] text-copper hover:underline"
                >
                  Voir productivité →
                </a>
              </div>
            )}

            <div className="flex items-center gap-2 mt-4">
              <button
                onClick={save}
                disabled={busy}
                className="inline-flex items-center gap-1.5 rounded-full bg-ink text-cream px-4 py-2 text-sm hover:bg-copper disabled:opacity-50"
              >
                {busy ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Plus className="h-3.5 w-3.5" />
                )}
                {editing.id ? "Enregistrer" : "Créer"}
              </button>
              {editing.id && (
                <button
                  onClick={remove}
                  className="inline-flex items-center gap-1.5 rounded-full bg-white border border-ember/40 text-ember px-3 py-2 text-sm hover:bg-ember/10 ml-auto"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Supprimer
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
