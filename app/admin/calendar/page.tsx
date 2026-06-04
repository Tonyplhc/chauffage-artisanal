"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { PlanningTabs } from "@/components/admin/planning-tabs";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Clock,
  Flame,
  Phone,
  ArrowUpRight,
} from "lucide-react";
import type { LeadRecord } from "@/lib/devis-schema";
import { LEVEL_COLORS, LEVEL_LABELS } from "@/lib/lead-scoring";
import { cn } from "@/lib/utils";

type Event = {
  kind: "booking" | "urgent" | "follow-up";
  date: Date;
  lead: LeadRecord;
  label: string;
};

const KIND_STYLE: Record<Event["kind"], { color: string; label: string }> = {
  booking: { color: "#b86a36", label: "Visite technique" },
  urgent: { color: "#dc5a28", label: "Urgent" },
  "follow-up": { color: "#6ba3c5", label: "À relancer" },
};

export default function AdminCalendarPage() {
  const router = useRouter();
  const [leads, setLeads] = useState<LeadRecord[] | null>(null);
  const [cursor, setCursor] = useState(() => {
    const d = new Date();
    d.setDate(1);
    d.setHours(0, 0, 0, 0);
    return d;
  });
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);

  useEffect(() => {
    (async () => {
      const res = await fetch("/api/admin/leads", { cache: "no-store" });
      if (res.status === 401) {
        router.replace("/admin/login");
        return;
      }
      const data = await res.json();
      setLeads(data.leads ?? []);
    })();
  }, [router]);

  const events: Event[] = useMemo(() => {
    if (!leads) return [];
    const out: Event[] = [];
    const now = Date.now();
    for (const l of leads) {
      // Booking slot dans metadata
      const slot = (l.metadata as { bookingSlot?: string } | undefined)?.bookingSlot;
      if (slot) {
        out.push({
          kind: "booking",
          date: new Date(slot),
          lead: l,
          label: `RDV · ${l.fullName}`,
        });
      }
      // Lead urgent = à traiter dans les 48h post-soumission
      if (l.status === "nouveau" && l.timeline === "urgent") {
        const due = new Date(l.submittedAt);
        due.setDate(due.getDate() + 1);
        out.push({
          kind: "urgent",
          date: due,
          lead: l,
          label: `Urgent · ${l.fullName}`,
        });
      }
      // Follow-up nécessaire
      if (l.status === "devis_envoye") {
        const due = new Date(l.submittedAt);
        due.setDate(due.getDate() + 7);
        if (due.getTime() < now + 30 * 86_400_000) {
          out.push({
            kind: "follow-up",
            date: due,
            lead: l,
            label: `Relance · ${l.fullName}`,
          });
        }
      }
    }
    return out;
  }, [leads]);

  // Grille du mois courant
  const grid = useMemo(() => {
    const first = new Date(cursor);
    const firstDayOfWeek = (first.getDay() + 6) % 7; // lundi = 0
    const startGrid = new Date(first);
    startGrid.setDate(first.getDate() - firstDayOfWeek);
    const days: { date: Date; inMonth: boolean }[] = [];
    for (let i = 0; i < 42; i++) {
      const d = new Date(startGrid);
      d.setDate(startGrid.getDate() + i);
      days.push({ date: d, inMonth: d.getMonth() === cursor.getMonth() });
    }
    return days;
  }, [cursor]);

  const eventsByDay = useMemo(() => {
    const map = new Map<string, Event[]>();
    for (const e of events) {
      const k = e.date.toDateString();
      if (!map.has(k)) map.set(k, []);
      map.get(k)!.push(e);
    }
    return map;
  }, [events]);

  const eventsForSelected = selectedDay
    ? (eventsByDay.get(selectedDay.toDateString()) ?? []).sort(
        (a, b) => a.date.getTime() - b.date.getTime(),
      )
    : [];

  const monthLabel = cursor.toLocaleDateString("fr-FR", {
    month: "long",
    year: "numeric",
  });

  return (
    <div className="min-h-screen bg-cream py-10 lg:py-14">
      <div className="container max-w-7xl">
        <PlanningTabs />
        {/* Header */}
        <div className="flex items-start justify-between gap-6 flex-wrap mb-8">
          <div>
            <Link
              href="/admin/leads"
              className="inline-flex items-center gap-2 text-sm font-mono uppercase tracking-eyebrow text-graphite hover:text-copper transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Retour pipeline
            </Link>
            <h1 className="mt-3 font-display text-display-md text-ink">
              Calendrier
            </h1>
            <p className="mt-2 text-graphite text-base">
              Visites techniques, urgences, relances à venir.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                const d = new Date(cursor);
                d.setMonth(d.getMonth() - 1);
                setCursor(d);
              }}
              className="h-10 w-10 grid place-items-center rounded-full border border-ink/15 bg-white hover:border-copper/40 transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <div className="font-display text-xl text-ink px-4 capitalize tabular-nums">
              {monthLabel}
            </div>
            <button
              onClick={() => {
                const d = new Date(cursor);
                d.setMonth(d.getMonth() + 1);
                setCursor(d);
              }}
              className="h-10 w-10 grid place-items-center rounded-full border border-ink/15 bg-white hover:border-copper/40 transition-colors"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
            <button
              onClick={() => {
                const d = new Date();
                d.setDate(1);
                d.setHours(0, 0, 0, 0);
                setCursor(d);
                setSelectedDay(new Date());
              }}
              className="ml-2 inline-flex items-center gap-2 rounded-full bg-ink text-cream px-4 py-2.5 text-sm hover:bg-copper transition-colors"
            >
              Aujourd&apos;hui
            </button>
          </div>
        </div>

        {/* Légende */}
        <div className="mb-5 flex flex-wrap gap-3">
          {(Object.entries(KIND_STYLE) as [Event["kind"], { color: string; label: string }][]).map(
            ([kind, st]) => (
              <span
                key={kind}
                className="inline-flex items-center gap-2 text-xs text-graphite"
              >
                <span
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ background: st.color }}
                />
                {st.label}
              </span>
            ),
          )}
        </div>

        {/* Grille calendrier + sidebar */}
        <div className="grid lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8 rounded-2xl border border-ink/10 bg-white shadow-soft overflow-hidden">
            {/* Header jours de la semaine */}
            <div className="grid grid-cols-7 border-b border-ink/10 bg-cream/40">
              {["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"].map((d) => (
                <div
                  key={d}
                  className="px-2 py-3 text-center font-mono text-[10px] uppercase tracking-eyebrow text-muted"
                >
                  {d}
                </div>
              ))}
            </div>

            {/* Grille jours */}
            <div className="grid grid-cols-7">
              {grid.map(({ date, inMonth }, i) => {
                const evs = eventsByDay.get(date.toDateString()) ?? [];
                const today =
                  date.toDateString() === new Date().toDateString();
                const selected =
                  selectedDay && date.toDateString() === selectedDay.toDateString();
                return (
                  <button
                    key={i}
                    onClick={() => setSelectedDay(date)}
                    className={cn(
                      "relative aspect-[1.15/1] border-r border-b border-ink/8 p-2 text-left transition-colors",
                      !inMonth && "bg-cream/30 text-muted",
                      inMonth && "hover:bg-cream",
                      selected && "bg-copper/8 ring-2 ring-copper ring-inset",
                      today && !selected && "bg-cream",
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <span
                        className={cn(
                          "font-display text-base tabular-nums",
                          today
                            ? "text-copper font-bold"
                            : inMonth
                            ? "text-ink"
                            : "text-muted",
                        )}
                      >
                        {date.getDate()}
                      </span>
                      {evs.length > 0 && (
                        <span className="font-mono text-[10px] text-muted">
                          {evs.length}
                        </span>
                      )}
                    </div>
                    {/* Petits points par type d'événement */}
                    <div className="mt-1.5 grid gap-1">
                      {evs.slice(0, 3).map((e, idx) => (
                        <div
                          key={idx}
                          className="px-1.5 py-0.5 rounded text-[10px] truncate"
                          style={{
                            background: `${KIND_STYLE[e.kind].color}15`,
                            color: KIND_STYLE[e.kind].color,
                          }}
                        >
                          {e.lead.fullName.split(" ")[0]}
                        </div>
                      ))}
                      {evs.length > 3 && (
                        <div className="text-[10px] text-muted">+{evs.length - 3}</div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Sidebar détail jour sélectionné */}
          <div className="lg:col-span-4">
            <div className="rounded-2xl border border-ink/10 bg-white shadow-soft p-5 sticky top-6">
              <div className="font-mono text-[10px] uppercase tracking-eyebrow text-copper">
                {selectedDay
                  ? "Détail du jour"
                  : "Aucun jour sélectionné"}
              </div>
              {selectedDay && (
                <div className="mt-2 font-display text-xl text-ink">
                  {selectedDay.toLocaleDateString("fr-FR", {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                  })}
                </div>
              )}

              {selectedDay && eventsForSelected.length === 0 && (
                <p className="mt-4 text-sm text-muted">
                  Aucun événement prévu ce jour.
                </p>
              )}

              <div className="mt-5 grid gap-3">
                {eventsForSelected.map((e, i) => {
                  const st = KIND_STYLE[e.kind];
                  return (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="p-3 rounded-xl border border-ink/10 bg-cream/40"
                      style={{ borderLeftColor: st.color, borderLeftWidth: 3 }}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="font-mono text-[10px] uppercase tracking-eyebrow" style={{ color: st.color }}>
                          {st.label}
                        </div>
                        {e.kind === "booking" && (
                          <div className="inline-flex items-center gap-1 text-xs text-graphite tabular-nums">
                            <Clock className="h-3 w-3" />
                            {e.date.toLocaleTimeString("fr-FR", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </div>
                        )}
                      </div>
                      <div className="mt-1.5 text-sm font-medium text-ink truncate">
                        {e.lead.fullName}
                      </div>
                      <div className="mt-0.5 text-xs text-muted truncate">
                        {e.lead.services.join(" · ")} · {e.lead.commune}
                      </div>
                      <div className="mt-2 pt-2 border-t border-ink/8 flex items-center justify-between gap-2">
                        <a
                          href={`tel:${e.lead.phone.replace(/\s/g, "")}`}
                          className="text-xs font-mono uppercase tracking-eyebrow text-graphite hover:text-copper inline-flex items-center gap-1"
                        >
                          <Phone className="h-3 w-3" />
                          Appeler
                        </a>
                        <Link
                          href={`/admin/leads/${e.lead.reference}`}
                          className="text-xs font-mono uppercase tracking-eyebrow text-ink hover:text-copper inline-flex items-center gap-1"
                        >
                          Dossier
                          <ArrowUpRight className="h-3 w-3" />
                        </Link>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
