"use client";

/**
 * Modération des témoignages publics.
 *
 * Source : enquêtes NPS répondues avec score >= 9 et commentaire non vide.
 * L'admin choisit lesquelles publier en saisissant un nom d'affichage (et
 * optionnellement la commune) pour respecter la confidentialité.
 */

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Loader2,
  Heart,
  Check,
  X as XIcon,
  Eye,
  ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";

type Survey = {
  id: string;
  leadReference: string;
  recipientName: string;
  recipientEmail: string;
  sentAt: string;
  respondedAt?: string;
  score?: number;
  comment?: string;
};

type Candidate = {
  survey: Survey;
  isApproved: boolean;
  approval?: {
    surveyId: string;
    displayName: string;
    commune?: string;
    approvedAt: string;
  };
};

export default function TestimonialsAdminPage() {
  const router = useRouter();
  const [candidates, setCandidates] = useState<Candidate[] | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draftName, setDraftName] = useState("");
  const [draftCommune, setDraftCommune] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const res = await fetch("/api/admin/testimonials", { cache: "no-store" });
    if (res.status === 401) {
      router.replace("/admin/login");
      return;
    }
    if (res.ok) {
      const data = await res.json();
      setCandidates(data.candidates ?? []);
    }
  }, [router]);

  useEffect(() => {
    load();
  }, [load]);

  const approve = async (surveyId: string) => {
    if (!draftName.trim()) {
      setError("Nom d'affichage requis");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/testimonials/${surveyId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          displayName: draftName.trim(),
          commune: draftCommune.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Erreur");
      setEditingId(null);
      setDraftName("");
      setDraftCommune("");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setBusy(false);
    }
  };

  const unapprove = async (surveyId: string) => {
    if (!confirm("Retirer ce témoignage du mur public ?")) return;
    setBusy(true);
    try {
      await fetch(`/api/admin/testimonials/${surveyId}`, {
        method: "DELETE",
      });
      await load();
    } finally {
      setBusy(false);
    }
  };

  const approvedCount =
    candidates?.filter((c) => c.isApproved).length ?? 0;

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
              Témoignages
            </h1>
            <p className="mt-2 text-graphite">
              Modération des témoignages affichés sur la page publique.
              Candidats : réponses NPS avec score 9-10 et commentaire.
            </p>
          </div>
          <Link
            href="/temoignages"
            target="_blank"
            className="inline-flex items-center gap-2 rounded-full bg-white border border-ink/15 px-4 py-2 text-sm hover:border-copper/40 transition-colors"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            Voir la page publique
          </Link>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl border border-ember/40 bg-ember/5 text-sm text-ember">
            {error}
          </div>
        )}

        {candidates === null ? (
          <div className="py-16 text-center text-muted">
            <Loader2 className="h-6 w-6 animate-spin mx-auto" />
          </div>
        ) : candidates.length === 0 ? (
          <div className="rounded-2xl border border-ink/10 bg-white shadow-soft py-16 text-center">
            <Heart className="h-12 w-12 mx-auto opacity-30 text-copper mb-2" />
            <p className="text-ink font-medium">
              Aucun témoignage candidat pour l&apos;instant.
            </p>
            <p className="text-xs text-muted mt-1">
              Les promoteurs NPS (9-10) avec commentaire deviennent candidats
              automatiquement.
            </p>
          </div>
        ) : (
          <>
            <div className="mb-4 text-sm text-graphite">
              <strong className="text-ink">{approvedCount}</strong> publié(s)
              sur <strong className="text-ink">{candidates.length}</strong>{" "}
              candidat(s).
            </div>
            <ul className="grid gap-3">
              {candidates.map((c) => {
                const isEdit = editingId === c.survey.id;
                return (
                  <li
                    key={c.survey.id}
                    className={cn(
                      "rounded-2xl border bg-white shadow-soft p-5",
                      c.isApproved
                        ? "border-[#22a06b]/40 bg-[#22a06b]/3"
                        : "border-ink/10",
                    )}
                  >
                    <div className="flex items-start gap-3 mb-3">
                      <div
                        className="h-10 w-10 rounded-full grid place-items-center font-display tabular-nums text-base shrink-0"
                        style={{
                          background: "rgba(34,160,107,0.12)",
                          color: "#22a06b",
                        }}
                      >
                        {c.survey.score}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-medium text-ink truncate">
                          {c.survey.recipientName}
                        </div>
                        <div className="text-[11px] text-muted font-mono">
                          {c.survey.leadReference} ·{" "}
                          {new Date(c.survey.respondedAt!).toLocaleDateString(
                            "fr-FR",
                            { dateStyle: "medium" },
                          )}
                        </div>
                      </div>
                      {c.isApproved && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#22a06b]/10 text-[#22a06b] text-[10px] font-mono uppercase tracking-eyebrow">
                          <Eye className="h-2.5 w-2.5" />
                          Publié
                        </span>
                      )}
                    </div>
                    {c.survey.comment && (
                      <blockquote className="p-3 rounded-xl bg-cream/40 border border-ink/5 text-sm text-graphite italic">
                        « {c.survey.comment} »
                      </blockquote>
                    )}

                    {isEdit ? (
                      <div className="mt-3 grid gap-2">
                        <input
                          value={draftName}
                          onChange={(e) => setDraftName(e.target.value)}
                          placeholder="Nom d'affichage public (ex : Anne D.)"
                          className="bg-cream border border-ink/12 rounded-xl px-3 py-2 text-sm focus:border-copper focus:outline-none"
                          autoFocus
                        />
                        <input
                          value={draftCommune}
                          onChange={(e) => setDraftCommune(e.target.value)}
                          placeholder="Commune (optionnel, ex : Esch-sur-Alzette)"
                          className="bg-cream border border-ink/12 rounded-xl px-3 py-2 text-sm focus:border-copper focus:outline-none"
                        />
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => approve(c.survey.id)}
                            disabled={busy || !draftName.trim()}
                            className="inline-flex items-center gap-1.5 rounded-full bg-ink text-cream px-3 py-1.5 text-xs hover:bg-copper disabled:opacity-50"
                          >
                            {busy ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <Check className="h-3 w-3" />
                            )}
                            Publier
                          </button>
                          <button
                            onClick={() => {
                              setEditingId(null);
                              setError(null);
                            }}
                            className="text-xs text-graphite hover:text-ink"
                          >
                            Annuler
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="mt-3 flex items-center gap-2">
                        {c.isApproved ? (
                          <>
                            <span className="text-[11px] text-muted">
                              Publié sous{" "}
                              <strong className="text-ink">
                                {c.approval?.displayName}
                              </strong>
                              {c.approval?.commune && (
                                <span> · {c.approval.commune}</span>
                              )}
                            </span>
                            <button
                              onClick={() => {
                                setEditingId(c.survey.id);
                                setDraftName(c.approval?.displayName ?? "");
                                setDraftCommune(c.approval?.commune ?? "");
                              }}
                              className="ml-auto text-xs text-copper hover:underline"
                            >
                              Modifier
                            </button>
                            <button
                              onClick={() => unapprove(c.survey.id)}
                              className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-white border border-ember/30 text-ember text-[10px] hover:bg-ember/10"
                            >
                              <XIcon className="h-3 w-3" />
                              Retirer
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => {
                              setEditingId(c.survey.id);
                              setDraftName(c.survey.recipientName);
                              setDraftCommune("");
                            }}
                            className="inline-flex items-center gap-1.5 rounded-full bg-ink text-cream px-3 py-1.5 text-xs hover:bg-copper"
                          >
                            <Check className="h-3 w-3" />
                            Publier ce témoignage
                          </button>
                        )}
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          </>
        )}
      </div>
    </div>
  );
}
