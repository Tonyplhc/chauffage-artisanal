"use client";

/**
 * Gestion garantie / SAV — liste claims + KPIs + nouvelle déclaration.
 */

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  ShieldCheck,
  Plus,
  Loader2,
  AlertTriangle,
  Wrench,
} from "lucide-react";
import {
  AdminPageShell,
  KpiCard,
  SectionCard,
  EmptyState,
  CenteredLoader,
} from "@/components/admin/ui-kit";
import { formatDateShort } from "@/lib/formatters";

type Claim = {
  id: string;
  number: string;
  clientName: string;
  equipmentDescription: string;
  symptom: string;
  status:
    | "ouvert"
    | "en-attente-constructeur"
    | "piece-commandee"
    | "piece-recue"
    | "intervention-planifiee"
    | "resolu"
    | "refuse";
  warrantyExpiresAt?: string;
  createdAt: string;
};

const STATUS_COLOR: Record<Claim["status"], string> = {
  ouvert: "#dc5a28",
  "en-attente-constructeur": "#b86a36",
  "piece-commandee": "#6ba3c5",
  "piece-recue": "#22a06b",
  "intervention-planifiee": "#b86a36",
  resolu: "#22a06b",
  refuse: "#8b847a",
};

const STATUS_LABEL: Record<Claim["status"], string> = {
  ouvert: "Ouvert",
  "en-attente-constructeur": "Attente constructeur",
  "piece-commandee": "Pièce commandée",
  "piece-recue": "Pièce reçue",
  "intervention-planifiee": "Intervention planifiée",
  resolu: "Résolu",
  refuse: "Refusé",
};

type Stats = {
  total: number;
  open: number;
  waitingParts: number;
  expiringSoon: number;
};

export default function WarrantyPage() {
  const router = useRouter();
  const [data, setData] = useState<{ claims: Claim[]; stats: Stats } | null>(
    null,
  );
  const [creating, setCreating] = useState(false);
  const [clientName, setClientName] = useState("");
  const [equipment, setEquipment] = useState("");
  const [symptom, setSymptom] = useState("");
  const [warrantyExpiresAt, setWarrantyExpiresAt] = useState("");
  const [leadRef, setLeadRef] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const res = await fetch("/api/admin/warranty", { cache: "no-store" });
    if (res.status === 401) {
      router.replace("/admin/login");
      return;
    }
    if (res.ok) setData(await res.json());
  }, [router]);

  useEffect(() => {
    load();
  }, [load]);

  const submit = async () => {
    if (!clientName.trim() || !equipment.trim() || !symptom.trim()) return;
    setBusy(true);
    try {
      const res = await fetch("/api/admin/warranty", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          equipmentRef: equipment,
          equipmentDescription: equipment,
          clientName,
          symptom,
          warrantyExpiresAt: warrantyExpiresAt || undefined,
          leadReference: leadRef || undefined,
        }),
      });
      if (res.ok) {
        setCreating(false);
        setClientName("");
        setEquipment("");
        setSymptom("");
        setWarrantyExpiresAt("");
        setLeadRef("");
        await load();
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <AdminPageShell
      title="Garantie & SAV"
      description="Suivi des déclarations de sinistre, prise en charge constructeur, pièces commandées et échéances de garantie."
      actions={
        <button
          onClick={() => setCreating((c) => !c)}
          className="inline-flex items-center gap-2 bg-ink text-cream px-4 py-2 rounded-full text-sm hover:bg-copper transition-colors"
        >
          <Plus className="h-4 w-4" />
          Nouvelle déclaration
        </button>
      }
    >
      <div className="grid lg:grid-cols-4 gap-4 mb-6">
        <KpiCard label="Dossiers total" value={String(data?.stats.total ?? 0)} />
        <KpiCard
          label="En cours"
          value={String(data?.stats.open ?? 0)}
          color={data?.stats.open ? "#dc5a28" : undefined}
        />
        <KpiCard
          label="Pièces en attente"
          value={String(data?.stats.waitingParts ?? 0)}
          color={data?.stats.waitingParts ? "#6ba3c5" : undefined}
        />
        <KpiCard
          label="Garanties <90 j"
          value={String(data?.stats.expiringSoon ?? 0)}
          hint="Opportunité extension"
          color={data?.stats.expiringSoon ? "#b86a36" : undefined}
        />
      </div>

      {creating && (
        <div className="rounded-2xl border border-ink/10 bg-white shadow-soft p-5 mb-6">
          <div className="font-mono text-[10px] uppercase tracking-eyebrow text-copper mb-3">
            Nouvelle déclaration SAV
          </div>
          <div className="grid lg:grid-cols-2 gap-3">
            <input
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              placeholder="Nom client *"
              className="bg-cream border border-ink/12 rounded-lg px-3 py-2 text-sm focus:border-copper focus:outline-none"
            />
            <input
              value={leadRef}
              onChange={(e) => setLeadRef(e.target.value)}
              placeholder="Référence lead (optionnel)"
              className="bg-cream border border-ink/12 rounded-lg px-3 py-2 text-sm font-mono focus:border-copper focus:outline-none"
            />
            <input
              value={equipment}
              onChange={(e) => setEquipment(e.target.value)}
              placeholder="Équipement (marque, modèle, n° série) *"
              className="bg-cream border border-ink/12 rounded-lg px-3 py-2 text-sm focus:border-copper focus:outline-none lg:col-span-2"
            />
            <input
              type="date"
              value={warrantyExpiresAt}
              onChange={(e) => setWarrantyExpiresAt(e.target.value)}
              placeholder="Fin garantie"
              className="bg-cream border border-ink/12 rounded-lg px-3 py-2 text-sm focus:border-copper focus:outline-none"
            />
          </div>
          <textarea
            rows={3}
            value={symptom}
            onChange={(e) => setSymptom(e.target.value)}
            placeholder="Symptôme déclaré par le client *"
            className="mt-3 w-full bg-cream border border-ink/12 rounded-lg px-3 py-2 text-sm focus:border-copper focus:outline-none"
          />
          <div className="mt-3 flex justify-end gap-2">
            <button
              onClick={() => setCreating(false)}
              className="text-xs text-graphite hover:text-copper px-3 py-1.5"
            >
              Annuler
            </button>
            <button
              onClick={submit}
              disabled={
                !clientName.trim() || !equipment.trim() || !symptom.trim() || busy
              }
              className="inline-flex items-center gap-2 bg-ink text-cream rounded-full px-4 py-2 text-sm hover:bg-copper transition-colors disabled:opacity-50"
            >
              {busy && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              Ouvrir le dossier
            </button>
          </div>
        </div>
      )}

      <SectionCard icon={ShieldCheck} eyebrow="Dossiers SAV">
        {data === null ? (
          <CenteredLoader />
        ) : data.claims.length === 0 ? (
          <EmptyState
            icon={Wrench}
            title="Aucun dossier SAV"
            body="Les déclarations apparaîtront ici. Bouton 'Nouvelle déclaration' pour ouvrir un dossier."
          />
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-cream/30 text-left text-graphite text-xs">
                <th className="px-5 py-2.5 font-mono uppercase tracking-eyebrow">N°</th>
                <th className="px-3 py-2.5 font-mono uppercase tracking-eyebrow">Client</th>
                <th className="px-3 py-2.5 font-mono uppercase tracking-eyebrow">Équipement</th>
                <th className="px-3 py-2.5 font-mono uppercase tracking-eyebrow">Statut</th>
                <th className="px-3 py-2.5 font-mono uppercase tracking-eyebrow">Fin garantie</th>
                <th className="px-5 py-2.5 font-mono uppercase tracking-eyebrow">Ouvert</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink/5">
              {data.claims.map((c) => (
                <tr key={c.id} className="hover:bg-cream/30">
                  <td className="px-5 py-3 font-mono text-ink">{c.number}</td>
                  <td className="px-3 py-3 text-ink">{c.clientName}</td>
                  <td className="px-3 py-3 text-xs text-graphite max-w-xs truncate">
                    {c.equipmentDescription}
                  </td>
                  <td className="px-3 py-3">
                    <span
                      className="font-mono text-[10px] uppercase tracking-eyebrow px-2 py-0.5 rounded-full"
                      style={{
                        background: `${STATUS_COLOR[c.status]}15`,
                        color: STATUS_COLOR[c.status],
                      }}
                    >
                      {STATUS_LABEL[c.status]}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-xs text-graphite">
                    {c.warrantyExpiresAt ? (
                      formatDateShort(c.warrantyExpiresAt)
                    ) : (
                      <span className="text-muted">—</span>
                    )}
                  </td>
                  <td className="px-5 py-3 text-xs text-muted">
                    {formatDateShort(c.createdAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </SectionCard>

      {data && data.stats.expiringSoon > 0 && (
        <div className="mt-4 rounded-xl border border-copper/30 bg-copper/5 px-4 py-3 text-sm text-graphite inline-flex items-start gap-2 w-full">
          <AlertTriangle className="h-4 w-4 text-copper mt-0.5" />
          <span>
            {data.stats.expiringSoon} garantie(s) expirent dans moins de 90
            jours — opportunité de proposer une extension de garantie ou un
            contrat d&apos;entretien.
          </span>
        </div>
      )}
    </AdminPageShell>
  );
}
