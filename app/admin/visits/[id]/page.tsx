"use client";

/**
 * Éditeur de compte-rendu de visite d'entretien.
 *
 * Sections : checklist (OK/Attention/KO + commentaire), mesures, pièces
 * remplacées, recommandations. Bouton "Finaliser" qui verrouille. Impression
 * via CSS print.
 */

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import {
  ArrowLeft,
  Loader2,
  Save,
  Check,
  X as XIcon,
  Plus,
  Trash2,
  Printer,
  ShieldCheck,
  AlertTriangle,
  XOctagon,
  Lock,
  RotateCcw,
  MessageSquarePlus,
  Clock3,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { SignaturePad } from "@/components/admin/signature-pad";

type ChecklistItem = {
  key: string;
  label: string;
  status: "ok" | "warn" | "ko";
  comment?: string;
};

type Measurement = {
  key: string;
  label: string;
  value: string;
  unit?: string;
};

type Part = {
  description: string;
  quantity: number;
  reference?: string;
};

type InterventionNote = {
  id: string;
  at: string;
  text: string;
  author?: string;
};

type ClientSignature = {
  dataUrl: string;
  signerName: string;
  signedAt: string;
};

type Visit = {
  id: string;
  contractId?: string;
  leadReference: string;
  type: "entretien" | "depannage" | "pose" | "diagnostic";
  visitedAt: string;
  technicianEmail?: string;
  durationMin?: number;
  checklist: ChecklistItem[];
  measurements: Measurement[];
  partsReplaced: Part[];
  recommendations?: string;
  observations?: string;
  interventionNotes?: InterventionNote[];
  clientSignature?: ClientSignature;
  status: "draft" | "finalized";
  finalizedAt?: string;
};

const STATUS_LABELS = {
  ok: "Conforme",
  warn: "Attention",
  ko: "Non conforme",
};

const STATUS_COLORS = {
  ok: "#22a06b",
  warn: "#b86a36",
  ko: "#dc5a28",
};

export default function VisitEditorPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const [visit, setVisit] = useState<Visit | null>(null);
  const [loadError, setLoadError] = useState<"notfound" | "network" | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [dirty, setDirty] = useState(false);
  /** Erreur de sauvegarde affichée à l'utilisateur (toast). */
  const [saveError, setSaveError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const res = await fetch(`/api/admin/visits/${params.id}`, {
        cache: "no-store",
      });
      if (res.status === 401) {
        router.replace("/admin/login");
        return;
      }
      if (res.status === 404) {
        // Fallback : si on vient de créer cette visite à l'instant, le
        // POST a renvoyé l'objet et on l'a mis en sessionStorage. Sur
        // Vercel, l'instance Lambda du GET peut être différente → memory
        // vide → 404. On lit le cache local pour ne pas perdre la visite.
        try {
          const cached = sessionStorage.getItem(`visit:${params.id}`);
          if (cached) {
            const v = JSON.parse(cached) as Visit;
            setVisit(v);
            setDirty(true); // forcer un save pour la repousser en mémoire serveur
            return;
          }
        } catch {}
        setLoadError("notfound");
        return;
      }
      if (res.ok) {
        const d = await res.json();
        setVisit(d.visit);
        setDirty(false);
        // Met à jour le cache (utile en cas de re-load après cold start)
        try {
          sessionStorage.setItem(
            `visit:${params.id}`,
            JSON.stringify(d.visit),
          );
        } catch {}
        return;
      }
      setLoadError("network");
    } catch {
      setLoadError("network");
    } finally {
      setLoading(false);
    }
  }, [params.id, router]);

  useEffect(() => {
    load();
  }, [load]);

  const save = async (
    patch?: Partial<Omit<Visit, "clientSignature">> & {
      clientSignature?: ClientSignature | null;
    },
  ) => {
    if (!visit) return;
    setBusy(true);
    setSaveError(null);
    try {
      const body =
        patch ?? {
          visitedAt: visit.visitedAt,
          technicianEmail: visit.technicianEmail,
          durationMin: visit.durationMin,
          checklist: visit.checklist,
          measurements: visit.measurements,
          partsReplaced: visit.partsReplaced,
          recommendations: visit.recommendations,
          observations: visit.observations,
          interventionNotes: visit.interventionNotes,
          clientSignature: visit.clientSignature,
        };

      // 1) Tentative PATCH classique
      const res = await fetch(`/api/admin/visits/${params.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        const d = await res.json();
        setVisit(d.visit);
        setDirty(false);
        try {
          sessionStorage.setItem(
            `visit:${params.id}`,
            JSON.stringify(d.visit),
          );
        } catch {}
        return;
      }

      // 2) 404 → cold-start Vercel : la mémoire Lambda n'a plus la visite.
      // Fallback self-healing : PUT upsert avec la visite COMPLÈTE telle
      // qu'on l'a en local (state + patch appliqué).
      if (res.status === 404) {
        // Construit la visite complète : état actuel + patch (avec gestion
        // de la signature qui peut être null pour effacement)
        const sigPatch = (patch as { clientSignature?: ClientSignature | null } | undefined)
          ?.clientSignature;
        const restPatch = { ...(patch ?? {}) } as Partial<Visit>;
        delete (restPatch as { clientSignature?: unknown }).clientSignature;
        const fullVisit: Visit = {
          ...visit,
          ...restPatch,
          // Signature : null = clear, ClientSignature = remplace, undefined = garde
          clientSignature:
            sigPatch === null
              ? undefined
              : sigPatch !== undefined
                ? sigPatch
                : visit.clientSignature,
        };
        // Si la patch demandait status=finalized, mettre à jour finalizedAt
        if (patch?.status === "finalized" && !fullVisit.finalizedAt) {
          fullVisit.finalizedAt = new Date().toISOString();
        } else if (patch?.status === "draft") {
          fullVisit.finalizedAt = undefined;
        }
        const putRes = await fetch(`/api/admin/visits/${params.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(fullVisit),
        });
        if (putRes.ok) {
          const d = await putRes.json();
          setVisit(d.visit);
          setDirty(false);
          try {
            sessionStorage.setItem(
              `visit:${params.id}`,
              JSON.stringify(d.visit),
            );
          } catch {}
          return;
        }
        const errBody = await putRes.json().catch(() => ({}));
        setSaveError(
          errBody?.error
            ? `Echec sauvegarde : ${errBody.error}`
            : "Echec sauvegarde (PUT). Réessaye.",
        );
        return;
      }

      // 3) Autre erreur
      const errBody = await res.json().catch(() => ({}));
      setSaveError(
        errBody?.error
          ? `Echec sauvegarde : ${errBody.error}`
          : `Echec sauvegarde (HTTP ${res.status}). Réessaye.`,
      );
    } catch (e) {
      setSaveError(
        e instanceof Error
          ? `Erreur réseau : ${e.message}`
          : "Erreur réseau inconnue.",
      );
    } finally {
      setBusy(false);
    }
  };

  const update = (patch: Partial<Visit>) => {
    if (!visit) return;
    setVisit({ ...visit, ...patch });
    setDirty(true);
  };

  if (loading && !visit) {
    return (
      <div className="min-h-screen bg-cream grid place-items-center">
        <div className="text-center">
          <Loader2 className="h-6 w-6 animate-spin text-copper mx-auto" />
          <div className="mt-3 text-xs font-mono uppercase tracking-eyebrow text-muted">
            Chargement de l&apos;intervention…
          </div>
        </div>
      </div>
    );
  }

  if (!visit) {
    return (
      <div className="min-h-screen bg-cream py-10 lg:py-14">
        <div className="container max-w-2xl">
          <Link
            href="/admin/visits"
            className="inline-flex items-center gap-2 text-sm font-mono uppercase tracking-eyebrow text-graphite hover:text-copper mb-6"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Retour aux interventions
          </Link>
          <div className="rounded-2xl border border-ink/10 bg-white shadow-soft p-8 lg:p-10 text-center">
            <div className="inline-grid place-items-center h-12 w-12 rounded-full bg-ember/10 text-ember mb-4">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <h1 className="font-display text-2xl text-ink">
              {loadError === "notfound"
                ? "Intervention introuvable"
                : "Impossible de charger l'intervention"}
            </h1>
            <p className="mt-3 text-sm text-graphite leading-relaxed max-w-md mx-auto">
              {loadError === "notfound" ? (
                <>
                  Cette intervention n&apos;existe plus côté serveur. Sur
                  Vercel, les interventions sont stockées en mémoire et
                  peuvent disparaître au prochain « cold start » de
                  l&apos;instance. Pour de la vraie persistance prod, brancher
                  Supabase (variables{" "}
                  <code className="font-mono text-xs bg-ink/5 px-1 py-0.5 rounded">
                    SUPABASE_URL
                  </code>{" "}
                  +{" "}
                  <code className="font-mono text-xs bg-ink/5 px-1 py-0.5 rounded">
                    SUPABASE_SERVICE_ROLE_KEY
                  </code>
                  ).
                </>
              ) : (
                <>
                  Erreur réseau ou serveur. Vérifie ta connexion et réessaie.
                </>
              )}
            </p>
            <div className="mt-6 flex items-center justify-center gap-3 flex-wrap">
              <button
                onClick={load}
                className="inline-flex items-center gap-1.5 rounded-full bg-ink text-cream px-4 py-2 text-sm hover:bg-copper transition-colors"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Réessayer
              </button>
              <Link
                href="/admin/visits"
                className="inline-flex items-center gap-1.5 rounded-full bg-white border border-ink/15 px-4 py-2 text-sm hover:border-copper/40"
              >
                Voir toutes les interventions
              </Link>
            </div>
            <div className="mt-6 font-mono text-[10px] text-muted">
              ID : {params.id}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const isLocked = visit.status === "finalized";

  return (
    <div className="min-h-screen bg-cream py-10 lg:py-14">
      <div className="container max-w-4xl">
        <div className="flex items-center justify-between gap-3 mb-6 print:hidden">
          <Link
            href={`/admin/leads/${visit.leadReference}`}
            className="inline-flex items-center gap-2 text-sm font-mono uppercase tracking-eyebrow text-graphite hover:text-copper"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Retour au dossier
          </Link>
          <div className="flex items-center gap-2 flex-wrap">
            {isLocked ? (
              <button
                onClick={() => save({ status: "draft" })}
                disabled={busy}
                className="inline-flex items-center gap-1.5 rounded-full bg-white border border-ink/15 px-4 py-2 text-sm hover:border-copper/40"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Rouvrir
              </button>
            ) : (
              <>
                <button
                  onClick={() => save()}
                  disabled={busy || !dirty}
                  className="inline-flex items-center gap-1.5 rounded-full bg-ink text-cream px-4 py-2 text-sm hover:bg-copper disabled:opacity-40"
                >
                  {busy ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Save className="h-3.5 w-3.5" />
                  )}
                  Enregistrer
                </button>
                <button
                  onClick={() => save({ status: "finalized" })}
                  disabled={busy}
                  className="inline-flex items-center gap-1.5 rounded-full bg-[#22a06b] text-cream px-4 py-2 text-sm hover:opacity-90"
                >
                  <Lock className="h-3.5 w-3.5" />
                  Finaliser
                </button>
              </>
            )}
            <button
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 rounded-full bg-white border border-ink/15 px-4 py-2 text-sm hover:border-copper/40"
            >
              <Printer className="h-3.5 w-3.5" />
              Imprimer
            </button>
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-ink/10 shadow-soft p-8 lg:p-12 print:shadow-none print:border-0">
          {/* Header */}
          <div className="grid lg:grid-cols-2 gap-6 mb-6 pb-6 border-b border-ink/8">
            <div>
              <div className="font-mono text-[10px] uppercase tracking-eyebrow text-copper">
                Compte-rendu d&apos;intervention
              </div>
              <div className="font-display text-3xl text-ink mt-1">
                {visit.type === "depannage"
                  ? "Dépannage"
                  : visit.type === "pose"
                    ? "Pose / installation"
                    : visit.type === "diagnostic"
                      ? "Diagnostic"
                      : "Entretien"}
              </div>
              <div className="text-xs text-graphite mt-2 font-mono">
                Dossier {visit.leadReference}
              </div>
            </div>
            <div className="text-right text-xs text-graphite">
              <div className="font-mono text-[10px] uppercase tracking-eyebrow text-muted">
                Date
              </div>
              <input
                type="datetime-local"
                value={visit.visitedAt.slice(0, 16)}
                onChange={(e) =>
                  update({
                    visitedAt: new Date(e.target.value).toISOString(),
                  })
                }
                disabled={isLocked}
                className="bg-cream border border-ink/12 rounded-md px-2 py-1 mt-1 text-xs disabled:bg-transparent disabled:border-0 print:bg-transparent print:border-0"
              />
              <div className="mt-2">
                <input
                  value={visit.technicianEmail ?? ""}
                  onChange={(e) =>
                    update({ technicianEmail: e.target.value })
                  }
                  disabled={isLocked}
                  placeholder="Technicien (email)"
                  className="bg-cream border border-ink/12 rounded-md px-2 py-1 text-xs disabled:bg-transparent disabled:border-0 print:bg-transparent print:border-0"
                />
              </div>
              {isLocked && visit.finalizedAt && (
                <div className="mt-2 text-[10px] text-[#22a06b] font-mono">
                  ✓ Finalisé le{" "}
                  {new Date(visit.finalizedAt).toLocaleString("fr-FR")}
                </div>
              )}
            </div>
          </div>

          {/* Checklist */}
          <section className="mb-8">
            <h2 className="font-display text-xl text-ink mb-4">Checklist</h2>
            <ul className="grid gap-2">
              {visit.checklist.map((item, i) => (
                <li
                  key={item.key + i}
                  className="p-3 rounded-xl border border-ink/8 bg-cream/40"
                >
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm text-ink flex-1">
                      {item.label}
                    </span>
                    <div className="flex items-center gap-1 print:gap-2">
                      {(["ok", "warn", "ko"] as const).map((s) => (
                        <button
                          key={s}
                          onClick={() =>
                            update({
                              checklist: visit.checklist.map((c, idx) =>
                                idx === i ? { ...c, status: s } : c,
                              ),
                            })
                          }
                          disabled={isLocked}
                          className={cn(
                            "px-2 py-1 rounded-full text-[10px] font-mono uppercase tracking-eyebrow border transition-colors",
                            item.status === s && "ring-2 ring-offset-1",
                          )}
                          style={
                            item.status === s
                              ? {
                                  background: STATUS_COLORS[s],
                                  color: "#fff",
                                  borderColor: STATUS_COLORS[s],
                                }
                              : {
                                  borderColor: "rgba(42,37,30,0.1)",
                                  color: STATUS_COLORS[s],
                                }
                          }
                        >
                          {s === "ok" ? (
                            <ShieldCheck className="h-2.5 w-2.5 inline mr-1" />
                          ) : s === "warn" ? (
                            <AlertTriangle className="h-2.5 w-2.5 inline mr-1" />
                          ) : (
                            <XOctagon className="h-2.5 w-2.5 inline mr-1" />
                          )}
                          {STATUS_LABELS[s]}
                        </button>
                      ))}
                    </div>
                  </div>
                  <input
                    value={item.comment ?? ""}
                    onChange={(e) =>
                      update({
                        checklist: visit.checklist.map((c, idx) =>
                          idx === i ? { ...c, comment: e.target.value } : c,
                        ),
                      })
                    }
                    disabled={isLocked}
                    placeholder="Commentaire (optionnel)…"
                    className="mt-2 w-full bg-transparent border-0 border-b border-ink/8 px-0 py-1 text-xs focus:outline-none focus:border-copper disabled:opacity-70"
                  />
                </li>
              ))}
            </ul>
          </section>

          {/* Mesures */}
          <section className="mb-8">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-display text-xl text-ink">Mesures</h2>
              <button
                onClick={() =>
                  update({
                    measurements: [
                      ...visit.measurements,
                      { key: `m-${Date.now()}`, label: "", value: "" },
                    ],
                  })
                }
                disabled={isLocked}
                className="inline-flex items-center gap-1 text-xs text-copper hover:underline print:hidden disabled:opacity-50"
              >
                <Plus className="h-3 w-3" />
                Ajouter
              </button>
            </div>
            {visit.measurements.length === 0 ? (
              <p className="text-xs text-muted italic">Aucune mesure.</p>
            ) : (
              <table className="w-full text-sm">
                <tbody>
                  {visit.measurements.map((m, i) => (
                    <tr key={i} className="border-b border-ink/5">
                      <td className="py-1.5 pr-2 w-1/2">
                        <input
                          value={m.label}
                          onChange={(e) =>
                            update({
                              measurements: visit.measurements.map((x, idx) =>
                                idx === i ? { ...x, label: e.target.value } : x,
                              ),
                            })
                          }
                          disabled={isLocked}
                          placeholder="Ex : Pression chauffage"
                          className="w-full bg-transparent text-sm focus:outline-none disabled:opacity-70"
                        />
                      </td>
                      <td className="py-1.5 px-2 w-32">
                        <input
                          value={m.value}
                          onChange={(e) =>
                            update({
                              measurements: visit.measurements.map((x, idx) =>
                                idx === i ? { ...x, value: e.target.value } : x,
                              ),
                            })
                          }
                          disabled={isLocked}
                          placeholder="Valeur"
                          className="w-full bg-transparent text-right font-mono text-sm focus:outline-none disabled:opacity-70"
                        />
                      </td>
                      <td className="py-1.5 px-2 w-20">
                        <input
                          value={m.unit ?? ""}
                          onChange={(e) =>
                            update({
                              measurements: visit.measurements.map((x, idx) =>
                                idx === i ? { ...x, unit: e.target.value } : x,
                              ),
                            })
                          }
                          disabled={isLocked}
                          placeholder="Unité"
                          className="w-full bg-transparent text-xs text-graphite focus:outline-none disabled:opacity-70"
                        />
                      </td>
                      <td className="py-1.5 pl-1 print:hidden">
                        <button
                          onClick={() =>
                            update({
                              measurements: visit.measurements.filter(
                                (_, idx) => idx !== i,
                              ),
                            })
                          }
                          disabled={isLocked}
                          className="h-5 w-5 grid place-items-center rounded-full bg-cream border border-ember/30 text-ember hover:bg-ember hover:text-cream disabled:opacity-30"
                        >
                          <Trash2 className="h-2.5 w-2.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>

          {/* Pièces remplacées */}
          <section className="mb-8">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-display text-xl text-ink">
                Pièces remplacées
              </h2>
              <button
                onClick={() =>
                  update({
                    partsReplaced: [
                      ...visit.partsReplaced,
                      { description: "", quantity: 1 },
                    ],
                  })
                }
                disabled={isLocked}
                className="inline-flex items-center gap-1 text-xs text-copper hover:underline print:hidden disabled:opacity-50"
              >
                <Plus className="h-3 w-3" />
                Ajouter
              </button>
            </div>
            {visit.partsReplaced.length === 0 ? (
              <p className="text-xs text-muted italic">Aucune pièce remplacée.</p>
            ) : (
              <table className="w-full text-sm">
                <tbody>
                  {visit.partsReplaced.map((p, i) => (
                    <tr key={i} className="border-b border-ink/5">
                      <td className="py-1.5 pr-2 w-1/2">
                        <input
                          value={p.description}
                          onChange={(e) =>
                            update({
                              partsReplaced: visit.partsReplaced.map(
                                (x, idx) =>
                                  idx === i
                                    ? { ...x, description: e.target.value }
                                    : x,
                              ),
                            })
                          }
                          disabled={isLocked}
                          placeholder="Description"
                          className="w-full bg-transparent text-sm focus:outline-none disabled:opacity-70"
                        />
                      </td>
                      <td className="py-1.5 px-2 w-20">
                        <input
                          type="number"
                          value={p.quantity}
                          onChange={(e) =>
                            update({
                              partsReplaced: visit.partsReplaced.map(
                                (x, idx) =>
                                  idx === i
                                    ? {
                                        ...x,
                                        quantity: Number(e.target.value),
                                      }
                                    : x,
                              ),
                            })
                          }
                          disabled={isLocked}
                          className="w-full bg-transparent text-right font-mono text-sm focus:outline-none disabled:opacity-70"
                        />
                      </td>
                      <td className="py-1.5 px-2 w-32">
                        <input
                          value={p.reference ?? ""}
                          onChange={(e) =>
                            update({
                              partsReplaced: visit.partsReplaced.map(
                                (x, idx) =>
                                  idx === i
                                    ? {
                                        ...x,
                                        reference: e.target.value,
                                      }
                                    : x,
                              ),
                            })
                          }
                          disabled={isLocked}
                          placeholder="Réf."
                          className="w-full bg-transparent text-xs font-mono focus:outline-none disabled:opacity-70"
                        />
                      </td>
                      <td className="py-1.5 pl-1 print:hidden">
                        <button
                          onClick={() =>
                            update({
                              partsReplaced: visit.partsReplaced.filter(
                                (_, idx) => idx !== i,
                              ),
                            })
                          }
                          disabled={isLocked}
                          className="h-5 w-5 grid place-items-center rounded-full bg-cream border border-ember/30 text-ember hover:bg-ember hover:text-cream disabled:opacity-30"
                        >
                          <Trash2 className="h-2.5 w-2.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>

          {/* Observations + recommandations */}
          <section className="grid lg:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="font-mono text-[10px] uppercase tracking-eyebrow text-muted block mb-1">
                Observations
              </label>
              <textarea
                rows={4}
                value={visit.observations ?? ""}
                onChange={(e) => update({ observations: e.target.value })}
                disabled={isLocked}
                placeholder="État global, anomalies constatées…"
                className="w-full bg-cream/50 border border-ink/12 rounded-xl p-3 text-sm focus:border-copper focus:outline-none resize-none disabled:opacity-70 print:bg-transparent print:border-0 print:p-0"
              />
            </div>
            <div>
              <label className="font-mono text-[10px] uppercase tracking-eyebrow text-muted block mb-1">
                Recommandations
              </label>
              <textarea
                rows={4}
                value={visit.recommendations ?? ""}
                onChange={(e) => update({ recommendations: e.target.value })}
                disabled={isLocked}
                placeholder="Conseils, pièces à prévoir, prochaine échéance…"
                className="w-full bg-cream/50 border border-ink/12 rounded-xl p-3 text-sm focus:border-copper focus:outline-none resize-none disabled:opacity-70 print:bg-transparent print:border-0 print:p-0"
              />
            </div>
          </section>

          {/* ─────────────── Notes d'intervention (journal terrain) ─────────────── */}
          <section className="mt-8 mb-8">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h2 className="font-display text-xl text-ink">
                  Notes d&apos;intervention
                </h2>
                <p className="text-[11px] text-muted mt-0.5">
                  Journal chronologique pris sur place — distinct des
                  observations &amp; recommandations ci-dessus.
                </p>
              </div>
              <span className="font-mono text-[10px] text-muted print:hidden">
                {visit.interventionNotes?.length ?? 0} note
                {(visit.interventionNotes?.length ?? 0) > 1 ? "s" : ""}
              </span>
            </div>

            {!isLocked && (
              <InterventionNoteComposer
                onAdd={(text) => {
                  const note: InterventionNote = {
                    id: `n-${Date.now().toString(36)}-${Math.random()
                      .toString(36)
                      .slice(2, 6)}`,
                    at: new Date().toISOString(),
                    text,
                    author: visit.technicianEmail,
                  };
                  update({
                    interventionNotes: [
                      ...(visit.interventionNotes ?? []),
                      note,
                    ],
                  });
                }}
              />
            )}

            {(visit.interventionNotes?.length ?? 0) === 0 ? (
              <p className="text-xs text-muted italic mt-3">
                Aucune note pour cette intervention.
              </p>
            ) : (
              <ul className="mt-3 space-y-2">
                {[...(visit.interventionNotes ?? [])]
                  .sort((a, b) => b.at.localeCompare(a.at))
                  .map((n) => (
                    <li
                      key={n.id}
                      className="p-3 rounded-xl border border-ink/8 bg-cream/30 flex gap-3"
                    >
                      <div className="shrink-0 grid place-items-center h-8 w-8 rounded-full bg-copper/10 text-copper">
                        <Clock3 className="h-3.5 w-3.5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className="font-mono text-[10px] uppercase tracking-eyebrow text-copper">
                            {new Date(n.at).toLocaleString("fr-FR", {
                              dateStyle: "short",
                              timeStyle: "short",
                            })}
                          </span>
                          {n.author && (
                            <span className="text-[10px] text-muted">
                              · {n.author}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-ink whitespace-pre-wrap break-words">
                          {n.text}
                        </p>
                      </div>
                      {!isLocked && (
                        <button
                          onClick={() =>
                            update({
                              interventionNotes:
                                visit.interventionNotes?.filter(
                                  (x) => x.id !== n.id,
                                ) ?? [],
                            })
                          }
                          className="shrink-0 h-6 w-6 grid place-items-center rounded-full bg-white border border-ember/30 text-ember hover:bg-ember hover:text-cream print:hidden"
                          title="Supprimer la note"
                        >
                          <XIcon className="h-3 w-3" />
                        </button>
                      )}
                    </li>
                  ))}
              </ul>
            )}
          </section>

          {/* ─────────────── Signature client ─────────────── */}
          <section className="mt-8 mb-4">
            <h2 className="font-display text-xl text-ink mb-3">
              Signature client
            </h2>
            <SignaturePad
              value={visit.clientSignature?.dataUrl}
              signerName={visit.clientSignature?.signerName}
              signedAt={visit.clientSignature?.signedAt}
              readonly={isLocked}
              onCapture={(dataUrl, signerName) => {
                const sig: ClientSignature = {
                  dataUrl,
                  signerName,
                  signedAt: new Date().toISOString(),
                };
                // Persistance immédiate pour ne pas perdre la signature
                save({ clientSignature: sig });
              }}
              onClear={() => {
                save({ clientSignature: null });
              }}
            />
            {!visit.clientSignature && !isLocked && (
              <p className="text-[11px] text-muted mt-2 print:hidden">
                En signant, le client atteste que l&apos;intervention a été
                réalisée conformément aux règles de l&apos;art.
              </p>
            )}
          </section>

          {isLocked && (
            <div className="mt-6 p-4 rounded-2xl bg-[#22a06b]/8 border border-[#22a06b]/30 text-xs text-ink">
              <Check className="inline h-3.5 w-3.5 text-[#22a06b] mr-1" />
              Ce compte-rendu est <strong>finalisé</strong>. Pour modifier, le
              rouvrir explicitement (annule la finalisation).
            </div>
          )}
        </div>
      </div>

      {/* Toast erreur sauvegarde — visible en bas, clearable */}
      {saveError && (
        <div className="fixed bottom-4 inset-x-4 sm:right-4 sm:left-auto sm:max-w-md z-50 print:hidden">
          <div className="rounded-2xl bg-ember text-cream shadow-lift p-4 flex items-start gap-3">
            <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
            <div className="flex-1 text-sm">
              <div className="font-medium mb-0.5">Sauvegarde impossible</div>
              <div className="text-cream/85 text-xs leading-relaxed">
                {saveError}
              </div>
            </div>
            <button
              onClick={() => setSaveError(null)}
              aria-label="Fermer l'erreur"
              className="shrink-0 h-6 w-6 grid place-items-center rounded-full hover:bg-cream/20"
            >
              <XIcon className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}

      <style jsx global>{`
        @media print {
          body {
            background: white !important;
          }
        }
      `}</style>
    </div>
  );
}

/* ─────────────── Saisie d'une note (textarea + bouton) ─────────────── */

function InterventionNoteComposer({
  onAdd,
}: {
  onAdd: (text: string) => void;
}) {
  const [text, setText] = useState("");
  const submit = () => {
    const t = text.trim();
    if (!t) return;
    onAdd(t);
    setText("");
  };
  return (
    <div className="rounded-2xl border border-ink/10 bg-white p-3 print:hidden">
      <textarea
        rows={2}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          // Ctrl/Cmd + Enter = ajouter
          if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
            e.preventDefault();
            submit();
          }
        }}
        placeholder="Décrire ce qui vient d'être fait, un constat, une attente client… (Ctrl + Entrée pour ajouter)"
        className="w-full bg-cream/40 border border-ink/12 rounded-xl p-2.5 text-sm focus:border-copper focus:outline-none resize-none"
        maxLength={2000}
      />
      <div className="mt-2 flex items-center justify-between gap-2">
        <span className="text-[10px] font-mono text-muted">
          {text.length}/2000
        </span>
        <button
          type="button"
          onClick={submit}
          disabled={!text.trim()}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-ink text-cream text-xs hover:bg-copper transition-colors disabled:opacity-40"
        >
          <MessageSquarePlus className="h-3 w-3" />
          Ajouter la note
        </button>
      </div>
    </div>
  );
}
