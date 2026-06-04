"use client";

/**
 * Bloc rappels pour la fiche lead.
 *
 * Liste les rappels actifs (pending + fired non dismissés), création rapide
 * via presets (+1h, +1j, +3j, +1sem) ou date custom.
 */

import { useEffect, useState, useCallback } from "react";
import {
  BellRing,
  Plus,
  Loader2,
  Trash2,
  Check,
  X as XIcon,
  Clock,
  Calendar,
} from "lucide-react";
import { cn } from "@/lib/utils";

type Reminder = {
  id: string;
  leadReference: string;
  dueAt: string;
  note: string;
  createdAt: string;
  createdBy?: string;
  firedAt?: string;
  dismissedAt?: string;
};

const PRESETS = [
  { label: "+1 h", hours: 1 },
  { label: "+4 h", hours: 4 },
  { label: "Demain 9h", offsetTo: "next-9am" as const },
  { label: "+3 j", hours: 72 },
  { label: "+1 sem.", hours: 168 },
];

function nextNineAm(): Date {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  d.setHours(9, 0, 0, 0);
  return d;
}

function fmtDue(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diffMs = d.getTime() - now.getTime();
  if (Math.abs(diffMs) < 60_000) return "à l'instant";
  if (diffMs > 0) {
    const min = Math.floor(diffMs / 60_000);
    if (min < 60) return `dans ${min} min`;
    if (min < 24 * 60) return `dans ${Math.floor(min / 60)} h`;
    return d.toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" });
  }
  const ago = -diffMs;
  const min = Math.floor(ago / 60_000);
  if (min < 60) return `il y a ${min} min`;
  if (min < 24 * 60) return `il y a ${Math.floor(min / 60)} h`;
  return d.toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" });
}

export function LeadRemindersBlock({ reference }: { reference: string }) {
  const [reminders, setReminders] = useState<Reminder[] | null>(null);
  const [creating, setCreating] = useState(false);
  const [draftDate, setDraftDate] = useState("");
  const [draftNote, setDraftNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const res = await fetch(`/api/admin/reminders?lead=${reference}`, {
      cache: "no-store",
    });
    if (res.ok) {
      const data = await res.json();
      setReminders(data.reminders ?? []);
    }
  }, [reference]);

  useEffect(() => {
    load();
    const i = setInterval(load, 60_000);
    return () => clearInterval(i);
  }, [load]);

  const createWithDate = async (date: Date, note: string) => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/reminders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          leadReference: reference,
          dueAt: date.toISOString(),
          note,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Erreur");
      setCreating(false);
      setDraftDate("");
      setDraftNote("");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setBusy(false);
    }
  };

  const createPreset = (p: (typeof PRESETS)[number]) => {
    const date =
      "offsetTo" in p && p.offsetTo === "next-9am"
        ? nextNineAm()
        : new Date(Date.now() + (p as { hours: number }).hours * 3600_000);
    createWithDate(date, "");
  };

  const createCustom = () => {
    if (!draftDate) return;
    const d = new Date(draftDate);
    if (isNaN(d.getTime())) {
      setError("Date invalide");
      return;
    }
    createWithDate(d, draftNote);
  };

  const dismiss = async (id: string) => {
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/reminders/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dismiss: true }),
      });
      if (res.ok) await load();
    } finally {
      setBusy(false);
    }
  };

  const snooze = async (id: string, hours: number) => {
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/reminders/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ snoozeHours: hours }),
      });
      if (res.ok) await load();
    } finally {
      setBusy(false);
    }
  };

  const remove = async (id: string) => {
    if (!confirm("Supprimer ce rappel ?")) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/reminders/${id}`, {
        method: "DELETE",
      });
      if (res.ok) await load();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="rounded-2xl border border-ink/10 bg-white shadow-soft p-5">
      <div className="flex items-center justify-between mb-3">
        <div className="font-mono text-[10px] uppercase tracking-eyebrow text-copper inline-flex items-center gap-1.5">
          <BellRing className="h-3 w-3" />
          Rappels
          {reminders && reminders.length > 0 && (
            <span className="text-muted">· {reminders.length}</span>
          )}
        </div>
        {busy && <Loader2 className="h-3.5 w-3.5 animate-spin text-copper" />}
      </div>

      {reminders === null ? (
        <Loader2 className="h-4 w-4 animate-spin text-muted" />
      ) : reminders.length === 0 ? (
        <div className="text-sm text-muted mb-3">Aucun rappel actif.</div>
      ) : (
        <ul className="grid gap-2 mb-3">
          {reminders.map((r) => {
            const isFired = !!r.firedAt;
            return (
              <li
                key={r.id}
                className={cn(
                  "p-3 rounded-xl border",
                  isFired
                    ? "bg-copper/5 border-copper/30"
                    : "bg-cream border-ink/8",
                )}
              >
                <div className="flex items-start gap-2">
                  <Clock
                    className={cn(
                      "h-3.5 w-3.5 mt-0.5 shrink-0",
                      isFired ? "text-copper" : "text-graphite",
                    )}
                  />
                  <div className="min-w-0 flex-1">
                    <div
                      className={cn(
                        "text-sm font-medium",
                        isFired ? "text-copper" : "text-ink",
                      )}
                    >
                      {fmtDue(r.dueAt)}
                      {isFired && (
                        <span className="ml-2 text-[10px] font-mono uppercase tracking-eyebrow text-copper">
                          Échéance atteinte
                        </span>
                      )}
                    </div>
                    {r.note && (
                      <div className="text-xs text-graphite mt-0.5">
                        {r.note}
                      </div>
                    )}
                    <div className="text-[10px] text-muted mt-0.5 font-mono">
                      {new Date(r.dueAt).toLocaleString("fr-FR", {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1 mt-2 flex-wrap">
                  <button
                    onClick={() => dismiss(r.id)}
                    className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-white border border-[#22a06b]/30 text-[#22a06b] text-[10px] hover:bg-[#22a06b]/10"
                  >
                    <Check className="h-2.5 w-2.5" />
                    Fait
                  </button>
                  <button
                    onClick={() => snooze(r.id, 1)}
                    className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-white border border-ink/10 text-graphite text-[10px] hover:border-copper/40"
                  >
                    +1 h
                  </button>
                  <button
                    onClick={() => snooze(r.id, 24)}
                    className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-white border border-ink/10 text-graphite text-[10px] hover:border-copper/40"
                  >
                    +1 j
                  </button>
                  <button
                    onClick={() => remove(r.id)}
                    className="ml-auto inline-flex items-center gap-1 px-2 py-1 rounded-full bg-white border border-ember/30 text-ember text-[10px] hover:bg-ember/10"
                  >
                    <Trash2 className="h-2.5 w-2.5" />
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {error && <div className="text-xs text-ember mb-2">{error}</div>}

      {!creating ? (
        <div className="flex items-center gap-1 flex-wrap">
          {PRESETS.map((p) => (
            <button
              key={p.label}
              onClick={() => createPreset(p)}
              disabled={busy}
              className="px-2 py-1 rounded-full bg-cream border border-ink/8 text-graphite text-[11px] hover:border-copper/40 hover:text-copper disabled:opacity-40"
            >
              {p.label}
            </button>
          ))}
          <button
            onClick={() => setCreating(true)}
            className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-cream border border-ink/8 text-graphite text-[11px] hover:border-copper/40 hover:text-copper"
          >
            <Plus className="h-2.5 w-2.5" />
            Date précise
          </button>
        </div>
      ) : (
        <div className="grid gap-2">
          <div className="flex items-center gap-1.5 bg-cream border border-ink/12 rounded-xl px-3 py-2">
            <Calendar className="h-3.5 w-3.5 text-muted" />
            <input
              type="datetime-local"
              value={draftDate}
              onChange={(e) => setDraftDate(e.target.value)}
              className="flex-1 bg-transparent text-sm focus:outline-none"
            />
          </div>
          <input
            value={draftNote}
            onChange={(e) => setDraftNote(e.target.value)}
            placeholder="Note (optionnelle) — qu'est-ce que tu veux te rappeler ?"
            className="bg-cream border border-ink/12 rounded-xl px-3 py-2 text-sm focus:border-copper focus:outline-none"
          />
          <div className="flex items-center gap-2">
            <button
              onClick={createCustom}
              disabled={busy || !draftDate}
              className="inline-flex items-center gap-1.5 rounded-full bg-ink text-cream px-3 py-1.5 text-xs hover:bg-copper disabled:opacity-50"
            >
              {busy ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <Check className="h-3 w-3" />
              )}
              Programmer
            </button>
            <button
              onClick={() => {
                setCreating(false);
                setDraftDate("");
                setDraftNote("");
                setError(null);
              }}
              className="inline-flex items-center gap-1 text-xs text-graphite hover:text-ink"
            >
              <XIcon className="h-3 w-3" />
              Annuler
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
