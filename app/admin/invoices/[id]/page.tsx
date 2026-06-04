"use client";

/**
 * Visualisation / édition d'une facture.
 *
 * Layout imprimable (CSS @media print). Bouton "Imprimer / PDF" en bas.
 * Édition inline des champs avec save unique.
 */

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import {
  ArrowLeft,
  Loader2,
  Save,
  Printer,
  Send,
  CheckCircle2,
  Plus,
  Trash2,
  XCircle,
} from "lucide-react";

type Line = {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  unit: string;
};

type Invoice = {
  id: string;
  number: string;
  leadReference: string;
  quoteNumber?: string;
  clientName: string;
  clientEmail?: string;
  clientAddress?: string;
  status: "draft" | "sent" | "paid" | "void";
  issueDate: string;
  dueDate?: string;
  paidAt?: string;
  sentAt?: string;
  lines: Line[];
  tvaRate: number;
  notes?: string;
};

type Brand = {
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  vatNumber?: string;
  rcsNumber?: string;
  ibanMasked?: string;
};

type Totals = { htAmount: number; tvaAmount: number; ttcAmount: number };

function formatEur(v: number) {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 2,
  }).format(v);
}

export default function InvoiceDetailPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [brand, setBrand] = useState<Brand | null>(null);
  const [totals, setTotals] = useState<Totals | null>(null);
  const [dirty, setDirty] = useState(false);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const res = await fetch(`/api/admin/invoices/${params.id}`, {
      cache: "no-store",
    });
    if (res.status === 401) {
      router.replace("/admin/login");
      return;
    }
    if (res.ok) {
      const d = await res.json();
      setInvoice(d.invoice);
      setBrand(d.brand);
      setTotals(d.totals);
      setDirty(false);
    }
  }, [params.id, router]);

  useEffect(() => {
    load();
  }, [load]);

  const save = async (patch?: Partial<Invoice>) => {
    if (!invoice) return;
    setBusy(true);
    try {
      const body = patch ?? {
        clientName: invoice.clientName,
        clientEmail: invoice.clientEmail,
        clientAddress: invoice.clientAddress,
        lines: invoice.lines,
        tvaRate: invoice.tvaRate,
        notes: invoice.notes,
        dueDate: invoice.dueDate,
      };
      const res = await fetch(`/api/admin/invoices/${params.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        await load();
      }
    } finally {
      setBusy(false);
    }
  };

  const update = (patch: Partial<Invoice>) => {
    if (!invoice) return;
    setInvoice({ ...invoice, ...patch });
    setDirty(true);
  };

  const updateLine = (id: string, patch: Partial<Line>) => {
    if (!invoice) return;
    update({
      lines: invoice.lines.map((l) => (l.id === id ? { ...l, ...patch } : l)),
    });
  };

  const addLine = () => {
    if (!invoice) return;
    update({
      lines: [
        ...invoice.lines,
        {
          id: `tmp-${Date.now()}`,
          description: "",
          quantity: 1,
          unitPrice: 0,
          unit: "forfait",
        },
      ],
    });
  };

  const removeLine = (id: string) => {
    if (!invoice) return;
    update({ lines: invoice.lines.filter((l) => l.id !== id) });
  };

  if (!invoice || !brand || !totals) {
    return (
      <div className="min-h-screen bg-cream grid place-items-center">
        <Loader2 className="h-6 w-6 animate-spin text-copper" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream py-10 lg:py-14">
      <div className="container max-w-4xl">
        <div className="flex items-center justify-between gap-3 mb-6 print:hidden">
          <Link
            href="/admin/invoices"
            className="inline-flex items-center gap-2 text-sm font-mono uppercase tracking-eyebrow text-graphite hover:text-copper"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Retour aux factures
          </Link>
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => save()}
              disabled={busy || !dirty}
              className="inline-flex items-center gap-1.5 rounded-full bg-ink text-cream px-4 py-2 text-sm hover:bg-copper disabled:opacity-40"
            >
              {busy ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Save className="h-3.5 w-3.5" />
              )}
              Enregistrer
            </button>
            {invoice.status === "draft" && (
              <button
                onClick={() => save({ status: "sent" })}
                disabled={busy}
                className="inline-flex items-center gap-1.5 rounded-full bg-copper text-cream px-4 py-2 text-sm hover:bg-ink"
              >
                <Send className="h-3.5 w-3.5" />
                Marquer envoyée
              </button>
            )}
            {invoice.status === "sent" && (
              <button
                onClick={() => save({ status: "paid" })}
                disabled={busy}
                className="inline-flex items-center gap-1.5 rounded-full bg-[#22a06b] text-cream px-4 py-2 text-sm hover:opacity-90"
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
                Marquer payée
              </button>
            )}
            <button
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 rounded-full bg-white border border-ink/15 px-4 py-2 text-sm hover:border-copper/40"
            >
              <Printer className="h-3.5 w-3.5" />
              Imprimer / PDF
            </button>
            {invoice.status !== "void" && (
              <button
                onClick={() => save({ status: "void" })}
                disabled={busy}
                className="inline-flex items-center gap-1.5 rounded-full bg-white border border-ember/30 text-ember px-4 py-2 text-sm hover:bg-ember/10"
              >
                <XCircle className="h-3.5 w-3.5" />
                Annuler
              </button>
            )}
          </div>
        </div>

        {/* Document */}
        <div className="bg-white rounded-3xl border border-ink/10 shadow-soft p-8 lg:p-12 print:shadow-none print:border-0 print:rounded-none print:p-0">
          {/* Header */}
          <div className="grid lg:grid-cols-2 gap-6 mb-8 pb-6 border-b border-ink/8">
            <div>
              <div className="font-display text-3xl text-ink">
                {brand.name}
              </div>
              <div className="mt-2 text-xs text-graphite leading-relaxed font-mono">
                {brand.address && <div>{brand.address}</div>}
                {brand.phone && <div>Tél : {brand.phone}</div>}
                {brand.email && <div>{brand.email}</div>}
                {brand.vatNumber && <div>TVA : {brand.vatNumber}</div>}
                {brand.rcsNumber && <div>RCS : {brand.rcsNumber}</div>}
              </div>
            </div>
            <div className="text-right">
              <div className="font-mono text-[10px] uppercase tracking-eyebrow text-copper">
                Facture
              </div>
              <div className="font-display text-3xl text-ink font-mono tabular-nums">
                {invoice.number}
              </div>
              <div className="mt-3 text-xs text-graphite">
                Émise le{" "}
                <strong className="text-ink">
                  {new Date(invoice.issueDate).toLocaleDateString("fr-FR", {
                    dateStyle: "long",
                  })}
                </strong>
              </div>
              <label className="block mt-2 text-xs text-graphite print:hidden">
                Échéance :{" "}
                <input
                  type="date"
                  value={invoice.dueDate?.slice(0, 10) ?? ""}
                  onChange={(e) =>
                    update({
                      dueDate: e.target.value
                        ? new Date(e.target.value).toISOString()
                        : undefined,
                    })
                  }
                  className="bg-cream border border-ink/12 rounded-md px-2 py-0.5 text-xs"
                />
              </label>
              {invoice.dueDate && (
                <div className="text-xs text-graphite print:block hidden">
                  Échéance :{" "}
                  <strong>
                    {new Date(invoice.dueDate).toLocaleDateString("fr-FR", {
                      dateStyle: "long",
                    })}
                  </strong>
                </div>
              )}
              {invoice.quoteNumber && (
                <div className="text-xs text-muted mt-1">
                  Référence devis : {invoice.quoteNumber}
                </div>
              )}
            </div>
          </div>

          {/* Client */}
          <div className="mb-8">
            <div className="font-mono text-[10px] uppercase tracking-eyebrow text-copper mb-2">
              Facturé à
            </div>
            <input
              value={invoice.clientName}
              onChange={(e) => update({ clientName: e.target.value })}
              placeholder="Nom du client"
              className="w-full font-display text-xl text-ink bg-transparent focus:outline-none print:pointer-events-none"
            />
            <input
              value={invoice.clientEmail ?? ""}
              onChange={(e) => update({ clientEmail: e.target.value })}
              placeholder="Email"
              className="mt-1 w-full text-sm text-graphite bg-transparent focus:outline-none print:pointer-events-none"
            />
            <textarea
              rows={2}
              value={invoice.clientAddress ?? ""}
              onChange={(e) => update({ clientAddress: e.target.value })}
              placeholder="Adresse de facturation"
              className="mt-1 w-full text-sm text-graphite bg-transparent resize-none focus:outline-none print:pointer-events-none"
            />
          </div>

          {/* Lignes */}
          <table className="w-full mb-6 text-sm">
            <thead>
              <tr className="border-y border-ink/15 text-left">
                <th className="py-2 font-mono text-[10px] uppercase tracking-eyebrow text-graphite">
                  Désignation
                </th>
                <th className="py-2 font-mono text-[10px] uppercase tracking-eyebrow text-graphite text-right w-20">
                  Qté
                </th>
                <th className="py-2 font-mono text-[10px] uppercase tracking-eyebrow text-graphite text-right w-20">
                  Unité
                </th>
                <th className="py-2 font-mono text-[10px] uppercase tracking-eyebrow text-graphite text-right w-28">
                  PU HT
                </th>
                <th className="py-2 font-mono text-[10px] uppercase tracking-eyebrow text-graphite text-right w-28">
                  Total HT
                </th>
                <th className="w-8 print:hidden" />
              </tr>
            </thead>
            <tbody>
              {invoice.lines.map((l) => (
                <tr key={l.id} className="border-b border-ink/5">
                  <td className="py-1.5 pr-2">
                    <input
                      value={l.description}
                      onChange={(e) =>
                        updateLine(l.id, { description: e.target.value })
                      }
                      className="w-full bg-transparent text-ink focus:outline-none print:pointer-events-none"
                    />
                  </td>
                  <td className="py-1.5 pr-2">
                    <input
                      type="number"
                      value={l.quantity}
                      onChange={(e) =>
                        updateLine(l.id, { quantity: Number(e.target.value) })
                      }
                      className="w-full text-right bg-transparent font-mono focus:outline-none print:pointer-events-none"
                    />
                  </td>
                  <td className="py-1.5 pr-2">
                    <input
                      value={l.unit}
                      onChange={(e) =>
                        updateLine(l.id, { unit: e.target.value })
                      }
                      className="w-full text-right bg-transparent text-xs font-mono focus:outline-none print:pointer-events-none"
                    />
                  </td>
                  <td className="py-1.5 pr-2">
                    <input
                      type="number"
                      value={l.unitPrice}
                      onChange={(e) =>
                        updateLine(l.id, { unitPrice: Number(e.target.value) })
                      }
                      className="w-full text-right bg-transparent font-mono focus:outline-none print:pointer-events-none"
                    />
                  </td>
                  <td className="py-1.5 pr-2 text-right font-mono text-ink tabular-nums">
                    {formatEur(l.quantity * l.unitPrice)}
                  </td>
                  <td className="py-1.5 pl-1 print:hidden">
                    <button
                      onClick={() => removeLine(l.id)}
                      className="h-5 w-5 grid place-items-center rounded-full bg-cream border border-ember/30 text-ember hover:bg-ember hover:text-cream"
                    >
                      <Trash2 className="h-2.5 w-2.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <button
            onClick={addLine}
            className="mb-6 inline-flex items-center gap-1.5 text-xs text-copper hover:underline print:hidden"
          >
            <Plus className="h-3 w-3" />
            Ajouter une ligne
          </button>

          {/* Totaux */}
          <div className="flex justify-end mb-8">
            <div className="w-full lg:w-80 grid gap-2 text-sm">
              <div className="flex justify-between">
                <span className="text-graphite">Total HT</span>
                <span className="font-mono tabular-nums text-ink">
                  {formatEur(totals.htAmount)}
                </span>
              </div>
              <div className="flex items-baseline justify-between">
                <span className="text-graphite">
                  TVA{" "}
                  <input
                    type="number"
                    value={invoice.tvaRate}
                    step={0.5}
                    onChange={(e) =>
                      update({ tvaRate: Number(e.target.value) })
                    }
                    className="w-12 bg-transparent border-b border-ink/12 text-center font-mono focus:outline-none focus:border-copper print:border-0 print:pointer-events-none"
                  />
                  %
                </span>
                <span className="font-mono tabular-nums text-ink">
                  {formatEur(totals.tvaAmount)}
                </span>
              </div>
              <div className="flex justify-between pt-2 border-t-2 border-ink">
                <span className="font-display text-ink">Total TTC</span>
                <span className="font-display text-xl tabular-nums text-copper">
                  {formatEur(totals.ttcAmount)}
                </span>
              </div>
            </div>
          </div>

          {/* Notes */}
          <textarea
            rows={3}
            value={invoice.notes ?? ""}
            onChange={(e) => update({ notes: e.target.value })}
            placeholder="Notes / conditions de règlement…"
            className="w-full bg-cream/50 border border-ink/12 rounded-xl p-3 text-sm focus:border-copper focus:outline-none resize-none mb-6 print:bg-transparent print:border-0 print:p-0 print:pointer-events-none"
          />

          {/* Mentions légales */}
          <div className="pt-6 border-t border-ink/8 text-[10px] text-muted leading-relaxed font-mono">
            {brand.ibanMasked && <div>IBAN : {brand.ibanMasked}</div>}
            <div className="mt-1">
              En cas de retard de paiement, des intérêts moratoires au taux
              légal seront appliqués, ainsi qu&apos;une indemnité forfaitaire
              pour frais de recouvrement (loi luxembourgeoise sur les retards
              de paiement).
            </div>
          </div>
        </div>
      </div>

      <style jsx global>{`
        @media print {
          body {
            background: white !important;
          }
        }
      `}</style>
    </div>
  );
}
