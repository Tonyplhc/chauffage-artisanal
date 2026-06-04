"use client";

/**
 * Trail audit granulaire pour la fiche lead — diff champ par champ.
 *
 * Affiche les modifications détaillées : qui, quand, quel champ, valeur
 * avant / valeur après. Silencieux si aucun diff.
 */

import { useEffect, useState, useCallback } from "react";
import {
  Loader2,
  GitBranch,
  ArrowRight,
  User,
} from "lucide-react";

type Diff = {
  id: string;
  at: string;
  actorEmail?: string;
  entityType: string;
  entityId: string;
  field: string;
  oldValue: unknown;
  newValue: unknown;
};

function renderValue(v: unknown): string {
  if (v === null || v === undefined) return "(vide)";
  if (typeof v === "string") return v || "(vide)";
  if (typeof v === "boolean" || typeof v === "number") return String(v);
  try {
    return JSON.stringify(v);
  } catch {
    return "(complexe)";
  }
}

const FIELD_LABELS: Record<string, string> = {
  status: "Statut",
  notes: "Notes",
  assignedTo: "Assigné à",
  level: "Niveau",
  score: "Score",
};

export function LeadAuditTrail({ reference }: { reference: string }) {
  const [diffs, setDiffs] = useState<Diff[] | null>(null);

  const load = useCallback(async () => {
    const res = await fetch(
      `/api/admin/audit-diff?entityType=lead&entityId=${reference}&limit=100`,
      { cache: "no-store" },
    );
    if (res.ok) {
      const d = await res.json();
      setDiffs(d.diffs ?? []);
    }
  }, [reference]);

  useEffect(() => {
    load();
    const i = setInterval(load, 30_000);
    return () => clearInterval(i);
  }, [load]);

  if (diffs === null) {
    return (
      <div className="rounded-2xl border border-ink/10 bg-white shadow-soft p-5">
        <Loader2 className="h-4 w-4 animate-spin text-muted" />
      </div>
    );
  }

  if (diffs.length === 0) return null;

  return (
    <div className="rounded-2xl border border-ink/10 bg-white shadow-soft p-5">
      <div className="flex items-center gap-2 mb-3">
        <GitBranch className="h-4 w-4 text-copper" />
        <span className="font-mono text-[10px] uppercase tracking-eyebrow text-copper">
          Trail audit (diff)
        </span>
        <span className="ml-auto font-mono text-xs text-muted">
          {diffs.length}
        </span>
      </div>
      <ul className="grid gap-2 max-h-[420px] overflow-y-auto">
        {diffs.map((d) => (
          <li
            key={d.id}
            className="p-2.5 rounded-xl bg-cream border border-ink/8"
          >
            <div className="flex items-center gap-1.5 mb-1 flex-wrap">
              <span className="text-xs font-medium text-ink">
                {FIELD_LABELS[d.field] ?? d.field}
              </span>
              <span className="text-[10px] text-muted">·</span>
              <span className="text-[10px] text-muted font-mono">
                {new Date(d.at).toLocaleString("fr-FR")}
              </span>
              {d.actorEmail && (
                <span className="inline-flex items-center gap-0.5 text-[10px] text-graphite font-mono ml-auto">
                  <User className="h-2.5 w-2.5" />
                  {d.actorEmail}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className="line-through text-muted bg-white px-1.5 py-0.5 rounded border border-ink/5 max-w-[40%] truncate">
                {renderValue(d.oldValue)}
              </span>
              <ArrowRight className="h-3 w-3 text-copper shrink-0" />
              <span className="text-ink bg-white px-1.5 py-0.5 rounded border border-copper/30 max-w-[40%] truncate">
                {renderValue(d.newValue)}
              </span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
