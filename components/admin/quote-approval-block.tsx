"use client";

/**
 * Bloc validation devis pour la fiche lead.
 *
 * Affiche le statut courant + bouton pour demander validation. Silencieux
 * si aucun devis n'existe sur le lead (le bouton est conservé mais inactif).
 */

import { useEffect, useState, useCallback } from "react";
import {
  ShieldCheck,
  Loader2,
  CheckCircle2,
  X as XIcon,
  Send,
  Clock,
} from "lucide-react";
import { cn } from "@/lib/utils";

type Approval = {
  id: string;
  leadReference: string;
  amountTtc: number;
  notes?: string;
  status: "pending" | "approved" | "rejected" | "withdrawn";
  requestedBy: string;
  requestedAt: string;
  reviewedBy?: string;
  reviewedAt?: string;
  reviewerComment?: string;
};

const STATUS_LABELS = {
  pending: "En attente",
  approved: "Approuvée",
  rejected: "Rejetée",
  withdrawn: "Retirée",
};

const STATUS_COLORS = {
  pending: "#b86a36",
  approved: "#22a06b",
  rejected: "#dc5a28",
  withdrawn: "#8b847a",
};

function formatEur(value: number) {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(value);
}

export function QuoteApprovalBlock({ reference }: { reference: string }) {
  const [approval, setApproval] = useState<Approval | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [requesting, setRequesting] = useState(false);
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const res = await fetch(
      `/api/admin/approvals?status=pending`,
      { cache: "no-store" },
    );
    if (res.ok) {
      const d = await res.json();
      const found = (d.approvals as Approval[]).find(
        (a) => a.leadReference === reference,
      );
      setApproval(found ?? null);
    }
    setLoaded(true);
  }, [reference]);

  useEffect(() => {
    load();
  }, [load]);

  const request = async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/admin/leads/${reference}/quote/request-approval`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ notes }),
        },
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Erreur");
      setRequesting(false);
      setNotes("");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setBusy(false);
    }
  };

  const withdraw = async () => {
    if (!approval) return;
    if (!confirm("Retirer cette demande de validation ?")) return;
    setBusy(true);
    try {
      await fetch(`/api/admin/approvals/${approval.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ decision: "withdrawn" }),
      });
      await load();
    } finally {
      setBusy(false);
    }
  };

  if (!loaded) {
    return (
      <div className="rounded-2xl border border-ink/10 bg-white shadow-soft p-5">
        <Loader2 className="h-4 w-4 animate-spin text-muted" />
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-ink/10 bg-white shadow-soft p-5">
      <div className="flex items-center gap-2 mb-3">
        <ShieldCheck className="h-4 w-4 text-copper" />
        <span className="font-mono text-[10px] uppercase tracking-eyebrow text-copper">
          Validation devis
        </span>
        {approval && (
          <span
            className="ml-auto px-2 py-0.5 rounded-full text-[10px] font-mono uppercase tracking-eyebrow"
            style={{
              background: `${STATUS_COLORS[approval.status]}1c`,
              color: STATUS_COLORS[approval.status],
            }}
          >
            {STATUS_LABELS[approval.status]}
          </span>
        )}
      </div>

      {approval ? (
        <div className="grid gap-2">
          <div className="text-xs text-graphite">
            Montant TTC :{" "}
            <strong className="text-ink font-mono">
              {formatEur(approval.amountTtc)}
            </strong>
          </div>
          {approval.notes && (
            <div className="text-xs text-graphite italic">
              « {approval.notes} »
            </div>
          )}
          <div className="text-[10px] text-muted font-mono">
            Par {approval.requestedBy} ·{" "}
            {new Date(approval.requestedAt).toLocaleString("fr-FR")}
          </div>
          {approval.reviewerComment && (
            <div className="mt-1 p-2 rounded-lg bg-cream border border-ink/5 text-xs text-graphite">
              {approval.reviewerComment}
            </div>
          )}
          {approval.status === "pending" && (
            <button
              onClick={withdraw}
              disabled={busy}
              className="inline-flex items-center gap-1 text-xs text-graphite hover:text-ember mt-1"
            >
              <XIcon className="h-3 w-3" />
              Retirer ma demande
            </button>
          )}
        </div>
      ) : !requesting ? (
        <>
          <p className="text-xs text-graphite mb-3">
            Pour les gros montants ou configurations sensibles, demandez à un
            collègue de relire avant envoi.
          </p>
          <button
            onClick={() => setRequesting(true)}
            className="inline-flex items-center gap-1.5 rounded-full bg-copper/10 border border-copper/30 text-copper px-3 py-1.5 text-xs hover:bg-copper hover:text-cream transition-colors"
          >
            <Send className="h-3 w-3" />
            Demander validation
          </button>
        </>
      ) : (
        <div className="grid gap-2">
          <textarea
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Contexte pour le validateur (optionnel)…"
            className="w-full bg-cream border border-ink/12 rounded-xl px-3 py-2 text-sm focus:border-copper focus:outline-none resize-none"
            autoFocus
          />
          {error && <div className="text-xs text-ember">{error}</div>}
          <div className="flex items-center gap-2">
            <button
              onClick={request}
              disabled={busy}
              className="inline-flex items-center gap-1.5 rounded-full bg-ink text-cream px-3 py-1.5 text-xs hover:bg-copper disabled:opacity-50"
            >
              {busy ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <CheckCircle2 className="h-3 w-3" />
              )}
              Envoyer la demande
            </button>
            <button
              onClick={() => {
                setRequesting(false);
                setNotes("");
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
