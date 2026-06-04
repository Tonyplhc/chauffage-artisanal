"use client";

/**
 * Badge SLA inline pour les cards/lignes de lead.
 *
 * Lit le lead côté client, calcule l'état via lib/sla-tracker, affiche un
 * petit chip discret :
 *   - "OK" si dans les temps
 *   - "1h30 sur cible" si breached
 *   - "approche 1h" si warning
 *   - rien si lead converti/perdu/na
 *
 * Volontairement discret : c'est un signal indicatif. Ne crie pas.
 */

import { Clock } from "lucide-react";
import { assessLeadSla, formatDuration } from "@/lib/sla-tracker";
import type { LeadRecord } from "@/lib/devis-schema";

export function SlaBadge({
  lead,
  compact = false,
}: {
  lead: LeadRecord;
  compact?: boolean;
}) {
  const a = assessLeadSla(lead);

  if (a.status === "na" || a.status === "ok") {
    if (a.status === "ok" && a.firstResponseAt && !compact) {
      return (
        <span
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono uppercase tracking-eyebrow bg-[#22a06b]/10 text-[#22a06b]"
          title={`1ère réponse en ${formatDuration(a.elapsedMs)} (cible ${formatDuration(a.targetMs)})`}
        >
          <Clock className="h-2.5 w-2.5" />
          SLA OK
        </span>
      );
    }
    return null;
  }

  if (a.status === "pending") {
    const remaining = Math.max(0, a.targetMs - a.elapsedMs);
    return (
      <span
        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono uppercase tracking-eyebrow bg-cream border border-ink/10 text-graphite"
        title={`Cible : ${formatDuration(a.targetMs)} · reste ${formatDuration(remaining)}`}
      >
        <Clock className="h-2.5 w-2.5" />
        {formatDuration(remaining)} restantes
      </span>
    );
  }

  if (a.status === "warning") {
    return (
      <span
        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono uppercase tracking-eyebrow bg-copper/10 text-copper"
        title={`Approche cible (${formatDuration(a.targetMs)})`}
      >
        <Clock className="h-2.5 w-2.5" />
        SLA proche
      </span>
    );
  }

  // breach
  const overBy = a.elapsedMs - a.targetMs;
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono uppercase tracking-eyebrow bg-ember/10 text-ember"
      title={`Cible dépassée de ${formatDuration(Math.max(0, overBy))} (${formatDuration(a.elapsedMs)} / cible ${formatDuration(a.targetMs)})`}
    >
      <Clock className="h-2.5 w-2.5" />
      SLA +{formatDuration(Math.max(0, overBy))}
    </span>
  );
}
