"use client";

/**
 * Carnet fournisseurs / partenaires — liste + édition inline.
 */

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Plus,
  Loader2,
  Building2,
  Phone,
  Mail,
  Globe,
  Star,
  Edit2,
  Trash2,
  Search,
  Check,
  X as XIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

type Supplier = {
  id: string;
  name: string;
  category?: string;
  contactName?: string;
  email?: string;
  phone?: string;
  website?: string;
  address?: string;
  vatNumber?: string;
  leadTimeDays?: number;
  paymentTerms?: string;
  notes?: string;
  rating?: number;
  status: "active" | "archived";
  updatedAt: string;
};

type Stats = {
  total: number;
  active: number;
  archived: number;
  averageLeadTime: number | null;
};

export default function SuppliersPage() {
  const router = useRouter();
  const [suppliers, setSuppliers] = useState<Supplier[] | null>(null);
  const [categories, setCategories] = useState<string[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState<Partial<Supplier>>({ name: "" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState<string>("");

  const load = useCallback(async () => {
    const url = new URL("/api/admin/suppliers", window.location.origin);
    if (search.trim()) url.searchParams.set("search", search.trim());
    if (catFilter) url.searchParams.set("category", catFilter);
    const res = await fetch(url.toString(), { cache: "no-store" });
    if (res.status === 401) {
      router.replace("/admin/login");
      return;
    }
    if (res.ok) {
      const d = await res.json();
      setSuppliers(d.suppliers ?? []);
      setCategories(d.categories ?? []);
      setStats(d.stats);
    }
  }, [router, search, catFilter]);

  useEffect(() => {
    load();
  }, [load]);

  const startCreate = () => {
    setDraft({ name: "", category: catFilter || "Général" });
    setCreating(true);
    setEditing(null);
    setError(null);
  };

  const startEdit = (s: Supplier) => {
    setDraft({ ...s });
    setEditing(s.id);
    setCreating(false);
    setError(null);
  };

  const save = async () => {
    if (!draft.name?.trim()) {
      setError("Nom requis");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const url = editing
        ? `/api/admin/suppliers/${editing}`
        : "/api/admin/suppliers";
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
      setDraft({ name: "" });
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setBusy(false);
    }
  };

  const remove = async (id: string, name: string) => {
    if (!confirm(`Supprimer le fournisseur « ${name} » ?`)) return;
    await fetch(`/api/admin/suppliers/${id}`, { method: "DELETE" });
    await load();
  };

  return (
    <div className="min-h-screen bg-cream py-10 lg:py-14">
      <div className="container max-w-5xl">
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
              Fournisseurs
            </h1>
            <p className="mt-2 text-graphite">
              Carnet partenaires (matériel, sous-traitants) avec délais moyens
              et conditions de paiement.
            </p>
          </div>
          <button
            onClick={startCreate}
            disabled={creating || editing !== null}
            className="inline-flex items-center gap-2 rounded-full bg-ink text-cream px-5 py-2.5 text-sm font-medium hover:bg-copper transition-colors disabled:opacity-50"
          >
            <Plus className="h-4 w-4" />
            Nouveau fournisseur
          </button>
        </div>

        {stats && (
          <div className="grid lg:grid-cols-3 gap-4 mb-8">
            <Kpi
              icon={<Building2 className="h-4 w-4" />}
              label="Actifs"
              value={String(stats.active)}
              hint={`${stats.total} au total`}
            />
            <Kpi
              icon={<Loader2 className="h-4 w-4 text-muted" />}
              label="Archivés"
              value={String(stats.archived)}
            />
            <Kpi
              icon={<Loader2 className="h-4 w-4 text-copper" />}
              label="Délai moyen"
              value={
                stats.averageLeadTime === null
                  ? "—"
                  : `${Math.round(stats.averageLeadTime)} j`
              }
            />
          </div>
        )}

        {error && (
          <div className="mb-4 p-3 rounded-xl border border-ember/40 bg-ember/5 text-sm text-ember">
            {error}
          </div>
        )}

        {(creating || editing) && (
          <SupplierForm
            draft={draft}
            setDraft={setDraft}
            categories={categories}
            onSave={save}
            onCancel={() => {
              setCreating(false);
              setEditing(null);
              setDraft({ name: "" });
              setError(null);
            }}
            busy={busy}
            isEdit={!!editing}
          />
        )}

        <div className="rounded-2xl border border-ink/10 bg-white shadow-soft p-3 mb-4 flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-2 flex-1 min-w-[220px]">
            <Search className="h-4 w-4 text-muted" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher fournisseur, contact…"
              className="bg-transparent text-sm focus:outline-none flex-1"
            />
          </div>
          {categories.length > 0 && (
            <div className="flex items-center gap-1 flex-wrap">
              <button
                onClick={() => setCatFilter("")}
                className={cn(
                  "px-2 py-0.5 rounded-full text-[11px]",
                  catFilter === ""
                    ? "bg-ink text-cream"
                    : "bg-cream border border-ink/10 hover:border-copper/40",
                )}
              >
                Toutes
              </button>
              {categories.map((c) => (
                <button
                  key={c}
                  onClick={() => setCatFilter(c)}
                  className={cn(
                    "px-2 py-0.5 rounded-full text-[11px]",
                    catFilter === c
                      ? "bg-ink text-cream"
                      : "bg-cream border border-ink/10 hover:border-copper/40",
                  )}
                >
                  {c}
                </button>
              ))}
            </div>
          )}
        </div>

        {suppliers === null ? (
          <div className="py-16 text-center text-muted">
            <Loader2 className="h-6 w-6 animate-spin mx-auto" />
          </div>
        ) : suppliers.length === 0 ? (
          <div className="rounded-2xl border border-ink/10 bg-white shadow-soft py-16 text-center text-muted">
            <Building2 className="h-12 w-12 mx-auto opacity-20 text-copper mb-2" />
            <p>Aucun fournisseur dans cette vue.</p>
          </div>
        ) : (
          <ul className="grid gap-3">
            {suppliers.map((s) => (
              <li
                key={s.id}
                className="rounded-2xl border border-ink/10 bg-white shadow-soft p-5"
              >
                <div className="flex items-start gap-3 mb-3">
                  <div
                    className="h-12 w-12 rounded-full grid place-items-center shrink-0"
                    style={{
                      background: "rgba(184,106,54,0.12)",
                      color: "#b86a36",
                    }}
                  >
                    <Building2 className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-base font-medium text-ink">
                        {s.name}
                      </span>
                      {s.category && (
                        <span className="text-[10px] font-mono uppercase tracking-eyebrow text-copper bg-copper/10 px-2 py-0.5 rounded-full">
                          {s.category}
                        </span>
                      )}
                      {s.rating && (
                        <span className="inline-flex items-center gap-0.5 text-copper text-xs">
                          {Array.from({ length: s.rating }).map((_, i) => (
                            <Star
                              key={i}
                              className="h-3 w-3 fill-copper"
                            />
                          ))}
                        </span>
                      )}
                      {s.status === "archived" && (
                        <span className="text-[10px] font-mono uppercase tracking-eyebrow text-muted bg-cream border border-ink/10 px-2 py-0.5 rounded-full">
                          Archivé
                        </span>
                      )}
                    </div>
                    {s.contactName && (
                      <div className="text-xs text-graphite mt-1">
                        {s.contactName}
                      </div>
                    )}
                    <div className="flex items-center gap-3 mt-2 text-xs text-graphite flex-wrap">
                      {s.phone && (
                        <a
                          href={`tel:${s.phone.replace(/\s/g, "")}`}
                          className="inline-flex items-center gap-1 hover:text-copper"
                        >
                          <Phone className="h-3 w-3" />
                          {s.phone}
                        </a>
                      )}
                      {s.email && (
                        <a
                          href={`mailto:${s.email}`}
                          className="inline-flex items-center gap-1 hover:text-copper"
                        >
                          <Mail className="h-3 w-3" />
                          {s.email}
                        </a>
                      )}
                      {s.website && (
                        <a
                          href={s.website}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 hover:text-copper"
                        >
                          <Globe className="h-3 w-3" />
                          Site
                        </a>
                      )}
                    </div>
                    {(s.leadTimeDays || s.paymentTerms) && (
                      <div className="mt-1.5 text-[11px] text-muted font-mono">
                        {s.leadTimeDays && <>Délai : {s.leadTimeDays} j</>}
                        {s.leadTimeDays && s.paymentTerms && " · "}
                        {s.paymentTerms && <>Paiement : {s.paymentTerms}</>}
                      </div>
                    )}
                    {s.notes && (
                      <div className="mt-2 text-xs text-graphite p-2 rounded-lg bg-cream/40 border border-ink/5 whitespace-pre-wrap">
                        {s.notes}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => startEdit(s)}
                      className="h-7 w-7 grid place-items-center rounded-full bg-cream border border-ink/8 text-graphite hover:bg-ink hover:text-cream"
                      title="Modifier"
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => remove(s.id, s.name)}
                      className="h-7 w-7 grid place-items-center rounded-full bg-cream border border-ember/30 text-ember hover:bg-ember hover:text-cream"
                      title="Supprimer"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function SupplierForm({
  draft,
  setDraft,
  categories,
  onSave,
  onCancel,
  busy,
  isEdit,
}: {
  draft: Partial<Supplier>;
  setDraft: (s: Partial<Supplier>) => void;
  categories: string[];
  onSave: () => void;
  onCancel: () => void;
  busy: boolean;
  isEdit: boolean;
}) {
  return (
    <div className="mb-6 rounded-2xl border border-copper/40 bg-white shadow-soft p-5">
      <div className="font-mono text-[10px] uppercase tracking-eyebrow text-copper mb-3">
        {isEdit ? "Modifier" : "Nouveau fournisseur"}
      </div>
      <div className="grid lg:grid-cols-2 gap-2">
        <input
          value={draft.name ?? ""}
          onChange={(e) => setDraft({ ...draft, name: e.target.value })}
          placeholder="Nom (raison sociale)"
          className="bg-cream border border-ink/12 rounded-xl px-3 py-2 text-sm focus:border-copper focus:outline-none"
          autoFocus
        />
        <input
          value={draft.category ?? ""}
          onChange={(e) => setDraft({ ...draft, category: e.target.value })}
          placeholder="Catégorie"
          list="cats"
          className="bg-cream border border-ink/12 rounded-xl px-3 py-2 text-sm focus:border-copper focus:outline-none"
        />
        <datalist id="cats">
          {categories.map((c) => (
            <option key={c} value={c} />
          ))}
        </datalist>
        <input
          value={draft.contactName ?? ""}
          onChange={(e) => setDraft({ ...draft, contactName: e.target.value })}
          placeholder="Contact (nom)"
          className="bg-cream border border-ink/12 rounded-xl px-3 py-2 text-sm focus:border-copper focus:outline-none"
        />
        <input
          value={draft.email ?? ""}
          onChange={(e) => setDraft({ ...draft, email: e.target.value })}
          placeholder="Email"
          type="email"
          className="bg-cream border border-ink/12 rounded-xl px-3 py-2 text-sm focus:border-copper focus:outline-none"
        />
        <input
          value={draft.phone ?? ""}
          onChange={(e) => setDraft({ ...draft, phone: e.target.value })}
          placeholder="Téléphone"
          className="bg-cream border border-ink/12 rounded-xl px-3 py-2 text-sm focus:border-copper focus:outline-none"
        />
        <input
          value={draft.website ?? ""}
          onChange={(e) => setDraft({ ...draft, website: e.target.value })}
          placeholder="Site web (https://…)"
          className="bg-cream border border-ink/12 rounded-xl px-3 py-2 text-sm focus:border-copper focus:outline-none"
        />
        <input
          value={draft.vatNumber ?? ""}
          onChange={(e) => setDraft({ ...draft, vatNumber: e.target.value })}
          placeholder="N° TVA"
          className="bg-cream border border-ink/12 rounded-xl px-3 py-2 text-sm font-mono focus:border-copper focus:outline-none"
        />
        <input
          type="number"
          value={draft.leadTimeDays ?? ""}
          onChange={(e) =>
            setDraft({
              ...draft,
              leadTimeDays: e.target.value
                ? Number(e.target.value)
                : undefined,
            })
          }
          placeholder="Délai moyen (jours)"
          className="bg-cream border border-ink/12 rounded-xl px-3 py-2 text-sm font-mono focus:border-copper focus:outline-none"
        />
        <input
          value={draft.paymentTerms ?? ""}
          onChange={(e) =>
            setDraft({ ...draft, paymentTerms: e.target.value })
          }
          placeholder="Conditions paiement (ex : 30 jours net)"
          className="bg-cream border border-ink/12 rounded-xl px-3 py-2 text-sm focus:border-copper focus:outline-none"
        />
        <select
          value={draft.rating ?? ""}
          onChange={(e) =>
            setDraft({
              ...draft,
              rating: e.target.value ? Number(e.target.value) : undefined,
            })
          }
          className="bg-cream border border-ink/12 rounded-xl px-3 py-2 text-sm focus:border-copper focus:outline-none"
        >
          <option value="">Sans rating</option>
          <option value="1">1 ★</option>
          <option value="2">2 ★★</option>
          <option value="3">3 ★★★</option>
          <option value="4">4 ★★★★</option>
          <option value="5">5 ★★★★★</option>
        </select>
        <select
          value={draft.status ?? "active"}
          onChange={(e) =>
            setDraft({
              ...draft,
              status: e.target.value as Supplier["status"],
            })
          }
          className="bg-cream border border-ink/12 rounded-xl px-3 py-2 text-sm focus:border-copper focus:outline-none"
        >
          <option value="active">Actif</option>
          <option value="archived">Archivé</option>
        </select>
      </div>
      <textarea
        rows={2}
        value={draft.address ?? ""}
        onChange={(e) => setDraft({ ...draft, address: e.target.value })}
        placeholder="Adresse"
        className="mt-2 w-full bg-cream border border-ink/12 rounded-xl px-3 py-2 text-sm focus:border-copper focus:outline-none resize-none"
      />
      <textarea
        rows={3}
        value={draft.notes ?? ""}
        onChange={(e) => setDraft({ ...draft, notes: e.target.value })}
        placeholder="Notes internes (conditions négociées, contraintes…)"
        className="mt-2 w-full bg-cream border border-ink/12 rounded-xl px-3 py-2 text-sm focus:border-copper focus:outline-none resize-none"
      />
      <div className="mt-3 flex items-center gap-2">
        <button
          onClick={onSave}
          disabled={busy}
          className="inline-flex items-center gap-1.5 rounded-full bg-ink text-cream px-4 py-2 text-sm hover:bg-copper disabled:opacity-50"
        >
          {busy ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Check className="h-3.5 w-3.5" />
          )}
          {isEdit ? "Enregistrer" : "Créer"}
        </button>
        <button
          onClick={onCancel}
          className="inline-flex items-center gap-1 text-xs text-graphite hover:text-ink"
        >
          <XIcon className="h-3 w-3" />
          Annuler
        </button>
      </div>
    </div>
  );
}

function Kpi({
  icon,
  label,
  value,
  hint,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="rounded-2xl border border-ink/10 bg-white shadow-soft p-5">
      <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-eyebrow text-muted">
        {icon}
        {label}
      </div>
      <div className="mt-2 font-display text-3xl tabular-nums text-ink">
        {value}
      </div>
      {hint && <div className="text-xs text-muted mt-1">{hint}</div>}
    </div>
  );
}
