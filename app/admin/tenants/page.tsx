"use client";

/**
 * Gestion multi-marque / white-label.
 *
 * Permet à un groupe ou un MSP de gérer plusieurs marques (sociétés) sur la
 * même base de données. Chaque tenant a son branding (couleurs, logo) et ses
 * informations légales (adresse, TVA, IBAN). Une marque est marquée "default" —
 * c'est celle utilisée sur les pages publiques en V1.
 *
 * La sélection du tenant actif côté admin se fait via cookie `ca-tenant` posé
 * par POST /api/admin/tenants/switch.
 */

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Plus,
  Loader2,
  Check,
  X as XIcon,
  Building2,
  Trash2,
  Edit2,
  Star,
  Power,
  PowerOff,
} from "lucide-react";
import { cn } from "@/lib/utils";

type Tenant = {
  id: string;
  slug: string;
  name: string;
  legalName?: string;
  description?: string;
  branding: {
    primaryColor: string;
    secondaryColor: string;
    accentColor: string;
    logoUrl?: string;
  };
  legal: {
    address?: string;
    phone?: string;
    email?: string;
    vatNumber?: string;
    rcsNumber?: string;
    ibanMasked?: string;
    website?: string;
  };
  isActive: boolean;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
};

type Draft = {
  name: string;
  legalName: string;
  description: string;
  branding: {
    primaryColor: string;
    secondaryColor: string;
    accentColor: string;
    logoUrl: string;
  };
  legal: {
    address: string;
    phone: string;
    email: string;
    vatNumber: string;
    rcsNumber: string;
    ibanMasked: string;
    website: string;
  };
  isDefault: boolean;
};

const EMPTY_DRAFT: Draft = {
  name: "",
  legalName: "",
  description: "",
  branding: {
    primaryColor: "#1e1a15",
    secondaryColor: "#b86a36",
    accentColor: "#22a06b",
    logoUrl: "",
  },
  legal: {
    address: "",
    phone: "",
    email: "",
    vatNumber: "",
    rcsNumber: "",
    ibanMasked: "",
    website: "",
  },
  isDefault: false,
};

const TENANT_COOKIE = "ca-tenant";

function readTenantCookie(): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie
    .split(";")
    .map((c) => c.trim())
    .find((c) => c.startsWith(`${TENANT_COOKIE}=`));
  return match ? decodeURIComponent(match.split("=")[1]) : null;
}

export default function TenantsAdminPage() {
  const router = useRouter();
  const [tenants, setTenants] = useState<Tenant[] | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [draft, setDraft] = useState<Draft>(EMPTY_DRAFT);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<Draft>(EMPTY_DRAFT);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const res = await fetch("/api/admin/tenants", { cache: "no-store" });
    if (res.status === 401) {
      router.replace("/admin/login");
      return;
    }
    if (res.ok) {
      const data = await res.json();
      setTenants(data.tenants ?? []);
    }
  }, [router]);

  useEffect(() => {
    load();
    setActiveId(readTenantCookie());
  }, [load]);

  const createTenant = async () => {
    if (!draft.name.trim()) {
      setError("Nom requis");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/tenants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(draft),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Erreur");
      setCreating(false);
      setDraft(EMPTY_DRAFT);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setBusy(false);
    }
  };

  const startEdit = (t: Tenant) => {
    setEditingId(t.id);
    setEditDraft({
      name: t.name,
      legalName: t.legalName ?? "",
      description: t.description ?? "",
      branding: {
        primaryColor: t.branding.primaryColor,
        secondaryColor: t.branding.secondaryColor,
        accentColor: t.branding.accentColor,
        logoUrl: t.branding.logoUrl ?? "",
      },
      legal: {
        address: t.legal.address ?? "",
        phone: t.legal.phone ?? "",
        email: t.legal.email ?? "",
        vatNumber: t.legal.vatNumber ?? "",
        rcsNumber: t.legal.rcsNumber ?? "",
        ibanMasked: t.legal.ibanMasked ?? "",
        website: t.legal.website ?? "",
      },
      isDefault: t.isDefault,
    });
  };

  const saveEdit = async () => {
    if (!editingId) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/tenants/${editingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editDraft),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Erreur");
      setEditingId(null);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setBusy(false);
    }
  };

  const toggleActive = async (t: Tenant) => {
    setBusy(true);
    try {
      await fetch(`/api/admin/tenants/${t.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !t.isActive }),
      });
      await load();
    } finally {
      setBusy(false);
    }
  };

  const promoteDefault = async (t: Tenant) => {
    setBusy(true);
    try {
      await fetch(`/api/admin/tenants/${t.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isDefault: true }),
      });
      await load();
    } finally {
      setBusy(false);
    }
  };

  const switchActive = async (t: Tenant) => {
    setBusy(true);
    try {
      const res = await fetch("/api/admin/tenants/switch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: t.id }),
      });
      if (res.ok) setActiveId(t.id);
    } finally {
      setBusy(false);
    }
  };

  const removeTenant = async (t: Tenant) => {
    if (
      !confirm(
        `Supprimer la marque "${t.name}" ? Les données liées (leads, devis, factures) restent intactes mais perdent leur rattachement.`,
      )
    ) {
      return;
    }
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/tenants/${t.id}`, {
        method: "DELETE",
      });
      if (res.ok) await load();
    } finally {
      setBusy(false);
    }
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

        <div className="flex items-start justify-between gap-3 flex-wrap mb-8">
          <div>
            <h1 className="font-display text-display-md text-ink">
              Marques blanches
            </h1>
            <p className="mt-2 text-graphite max-w-2xl">
              Gestion multi-marque pour groupes ou exploitation en marque
              blanche (MSP). Chaque marque a son branding et ses informations
              légales. La marque « défaut » est utilisée sur les pages
              publiques.
            </p>
          </div>
          <button
            onClick={() => {
              setCreating(true);
              setDraft(EMPTY_DRAFT);
              setError(null);
            }}
            className="inline-flex items-center gap-2 bg-ink text-cream px-4 py-2 rounded-full text-sm hover:bg-copper transition-colors"
          >
            <Plus className="h-4 w-4" />
            Nouvelle marque
          </button>
        </div>

        {error && (
          <div className="mb-4 rounded-xl border border-ember/30 bg-ember/5 px-4 py-3 text-sm text-ember">
            {error}
          </div>
        )}

        {creating && (
          <DraftForm
            title="Nouvelle marque blanche"
            draft={draft}
            setDraft={setDraft}
            busy={busy}
            onSave={createTenant}
            onCancel={() => {
              setCreating(false);
              setError(null);
            }}
          />
        )}

        {tenants === null ? (
          <div className="py-16 text-center text-muted">
            <Loader2 className="h-6 w-6 animate-spin mx-auto" />
          </div>
        ) : tenants.length === 0 && !creating ? (
          <div className="rounded-2xl border border-dashed border-ink/15 bg-white py-16 text-center">
            <Building2 className="h-12 w-12 mx-auto text-copper opacity-30 mb-3" />
            <p className="text-graphite">
              Aucune marque blanche. Créez-en une pour commencer.
            </p>
          </div>
        ) : (
          <ul className="grid gap-4">
            {tenants?.map((t) =>
              editingId === t.id ? (
                <li key={t.id}>
                  <DraftForm
                    title={`Édition — ${t.name}`}
                    draft={editDraft}
                    setDraft={setEditDraft}
                    busy={busy}
                    onSave={saveEdit}
                    onCancel={() => {
                      setEditingId(null);
                      setError(null);
                    }}
                  />
                </li>
              ) : (
                <li
                  key={t.id}
                  className={cn(
                    "rounded-2xl border bg-white shadow-soft overflow-hidden",
                    t.isActive ? "border-ink/10" : "border-ink/8 opacity-70",
                  )}
                >
                  <div
                    className="h-2"
                    style={{
                      background: `linear-gradient(90deg, ${t.branding.primaryColor} 0%, ${t.branding.secondaryColor} 50%, ${t.branding.accentColor} 100%)`,
                    }}
                  />
                  <div className="p-5">
                    <div className="flex items-start justify-between gap-3 flex-wrap">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h2 className="font-display text-xl text-ink">
                            {t.name}
                          </h2>
                          {t.isDefault && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-mono uppercase tracking-eyebrow bg-copper/10 text-copper px-2 py-0.5 rounded-full">
                              <Star className="h-2.5 w-2.5" />
                              Défaut
                            </span>
                          )}
                          {activeId === t.id && (
                            <span className="text-[10px] font-mono uppercase tracking-eyebrow bg-[#22a06b]/10 text-[#22a06b] px-2 py-0.5 rounded-full">
                              Actif (cookie)
                            </span>
                          )}
                          {!t.isActive && (
                            <span className="text-[10px] font-mono uppercase tracking-eyebrow bg-ink/5 text-graphite px-2 py-0.5 rounded-full">
                              Désactivé
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted font-mono mt-1">
                          {t.slug}
                        </p>
                        {t.legalName && (
                          <p className="text-sm text-graphite mt-1">
                            {t.legalName}
                          </p>
                        )}
                        {t.description && (
                          <p className="text-sm text-graphite mt-2 max-w-xl">
                            {t.description}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-1 flex-wrap justify-end">
                        {activeId !== t.id && t.isActive && (
                          <button
                            onClick={() => switchActive(t)}
                            disabled={busy}
                            className="inline-flex items-center gap-1 text-xs px-3 py-1.5 rounded-full bg-ink text-cream hover:bg-copper transition-colors"
                          >
                            Activer
                          </button>
                        )}
                        {!t.isDefault && t.isActive && (
                          <button
                            onClick={() => promoteDefault(t)}
                            disabled={busy}
                            title="Définir comme marque par défaut"
                            className="inline-flex items-center gap-1 text-xs px-3 py-1.5 rounded-full bg-cream border border-ink/10 text-graphite hover:border-copper/40"
                          >
                            <Star className="h-3 w-3" />
                            Défaut
                          </button>
                        )}
                        <button
                          onClick={() => toggleActive(t)}
                          disabled={busy}
                          title={t.isActive ? "Désactiver" : "Réactiver"}
                          className="inline-flex items-center gap-1 text-xs px-3 py-1.5 rounded-full bg-cream border border-ink/10 text-graphite hover:border-copper/40"
                        >
                          {t.isActive ? (
                            <PowerOff className="h-3 w-3" />
                          ) : (
                            <Power className="h-3 w-3" />
                          )}
                          {t.isActive ? "Désactiver" : "Réactiver"}
                        </button>
                        <button
                          onClick={() => startEdit(t)}
                          className="inline-flex items-center gap-1 text-xs px-3 py-1.5 rounded-full bg-cream border border-ink/10 text-graphite hover:border-copper/40"
                        >
                          <Edit2 className="h-3 w-3" />
                          Éditer
                        </button>
                        {!t.isDefault && (
                          <button
                            onClick={() => removeTenant(t)}
                            disabled={busy}
                            className="inline-flex items-center gap-1 text-xs px-3 py-1.5 rounded-full bg-cream border border-ember/30 text-ember hover:bg-ember/5"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="grid lg:grid-cols-2 gap-4 mt-5">
                      <div className="rounded-xl bg-cream/40 p-4">
                        <div className="font-mono text-[10px] uppercase tracking-eyebrow text-copper mb-2">
                          Branding
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <Swatch
                            label="Primaire"
                            color={t.branding.primaryColor}
                          />
                          <Swatch
                            label="Secondaire"
                            color={t.branding.secondaryColor}
                          />
                          <Swatch
                            label="Accent"
                            color={t.branding.accentColor}
                          />
                        </div>
                        {t.branding.logoUrl && (
                          <p className="text-[11px] text-muted mt-2 truncate font-mono">
                            Logo : {t.branding.logoUrl}
                          </p>
                        )}
                      </div>
                      <div className="rounded-xl bg-cream/40 p-4 text-xs text-graphite space-y-1">
                        <div className="font-mono text-[10px] uppercase tracking-eyebrow text-copper mb-2">
                          Informations légales
                        </div>
                        {t.legal.address && (
                          <p>
                            <span className="text-muted">Adresse :</span>{" "}
                            {t.legal.address}
                          </p>
                        )}
                        {t.legal.phone && (
                          <p>
                            <span className="text-muted">Tél :</span>{" "}
                            {t.legal.phone}
                          </p>
                        )}
                        {t.legal.email && (
                          <p>
                            <span className="text-muted">Email :</span>{" "}
                            {t.legal.email}
                          </p>
                        )}
                        {t.legal.vatNumber && (
                          <p>
                            <span className="text-muted">TVA :</span>{" "}
                            {t.legal.vatNumber}
                          </p>
                        )}
                        {t.legal.rcsNumber && (
                          <p>
                            <span className="text-muted">RCS :</span>{" "}
                            {t.legal.rcsNumber}
                          </p>
                        )}
                        {t.legal.ibanMasked && (
                          <p>
                            <span className="text-muted">IBAN :</span>{" "}
                            <span className="font-mono">
                              {t.legal.ibanMasked}
                            </span>
                          </p>
                        )}
                        {t.legal.website && (
                          <p>
                            <span className="text-muted">Site :</span>{" "}
                            {t.legal.website}
                          </p>
                        )}
                        {!t.legal.address &&
                          !t.legal.phone &&
                          !t.legal.email &&
                          !t.legal.vatNumber &&
                          !t.legal.rcsNumber && (
                            <p className="text-muted">
                              Aucune information saisie.
                            </p>
                          )}
                      </div>
                    </div>
                  </div>
                </li>
              ),
            )}
          </ul>
        )}

        <p className="mt-6 text-xs text-muted max-w-3xl">
          V1 : la marque par défaut alimente les pages publiques. La sélection
          côté admin (cookie) permet de filtrer manuellement. Pages publiques
          multi-domaine et rattachement automatique des leads à venir dans une
          itération future.
        </p>
      </div>
    </div>
  );
}

function Swatch({ label, color }: { label: string; color: string }) {
  return (
    <div className="inline-flex items-center gap-1.5">
      <span
        className="inline-block h-6 w-6 rounded-md border border-ink/10 shadow-soft"
        style={{ background: color }}
      />
      <div className="text-[10px] leading-tight">
        <div className="text-muted">{label}</div>
        <div className="font-mono text-ink">{color}</div>
      </div>
    </div>
  );
}

function DraftForm({
  title,
  draft,
  setDraft,
  busy,
  onSave,
  onCancel,
}: {
  title: string;
  draft: Draft;
  setDraft: (d: Draft) => void;
  busy: boolean;
  onSave: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="rounded-2xl border border-ink/10 bg-white shadow-soft p-5 mb-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-display text-lg text-ink">{title}</h2>
        <div className="flex items-center gap-2">
          <button
            onClick={onCancel}
            disabled={busy}
            className="inline-flex items-center gap-1 text-xs px-3 py-1.5 rounded-full bg-cream border border-ink/10 text-graphite hover:border-copper/40"
          >
            <XIcon className="h-3 w-3" />
            Annuler
          </button>
          <button
            onClick={onSave}
            disabled={busy}
            className="inline-flex items-center gap-1 text-xs px-3 py-1.5 rounded-full bg-ink text-cream hover:bg-copper transition-colors"
          >
            {busy ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <Check className="h-3 w-3" />
            )}
            Enregistrer
          </button>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-x-6 gap-y-3">
        <Field label="Nom commercial *">
          <input
            value={draft.name}
            onChange={(e) => setDraft({ ...draft, name: e.target.value })}
            placeholder="Chauffage Artisanal"
            className="w-full bg-cream border border-ink/12 rounded-lg px-3 py-1.5 text-sm focus:border-copper focus:outline-none"
          />
        </Field>
        <Field label="Raison sociale">
          <input
            value={draft.legalName}
            onChange={(e) => setDraft({ ...draft, legalName: e.target.value })}
            placeholder="Chauffage Artisanal SARL"
            className="w-full bg-cream border border-ink/12 rounded-lg px-3 py-1.5 text-sm focus:border-copper focus:outline-none"
          />
        </Field>
        <Field label="Description" full>
          <textarea
            value={draft.description}
            onChange={(e) =>
              setDraft({ ...draft, description: e.target.value })
            }
            rows={2}
            placeholder="Court positionnement de la marque…"
            className="w-full bg-cream border border-ink/12 rounded-lg px-3 py-1.5 text-sm focus:border-copper focus:outline-none"
          />
        </Field>
      </div>

      <div className="mt-5">
        <div className="font-mono text-[10px] uppercase tracking-eyebrow text-copper mb-2">
          Branding
        </div>
        <div className="grid lg:grid-cols-4 gap-3">
          <ColorField
            label="Couleur primaire"
            value={draft.branding.primaryColor}
            onChange={(v) =>
              setDraft({
                ...draft,
                branding: { ...draft.branding, primaryColor: v },
              })
            }
          />
          <ColorField
            label="Couleur secondaire"
            value={draft.branding.secondaryColor}
            onChange={(v) =>
              setDraft({
                ...draft,
                branding: { ...draft.branding, secondaryColor: v },
              })
            }
          />
          <ColorField
            label="Couleur accent"
            value={draft.branding.accentColor}
            onChange={(v) =>
              setDraft({
                ...draft,
                branding: { ...draft.branding, accentColor: v },
              })
            }
          />
          <Field label="URL logo (optionnel)">
            <input
              value={draft.branding.logoUrl}
              onChange={(e) =>
                setDraft({
                  ...draft,
                  branding: { ...draft.branding, logoUrl: e.target.value },
                })
              }
              placeholder="/logo-tenant.svg"
              className="w-full bg-cream border border-ink/12 rounded-lg px-3 py-1.5 text-sm focus:border-copper focus:outline-none"
            />
          </Field>
        </div>
      </div>

      <div className="mt-5">
        <div className="font-mono text-[10px] uppercase tracking-eyebrow text-copper mb-2">
          Informations légales
        </div>
        <div className="grid lg:grid-cols-2 gap-x-6 gap-y-3">
          <Field label="Adresse">
            <input
              value={draft.legal.address}
              onChange={(e) =>
                setDraft({
                  ...draft,
                  legal: { ...draft.legal, address: e.target.value },
                })
              }
              className="w-full bg-cream border border-ink/12 rounded-lg px-3 py-1.5 text-sm focus:border-copper focus:outline-none"
            />
          </Field>
          <Field label="Téléphone">
            <input
              value={draft.legal.phone}
              onChange={(e) =>
                setDraft({
                  ...draft,
                  legal: { ...draft.legal, phone: e.target.value },
                })
              }
              className="w-full bg-cream border border-ink/12 rounded-lg px-3 py-1.5 text-sm focus:border-copper focus:outline-none"
            />
          </Field>
          <Field label="Email contact">
            <input
              value={draft.legal.email}
              type="email"
              onChange={(e) =>
                setDraft({
                  ...draft,
                  legal: { ...draft.legal, email: e.target.value },
                })
              }
              className="w-full bg-cream border border-ink/12 rounded-lg px-3 py-1.5 text-sm focus:border-copper focus:outline-none"
            />
          </Field>
          <Field label="Site web">
            <input
              value={draft.legal.website}
              onChange={(e) =>
                setDraft({
                  ...draft,
                  legal: { ...draft.legal, website: e.target.value },
                })
              }
              placeholder="https://…"
              className="w-full bg-cream border border-ink/12 rounded-lg px-3 py-1.5 text-sm focus:border-copper focus:outline-none"
            />
          </Field>
          <Field label="N° TVA">
            <input
              value={draft.legal.vatNumber}
              onChange={(e) =>
                setDraft({
                  ...draft,
                  legal: { ...draft.legal, vatNumber: e.target.value },
                })
              }
              placeholder="LU…"
              className="w-full bg-cream border border-ink/12 rounded-lg px-3 py-1.5 text-sm font-mono focus:border-copper focus:outline-none"
            />
          </Field>
          <Field label="N° RCS / registre">
            <input
              value={draft.legal.rcsNumber}
              onChange={(e) =>
                setDraft({
                  ...draft,
                  legal: { ...draft.legal, rcsNumber: e.target.value },
                })
              }
              className="w-full bg-cream border border-ink/12 rounded-lg px-3 py-1.5 text-sm font-mono focus:border-copper focus:outline-none"
            />
          </Field>
          <Field label="IBAN masqué (ex. LU•• •••• ••••)">
            <input
              value={draft.legal.ibanMasked}
              onChange={(e) =>
                setDraft({
                  ...draft,
                  legal: { ...draft.legal, ibanMasked: e.target.value },
                })
              }
              className="w-full bg-cream border border-ink/12 rounded-lg px-3 py-1.5 text-sm font-mono focus:border-copper focus:outline-none"
            />
          </Field>
        </div>
      </div>

      <label className="mt-4 inline-flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={draft.isDefault}
          onChange={(e) => setDraft({ ...draft, isDefault: e.target.checked })}
        />
        <span className="text-sm text-graphite">
          Marque par défaut (utilisée sur les pages publiques)
        </span>
      </label>
    </div>
  );
}

function Field({
  label,
  children,
  full,
}: {
  label: string;
  children: React.ReactNode;
  full?: boolean;
}) {
  return (
    <div className={full ? "lg:col-span-2" : undefined}>
      <div className="font-mono text-[10px] uppercase tracking-eyebrow text-graphite mb-1">
        {label}
      </div>
      {children}
    </div>
  );
}

function ColorField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <div className="font-mono text-[10px] uppercase tracking-eyebrow text-graphite mb-1">
        {label}
      </div>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-9 w-12 cursor-pointer rounded-md border border-ink/12 bg-white"
        />
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 bg-cream border border-ink/12 rounded-lg px-3 py-1.5 text-sm font-mono focus:border-copper focus:outline-none"
        />
      </div>
    </div>
  );
}
