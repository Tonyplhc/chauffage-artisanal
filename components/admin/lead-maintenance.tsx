"use client";

/**
 * Bloc contrat d'entretien sur la fiche lead.
 *
 * Affiche les contrats existants + bouton de création. Action "Visite faite"
 * pour avancer le compteur de la prochaine échéance.
 */

import { useEffect, useState, useCallback } from "react";
import {
  Wrench,
  Loader2,
  Plus,
  Check,
  Calendar,
} from "lucide-react";
import { cn } from "@/lib/utils";

type Contract = {
  id: string;
  contractNumber: string;
  type: "chaudiere" | "pac" | "clim" | "sanitaire" | "autre";
  equipment: string;
  frequency: "annual" | "biannual" | "quarterly";
  startDate: string;
  nextDueAt: string;
  lastVisitAt?: string;
  amountAnnualEur?: number;
  status: "active" | "paused" | "expired";
};

const TYPE_LABELS = {
  chaudiere: "Chaudière",
  pac: "PAC",
  clim: "Climatisation",
  sanitaire: "Sanitaire",
  autre: "Autre",
};

const FREQ_LABELS = {
  annual: "1×/an",
  biannual: "2×/an",
  quarterly: "4×/an",
};

function formatEur(value: number) {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(value);
}

export function LeadMaintenanceBlock({
  reference,
  clientName,
}: {
  reference: string;
  clientName: string;
}) {
  const [contracts, setContracts] = useState<Contract[] | null>(null);
  const [creating, setCreating] = useState(false);
  const [draft, setDraft] = useState({
    type: "chaudiere" as Contract["type"],
    equipment: "",
    frequency: "annual" as Contract["frequency"],
    amountAnnualEur: 0,
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const res = await fetch(`/api/admin/maintenance`, { cache: "no-store" });
    if (res.ok) {
      const d = await res.json();
      setContracts(
        (d.contracts as Contract[]).filter(
          (c) => (c as unknown as { leadReference: string }).leadReference === reference,
        ),
      );
    }
  }, [reference]);

  useEffect(() => {
    load();
  }, [load]);

  const create = async () => {
    if (!draft.equipment.trim()) {
      setError("Description équipement requise");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/maintenance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...draft,
          leadReference: reference,
          clientName,
        }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error ?? "Erreur");
      setCreating(false);
      setDraft({
        type: "chaudiere",
        equipment: "",
        frequency: "annual",
        amountAnnualEur: 0,
      });
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setBusy(false);
    }
  };

  const recordVisit = async (id: string) => {
    if (!confirm("Marquer la visite comme effectuée aujourd'hui ?")) return;
    setBusy(true);
    try {
      await fetch(`/api/admin/maintenance/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recordVisit: true }),
      });
      await load();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="rounded-2xl border border-ink/10 bg-white shadow-soft p-5">
      <div className="flex items-center gap-2 mb-3">
        <Wrench className="h-4 w-4 text-copper" />
        <span className="font-mono text-[10px] uppercase tracking-eyebrow text-copper">
          Contrats d&apos;entretien
        </span>
        {contracts && contracts.length > 0 && (
          <span className="ml-auto font-mono text-xs text-muted">
            {contracts.length}
          </span>
        )}
      </div>

      {contracts === null ? (
        <Loader2 className="h-4 w-4 animate-spin text-muted" />
      ) : contracts.length === 0 && !creating ? (
        <p className="text-xs text-graphite mb-3">
          Aucun contrat en cours. Idéal après installation d&apos;une chaudière
          ou d&apos;une PAC.
        </p>
      ) : (
        <ul className="grid gap-2 mb-3">
          {contracts.map((c) => {
            const overdue = new Date(c.nextDueAt).getTime() < Date.now();
            return (
              <li
                key={c.id}
                className={cn(
                  "p-3 rounded-xl border",
                  overdue
                    ? "bg-ember/5 border-ember/30"
                    : "bg-cream border-ink/8",
                )}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-mono text-[10px] text-copper">
                    {c.contractNumber}
                  </span>
                  <span className="text-[10px] font-mono uppercase tracking-eyebrow text-graphite bg-white border border-ink/8 px-2 py-0.5 rounded-full">
                    {TYPE_LABELS[c.type]}
                  </span>
                  <span className="text-[10px] font-mono text-muted">
                    {FREQ_LABELS[c.frequency]}
                  </span>
                  {c.amountAnnualEur && c.amountAnnualEur > 0 && (
                    <span className="ml-auto text-[11px] font-mono text-ink">
                      {formatEur(c.amountAnnualEur)}/an
                    </span>
                  )}
                </div>
                <div className="text-xs text-graphite mb-1">{c.equipment}</div>
                <div className="flex items-center gap-2 text-[11px]">
                  <Calendar className="h-3 w-3 text-muted" />
                  <span
                    className={cn(
                      "font-mono",
                      overdue ? "text-ember font-medium" : "text-graphite",
                    )}
                  >
                    Prochaine :{" "}
                    {new Date(c.nextDueAt).toLocaleDateString("fr-FR", {
                      dateStyle: "medium",
                    })}
                  </span>
                  {c.lastVisitAt && (
                    <span className="ml-auto text-muted">
                      Dernière :{" "}
                      {new Date(c.lastVisitAt).toLocaleDateString("fr-FR")}
                    </span>
                  )}
                </div>
                <button
                  onClick={() => recordVisit(c.id)}
                  disabled={busy}
                  className="mt-2 inline-flex items-center gap-1 px-2 py-1 rounded-full bg-[#22a06b]/10 text-[#22a06b] border border-[#22a06b]/30 text-[10px] hover:bg-[#22a06b] hover:text-cream disabled:opacity-50"
                >
                  <Check className="h-2.5 w-2.5" />
                  Visite faite
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {error && <div className="text-xs text-ember mb-2">{error}</div>}

      {!creating ? (
        <button
          onClick={() => setCreating(true)}
          className="inline-flex items-center gap-1.5 text-xs text-copper hover:underline"
        >
          <Plus className="h-3 w-3" />
          Nouveau contrat
        </button>
      ) : (
        <div className="grid gap-2 border-t border-ink/8 pt-3">
          <div className="grid grid-cols-2 gap-2">
            <select
              value={draft.type}
              onChange={(e) =>
                setDraft({
                  ...draft,
                  type: e.target.value as Contract["type"],
                })
              }
              className="bg-cream border border-ink/12 rounded-xl px-3 py-2 text-sm focus:border-copper focus:outline-none"
            >
              {(Object.entries(TYPE_LABELS) as [Contract["type"], string][]).map(
                ([k, label]) => (
                  <option key={k} value={k}>
                    {label}
                  </option>
                ),
              )}
            </select>
            <select
              value={draft.frequency}
              onChange={(e) =>
                setDraft({
                  ...draft,
                  frequency: e.target.value as Contract["frequency"],
                })
              }
              className="bg-cream border border-ink/12 rounded-xl px-3 py-2 text-sm focus:border-copper focus:outline-none"
            >
              {(
                Object.entries(FREQ_LABELS) as [Contract["frequency"], string][]
              ).map(([k, label]) => (
                <option key={k} value={k}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          <input
            value={draft.equipment}
            onChange={(e) =>
              setDraft({ ...draft, equipment: e.target.value })
            }
            placeholder="Équipement (ex : Viessmann Vitodens 100-W 32 kW)"
            className="bg-cream border border-ink/12 rounded-xl px-3 py-2 text-sm focus:border-copper focus:outline-none"
            autoFocus
          />
          <input
            type="number"
            value={draft.amountAnnualEur}
            onChange={(e) =>
              setDraft({
                ...draft,
                amountAnnualEur: Number(e.target.value) || 0,
              })
            }
            placeholder="Montant annuel en € (optionnel)"
            className="bg-cream border border-ink/12 rounded-xl px-3 py-2 text-sm font-mono focus:border-copper focus:outline-none"
          />
          <div className="flex items-center gap-2">
            <button
              onClick={create}
              disabled={busy}
              className="inline-flex items-center gap-1.5 rounded-full bg-ink text-cream px-3 py-1.5 text-xs hover:bg-copper disabled:opacity-50"
            >
              {busy ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <Check className="h-3 w-3" />
              )}
              Créer le contrat
            </button>
            <button
              onClick={() => {
                setCreating(false);
                setError(null);
              }}
              className="text-xs text-graphite hover:text-ink"
            >
              Annuler
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
