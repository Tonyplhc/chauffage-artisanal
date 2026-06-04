"use client";

/**
 * Vue globale des rappels actifs (tous leads).
 *
 * Trié par échéance ascendante. Échus en haut, à venir ensuite.
 */

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  BellRing,
  Loader2,
  Check,
  Trash2,
  Clock,
  ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

type Reminder = {
  id: string;
  leadReference: string;
  dueAt: string;
  note: string;
  createdAt: string;
  firedAt?: string;
};

function fmtDue(iso: string): { label: string; overdue: boolean } {
  const d = new Date(iso);
  const diffMs = d.getTime() - Date.now();
  const overdue = diffMs < 0;
  const abs = Math.abs(diffMs);
  const min = Math.floor(abs / 60_000);
  if (min < 60)
    return { label: overdue ? `il y a ${min} min` : `dans ${min} min`, overdue };
  if (min < 24 * 60)
    return {
      label: overdue ? `il y a ${Math.floor(min / 60)} h` : `dans ${Math.floor(min / 60)} h`,
      overdue,
    };
  return {
    label: d.toLocaleString("fr-FR", {
      dateStyle: "short",
      timeStyle: "short",
    }),
    overdue,
  };
}

export default function RemindersPage() {
  const router = useRouter();
  const [reminders, setReminders] = useState<Reminder[] | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const res = await fetch("/api/admin/reminders", { cache: "no-store" });
    if (res.status === 401) {
      router.replace("/admin/login");
      return;
    }
    if (res.ok) {
      const data = await res.json();
      setReminders(data.reminders ?? []);
    }
  }, [router]);

  useEffect(() => {
    load();
    const i = setInterval(load, 30_000);
    return () => clearInterval(i);
  }, [load]);

  const dismiss = async (id: string) => {
    setBusy(true);
    try {
      await fetch(`/api/admin/reminders/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dismiss: true }),
      });
      await load();
    } finally {
      setBusy(false);
    }
  };

  const snooze = async (id: string, hours: number) => {
    setBusy(true);
    try {
      await fetch(`/api/admin/reminders/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ snoozeHours: hours }),
      });
      await load();
    } finally {
      setBusy(false);
    }
  };

  const remove = async (id: string) => {
    if (!confirm("Supprimer ce rappel ?")) return;
    setBusy(true);
    try {
      await fetch(`/api/admin/reminders/${id}`, { method: "DELETE" });
      await load();
    } finally {
      setBusy(false);
    }
  };

  const fired = reminders?.filter((r) => r.firedAt) ?? [];
  const pending = reminders?.filter((r) => !r.firedAt) ?? [];

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

        <div className="mb-8">
          <h1 className="font-display text-display-md text-ink">Rappels</h1>
          <p className="mt-2 text-graphite">
            Vos rappels actifs sur tous les leads.{" "}
            <span className="text-muted">
              · Rafraîchi automatiquement toutes les 30 s.
            </span>
          </p>
        </div>

        {reminders === null ? (
          <div className="py-16 text-center text-muted">
            <Loader2 className="h-6 w-6 animate-spin mx-auto" />
          </div>
        ) : (
          <>
            {fired.length > 0 && (
              <Section
                title={`Échus (${fired.length})`}
                tone="copper"
                items={fired}
                onDismiss={dismiss}
                onSnooze={snooze}
                onRemove={remove}
                busy={busy}
              />
            )}
            {pending.length > 0 && (
              <Section
                title={`À venir (${pending.length})`}
                tone="ink"
                items={pending}
                onDismiss={dismiss}
                onSnooze={snooze}
                onRemove={remove}
                busy={busy}
              />
            )}
            {reminders.length === 0 && (
              <div className="rounded-2xl border border-ink/10 bg-white shadow-soft py-16 text-center text-muted">
                <BellRing className="h-12 w-12 mx-auto opacity-20 mb-2" />
                <p>Aucun rappel actif.</p>
                <p className="text-xs mt-1">
                  Créez-en depuis la fiche d&apos;un lead.
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function Section({
  title,
  tone,
  items,
  onDismiss,
  onSnooze,
  onRemove,
  busy,
}: {
  title: string;
  tone: "ink" | "copper";
  items: Reminder[];
  onDismiss: (id: string) => void;
  onSnooze: (id: string, hours: number) => void;
  onRemove: (id: string) => void;
  busy: boolean;
}) {
  return (
    <div className="rounded-2xl border border-ink/10 bg-white shadow-soft overflow-hidden mb-6">
      <div
        className={cn(
          "px-5 py-3 border-b border-ink/8 font-mono text-[10px] uppercase tracking-eyebrow",
          tone === "copper" ? "bg-copper/10 text-copper" : "bg-cream/40 text-ink",
        )}
      >
        {title}
      </div>
      <ul className="divide-y divide-ink/8">
        {items.map((r) => {
          const due = fmtDue(r.dueAt);
          return (
            <li
              key={r.id}
              className="px-5 py-3 grid lg:grid-cols-12 gap-3 items-start"
            >
              <div className="lg:col-span-7 min-w-0">
                <div className="flex items-center gap-2">
                  <Clock
                    className={cn(
                      "h-3.5 w-3.5 shrink-0",
                      due.overdue ? "text-copper" : "text-graphite",
                    )}
                  />
                  <span
                    className={cn(
                      "text-sm font-medium",
                      due.overdue ? "text-copper" : "text-ink",
                    )}
                  >
                    {due.label}
                  </span>
                  <Link
                    href={`/admin/leads/${r.leadReference}`}
                    className="text-xs text-graphite hover:text-copper underline-offset-2 hover:underline"
                  >
                    {r.leadReference}
                  </Link>
                </div>
                {r.note && (
                  <div className="text-sm text-graphite mt-1 ml-5.5">
                    {r.note}
                  </div>
                )}
                <div className="text-[10px] text-muted mt-1 font-mono ml-5.5">
                  {new Date(r.dueAt).toLocaleString("fr-FR", {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })}
                </div>
              </div>
              <div className="lg:col-span-5 flex items-center gap-1 flex-wrap lg:justify-end">
                <button
                  onClick={() => onDismiss(r.id)}
                  disabled={busy}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white border border-[#22a06b]/30 text-[#22a06b] text-[11px] hover:bg-[#22a06b]/10 disabled:opacity-40"
                >
                  <Check className="h-3 w-3" />
                  Fait
                </button>
                <button
                  onClick={() => onSnooze(r.id, 1)}
                  disabled={busy}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white border border-ink/10 text-graphite text-[11px] hover:border-copper/40 disabled:opacity-40"
                >
                  +1 h
                </button>
                <button
                  onClick={() => onSnooze(r.id, 24)}
                  disabled={busy}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white border border-ink/10 text-graphite text-[11px] hover:border-copper/40 disabled:opacity-40"
                >
                  +1 j
                </button>
                <button
                  onClick={() => onSnooze(r.id, 168)}
                  disabled={busy}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white border border-ink/10 text-graphite text-[11px] hover:border-copper/40 disabled:opacity-40"
                >
                  +1 sem
                </button>
                <button
                  onClick={() => onRemove(r.id)}
                  disabled={busy}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white border border-ember/30 text-ember text-[11px] hover:bg-ember/10 disabled:opacity-40"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
                <Link
                  href={`/admin/leads/${r.leadReference}`}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-ink text-cream text-[11px] hover:bg-copper"
                >
                  Ouvrir
                  <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
