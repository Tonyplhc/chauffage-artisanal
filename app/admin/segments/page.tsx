"use client";

/**
 * Gestion des segments dynamiques.
 *
 * Création via query string réutilisant la grammaire search-operators (W13.4).
 * Affiche le nombre de membres en live. Cliquer sur un segment navigue vers
 * la vue détail.
 */

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Plus,
  Layers,
  Loader2,
  Users,
  Code,
  Trash2,
  ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

type Segment = {
  id: string;
  name: string;
  description?: string;
  ownerEmail?: string;
  isShared: boolean;
  query: string;
  createdAt: string;
  updatedAt: string;
};

const PRESETS = [
  { name: "Hot leads en attente", query: "status:nouveau level:hot" },
  { name: "Devis en attente > 14j", query: "status:devis_envoye time:30d" },
  { name: "PAC à Esch", query: "service:pac commune:Esch" },
  { name: "À moi & en cours", query: "assignedTo:me status:contacte" },
];

export default function SegmentsAdminPage() {
  const router = useRouter();
  const [segments, setSegments] = useState<Segment[] | null>(null);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [currentEmail, setCurrentEmail] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [draft, setDraft] = useState({
    name: "",
    description: "",
    query: "",
    isShared: false,
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const [sr, mr] = await Promise.all([
      fetch("/api/admin/segments", { cache: "no-store" }),
      fetch("/api/admin/me", { cache: "no-store" }).catch(() => null),
    ]);
    if (sr.status === 401) {
      router.replace("/admin/login");
      return;
    }
    if (sr.ok) {
      const d = await sr.json();
      setSegments(d.segments ?? []);
      setCounts(d.counts ?? {});
    }
    if (mr?.ok) {
      const d = await mr.json();
      setCurrentEmail(d?.user?.email ?? d?.email ?? null);
    }
  }, [router]);

  useEffect(() => {
    load();
  }, [load]);

  const create = async () => {
    if (!draft.name.trim() || !draft.query.trim()) {
      setError("Nom et query requis");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/segments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(draft),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Erreur");
      setCreating(false);
      setDraft({ name: "", description: "", query: "", isShared: false });
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setBusy(false);
    }
  };

  const remove = async (id: string, name: string) => {
    if (!confirm(`Supprimer le segment « ${name} » ?`)) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/segments/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        alert(data.error ?? "Erreur");
      }
      await load();
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

        <div className="flex items-start justify-between gap-4 flex-wrap mb-8">
          <div>
            <h1 className="font-display text-display-md text-ink">
              Segments dynamiques
            </h1>
            <p className="mt-2 text-graphite">
              Cohortes nommées définies par une expression de recherche.
              Compteurs recalculés à chaque visite — pas de cache.
            </p>
          </div>
          {!creating && (
            <button
              onClick={() => setCreating(true)}
              className="inline-flex items-center gap-2 rounded-full bg-ink text-cream px-5 py-2.5 text-sm font-medium hover:bg-copper transition-colors"
            >
              <Plus className="h-4 w-4" />
              Nouveau segment
            </button>
          )}
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl border border-ember/40 bg-ember/5 text-sm text-ember">
            {error}
          </div>
        )}

        {creating && (
          <div className="mb-6 rounded-2xl border border-copper/40 bg-white shadow-soft p-5">
            <div className="font-mono text-[10px] uppercase tracking-eyebrow text-copper mb-3">
              Nouveau segment
            </div>
            <div className="grid gap-3">
              <input
                value={draft.name}
                onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                placeholder="Nom (ex : Hot leads PAC zone Sud)"
                className="bg-cream border border-ink/12 rounded-xl px-4 py-2.5 text-sm focus:border-copper focus:outline-none"
                autoFocus
              />
              <input
                value={draft.description}
                onChange={(e) =>
                  setDraft({ ...draft, description: e.target.value })
                }
                placeholder="Description courte (optionnelle)"
                className="bg-cream border border-ink/12 rounded-xl px-4 py-2.5 text-xs focus:border-copper focus:outline-none"
              />
              <div className="grid gap-1">
                <label className="font-mono text-[10px] uppercase tracking-eyebrow text-muted inline-flex items-center gap-1">
                  <Code className="h-3 w-3" />
                  Expression
                </label>
                <input
                  value={draft.query}
                  onChange={(e) => setDraft({ ...draft, query: e.target.value })}
                  placeholder='ex : status:nouveau level:hot commune:"Esch-sur-Alzette"'
                  className="bg-cream border border-ink/12 rounded-xl px-4 py-2.5 text-sm focus:border-copper focus:outline-none font-mono"
                />
                <div className="text-[11px] text-muted">
                  Opérateurs : status: · level: · service: · commune: ·
                  assignedTo: · time: · texte libre.
                </div>
              </div>
              <div className="flex items-center gap-2 flex-wrap text-xs">
                <span className="text-muted">Presets :</span>
                {PRESETS.map((p) => (
                  <button
                    key={p.name}
                    onClick={() =>
                      setDraft({
                        ...draft,
                        name: draft.name || p.name,
                        query: p.query,
                      })
                    }
                    className="px-2 py-1 rounded-full bg-cream border border-ink/8 text-graphite hover:border-copper/40 hover:text-copper"
                  >
                    {p.name}
                  </button>
                ))}
              </div>
              <label className="inline-flex items-center gap-2 text-xs text-graphite cursor-pointer">
                <input
                  type="checkbox"
                  checked={draft.isShared}
                  onChange={(e) =>
                    setDraft({ ...draft, isShared: e.target.checked })
                  }
                />
                Partager avec toute l&apos;équipe
              </label>
              <div className="flex items-center gap-2">
                <button
                  onClick={create}
                  disabled={busy || !draft.name.trim() || !draft.query.trim()}
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
                    setDraft({
                      name: "",
                      description: "",
                      query: "",
                      isShared: false,
                    });
                    setError(null);
                  }}
                  className="text-xs text-graphite hover:text-ink"
                >
                  Annuler
                </button>
              </div>
            </div>
          </div>
        )}

        {segments === null ? (
          <div className="py-16 text-center text-muted">
            <Loader2 className="h-6 w-6 animate-spin mx-auto" />
          </div>
        ) : segments.length === 0 && !creating ? (
          <div className="rounded-2xl border border-ink/10 bg-white shadow-soft py-16 text-center">
            <Layers className="h-12 w-12 mx-auto opacity-30 text-copper mb-2" />
            <p className="text-ink font-medium">Aucun segment.</p>
            <p className="text-xs text-muted mt-1">
              Créez votre premier segment pour cibler des cohortes
              spécifiques.
            </p>
          </div>
        ) : (
          <div className="grid gap-3">
            {segments?.map((s) => {
              const count = counts[s.id] ?? 0;
              const isOwner =
                !!currentEmail && s.ownerEmail === currentEmail;
              return (
                <div
                  key={s.id}
                  className="rounded-2xl border border-ink/10 bg-white shadow-soft hover:shadow-lift transition-shadow"
                >
                  <Link
                    href={`/admin/segments/${s.id}`}
                    className="flex items-center gap-4 p-5 group"
                  >
                    <div
                      className="h-12 w-12 rounded-full grid place-items-center shrink-0"
                      style={{
                        background: "rgba(184,106,54,0.12)",
                        color: "#b86a36",
                      }}
                    >
                      <Layers className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-base font-medium text-ink truncate">
                          {s.name}
                        </span>
                        {s.isShared && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-cream border border-ink/8 text-[10px] font-mono uppercase tracking-eyebrow text-graphite">
                            <Users className="h-2.5 w-2.5" />
                            Partagé
                          </span>
                        )}
                      </div>
                      {s.description && (
                        <div className="text-xs text-graphite mt-0.5">
                          {s.description}
                        </div>
                      )}
                      <div className="font-mono text-[11px] text-copper mt-1 truncate">
                        {s.query}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-display text-2xl tabular-nums text-ink">
                        {count}
                      </div>
                      <div className="text-[10px] font-mono uppercase tracking-eyebrow text-muted">
                        membres
                      </div>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted opacity-0 group-hover:opacity-100 transition-opacity ml-2" />
                  </Link>
                  {isOwner && (
                    <div className="px-5 pb-3 flex items-center justify-end">
                      <button
                        onClick={() => remove(s.id, s.name)}
                        className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-white border border-ember/30 text-ember text-[10px] hover:bg-ember/10"
                      >
                        <Trash2 className="h-3 w-3" />
                        Supprimer
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        <p className="mt-4 text-xs text-muted">
          Sur la page détail d&apos;un segment, vous pourrez exporter la liste
          ou déclencher des actions groupées (à venir).
        </p>
      </div>
    </div>
  );
}
