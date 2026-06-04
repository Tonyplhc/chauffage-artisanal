"use client";

/**
 * Cockpit "Interventions" — vue terrain admin.
 *
 * Refonte 2026-06-04 : on remplace la liste tabulaire austère par un cockpit
 * orienté technicien (KPI temps réel, filtres rapides, cartes touch-friendly,
 * sections "Aujourd'hui / À venir / Brouillons / Récentes finalisées").
 *
 * Données : `GET /api/admin/visits` → MaintenanceVisit[]
 * Identité technicien : `GET /api/admin/me`
 * Création ad-hoc : `POST /api/admin/visits`
 */

import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Wrench,
  Clock,
  CheckCircle2,
  FileSignature,
  MessageSquare,
  Plus,
  Search,
  ArrowRight,
  Loader2,
  RefreshCw,
  Filter,
  MapPin,
  User,
  X,
} from "lucide-react";
import {
  AdminPageShell,
  KpiCard,
  SectionCard,
  EmptyState,
  CenteredLoader,
} from "@/components/admin/ui-kit";

/* ── Types ─────────────────────────────────────────────────────────────── */

type VisitType = "entretien" | "depannage" | "pose" | "diagnostic";

type MaintenanceVisit = {
  id: string;
  contractId?: string;
  leadReference: string;
  equipmentId?: string;
  type: VisitType;
  visitedAt: string;
  technicianEmail?: string;
  durationMin?: number;
  checklist: unknown[];
  measurements: unknown[];
  partsReplaced: unknown[];
  interventionNotes?: { id: string; at: string; text: string }[];
  clientSignature?: { dataUrl: string; signerName: string; signedAt: string };
  status: "draft" | "finalized";
  finalizedAt?: string;
  createdAt: string;
  updatedAt: string;
};

/** Sous-ensemble du lead utilisé pour résoudre la référence → identité client. */
type LeadLite = {
  reference: string;
  fullName: string;
  commune?: string;
  phone?: string;
  status?: string;
};

type TypeFilter = "all" | VisitType;

/* ── Constantes UI ─────────────────────────────────────────────────────── */

const TYPE_LABEL: Record<VisitType, string> = {
  entretien: "Entretien",
  depannage: "Dépannage",
  pose: "Pose",
  diagnostic: "Diagnostic",
};

const TYPE_COLOR: Record<VisitType, string> = {
  entretien: "#b86a36", // copper
  depannage: "#c4503a", // ember
  pose: "#6ba3c5",
  diagnostic: "#8b847a",
};

const TYPE_CHIPS: { value: TypeFilter; label: string }[] = [
  { value: "all", label: "Tous" },
  { value: "entretien", label: "Entretien" },
  { value: "depannage", label: "Dépannage" },
  { value: "pose", label: "Pose" },
  { value: "diagnostic", label: "Diagnostic" },
];

/* ── Helpers temps ─────────────────────────────────────────────────────── */

function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function formatTime(iso: string) {
  try {
    const d = new Date(iso);
    return d.toLocaleTimeString("fr-FR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "—";
  }
}

function formatDay(iso: string) {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString("fr-FR", {
      weekday: "short",
      day: "2-digit",
      month: "short",
    });
  } catch {
    return "—";
  }
}

function shortEmail(email?: string) {
  if (!email) return "—";
  const idx = email.indexOf("@");
  return idx > 0 ? email.slice(0, idx) : email;
}

/* ── Carte intervention ────────────────────────────────────────────────── */

function VisitCard({
  visit,
  showDay,
  leadInfo,
}: {
  visit: MaintenanceVisit;
  showDay?: boolean;
  /** Identité client résolue depuis le store leads (peut être absent si lead supprimé). */
  leadInfo?: LeadLite;
}) {
  const router = useRouter();
  const typeColor = TYPE_COLOR[visit.type];
  const notesCount = visit.interventionNotes?.length ?? 0;
  const signed = !!visit.clientSignature;
  const finalized = visit.status === "finalized";

  const onOpen = () => router.push(`/admin/visits/${visit.id}`);

  return (
    <div
      onClick={onOpen}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onOpen();
        }
      }}
      role="button"
      tabIndex={0}
      className="group flex items-center gap-4 px-5 py-4 hover:bg-cream/30 cursor-pointer transition-colors"
    >
      {/* Heure */}
      <div className="flex flex-col items-center justify-center w-20 shrink-0">
        <div className="font-mono tabular-nums text-xl text-ink leading-none">
          {formatTime(visit.visitedAt)}
        </div>
        {showDay && (
          <div className="mt-1 font-mono text-[10px] uppercase tracking-eyebrow text-muted">
            {formatDay(visit.visitedAt)}
          </div>
        )}
      </div>

      {/* Séparateur vertical type */}
      <div
        className="w-1 self-stretch rounded-full"
        style={{ background: typeColor }}
        aria-hidden
      />

      {/* Bloc identité */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1 flex-wrap">
          <span
            className="font-mono text-[10px] uppercase tracking-eyebrow px-2 py-0.5 rounded-full"
            style={{ background: `${typeColor}18`, color: typeColor }}
          >
            {TYPE_LABEL[visit.type]}
          </span>
          {visit.contractId && (
            <span className="font-mono text-[10px] uppercase tracking-eyebrow px-2 py-0.5 rounded-full bg-ink/5 text-graphite">
              sous contrat
            </span>
          )}
        </div>
        {/* Identité client (résolue) ou référence brute */}
        {leadInfo ? (
          <>
            <div className="text-sm text-ink font-medium truncate inline-flex items-center gap-1.5">
              <User className="h-3 w-3 text-muted shrink-0" />
              {leadInfo.fullName}
            </div>
            <div className="text-xs text-graphite truncate mt-0.5 inline-flex items-center gap-1.5">
              {leadInfo.commune && (
                <>
                  <MapPin className="h-3 w-3 text-muted shrink-0" />
                  {leadInfo.commune}
                  <span className="text-muted">·</span>
                </>
              )}
              <span className="font-mono text-[10px] text-muted">
                {visit.leadReference}
              </span>
            </div>
          </>
        ) : (
          <>
            <div className="font-mono text-sm text-ink truncate">
              {visit.leadReference}
            </div>
            <div className="text-xs text-muted truncate mt-0.5">
              Lead non résolu (supprimé ?)
            </div>
          </>
        )}
        <div className="text-[11px] text-muted truncate mt-0.5">
          Technicien : {shortEmail(visit.technicianEmail)}
        </div>
      </div>

      {/* Badges statut */}
      <div className="hidden sm:flex flex-col items-end gap-1 shrink-0">
        {signed && (
          <span className="inline-flex items-center gap-1 font-mono text-[10px] uppercase tracking-eyebrow px-2 py-0.5 rounded-full bg-[#22a06b]/12 text-[#22a06b]">
            <FileSignature className="h-3 w-3" />
            Signée
          </span>
        )}
        {notesCount > 0 && (
          <span className="inline-flex items-center gap-1 font-mono text-[10px] uppercase tracking-eyebrow px-2 py-0.5 rounded-full bg-copper/12 text-copper">
            <MessageSquare className="h-3 w-3" />
            {notesCount} note{notesCount > 1 ? "s" : ""}
          </span>
        )}
        {finalized && (
          <span className="inline-flex items-center gap-1 font-mono text-[10px] uppercase tracking-eyebrow px-2 py-0.5 rounded-full bg-[#22a06b]/12 text-[#22a06b]">
            <CheckCircle2 className="h-3 w-3" />
            Finalisée
          </span>
        )}
      </div>

      {/* CTA */}
      <div className="shrink-0">
        <span className="inline-flex items-center gap-1 rounded-full bg-ink text-cream px-4 py-2 text-sm group-hover:bg-copper transition-colors">
          Ouvrir
          <ArrowRight className="h-3.5 w-3.5" />
        </span>
      </div>
    </div>
  );
}

/* ── Picker client (combobox sur les leads) ─────────────────────────────── */

/**
 * Combobox de sélection client. Le technicien ne saisit jamais la référence
 * à la main : il tape le nom ou la commune, choisit dans la dropdown.
 * Affiche aussi le téléphone — c'est ce dont il a besoin sur place.
 */
function LeadCombobox({
  leads,
  value,
  onChange,
  onExpressCreated,
  autoFocus,
}: {
  leads: LeadLite[] | null;
  value: LeadLite | null;
  onChange: (lead: LeadLite | null) => void;
  /** Notifie le parent quand un lead express est créé (pour reload de la liste) */
  onExpressCreated?: (lead: LeadLite) => void;
  autoFocus?: boolean;
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [showExpressForm, setShowExpressForm] = useState(false);
  const [expressFullName, setExpressFullName] = useState("");
  const [expressCommune, setExpressCommune] = useState("");
  const [expressPhone, setExpressPhone] = useState("");
  const [expressBusy, setExpressBusy] = useState(false);
  const [expressError, setExpressError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (autoFocus) setTimeout(() => inputRef.current?.focus(), 50);
  }, [autoFocus]);

  const matches = useMemo(() => {
    if (!leads) return [];
    const q = query.trim().toLowerCase();
    const base = q
      ? leads.filter((l) => {
          const hay = `${l.fullName} ${l.commune ?? ""} ${l.reference} ${l.phone ?? ""}`
            .toLowerCase();
          return hay.includes(q);
        })
      : leads;
    return base.slice(0, 12);
  }, [leads, query]);

  const openExpressForm = () => {
    // Pré-remplit le nom avec la query (l'opérateur a déjà tapé)
    setExpressFullName(query.trim());
    setExpressCommune("");
    setExpressPhone("");
    setExpressError(null);
    setShowExpressForm(true);
    setOpen(false);
  };

  const submitExpress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (expressFullName.trim().length < 2) {
      setExpressError("Nom requis");
      return;
    }
    if (expressCommune.trim().length < 2) {
      setExpressError("Commune requise");
      return;
    }
    setExpressBusy(true);
    setExpressError(null);
    try {
      const res = await fetch("/api/admin/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: expressFullName.trim(),
          commune: expressCommune.trim(),
          phone: expressPhone.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Erreur");
      const newLead: LeadLite = {
        reference: data.lead.reference,
        fullName: data.lead.fullName,
        commune: data.lead.commune,
        phone: data.lead.phone,
        status: data.lead.status,
      };
      onExpressCreated?.(newLead);
      onChange(newLead);
      setShowExpressForm(false);
    } catch (err) {
      setExpressError(err instanceof Error ? err.message : "Erreur");
    } finally {
      setExpressBusy(false);
    }
  };

  // ── Mode "création express" : petit formulaire inline ──
  if (showExpressForm && !value) {
    return (
      <div className="rounded-xl border-2 border-copper/40 bg-copper/5 p-3 space-y-2">
        <div className="flex items-center gap-2 mb-1">
          <Plus className="h-3.5 w-3.5 text-copper" />
          <span className="font-mono text-[10px] uppercase tracking-eyebrow text-copper">
            Nouveau client express
          </span>
          <button
            type="button"
            onClick={() => setShowExpressForm(false)}
            className="ml-auto text-[10px] text-graphite hover:text-ink"
          >
            Annuler
          </button>
        </div>
        <input
          type="text"
          value={expressFullName}
          onChange={(e) => setExpressFullName(e.target.value)}
          placeholder="Nom complet (M. Schmitz)"
          autoFocus
          className="w-full rounded-lg border border-ink/15 px-3 py-1.5 text-sm focus:outline-none focus:border-copper"
        />
        <input
          type="text"
          value={expressCommune}
          onChange={(e) => setExpressCommune(e.target.value)}
          placeholder="Commune (Luxembourg, Esch…)"
          className="w-full rounded-lg border border-ink/15 px-3 py-1.5 text-sm focus:outline-none focus:border-copper"
        />
        <input
          type="tel"
          value={expressPhone}
          onChange={(e) => setExpressPhone(e.target.value)}
          placeholder="Téléphone (optionnel)"
          className="w-full rounded-lg border border-ink/15 px-3 py-1.5 text-sm font-mono focus:outline-none focus:border-copper"
        />
        {expressError && (
          <div className="text-[11px] text-ember">{expressError}</div>
        )}
        <button
          type="button"
          onClick={submitExpress}
          disabled={expressBusy}
          className="w-full inline-flex items-center justify-center gap-1.5 rounded-lg bg-ink text-cream px-3 py-2 text-xs hover:bg-copper transition-colors disabled:opacity-50"
        >
          {expressBusy && <Loader2 className="h-3 w-3 animate-spin" />}
          Créer le dossier &amp; le sélectionner
        </button>
        <p className="text-[10px] text-muted">
          Un dossier minimal est créé. Tu pourras le compléter plus tard
          depuis le Pipeline.
        </p>
      </div>
    );
  }

  if (value) {
    // État "lead choisi" : on affiche la carte avec X pour effacer
    return (
      <div className="rounded-xl border border-copper/40 bg-copper/5 p-3 flex items-start gap-3">
        <div className="grid place-items-center h-8 w-8 rounded-full bg-copper/15 text-copper shrink-0">
          <User className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-sm text-ink font-medium truncate">
            {value.fullName}
          </div>
          <div className="text-xs text-graphite mt-0.5 flex items-center gap-2 flex-wrap">
            {value.commune && (
              <span className="inline-flex items-center gap-1">
                <MapPin className="h-3 w-3 text-muted" />
                {value.commune}
              </span>
            )}
            {value.phone && (
              <span className="font-mono text-[11px]">{value.phone}</span>
            )}
            <span className="font-mono text-[10px] text-muted">
              {value.reference}
            </span>
          </div>
        </div>
        <button
          type="button"
          onClick={() => {
            onChange(null);
            setQuery("");
            setTimeout(() => inputRef.current?.focus(), 50);
          }}
          aria-label="Changer de client"
          className="h-7 w-7 grid place-items-center rounded-full hover:bg-white text-graphite hover:text-ember shrink-0"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    );
  }

  return (
    <div className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted pointer-events-none" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          placeholder={
            leads === null
              ? "Chargement des clients…"
              : "Tapez un nom, une commune, un numéro…"
          }
          disabled={leads === null}
          className="w-full rounded-xl border border-ink/15 bg-white pl-9 pr-3 py-2 text-sm focus:outline-none focus:border-copper disabled:opacity-50"
          autoComplete="off"
        />
      </div>
      {open && leads && (
        <ul className="absolute z-10 mt-1 w-full max-h-80 overflow-y-auto rounded-xl border border-ink/10 bg-white shadow-lift">
          {matches.map((l) => (
            <li key={l.reference}>
              <button
                type="button"
                // onMouseDown au lieu de onClick pour éviter que onBlur
                // ferme la dropdown avant le clic
                onMouseDown={(e) => {
                  e.preventDefault();
                  onChange(l);
                  setQuery("");
                  setOpen(false);
                }}
                className="w-full text-left px-3 py-2 hover:bg-cream/60 transition-colors flex items-start gap-2 border-b border-ink/5"
              >
                <User className="h-3.5 w-3.5 text-copper mt-0.5 shrink-0" />
                <div className="min-w-0 flex-1">
                  <div className="text-sm text-ink font-medium truncate">
                    {l.fullName}
                  </div>
                  <div className="text-[11px] text-muted truncate flex items-center gap-1.5">
                    {l.commune && (
                      <span className="inline-flex items-center gap-0.5">
                        <MapPin className="h-2.5 w-2.5" />
                        {l.commune}
                      </span>
                    )}
                    {l.phone && <span className="font-mono">{l.phone}</span>}
                    <span className="font-mono text-[9px] ml-auto">
                      {l.reference}
                    </span>
                  </div>
                </div>
              </button>
            </li>
          ))}
          {matches.length === 0 && (
            <li className="px-3 py-3 text-xs text-muted">
              {leads.length === 0
                ? "Aucun client en base."
                : "Aucun client ne correspond à cette recherche."}
            </li>
          )}
          {/* Toujours disponible : créer un nouveau client */}
          <li className="bg-copper/5">
            <button
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                openExpressForm();
              }}
              className="w-full text-left px-3 py-2.5 hover:bg-copper/10 transition-colors flex items-center gap-2 text-copper"
            >
              <Plus className="h-4 w-4 shrink-0" />
              <span className="text-sm font-medium">
                {query.trim()
                  ? `+ Créer le client « ${query.trim()} »`
                  : "+ Nouveau client express"}
              </span>
              <ArrowRight className="h-3 w-3 ml-auto" />
            </button>
          </li>
        </ul>
      )}
    </div>
  );
}

/* ── Modale création ───────────────────────────────────────────────────── */

function NewVisitDialog({
  open,
  onClose,
  onCreated,
  defaultTechEmail,
  leads,
  onLeadCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: (visit: MaintenanceVisit) => void;
  defaultTechEmail?: string;
  leads: LeadLite[] | null;
  /** Callback quand un nouveau lead a été créé via le combobox */
  onLeadCreated?: (lead: LeadLite) => void;
}) {
  const [selectedLead, setSelectedLead] = useState<LeadLite | null>(null);
  const [type, setType] = useState<VisitType>("depannage");
  const [visitedAt, setVisitedAt] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fillNow = useCallback(() => {
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, "0");
    const iso = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`;
    setVisitedAt(iso);
  }, []);

  useEffect(() => {
    if (open) {
      setSelectedLead(null);
      setType("depannage");
      fillNow();
      setError(null);
    }
  }, [open, fillNow]);

  if (!open) return null;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLead) {
      setError("Sélectionne un client");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/visits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          leadReference: selectedLead.reference,
          type,
          visitedAt: visitedAt ? new Date(visitedAt).toISOString() : undefined,
          technicianEmail: defaultTechEmail,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.error ?? "Erreur création");
        setSubmitting(false);
        return;
      }
      // Cache la visite côté client pour survivre à un cold-start Vercel
      // entre le POST (Lambda A) et le GET de l'éditeur (Lambda B éventuellement).
      try {
        sessionStorage.setItem(
          `visit:${data.visit.id}`,
          JSON.stringify(data.visit),
        );
      } catch {
        // sessionStorage indisponible (mode privé strict) → tant pis
      }
      onCreated(data.visit as MaintenanceVisit);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur réseau");
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/40"
      role="dialog"
      aria-modal="true"
      aria-labelledby="new-visit-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <form
        onSubmit={submit}
        className="w-full max-w-md rounded-2xl bg-white shadow-soft border border-ink/10 overflow-hidden"
      >
        <div className="px-5 py-4 border-b border-ink/8 bg-cream/40 flex items-center gap-2">
          <Plus className="h-4 w-4 text-copper" />
          <h2
            id="new-visit-title"
            className="font-mono text-[10px] uppercase tracking-eyebrow text-copper"
          >
            Nouvelle intervention
          </h2>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="block font-mono text-[10px] uppercase tracking-eyebrow text-graphite mb-1.5">
              Client
            </label>
            <LeadCombobox
              leads={leads}
              value={selectedLead}
              onChange={setSelectedLead}
              onExpressCreated={onLeadCreated}
              autoFocus
            />
          </div>
          <div>
            <label className="block font-mono text-[10px] uppercase tracking-eyebrow text-graphite mb-1.5">
              Type d'intervention
            </label>
            <div className="flex flex-wrap gap-1.5">
              {(Object.keys(TYPE_LABEL) as VisitType[]).map((t) => (
                <button
                  type="button"
                  key={t}
                  onClick={() => setType(t)}
                  className={`px-3 py-1.5 rounded-full text-xs font-mono uppercase tracking-eyebrow border transition-colors ${
                    type === t
                      ? "bg-ink text-cream border-ink"
                      : "bg-white text-graphite border-ink/15 hover:border-copper"
                  }`}
                >
                  {TYPE_LABEL[t]}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block font-mono text-[10px] uppercase tracking-eyebrow text-graphite mb-1.5 flex items-center justify-between">
              <span>Date / heure</span>
              <button
                type="button"
                onClick={fillNow}
                className="text-[10px] text-copper hover:underline normal-case tracking-normal"
              >
                Maintenant
              </button>
            </label>
            <input
              type="datetime-local"
              value={visitedAt}
              onChange={(e) => setVisitedAt(e.target.value)}
              className="w-full rounded-xl border border-ink/15 px-3 py-2 text-sm font-mono focus:outline-none focus:border-copper"
            />
          </div>
          {error && (
            <div className="rounded-xl bg-[#c4503a]/12 text-[#c4503a] px-3 py-2 text-sm">
              {error}
            </div>
          )}
        </div>
        <div className="px-5 py-3 border-t border-ink/8 bg-cream/30 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="px-4 py-2 rounded-full text-sm text-graphite hover:text-ink disabled:opacity-50"
          >
            Annuler
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center gap-2 rounded-full bg-ink text-cream px-4 py-2 text-sm hover:bg-copper transition-colors disabled:opacity-50"
          >
            {submitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            Créer & ouvrir
          </button>
        </div>
      </form>
    </div>
  );
}

/* ── Page ──────────────────────────────────────────────────────────────── */

export default function InterventionsCockpitPage() {
  const router = useRouter();
  const [visits, setVisits] = useState<MaintenanceVisit[] | null>(null);
  const [leads, setLeads] = useState<LeadLite[] | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [myEmail, setMyEmail] = useState<string | undefined>(undefined);

  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [mineOnly, setMineOnly] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  const load = useCallback(
    async (silent = false) => {
      if (!silent) setRefreshing(true);
      const res = await fetch("/api/admin/visits", { cache: "no-store" });
      if (res.status === 401) {
        router.replace("/admin/login");
        return;
      }
      if (res.ok) {
        const d = await res.json();
        setVisits((d.visits ?? []) as MaintenanceVisit[]);
      } else {
        setVisits([]);
      }
      setRefreshing(false);
    },
    [router],
  );

  const loadLeads = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/leads", { cache: "no-store" });
      if (res.ok) {
        const d = await res.json();
        const lite: LeadLite[] = ((d.leads ?? []) as Array<Record<string, unknown>>)
          .map((l) => ({
            reference: String(l.reference ?? ""),
            fullName: String(l.fullName ?? "Sans nom"),
            commune: typeof l.commune === "string" ? l.commune : undefined,
            phone: typeof l.phone === "string" ? l.phone : undefined,
            status: typeof l.status === "string" ? l.status : undefined,
          }))
          .filter((l) => l.reference);
        setLeads(lite);
      } else {
        setLeads([]);
      }
    } catch {
      setLeads([]);
    }
  }, []);

  const loadMe = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/me", { cache: "no-store" });
      if (res.ok) {
        const d = await res.json();
        if (typeof d.email === "string") setMyEmail(d.email);
      }
    } catch {
      // silencieux : pas grave si on n'a pas l'email
    }
  }, []);

  useEffect(() => {
    load();
    loadLeads();
    loadMe();
  }, [load, loadLeads, loadMe]);

  // Map reference → identité client (pour cartes + filtres)
  const leadsByRef = useMemo(() => {
    const m = new Map<string, LeadLite>();
    if (leads) for (const l of leads) m.set(l.reference, l);
    return m;
  }, [leads]);

  // Auto-refresh toutes les 60s (silencieux)
  useEffect(() => {
    const id = setInterval(() => {
      load(true);
    }, 60_000);
    return () => clearInterval(id);
  }, [load]);

  /* ── KPI ─────────────────────────────────────────────────────────── */

  const now = useMemo(() => new Date(), [visits]); // eslint-disable-line react-hooks/exhaustive-deps
  const today = useMemo(() => startOfDay(now), [now]);

  const kpis = useMemo(() => {
    if (!visits)
      return { today: 0, inProgress: 0, toSign: 0, finalized: 0 };
    let todayCount = 0;
    let inProgress = 0;
    let toSign = 0;
    let finalized = 0;
    for (const v of visits) {
      const at = new Date(v.visitedAt);
      if (isSameDay(at, now)) todayCount++;
      if (v.status === "draft" && at.getTime() <= now.getTime()) inProgress++;
      if (!v.clientSignature && at.getTime() < now.getTime()) toSign++;
      if (v.status === "finalized") finalized++;
    }
    return { today: todayCount, inProgress, toSign, finalized };
  }, [visits, now]);

  /* ── Filtrage ─────────────────────────────────────────────────────── */

  const filtered = useMemo(() => {
    if (!visits) return [];
    const q = search.trim().toLowerCase();
    return visits.filter((v) => {
      if (typeFilter !== "all" && v.type !== typeFilter) return false;
      if (mineOnly && (!myEmail || v.technicianEmail !== myEmail)) return false;
      if (q) {
        const info = leadsByRef.get(v.leadReference);
        const hay = `${v.leadReference} ${v.technicianEmail ?? ""} ${info?.fullName ?? ""} ${info?.commune ?? ""}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [visits, search, typeFilter, mineOnly, myEmail, leadsByRef]);

  /* ── Sections ─────────────────────────────────────────────────────── */

  const sections = useMemo(() => {
    const todayList: MaintenanceVisit[] = [];
    const upcomingList: MaintenanceVisit[] = [];
    const draftsLateList: MaintenanceVisit[] = [];
    const finalizedList: MaintenanceVisit[] = [];

    const oneDayMs = 24 * 60 * 60 * 1000;
    const tomorrowStart = new Date(today.getTime() + oneDayMs);

    for (const v of filtered) {
      const at = new Date(v.visitedAt);
      if (v.status === "finalized") {
        finalizedList.push(v);
        continue;
      }
      if (
        v.status === "draft" &&
        at.getTime() < today.getTime() - oneDayMs
      ) {
        draftsLateList.push(v);
        continue;
      }
      if (isSameDay(at, now)) {
        todayList.push(v);
        continue;
      }
      if (at.getTime() >= tomorrowStart.getTime()) {
        upcomingList.push(v);
      } else if (at.getTime() >= today.getTime()) {
        // dans la journée mais pas considéré "today" (edge case timezone)
        todayList.push(v);
      } else {
        // passée < 1j, status draft → considérée encore "aujourd'hui" en cours
        todayList.push(v);
      }
    }

    todayList.sort(
      (a, b) =>
        new Date(a.visitedAt).getTime() - new Date(b.visitedAt).getTime(),
    );
    upcomingList.sort(
      (a, b) =>
        new Date(a.visitedAt).getTime() - new Date(b.visitedAt).getTime(),
    );
    draftsLateList.sort(
      (a, b) =>
        new Date(a.visitedAt).getTime() - new Date(b.visitedAt).getTime(),
    );
    finalizedList.sort((a, b) => {
      const ta = a.finalizedAt ? new Date(a.finalizedAt).getTime() : 0;
      const tb = b.finalizedAt ? new Date(b.finalizedAt).getTime() : 0;
      return tb - ta;
    });

    return {
      today: todayList,
      upcoming: upcomingList,
      draftsLate: draftsLateList,
      finalized: finalizedList.slice(0, 20),
    };
  }, [filtered, today, now]);

  const totalFiltered =
    sections.today.length +
    sections.upcoming.length +
    sections.draftsLate.length +
    sections.finalized.length;

  /* ── Header eyebrow custom (pas dans AdminPageShell) ───────────────── */

  const actions = (
    <>
      <button
        type="button"
        onClick={() => load(false)}
        disabled={refreshing}
        aria-label="Rafraîchir la liste"
        title="Rafraîchir"
        className="inline-flex items-center justify-center h-9 w-9 rounded-full border border-ink/15 bg-white text-graphite hover:text-copper hover:border-copper transition-colors disabled:opacity-50"
      >
        {refreshing ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <RefreshCw className="h-4 w-4" />
        )}
      </button>
      <button
        type="button"
        onClick={() => setDialogOpen(true)}
        className="inline-flex items-center gap-2 rounded-full bg-ink text-cream px-4 py-2 text-sm hover:bg-copper transition-colors"
      >
        <Plus className="h-4 w-4" />
        Nouvelle intervention
      </button>
    </>
  );

  return (
    <AdminPageShell
      title="Interventions"
      description="Comptes-rendus terrain · signature client · notes horodatées"
      actions={actions}
    >
      {/* Eyebrow numéroté au-dessus du contenu (le titre AdminPageShell est déjà placé) */}
      <div className="-mt-6 mb-6 font-mono text-[10px] uppercase tracking-eyebrow text-copper">
        01 · Cockpit terrain
      </div>

      {/* KPI tiles */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <KpiCard
          label="Aujourd'hui"
          value={String(kpis.today)}
          icon={Clock}
          color={kpis.today > 0 ? "#b86a36" : undefined}
        />
        <KpiCard
          label="En cours"
          value={String(kpis.inProgress)}
          icon={Wrench}
          color={kpis.inProgress > 0 ? "#6ba3c5" : undefined}
        />
        <KpiCard
          label="À signer"
          value={String(kpis.toSign)}
          icon={FileSignature}
          color={kpis.toSign > 0 ? "#c4503a" : undefined}
        />
        <KpiCard
          label="Finalisées"
          value={String(kpis.finalized)}
          icon={CheckCircle2}
          color={kpis.finalized > 0 ? "#22a06b" : undefined}
        />
      </div>

      {/* Toolbar filtres */}
      <div className="rounded-2xl border border-ink/10 bg-white p-3 mb-6 flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted pointer-events-none" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Nom du client, commune, référence, technicien…"
            className="w-full rounded-xl border border-ink/10 bg-cream/40 pl-9 pr-3 py-2 text-sm focus:outline-none focus:border-copper focus:bg-white"
            aria-label="Rechercher une intervention"
          />
        </div>

        <button
          type="button"
          onClick={() => setMineOnly((v) => !v)}
          disabled={!myEmail}
          title={
            myEmail
              ? "Filtrer sur mes interventions"
              : "Email technicien non disponible"
          }
          className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-mono uppercase tracking-eyebrow border transition-colors disabled:opacity-50 ${
            mineOnly
              ? "bg-ink text-cream border-ink"
              : "bg-white text-graphite border-ink/15 hover:border-copper"
          }`}
        >
          <Filter className="h-3.5 w-3.5" />
          Mes interventions
        </button>

        <div className="flex items-center gap-1.5 flex-wrap">
          {TYPE_CHIPS.map((chip) => (
            <button
              type="button"
              key={chip.value}
              onClick={() => setTypeFilter(chip.value)}
              className={`px-3 py-1.5 rounded-full text-xs font-mono uppercase tracking-eyebrow border transition-colors ${
                typeFilter === chip.value
                  ? "bg-ink text-cream border-ink"
                  : "bg-white text-graphite border-ink/15 hover:border-copper"
              }`}
            >
              {chip.label}
            </button>
          ))}
        </div>
      </div>

      {/* Contenu */}
      {visits === null ? (
        <CenteredLoader label="Chargement des interventions…" />
      ) : visits.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-ink/15 bg-white py-12 px-6 text-center">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-full mb-4 bg-copper/12 text-copper">
            <Wrench className="h-5 w-5" />
          </div>
          <h3 className="font-display text-lg text-ink">
            Aucune intervention
          </h3>
          <p className="mt-2 text-sm text-graphite max-w-md mx-auto">
            Les interventions apparaissent ici dès qu'un technicien démarre un
            compte-rendu terrain.
          </p>
          <button
            type="button"
            onClick={() => setDialogOpen(true)}
            className="mt-5 inline-flex items-center gap-2 rounded-full bg-ink text-cream px-4 py-2 text-sm hover:bg-copper transition-colors"
          >
            <Plus className="h-4 w-4" />
            Créer la première
          </button>
        </div>
      ) : totalFiltered === 0 ? (
        <EmptyState
          icon={Filter}
          title="Aucun résultat"
          body="Aucune intervention ne correspond aux filtres actifs. Réinitialise la recherche ou change les critères."
        />
      ) : (
        <div className="space-y-6">
          {sections.today.length > 0 && (
            <SectionCard
              icon={Clock}
              eyebrow={`Aujourd'hui · ${sections.today.length}`}
            >
              <div className="divide-y divide-ink/5">
                {sections.today.map((v) => (
                  <VisitCard
                    key={v.id}
                    visit={v}
                    leadInfo={leadsByRef.get(v.leadReference)}
                  />
                ))}
              </div>
            </SectionCard>
          )}

          {sections.upcoming.length > 0 && (
            <SectionCard
              icon={ArrowRight}
              eyebrow={`À venir · ${sections.upcoming.length}`}
            >
              <div className="divide-y divide-ink/5">
                {sections.upcoming.map((v) => (
                  <VisitCard
                    key={v.id}
                    visit={v}
                    showDay
                    leadInfo={leadsByRef.get(v.leadReference)}
                  />
                ))}
              </div>
            </SectionCard>
          )}

          {sections.draftsLate.length > 0 && (
            <SectionCard
              icon={Wrench}
              eyebrow={`Brouillons à finaliser · ${sections.draftsLate.length}`}
              accentColor="#b86a36"
            >
              <div className="divide-y divide-ink/5">
                {sections.draftsLate.map((v) => (
                  <VisitCard
                    key={v.id}
                    visit={v}
                    showDay
                    leadInfo={leadsByRef.get(v.leadReference)}
                  />
                ))}
              </div>
            </SectionCard>
          )}

          {sections.finalized.length > 0 && (
            <SectionCard
              icon={CheckCircle2}
              eyebrow={`Récentes finalisées · ${sections.finalized.length}`}
              accentColor="#22a06b"
            >
              <div className="divide-y divide-ink/5">
                {sections.finalized.map((v) => (
                  <VisitCard
                    key={v.id}
                    visit={v}
                    showDay
                    leadInfo={leadsByRef.get(v.leadReference)}
                  />
                ))}
              </div>
            </SectionCard>
          )}
        </div>
      )}

      <NewVisitDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onCreated={(visit) => {
          setDialogOpen(false);
          router.push(`/admin/visits/${visit.id}`);
        }}
        defaultTechEmail={myEmail}
        leads={leads}
        onLeadCreated={(lead) => {
          // Ajoute le lead nouvellement créé en tête de liste, sans refetch
          setLeads((prev) => (prev ? [lead, ...prev] : [lead]));
        }}
      />
    </AdminPageShell>
  );
}
