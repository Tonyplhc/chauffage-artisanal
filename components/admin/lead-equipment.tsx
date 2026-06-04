"use client";

/**
 * Bloc registre des équipements installés sur un lead converti.
 */

import { useEffect, useState, useCallback } from "react";
import {
  Cpu,
  Loader2,
  Plus,
  Check,
  Trash2,
  Edit2,
  Calendar,
  ShieldCheck,
  X as XIcon,
  QrCode,
} from "lucide-react";
import { cn } from "@/lib/utils";

type Equipment = {
  id: string;
  leadReference: string;
  type:
    | "chaudiere"
    | "pac"
    | "ballon"
    | "clim"
    | "vmc"
    | "solaire"
    | "regulation"
    | "autre";
  brand: string;
  model: string;
  serialNumber?: string;
  power?: string;
  installedAt?: string;
  warrantyExpiresAt?: string;
  location?: string;
  manualUrl?: string;
  notes?: string;
  status: "operational" | "maintenance" | "decommissioned";
};

const TYPE_LABELS = {
  chaudiere: "Chaudière",
  pac: "PAC",
  ballon: "Ballon thermo",
  clim: "Climatisation",
  vmc: "VMC",
  solaire: "Solaire",
  regulation: "Régulation",
  autre: "Autre",
};

export function LeadEquipmentBlock({ reference }: { reference: string }) {
  const [equipment, setEquipment] = useState<Equipment[] | null>(null);
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState<Partial<Equipment>>({
    type: "chaudiere",
    brand: "",
    model: "",
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const res = await fetch(`/api/admin/leads/${reference}/equipment`, {
      cache: "no-store",
    });
    if (res.ok) {
      const d = await res.json();
      setEquipment(d.equipment ?? []);
    }
  }, [reference]);

  useEffect(() => {
    load();
  }, [load]);

  const save = async () => {
    if (!draft.brand?.trim() || !draft.model?.trim()) {
      setError("Marque et modèle requis");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const url = editing
        ? `/api/admin/equipment/${editing}`
        : `/api/admin/leads/${reference}/equipment`;
      const method = editing ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(draft),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error ?? "Erreur");
      setCreating(false);
      setEditing(null);
      setDraft({ type: "chaudiere", brand: "", model: "" });
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setBusy(false);
    }
  };

  const startEdit = (e: Equipment) => {
    setDraft(e);
    setEditing(e.id);
    setCreating(false);
    setError(null);
  };

  const remove = async (id: string) => {
    if (!confirm("Supprimer cet équipement ?")) return;
    await fetch(`/api/admin/equipment/${id}`, { method: "DELETE" });
    await load();
  };

  return (
    <div className="rounded-2xl border border-ink/10 bg-white shadow-soft p-5">
      <div className="flex items-center gap-2 mb-3">
        <Cpu className="h-4 w-4 text-copper" />
        <span className="font-mono text-[10px] uppercase tracking-eyebrow text-copper">
          Équipements installés
        </span>
        {equipment && equipment.length > 0 && (
          <span className="ml-auto font-mono text-xs text-muted">
            {equipment.length}
          </span>
        )}
      </div>

      {equipment === null ? (
        <Loader2 className="h-4 w-4 animate-spin text-muted" />
      ) : equipment.length === 0 && !creating ? (
        <p className="text-xs text-graphite mb-3">
          Aucun équipement enregistré. Utile pour SAV et extension future.
        </p>
      ) : (
        <ul className="grid gap-2 mb-3">
          {equipment.map((e) => {
            const warrantyOk =
              e.warrantyExpiresAt &&
              new Date(e.warrantyExpiresAt).getTime() > Date.now();
            return (
              <li
                key={e.id}
                className="p-3 rounded-xl bg-cream border border-ink/8"
              >
                <div className="flex items-start gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium text-ink">
                        {e.brand} · {e.model}
                      </span>
                      <span className="text-[10px] font-mono uppercase tracking-eyebrow text-graphite bg-white border border-ink/8 px-2 py-0.5 rounded-full">
                        {TYPE_LABELS[e.type]}
                      </span>
                      {e.power && (
                        <span className="text-[10px] font-mono text-copper">
                          {e.power}
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-muted font-mono mt-0.5 flex items-center gap-2 flex-wrap">
                      {e.serialNumber && (
                        <span>SN : {e.serialNumber}</span>
                      )}
                      {e.location && <span>· {e.location}</span>}
                    </div>
                    <div className="text-[11px] text-graphite mt-1 flex items-center gap-3 flex-wrap">
                      {e.installedAt && (
                        <span className="inline-flex items-center gap-0.5">
                          <Calendar className="h-2.5 w-2.5" />
                          Posé le{" "}
                          {new Date(e.installedAt).toLocaleDateString(
                            "fr-FR",
                            { dateStyle: "medium" },
                          )}
                        </span>
                      )}
                      {e.warrantyExpiresAt && (
                        <span
                          className={cn(
                            "inline-flex items-center gap-0.5",
                            warrantyOk ? "text-[#22a06b]" : "text-ember",
                          )}
                        >
                          <ShieldCheck className="h-2.5 w-2.5" />
                          Garantie{" "}
                          {warrantyOk ? "jusqu'au" : "expirée"}{" "}
                          {new Date(e.warrantyExpiresAt).toLocaleDateString(
                            "fr-FR",
                            { dateStyle: "short" },
                          )}
                        </span>
                      )}
                    </div>
                    {e.notes && (
                      <div className="mt-2 text-[11px] text-graphite p-2 rounded-lg bg-white border border-ink/5">
                        {e.notes}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <a
                      href={`/admin/equipment/${e.id}/qr`}
                      target="_blank"
                      rel="noreferrer"
                      className="h-6 w-6 grid place-items-center rounded-full bg-white border border-ink/8 text-graphite hover:bg-ink hover:text-cream"
                      title="QR code SAV"
                    >
                      <QrCode className="h-3 w-3" />
                    </a>
                    <button
                      onClick={() => startEdit(e)}
                      className="h-6 w-6 grid place-items-center rounded-full bg-white border border-ink/8 text-graphite hover:bg-ink hover:text-cream"
                      title="Modifier"
                    >
                      <Edit2 className="h-3 w-3" />
                    </button>
                    <button
                      onClick={() => remove(e.id)}
                      className="h-6 w-6 grid place-items-center rounded-full bg-white border border-ember/30 text-ember hover:bg-ember hover:text-cream"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {error && <div className="text-xs text-ember mb-2">{error}</div>}

      {!creating && !editing ? (
        <button
          onClick={() => {
            setCreating(true);
            setDraft({ type: "chaudiere", brand: "", model: "" });
          }}
          className="inline-flex items-center gap-1.5 text-xs text-copper hover:underline"
        >
          <Plus className="h-3 w-3" />
          Ajouter un équipement
        </button>
      ) : (
        <div className="grid gap-2 border-t border-ink/8 pt-3">
          <div className="grid grid-cols-2 gap-2">
            <select
              value={draft.type ?? "chaudiere"}
              onChange={(e) =>
                setDraft({ ...draft, type: e.target.value as Equipment["type"] })
              }
              className="bg-cream border border-ink/12 rounded-xl px-3 py-2 text-sm focus:border-copper focus:outline-none"
            >
              {(Object.entries(TYPE_LABELS) as [Equipment["type"], string][]).map(
                ([k, label]) => (
                  <option key={k} value={k}>
                    {label}
                  </option>
                ),
              )}
            </select>
            <input
              value={draft.power ?? ""}
              onChange={(e) => setDraft({ ...draft, power: e.target.value })}
              placeholder="Puissance (ex : 24 kW)"
              className="bg-cream border border-ink/12 rounded-xl px-3 py-2 text-sm focus:border-copper focus:outline-none"
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <input
              value={draft.brand ?? ""}
              onChange={(e) => setDraft({ ...draft, brand: e.target.value })}
              placeholder="Marque"
              className="bg-cream border border-ink/12 rounded-xl px-3 py-2 text-sm focus:border-copper focus:outline-none"
              autoFocus
            />
            <input
              value={draft.model ?? ""}
              onChange={(e) => setDraft({ ...draft, model: e.target.value })}
              placeholder="Modèle"
              className="bg-cream border border-ink/12 rounded-xl px-3 py-2 text-sm focus:border-copper focus:outline-none"
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <input
              value={draft.serialNumber ?? ""}
              onChange={(e) =>
                setDraft({ ...draft, serialNumber: e.target.value })
              }
              placeholder="Numéro de série"
              className="bg-cream border border-ink/12 rounded-xl px-3 py-2 text-xs font-mono focus:border-copper focus:outline-none"
            />
            <input
              value={draft.location ?? ""}
              onChange={(e) => setDraft({ ...draft, location: e.target.value })}
              placeholder="Emplacement (cave, toit…)"
              className="bg-cream border border-ink/12 rounded-xl px-3 py-2 text-sm focus:border-copper focus:outline-none"
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <label className="text-[11px] text-graphite">
              Date de pose
              <input
                type="date"
                value={draft.installedAt?.slice(0, 10) ?? ""}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    installedAt: e.target.value
                      ? new Date(e.target.value).toISOString()
                      : undefined,
                  })
                }
                className="mt-1 w-full bg-cream border border-ink/12 rounded-xl px-2 py-1.5 text-sm focus:border-copper focus:outline-none"
              />
            </label>
            <label className="text-[11px] text-graphite">
              Fin de garantie
              <input
                type="date"
                value={draft.warrantyExpiresAt?.slice(0, 10) ?? ""}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    warrantyExpiresAt: e.target.value
                      ? new Date(e.target.value).toISOString()
                      : undefined,
                  })
                }
                className="mt-1 w-full bg-cream border border-ink/12 rounded-xl px-2 py-1.5 text-sm focus:border-copper focus:outline-none"
              />
            </label>
          </div>
          <textarea
            rows={2}
            value={draft.notes ?? ""}
            onChange={(e) => setDraft({ ...draft, notes: e.target.value })}
            placeholder="Notes (réglages spécifiques, accessoires…)"
            className="bg-cream border border-ink/12 rounded-xl px-3 py-2 text-sm focus:border-copper focus:outline-none resize-none"
          />
          <div className="flex items-center gap-2">
            <button
              onClick={save}
              disabled={busy}
              className="inline-flex items-center gap-1.5 rounded-full bg-ink text-cream px-3 py-1.5 text-xs hover:bg-copper disabled:opacity-50"
            >
              {busy ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <Check className="h-3 w-3" />
              )}
              {editing ? "Enregistrer" : "Ajouter"}
            </button>
            <button
              onClick={() => {
                setCreating(false);
                setEditing(null);
                setDraft({ type: "chaudiere", brand: "", model: "" });
                setError(null);
              }}
              className="inline-flex items-center gap-1 text-xs text-graphite hover:text-ink"
            >
              <XIcon className="h-3 w-3" />
              Annuler
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
