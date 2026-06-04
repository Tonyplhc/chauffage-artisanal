"use client";

/**
 * Dashboard certifications techniciens — alerte échéances.
 */

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Plus,
  Loader2,
  ShieldCheck,
  AlertTriangle,
  Trash2,
  Check,
  X as XIcon,
  ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";

type Category =
  | "gaz"
  | "frigorigene"
  | "electrique"
  | "securite_hauteur"
  | "amiante"
  | "formation_fabricant"
  | "autre";

const CATEGORY_LABELS: Record<Category, string> = {
  gaz: "Gaz",
  frigorigene: "Frigorigène",
  electrique: "Électrique",
  securite_hauteur: "Sécurité hauteur",
  amiante: "Amiante",
  formation_fabricant: "Formation fabricant",
  autre: "Autre",
};

const CATEGORY_COLORS: Record<Category, string> = {
  gaz: "#dc5a28",
  frigorigene: "#6ba3c5",
  electrique: "#d4a017",
  securite_hauteur: "#b86a36",
  amiante: "#8b847a",
  formation_fabricant: "#7a5cc6",
  autre: "#8b847a",
};

type Cert = {
  id: string;
  techEmail: string;
  techName: string;
  name: string;
  category: Category;
  issuingBody?: string;
  issuedAt: string;
  expiresAt?: string;
  evidenceUrl?: string;
  notes?: string;
};

type Stats = {
  total: number;
  expiringSoon: number;
  expired: number;
  byCategory: Record<Category, number>;
};

export default function CertificationsPage() {
  const router = useRouter();
  const [certs, setCerts] = useState<Cert[] | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [creating, setCreating] = useState(false);
  const [draft, setDraft] = useState<Partial<Cert>>({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const res = await fetch("/api/admin/certifications", { cache: "no-store" });
    if (res.status === 401) {
      router.replace("/admin/login");
      return;
    }
    if (res.ok) {
      const d = await res.json();
      setCerts(d.certifications ?? []);
      setStats(d.stats);
    }
  }, [router]);

  useEffect(() => {
    load();
  }, [load]);

  const save = async () => {
    if (!draft.techEmail || !draft.name || !draft.category || !draft.issuedAt) {
      setError("Tech, nom, catégorie et date d'émission requis");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/certifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...draft,
          techName: draft.techName || draft.techEmail,
        }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error ?? "Erreur");
      setCreating(false);
      setDraft({});
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setBusy(false);
    }
  };

  const remove = async (id: string, name: string) => {
    if (!confirm(`Supprimer ${name} ?`)) return;
    await fetch(`/api/admin/certifications/${id}`, { method: "DELETE" });
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
              Certifications
            </h1>
            <p className="mt-2 text-graphite">
              Suivi habilitations gaz, frigorigène, électrique, sécurité.
              Alerte sous 60 jours.
            </p>
          </div>
          {!creating && (
            <button
              onClick={() => {
                setCreating(true);
                setDraft({ category: "gaz" });
              }}
              className="inline-flex items-center gap-2 rounded-full bg-ink text-cream px-5 py-2.5 text-sm hover:bg-copper"
            >
              <Plus className="h-4 w-4" />
              Nouvelle certif
            </button>
          )}
        </div>

        {stats && (
          <div className="grid lg:grid-cols-3 gap-4 mb-8">
            <Kpi
              label="Total"
              value={stats.total}
              icon={<ShieldCheck className="h-4 w-4" />}
            />
            <Kpi
              label="Expire sous 60 j"
              value={stats.expiringSoon}
              color={stats.expiringSoon > 0 ? "#b86a36" : undefined}
              icon={<AlertTriangle className="h-4 w-4" />}
            />
            <Kpi
              label="Expirées"
              value={stats.expired}
              color={stats.expired > 0 ? "#dc5a28" : undefined}
              icon={<XIcon className="h-4 w-4" />}
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
            <div className="grid lg:grid-cols-2 gap-2">
              <input
                value={draft.techEmail ?? ""}
                onChange={(e) =>
                  setDraft({ ...draft, techEmail: e.target.value })
                }
                placeholder="Email technicien"
                className="bg-cream border border-ink/12 rounded-xl px-3 py-2 text-sm focus:border-copper focus:outline-none"
              />
              <input
                value={draft.techName ?? ""}
                onChange={(e) =>
                  setDraft({ ...draft, techName: e.target.value })
                }
                placeholder="Nom affiché"
                className="bg-cream border border-ink/12 rounded-xl px-3 py-2 text-sm focus:border-copper focus:outline-none"
              />
              <input
                value={draft.name ?? ""}
                onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                placeholder="Nom de la certif"
                className="bg-cream border border-ink/12 rounded-xl px-3 py-2 text-sm focus:border-copper focus:outline-none"
              />
              <select
                value={draft.category ?? "gaz"}
                onChange={(e) =>
                  setDraft({ ...draft, category: e.target.value as Category })
                }
                className="bg-cream border border-ink/12 rounded-xl px-3 py-2 text-sm focus:border-copper focus:outline-none"
              >
                {(Object.entries(CATEGORY_LABELS) as [Category, string][]).map(
                  ([k, label]) => (
                    <option key={k} value={k}>
                      {label}
                    </option>
                  ),
                )}
              </select>
              <input
                value={draft.issuingBody ?? ""}
                onChange={(e) =>
                  setDraft({ ...draft, issuingBody: e.target.value })
                }
                placeholder="Organisme émetteur"
                className="bg-cream border border-ink/12 rounded-xl px-3 py-2 text-sm focus:border-copper focus:outline-none"
              />
              <input
                value={draft.evidenceUrl ?? ""}
                onChange={(e) =>
                  setDraft({ ...draft, evidenceUrl: e.target.value })
                }
                placeholder="URL justificatif (PDF)"
                className="bg-cream border border-ink/12 rounded-xl px-3 py-2 text-xs font-mono focus:border-copper focus:outline-none"
              />
              <label className="text-[11px] text-graphite">
                Date d&apos;émission
                <input
                  type="date"
                  value={draft.issuedAt?.slice(0, 10) ?? ""}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      issuedAt: e.target.value
                        ? new Date(e.target.value).toISOString()
                        : undefined,
                    })
                  }
                  className="mt-1 w-full bg-cream border border-ink/12 rounded-xl px-3 py-1.5 text-sm focus:border-copper focus:outline-none"
                />
              </label>
              <label className="text-[11px] text-graphite">
                Expiration (optionnel)
                <input
                  type="date"
                  value={draft.expiresAt?.slice(0, 10) ?? ""}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      expiresAt: e.target.value
                        ? new Date(e.target.value).toISOString()
                        : undefined,
                    })
                  }
                  className="mt-1 w-full bg-cream border border-ink/12 rounded-xl px-3 py-1.5 text-sm focus:border-copper focus:outline-none"
                />
              </label>
            </div>
            <div className="mt-3 flex items-center gap-2">
              <button
                onClick={save}
                disabled={busy}
                className="inline-flex items-center gap-1.5 rounded-full bg-ink text-cream px-4 py-2 text-sm hover:bg-copper disabled:opacity-50"
              >
                {busy ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Check className="h-3.5 w-3.5" />
                )}
                Enregistrer
              </button>
              <button
                onClick={() => {
                  setCreating(false);
                  setError(null);
                  setDraft({});
                }}
                className="text-xs text-graphite hover:text-ink"
              >
                Annuler
              </button>
            </div>
          </div>
        )}

        {certs === null ? (
          <div className="py-16 text-center text-muted">
            <Loader2 className="h-6 w-6 animate-spin mx-auto" />
          </div>
        ) : certs.length === 0 ? (
          <div className="rounded-2xl border border-ink/10 bg-white shadow-soft py-16 text-center text-muted">
            <ShieldCheck className="h-12 w-12 mx-auto opacity-20 text-copper mb-2" />
            <p>Aucune certification.</p>
          </div>
        ) : (
          <ul className="grid gap-3">
            {certs.map((c) => {
              const expired =
                c.expiresAt &&
                new Date(c.expiresAt).getTime() < Date.now();
              const soon =
                c.expiresAt &&
                !expired &&
                new Date(c.expiresAt).getTime() <
                  Date.now() + 60 * 86_400_000;
              return (
                <li
                  key={c.id}
                  className={cn(
                    "rounded-2xl border p-4 bg-white shadow-soft",
                    expired
                      ? "border-ember/30 bg-ember/5"
                      : soon
                        ? "border-copper/30 bg-copper/5"
                        : "border-ink/10",
                  )}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className="h-10 w-10 rounded-full grid place-items-center shrink-0"
                      style={{
                        background: `${CATEGORY_COLORS[c.category]}1c`,
                        color: CATEGORY_COLORS[c.category],
                      }}
                    >
                      <ShieldCheck className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium text-ink">
                        {c.name}
                      </div>
                      <div className="text-xs text-graphite mt-0.5">
                        {c.techName} · {c.techEmail}
                      </div>
                      <div className="mt-1 flex items-center gap-2 flex-wrap text-[11px]">
                        <span
                          className="text-[10px] font-mono uppercase tracking-eyebrow px-2 py-0.5 rounded-full"
                          style={{
                            background: `${CATEGORY_COLORS[c.category]}1c`,
                            color: CATEGORY_COLORS[c.category],
                          }}
                        >
                          {CATEGORY_LABELS[c.category]}
                        </span>
                        {c.issuingBody && (
                          <span className="text-muted">{c.issuingBody}</span>
                        )}
                      </div>
                      <div className="mt-2 text-[11px] font-mono text-muted">
                        Émise le{" "}
                        {new Date(c.issuedAt).toLocaleDateString("fr-FR", {
                          dateStyle: "medium",
                        })}
                        {c.expiresAt && (
                          <span
                            className={cn(
                              "ml-2",
                              expired
                                ? "text-ember font-medium"
                                : soon
                                  ? "text-copper font-medium"
                                  : "",
                            )}
                          >
                            · {expired ? "Expirée le" : "Expire le"}{" "}
                            {new Date(c.expiresAt).toLocaleDateString(
                              "fr-FR",
                              { dateStyle: "medium" },
                            )}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      {c.evidenceUrl && (
                        <a
                          href={c.evidenceUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="h-7 w-7 grid place-items-center rounded-full bg-cream border border-ink/8 text-graphite hover:bg-ink hover:text-cream"
                        >
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      )}
                      <button
                        onClick={() => remove(c.id, c.name)}
                        className="h-7 w-7 grid place-items-center rounded-full bg-cream border border-ember/30 text-ember hover:bg-ember hover:text-cream"
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
      </div>
    </div>
  );
}

function Kpi({
  label,
  value,
  color,
  icon,
}: {
  label: string;
  value: number;
  color?: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-ink/10 bg-white shadow-soft p-5">
      <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-eyebrow text-muted">
        {icon}
        {label}
      </div>
      <div
        className="mt-2 font-display text-3xl tabular-nums"
        style={{ color: color ?? "#1e1a15" }}
      >
        {value}
      </div>
    </div>
  );
}
