"use client";

/**
 * Bloc "Techniciens suggérés" sur la fiche lead.
 *
 * Affiche jusqu'à 3 propositions de techs avec score 0-100, breakdown
 * skill/proximité/charge, raison principale.
 */

import { useEffect, useState, useCallback } from "react";
import {
  Sparkles,
  Loader2,
  Star,
  MapPin,
  Layers,
  Calendar,
} from "lucide-react";
import Link from "next/link";

type Suggestion = {
  profile: {
    id: string;
    email: string;
    displayName: string;
    homeBase: string;
    skills: string[];
  };
  scoreTotal: number;
  skillScore: number;
  skillMatches: number;
  skillTotal: number;
  proximityScore: number;
  distanceKm: number;
  workloadScore: number;
  upcomingSlotCount: number;
  reason: string;
};

export function TechSuggestions({ reference }: { reference: string }) {
  const [suggestions, setSuggestions] = useState<Suggestion[] | null>(null);

  const load = useCallback(async () => {
    const res = await fetch(
      `/api/admin/leads/${reference}/tech-suggestions`,
      { cache: "no-store" },
    );
    if (res.ok) {
      const d = await res.json();
      setSuggestions(d.suggestions ?? []);
    } else {
      setSuggestions([]);
    }
  }, [reference]);

  useEffect(() => {
    load();
  }, [load]);

  if (suggestions === null) {
    return (
      <div className="rounded-2xl border border-ink/10 bg-white shadow-soft p-5">
        <Loader2 className="h-4 w-4 animate-spin text-muted" />
      </div>
    );
  }

  if (suggestions.length === 0) {
    return (
      <div className="rounded-2xl border border-ink/10 bg-white shadow-soft p-5">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="h-4 w-4 text-copper" />
          <span className="font-mono text-[10px] uppercase tracking-eyebrow text-copper">
            Techniciens suggérés
          </span>
        </div>
        <p className="text-xs text-graphite">
          Aucun profil technicien enregistré.{" "}
          <Link
            href="/admin/tech-profiles"
            className="text-copper hover:underline"
          >
            En ajouter
          </Link>
          .
        </p>
      </div>
    );
  }

  const top = suggestions.slice(0, 3);

  return (
    <div className="rounded-2xl border border-ink/10 bg-white shadow-soft overflow-hidden">
      <div className="px-5 py-3 border-b border-ink/8 bg-cream/40 flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-copper" />
        <span className="font-mono text-[10px] uppercase tracking-eyebrow text-copper">
          Techniciens suggérés
        </span>
        <span className="ml-auto font-mono text-[10px] text-muted">
          skill / proximité / charge
        </span>
      </div>
      <ul className="divide-y divide-ink/8">
        {top.map((s, i) => (
          <li key={s.profile.id} className="px-5 py-3">
            <div className="flex items-start gap-3">
              <div
                className="h-10 w-10 rounded-full grid place-items-center font-display tabular-nums shrink-0"
                style={{
                  background: i === 0 ? "#22a06b" : "#cea580",
                  color: "white",
                }}
              >
                {s.scoreTotal}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-ink truncate">
                    {s.profile.displayName}
                  </span>
                  {i === 0 && (
                    <Star className="h-3 w-3 fill-copper text-copper" />
                  )}
                </div>
                <div className="text-[11px] text-graphite mt-0.5">
                  {s.reason}
                </div>
                <div className="mt-1 flex items-center gap-3 text-[10px] font-mono text-muted">
                  <span className="inline-flex items-center gap-0.5">
                    <Layers className="h-2.5 w-2.5" />
                    {s.skillMatches}/{s.skillTotal}
                  </span>
                  <span className="inline-flex items-center gap-0.5">
                    <MapPin className="h-2.5 w-2.5" />
                    {s.distanceKm} km
                  </span>
                  <span className="inline-flex items-center gap-0.5">
                    <Calendar className="h-2.5 w-2.5" />
                    {s.upcomingSlotCount} slots/sem
                  </span>
                </div>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
