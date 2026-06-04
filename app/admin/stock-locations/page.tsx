"use client";

/**
 * Stock multi-localisations — vue agrégée + création location.
 *
 * Affiche pour chaque article son stock par localisation, permet de créer
 * de nouvelles locations (atelier, camion, dépôt) et consulter les mouvements
 * récents.
 */

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Plus, Truck, Warehouse, MapPin, Package, Loader2 } from "lucide-react";
import {
  AdminPageShell,
  KpiCard,
  SectionCard,
  EmptyState,
  CenteredLoader,
} from "@/components/admin/ui-kit";

type Location = {
  id: string;
  name: string;
  type: "atelier" | "camion" | "depot" | "autre";
  ownerTechName?: string;
  notes?: string;
  inventory: Record<string, number>;
  updatedAt: string;
};

type Summary = {
  articleRef: string;
  total: number;
  byLocation: { locationId: string; locationName: string; qty: number }[];
};

const TYPE_ICON = {
  atelier: Warehouse,
  camion: Truck,
  depot: MapPin,
  autre: Package,
};

const TYPE_LABEL = {
  atelier: "Atelier",
  camion: "Camion",
  depot: "Dépôt",
  autre: "Autre",
};

export default function StockLocationsPage() {
  const router = useRouter();
  const [data, setData] = useState<{
    locations: Location[];
    summary: Summary[];
  } | null>(null);
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const [type, setType] = useState<Location["type"]>("camion");
  const [owner, setOwner] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const res = await fetch("/api/admin/stock-locations", {
      cache: "no-store",
    });
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
    if (!name.trim()) return;
    setBusy(true);
    try {
      const res = await fetch("/api/admin/stock-locations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          type,
          ownerTechName: owner || undefined,
        }),
      });
      if (res.ok) {
        setCreating(false);
        setName("");
        setOwner("");
        await load();
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <AdminPageShell
      title="Stock multi-localisations"
      description="Vision unifiée du stock sur l'atelier, les camions techniciens et les dépôts secondaires."
      actions={
        <button
          onClick={() => setCreating((c) => !c)}
          className="inline-flex items-center gap-2 bg-ink text-cream px-4 py-2 rounded-full text-sm hover:bg-copper transition-colors"
        >
          <Plus className="h-4 w-4" />
          Nouvelle localisation
        </button>
      }
    >
      <div className="grid lg:grid-cols-3 gap-4 mb-6">
        <KpiCard
          label="Localisations"
          value={String(data?.locations.length ?? 0)}
        />
        <KpiCard
          label="Articles en stock"
          value={String(data?.summary.length ?? 0)}
        />
        <KpiCard
          label="Total unités"
          value={String(
            data?.summary.reduce((s, x) => s + x.total, 0) ?? 0,
          )}
        />
      </div>

      {creating && (
        <div className="rounded-2xl border border-ink/10 bg-white shadow-soft p-5 mb-6">
          <div className="font-mono text-[10px] uppercase tracking-eyebrow text-copper mb-3">
            Nouvelle localisation
          </div>
          <div className="grid lg:grid-cols-3 gap-3">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nom (ex. Camion Marc)"
              className="bg-cream border border-ink/12 rounded-lg px-3 py-2 text-sm focus:border-copper focus:outline-none"
            />
            <select
              value={type}
              onChange={(e) => setType(e.target.value as Location["type"])}
              className="bg-cream border border-ink/12 rounded-lg px-3 py-2 text-sm focus:border-copper focus:outline-none"
            >
              {Object.entries(TYPE_LABEL).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </select>
            <input
              value={owner}
              onChange={(e) => setOwner(e.target.value)}
              placeholder="Référent (optionnel)"
              className="bg-cream border border-ink/12 rounded-lg px-3 py-2 text-sm focus:border-copper focus:outline-none"
            />
          </div>
          <div className="mt-3 flex justify-end gap-2">
            <button
              onClick={() => setCreating(false)}
              className="text-xs text-graphite hover:text-copper px-3 py-1.5"
            >
              Annuler
            </button>
            <button
              onClick={submit}
              disabled={!name.trim() || busy}
              className="inline-flex items-center gap-2 bg-ink text-cream rounded-full px-4 py-2 text-sm hover:bg-copper transition-colors disabled:opacity-50"
            >
              {busy && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              Créer
            </button>
          </div>
        </div>
      )}

      {/* Locations cards */}
      <SectionCard icon={Warehouse} eyebrow="Localisations" className="mb-6">
        {data === null ? (
          <CenteredLoader />
        ) : data.locations.length === 0 ? (
          <EmptyState
            icon={Truck}
            title="Aucune localisation"
            body="Créez votre atelier principal puis ajoutez les camions des techniciens et les dépôts secondaires."
          />
        ) : (
          <ul className="divide-y divide-ink/8">
            {data.locations.map((loc) => {
              const Icon = TYPE_ICON[loc.type];
              const totalUnits = Object.values(loc.inventory).reduce(
                (s, v) => s + v,
                0,
              );
              const articleCount = Object.keys(loc.inventory).length;
              return (
                <li
                  key={loc.id}
                  className="px-5 py-4 flex items-center gap-3"
                >
                  <span className="h-9 w-9 rounded-full grid place-items-center bg-copper/10 text-copper shrink-0">
                    <Icon className="h-4 w-4" />
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-ink">{loc.name}</div>
                    <div className="text-xs text-muted">
                      {TYPE_LABEL[loc.type]}
                      {loc.ownerTechName ? ` · ${loc.ownerTechName}` : ""}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-mono text-ink tabular-nums">
                      {totalUnits} u
                    </div>
                    <div className="text-[10px] text-muted">
                      {articleCount} article{articleCount > 1 ? "s" : ""}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </SectionCard>

      {data && data.summary.length > 0 && (
        <SectionCard icon={Package} eyebrow="Stock par article">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-cream/30 text-left text-graphite text-xs">
                <th className="px-5 py-2.5 font-mono uppercase tracking-eyebrow">
                  Article
                </th>
                <th className="px-3 py-2.5 font-mono uppercase tracking-eyebrow text-right">
                  Total
                </th>
                <th className="px-5 py-2.5 font-mono uppercase tracking-eyebrow">
                  Répartition
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink/5">
              {data.summary.map((s) => (
                <tr key={s.articleRef}>
                  <td className="px-5 py-3 font-mono text-ink">
                    {s.articleRef}
                  </td>
                  <td className="px-3 py-3 text-right font-mono text-ink tabular-nums">
                    {s.total}
                  </td>
                  <td className="px-5 py-3 text-xs text-graphite">
                    {s.byLocation
                      .map((b) => `${b.locationName} (${b.qty})`)
                      .join(" · ")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </SectionCard>
      )}

      <p className="mt-4 text-xs text-muted">
        Les mouvements (entrées fournisseurs, transferts atelier→camion,
        sorties chantier) sont enregistrés via l&apos;API
        <span className="font-mono"> /api/admin/stock-movements</span> et
        consultables dans l&apos;activity log.
      </p>
    </AdminPageShell>
  );
}
