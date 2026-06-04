"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Package,
  Upload,
  Download,
  Trash2,
  ArrowLeft,
  AlertTriangle,
  CheckCircle2,
  FileSpreadsheet,
  Info,
  Search,
} from "lucide-react";
import type { CatalogueState, CatalogueItem } from "@/lib/catalogue-schema";
import { cn } from "@/lib/utils";

const SERVICE_LABEL: Record<string, string> = {
  chauffage: "Chauffage",
  pac: "Pompe à chaleur",
  clim: "Climatisation",
  sanitaire: "Sanitaire",
  enr: "Énergies renouv.",
  depannage: "Dépannage",
  autre: "Autre",
};

export default function CataloguePage() {
  const router = useRouter();
  const fileInput = useRef<HTMLInputElement>(null);
  const [state, setState] = useState<CatalogueState | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<{
    ok: boolean;
    message: string;
    imported?: number;
    errors?: { row: number; reason: string }[];
  } | null>(null);
  const [search, setSearch] = useState("");
  const [serviceFilter, setServiceFilter] = useState<string>("all");

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/catalogue", { cache: "no-store" });
      if (res.status === 401) {
        router.replace("/admin/login");
        return;
      }
      const data = await res.json();
      setState(data.catalogue ?? null);
    } catch {
      setState(null);
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const handleFile = async (file: File) => {
    setUploading(true);
    setUploadResult(null);
    const fd = new FormData();
    fd.append("file", file);
    try {
      const res = await fetch("/api/admin/catalogue", { method: "POST", body: fd });
      const data = await res.json();
      if (res.ok) {
        setUploadResult({
          ok: true,
          message: `${data.imported} ligne${data.imported > 1 ? "s" : ""} importée${data.imported > 1 ? "s" : ""}.`,
          imported: data.imported,
          errors: data.errors,
        });
        setState(data.catalogue);
      } else {
        setUploadResult({
          ok: false,
          message: data.error ?? "Échec de l'import.",
          errors: data.details,
        });
      }
    } catch (e) {
      setUploadResult({ ok: false, message: "Erreur réseau." });
    } finally {
      setUploading(false);
    }
  };

  const clearAll = async () => {
    if (!confirm("Supprimer tout le catalogue ? Cette action est irréversible.")) return;
    await fetch("/api/admin/catalogue", { method: "DELETE" });
    setState(null);
  };

  const items = state?.items ?? [];
  const filtered = items.filter((item) => {
    if (serviceFilter !== "all" && item.service !== serviceFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      if (
        !item.name.toLowerCase().includes(q) &&
        !item.ref.toLowerCase().includes(q) &&
        !item.brand.toLowerCase().includes(q)
      )
        return false;
    }
    return true;
  });

  const services = Array.from(new Set(items.map((i) => i.service)));

  return (
    <div className="min-h-screen bg-cream py-10 lg:py-14">
      <div className="container max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/admin/leads"
            className="inline-flex items-center gap-2 text-sm text-graphite hover:text-copper transition-colors"
          >
            <ArrowLeft className="h-4 w-4" /> Suivi des demandes
          </Link>
        </div>

        <div className="flex items-start justify-between gap-6 flex-wrap mb-8">
          <div>
            <div className="font-mono text-[10px] uppercase tracking-eyebrow text-copper">
              Catalogue interne · usage atelier
            </div>
            <h1 className="mt-3 font-display text-display-md text-ink flex items-center gap-3">
              <Package className="h-8 w-8 text-copper" />
              Votre base de prix
            </h1>
            <p className="mt-3 text-graphite text-sm max-w-2xl">
              <strong className="text-ink">Outil interne — pas visible des clients.</strong>{" "}
              Importez ici votre fichier Excel/CSV avec vos vraies références : noms, prix HT,
              marges, avantages, limites. À chaque demande de devis qui arrive, le système
              proposera <strong>3 systèmes</strong> tirés de cette base : un{" "}
              <em>bas de gamme</em>, un <em>dans la fourchette budget</em> du client, un{" "}
              <em>haut de gamme</em>.
            </p>
          </div>
        </div>

        {/* Upload zone */}
        <div className="grid lg:grid-cols-3 gap-5 mb-8">
          <div className="lg:col-span-2 p-6 rounded-3xl border border-ink/10 bg-white shadow-soft">
            <div className="font-display text-xl text-ink mb-2">Importer un fichier</div>
            <p className="text-sm text-graphite mb-5">
              Glissez votre fichier Excel ou CSV, ou cliquez pour parcourir. Maximum 5 Mo.
              L'import remplace le catalogue actuel.
            </p>
            <div
              onClick={() => fileInput.current?.click()}
              className={cn(
                "cursor-pointer p-8 rounded-2xl border-2 border-dashed text-center transition-all",
                uploading
                  ? "border-copper bg-copper/8"
                  : "border-ink/15 bg-cream hover:border-copper/50 hover:bg-cream",
              )}
            >
              <div className="mx-auto h-12 w-12 rounded-full bg-copper/10 border border-copper/30 grid place-items-center mb-3">
                <Upload className="h-5 w-5 text-copper" />
              </div>
              <div className="font-display text-lg text-ink">
                {uploading ? "Import en cours…" : "Glisser ou cliquer pour importer"}
              </div>
              <div className="mt-1 text-xs text-muted">
                Formats acceptés : .xlsx · .xls · .csv
              </div>
              <input
                ref={fileInput}
                type="file"
                accept=".xlsx,.xls,.csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel,text/csv"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleFile(f);
                  e.target.value = ""; // reset
                }}
              />
            </div>

            <AnimatePresence>
              {uploadResult && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className={cn(
                    "mt-5 p-4 rounded-xl border flex items-start gap-3",
                    uploadResult.ok
                      ? "bg-[#22a06b]/10 border-[#22a06b]/30 text-ink"
                      : "bg-ember/10 border-ember/40 text-ink",
                  )}
                >
                  {uploadResult.ok ? (
                    <CheckCircle2 className="h-5 w-5 text-[#22a06b] shrink-0 mt-0.5" />
                  ) : (
                    <AlertTriangle className="h-5 w-5 text-ember shrink-0 mt-0.5" />
                  )}
                  <div className="text-sm">
                    <div className="font-medium">{uploadResult.message}</div>
                    {uploadResult.errors && uploadResult.errors.length > 0 && (
                      <details className="mt-2">
                        <summary className="cursor-pointer text-xs text-muted">
                          {uploadResult.errors.length} ligne(s) ignorée(s) — détails
                        </summary>
                        <ul className="mt-2 space-y-1 text-xs">
                          {uploadResult.errors.slice(0, 10).map((e, i) => (
                            <li key={i} className="text-graphite">
                              Ligne {e.row} : {e.reason}
                            </li>
                          ))}
                        </ul>
                      </details>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="p-6 rounded-3xl border border-ink/10 bg-white shadow-soft">
            <div className="font-display text-lg text-ink mb-3">Besoin d'un modèle ?</div>
            <p className="text-xs text-graphite mb-5">
              Téléchargez le template CSV vierge avec 3 lignes d'exemple. Ouvrez-le dans Excel,
              remplissez avec vos références, ré-importez ici.
            </p>
            <a
              href="/api/admin/catalogue/template"
              download
              className="inline-flex items-center gap-2 rounded-full bg-ink text-cream px-5 py-2.5 text-sm font-medium hover:bg-copper transition-colors"
            >
              <Download className="h-4 w-4" />
              Template CSV
            </a>

            <div className="mt-6 pt-5 border-t border-ink/8">
              <div className="flex items-center gap-2 text-xs text-muted font-mono uppercase tracking-eyebrow mb-2">
                <Info className="h-3 w-3 text-copper" />
                Colonnes attendues
              </div>
              <ul className="text-xs text-graphite space-y-1.5 leading-relaxed">
                <li><strong>ref</strong> · code interne</li>
                <li><strong>service</strong> · chauffage/pac/clim/sanitaire/enr</li>
                <li><strong>name</strong> · nom commercial</li>
                <li><strong>description</strong> · descriptif</li>
                <li><strong>priceMin / priceMax</strong> · plage de prix HT</li>
                <li><strong>advantages</strong> · séparés par <code>|</code></li>
                <li><strong>inconvenients</strong> · séparés par <code>|</code></li>
                <li><strong>brand · power</strong> · optionnels</li>
                <li><strong>surfaceMin · surfaceMax</strong> · m² adaptés</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Catalogue meta */}
        {state && (
          <div className="mb-5 flex items-center justify-between flex-wrap gap-3 text-sm">
            <div className="text-graphite">
              <strong className="text-ink">{items.length}</strong> référence{items.length > 1 ? "s" : ""} · importé{items.length > 1 ? "s" : ""} depuis <code className="text-ink">{state.source}</code>{" "}
              le {new Date(state.uploadedAt).toLocaleString("fr-FR")}
            </div>
            <button
              onClick={clearAll}
              className="inline-flex items-center gap-2 rounded-full border border-ember/30 text-ember px-3 py-1.5 text-xs hover:bg-ember/10 transition-colors"
            >
              <Trash2 className="h-3 w-3" /> Vider le catalogue
            </button>
          </div>
        )}

        {/* Filters */}
        {items.length > 0 && (
          <div className="flex items-center gap-3 flex-wrap mb-5">
            <div className="relative flex-1 min-w-[240px] max-w-md">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Rechercher : référence, nom, marque…"
                className="w-full pl-10 pr-4 py-2.5 rounded-full bg-white border border-ink/12 text-sm text-ink focus:border-copper focus:outline-none focus:ring-2 focus:ring-copper/20"
              />
            </div>
            <div className="inline-flex items-center gap-1 p-1 rounded-full bg-white border border-ink/12 flex-wrap">
              <button
                onClick={() => setServiceFilter("all")}
                className={cn(
                  "px-3 py-1.5 rounded-full text-xs font-mono uppercase tracking-eyebrow transition-colors",
                  serviceFilter === "all" ? "bg-ink text-cream" : "text-graphite",
                )}
              >
                Tous
              </button>
              {services.map((s) => (
                <button
                  key={s}
                  onClick={() => setServiceFilter(s)}
                  className={cn(
                    "px-3 py-1.5 rounded-full text-xs font-mono uppercase tracking-eyebrow transition-colors",
                    serviceFilter === s ? "bg-ink text-cream" : "text-graphite",
                  )}
                >
                  {SERVICE_LABEL[s] ?? s}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Items list */}
        {loading ? (
          <div className="text-center py-16 text-muted">Chargement…</div>
        ) : items.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-ink/15 bg-white p-12 text-center">
            <FileSpreadsheet className="h-12 w-12 text-muted mx-auto mb-4" />
            <div className="font-display text-xl text-ink mb-2">
              Catalogue vide
            </div>
            <p className="text-sm text-graphite max-w-md mx-auto">
              Importez votre premier fichier pour activer le générateur de propositions sur chaque
              demande de devis.
            </p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {filtered.map((item) => (
              <CatalogueCard key={item.ref} item={item} />
            ))}
            {filtered.length === 0 && (
              <div className="md:col-span-2 text-center py-12 text-muted">
                Aucune référence ne correspond à ces filtres.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function CatalogueCard({ item }: { item: CatalogueItem }) {
  const hasPrice = item.priceMin != null || item.priceMax != null;
  const priceText = hasPrice
    ? item.priceMin != null && item.priceMax != null
      ? `${item.priceMin.toLocaleString("fr-FR")} – ${item.priceMax.toLocaleString("fr-FR")} €`
      : `${(item.priceMin ?? item.priceMax)?.toLocaleString("fr-FR")} €`
    : "Sur devis";

  return (
    <div className="p-5 rounded-2xl border border-ink/10 bg-white hover:border-copper/30 hover:shadow-soft transition-all">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-mono uppercase tracking-eyebrow bg-copper/10 border border-copper/30 text-copper">
              {SERVICE_LABEL[item.service] ?? item.service}
            </span>
            <span className="font-mono text-[10px] text-muted">{item.ref}</span>
          </div>
          <div className="font-display text-lg text-ink leading-snug">{item.name}</div>
          {item.brand && <div className="text-xs text-muted mt-0.5">{item.brand}</div>}
        </div>
        <div className="text-right shrink-0">
          <div className="font-display text-base text-copper">{priceText}</div>
          <div className="text-[10px] font-mono uppercase tracking-eyebrow text-muted">
            {item.unit}
          </div>
        </div>
      </div>

      {item.description && (
        <p className="mt-3 text-sm text-graphite leading-relaxed">{item.description}</p>
      )}

      {(item.advantages.length > 0 || item.inconvenients.length > 0) && (
        <div className="mt-4 grid sm:grid-cols-2 gap-3 text-xs">
          {item.advantages.length > 0 && (
            <div>
              <div className="font-mono text-[9px] uppercase tracking-eyebrow text-[#22a06b] mb-1.5">
                + Avantages
              </div>
              <ul className="space-y-1 text-graphite">
                {item.advantages.map((a) => (
                  <li key={a} className="flex gap-1.5">
                    <span className="text-[#22a06b]">✓</span>
                    {a}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {item.inconvenients.length > 0 && (
            <div>
              <div className="font-mono text-[9px] uppercase tracking-eyebrow text-ember mb-1.5">
                − Limites
              </div>
              <ul className="space-y-1 text-graphite">
                {item.inconvenients.map((a) => (
                  <li key={a} className="flex gap-1.5">
                    <span className="text-ember">·</span>
                    {a}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {(item.surfaceMin != null || item.surfaceMax != null) && (
        <div className="mt-4 pt-3 border-t border-ink/8 font-mono text-[10px] uppercase tracking-eyebrow text-muted">
          Surface adaptée : {item.surfaceMin ?? "—"} – {item.surfaceMax ?? "—"} m²
        </div>
      )}
    </div>
  );
}
