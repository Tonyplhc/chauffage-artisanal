"use client";

/**
 * Vue Kanban du pipeline leads.
 *
 * 5 colonnes (nouveau / contacté / devis envoyé / converti / perdu).
 * Drag&drop natif HTML5 : on prend une card, on la dépose dans une autre
 * colonne → PATCH /api/admin/leads/{ref} avec le nouveau statut + optimistic
 * UI + revert si échec.
 *
 * Filtres rapides : level (hot/warm/cold) + search libre sur nom/référence/
 * commune. Recherche sans opérateurs avancés ici — la vue liste reste le hub
 * pour la recherche complexe.
 *
 * Tri intra-colonne : par score décroissant, puis date desc.
 */

import { useEffect, useMemo, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Inbox,
  Phone,
  FileText,
  Trophy,
  X as XIcon,
  Loader2,
  Search,
  Flame,
  Snowflake,
  Thermometer,
  MapPin,
  GripVertical,
} from "lucide-react";
import type { LeadRecord } from "@/lib/devis-schema";
import { LEVEL_LABELS, LEVEL_COLORS, type LeadLevel } from "@/lib/lead-scoring";
import { SlaBadge } from "@/components/admin/sla-badge";
import { cn } from "@/lib/utils";

type Status = LeadRecord["status"];

const COLUMNS: {
  id: Status;
  label: string;
  icon: typeof Inbox;
  color: string;
  hint?: string;
}[] = [
  { id: "nouveau", label: "Nouveau", icon: Inbox, color: "#b86a36", hint: "à qualifier" },
  { id: "contacte", label: "Contacté", icon: Phone, color: "#6ba3c5", hint: "en discussion" },
  { id: "devis_envoye", label: "Devis envoyé", icon: FileText, color: "#94532a", hint: "en attente retour" },
  { id: "converti", label: "Converti", icon: Trophy, color: "#22a06b", hint: "gagné" },
  { id: "perdu", label: "Perdu", icon: XIcon, color: "#8b847a", hint: "archivé" },
];

const SERVICE_LABEL: Record<LeadRecord["services"][number], string> = {
  chauffage: "Chauffage",
  pac: "PAC",
  clim: "Clim",
  sanitaire: "Sanitaire",
  enr: "ENR",
  depannage: "Dépannage",
  autre: "Autre",
};

export default function KanbanPage() {
  const router = useRouter();
  const [leads, setLeads] = useState<LeadRecord[] | null>(null);
  const [query, setQuery] = useState("");
  const [levelFilter, setLevelFilter] = useState<LeadLevel | "all">("all");
  const [dragRef, setDragRef] = useState<string | null>(null);
  const [overCol, setOverCol] = useState<Status | null>(null);
  const [busyRef, setBusyRef] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const res = await fetch("/api/admin/leads", { cache: "no-store" });
    if (res.status === 401) {
      router.replace("/admin/login");
      return;
    }
    if (res.ok) {
      const data = await res.json();
      setLeads(data.leads ?? []);
    }
  }, [router]);

  useEffect(() => {
    refresh();
    const i = setInterval(refresh, 20_000);
    return () => clearInterval(i);
  }, [refresh]);

  const filtered = useMemo(() => {
    if (!leads) return null;
    const q = query.trim().toLowerCase();
    return leads.filter((l) => {
      if (levelFilter !== "all" && l.level !== levelFilter) return false;
      if (!q) return true;
      return (
        l.fullName.toLowerCase().includes(q) ||
        l.reference.toLowerCase().includes(q) ||
        l.commune.toLowerCase().includes(q) ||
        l.email.toLowerCase().includes(q)
      );
    });
  }, [leads, query, levelFilter]);

  const grouped = useMemo(() => {
    const map: Record<Status, LeadRecord[]> = {
      nouveau: [],
      contacte: [],
      devis_envoye: [],
      converti: [],
      perdu: [],
    };
    if (!filtered) return map;
    for (const l of filtered) map[l.status]?.push(l);
    // Tri intra-colonne : score desc puis date desc
    for (const k of Object.keys(map) as Status[]) {
      map[k].sort((a, b) => {
        const sa = a.score ?? 0;
        const sb = b.score ?? 0;
        if (sb !== sa) return sb - sa;
        return new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime();
      });
    }
    return map;
  }, [filtered]);

  const handleDrop = async (reference: string, newStatus: Status) => {
    const lead = leads?.find((l) => l.reference === reference);
    if (!lead || lead.status === newStatus) {
      setDragRef(null);
      setOverCol(null);
      return;
    }
    setBusyRef(reference);
    setError(null);
    // Optimistic
    setLeads((prev) =>
      prev
        ? prev.map((l) =>
            l.reference === reference ? { ...l, status: newStatus } : l,
          )
        : prev,
    );
    try {
      const res = await fetch(`/api/admin/leads/${reference}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) {
        // Revert
        setLeads((prev) =>
          prev
            ? prev.map((l) =>
                l.reference === reference ? { ...l, status: lead.status } : l,
              )
            : prev,
        );
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Échec de la mise à jour");
      } else {
        await refresh();
      }
    } catch {
      setLeads((prev) =>
        prev
          ? prev.map((l) =>
              l.reference === reference ? { ...l, status: lead.status } : l,
            )
          : prev,
      );
      setError("Erreur réseau");
    } finally {
      setBusyRef(null);
      setDragRef(null);
      setOverCol(null);
    }
  };

  return (
    <div className="min-h-screen bg-cream py-8 lg:py-10">
      <div className="container max-w-[1600px]">
        <Link
          href="/admin/leads"
          className="inline-flex items-center gap-2 text-sm font-mono uppercase tracking-eyebrow text-graphite hover:text-copper transition-colors mb-6"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Vue liste
        </Link>

        <div className="flex items-start justify-between gap-6 flex-wrap mb-6">
          <div>
            <h1 className="font-display text-display-md text-ink">
              Pipeline Kanban
            </h1>
            <p className="mt-2 text-graphite">
              Glissez une carte d&apos;une colonne à l&apos;autre pour changer
              son statut.{" "}
              <span className="text-muted">
                Actualisation auto toutes les 20s.
              </span>
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Filtrer nom, réf, commune…"
                className="pl-9 pr-3 h-10 rounded-full bg-white border border-ink/12 text-sm focus:border-copper focus:outline-none w-64"
              />
            </div>
            <LevelChip
              level="all"
              active={levelFilter === "all"}
              onClick={() => setLevelFilter("all")}
              label="Tous"
            />
            <LevelChip
              level="hot"
              active={levelFilter === "hot"}
              onClick={() => setLevelFilter("hot")}
              label="Hot"
            />
            <LevelChip
              level="warm"
              active={levelFilter === "warm"}
              onClick={() => setLevelFilter("warm")}
              label="Warm"
            />
            <LevelChip
              level="cold"
              active={levelFilter === "cold"}
              onClick={() => setLevelFilter("cold")}
              label="Cold"
            />
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl border border-ember/40 bg-ember/5 text-sm text-ember">
            {error}
          </div>
        )}

        {leads === null ? (
          <div className="py-16 text-center text-muted">
            <Loader2 className="h-6 w-6 animate-spin mx-auto" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-3 lg:gap-4">
            {COLUMNS.map((col) => {
              const items = grouped[col.id];
              const Icon = col.icon;
              const isOver = overCol === col.id;
              return (
                <div
                  key={col.id}
                  onDragOver={(e) => {
                    e.preventDefault();
                    if (overCol !== col.id) setOverCol(col.id);
                  }}
                  onDragLeave={(e) => {
                    // Évite le flicker quand on quitte un enfant
                    if (e.currentTarget.contains(e.relatedTarget as Node)) return;
                    if (overCol === col.id) setOverCol(null);
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    if (dragRef) handleDrop(dragRef, col.id);
                  }}
                  className={cn(
                    "rounded-2xl border bg-white shadow-soft flex flex-col min-h-[60vh] transition-colors",
                    isOver
                      ? "border-copper bg-copper/5"
                      : "border-ink/10",
                  )}
                >
                  <div
                    className="px-4 py-3 border-b border-ink/8 flex items-center gap-2"
                    style={{
                      background: `linear-gradient(90deg, ${col.color}14, transparent)`,
                    }}
                  >
                    <Icon className="h-4 w-4" style={{ color: col.color }} />
                    <span className="text-sm font-medium text-ink">
                      {col.label}
                    </span>
                    <span className="ml-auto font-mono text-xs tabular-nums text-graphite bg-cream px-2 py-0.5 rounded-full border border-ink/8">
                      {items.length}
                    </span>
                  </div>
                  {col.hint && (
                    <div className="px-4 pt-2 text-[10px] uppercase tracking-eyebrow font-mono text-muted">
                      {col.hint}
                    </div>
                  )}
                  <div className="flex-1 p-3 grid gap-3.5 overflow-y-auto">
                    {items.length === 0 ? (
                      <div className="h-full grid place-items-center text-[12px] text-muted py-8">
                        Glissez une carte ici
                      </div>
                    ) : (
                      items.map((l) => (
                        <Card
                          key={l.reference}
                          lead={l}
                          dragging={dragRef === l.reference}
                          busy={busyRef === l.reference}
                          onDragStart={() => setDragRef(l.reference)}
                          onDragEnd={() => {
                            setDragRef(null);
                            setOverCol(null);
                          }}
                        />
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function LevelChip({
  level,
  active,
  onClick,
  label,
}: {
  level: LeadLevel | "all";
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  const color = level === "all" ? "#1e1a15" : LEVEL_COLORS[level];
  return (
    <button
      onClick={onClick}
      className={cn(
        "h-10 px-4 rounded-full border text-sm font-medium transition-colors",
        active
          ? "text-cream"
          : "bg-white border-ink/12 text-graphite hover:border-copper/40",
      )}
      style={
        active
          ? { background: color, borderColor: color }
          : undefined
      }
    >
      {label}
    </button>
  );
}

function Card({
  lead,
  dragging,
  busy,
  onDragStart,
  onDragEnd,
}: {
  lead: LeadRecord;
  dragging: boolean;
  busy: boolean;
  onDragStart: () => void;
  onDragEnd: () => void;
}) {
  const LevelIcon =
    lead.level === "hot" ? Flame : lead.level === "warm" ? Thermometer : Snowflake;
  return (
    <Link
      href={`/admin/leads/${lead.reference}`}
      draggable
      onDragStart={(e) => {
        e.dataTransfer.effectAllowed = "move";
        e.dataTransfer.setData("text/plain", lead.reference);
        onDragStart();
      }}
      onDragEnd={onDragEnd}
      className={cn(
        "group block rounded-xl border-2 bg-white p-4 cursor-grab active:cursor-grabbing transition-all shadow-soft",
        dragging
          ? "opacity-40 border-copper"
          : "border-ink/15 hover:border-copper/50 hover:-translate-y-0.5 hover:shadow-md",
      )}
    >
      <div className="flex items-start gap-2">
        <GripVertical className="h-4 w-4 text-muted shrink-0 mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity" />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-sm font-medium text-ink truncate flex-1">
              {lead.fullName}
            </span>
            {busy && <Loader2 className="h-3 w-3 animate-spin text-copper" />}
          </div>
          <div className="font-mono text-[10px] tracking-eyebrow text-muted">
            {lead.reference}
          </div>
        </div>
      </div>
      <div className="mt-2 flex items-center gap-2 flex-wrap">
        {lead.level && (
          <span
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono uppercase tracking-eyebrow"
            style={{
              background: `${LEVEL_COLORS[lead.level]}1c`,
              color: LEVEL_COLORS[lead.level],
            }}
          >
            <LevelIcon className="h-2.5 w-2.5" />
            {LEVEL_LABELS[lead.level]}
            {typeof lead.score === "number" && (
              <span className="tabular-nums">· {lead.score}</span>
            )}
          </span>
        )}
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono text-graphite bg-cream border border-ink/8">
          <MapPin className="h-2.5 w-2.5" />
          {lead.commune}
        </span>
      </div>
      <div className="mt-1.5 text-[11px] text-graphite truncate">
        {lead.services.map((s) => SERVICE_LABEL[s] ?? s).join(" · ")}
      </div>
      <div className="mt-1.5">
        <SlaBadge lead={lead} compact />
      </div>
    </Link>
  );
}
