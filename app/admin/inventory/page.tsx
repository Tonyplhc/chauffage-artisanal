"use client";

/**
 * Page inventaire — liste des items + alerte rupture/seuil.
 */

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Loader2,
  Plus,
  Package,
  AlertTriangle,
  TrendingDown,
  ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

type Item = {
  id: string;
  sku: string;
  name: string;
  category?: string;
  quantity: number;
  reorderLevel: number;
  unit: string;
  lastMovementAt?: string;
};

type Stats = {
  totalItems: number;
  totalUnits: number;
  belowReorder: number;
  outOfStock: number;
  categories: { name: string; count: number }[];
};

export default function InventoryPage() {
  const router = useRouter();
  const [items, setItems] = useState<Item[] | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [creating, setCreating] = useState(false);
  const [draft, setDraft] = useState({
    sku: "",
    name: "",
    category: "",
    quantity: 0,
    reorderLevel: 0,
    unit: "pcs",
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "low" | "out">("all");

  const load = useCallback(async () => {
    const res = await fetch("/api/admin/inventory", { cache: "no-store" });
    if (res.status === 401) {
      router.replace("/admin/login");
      return;
    }
    if (res.ok) {
      const d = await res.json();
      setItems(d.items ?? []);
      setStats(d.stats);
    }
  }, [router]);

  useEffect(() => {
    load();
  }, [load]);

  const create = async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/inventory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(draft),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Erreur");
      setCreating(false);
      setDraft({
        sku: "",
        name: "",
        category: "",
        quantity: 0,
        reorderLevel: 0,
        unit: "pcs",
      });
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setBusy(false);
    }
  };

  const filtered = items?.filter((i) => {
    if (filter === "out") return i.quantity === 0;
    if (filter === "low") return i.quantity <= i.reorderLevel && i.quantity > 0;
    return true;
  });

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

        <div className="flex items-start justify-between gap-4 flex-wrap mb-8">
          <div>
            <h1 className="font-display text-display-md text-ink">
              Inventaire
            </h1>
            <p className="mt-2 text-graphite">
              Suivi du stock produits avec alertes seuil et historique de
              mouvements.
            </p>
          </div>
          {!creating && (
            <button
              onClick={() => setCreating(true)}
              className="inline-flex items-center gap-2 rounded-full bg-ink text-cream px-5 py-2.5 text-sm font-medium hover:bg-copper transition-colors"
            >
              <Plus className="h-4 w-4" />
              Nouveau produit
            </button>
          )}
        </div>

        {stats && (
          <div className="grid lg:grid-cols-4 gap-4 mb-8">
            <Kpi
              icon={<Package className="h-4 w-4" />}
              label="Références"
              value={String(stats.totalItems)}
            />
            <Kpi
              icon={<Package className="h-4 w-4 text-graphite" />}
              label="Unités totales"
              value={stats.totalUnits.toLocaleString("fr-FR")}
            />
            <Kpi
              icon={<TrendingDown className="h-4 w-4 text-copper" />}
              label="Sous seuil"
              value={String(stats.belowReorder)}
              accent={stats.belowReorder > 0 ? "copper" : undefined}
            />
            <Kpi
              icon={<AlertTriangle className="h-4 w-4 text-ember" />}
              label="Rupture"
              value={String(stats.outOfStock)}
              accent={stats.outOfStock > 0 ? "warn" : undefined}
            />
          </div>
        )}

        {error && (
          <div className="mb-4 p-3 rounded-xl border border-ember/40 bg-ember/5 text-sm text-ember">
            {error}
          </div>
        )}

        {creating && (
          <div className="mb-6 rounded-2xl border border-copper/40 bg-white shadow-soft p-5">
            <div className="font-mono text-[10px] uppercase tracking-eyebrow text-copper mb-3">
              Nouveau produit
            </div>
            <div className="grid lg:grid-cols-6 gap-2">
              <input
                value={draft.sku}
                onChange={(e) => setDraft({ ...draft, sku: e.target.value })}
                placeholder="SKU"
                className="bg-cream border border-ink/12 rounded-xl px-3 py-2 text-sm font-mono focus:border-copper focus:outline-none"
                autoFocus
              />
              <input
                value={draft.name}
                onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                placeholder="Nom"
                className="lg:col-span-2 bg-cream border border-ink/12 rounded-xl px-3 py-2 text-sm focus:border-copper focus:outline-none"
              />
              <input
                value={draft.category}
                onChange={(e) =>
                  setDraft({ ...draft, category: e.target.value })
                }
                placeholder="Catégorie"
                className="bg-cream border border-ink/12 rounded-xl px-3 py-2 text-sm focus:border-copper focus:outline-none"
              />
              <input
                type="number"
                value={draft.quantity}
                onChange={(e) =>
                  setDraft({ ...draft, quantity: Number(e.target.value) || 0 })
                }
                placeholder="Stock initial"
                className="bg-cream border border-ink/12 rounded-xl px-3 py-2 text-sm font-mono focus:border-copper focus:outline-none"
              />
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={draft.reorderLevel}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      reorderLevel: Number(e.target.value) || 0,
                    })
                  }
                  placeholder="Seuil"
                  className="flex-1 bg-cream border border-ink/12 rounded-xl px-3 py-2 text-sm font-mono focus:border-copper focus:outline-none"
                />
                <input
                  value={draft.unit}
                  onChange={(e) => setDraft({ ...draft, unit: e.target.value })}
                  placeholder="Unité"
                  className="w-16 bg-cream border border-ink/12 rounded-xl px-2 py-2 text-xs font-mono focus:border-copper focus:outline-none"
                />
              </div>
            </div>
            <div className="mt-3 flex items-center gap-2">
              <button
                onClick={create}
                disabled={busy || !draft.sku.trim() || !draft.name.trim()}
                className="inline-flex items-center gap-1.5 rounded-full bg-ink text-cream px-4 py-2 text-sm hover:bg-copper disabled:opacity-50"
              >
                {busy ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Plus className="h-3.5 w-3.5" />
                )}
                Créer
              </button>
              <button
                onClick={() => {
                  setCreating(false);
                  setError(null);
                }}
                className="text-xs text-graphite hover:text-ink"
              >
                Annuler
              </button>
            </div>
          </div>
        )}

        <div className="flex items-center gap-2 mb-4">
          {(["all", "low", "out"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                "px-3 py-1.5 rounded-full text-sm transition-colors",
                filter === f
                  ? "bg-ink text-cream"
                  : "bg-white border border-ink/10 text-graphite hover:border-copper/40",
              )}
            >
              {f === "all"
                ? "Tous"
                : f === "low"
                  ? `Sous seuil${stats ? ` (${stats.belowReorder})` : ""}`
                  : `Rupture${stats ? ` (${stats.outOfStock})` : ""}`}
            </button>
          ))}
        </div>

        <div className="rounded-2xl border border-ink/10 bg-white shadow-soft overflow-hidden">
          {items === null ? (
            <div className="py-12 text-center text-muted">
              <Loader2 className="h-5 w-5 animate-spin mx-auto" />
            </div>
          ) : (filtered?.length ?? 0) === 0 ? (
            <div className="py-16 text-center text-muted">
              <Package className="h-12 w-12 mx-auto opacity-20 text-copper mb-2" />
              <p>Aucun produit dans cette catégorie.</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-cream/30 text-left text-graphite">
                  <th className="px-5 py-2.5 font-mono text-[10px] uppercase tracking-eyebrow">
                    SKU
                  </th>
                  <th className="px-3 py-2.5 font-mono text-[10px] uppercase tracking-eyebrow">
                    Nom
                  </th>
                  <th className="px-3 py-2.5 font-mono text-[10px] uppercase tracking-eyebrow">
                    Catégorie
                  </th>
                  <th className="px-3 py-2.5 font-mono text-[10px] uppercase tracking-eyebrow text-right">
                    Stock
                  </th>
                  <th className="px-5 py-2.5 font-mono text-[10px] uppercase tracking-eyebrow text-right">
                    Seuil
                  </th>
                  <th />
                </tr>
              </thead>
              <tbody className="divide-y divide-ink/5">
                {filtered!.map((it) => {
                  const isOut = it.quantity === 0;
                  const isLow = !isOut && it.quantity <= it.reorderLevel;
                  return (
                    <tr key={it.id} className="hover:bg-cream/40 group">
                      <td className="px-5 py-2.5 font-mono text-xs text-graphite">
                        {it.sku}
                      </td>
                      <td className="px-3 py-2.5 text-ink truncate max-w-xs">
                        {it.name}
                      </td>
                      <td className="px-3 py-2.5 text-xs text-graphite">
                        {it.category ?? "—"}
                      </td>
                      <td className="px-3 py-2.5 text-right">
                        <span
                          className={cn(
                            "font-mono tabular-nums",
                            isOut
                              ? "text-ember font-bold"
                              : isLow
                                ? "text-copper font-medium"
                                : "text-ink",
                          )}
                        >
                          {it.quantity} {it.unit}
                        </span>
                      </td>
                      <td className="px-5 py-2.5 text-right text-xs text-muted font-mono">
                        {it.reorderLevel}
                      </td>
                      <td className="pr-3 py-2.5">
                        <Link
                          href={`/admin/inventory/${it.id}`}
                          className="opacity-0 group-hover:opacity-100 transition-opacity inline-flex items-center"
                        >
                          <ArrowRight className="h-3.5 w-3.5 text-copper" />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
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
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  accent?: "copper" | "warn";
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
            : accent === "warn"
              ? "text-ember"
              : "text-ink"
        }`}
      >
        {value}
      </div>
    </div>
  );
}
