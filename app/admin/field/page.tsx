"use client";

/**
 * Mode terrain technicien — interface mobile-first.
 *
 * Vue centrée sur "aujourd'hui" :
 *   - Mes slots du jour (auto-filtre sur user connecté)
 *   - Pointage clock-in/out en 1 tap
 *   - Démarrer une checklist sécurité ou un compte-rendu visite
 *   - Lien rapide vers la fiche lead du slot
 *
 * Volontairement compact : grands boutons, peu de texte, optimisé pour usage
 * sur chantier (1 main, gants, plein soleil).
 */

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Loader2,
  Play,
  Square,
  CheckCircle2,
  Clock,
  ShieldCheck,
  FileText,
  ArrowRight,
  Calendar,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { PlanningTabs } from "@/components/admin/planning-tabs";

type Slot = {
  id: string;
  technicianEmail: string;
  leadReference?: string;
  kind: "intervention" | "rdv" | "admin" | "formation";
  title: string;
  startAt: string;
  durationMin: number;
  location?: string;
  actualStartAt?: string;
  actualEndAt?: string;
};

const KIND_COLORS = {
  intervention: "#b86a36",
  rdv: "#6ba3c5",
  admin: "#8b847a",
  formation: "#7a5cc6",
};

function startOfDay(d: Date): Date {
  const r = new Date(d);
  r.setHours(0, 0, 0, 0);
  return r;
}

function endOfDay(d: Date): Date {
  const r = new Date(d);
  r.setHours(23, 59, 59, 999);
  return r;
}

function addDays(d: Date, n: number): Date {
  const r = new Date(d);
  r.setDate(d.getDate() + n);
  return r;
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function fmtTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function startOfMonth(d: Date): Date {
  const r = new Date(d.getFullYear(), d.getMonth(), 1);
  r.setHours(0, 0, 0, 0);
  return r;
}

function endOfMonth(d: Date): Date {
  const r = new Date(d.getFullYear(), d.getMonth() + 1, 0);
  r.setHours(23, 59, 59, 999);
  return r;
}

export default function FieldPage() {
  const router = useRouter();
  const [day, setDay] = useState<Date>(startOfDay(new Date()));
  const [slots, setSlots] = useState<Slot[] | null>(null);
  const [monthSlots, setMonthSlots] = useState<Slot[]>([]);
  const [currentEmail, setCurrentEmail] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [showMonth, setShowMonth] = useState(true);

  const load = useCallback(async () => {
    const from = startOfDay(day).toISOString();
    const to = endOfDay(day).toISOString();
    const res = await fetch(
      `/api/admin/dispatch?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`,
      { cache: "no-store" },
    );
    if (res.status === 401) {
      router.replace("/admin/login");
      return;
    }
    if (res.ok) {
      const d = await res.json();
      setSlots(d.slots ?? []);
    }
    // Charge les slots du mois entier pour le calendrier
    const monthFrom = startOfMonth(day).toISOString();
    const monthTo = endOfMonth(day).toISOString();
    fetch(
      `/api/admin/dispatch?from=${encodeURIComponent(monthFrom)}&to=${encodeURIComponent(monthTo)}`,
      { cache: "no-store" },
    )
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d && Array.isArray(d.slots)) setMonthSlots(d.slots);
      })
      .catch(() => {});
    // tentative de récupération du user courant
    fetch("/api/admin/me", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d) setCurrentEmail(d.email ?? d.user?.email ?? null);
      })
      .catch(() => {});
  }, [day, router]);

  useEffect(() => {
    load();
    const i = setInterval(load, 30_000);
    return () => clearInterval(i);
  }, [load]);

  const mySlots = (slots ?? []).filter(
    (s) =>
      !currentEmail ||
      s.technicianEmail.toLowerCase() === currentEmail.toLowerCase(),
  );

  const clock = async (id: string, action: "in" | "out") => {
    setBusy(id);
    try {
      await fetch(`/api/admin/dispatch/${id}/clock`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      await load();
    } finally {
      setBusy(null);
    }
  };

  const isToday = isSameDay(day, new Date());

  return (
    <div className="min-h-screen bg-cream pb-24">
      <div className="container max-w-4xl pt-4">
        <PlanningTabs />
      </div>
      {/* Header */}
      <header className="sticky top-0 z-20 bg-cream/95 backdrop-blur border-b border-ink/8 px-4 py-3 flex items-center gap-2">
        <Link
          href="/admin/leads"
          className="h-9 w-9 grid place-items-center rounded-full bg-white border border-ink/10 text-graphite"
          aria-label="Retour pipeline"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div className="flex-1 min-w-0">
          <div className="font-mono text-[9px] uppercase tracking-eyebrow text-copper">
            Mode terrain
          </div>
          <div className="text-sm font-medium text-ink truncate">
            {currentEmail ?? "Aujourd'hui"}
          </div>
        </div>
        <button
          onClick={() => setDay(addDays(day, -1))}
          className="h-9 w-9 grid place-items-center rounded-full bg-white border border-ink/10"
          aria-label="Jour précédent"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <div className="px-2 text-xs font-mono">
          <div className="text-ink font-medium">
            {day.toLocaleDateString("fr-FR", { weekday: "short" })}
          </div>
          <div className="text-muted">
            {day.toLocaleDateString("fr-FR", {
              day: "2-digit",
              month: "short",
            })}
          </div>
        </div>
        <button
          onClick={() => setDay(addDays(day, 1))}
          className="h-9 w-9 grid place-items-center rounded-full bg-white border border-ink/10"
          aria-label="Jour suivant"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </header>

      <main className="px-4 py-4 max-w-2xl mx-auto">
        {!isToday && (
          <button
            onClick={() => setDay(startOfDay(new Date()))}
            className="mb-4 w-full inline-flex items-center justify-center gap-1.5 rounded-full bg-copper/10 border border-copper/30 text-copper px-3 py-2 text-xs hover:bg-copper hover:text-cream"
          >
            <Calendar className="h-3 w-3" />
            Aller à aujourd&apos;hui
          </button>
        )}

        {/* Calendrier mensuel cliquable */}
        <div className="mb-4 rounded-2xl border border-ink/10 bg-white shadow-soft overflow-hidden">
          <button
            onClick={() => setShowMonth((v) => !v)}
            className="w-full px-4 py-2.5 flex items-center justify-between text-xs font-mono uppercase tracking-eyebrow text-copper hover:bg-cream/40"
          >
            <span className="inline-flex items-center gap-1.5">
              <Calendar className="h-3 w-3" />
              {day.toLocaleDateString("fr-FR", {
                month: "long",
                year: "numeric",
              })}
            </span>
            <span>{showMonth ? "Masquer" : "Afficher"}</span>
          </button>
          {showMonth && (
            <MonthCalendar
              currentDay={day}
              monthSlots={monthSlots}
              onPickDay={(d) => setDay(startOfDay(d))}
              userEmail={currentEmail}
            />
          )}
        </div>

        {/* Détail par créneaux horaires si jour avec interventions */}
        {slots && slots.length > 0 && (
          <SlotsByTimeBlocks slots={mySlots} />
        )}

        {slots === null ? (
          <div className="py-12 text-center text-muted">
            <Loader2 className="h-6 w-6 animate-spin mx-auto" />
          </div>
        ) : mySlots.length === 0 ? (
          <div className="rounded-2xl border border-ink/10 bg-white p-8 text-center text-muted">
            <Calendar className="h-12 w-12 mx-auto opacity-30 text-copper mb-2" />
            <p>Pas d&apos;intervention ce jour-là.</p>
            <p className="text-xs mt-1">Profitez de la journée 🙏</p>
          </div>
        ) : (
          <ul className="grid gap-3">
            {mySlots.map((s) => {
              const inProgress = !!s.actualStartAt && !s.actualEndAt;
              const done = !!s.actualStartAt && !!s.actualEndAt;
              const color = KIND_COLORS[s.kind];
              return (
                <li
                  key={s.id}
                  className={cn(
                    "rounded-2xl bg-white border shadow-soft overflow-hidden",
                    done
                      ? "border-[#22a06b]/30"
                      : inProgress
                        ? "border-copper/40"
                        : "border-ink/10",
                  )}
                >
                  <div
                    className="px-4 py-2 flex items-center gap-2"
                    style={{ background: `${color}1c`, color }}
                  >
                    <Clock className="h-3.5 w-3.5" />
                    <span className="font-mono text-xs font-medium">
                      {fmtTime(s.startAt)} · {s.durationMin} min
                    </span>
                    {done && (
                      <span className="ml-auto inline-flex items-center gap-1 text-[10px] font-mono uppercase tracking-eyebrow text-[#22a06b]">
                        <CheckCircle2 className="h-2.5 w-2.5" />
                        Terminé
                      </span>
                    )}
                    {inProgress && (
                      <span className="ml-auto inline-flex items-center gap-1 text-[10px] font-mono uppercase tracking-eyebrow text-copper">
                        <Play className="h-2.5 w-2.5" />
                        En cours
                      </span>
                    )}
                  </div>
                  <div className="p-4">
                    <div className="font-display text-lg text-ink leading-tight">
                      {s.title}
                    </div>
                    {s.location && (
                      <div className="text-xs text-graphite mt-0.5">
                        📍 {s.location}
                      </div>
                    )}
                    {s.leadReference && (
                      <Link
                        href={`/admin/leads/${s.leadReference}`}
                        className="text-[11px] text-copper font-mono hover:underline mt-1 inline-block"
                      >
                        {s.leadReference} →
                      </Link>
                    )}
                    {(s.actualStartAt || s.actualEndAt) && (
                      <div className="text-[10px] text-muted font-mono mt-2">
                        Pointage : {s.actualStartAt ? fmtTime(s.actualStartAt) : "—"}{" "}
                        →{" "}
                        {s.actualEndAt ? fmtTime(s.actualEndAt) : "en cours"}
                      </div>
                    )}

                    <div className="mt-3 grid grid-cols-2 gap-2">
                      {!s.actualStartAt && (
                        <button
                          onClick={() => clock(s.id, "in")}
                          disabled={busy === s.id}
                          className="inline-flex items-center justify-center gap-1.5 h-12 rounded-xl bg-[#22a06b] text-cream text-sm font-medium disabled:opacity-50"
                        >
                          {busy === s.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Play className="h-4 w-4" />
                          )}
                          Pointer arrivée
                        </button>
                      )}
                      {inProgress && (
                        <button
                          onClick={() => clock(s.id, "out")}
                          disabled={busy === s.id}
                          className="inline-flex items-center justify-center gap-1.5 h-12 rounded-xl bg-ink text-cream text-sm font-medium disabled:opacity-50 col-span-2"
                        >
                          {busy === s.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Square className="h-4 w-4" />
                          )}
                          Pointer fin
                        </button>
                      )}
                      {done && (
                        <div className="col-span-2 inline-flex items-center justify-center gap-1.5 h-12 rounded-xl bg-[#22a06b]/10 text-[#22a06b] text-sm font-medium">
                          <CheckCircle2 className="h-4 w-4" />
                          Intervention terminée
                        </div>
                      )}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </main>

      {/* Bottom bar — actions rapides */}
      <nav className="fixed bottom-0 inset-x-0 z-20 bg-white border-t border-ink/10 px-3 py-2 shadow-lift">
        <div className="max-w-2xl mx-auto grid grid-cols-3 gap-2">
          <Link
            href="/admin/safety"
            className="flex flex-col items-center gap-0.5 py-1.5 text-graphite hover:text-copper"
          >
            <ShieldCheck className="h-5 w-5" />
            <span className="text-[10px] font-mono uppercase tracking-eyebrow">
              Sécurité
            </span>
          </Link>
          <Link
            href="/admin/visits"
            className="flex flex-col items-center gap-0.5 py-1.5 text-graphite hover:text-copper"
            title="Comptes-rendus d'intervention — signature client, notes terrain, checklist"
          >
            <FileText className="h-5 w-5" />
            <span className="text-[10px] font-mono uppercase tracking-eyebrow">
              Interventions
            </span>
          </Link>
          <Link
            href="/admin/dispatch"
            className="flex flex-col items-center gap-0.5 py-1.5 text-graphite hover:text-copper"
          >
            <Calendar className="h-5 w-5" />
            <span className="text-[10px] font-mono uppercase tracking-eyebrow">
              Semaine
            </span>
          </Link>
        </div>
      </nav>
      {/* Suppress unused */}
      <span className="hidden">
        <ArrowRight className="h-3 w-3" />
      </span>
    </div>
  );
}


/* ─── MonthCalendar : grille mensuelle cliquable ─────────────── */

function MonthCalendar({
  currentDay,
  monthSlots,
  onPickDay,
  userEmail,
}: {
  currentDay: Date;
  monthSlots: Slot[];
  onPickDay: (d: Date) => void;
  userEmail: string | null;
}) {
  // Construit la grille : commence par lundi de la semaine du 1er du mois
  const firstOfMonth = new Date(currentDay.getFullYear(), currentDay.getMonth(), 1);
  const lastOfMonth = new Date(currentDay.getFullYear(), currentDay.getMonth() + 1, 0);
  // Jour de la semaine (0=dim, 1=lun, … 6=sam). On veut commencer le lundi.
  const startWeekday = (firstOfMonth.getDay() + 6) % 7; // 0=lun
  const startDate = new Date(firstOfMonth);
  startDate.setDate(firstOfMonth.getDate() - startWeekday);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Compte des slots par jour (filtre user si connu)
  const countByDay = new Map<string, number>();
  for (const s of monthSlots) {
    if (userEmail && s.technicianEmail.toLowerCase() !== userEmail.toLowerCase()) {
      continue;
    }
    const d = new Date(s.startAt);
    const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    countByDay.set(key, (countByDay.get(key) ?? 0) + 1);
  }

  const cells: Date[] = [];
  for (let i = 0; i < 42; i++) {
    const d = new Date(startDate);
    d.setDate(startDate.getDate() + i);
    cells.push(d);
    if (i >= 28 && d > lastOfMonth && d.getDay() === 0) break;
  }

  const WEEKDAYS = ["L", "M", "M", "J", "V", "S", "D"];

  return (
    <div className="p-3">
      <div className="grid grid-cols-7 gap-1 mb-2">
        {WEEKDAYS.map((wd, i) => (
          <div key={i} className="text-center text-[10px] font-mono uppercase tracking-eyebrow text-muted">
            {wd}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {cells.map((d, i) => {
          const inMonth = d.getMonth() === currentDay.getMonth();
          const isToday = isSameDay(d, today);
          const isSelected = isSameDay(d, currentDay);
          const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
          const count = countByDay.get(key) ?? 0;
          return (
            <button
              key={i}
              onClick={() => onPickDay(d)}
              className={cn(
                "aspect-square rounded-md text-xs font-mono relative flex flex-col items-center justify-center transition-colors",
                isSelected
                  ? "bg-ink text-cream"
                  : isToday
                    ? "bg-copper/15 text-copper border border-copper/30"
                    : inMonth
                      ? "text-ink hover:bg-cream"
                      : "text-muted/40 hover:bg-cream",
              )}
            >
              <span>{d.getDate()}</span>
              {count > 0 && (
                <span
                  className={cn(
                    "absolute bottom-1 inline-block h-1 w-1 rounded-full",
                    isSelected ? "bg-cream" : "bg-copper",
                  )}
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ─── SlotsByTimeBlocks : regroupe les interventions par tranche horaire ──── */

const TIME_BLOCKS = [
  { id: "matin", label: "6 h – 8 h", from: 6, to: 8 },
  { id: "avantmidi", label: "9 h – 12 h", from: 9, to: 12 },
  { id: "aprm", label: "14 h – 18 h", from: 14, to: 18 },
  { id: "soir", label: "18 h – 22 h", from: 18, to: 22 },
];

function SlotsByTimeBlocks({ slots }: { slots: Slot[] }) {
  if (slots.length === 0) return null;
  const grouped: Record<string, Slot[]> = {};
  for (const block of TIME_BLOCKS) {
    grouped[block.id] = slots.filter((s) => {
      const h = new Date(s.startAt).getHours();
      return h >= block.from && h < block.to;
    });
  }
  const totalInBlocks = TIME_BLOCKS.reduce((s, b) => s + grouped[b.id].length, 0);
  const outsideBlocks = slots.length - totalInBlocks;

  return (
    <div className="mb-4 rounded-2xl border border-ink/10 bg-white shadow-soft p-4">
      <div className="font-mono text-[10px] uppercase tracking-eyebrow text-copper mb-2">
        Vue par créneaux ({slots.length} intervention{slots.length > 1 ? "s" : ""})
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {TIME_BLOCKS.map((b) => {
          const list = grouped[b.id];
          return (
            <div
              key={b.id}
              className={cn(
                "rounded-xl px-3 py-2 border",
                list.length > 0
                  ? "bg-copper/5 border-copper/30"
                  : "bg-cream/40 border-ink/8",
              )}
            >
              <div className="text-[10px] font-mono uppercase tracking-eyebrow text-graphite">
                {b.label}
              </div>
              <div
                className={cn(
                  "font-display text-lg tabular-nums",
                  list.length > 0 ? "text-copper" : "text-muted",
                )}
              >
                {list.length}
              </div>
              {list.length > 0 && (
                <ul className="mt-1 space-y-0.5">
                  {list.slice(0, 2).map((s) => (
                    <li key={s.id} className="text-[10px] text-ink truncate">
                      {fmtTime(s.startAt)} {s.title}
                    </li>
                  ))}
                  {list.length > 2 && (
                    <li className="text-[10px] text-muted">
                      + {list.length - 2} autre{list.length - 2 > 1 ? "s" : ""}
                    </li>
                  )}
                </ul>
              )}
            </div>
          );
        })}
      </div>
      {outsideBlocks > 0 && (
        <p className="mt-2 text-[10px] text-muted">
          {outsideBlocks} intervention(s) hors créneaux standards (avant 6 h / après 22 h).
        </p>
      )}
    </div>
  );
}
