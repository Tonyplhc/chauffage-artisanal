"use client";

/**
 * Liste globale des factures + stats.
 */

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Loader2,
  FileText,
  CheckCircle2,
  Clock,
  XCircle,
  ArrowRight,
} from "lucide-react";

type Invoice = {
  id: string;
  number: string;
  leadReference: string;
  clientName: string;
  status: "draft" | "sent" | "paid" | "void";
  issueDate: string;
  dueDate?: string;
  paidAt?: string;
  lines: { quantity: number; unitPrice: number }[];
  tvaRate: number;
};

type Stats = {
  total: number;
  draft: number;
  sent: number;
  paid: number;
  void: number;
  amountPaid: number;
  amountOutstanding: number;
};

function formatEur(v: number, compact = false) {
  if (compact && Math.abs(v) >= 1000) {
    if (Math.abs(v) >= 1_000_000)
      return `${(v / 1_000_000).toFixed(1).replace(/\.0$/, "")} M€`;
    return `${(v / 1000).toFixed(v % 1000 === 0 ? 0 : 1).replace(/\.0$/, "")} k€`;
  }
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(v);
}

function computeTtc(inv: Invoice) {
  const ht = inv.lines.reduce((s, l) => s + l.quantity * l.unitPrice, 0);
  return ht * (1 + inv.tvaRate / 100);
}

const STATUS_LABELS = {
  draft: "Brouillon",
  sent: "Envoyée",
  paid: "Payée",
  void: "Annulée",
};

const STATUS_COLORS = {
  draft: "#8b847a",
  sent: "#b86a36",
  paid: "#22a06b",
  void: "#dc5a28",
};

export default function InvoicesPage() {
  const router = useRouter();
  const [invoices, setInvoices] = useState<Invoice[] | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);

  const load = useCallback(async () => {
    const res = await fetch("/api/admin/invoices", { cache: "no-store" });
    if (res.status === 401) {
      router.replace("/admin/login");
      return;
    }
    if (res.ok) {
      const d = await res.json();
      setInvoices(d.invoices ?? []);
      setStats(d.stats);
    }
  }, [router]);

  useEffect(() => {
    load();
    const i = setInterval(load, 60_000);
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
          <h1 className="font-display text-display-md text-ink">Factures</h1>
          <p className="mt-2 text-graphite">
            Numérotation séquentielle annuelle{" "}
            <code className="font-mono text-xs">FAC-AAAA-NNNN</code>.
            Génération à partir d&apos;un devis accepté en 1 clic depuis la
            fiche du lead.
          </p>
        </div>

        {stats && (
          <div className="grid lg:grid-cols-4 gap-4 mb-8">
            <Kpi
              icon={<FileText className="h-4 w-4" />}
              label="Total"
              value={String(stats.total)}
              hint={`${stats.draft} brouillon${stats.draft > 1 ? "s" : ""}`}
            />
            <Kpi
              icon={<Clock className="h-4 w-4 text-copper" />}
              label="Envoyées"
              value={String(stats.sent)}
              hint={formatEur(stats.amountOutstanding, true)}
              accent="copper"
            />
            <Kpi
              icon={<CheckCircle2 className="h-4 w-4 text-[#22a06b]" />}
              label="Payées"
              value={String(stats.paid)}
              hint={formatEur(stats.amountPaid, true)}
              accent="success"
            />
            <Kpi
              icon={<XCircle className="h-4 w-4 text-muted" />}
              label="Annulées"
              value={String(stats.void)}
            />
          </div>
        )}

        <div className="rounded-2xl border border-ink/10 bg-white shadow-soft overflow-hidden">
          <div className="px-5 py-3 border-b border-ink/8 bg-cream/40 font-mono text-[10px] uppercase tracking-eyebrow text-copper">
            Toutes les factures ({invoices?.length ?? 0})
          </div>
          {invoices === null ? (
            <div className="py-12 text-center text-muted">
              <Loader2 className="h-5 w-5 animate-spin mx-auto" />
            </div>
          ) : invoices.length === 0 ? (
            <div className="py-16 text-center text-muted">
              <FileText className="h-12 w-12 mx-auto opacity-20 text-copper mb-2" />
              <p>Aucune facture émise pour l&apos;instant.</p>
              <p className="text-xs mt-1">
                Depuis la fiche d&apos;un lead converti → bouton « Émettre
                facture ».
              </p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-cream/30 text-left text-graphite">
                  <th className="px-5 py-2.5 font-mono text-[10px] uppercase tracking-eyebrow">
                    Numéro
                  </th>
                  <th className="px-3 py-2.5 font-mono text-[10px] uppercase tracking-eyebrow">
                    Client
                  </th>
                  <th className="px-3 py-2.5 font-mono text-[10px] uppercase tracking-eyebrow text-right">
                    Émise le
                  </th>
                  <th className="px-3 py-2.5 font-mono text-[10px] uppercase tracking-eyebrow">
                    Statut
                  </th>
                  <th className="px-5 py-2.5 font-mono text-[10px] uppercase tracking-eyebrow text-right">
                    TTC
                  </th>
                  <th />
                </tr>
              </thead>
              <tbody className="divide-y divide-ink/5">
                {invoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-cream/40 group">
                    <td className="px-5 py-3 font-mono text-ink">
                      {inv.number}
                    </td>
                    <td className="px-3 py-3 text-ink truncate max-w-xs">
                      {inv.clientName}
                      <div className="font-mono text-[10px] text-muted">
                        {inv.leadReference}
                      </div>
                    </td>
                    <td className="px-3 py-3 text-right text-xs text-graphite">
                      {new Date(inv.issueDate).toLocaleDateString("fr-FR", {
                        dateStyle: "short",
                      })}
                    </td>
                    <td className="px-3 py-3">
                      <span
                        className="px-2 py-0.5 rounded-full text-[10px] font-mono uppercase tracking-eyebrow"
                        style={{
                          background: `${STATUS_COLORS[inv.status]}1c`,
                          color: STATUS_COLORS[inv.status],
                        }}
                      >
                        {STATUS_LABELS[inv.status]}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right font-mono text-ink tabular-nums">
                      {formatEur(computeTtc(inv))}
                    </td>
                    <td className="pr-3 py-3">
                      <Link
                        href={`/admin/invoices/${inv.id}`}
                        className="opacity-0 group-hover:opacity-100 transition-opacity inline-flex items-center"
                      >
                        <ArrowRight className="h-3.5 w-3.5 text-copper" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
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
