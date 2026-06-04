"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Inbox,
  Phone,
  FileText,
  Trophy,
  X as XIcon,
  ArrowUpRight,
  Lock,
  RefreshCw,
  LogOut,
  AlertTriangle,
  Search,
  Mail,
  MessageCircle,
  Flame,
  TrendingUp,
  Clock,
  Filter,
  ArrowUpDown,
  Package,
  Download,
  CheckSquare,
  Square,
  ChevronDown,
  Calendar,
  Columns3,
  Tag as TagIcon,
  Library,
  Gauge,
  Euro,
  BellRing,
  Copy as CopyIcon,
  HandCoins,
  Sparkles,
  Wrench,
  Building2,
} from "lucide-react";
import type { LeadRecord } from "@/lib/devis-schema";
import { LEVEL_LABELS, LEVEL_COLORS, type LeadLevel } from "@/lib/lead-scoring";
import { detectFollowUps, type FollowUpReason } from "@/lib/follow-up";
import { AdminLiveFeed } from "@/components/admin/live-feed";
import { SavedViewsBar } from "@/components/admin/saved-views-bar";
import {
  parseSearch,
  applySearchFilters,
  OPERATOR_SUGGESTIONS,
} from "@/lib/search-operators";
import { cn } from "@/lib/utils";

const STATUSES: { id: LeadRecord["status"]; label: string; icon: any; color: string }[] = [
  { id: "nouveau", label: "Nouveau", icon: Inbox, color: "#b86a36" },
  { id: "contacte", label: "Contacté", icon: Phone, color: "#6ba3c5" },
  { id: "devis_envoye", label: "Devis envoyé", icon: FileText, color: "#94532a" },
  { id: "converti", label: "Converti", icon: Trophy, color: "#22a06b" },
  { id: "perdu", label: "Perdu", icon: XIcon, color: "#8b847a" },
];

const SERVICE_LABEL: Record<LeadRecord["services"][number], string> = {
  chauffage: "Chauffage",
  pac: "PAC",
  clim: "Climatisation",
  sanitaire: "Sanitaire",
  enr: "Énergies renouv.",
  depannage: "Dépannage",
  autre: "Autre",
};

const TIMELINE_LABEL: Record<LeadRecord["timeline"], string> = {
  urgent: "Urgent",
  court: "< 3 mois",
  annee: "Cette année",
  exploration: "Exploration",
};

const BUDGET_LABEL: Record<LeadRecord["budget"], string> = {
  less10: "< 10 k€",
  // V2 — tranches actuelles
  "10-25": "10-25 k€",
  "25-50": "25-50 k€",
  "50-100": "50-100 k€",
  "100plus": "> 100 k€",
  // V1 — legacy (anciens leads)
  "10-20": "10-20 k€",
  "20-40": "20-40 k€",
  "40plus": "> 40 k€",
  inconnu: "?",
};

const BUDGET_ORDER: Record<LeadRecord["budget"], number> = {
  inconnu: 0,
  less10: 1,
  // V2
  "10-25": 2,
  "25-50": 3,
  "50-100": 4,
  "100plus": 5,
  // V1 legacy — ordonnés grossièrement entre les V2 équivalents
  "10-20": 2,
  "20-40": 3,
  "40plus": 4,
};

type TimeFilter = "7d" | "30d" | "all";
type SortKey = "date" | "budget" | "urgency" | "score";

const LEVEL_ORDER: Record<LeadLevel, number> = { hot: 3, warm: 2, cold: 1 };

export default function AdminLeadsPage() {
  const router = useRouter();
  const [leads, setLeads] = useState<LeadRecord[] | null>(null);
  const [filter, setFilter] = useState<LeadRecord["status"] | "all">("all");
  const [timeFilter, setTimeFilter] = useState<TimeFilter>("all");
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("date");
  const [refreshing, setRefreshing] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkOpen, setBulkOpen] = useState(false);
  const [bulkBusy, setBulkBusy] = useState(false);
  const [assigneeFilter, setAssigneeFilter] = useState<"all" | "mine" | "unassigned">("all");
  const [currentUserEmail, setCurrentUserEmail] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/me", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => setCurrentUserEmail(data?.email ?? null))
      .catch(() => {});
  }, []);

  const refresh = async () => {
    setRefreshing(true);
    try {
      const res = await fetch("/api/admin/leads", { cache: "no-store" });
      if (res.status === 401) {
        router.replace("/admin/login");
        return;
      }
      const data = await res.json();
      setLeads(data.leads ?? []);
    } catch {
      setLeads([]);
    } finally {
      setRefreshing(false);
    }
  };

  const logout = async () => {
    await fetch("/api/admin/logout", { method: "POST" });
    router.replace("/admin/login");
  };

  const toggleOne = (ref: string) => {
    setSelected((s) => {
      const next = new Set(s);
      if (next.has(ref)) next.delete(ref);
      else next.add(ref);
      return next;
    });
  };

  const toggleAllVisible = (visibleRefs: string[]) => {
    setSelected((s) => {
      const allSelected = visibleRefs.every((r) => s.has(r));
      const next = new Set(s);
      if (allSelected) {
        visibleRefs.forEach((r) => next.delete(r));
      } else {
        visibleRefs.forEach((r) => next.add(r));
      }
      return next;
    });
  };

  const clearSelection = () => setSelected(new Set());

  const bulkUpdateStatus = async (status: LeadRecord["status"]) => {
    if (selected.size === 0) return;
    setBulkBusy(true);
    setBulkOpen(false);
    try {
      const res = await fetch("/api/admin/leads/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "updateStatus",
          references: Array.from(selected),
          status,
        }),
      });
      if (res.ok) {
        clearSelection();
        await refresh();
      }
    } finally {
      setBulkBusy(false);
    }
  };

  const exportCsv = () => {
    const qs = new URLSearchParams();
    if (filter !== "all") qs.set("status", filter);
    if (timeFilter !== "all") {
      const days = timeFilter === "7d" ? 7 : 30;
      const fromDate = new Date(Date.now() - days * 86_400_000)
        .toISOString()
        .slice(0, 10);
      qs.set("from", fromDate);
    }
    const href = `/api/admin/leads/export${qs.toString() ? "?" + qs.toString() : ""}`;
    window.location.href = href;
  };

  useEffect(() => {
    refresh();
  }, []);

  // Stats globales
  const stats = useMemo(() => {
    if (!leads) return null;
    const total = leads.length;
    const byStatus: Record<LeadRecord["status"], number> = {
      nouveau: 0,
      contacte: 0,
      devis_envoye: 0,
      converti: 0,
      perdu: 0,
    };
    leads.forEach((l) => (byStatus[l.status] = (byStatus[l.status] ?? 0) + 1));

    const urgentNouveau = leads.filter(
      (l) => l.status === "nouveau" && l.timeline === "urgent",
    ).length;

    // Hot leads = priorité scoring (level=hot) parmi les nouveaux ; fallback ancien heuristique si lead pré-scoring
    const hot = leads.filter(
      (l) =>
        l.status === "nouveau" &&
        (l.level === "hot" ||
          (!l.level && (l.timeline === "urgent" || l.budget === "40plus"))),
    ).length;

    // Pas contacté depuis +3 jours (nouveau)
    const now = Date.now();
    const dormants = leads.filter(
      (l) => l.status === "nouveau" && now - new Date(l.submittedAt).getTime() > 3 * 86400 * 1000,
    ).length;

    const closedTotal = byStatus.converti + byStatus.perdu;
    const conversionRate = closedTotal > 0 ? Math.round((byStatus.converti / closedTotal) * 100) : null;

    // Auto follow-up detection
    const followUps = detectFollowUps(leads);

    return { total, byStatus, urgentNouveau, hot, dormants, conversionRate, followUps };
  }, [leads]);

  // Filtrage + tri
  const filtered = useMemo(() => {
    if (!leads) return [];
    const now = Date.now();
    let out = filter === "all" ? [...leads] : leads.filter((l) => l.status === filter);

    if (timeFilter !== "all") {
      const ms = timeFilter === "7d" ? 7 : 30;
      out = out.filter((l) => now - new Date(l.submittedAt).getTime() <= ms * 86400 * 1000);
    }

    // Filtre assigné
    if (assigneeFilter === "mine" && currentUserEmail) {
      out = out.filter((l) => l.assignedTo === currentUserEmail);
    } else if (assigneeFilter === "unassigned") {
      out = out.filter((l) => !l.assignedTo);
    }

    if (search.trim()) {
      // Parser opérateurs (status:, level:, service:, commune:, assignedTo:, budget:, timeline:)
      const filters = parseSearch(search);
      out = applySearchFilters(out, filters, { currentUserEmail });
    }

    out.sort((a, b) => {
      if (sortKey === "budget") return BUDGET_ORDER[b.budget] - BUDGET_ORDER[a.budget];
      if (sortKey === "urgency") {
        const aU = a.timeline === "urgent" ? 1 : 0;
        const bU = b.timeline === "urgent" ? 1 : 0;
        return bU - aU;
      }
      if (sortKey === "score") {
        // Niveau (hot > warm > cold) puis score brut
        const aL = a.level ? LEVEL_ORDER[a.level] : 0;
        const bL = b.level ? LEVEL_ORDER[b.level] : 0;
        if (aL !== bL) return bL - aL;
        return (b.score ?? -1) - (a.score ?? -1);
      }
      return new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime();
    });

    return out;
  }, [leads, filter, timeFilter, search, sortKey, assigneeFilter, currentUserEmail]);

  return (
    <div className="min-h-screen bg-cream py-10 lg:py-14">
      <div className="container max-w-7xl">
        {/* Header */}
        <div className="flex items-start justify-between gap-6 flex-wrap mb-8">
          <div>
            <div className="font-mono text-xs uppercase tracking-eyebrow text-copper">
              Pipeline interne · démo
            </div>
            <h1 className="mt-3 font-display text-display-md text-ink">
              Suivi des demandes
            </h1>
            <p className="mt-2 text-graphite text-base">
              Vos leads triés par priorité · accès au dossier complet · transition de statut en un clic.
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <AdminLiveFeed onLead={refresh} />
            <Link
              href="/admin/leads/kanban"
              className="inline-flex items-center gap-2 rounded-full border border-copper/40 bg-copper/8 px-5 py-2.5 text-base text-copper hover:bg-copper/15 transition-colors"
            >
              <Columns3 className="h-4 w-4" />
              Vue Kanban
            </Link>
            <button
              onClick={exportCsv}
              disabled={!leads || leads.length === 0}
              className="inline-flex items-center gap-2 rounded-full border border-ink/15 px-5 py-2.5 text-base bg-white hover:border-copper/40 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Download className="h-4 w-4" />
              Exporter CSV
            </button>
            <button
              onClick={refresh}
              className="inline-flex items-center gap-2 rounded-full border border-ink/15 px-5 py-2.5 text-base bg-white hover:border-copper/40 transition-colors"
            >
              <RefreshCw className={cn("h-4 w-4", refreshing && "animate-spin")} />
              Actualiser
            </button>
            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-full border border-ink/15 px-5 py-2.5 text-base bg-white hover:border-copper/40 transition-colors"
            >
              Retour site
              <ArrowUpRight className="h-4 w-4" />
            </Link>
            <button
              onClick={logout}
              className="inline-flex items-center gap-2 rounded-full border border-ember/30 bg-ember/5 px-5 py-2.5 text-base text-ember hover:bg-ember/15 transition-colors"
            >
              <LogOut className="h-4 w-4" />
              Déconnexion
            </button>
          </div>
        </div>

        {/* Alerts banner */}
        <AnimatePresence>
          {stats && (stats.urgentNouveau > 0 || stats.dormants > 0) && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="mb-6 p-4 rounded-2xl border border-ember/40 bg-ember/8 flex flex-col sm:flex-row sm:items-center gap-3"
            >
              <div className="h-9 w-9 rounded-full bg-ember/15 border border-ember/40 grid place-items-center shrink-0">
                <AlertTriangle className="h-4 w-4 text-ember" />
              </div>
              <div className="flex-1 text-base">
                <strong className="text-ember">Actions à prendre</strong>
                <span className="text-ink">
                  {" — "}
                  {stats.urgentNouveau > 0 && (
                    <>
                      <strong>{stats.urgentNouveau}</strong> lead{stats.urgentNouveau > 1 ? "s" : ""} urgent{stats.urgentNouveau > 1 ? "s" : ""} à contacter immédiatement
                    </>
                  )}
                  {stats.urgentNouveau > 0 && stats.dormants > 0 && " · "}
                  {stats.dormants > 0 && (
                    <>
                      <strong>{stats.dormants}</strong> dossier{stats.dormants > 1 ? "s" : ""} sans contact depuis +3 jours
                    </>
                  )}
                </span>
              </div>
              <button
                onClick={() => {
                  setFilter("nouveau");
                  setTimeFilter("all");
                }}
                className="inline-flex items-center gap-2 rounded-full bg-ember text-cream px-5 py-2.5 text-sm font-medium hover:bg-ember/85 transition-colors"
              >
                Voir
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Follow-up auto */}
        {stats && stats.followUps.length > 0 && (
          <FollowUpStrip
            items={stats.followUps}
            onClickRef={(ref) => router.push(`/admin/leads/${ref}`)}
          />
        )}

        {/* KPI strip */}
        {stats && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
            <KpiCard
              label="Hot leads"
              value={stats.hot}
              icon={Flame}
              accent={stats.hot > 0 ? "ember" : "muted"}
              hint={stats.hot > 0 ? "urgent ou gros budget" : ""}
            />
            <KpiCard
              label="Total demandes"
              value={stats.total}
              icon={Inbox}
              accent="copper"
            />
            <KpiCard
              label="Sans contact +3j"
              value={stats.dormants}
              icon={Clock}
              accent={stats.dormants > 0 ? "ember" : "muted"}
            />
            <KpiCard
              label="Conversion"
              value={stats.conversionRate !== null ? `${stats.conversionRate}%` : "—"}
              icon={TrendingUp}
              accent="green"
              hint={stats.conversionRate !== null ? `${stats.byStatus.converti} convertis` : "pas assez de dossiers fermés"}
            />
          </div>
        )}

        {/* Status pills */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 mb-6">
          <FilterPill
            label="Tous"
            count={leads?.length ?? 0}
            active={filter === "all"}
            onClick={() => setFilter("all")}
          />
          {STATUSES.map((s) => (
            <FilterPill
              key={s.id}
              label={s.label}
              count={stats?.byStatus[s.id] ?? 0}
              icon={s.icon}
              color={s.color}
              active={filter === s.id}
              onClick={() => setFilter(s.id)}
            />
          ))}
        </div>

        {/* Saved views (vues enregistrées) */}
        <SavedViewsBar
          currentUserEmail={currentUserEmail ?? undefined}
          currentState={{
            status: filter,
            search,
            timeFilter,
            sortKey,
            assigneeFilter,
          }}
          onApply={(s) => {
            const nextStatus = s.status as typeof filter;
            const nextTime = s.timeFilter as typeof timeFilter;
            const nextSort = s.sortKey as typeof sortKey;
            const nextAssignee = s.assigneeFilter as typeof assigneeFilter;
            setFilter(nextStatus);
            setSearch(s.search);
            setTimeFilter(nextTime);
            setSortKey(nextSort);
            setAssigneeFilter(nextAssignee);
          }}
        />

        {/* Toolbar : search + time filter + sort */}
        <div className="flex items-center gap-3 flex-wrap mb-6">
          <div className="relative flex-1 min-w-[280px] max-w-xl">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="status:nouveau level:hot service:pac · ou texte libre"
              className="w-full pl-12 pr-4 py-3 rounded-full bg-white border border-ink/12 text-base text-ink focus:border-copper focus:outline-none focus:ring-2 focus:ring-copper/20 transition-all"
            />
            {!search.trim() && (
              <div className="absolute right-4 top-1/2 -translate-y-1/2 hidden md:flex gap-1.5">
                {OPERATOR_SUGGESTIONS.slice(0, 3).map((s) => (
                  <button
                    key={s.op}
                    onClick={() => setSearch(`${s.op}:${s.values[0]}`)}
                    className="px-2 py-0.5 rounded-full text-[10px] font-mono uppercase tracking-eyebrow text-graphite hover:text-copper bg-cream/50 border border-ink/10"
                  >
                    {s.op}:
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="inline-flex items-center gap-1 p-1.5 rounded-full bg-white border border-ink/12">
            <Filter className="h-4 w-4 text-muted ml-2" />
            {(["7d", "30d", "all"] as const).map((id) => (
              <button
                key={id}
                onClick={() => setTimeFilter(id)}
                className={cn(
                  "px-4 py-2 rounded-full text-sm font-mono uppercase tracking-eyebrow transition-colors",
                  timeFilter === id ? "bg-ink text-cream" : "text-graphite hover:text-ink",
                )}
              >
                {id === "7d" ? "7 j" : id === "30d" ? "30 j" : "Tout"}
              </button>
            ))}
          </div>

          <div className="inline-flex items-center gap-1 p-1.5 rounded-full bg-white border border-ink/12">
            <ArrowUpDown className="h-4 w-4 text-muted ml-2" />
            {(
              [
                { id: "date" as SortKey, label: "Date" },
                { id: "score" as SortKey, label: "Score" },
                { id: "budget" as SortKey, label: "Budget" },
                { id: "urgency" as SortKey, label: "Urgence" },
              ] as const
            ).map((s) => (
              <button
                key={s.id}
                onClick={() => setSortKey(s.id)}
                className={cn(
                  "px-4 py-2 rounded-full text-sm font-mono uppercase tracking-eyebrow transition-colors",
                  sortKey === s.id ? "bg-ink text-cream" : "text-graphite hover:text-ink",
                )}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* Bulk actions bar — apparaît quand au moins 1 lead sélectionné */}
        <AnimatePresence>
          {selected.size > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="mb-4 p-4 rounded-2xl bg-ink text-cream flex items-center justify-between gap-4 flex-wrap"
            >
              <div className="flex items-center gap-3">
                <CheckSquare className="h-5 w-5 text-copper" />
                <span className="font-medium">
                  {selected.size} dossier{selected.size > 1 ? "s" : ""} sélectionné{selected.size > 1 ? "s" : ""}
                </span>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <div className="relative">
                  <button
                    onClick={() => setBulkOpen((v) => !v)}
                    disabled={bulkBusy}
                    className="inline-flex items-center gap-2 rounded-full bg-cream text-ink px-4 py-2 text-sm font-medium hover:bg-copper hover:text-cream transition-colors"
                  >
                    Changer le statut
                    <ChevronDown className="h-3.5 w-3.5" />
                  </button>
                  <AnimatePresence>
                    {bulkOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -4 }}
                        className="absolute right-0 mt-2 w-56 rounded-2xl bg-white border border-ink/10 shadow-lift py-1 z-50"
                      >
                        {STATUSES.map((s) => (
                          <button
                            key={s.id}
                            onClick={() => bulkUpdateStatus(s.id)}
                            className="w-full text-left px-4 py-2 text-sm text-ink hover:bg-cream flex items-center gap-2"
                            style={{ color: s.color }}
                          >
                            <s.icon className="h-3.5 w-3.5" />
                            {s.label}
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
                <button
                  onClick={clearSelection}
                  className="inline-flex items-center gap-1.5 rounded-full border border-cream/30 px-4 py-2 text-sm text-cream hover:bg-cream/10 transition-colors"
                >
                  <XIcon className="h-3.5 w-3.5" />
                  Annuler
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Table */}
        <div className="rounded-2xl border border-ink/10 bg-white shadow-soft overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-base">
              <thead className="bg-linen/60 border-b border-ink/10 font-mono text-xs uppercase tracking-eyebrow text-muted">
                <tr>
                  <th className="text-left px-5 py-4 w-10">
                    <button
                      onClick={() => toggleAllVisible(filtered.map((l) => l.reference))}
                      className="text-graphite hover:text-ink transition-colors"
                      aria-label="Tout sélectionner"
                    >
                      {filtered.length > 0 && filtered.every((l) => selected.has(l.reference)) ? (
                        <CheckSquare className="h-4 w-4 text-copper" />
                      ) : (
                        <Square className="h-4 w-4" />
                      )}
                    </button>
                  </th>
                  <th className="text-left px-5 py-4">Référence</th>
                  <th className="text-left px-5 py-4">Date</th>
                  <th className="text-left px-5 py-4">Score</th>
                  <th className="text-left px-5 py-4">Contact</th>
                  <th className="text-left px-5 py-4">Projet</th>
                  <th className="text-left px-5 py-4">Commune</th>
                  <th className="text-left px-5 py-4">Délai</th>
                  <th className="text-left px-5 py-4">Budget</th>
                  <th className="text-left px-5 py-4">Statut</th>
                  <th className="text-right px-5 py-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {leads === null ? (
                  <tr>
                    <td colSpan={11} className="text-center py-12 text-muted">
                      Chargement…
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={11} className="text-center py-16">
                      <div className="text-graphite">Aucun lead pour ces critères.</div>
                      <div className="mt-2 text-xs text-muted">
                        Modifie les filtres ou la recherche pour voir d'autres dossiers.
                      </div>
                    </td>
                  </tr>
                ) : (
                  filtered.map((l, i) => (
                    <LeadRow
                      key={l.reference}
                      lead={l}
                      index={i}
                      selected={selected.has(l.reference)}
                      onToggle={() => toggleOne(l.reference)}
                    />
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-between text-sm text-muted flex-wrap gap-2">
          <span className="inline-flex items-center gap-2">
            <Lock className="h-4 w-4 text-copper" />
            Accès interne · sessions signées HMAC · à durcir (multi-utilisateurs) avant production
          </span>
          <span>{filtered.length} dossier{filtered.length > 1 ? "s" : ""} affiché{filtered.length > 1 ? "s" : ""}</span>
        </div>
      </div>
    </div>
  );
}

/* ──────────────── Lead row ──────────────── */

function LeadRow({
  lead,
  index,
  selected,
  onToggle,
}: {
  lead: LeadRecord;
  index: number;
  selected: boolean;
  onToggle: () => void;
}) {
  const isHot =
    lead.status === "nouveau" &&
    (lead.level === "hot" ||
      (!lead.level && (lead.timeline === "urgent" || lead.budget === "40plus")));
  const isUrgent = lead.timeline === "urgent";
  const isDormant =
    lead.status === "nouveau" && Date.now() - new Date(lead.submittedAt).getTime() > 3 * 86400 * 1000;
  const isLost = lead.status === "perdu";

  const waNumber = lead.phone.replace(/[^\d+]/g, "");

  return (
    <motion.tr
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: Math.min(index * 0.02, 0.3) }}
      className={cn(
        "border-b border-ink/8 last:border-0 hover:bg-cream/60 transition-colors relative",
        isHot && "bg-copper/[0.04]",
        isLost && "opacity-50",
      )}
    >
      {isHot && (
        <td className="absolute left-0 top-1 bottom-1 w-1 bg-gradient-to-b from-copper to-ember rounded-r-full p-0" />
      )}
      <td className="px-5 py-5">
        <button
          onClick={onToggle}
          className="text-graphite hover:text-copper transition-colors"
          aria-label={selected ? "Désélectionner" : "Sélectionner"}
        >
          {selected ? (
            <CheckSquare className="h-4 w-4 text-copper" />
          ) : (
            <Square className="h-4 w-4" />
          )}
        </button>
      </td>
      <td className="px-5 py-5 font-mono text-sm text-ink whitespace-nowrap">
        {lead.reference}
      </td>
      <td className="px-5 py-5 text-muted whitespace-nowrap text-sm">
        <div className="inline-flex items-center gap-1.5">
          {isDormant && (
            <span title="Sans contact depuis +3 jours">
              <Clock className="h-4 w-4 text-ember" />
            </span>
          )}
          {new Date(lead.submittedAt).toLocaleDateString("fr-FR", {
            day: "2-digit",
            month: "short",
          })}
        </div>
      </td>
      <td className="px-5 py-5 whitespace-nowrap">
        <LevelChip lead={lead} />
      </td>
      <td className="px-5 py-5">
        <div className="text-ink font-medium text-base">{lead.fullName}</div>
        <div className="text-sm text-muted">{lead.email}</div>
      </td>
      <td className="px-5 py-5">
        <div className="flex flex-wrap gap-1.5">
          {lead.services.slice(0, 2).map((s) => (
            <span
              key={s}
              className="inline-flex px-2.5 py-1 rounded-full text-xs font-mono uppercase tracking-eyebrow bg-copper/10 border border-copper/30 text-copper"
            >
              {SERVICE_LABEL[s]}
            </span>
          ))}
          {lead.services.length > 2 && (
            <span className="inline-flex px-2.5 py-1 rounded-full text-xs font-mono uppercase tracking-eyebrow bg-ink/5 border border-ink/15 text-ink">
              +{lead.services.length - 2}
            </span>
          )}
        </div>
        <div className="mt-1.5 text-sm text-muted">{lead.surface} m²</div>
      </td>
      <td className="px-5 py-5 text-graphite whitespace-nowrap text-base">{lead.commune}</td>
      <td className="px-5 py-5">
        <span
          className={cn(
            "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-mono uppercase tracking-eyebrow border",
            isUrgent
              ? "bg-ember/10 border-ember/40 text-ember"
              : "bg-white border-ink/15 text-graphite",
          )}
        >
          {isUrgent && (
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-ember opacity-75"></span>
              <span className="relative inline-flex h-2 w-2 rounded-full bg-ember"></span>
            </span>
          )}
          {TIMELINE_LABEL[lead.timeline]}
        </span>
      </td>
      <td className="px-5 py-5 whitespace-nowrap">
        <span
          className={cn(
            "font-medium text-base",
            lead.budget === "40plus" ? "text-copper" : "text-ink",
          )}
        >
          {BUDGET_LABEL[lead.budget]}
        </span>
      </td>
      <td className="px-5 py-5">
        <StatusBadge status={lead.status} />
      </td>
      <td className="px-5 py-5">
        <div className="inline-flex items-center gap-1.5 justify-end">
          <a
            href={`tel:${lead.phone.replace(/\s/g, "")}`}
            title="Appeler"
            className="h-10 w-10 grid place-items-center rounded-full bg-cream border border-ink/12 text-graphite hover:bg-copper hover:text-cream hover:border-copper transition-colors"
          >
            <Phone className="h-4 w-4" />
          </a>
          <a
            href={`mailto:${lead.email}`}
            title="Email"
            className="h-10 w-10 grid place-items-center rounded-full bg-cream border border-ink/12 text-graphite hover:bg-copper hover:text-cream hover:border-copper transition-colors"
          >
            <Mail className="h-4 w-4" />
          </a>
          <a
            href={`https://wa.me/${waNumber}`}
            target="_blank"
            rel="noopener noreferrer"
            title="WhatsApp"
            className="h-10 w-10 grid place-items-center rounded-full bg-cream border border-ink/12 text-graphite hover:bg-[#25D366] hover:text-white hover:border-[#25D366] transition-colors"
          >
            <MessageCircle className="h-4 w-4" />
          </a>
          <Link
            href={`/admin/leads/${lead.reference}`}
            title="Ouvrir le dossier"
            className="ml-1 inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-ink text-cream text-sm font-medium hover:bg-copper transition-colors"
          >
            Ouvrir
            <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </td>
    </motion.tr>
  );
}

/* ──────────────── KPI cards ──────────────── */

function KpiCard({
  label,
  value,
  icon: Icon,
  accent,
  hint,
}: {
  label: string;
  value: number | string;
  icon: any;
  accent: "copper" | "ember" | "green" | "muted";
  hint?: string;
}) {
  const accentClass =
    accent === "ember"
      ? "bg-ember/10 border-ember/30 text-ember"
      : accent === "green"
      ? "bg-[#22a06b]/10 border-[#22a06b]/30 text-[#22a06b]"
      : accent === "muted"
      ? "bg-ink/5 border-ink/15 text-muted"
      : "bg-copper/10 border-copper/30 text-copper";
  return (
    <div className="p-5 rounded-2xl bg-white border border-ink/10 shadow-soft">
      <div className="flex items-center gap-3">
        <span className={cn("h-11 w-11 rounded-full grid place-items-center border", accentClass)}>
          <Icon className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="font-mono text-xs uppercase tracking-eyebrow text-muted">{label}</div>
          <div className="mt-1 font-display text-3xl text-ink tabular-nums">{value}</div>
        </div>
      </div>
      {hint && <div className="mt-3 text-xs text-muted">{hint}</div>}
    </div>
  );
}

/* ──────────────── Status pill / badge ──────────────── */

function FilterPill({
  label,
  count,
  active,
  onClick,
  icon: Icon,
  color,
}: {
  label: string;
  count: number;
  active: boolean;
  onClick: () => void;
  icon?: any;
  color?: string;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "p-4 rounded-2xl border bg-white text-left transition-all",
        active ? "border-ink bg-ink/5 ring-2 ring-ink/15" : "border-ink/10 hover:border-copper/40 hover:shadow-soft",
      )}
    >
      <div className="flex items-center gap-2">
        {Icon && (
          <span
            className="h-6 w-6 rounded-full grid place-items-center shrink-0"
            style={{ background: `${color}1A`, color }}
          >
            <Icon className="h-3.5 w-3.5" />
          </span>
        )}
        <span className="font-mono text-xs uppercase tracking-eyebrow text-muted truncate">{label}</span>
      </div>
      <div className="mt-2 font-display text-3xl text-ink tabular-nums">{count}</div>
    </button>
  );
}

/* ──────────────── Follow-up strip (à relancer) ──────────────── */

const STATUS_LABEL_FU: Record<LeadRecord["status"], string> = {
  nouveau: "Nouveau",
  contacte: "Contacté",
  devis_envoye: "Devis envoyé",
  converti: "Converti",
  perdu: "Perdu",
};

function FollowUpStrip({
  items,
  onClickRef,
}: {
  items: FollowUpReason[];
  onClickRef: (ref: string) => void;
}) {
  const visible = items.slice(0, 6);
  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="mb-6 p-5 rounded-2xl border border-copper/30 bg-copper/5"
    >
      <div className="flex items-start justify-between gap-4 mb-4 flex-wrap">
        <div className="flex items-center gap-3">
          <span className="h-9 w-9 rounded-full bg-copper/15 border border-copper/40 grid place-items-center">
            <Clock className="h-4 w-4 text-copper" />
          </span>
          <div>
            <div className="font-mono text-[10px] uppercase tracking-eyebrow text-copper">
              Relances suggérées
            </div>
            <div className="text-base text-ink font-medium">
              {items.length} dossier{items.length > 1 ? "s" : ""} à traiter
            </div>
          </div>
        </div>
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
        {visible.map((f) => (
          <button
            key={f.reference}
            onClick={() => onClickRef(f.reference)}
            className="text-left p-3 rounded-xl bg-white border border-ink/10 hover:border-copper/40 hover:shadow-soft transition-all group"
          >
            <div className="flex items-center justify-between gap-3">
              <span className="font-mono text-xs text-ink truncate">{f.reference}</span>
              {f.urgency === "overdue" ? (
                <span className="font-mono text-[9px] uppercase tracking-eyebrow text-ember bg-ember/10 border border-ember/40 px-2 py-0.5 rounded-full shrink-0">
                  Très en retard
                </span>
              ) : (
                <span className="font-mono text-[9px] uppercase tracking-eyebrow text-copper bg-copper/10 border border-copper/40 px-2 py-0.5 rounded-full shrink-0">
                  À traiter
                </span>
              )}
            </div>
            <div className="mt-1.5 text-sm text-graphite leading-snug">{f.hint}</div>
            <div className="mt-2 flex items-center gap-2 text-xs text-muted">
              <span>{STATUS_LABEL_FU[f.status]}</span>
              <span>·</span>
              <span>
                +{f.daysSince - f.threshold} j de retard
              </span>
              {f.level && (
                <>
                  <span>·</span>
                  <span style={{ color: LEVEL_COLORS[f.level] }}>
                    {LEVEL_LABELS[f.level]}
                  </span>
                </>
              )}
            </div>
          </button>
        ))}
      </div>
      {items.length > visible.length && (
        <div className="mt-3 text-center text-xs text-muted">
          {items.length - visible.length} autre{items.length - visible.length > 1 ? "s" : ""} dans la liste
        </div>
      )}
    </motion.div>
  );
}

/* ──────────────── Level chip (Hot/Warm/Cold) ──────────────── */

function LevelChip({ lead }: { lead: LeadRecord }) {
  if (!lead.level) {
    return (
      <span className="font-mono text-xs uppercase tracking-eyebrow text-muted">—</span>
    );
  }
  const color = LEVEL_COLORS[lead.level];
  const reasons = lead.scoreReasons ?? [];
  const tooltip = reasons
    .map((r) => `+${r.points} ${r.label}`)
    .join("\n");
  return (
    <span
      title={tooltip || undefined}
      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-mono uppercase tracking-eyebrow cursor-help"
      style={{ background: `${color}15`, borderColor: `${color}55`, color }}
    >
      {lead.level === "hot" && (
        <span className="relative flex h-1.5 w-1.5">
          <span
            className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-75"
            style={{ background: color }}
          />
          <span
            className="relative inline-flex h-1.5 w-1.5 rounded-full"
            style={{ background: color }}
          />
        </span>
      )}
      {LEVEL_LABELS[lead.level]}
      {typeof lead.score === "number" && (
        <span className="opacity-70 tabular-nums">{lead.score}</span>
      )}
    </span>
  );
}

function StatusBadge({ status }: { status: LeadRecord["status"] }) {
  const s = STATUSES.find((x) => x.id === status)!;
  return (
    <span
      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-mono uppercase tracking-eyebrow border"
      style={{ background: `${s.color}15`, borderColor: `${s.color}55`, color: s.color }}
    >
      <s.icon className="h-3.5 w-3.5" />
      {s.label}
    </span>
  );
}
