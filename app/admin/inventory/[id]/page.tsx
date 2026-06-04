"use client";

/**
 * Détail d'un produit en stock — mouvements rapides + historique.
 */

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import {
  ArrowLeft,
  Loader2,
  Plus,
  Minus,
  RefreshCw,
  Package,
  ArrowDown,
  ArrowUp,
  Settings2,
  Trash2,
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
  notes?: string;
  updatedAt: string;
};

type Movement = {
  id: string;
  itemId: string;
  type: "in" | "out" | "adjust";
  quantity: number;
  reason?: string;
  reference?: string;
  at: string;
  by?: string;
};

export default function InventoryItemPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const [item, setItem] = useState<Item | null>(null);
  const [movements, setMovements] = useState<Movement[]>([]);
  const [type, setType] = useState<"in" | "out" | "adjust">("in");
  const [qty, setQty] = useState<string>("1");
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const res = await fetch(`/api/admin/inventory/${params.id}`, {
      cache: "no-store",
    });
    if (res.status === 401) {
      router.replace("/admin/login");
      return;
    }
    if (res.ok) {
      const d = await res.json();
      setItem(d.item);
      setMovements(d.movements ?? []);
    }
  }, [params.id, router]);

  useEffect(() => {
    load();
  }, [load]);

  const applyMovement = async () => {
    const q = Number(qty);
    if (!Number.isFinite(q)) {
      setError("Quantité invalide");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/admin/inventory/${params.id}/movements`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type, quantity: q, reason }),
        },
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Erreur");
      setQty("1");
      setReason("");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    if (!confirm("Supprimer ce produit ? L'historique de mouvements sera conservé.")) return;
    await fetch(`/api/admin/inventory/${params.id}`, { method: "DELETE" });
    router.push("/admin/inventory");
  };

  if (!item) {
    return (
      <div className="min-h-screen bg-cream grid place-items-center">
        <Loader2 className="h-6 w-6 animate-spin text-copper" />
      </div>
    );
  }

  const isOut = item.quantity === 0;
  const isLow = !isOut && item.quantity <= item.reorderLevel;

  return (
    <div className="min-h-screen bg-cream py-10 lg:py-14">
      <div className="container max-w-4xl">
        <Link
          href="/admin/inventory"
          className="inline-flex items-center gap-2 text-sm font-mono uppercase tracking-eyebrow text-graphite hover:text-copper transition-colors mb-6"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Retour à l&apos;inventaire
        </Link>

        <div className="rounded-2xl border border-ink/10 bg-white shadow-soft p-6 mb-6">
          <div className="flex items-start justify-between gap-3 mb-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Package className="h-4 w-4 text-copper" />
                <span className="font-mono text-xs text-graphite">{item.sku}</span>
                {item.category && (
                  <span className="text-[10px] font-mono uppercase tracking-eyebrow text-copper bg-copper/10 px-2 py-0.5 rounded-full">
                    {item.category}
                  </span>
                )}
              </div>
              <h1 className="font-display text-2xl text-ink">{item.name}</h1>
            </div>
            <button
              onClick={remove}
              className="inline-flex items-center gap-1 text-xs text-ember hover:underline"
            >
              <Trash2 className="h-3 w-3" />
              Supprimer
            </button>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-xl bg-cream/40 border border-ink/8 p-4 text-center">
              <div className="font-mono text-[10px] uppercase tracking-eyebrow text-muted">
                Stock actuel
              </div>
              <div
                className={cn(
                  "mt-1 font-display text-4xl tabular-nums",
                  isOut ? "text-ember" : isLow ? "text-copper" : "text-ink",
                )}
              >
                {item.quantity}
              </div>
              <div className="text-xs text-graphite">{item.unit}</div>
            </div>
            <div className="rounded-xl bg-cream/40 border border-ink/8 p-4 text-center">
              <div className="font-mono text-[10px] uppercase tracking-eyebrow text-muted">
                Seuil réappro
              </div>
              <div className="mt-1 font-display text-4xl tabular-nums text-graphite">
                {item.reorderLevel}
              </div>
              <div className="text-xs text-graphite">{item.unit}</div>
            </div>
          </div>
        </div>

        {/* Mouvement rapide */}
        <div className="rounded-2xl border border-ink/10 bg-white shadow-soft p-5 mb-6">
          <div className="font-mono text-[10px] uppercase tracking-eyebrow text-copper mb-3">
            Enregistrer un mouvement
          </div>
          <div className="flex items-center gap-2 mb-3">
            {(["in", "out", "adjust"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setType(t)}
                className={cn(
                  "px-3 py-1.5 rounded-full text-xs font-medium transition-colors inline-flex items-center gap-1",
                  type === t
                    ? "bg-ink text-cream"
                    : "bg-white border border-ink/10 text-graphite hover:border-copper/40",
                )}
              >
                {t === "in" ? (
                  <ArrowDown className="h-3 w-3" />
                ) : t === "out" ? (
                  <ArrowUp className="h-3 w-3" />
                ) : (
                  <Settings2 className="h-3 w-3" />
                )}
                {t === "in"
                  ? "Entrée"
                  : t === "out"
                    ? "Sortie"
                    : "Ajustement"}
              </button>
            ))}
          </div>
          <div className="grid lg:grid-cols-3 gap-2 mb-3">
            <input
              type="number"
              value={qty}
              onChange={(e) => setQty(e.target.value)}
              placeholder={type === "adjust" ? "Nouvelle valeur" : "Quantité"}
              className="bg-cream border border-ink/12 rounded-xl px-3 py-2 text-sm font-mono focus:border-copper focus:outline-none"
            />
            <input
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Motif (optionnel)"
              className="lg:col-span-2 bg-cream border border-ink/12 rounded-xl px-3 py-2 text-sm focus:border-copper focus:outline-none"
            />
          </div>
          {error && <div className="text-xs text-ember mb-2">{error}</div>}
          <button
            onClick={applyMovement}
            disabled={busy}
            className="inline-flex items-center gap-1.5 rounded-full bg-ink text-cream px-4 py-2 text-sm hover:bg-copper disabled:opacity-50"
          >
            {busy ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : type === "in" ? (
              <Plus className="h-3.5 w-3.5" />
            ) : type === "out" ? (
              <Minus className="h-3.5 w-3.5" />
            ) : (
              <RefreshCw className="h-3.5 w-3.5" />
            )}
            Enregistrer
          </button>
        </div>

        {/* Historique */}
        <div className="rounded-2xl border border-ink/10 bg-white shadow-soft overflow-hidden">
          <div className="px-5 py-3 border-b border-ink/8 bg-cream/40 font-mono text-[10px] uppercase tracking-eyebrow text-copper">
            Historique récent ({movements.length})
          </div>
          {movements.length === 0 ? (
            <div className="py-12 text-center text-muted text-sm">
              Aucun mouvement enregistré.
            </div>
          ) : (
            <ul className="divide-y divide-ink/8">
              {movements.map((m) => (
                <li
                  key={m.id}
                  className="px-5 py-3 flex items-center gap-3"
                >
                  <span
                    className={cn(
                      "h-7 w-7 grid place-items-center rounded-full",
                      m.type === "in"
                        ? "bg-[#22a06b]/15 text-[#22a06b]"
                        : m.type === "out"
                          ? "bg-ember/15 text-ember"
                          : "bg-cream border border-ink/10 text-graphite",
                    )}
                  >
                    {m.type === "in" ? (
                      <ArrowDown className="h-3 w-3" />
                    ) : m.type === "out" ? (
                      <ArrowUp className="h-3 w-3" />
                    ) : (
                      <Settings2 className="h-3 w-3" />
                    )}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm text-ink">
                      <span className="font-mono">
                        {m.quantity > 0 ? "+" : ""}
                        {m.quantity}
                      </span>{" "}
                      {item.unit}
                      {m.reason && (
                        <span className="text-graphite ml-2 text-xs">
                          — {m.reason}
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] font-mono text-muted">
                      {new Date(m.at).toLocaleString("fr-FR")}
                      {m.by && <> · {m.by}</>}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
