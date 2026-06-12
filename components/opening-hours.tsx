"use client";

/**
 * Horaires d'ouverture — affichage rich avec statut temps réel.
 *
 * Variantes :
 *   - "table" : grille semaine complète (pour /contact, footer, home aside)
 *   - "badge" : juste le statut compact "Ouvert maintenant" / "Fermé"
 *
 * Source unique : COMPANY.hours dans lib/company-info.ts → JSON-LD aussi.
 * Les heures fr-LU sont calculées via Intl pour rester correctes été/hiver.
 */

import { useEffect, useState } from "react";
import { Clock, CircleDot } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Horaires hebdomadaires — alignés sur les données publiques editus.lu.
 *
 * Indexé par jour de semaine ISO (1=Lundi, 7=Dimanche). Chaque jour peut
 * avoir 0..N créneaux. La pause méridienne 12h-13h est représentée par
 * 2 créneaux distincts (matin + après-midi).
 */
type Slot = { from: string; to: string };
type WeekSchedule = Record<1 | 2 | 3 | 4 | 5 | 6 | 7, Slot[]>;

const SCHEDULE: WeekSchedule = {
  1: [
    { from: "08:00", to: "12:00" },
    { from: "13:00", to: "17:00" },
  ],
  2: [
    { from: "08:00", to: "12:00" },
    { from: "13:00", to: "17:00" },
  ],
  3: [
    { from: "08:00", to: "12:00" },
    { from: "13:00", to: "17:00" },
  ],
  4: [
    { from: "08:00", to: "12:00" },
    { from: "13:00", to: "17:00" },
  ],
  5: [
    { from: "08:00", to: "12:00" },
    { from: "13:00", to: "17:00" },
  ],
  6: [], // Samedi fermé
  7: [], // Dimanche fermé
};

const DAY_LABELS: Record<1 | 2 | 3 | 4 | 5 | 6 | 7, string> = {
  1: "Lundi",
  2: "Mardi",
  3: "Mercredi",
  4: "Jeudi",
  5: "Vendredi",
  6: "Samedi",
  7: "Dimanche",
};

/* ─────────────── Logique horaire ─────────────── */

/** Convertit "HH:mm" → minutes depuis minuit. */
function toMinutes(hm: string): number {
  const [h, m] = hm.split(":").map(Number);
  return h * 60 + m;
}

function pad2(n: number): string {
  return n < 10 ? `0${n}` : `${n}`;
}

/**
 * Status courant calculé côté client pour éviter tout problème de cache
 * SSR. Renvoie l'état + le prochain événement (ouverture ou fermeture).
 */
type LiveStatus =
  | { kind: "open"; until: string }
  | { kind: "soon"; opensAt: string; today: boolean }
  | { kind: "closed_today"; opensNextDayAt: string; nextDayLabel: string }
  | { kind: "closed_indefinite" }; // fallback (ne devrait pas arriver)

function computeLiveStatus(now: Date): LiveStatus {
  // Heure locale Luxembourg via Intl (gère DST automatiquement)
  const fmt = new Intl.DateTimeFormat("fr-LU", {
    timeZone: "Europe/Luxembourg",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  const parts = fmt.formatToParts(now);
  const hh = parts.find((p) => p.type === "hour")?.value ?? "00";
  const mm = parts.find((p) => p.type === "minute")?.value ?? "00";
  const minutesNow = toMinutes(`${hh}:${mm}`);

  // Jour ISO LU
  const isoDay = ((): 1 | 2 | 3 | 4 | 5 | 6 | 7 => {
    const wd = new Intl.DateTimeFormat("en-GB", {
      timeZone: "Europe/Luxembourg",
      weekday: "short",
    }).format(now);
    const map: Record<string, 1 | 2 | 3 | 4 | 5 | 6 | 7> = {
      Mon: 1,
      Tue: 2,
      Wed: 3,
      Thu: 4,
      Fri: 5,
      Sat: 6,
      Sun: 7,
    };
    return map[wd] ?? 1;
  })();

  // Cherche un créneau couvrant maintenant
  const todaySlots = SCHEDULE[isoDay];
  for (const s of todaySlots) {
    const open = toMinutes(s.from);
    const close = toMinutes(s.to);
    if (minutesNow >= open && minutesNow < close) {
      return { kind: "open", until: s.to };
    }
  }

  // Sinon, prochain créneau aujourd'hui
  for (const s of todaySlots) {
    const open = toMinutes(s.from);
    if (minutesNow < open) {
      return { kind: "soon", opensAt: s.from, today: true };
    }
  }

  // Sinon, prochain jour ouvert
  for (let offset = 1; offset <= 7; offset++) {
    const nextIso = (((isoDay - 1 + offset) % 7) + 1) as 1 | 2 | 3 | 4 | 5 | 6 | 7;
    const slots = SCHEDULE[nextIso];
    if (slots.length > 0) {
      return {
        kind: "closed_today",
        opensNextDayAt: slots[0].from,
        nextDayLabel: DAY_LABELS[nextIso],
      };
    }
  }

  return { kind: "closed_indefinite" };
}

/* ─────────────── Badge status compact ─────────────── */

export function OpeningStatusBadge({
  className,
}: {
  className?: string;
}) {
  const [status, setStatus] = useState<LiveStatus | null>(null);

  useEffect(() => {
    const tick = () => setStatus(computeLiveStatus(new Date()));
    tick();
    const i = setInterval(tick, 60_000);
    return () => clearInterval(i);
  }, []);

  if (!status) {
    // SSR fallback : invisible le temps que le client calcule
    return null;
  }

  if (status.kind === "open") {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono uppercase tracking-eyebrow border bg-[#2E7D5A]/10 border-[#2E7D5A]/40 text-[#2E7D5A]",
          className,
        )}
        aria-label={`Ouvert maintenant, jusqu'à ${status.until}`}
      >
        <CircleDot className="h-3 w-3 animate-pulse" />
        Ouvert · jusqu&apos;à {status.until}
      </span>
    );
  }

  if (status.kind === "soon") {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono uppercase tracking-eyebrow border bg-bleu/10 border-bleu/40 text-bleu",
          className,
        )}
        aria-label={`Fermé, ouvre à ${status.opensAt}`}
      >
        <Clock className="h-3 w-3" />
        Fermé · ouvre à {status.opensAt}
      </span>
    );
  }

  if (status.kind === "closed_today") {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono uppercase tracking-eyebrow border bg-sable/60 border-pierre text-taupe",
          className,
        )}
        aria-label={`Fermé, ouvre ${status.nextDayLabel} à ${status.opensNextDayAt}`}
      >
        <Clock className="h-3 w-3" />
        Fermé · ouvre {status.nextDayLabel} {status.opensNextDayAt}
      </span>
    );
  }

  return null;
}

/* ─────────────── Tableau hebdomadaire ─────────────── */

export function OpeningHoursTable({
  className,
  highlightToday = true,
  showStatus = true,
  emergencyLine = true,
}: {
  className?: string;
  /** Surligne la ligne du jour courant. */
  highlightToday?: boolean;
  /** Affiche le badge Ouvert/Fermé au-dessus. */
  showStatus?: boolean;
  /** Mention astreinte dépannage en bas. */
  emergencyLine?: boolean;
}) {
  const [todayIso, setTodayIso] = useState<1 | 2 | 3 | 4 | 5 | 6 | 7 | null>(
    null,
  );

  useEffect(() => {
    const tick = () => {
      const wd = new Intl.DateTimeFormat("en-GB", {
        timeZone: "Europe/Luxembourg",
        weekday: "short",
      }).format(new Date());
      const map: Record<string, 1 | 2 | 3 | 4 | 5 | 6 | 7> = {
        Mon: 1,
        Tue: 2,
        Wed: 3,
        Thu: 4,
        Fri: 5,
        Sat: 6,
        Sun: 7,
      };
      setTodayIso(map[wd] ?? null);
    };
    tick();
    const i = setInterval(tick, 60_000);
    return () => clearInterval(i);
  }, []);

  const days = [1, 2, 3, 4, 5, 6, 7] as const;

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h3 className="font-display text-lg text-anthra">Horaires d&apos;ouverture</h3>
        {showStatus && <OpeningStatusBadge />}
      </div>
      <ul className="grid gap-px bg-sable/60 rounded-2xl overflow-hidden border border-pierre">
        {days.map((d) => {
          const slots = SCHEDULE[d];
          const isToday = highlightToday && todayIso === d;
          const closed = slots.length === 0;
          return (
            <li
              key={d}
              className={cn(
                "flex items-baseline justify-between gap-3 px-4 py-2.5 text-sm",
                isToday
                  ? "bg-bleu/8"
                  : closed
                    ? "bg-creme/40"
                    : "bg-white",
              )}
            >
              <span
                className={cn(
                  "font-medium",
                  isToday ? "text-bleu" : closed ? "text-muted" : "text-anthra",
                )}
              >
                {DAY_LABELS[d]}
                {isToday && (
                  <span className="ml-2 font-mono text-[10px] uppercase tracking-eyebrow text-bleu">
                    Aujourd&apos;hui
                  </span>
                )}
              </span>
              <span
                className={cn(
                  "font-mono tabular-nums text-right",
                  closed
                    ? "text-muted italic"
                    : isToday
                      ? "text-bleu"
                      : "text-taupe",
                )}
              >
                {closed
                  ? "Fermé"
                  : slots
                      .map(
                        (s) =>
                          `${s.from.replace(":", "h")} – ${s.to.replace(":", "h")}`,
                      )
                      .join(" / ")}
              </span>
            </li>
          );
        })}
      </ul>
      {emergencyLine && (
        <p className="text-xs text-muted leading-relaxed">
          <span className="inline-block w-2 h-2 rounded-full bg-terracotta mr-2 align-middle" />
          Astreinte dépannage hors horaires (chauffage en panne, fuite) — appel
          direct.
        </p>
      )}
    </div>
  );
}
