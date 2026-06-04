"use client";

/**
 * Bloc "Next best action" pour la fiche lead.
 *
 * Affiche jusqu'à 3 suggestions priorisées avec leur raison + CTA. Cliquer
 * suit le lien (tel:, mailto:, ou route admin interne).
 */

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  Sparkles,
  Phone,
  Mail,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

type Action = {
  id: string;
  type: "call" | "email" | "schedule" | "status" | "internal";
  title: string;
  reason: string;
  priority: number;
  cta?: {
    href?: string;
    label: string;
  };
};

const ICONS: Record<Action["type"], typeof Phone> = {
  call: Phone,
  email: Mail,
  schedule: Calendar,
  status: CheckCircle2,
  internal: AlertCircle,
};

const COLORS: Record<Action["type"], { bg: string; fg: string }> = {
  call: { bg: "rgba(220,90,40,0.12)", fg: "#dc5a28" },
  email: { bg: "rgba(107,163,197,0.12)", fg: "#6ba3c5" },
  schedule: { bg: "rgba(184,106,54,0.12)", fg: "#b86a36" },
  status: { bg: "rgba(34,160,107,0.12)", fg: "#22a06b" },
  internal: { bg: "rgba(139,132,122,0.12)", fg: "#8b847a" },
};

export function NextBestActionBlock({ reference }: { reference: string }) {
  const [actions, setActions] = useState<Action[] | null>(null);

  const load = useCallback(async () => {
    const res = await fetch(`/api/admin/leads/${reference}/actions`, {
      cache: "no-store",
    });
    if (res.ok) {
      const data = await res.json();
      setActions(data.actions ?? []);
    } else {
      setActions([]);
    }
  }, [reference]);

  useEffect(() => {
    load();
    const i = setInterval(load, 60_000);
    return () => clearInterval(i);
  }, [load]);

  if (actions === null) {
    return (
      <div className="rounded-2xl border border-ink/10 bg-white shadow-soft p-5">
        <Loader2 className="h-4 w-4 animate-spin text-muted" />
      </div>
    );
  }

  if (actions.length === 0) {
    // Silent : pas d'action recommandée = tout va bien
    return null;
  }

  const top = actions.slice(0, 3);

  return (
    <div className="rounded-2xl border border-ink/10 bg-white shadow-soft overflow-hidden">
      <div className="px-5 py-3 border-b border-ink/8 bg-cream/40 flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-copper" />
        <span className="font-mono text-[10px] uppercase tracking-eyebrow text-copper">
          Suggestions
        </span>
        <span className="ml-auto font-mono text-[10px] text-muted">
          basées sur règles · transparentes
        </span>
      </div>
      <ul className="divide-y divide-ink/8">
        {top.map((a) => {
          const Icon = ICONS[a.type];
          const colors = COLORS[a.type];
          const Wrapper = a.cta?.href
            ? a.cta.href.startsWith("tel:") || a.cta.href.startsWith("mailto:")
              ? "a"
              : "link"
            : "div";
          const content = (
            <div className="flex items-start gap-3 px-5 py-3 hover:bg-cream/40 transition-colors group">
              <div
                className="h-9 w-9 rounded-full grid place-items-center shrink-0"
                style={{ background: colors.bg, color: colors.fg }}
              >
                <Icon className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-ink truncate">
                    {a.title}
                  </span>
                  <PriorityBadge priority={a.priority} />
                </div>
                <div className="text-xs text-graphite mt-1 leading-relaxed">
                  {a.reason}
                </div>
                {a.cta && (
                  <div
                    className={cn(
                      "mt-2 inline-flex items-center gap-1 text-xs font-medium",
                    )}
                    style={{ color: colors.fg }}
                  >
                    {a.cta.label}
                    <ArrowRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                )}
              </div>
            </div>
          );
          if (Wrapper === "a") {
            return (
              <li key={a.id}>
                <a href={a.cta?.href}>{content}</a>
              </li>
            );
          }
          if (Wrapper === "link" && a.cta?.href) {
            return (
              <li key={a.id}>
                <Link href={a.cta.href}>{content}</Link>
              </li>
            );
          }
          return <li key={a.id}>{content}</li>;
        })}
      </ul>
    </div>
  );
}

function PriorityBadge({ priority }: { priority: number }) {
  let color = "#8b847a";
  let label = "low";
  if (priority >= 8) {
    color = "#dc5a28";
    label = "urgent";
  } else if (priority >= 5) {
    color = "#b86a36";
    label = "important";
  }
  return (
    <span
      className="px-1.5 py-0.5 rounded-full text-[9px] font-mono uppercase tracking-eyebrow"
      style={{ background: `${color}1c`, color }}
    >
      {label}
    </span>
  );
}
