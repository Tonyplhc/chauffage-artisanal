"use client";

/**
 * Timeline unifié pour la fiche lead.
 *
 * Affiche tous les événements liés au dossier (statut, comments, reminders,
 * quote, NPS, activity) dans une vue chronologique inversée (récent en haut).
 *
 * Filtrage par catégorie d'event en chips au-dessus de la liste.
 */

import { useEffect, useState, useMemo, useCallback } from "react";
import {
  History,
  ArrowRight,
  MessageSquare,
  BellRing,
  FileText,
  Star,
  Activity,
  Inbox,
  CheckCircle2,
  XCircle,
  Loader2,
  Clock,
} from "lucide-react";
import { cn } from "@/lib/utils";

type Event = {
  id: string;
  at: string;
  kind:
    | "lead.created"
    | "status.transition"
    | "activity"
    | "comment.added"
    | "comment.deleted"
    | "reminder.created"
    | "reminder.fired"
    | "reminder.dismissed"
    | "quote.created"
    | "quote.sent"
    | "quote.accepted"
    | "quote.refused"
    | "nps.sent"
    | "nps.responded";
  title: string;
  description?: string;
  actor?: string;
  meta?: Record<string, unknown>;
};

type Category = "all" | "status" | "comment" | "reminder" | "quote" | "nps" | "other";

const CATEGORIES: { id: Category; label: string }[] = [
  { id: "all", label: "Tous" },
  { id: "status", label: "Statut" },
  { id: "comment", label: "Commentaires" },
  { id: "reminder", label: "Rappels" },
  { id: "quote", label: "Devis" },
  { id: "nps", label: "NPS" },
  { id: "other", label: "Autres" },
];

function categoryOf(kind: Event["kind"]): Category {
  if (kind === "lead.created" || kind === "status.transition") return "status";
  if (kind.startsWith("comment.")) return "comment";
  if (kind.startsWith("reminder.")) return "reminder";
  if (kind.startsWith("quote.")) return "quote";
  if (kind.startsWith("nps.")) return "nps";
  return "other";
}

const ICONS: Record<Event["kind"], typeof Inbox> = {
  "lead.created": Inbox,
  "status.transition": ArrowRight,
  activity: Activity,
  "comment.added": MessageSquare,
  "comment.deleted": MessageSquare,
  "reminder.created": BellRing,
  "reminder.fired": BellRing,
  "reminder.dismissed": CheckCircle2,
  "quote.created": FileText,
  "quote.sent": FileText,
  "quote.accepted": CheckCircle2,
  "quote.refused": XCircle,
  "nps.sent": Star,
  "nps.responded": Star,
};

const COLORS: Record<Event["kind"], string> = {
  "lead.created": "#b86a36",
  "status.transition": "#6ba3c5",
  activity: "#8b847a",
  "comment.added": "#7a5cc6",
  "comment.deleted": "#8b847a",
  "reminder.created": "#b86a36",
  "reminder.fired": "#dc5a28",
  "reminder.dismissed": "#22a06b",
  "quote.created": "#94532a",
  "quote.sent": "#94532a",
  "quote.accepted": "#22a06b",
  "quote.refused": "#dc5a28",
  "nps.sent": "#b86a36",
  "nps.responded": "#22a06b",
};

function fmtDate(iso: string) {
  return new Date(iso).toLocaleString("fr-FR", {
    dateStyle: "short",
    timeStyle: "short",
  });
}

function fmtDayLabel(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function dayKey(iso: string) {
  const d = new Date(iso);
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

export function LeadTimeline({ reference }: { reference: string }) {
  const [events, setEvents] = useState<Event[] | null>(null);
  const [category, setCategory] = useState<Category>("all");

  const load = useCallback(async () => {
    const res = await fetch(`/api/admin/leads/${reference}/timeline`, {
      cache: "no-store",
    });
    if (res.ok) {
      const data = await res.json();
      setEvents(data.events ?? []);
    }
  }, [reference]);

  useEffect(() => {
    load();
    const i = setInterval(load, 60_000);
    return () => clearInterval(i);
  }, [load]);

  const filtered = useMemo(() => {
    if (!events) return null;
    if (category === "all") return events;
    return events.filter((e) => categoryOf(e.kind) === category);
  }, [events, category]);

  const counts = useMemo(() => {
    const c: Record<Category, number> = {
      all: 0,
      status: 0,
      comment: 0,
      reminder: 0,
      quote: 0,
      nps: 0,
      other: 0,
    };
    if (!events) return c;
    for (const e of events) {
      c.all += 1;
      c[categoryOf(e.kind)] += 1;
    }
    return c;
  }, [events]);

  // Group by day
  const groupedByDay = useMemo(() => {
    if (!filtered) return [];
    const groups: { day: string; label: string; events: Event[] }[] = [];
    let currentDay = "";
    for (const e of filtered) {
      const k = dayKey(e.at);
      if (k !== currentDay) {
        groups.push({ day: k, label: fmtDayLabel(e.at), events: [] });
        currentDay = k;
      }
      groups[groups.length - 1].events.push(e);
    }
    return groups;
  }, [filtered]);

  return (
    <div className="p-6 lg:p-8 rounded-3xl border border-ink/10 bg-white shadow-soft">
      <div className="flex items-center gap-2 mb-4">
        <History className="h-5 w-5 text-copper" />
        <h2 className="font-display text-xl text-ink">Historique unifié</h2>
        {events && (
          <span className="ml-auto font-mono text-xs text-muted">
            {events.length} événement{events.length > 1 ? "s" : ""}
          </span>
        )}
      </div>

      <div className="flex items-center gap-1 flex-wrap mb-5">
        {CATEGORIES.map((c) => {
          const n = counts[c.id];
          return (
            <button
              key={c.id}
              onClick={() => setCategory(c.id)}
              className={cn(
                "px-2.5 py-1 rounded-full text-[11px] font-medium transition-colors inline-flex items-center gap-1",
                category === c.id
                  ? "bg-ink text-cream"
                  : "bg-cream border border-ink/10 text-graphite hover:border-copper/40",
              )}
            >
              {c.label}
              <span
                className={cn(
                  "font-mono text-[9px] tabular-nums",
                  category === c.id ? "text-cream/70" : "text-muted",
                )}
              >
                {n}
              </span>
            </button>
          );
        })}
      </div>

      {events === null ? (
        <Loader2 className="h-5 w-5 animate-spin text-muted" />
      ) : groupedByDay.length === 0 ? (
        <div className="text-sm text-muted py-8 text-center">
          Aucun événement dans cette catégorie.
        </div>
      ) : (
        <div className="grid gap-6">
          {groupedByDay.map((g) => (
            <div key={g.day}>
              <div className="font-mono text-[10px] uppercase tracking-eyebrow text-muted mb-3 flex items-center gap-2">
                <Clock className="h-3 w-3" />
                {g.label}
              </div>
              <ol className="relative pl-6">
                <div className="absolute left-[7px] top-1 bottom-1 w-px bg-ink/8" />
                {g.events.map((e) => {
                  const Icon = ICONS[e.kind];
                  const color = COLORS[e.kind];
                  return (
                    <li key={e.id} className="relative pb-4 last:pb-0">
                      <span
                        className="absolute -left-6 top-0.5 h-4 w-4 rounded-full border-2 border-white grid place-items-center"
                        style={{ background: color }}
                      >
                        <Icon className="h-2.5 w-2.5 text-white" />
                      </span>
                      <div className="text-sm text-ink">{e.title}</div>
                      {e.description && (
                        <div className="text-xs text-graphite mt-0.5 whitespace-pre-wrap">
                          {e.description}
                        </div>
                      )}
                      <div className="text-[10px] text-muted font-mono mt-0.5">
                        {fmtDate(e.at)}
                        {e.actor && <span> · {e.actor}</span>}
                      </div>
                    </li>
                  );
                })}
              </ol>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
