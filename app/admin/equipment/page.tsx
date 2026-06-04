"use client";

/**
 * Liste des équipements installés — vue admin.
 *
 * Fix : la route `/admin/equipment` renvoyait 404 (seuls les sous-dossiers
 * existaient). Cette page liste tous les équipements avec leur statut.
 */

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Package, ArrowRight, Wrench, CheckCircle2, XCircle } from "lucide-react";
import {
  AdminPageShell,
  KpiCard,
  SectionCard,
  EmptyState,
  CenteredLoader,
} from "@/components/admin/ui-kit";
import { formatDateShort } from "@/lib/formatters";

type Equipment = {
  id: string;
  leadReference: string;
  type: string;
  brand: string;
  model: string;
  serialNumber?: string;
  power?: string;
  installedAt?: string;
  warrantyExpiresAt?: string;
  location?: string;
  status: "operational" | "maintenance" | "decommissioned";
  createdAt: string;
};

const STATUS_COLOR: Record<Equipment["status"], string> = {
  operational: "#22a06b",
  maintenance: "#b86a36",
  decommissioned: "#8b847a",
};

const STATUS_LABEL: Record<Equipment["status"], string> = {
  operational: "Opérationnel",
  maintenance: "En entretien",
  decommissioned: "Retiré",
};

const TYPE_LABEL: Record<string, string> = {
  chaudiere_gaz: "Chaudière gaz",
  chaudiere_fioul: "Chaudière fioul",
  chaudiere_biomasse: "Chaudière biomasse",
  pac_air_eau: "PAC air/eau",
  pac_geothermique: "PAC géothermique",
  pac_air_air: "PAC air/air",
  climatisation: "Climatisation",
  solaire_thermique: "Solaire thermique",
  photovoltaique: "Photovoltaïque",
  ventilation: "VMC",
  autre: "Autre",
};

export default function EquipmentListPage() {
  const router = useRouter();
  const [items, setItems] = useState<Equipment[] | null>(null);

  const load = useCallback(async () => {
    const res = await fetch("/api/admin/equipment", { cache: "no-store" });
    if (res.status === 401) {
      router.replace("/admin/login");
      return;
    }
    if (res.ok) {
      const d = await res.json();
      setItems(d.equipment ?? d.items ?? []);
    } else {
      setItems([]);
    }
  }, [router]);

  useEffect(() => {
    load();
  }, [load]);

  const stats = {
    total: items?.length ?? 0,
    operational: items?.filter((i) => i.status === "operational").length ?? 0,
    maintenance: items?.filter((i) => i.status === "maintenance").length ?? 0,
    decommissioned:
      items?.filter((i) => i.status === "decommissioned").length ?? 0,
  };

  return (
    <AdminPageShell
      title="Équipements installés"
      description="Registre de tous les équipements installés chez vos clients : marque, modèle, n° série, garantie, statut."
    >
      <div className="grid lg:grid-cols-4 gap-4 mb-6">
        <KpiCard label="Total" value={String(stats.total)} />
        <KpiCard
          label="Opérationnels"
          value={String(stats.operational)}
          color="#22a06b"
        />
        <KpiCard
          label="En entretien"
          value={String(stats.maintenance)}
          color={stats.maintenance > 0 ? "#b86a36" : undefined}
        />
        <KpiCard
          label="Retirés"
          value={String(stats.decommissioned)}
        />
      </div>

      <SectionCard icon={Package} eyebrow="Liste des équipements">
        {items === null ? (
          <CenteredLoader />
        ) : items.length === 0 ? (
          <EmptyState
            icon={Wrench}
            title="Aucun équipement enregistré"
            body="Les équipements sont créés depuis une fiche lead converti (bloc « Équipements »)."
            ctaLabel="Voir le pipeline"
            ctaHref="/admin/leads"
          />
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-cream/30 text-left text-graphite text-xs">
                <th className="px-5 py-2.5 font-mono uppercase tracking-eyebrow">Lead</th>
                <th className="px-3 py-2.5 font-mono uppercase tracking-eyebrow">Type</th>
                <th className="px-3 py-2.5 font-mono uppercase tracking-eyebrow">Marque / Modèle</th>
                <th className="px-3 py-2.5 font-mono uppercase tracking-eyebrow">N° série</th>
                <th className="px-3 py-2.5 font-mono uppercase tracking-eyebrow">Installé</th>
                <th className="px-3 py-2.5 font-mono uppercase tracking-eyebrow">Garantie</th>
                <th className="px-3 py-2.5 font-mono uppercase tracking-eyebrow">Statut</th>
                <th className="px-5 py-2.5 font-mono uppercase tracking-eyebrow text-right">Détail</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink/5">
              {items.map((e) => (
                <tr key={e.id} className="hover:bg-cream/30">
                  <td className="px-5 py-3 font-mono text-xs text-ink">
                    <Link
                      href={`/admin/leads/${e.leadReference}`}
                      className="hover:text-copper"
                    >
                      {e.leadReference}
                    </Link>
                  </td>
                  <td className="px-3 py-3 text-xs text-graphite">
                    {TYPE_LABEL[e.type] ?? e.type}
                  </td>
                  <td className="px-3 py-3 text-ink text-sm">
                    {e.brand} <span className="text-muted">{e.model}</span>
                    {e.power && (
                      <span className="ml-1.5 text-[10px] text-copper font-mono">
                        {e.power}
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-3 font-mono text-xs text-graphite">
                    {e.serialNumber ?? "—"}
                  </td>
                  <td className="px-3 py-3 text-xs text-graphite">
                    {e.installedAt ? formatDateShort(e.installedAt) : "—"}
                  </td>
                  <td className="px-3 py-3 text-xs text-graphite">
                    {e.warrantyExpiresAt
                      ? formatDateShort(e.warrantyExpiresAt)
                      : "—"}
                  </td>
                  <td className="px-3 py-3">
                    <span
                      className="font-mono text-[10px] uppercase tracking-eyebrow px-2 py-0.5 rounded-full inline-flex items-center gap-1"
                      style={{
                        background: `${STATUS_COLOR[e.status]}15`,
                        color: STATUS_COLOR[e.status],
                      }}
                    >
                      {e.status === "operational" && (
                        <CheckCircle2 className="h-2.5 w-2.5" />
                      )}
                      {e.status === "decommissioned" && (
                        <XCircle className="h-2.5 w-2.5" />
                      )}
                      {STATUS_LABEL[e.status]}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-right">
                    <Link
                      href={`/admin/equipment/${e.id}`}
                      className="inline-flex items-center gap-1 text-xs text-copper hover:underline"
                    >
                      Détail
                      <ArrowRight className="h-3 w-3" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </SectionCard>
    </AdminPageShell>
  );
}
