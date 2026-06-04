"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowUpRight,
  Inbox,
  ArrowRight,
  Edit3,
  Upload,
  Trash2,
  FileText,
  Send,
  Mail,
  Layers,
  Download,
  AlertTriangle,
  type LucideIcon,
} from "lucide-react";
import type { ActivityEntry, ActivityType } from "@/lib/activity-log";
import { cn } from "@/lib/utils";

// Partial : on map les types les plus fréquents ; les nouveaux types
// (ajoutés par les vagues récentes) utilisent un fallback générique au rendu.
const ICON_FOR_TYPE: Partial<Record<ActivityType, LucideIcon>> = {
  "lead.created": Inbox,
  "lead.status_changed": ArrowRight,
  "lead.notes_updated": Edit3,
  "lead.document_uploaded": Upload,
  "lead.document_deleted": Trash2,
  "lead.quote_saved": FileText,
  "lead.quote_sent": Send,
  "lead.template_sent": Mail,
  "lead.bulk_status": Layers,
  "lead.rgpd_export": Download,
  "lead.rgpd_delete": AlertTriangle,
  "catalogue.updated": FileText,
  "auth.login": ArrowRight,
  "auth.logout": ArrowRight,
};

const COLOR_FOR_TYPE: Partial<Record<ActivityType, string>> = {
  "lead.created": "#b86a36",
  "lead.status_changed": "#6ba3c5",
  "lead.notes_updated": "#8b847a",
  "lead.document_uploaded": "#22a06b",
  "lead.document_deleted": "#dc5a28",
  "lead.quote_saved": "#94532a",
  "lead.quote_sent": "#22a06b",
  "lead.template_sent": "#b86a36",
  "lead.bulk_status": "#6ba3c5",
  "lead.rgpd_export": "#94532a",
  "lead.rgpd_delete": "#dc5a28",
  "catalogue.updated": "#b86a36",
  "auth.login": "#22a06b",
  "auth.logout": "#8b847a",
};

const TYPE_FILTERS: { id: ActivityType | "all"; label: string }[] = [
  { id: "all", label: "Toutes" },
  { id: "lead.created", label: "Nouveaux leads" },
  { id: "lead.status_changed", label: "Transitions" },
  { id: "lead.quote_sent", label: "Devis envoyés" },
  { id: "lead.template_sent", label: "Emails" },
  { id: "lead.document_uploaded", label: "Documents" },
  { id: "lead.rgpd_delete", label: "RGPD" },
];

export default function ActivityPage() {
  const router = useRouter();
  const [entries, setEntries] = useState<ActivityEntry[] | null>(null);
  const [filter, setFilter] = useState<ActivityType | "all">("all");

  useEffect(() => {
    (async () => {
      const res = await fetch("/api/admin/activity", { cache: "no-store" });
      if (res.status === 401) {
        router.replace("/admin/login");
        return;
      }
      const data = await res.json();
      setEntries(data.entries ?? []);
    })();
  }, [router]);

  const filtered = useMemo(() => {
    if (!entries) return [];
    if (filter === "all") return entries;
    return entries.filter((e) => e.type === filter);
  }, [entries, filter]);

  return (
    <div className="min-h-screen bg-cream py-10 lg:py-14">
      <div className="container max-w-5xl">
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
              Journal d&apos;activité
            </h1>
            <p className="mt-2 text-graphite text-base">
              Historique complet des actions admin · {entries?.length ?? 0}{" "}
              entrée{(entries?.length ?? 0) > 1 ? "s" : ""}
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-6 flex flex-wrap gap-2">
          {TYPE_FILTERS.map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={cn(
                "px-4 py-2 rounded-full text-sm font-mono uppercase tracking-eyebrow border transition-colors",
                filter === f.id
                  ? "bg-ink text-cream border-ink"
                  : "bg-white text-graphite border-ink/15 hover:border-copper/40 hover:text-ink",
              )}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Timeline */}
        <div className="rounded-2xl border border-ink/10 bg-white shadow-soft p-5 lg:p-7">
          {entries === null ? (
            <div className="py-12 text-center text-muted">Chargement…</div>
          ) : filtered.length === 0 ? (
            <div className="py-12 text-center">
              <div className="text-graphite">Aucune activité pour ce filtre.</div>
            </div>
          ) : (
            <ol className="relative border-l-2 border-ink/8 ml-2 pl-6 space-y-5">
              {filtered.map((e) => {
                const Icon = ICON_FOR_TYPE[e.type] ?? Inbox;
                const color = COLOR_FOR_TYPE[e.type] ?? "#b86a36";
                const date = new Date(e.at);
                return (
                  <li key={e.id} className="relative">
                    <span
                      className="absolute -left-[34px] top-0.5 h-6 w-6 rounded-full grid place-items-center border-2 border-cream"
                      style={{ background: `${color}15`, color }}
                    >
                      <Icon className="h-3 w-3" />
                    </span>
                    <div className="flex items-start justify-between gap-3 flex-wrap">
                      <div className="min-w-0 flex-1">
                        <div className="text-sm text-ink">{e.summary}</div>
                        {e.reference && (
                          <Link
                            href={`/admin/leads/${e.reference}`}
                            className="mt-0.5 inline-flex items-center gap-1 font-mono text-xs text-graphite hover:text-copper transition-colors"
                          >
                            {e.reference}
                            <ArrowUpRight className="h-3 w-3" />
                          </Link>
                        )}
                      </div>
                      <div className="font-mono text-[10px] uppercase tracking-eyebrow text-muted whitespace-nowrap">
                        {date.toLocaleString("fr-FR", {
                          dateStyle: "short",
                          timeStyle: "short",
                        })}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ol>
          )}
        </div>
      </div>
    </div>
  );
}
