"use client";

/**
 * Bloc paiement d'acompte pour la fiche lead.
 *
 * Création d'un lien de paiement, copie d'URL, simulation de paiement reçu
 * en mode démo.
 */

import { useEffect, useState, useCallback } from "react";
import {
  CreditCard,
  Loader2,
  Plus,
  Copy,
  Check,
  ExternalLink,
  CheckCircle2,
} from "lucide-react";
import { cn } from "@/lib/utils";

type Payment = {
  id: string;
  leadReference: string;
  quoteNumber?: string;
  amountCents: number;
  description: string;
  status: "pending" | "completed" | "canceled" | "expired";
  createdAt: string;
  paidAt?: string;
  paymentUrl: string;
  mode: "live" | "demo";
};

function formatEur(cents: number) {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

export function LeadPaymentBlock({ reference }: { reference: string }) {
  const [payments, setPayments] = useState<Payment[] | null>(null);
  const [creating, setCreating] = useState(false);
  const [draftAmount, setDraftAmount] = useState("");
  const [draftDesc, setDraftDesc] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const load = useCallback(async () => {
    const res = await fetch(`/api/admin/leads/${reference}/payment`, {
      cache: "no-store",
    });
    if (res.ok) {
      const d = await res.json();
      setPayments(d.payments ?? []);
    }
  }, [reference]);

  useEffect(() => {
    load();
  }, [load]);

  const create = async () => {
    const amt = Math.round(Number(draftAmount.replace(/[^\d.]/g, "")) * 100);
    if (!Number.isFinite(amt) || amt <= 0) {
      setError("Montant invalide");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/leads/${reference}/payment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amountCents: amt,
          description: draftDesc || `Acompte dossier ${reference}`,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Erreur");
      setCreating(false);
      setDraftAmount("");
      setDraftDesc("");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setBusy(false);
    }
  };

  const markPaid = async (paymentId: string) => {
    if (!confirm("Marquer ce paiement comme reçu (mode démo) ?")) return;
    setBusy(true);
    try {
      await fetch(`/api/admin/payments/${paymentId}`, { method: "POST" });
      await load();
    } finally {
      setBusy(false);
    }
  };

  const copy = async (id: string, url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 1500);
    } catch {}
  };

  const totalPaid = (payments ?? [])
    .filter((p) => p.status === "completed")
    .reduce((s, p) => s + p.amountCents, 0);

  return (
    <div className="rounded-2xl border border-ink/10 bg-white shadow-soft p-5">
      <div className="flex items-center justify-between mb-3">
        <div className="font-mono text-[10px] uppercase tracking-eyebrow text-copper inline-flex items-center gap-1.5">
          <CreditCard className="h-3 w-3" />
          Paiements
          {payments && payments.length > 0 && (
            <span className="text-muted">· {payments.length}</span>
          )}
        </div>
        {totalPaid > 0 && (
          <span className="text-[11px] font-mono text-[#22a06b]">
            Reçu : {formatEur(totalPaid)}
          </span>
        )}
      </div>

      {payments && payments.length > 0 && (
        <ul className="grid gap-2 mb-3">
          {payments.map((p) => {
            const isPaid = p.status === "completed";
            return (
              <li
                key={p.id}
                className={cn(
                  "rounded-xl border p-3",
                  isPaid
                    ? "bg-[#22a06b]/5 border-[#22a06b]/30"
                    : "bg-cream border-ink/8",
                )}
              >
                <div className="flex items-start gap-2">
                  {isPaid ? (
                    <CheckCircle2 className="h-3.5 w-3.5 text-[#22a06b] mt-0.5 shrink-0" />
                  ) : (
                    <CreditCard className="h-3.5 w-3.5 text-graphite mt-0.5 shrink-0" />
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm tabular-nums text-ink">
                        {formatEur(p.amountCents)}
                      </span>
                      <span
                        className={cn(
                          "px-1.5 py-0.5 rounded-full text-[9px] font-mono uppercase tracking-eyebrow",
                          isPaid
                            ? "bg-[#22a06b]/15 text-[#22a06b]"
                            : "bg-copper/15 text-copper",
                        )}
                      >
                        {isPaid ? "Payé" : "En attente"}
                      </span>
                      <span className="px-1.5 py-0.5 rounded-full text-[9px] font-mono uppercase tracking-eyebrow bg-cream border border-ink/8 text-graphite">
                        {p.mode}
                      </span>
                    </div>
                    <div className="text-xs text-graphite mt-0.5 truncate">
                      {p.description}
                    </div>
                    <div className="text-[10px] text-muted mt-0.5 font-mono">
                      {new Date(p.createdAt).toLocaleString("fr-FR")}
                      {p.paidAt && (
                        <> · réglé {new Date(p.paidAt).toLocaleString("fr-FR")}</>
                      )}
                    </div>
                  </div>
                </div>
                {!isPaid && (
                  <div className="flex items-center gap-1 mt-2 flex-wrap">
                    <a
                      href={p.paymentUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-white border border-ink/10 text-graphite text-[10px] hover:border-copper/40"
                    >
                      <ExternalLink className="h-2.5 w-2.5" />
                      Ouvrir lien
                    </a>
                    <button
                      onClick={() => copy(p.id, p.paymentUrl)}
                      className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-white border border-ink/10 text-graphite text-[10px] hover:border-copper/40"
                    >
                      {copiedId === p.id ? (
                        <Check className="h-2.5 w-2.5 text-[#22a06b]" />
                      ) : (
                        <Copy className="h-2.5 w-2.5" />
                      )}
                      Copier URL
                    </button>
                    {p.mode === "demo" && (
                      <button
                        onClick={() => markPaid(p.id)}
                        disabled={busy}
                        className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-ink text-cream text-[10px] hover:bg-copper disabled:opacity-50"
                      >
                        Simuler le paiement
                      </button>
                    )}
                  </div>
                )}
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
          Nouveau lien de paiement
        </button>
      ) : (
        <div className="grid gap-2">
          <div className="flex items-center gap-1.5 bg-cream border border-ink/12 rounded-xl px-3 py-2">
            <input
              type="text"
              inputMode="decimal"
              value={draftAmount}
              onChange={(e) => setDraftAmount(e.target.value)}
              placeholder="Montant en €"
              className="flex-1 bg-transparent text-base font-mono focus:outline-none"
              autoFocus
            />
            <span className="text-muted text-xs">EUR</span>
          </div>
          <input
            value={draftDesc}
            onChange={(e) => setDraftDesc(e.target.value)}
            placeholder="Description (ex : Acompte 30% chaudière + pose)"
            className="bg-cream border border-ink/12 rounded-xl px-3 py-2 text-sm focus:border-copper focus:outline-none"
          />
          <div className="flex items-center gap-2">
            <button
              onClick={create}
              disabled={busy || !draftAmount}
              className="inline-flex items-center gap-1.5 rounded-full bg-ink text-cream px-3 py-1.5 text-xs hover:bg-copper disabled:opacity-50"
            >
              {busy ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <Check className="h-3 w-3" />
              )}
              Créer
            </button>
            <button
              onClick={() => {
                setCreating(false);
                setDraftAmount("");
                setDraftDesc("");
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
