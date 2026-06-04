"use client";

/**
 * Bibliothèque d'équipements consultable publique.
 *
 * Filtres : catégorie, marque. Affichage carte avec specs, prix indicatif,
 * garantie, éligibilité Klimabonus. Lien vers /devis pour aller plus loin.
 */

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  Package,
  Search,
  ShieldCheck,
  Sparkles,
  Info,
  ArrowRight,
} from "lucide-react";
import {
  EQUIPMENT_LIBRARY,
  CATEGORY_LABELS,
  listBrands,
  type EquipmentCategory,
} from "@/lib/equipment-library";
import { formatEur } from "@/lib/formatters";

export default function EquipmentLibraryPage() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<EquipmentCategory | "all">("all");
  const [brand, setBrand] = useState<string>("all");
  const brands = listBrands();

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return EQUIPMENT_LIBRARY.filter((e) => {
      if (category !== "all" && e.category !== category) return false;
      if (brand !== "all" && e.brand !== brand) return false;
      if (!q) return true;
      const hay = `${e.brand} ${e.series ?? ""} ${e.model} ${e.highlight ?? ""}`
        .toLowerCase();
      return hay.includes(q);
    });
  }, [search, category, brand]);

  return (
    <div className="min-h-screen bg-cream py-12 lg:py-16">
      <div className="container max-w-6xl">
        <div className="mb-8">
          <Link
            href="/"
            className="text-xs font-mono uppercase tracking-eyebrow text-graphite hover:text-copper"
          >
            ← Retour accueil
          </Link>
          <h1 className="mt-4 font-display text-display-md text-ink">
            Bibliothèque d&apos;équipements
          </h1>
          <p className="mt-2 text-graphite max-w-2xl">
            Référentiel consultable des marques et modèles que nous installons
            au Luxembourg. Spécifications, gammes de prix indicatives, garanties.
            Toutes les fourchettes sont indicatives — un chiffrage précis se
            fait par devis.
          </p>
        </div>

        {/* Filters */}
        <div className="rounded-2xl border border-ink/10 bg-white shadow-soft p-4 mb-6 flex items-center gap-2 flex-wrap">
          <div className="inline-flex items-center gap-2 flex-1 min-w-[200px]">
            <Search className="h-4 w-4 text-graphite" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher marque / modèle…"
              className="flex-1 bg-transparent text-sm focus:outline-none placeholder:text-muted"
            />
          </div>
          <select
            value={category}
            onChange={(e) =>
              setCategory(e.target.value as EquipmentCategory | "all")
            }
            className="bg-cream border border-ink/12 rounded-full px-3 py-1.5 text-sm focus:border-copper focus:outline-none"
          >
            <option value="all">Toutes catégories</option>
            {Object.entries(CATEGORY_LABELS).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
          <select
            value={brand}
            onChange={(e) => setBrand(e.target.value)}
            className="bg-cream border border-ink/12 rounded-full px-3 py-1.5 text-sm focus:border-copper focus:outline-none"
          >
            <option value="all">Toutes marques</option>
            {brands.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>
          <span className="text-xs text-muted font-mono">
            {filtered.length} résultat{filtered.length > 1 ? "s" : ""}
          </span>
        </div>

        {/* Cards */}
        {filtered.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-ink/15 bg-white py-16 text-center">
            <Package className="h-10 w-10 text-copper opacity-30 mx-auto mb-3" />
            <p className="text-graphite">
              Aucun équipement pour ces filtres. Ajustez votre recherche.
            </p>
          </div>
        ) : (
          <ul className="grid lg:grid-cols-2 gap-4">
            {filtered.map((e) => (
              <li
                key={e.id}
                className="rounded-2xl border border-ink/10 bg-white shadow-soft p-5"
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <div className="font-mono text-[10px] uppercase tracking-eyebrow text-copper">
                      {CATEGORY_LABELS[e.category]}
                    </div>
                    <h2 className="font-display text-lg text-ink mt-0.5">
                      {e.brand}{" "}
                      <span className="text-graphite font-normal">
                        {e.series}
                      </span>
                    </h2>
                    <p className="text-[11px] text-muted font-mono">
                      {e.model}
                    </p>
                  </div>
                  {e.klimabonusEligible && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-mono uppercase tracking-eyebrow bg-[#22a06b]/10 text-[#22a06b] border border-[#22a06b]/30 px-2 py-0.5 rounded-full whitespace-nowrap">
                      <ShieldCheck className="h-2.5 w-2.5" />
                      Klimabonus
                    </span>
                  )}
                </div>

                {e.highlight && (
                  <p className="text-sm text-graphite mb-3 inline-flex items-start gap-1.5">
                    <Sparkles className="h-3 w-3 text-copper mt-1 shrink-0" />
                    {e.highlight}
                  </p>
                )}

                <div className="grid grid-cols-2 gap-2 text-xs">
                  {e.powerRangeKw && (
                    <Spec
                      label="Puissance"
                      value={`${e.powerRangeKw[0]} – ${e.powerRangeKw[1]} kW`}
                    />
                  )}
                  {e.powerKw && !e.powerRangeKw && (
                    <Spec label="Puissance" value={`${e.powerKw} kW`} />
                  )}
                  {e.efficiency !== undefined && (
                    <Spec
                      label={e.efficiencyLabel ?? "Efficacité"}
                      value={
                        e.efficiency < 1
                          ? `${Math.round(e.efficiency * 100)} %`
                          : e.efficiency.toFixed(1)
                      }
                    />
                  )}
                  {e.warrantyYears && (
                    <Spec
                      label="Garantie constructeur"
                      value={`${e.warrantyYears} ans`}
                    />
                  )}
                  {e.priceRangeEur && (
                    <Spec
                      label="Prix indicatif (HT, matériel)"
                      value={`${formatEur(e.priceRangeEur[0], true)} – ${formatEur(e.priceRangeEur[1], true)}`}
                    />
                  )}
                </div>

                {e.notes && (
                  <div className="mt-3 rounded-lg bg-cream/40 px-3 py-2 text-[11px] text-graphite inline-flex items-start gap-1.5">
                    <Info className="h-3 w-3 text-copper mt-0.5 shrink-0" />
                    {e.notes}
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}

        <div className="mt-8 rounded-2xl border border-ink/10 bg-ink/5 p-5 flex items-center justify-between gap-3 flex-wrap">
          <div>
            <div className="font-display text-base text-ink">
              Un équipement précis vous intéresse ?
            </div>
            <p className="text-sm text-graphite mt-1">
              Nous chiffrons pose comprise selon votre contexte.
            </p>
          </div>
          <Link
            href="/devis"
            className="inline-flex items-center gap-2 rounded-full bg-ink text-cream px-4 py-2 text-sm hover:bg-copper transition-colors"
          >
            Demander un devis
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <p className="mt-6 text-xs text-muted max-w-3xl">
          Les fourchettes de prix sont indicatives — elles peuvent évoluer
          selon le marché, le canal d&apos;approvisionnement, les promotions
          constructeur et le contexte du chantier. Aucune offre commerciale
          ferme n&apos;est consentie sur cette page.
        </p>
      </div>
    </div>
  );
}

function Spec({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-cream/40 px-3 py-2">
      <div className="font-mono text-[9px] uppercase tracking-eyebrow text-muted">
        {label}
      </div>
      <div className="text-ink tabular-nums mt-0.5">{value}</div>
    </div>
  );
}
