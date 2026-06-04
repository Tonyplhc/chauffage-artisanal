"use client";

/**
 * Bons d'intervention — liste + bouton créer.
 *
 * Pour l'impression / signature détaillée d'un BI, le tech ouvre la fiche
 * dédiée (route à venir). En V1, on offre la création rapide + liste.
 */

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ClipboardCheck, Printer, FileText } from "lucide-react";
import {
  AdminPageShell,
  KpiCard,
  SectionCard,
  EmptyState,
  CenteredLoader,
} from "@/components/admin/ui-kit";
import { formatDateShort } from "@/lib/formatters";

type Order = {
  id: string;
  number: string;
  leadReference?: string;
  clientName: string;
  technicianName: string;
  status: "draft" | "signed" | "invoiced" | "cancelled";
  interventionAt: string;
  signedAt?: string;
  createdAt: string;
};

const STATUS_COLOR: Record<Order["status"], string> = {
  draft: "#8b847a",
  signed: "#22a06b",
  invoiced: "#6ba3c5",
  cancelled: "#dc5a28",
};

const STATUS_LABEL: Record<Order["status"], string> = {
  draft: "Brouillon",
  signed: "Signé",
  invoiced: "Facturé",
  cancelled: "Annulé",
};

export default function ServiceOrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[] | null>(null);

  const load = useCallback(async () => {
    const res = await fetch("/api/admin/service-orders", {
      cache: "no-store",
    });
    if (res.status === 401) {
      router.replace("/admin/login");
      return;
    }
    if (res.ok) {
      const d = await res.json();
      setOrders(d.orders ?? []);
    } else {
      setOrders([]);
    }
  }, [router]);

  useEffect(() => {
    load();
  }, [load]);

  const signedCount = (orders ?? []).filter((o) => o.status === "signed").length;

  return (
    <AdminPageShell
      title="Bons d'intervention"
      description="Documents terrain pré-remplis depuis les fiches lead, signables par le client puis archivés."
    >
      <div className="grid lg:grid-cols-3 gap-4 mb-6">
        <KpiCard label="BI total" value={String(orders?.length ?? 0)} />
        <KpiCard
          label="Signés"
          value={String(signedCount)}
          color="#22a06b"
        />
        <KpiCard
          label="En brouillon"
          value={String((orders ?? []).filter((o) => o.status === "draft").length)}
          color="#b86a36"
        />
      </div>

      <SectionCard icon={FileText} eyebrow="Liste des bons d'intervention">
        {orders === null ? (
          <CenteredLoader />
        ) : orders.length === 0 ? (
          <EmptyState
            icon={ClipboardCheck}
            title="Aucun bon d'intervention"
            body="Créez un BI depuis une fiche lead pour pré-remplir automatiquement client, équipement et historique."
          />
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-cream/30 text-left text-graphite text-xs">
                <th className="px-5 py-2.5 font-mono uppercase tracking-eyebrow">N°</th>
                <th className="px-3 py-2.5 font-mono uppercase tracking-eyebrow">Client</th>
                <th className="px-3 py-2.5 font-mono uppercase tracking-eyebrow">Technicien</th>
                <th className="px-3 py-2.5 font-mono uppercase tracking-eyebrow">Date intervention</th>
                <th className="px-3 py-2.5 font-mono uppercase tracking-eyebrow">Statut</th>
                <th className="px-5 py-2.5 font-mono uppercase tracking-eyebrow text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink/5">
              {orders.map((o) => (
                <tr key={o.id} className="hover:bg-cream/30">
                  <td className="px-5 py-3 font-mono text-ink">{o.number}</td>
                  <td className="px-3 py-3 text-ink">{o.clientName}</td>
                  <td className="px-3 py-3 text-graphite text-xs">
                    {o.technicianName}
                  </td>
                  <td className="px-3 py-3 text-xs text-graphite">
                    {formatDateShort(o.interventionAt)}
                  </td>
                  <td className="px-3 py-3">
                    <span
                      className="font-mono text-[10px] uppercase tracking-eyebrow px-2 py-0.5 rounded-full"
                      style={{
                        background: `${STATUS_COLOR[o.status]}15`,
                        color: STATUS_COLOR[o.status],
                      }}
                    >
                      {STATUS_LABEL[o.status]}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-right">
                    <button
                      onClick={() => window.print()}
                      className="text-xs text-copper hover:underline inline-flex items-center gap-1"
                    >
                      <Printer className="h-3 w-3" />
                      Imprimer
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </SectionCard>

      <p className="mt-4 text-xs text-muted">
        En V1, la création se fait depuis une fiche lead via le bouton « Créer
        un BI ». L&apos;impression respecte le format A4 avec en-tête marque,
        identité du client, lignes prestations, observations et zone signature.
      </p>
    </AdminPageShell>
  );
}
