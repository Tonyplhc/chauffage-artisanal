"use client";

/**
 * Dashboard global des paiements d'acompte.
 */

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Loader2,
  CreditCard,
  CheckCircle2,
  Clock,
  Euro,
  XCircle,
  ArrowRight,
} from "lucide-react";

type Payment = {
  id: string;
  leadReference: string;
  amountCents: number;
  description: string;
  status: "pending" | "completed" | "canceled" | "expired";
  createdAt: string;
  paidAt?: string;
  paymentUrl: string;
  mode: "live" | "demo";
};

type Stats = {
  total: number;
  pending: number;
  completed: number;
  canceled: number;
  amountReceived: number;
  amountPending: number;
};

function formatEur(value: number, compact = false) {
  if (compact && Math.abs(value) >= 1000) {
    if (Math.abs(value) >= 1_000_000)
      return `${(value / 1_000_000).toFixed(1).replace(/\.0$/, "")} M€`;
    return `${(value / 1000).toFixed(value % 1000 === 0 ? 0 : 1).replace(/\.0$/, "")} k€`;
  }
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(value);
}

export default function PaymentsAdminPage() {
  const router = useRouter();
  const [payments, setPayments] = useState<Payment[] | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);

  const load = useCallback(async () => {
    const res = await fetch("/api/admin/payments", { cache: "no-store" });
    if (res.status === 401) {
      router.replace("/admin/login");
      return;
    }
    if (res.ok) {
      const d = await res.json();
      setPayments(d.payments ?? []);
      setStats(d.stats);
    }
  }, [router]);

  useEffect(() => {
    load();
    const i = setInterval(load, 30_000);
    return () => clearInterval(i);
  }, [load]);

  return (
    <div className="min-h-screen bg-cream py-10 lg:py-14">
      <div className="container max-w-6xl">
        <Link
          href="/admin/leads"
          className="inline-flex items-center gap-2 text-sm font-mono uppercase tracking-eyebrow text-graphite hover:text-copper transition-colors mb-6"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Retour pipeline
        </Link>

        <div className="mb-8">
          <h1 className="font-display text-display-md text-ink">
            Paiements d&apos;acompte
          </h1>
          <p className="mt-2 text-graphite">
            Liens de paiement créés sur les dossiers. Mode{" "}
            <strong>live</strong> = Stripe Checkout. Mode{" "}
            <strong>démo</strong> = simulation interne (clés Stripe absentes).
          </p>
        </div>

        {stats && (
          <div className="grid lg:grid-cols-4 gap-4 mb-8">
            <Kpi
              icon={<CreditCard className="h-4 w-4" />}
              label="Total"
              value={String(stats.total)}
            />
            <Kpi
              icon={<Clock className="h-4 w-4 text-copper" />}
              label="En attente"
              value={String(stats.pending)}
              hint={formatEur(stats.amountPending, true)}
              accent="copper"
            />
            <Kpi
              icon={<CheckCircle2 className="h-4 w-4 text-[#22a06b]" />}
              label="Réglés"
              value={String(stats.completed)}
              hint={formatEur(stats.amountReceived, true)}
              accent="success"
            />
            <Kpi
              icon={<XCircle className="h-4 w-4 text-muted" />}
              label="Annulés"
              value={String(stats.canceled)}
            />
          </div>
        )}

        <div className="rounded-2xl border border-ink/10 bg-white shadow-soft overflow-hidden">
          <div className="px-5 py-3 border-b border-ink/8 bg-cream/40 font-mono text-[10px] uppercase tracking-eyebrow text-copper">
            Activité paiements
          </div>
          {payments === null ? (
            <div className="py-12 text-center text-muted">
              <Loader2 className="h-5 w-5 animate-spin mx-auto" />
            </div>
          ) : payments.length === 0 ? (
            <div className="py-16 text-center text-muted">
              <Euro className="h-12 w-12 mx-auto opacity-20 text-copper mb-2" />
              <p>Aucun paiement créé pour l&apos;instant.</p>
            </div>
          ) : (
            <ul className="divide-y divide-ink/8">
              {payments.map((p) => (
                <li key={p.id}>
                  <Link
                    href={`/admin/leads/${p.leadReference}`}
                    className="flex items-center gap-3 px-5 py-3 hover:bg-cream/40 transition-colors group"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-base tabular-nums text-ink">
                          {formatEur(p.amountCents / 100)}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-mono uppercase tracking-eyebrow ${
                            p.status === "completed"
                              ? "bg-[#22a06b]/10 text-[#22a06b]"
                              : p.status === "pending"
                              ? "bg-copper/10 text-copper"
                              : "bg-muted/10 text-muted"
                          }`}
                        >
                          {p.status}
                        </span>
                        <span className="text-[10px] font-mono uppercase tracking-eyebrow text-graphite bg-cream border border-ink/8 px-2 py-0.5 rounded-full">
                          {p.mode}
                        </span>
                      </div>
                      <div className="text-xs text-graphite mt-0.5 truncate">
                        {p.description}
                      </div>
                      <div className="text-[10px] text-muted mt-0.5 font-mono">
                        {p.leadReference} ·{" "}
                        {new Date(p.createdAt).toLocaleString("fr-FR")}
                      </div>
                    </div>
                    <ArrowRight className="h-3.5 w-3.5 text-muted opacity-0 group-hover:opacity-100 transition-opacity" />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>

        <p className="mt-4 text-xs text-muted">
          Configuration prod : définir <code>STRIPE_SECRET_KEY</code> et{" "}
          <code>STRIPE_WEBHOOK_SECRET</code> dans l&apos;environnement, puis
          enregistrer l&apos;URL <code>/api/payments/stripe-webhook</code>
          dans le dashboard Stripe.
        </p>
      </div>
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
