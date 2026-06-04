"use client";

/**
 * Bons de commande fournisseurs — liste + création.
 *
 * Création minimaliste : sélection fournisseur, ajout de lignes, calcul total
 * automatique. Imprimable via print CSS.
 */

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  Loader2,
  Trash2,
  FileText,
  Send,
  Package,
} from "lucide-react";
import {
  AdminPageShell,
  KpiCard,
  SectionCard,
  EmptyState,
  CenteredLoader,
} from "@/components/admin/ui-kit";
import { formatEur, formatDateShort } from "@/lib/formatters";

type Line = {
  reference: string;
  description: string;
  quantity: number;
  unitPriceHt: number;
};

type Order = {
  id: string;
  number: string;
  supplierName: string;
  supplierId: string;
  leadReference?: string;
  lines: Line[];
  totalHt: number;
  totalTtc: number;
  status: "draft" | "sent" | "received-partial" | "received-full" | "cancelled";
  expectedDeliveryAt?: string;
  createdAt: string;
};

type Supplier = { id: string; name: string };

const STATUS_LABEL: Record<Order["status"], { label: string; color: string }> = {
  draft: { label: "Brouillon", color: "#8b847a" },
  sent: { label: "Envoyé", color: "#b86a36" },
  "received-partial": { label: "Reçu partiel", color: "#6ba3c5" },
  "received-full": { label: "Reçu complet", color: "#22a06b" },
  cancelled: { label: "Annulé", color: "#dc5a28" },
};

const EMPTY_LINE: Line = {
  reference: "",
  description: "",
  quantity: 1,
  unitPriceHt: 0,
};

export default function PurchaseOrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [creating, setCreating] = useState(false);
  const [supplierId, setSupplierId] = useState("");
  const [supplierName, setSupplierName] = useState("");
  const [leadRef, setLeadRef] = useState("");
  const [lines, setLines] = useState<Line[]>([{ ...EMPTY_LINE }]);
  const [delivery, setDelivery] = useState("");
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const [oRes, sRes] = await Promise.all([
      fetch("/api/admin/purchase-orders", { cache: "no-store" }),
      fetch("/api/admin/suppliers", { cache: "no-store" }),
    ]);
    if (oRes.status === 401) {
      router.replace("/admin/login");
      return;
    }
    if (oRes.ok) {
      const d = await oRes.json();
      setOrders(d.orders ?? []);
    } else {
      setOrders([]);
    }
    if (sRes.ok) {
      const d = await sRes.json();
      setSuppliers(d.suppliers ?? d ?? []);
    }
  }, [router]);

  useEffect(() => {
    load();
  }, [load]);

  const totalHt = lines.reduce((s, l) => s + l.quantity * l.unitPriceHt, 0);

  const submit = async () => {
    if (!supplierId || lines.length === 0) return;
    setBusy(true);
    try {
      const res = await fetch("/api/admin/purchase-orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          supplierId,
          supplierName,
          leadReference: leadRef || undefined,
          lines: lines.filter((l) => l.reference.trim() && l.quantity > 0),
          expectedDeliveryAt: delivery || undefined,
          notes,
        }),
      });
      if (res.ok) {
        setCreating(false);
        setLines([{ ...EMPTY_LINE }]);
        setSupplierId("");
        setSupplierName("");
        setLeadRef("");
        setDelivery("");
        setNotes("");
        await load();
      }
    } finally {
      setBusy(false);
    }
  };

  const totalOpen = (orders ?? []).filter(
    (o) => o.status !== "received-full" && o.status !== "cancelled",
  ).length;
  const totalAmount = (orders ?? []).reduce((s, o) => s + o.totalHt, 0);

  return (
    <AdminPageShell
      title="Bons de commande"
      description="Commandes fournisseurs avec numérotation BC-YYYY-NNNN, suivi statut et impression."
      actions={
        <button
          onClick={() => setCreating((c) => !c)}
          className="inline-flex items-center gap-2 bg-ink text-cream px-4 py-2 rounded-full text-sm hover:bg-copper transition-colors"
        >
          <Plus className="h-4 w-4" />
          Nouveau BC
        </button>
      }
    >
      <div className="grid lg:grid-cols-3 gap-4 mb-6">
        <KpiCard label="BC total" value={String(orders?.length ?? 0)} />
        <KpiCard
          label="BC ouverts"
          value={String(totalOpen)}
          hint="non clôturés"
          color={totalOpen > 0 ? "#b86a36" : undefined}
        />
        <KpiCard
          label="Montant total HT"
          value={formatEur(totalAmount, true)}
          hint="tous statuts"
        />
      </div>

      {creating && (
        <div className="rounded-2xl border border-ink/10 bg-white shadow-soft p-5 mb-6">
          <div className="font-mono text-[10px] uppercase tracking-eyebrow text-copper mb-3">
            Nouveau bon de commande
          </div>
          <div className="grid lg:grid-cols-2 gap-3 mb-3">
            <div>
              <div className="text-xs text-graphite mb-1">Fournisseur *</div>
              <select
                value={supplierId}
                onChange={(e) => {
                  const id = e.target.value;
                  setSupplierId(id);
                  setSupplierName(
                    suppliers.find((s) => s.id === id)?.name ?? "",
                  );
                }}
                className="w-full bg-cream border border-ink/12 rounded-lg px-3 py-2 text-sm focus:border-copper focus:outline-none"
              >
                <option value="">Choisir…</option>
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <div className="text-xs text-graphite mb-1">Référence lead (optionnel)</div>
              <input
                value={leadRef}
                onChange={(e) => setLeadRef(e.target.value)}
                placeholder="DEV-YYYY-NNNN"
                className="w-full bg-cream border border-ink/12 rounded-lg px-3 py-2 text-sm font-mono focus:border-copper focus:outline-none"
              />
            </div>
          </div>

          <div className="mb-3">
            <div className="text-xs text-graphite mb-1">Lignes</div>
            <div className="rounded-xl bg-cream/40 p-3 space-y-2">
              {lines.map((l, i) => (
                <div key={i} className="grid grid-cols-12 gap-2 items-center">
                  <input
                    value={l.reference}
                    onChange={(e) => {
                      const next = [...lines];
                      next[i] = { ...next[i], reference: e.target.value };
                      setLines(next);
                    }}
                    placeholder="Réf."
                    className="col-span-2 bg-white border border-ink/12 rounded-md px-2 py-1 text-xs font-mono"
                  />
                  <input
                    value={l.description}
                    onChange={(e) => {
                      const next = [...lines];
                      next[i] = { ...next[i], description: e.target.value };
                      setLines(next);
                    }}
                    placeholder="Description"
                    className="col-span-5 bg-white border border-ink/12 rounded-md px-2 py-1 text-xs"
                  />
                  <input
                    type="number"
                    value={l.quantity}
                    onChange={(e) => {
                      const next = [...lines];
                      next[i] = { ...next[i], quantity: Number(e.target.value) || 0 };
                      setLines(next);
                    }}
                    className="col-span-1 bg-white border border-ink/12 rounded-md px-2 py-1 text-xs text-right tabular-nums"
                  />
                  <input
                    type="number"
                    step="0.01"
                    value={l.unitPriceHt}
                    onChange={(e) => {
                      const next = [...lines];
                      next[i] = { ...next[i], unitPriceHt: Number(e.target.value) || 0 };
                      setLines(next);
                    }}
                    className="col-span-2 bg-white border border-ink/12 rounded-md px-2 py-1 text-xs text-right tabular-nums"
                  />
                  <div className="col-span-1 text-xs text-right font-mono tabular-nums">
                    {formatEur(l.quantity * l.unitPriceHt, true)}
                  </div>
                  <button
                    onClick={() =>
                      setLines(lines.length > 1 ? lines.filter((_, j) => j !== i) : lines)
                    }
                    disabled={lines.length === 1}
                    className="col-span-1 text-graphite hover:text-ember disabled:opacity-30"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              ))}
              <button
                onClick={() => setLines([...lines, { ...EMPTY_LINE }])}
                className="text-xs text-copper hover:underline inline-flex items-center gap-1"
              >
                <Plus className="h-3 w-3" />
                Ajouter ligne
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-3 text-xs">
            <div>
              <div className="text-graphite mb-1">Livraison prévue</div>
              <input
                type="date"
                value={delivery}
                onChange={(e) => setDelivery(e.target.value)}
                className="w-full bg-cream border border-ink/12 rounded-md px-2 py-1"
              />
            </div>
            <div className="text-right self-end">
              <span className="text-graphite mr-2">Total HT :</span>
              <span className="font-mono font-medium text-ink tabular-nums">
                {formatEur(totalHt)}
              </span>
            </div>
          </div>

          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            placeholder="Notes (instructions livraison, contact…)"
            className="w-full bg-cream border border-ink/12 rounded-md px-3 py-2 text-xs mb-3 focus:border-copper focus:outline-none"
          />

          <div className="flex items-center justify-end gap-2">
            <button
              onClick={() => setCreating(false)}
              className="text-xs text-graphite hover:text-copper px-3 py-1.5"
            >
              Annuler
            </button>
            <button
              onClick={submit}
              disabled={!supplierId || busy}
              className="inline-flex items-center gap-2 bg-ink text-cream rounded-full px-4 py-2 text-sm hover:bg-copper transition-colors disabled:opacity-50"
            >
              {busy ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Send className="h-3.5 w-3.5" />
              )}
              Créer le BC
            </button>
          </div>
        </div>
      )}

      <SectionCard icon={FileText} eyebrow="Bons de commande">
        {orders === null ? (
          <CenteredLoader />
        ) : orders.length === 0 ? (
          <EmptyState
            icon={Package}
            title="Aucun bon de commande"
            body="Créez votre premier BC pour commencer le suivi des approvisionnements."
          />
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-cream/30 text-left text-graphite text-xs">
                <th className="px-5 py-2.5 font-mono uppercase tracking-eyebrow">N°</th>
                <th className="px-3 py-2.5 font-mono uppercase tracking-eyebrow">Fournisseur</th>
                <th className="px-3 py-2.5 font-mono uppercase tracking-eyebrow text-right">Lignes</th>
                <th className="px-3 py-2.5 font-mono uppercase tracking-eyebrow text-right">Total HT</th>
                <th className="px-3 py-2.5 font-mono uppercase tracking-eyebrow">Statut</th>
                <th className="px-5 py-2.5 font-mono uppercase tracking-eyebrow">Créé</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink/5">
              {orders.map((o) => {
                const st = STATUS_LABEL[o.status];
                return (
                  <tr key={o.id} className="hover:bg-cream/30">
                    <td className="px-5 py-3 font-mono text-ink">{o.number}</td>
                    <td className="px-3 py-3 text-ink">{o.supplierName}</td>
                    <td className="px-3 py-3 text-right font-mono text-graphite tabular-nums">
                      {o.lines.length}
                    </td>
                    <td className="px-3 py-3 text-right font-mono text-ink tabular-nums">
                      {formatEur(o.totalHt, true)}
                    </td>
                    <td className="px-3 py-3">
                      <span
                        className="font-mono text-[10px] uppercase tracking-eyebrow px-2 py-0.5 rounded-full"
                        style={{ background: `${st.color}15`, color: st.color }}
                      >
                        {st.label}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-xs text-muted">
                      {formatDateShort(o.createdAt)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </SectionCard>

      <p className="mt-4 text-xs text-muted">
        Numérotation séquentielle BC-AAAA-NNNN par année. TVA 17 % Lux par
        défaut. Suivi statut manuel ; impression et envoi PDF dans une
        itération ultérieure.
      </p>
    </AdminPageShell>
  );
}
