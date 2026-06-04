"use client";

/**
 * Inbox des validations devis.
 *
 * Affiche les demandes pending par défaut. Filtres pour voir l'historique.
 * Modal de décision avec commentaire obligatoire pour les rejets.
 */

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Loader2,
  ShieldCheck,
  X as XIcon,
  CheckCircle2,
  Clock,
  ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

type Approval = {
  id: string;
  leadReference: string;
  quoteNumber?: string;
  amountTtc: number;
  notes?: string;
  status: "pending" | "approved" | "rejected" | "withdrawn";
  requestedBy: string;
  requestedAt: string;
  reviewedBy?: string;
  reviewedAt?: string;
  reviewerComment?: string;
};

type Stats = {
  pending: number;
  approved: number;
  rejected: number;
  withdrawn: number;
  amountPending: number;
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

function formatEur(value: number, compact = false) {
  if (compact && Math.abs(value) >= 1000) {
    return `${(value / 1000).toFixed(value % 1000 === 0 ? 0 : 1).replace(/\.0$/, "")} k€`;
  }
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(value);
}

export default function ApprovalsPage() {
  const router = useRouter();
  const [approvals, setApprovals] = useState<Approval[] | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [filter, setFilter] = useState<"pending" | "all">("pending");
  const [acting, setActing] = useState<string | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  const load = useCallback(async () => {
    const url =
      filter === "pending"
        ? "/api/admin/approvals?status=pending"
        : "/api/admin/approvals";
    const res = await fetch(url, { cache: "no-store" });
    if (res.status === 401) {
      router.replace("/admin/login");
      return;
    }
    if (res.ok) {
      const d = await res.json();
      setApprovals(d.approvals ?? []);
      setStats(d.stats);
    }
  }, [filter, router]);

  useEffect(() => {
    load();
    const i = setInterval(load, 30_000);
    return () => clearInterval(i);
  }, [load]);

  const approve = async (id: string) => {
    setActing(id);
    try {
      await fetch(`/api/admin/approvals/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ decision: "approved" }),
      });
      await load();
    } finally {
      setActing(null);
    }
  };

  const reject = async () => {
    if (!rejectingId || !rejectReason.trim()) return;
    setActing(rejectingId);
    try {
      await fetch(`/api/admin/approvals/${rejectingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ decision: "rejected", comment: rejectReason }),
      });
      setRejectingId(null);
      setRejectReason("");
      await load();
    } finally {
      setActing(null);
    }
  };

  return (
    <div className="min-h-screen bg-cream py-10 lg:py-14">
      <div className="container max-w-5xl">
        <Link
          href="/admin/leads"
          className="inline-flex items-center gap-2 text-sm font-mono uppercase tracking-eyebrow text-graphite hover:text-copper transition-colors mb-6"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Retour pipeline
        </Link>

        <div className="mb-8">
          <h1 className="font-display text-display-md text-ink">
            Validations devis
          </h1>
          <p className="mt-2 text-graphite">
            Demandes de validation avant envoi client. Tout admin peut approuver
            ou rejeter. Traçabilité complète dans l&apos;activity log.
          </p>
        </div>

        {stats && (
          <div className="grid lg:grid-cols-4 gap-4 mb-8">
            <Kpi
              icon={<Clock className="h-4 w-4 text-copper" />}
              label="En attente"
              value={String(stats.pending)}
              hint={formatEur(stats.amountPending, true)}
              accent="copper"
            />
            <Kpi
              icon={<CheckCircle2 className="h-4 w-4 text-[#22a06b]" />}
              label="Approuvées"
              value={String(stats.approved)}
              accent="success"
            />
            <Kpi
              icon={<XIcon className="h-4 w-4 text-ember" />}
              label="Rejetées"
              value={String(stats.rejected)}
            />
            <Kpi
              icon={<ShieldCheck className="h-4 w-4 text-muted" />}
              label="Retirées"
              value={String(stats.withdrawn)}
            />
          </div>
        )}

        <div className="flex items-center gap-2 mb-4">
          <button
            onClick={() => setFilter("pending")}
            className={cn(
              "px-3 py-1.5 rounded-full text-sm transition-colors",
              filter === "pending"
                ? "bg-ink text-cream"
                : "bg-white border border-ink/10 text-graphite hover:border-copper/40",
            )}
          >
            En attente
          </button>
          <button
            onClick={() => setFilter("all")}
            className={cn(
              "px-3 py-1.5 rounded-full text-sm transition-colors",
              filter === "all"
                ? "bg-ink text-cream"
                : "bg-white border border-ink/10 text-graphite hover:border-copper/40",
            )}
          >
            Historique complet
          </button>
        </div>

        {approvals === null ? (
          <div className="py-16 text-center text-muted">
            <Loader2 className="h-6 w-6 animate-spin mx-auto" />
          </div>
        ) : approvals.length === 0 ? (
          <div className="rounded-2xl border border-ink/10 bg-white shadow-soft py-16 text-center text-muted">
            <ShieldCheck className="h-12 w-12 mx-auto opacity-20 text-copper mb-2" />
            <p>
              {filter === "pending"
                ? "Aucune validation en attente."
                : "Aucune demande de validation."}
            </p>
          </div>
        ) : (
          <ul className="grid gap-3">
            {approvals.map((a) => (
              <li
                key={a.id}
                className="rounded-2xl border border-ink/10 bg-white shadow-soft p-5"
              >
                <div className="flex items-start gap-3 mb-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Link
                        href={`/admin/leads/${a.leadReference}`}
                        className="text-sm font-medium text-ink hover:text-copper font-mono"
                      >
                        {a.leadReference}
                      </Link>
                      {a.quoteNumber && (
                        <span className="text-xs text-graphite">
                          · devis {a.quoteNumber}
                        </span>
                      )}
                      <span
                        className="px-2 py-0.5 rounded-full text-[10px] font-mono uppercase tracking-eyebrow"
                        style={{
                          background: `${STATUS_COLORS[a.status]}1c`,
                          color: STATUS_COLORS[a.status],
                        }}
                      >
                        {STATUS_LABELS[a.status]}
                      </span>
                    </div>
                    <div className="font-display text-2xl text-ink tabular-nums mt-1">
                      {formatEur(a.amountTtc)}
                    </div>
                    {a.notes && (
                      <div className="mt-2 p-2.5 rounded-xl bg-cream/40 border border-ink/8 text-xs text-graphite italic">
                        Demande : « {a.notes} »
                      </div>
                    )}
                    {a.reviewerComment && (
                      <div className="mt-2 p-2.5 rounded-xl bg-cream/40 border border-ink/8 text-xs text-graphite italic">
                        Commentaire : « {a.reviewerComment} »
                      </div>
                    )}
                    <div className="text-[10px] text-muted mt-2 font-mono">
                      Demandée par {a.requestedBy} ·{" "}
                      {new Date(a.requestedAt).toLocaleString("fr-FR")}
                      {a.reviewedBy && (
                        <>
                          {" · "}
                          {a.status === "approved" ? "approuvée" : "traitée"} par{" "}
                          {a.reviewedBy} ·{" "}
                          {new Date(a.reviewedAt!).toLocaleString("fr-FR")}
                        </>
                      )}
                    </div>
                  </div>
                </div>
                {a.status === "pending" && (
                  <div className="pt-3 border-t border-ink/8 flex items-center gap-2 flex-wrap">
                    <button
                      onClick={() => approve(a.id)}
                      disabled={acting === a.id}
                      className="inline-flex items-center gap-1.5 rounded-full bg-[#22a06b] text-cream px-3 py-1.5 text-xs hover:opacity-90 disabled:opacity-50"
                    >
                      {acting === a.id ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <CheckCircle2 className="h-3 w-3" />
                      )}
                      Approuver
                    </button>
                    <button
                      onClick={() => setRejectingId(a.id)}
                      disabled={acting === a.id}
                      className="inline-flex items-center gap-1.5 rounded-full bg-white border border-ember/40 text-ember px-3 py-1.5 text-xs hover:bg-ember/10 disabled:opacity-50"
                    >
                      <XIcon className="h-3 w-3" />
                      Rejeter
                    </button>
                    <Link
                      href={`/admin/leads/${a.leadReference}/quote`}
                      className="ml-auto inline-flex items-center gap-1 text-xs text-copper hover:underline"
                    >
                      Ouvrir le devis
                      <ArrowRight className="h-3 w-3" />
                    </Link>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Modal rejet */}
      {rejectingId && (
        <div className="fixed inset-0 z-50 bg-charcoal/50 backdrop-blur-sm grid place-items-center p-4">
          <div className="bg-white rounded-2xl border border-ember/30 max-w-md w-full p-6">
            <h3 className="font-display text-lg text-ink mb-3">
              Motif du rejet
            </h3>
            <textarea
              rows={4}
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Expliquez la raison du rejet — utile au demandeur pour ajuster…"
              className="w-full bg-cream border border-ink/12 rounded-xl px-4 py-3 text-sm focus:border-copper focus:outline-none resize-none mb-4"
              autoFocus
            />
            <div className="flex items-center gap-2 justify-end">
              <button
                onClick={() => {
                  setRejectingId(null);
                  setRejectReason("");
                }}
                className="text-sm text-graphite hover:text-ink"
              >
                Annuler
              </button>
              <button
                onClick={reject}
                disabled={acting !== null || !rejectReason.trim()}
                className="inline-flex items-center gap-1.5 rounded-full bg-ember text-cream px-4 py-2 text-sm hover:opacity-90 disabled:opacity-50"
              >
                {acting === rejectingId ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <XIcon className="h-3.5 w-3.5" />
                )}
                Confirmer le rejet
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Kpi({
  icon,
  label,
  value,
  hint,
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  hint?: string;
  accent?: "copper" | "success";
}) {
  return (
    <div className="rounded-2xl border border-ink/10 bg-white shadow-soft p-5">
      <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-eyebrow text-muted">
        {icon}
        {label}
      </div>
      <div
        className={`mt-2 font-display text-3xl tabular-nums ${
          accent === "copper"
            ? "text-copper"
            : accent === "success"
            ? "text-[#22a06b]"
            : "text-ink"
        }`}
      >
        {value}
      </div>
      {hint && <div className="text-xs text-muted mt-1">{hint}</div>}
    </div>
  );
}
