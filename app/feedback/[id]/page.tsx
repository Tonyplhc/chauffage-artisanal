"use client";

/**
 * Page publique de réponse à une enquête NPS.
 *
 * URL : /feedback/[id]?t=<token>
 *
 * UI : 11 boutons 0..10 (rouge → ambre → vert) + commentaire optionnel + envoi.
 * Si déjà répondu, on affiche le score précédent en lecture seule.
 */

import { useEffect, useState, useCallback } from "react";
import { useParams, useSearchParams } from "next/navigation";
import {
  CheckCircle2,
  Loader2,
  Star,
  Heart,
  AlertTriangle,
} from "lucide-react";

type SurveyState = {
  id: string;
  recipientName: string;
  sentAt: string;
  respondedAt?: string;
  score?: number;
  comment?: string;
};

function scoreColor(score: number): string {
  if (score <= 6) return "#dc5a28"; // ember
  if (score <= 8) return "#b86a36"; // copper
  return "#22a06b"; // green
}

function scoreLabel(score: number): string {
  if (score <= 6) return "Détracteur";
  if (score <= 8) return "Passif";
  return "Promoteur";
}

export default function FeedbackPage() {
  const params = useParams<{ id: string }>();
  const search = useSearchParams();
  const token = search.get("t") ?? "";

  const [state, setState] = useState<SurveyState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [score, setScore] = useState<number | null>(null);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const load = useCallback(async () => {
    const res = await fetch(`/api/nps/${params.id}?t=${token}`, {
      cache: "no-store",
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Lien invalide ou expiré.");
      return;
    }
    const data = await res.json();
    setState(data.survey);
    if (data.survey.respondedAt) {
      setDone(true);
      setScore(data.survey.score ?? null);
      setComment(data.survey.comment ?? "");
    }
  }, [params.id, token]);

  useEffect(() => {
    load();
  }, [load]);

  const submit = async () => {
    if (score === null) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/nps/${params.id}?t=${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ score, comment }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Erreur");
      setDone(true);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setSubmitting(false);
    }
  };

  if (error) {
    return (
      <div className="min-h-screen bg-cream grid place-items-center px-4">
        <div className="max-w-md text-center">
          <AlertTriangle className="h-12 w-12 mx-auto text-ember mb-3" />
          <h1 className="font-display text-2xl text-ink mb-2">
            Lien indisponible
          </h1>
          <p className="text-graphite">{error}</p>
        </div>
      </div>
    );
  }

  if (!state) {
    return (
      <div className="min-h-screen bg-cream grid place-items-center">
        <Loader2 className="h-6 w-6 animate-spin text-copper" />
      </div>
    );
  }

  if (done) {
    return (
      <div className="min-h-screen bg-cream grid place-items-center px-4 py-12">
        <div className="max-w-lg w-full text-center">
          <div
            className="h-16 w-16 mx-auto rounded-full grid place-items-center mb-4"
            style={{
              background: score !== null ? `${scoreColor(score)}1c` : "transparent",
              color: score !== null ? scoreColor(score) : undefined,
            }}
          >
            {score !== null && score >= 9 ? (
              <Heart className="h-8 w-8" />
            ) : (
              <CheckCircle2 className="h-8 w-8" />
            )}
          </div>
          <h1 className="font-display text-3xl text-ink mb-2">Merci !</h1>
          <p className="text-graphite max-w-md mx-auto">
            Votre retour nous aide à progresser.
          </p>
          {score !== null && (
            <div className="mt-6 p-5 rounded-2xl bg-white border border-ink/10 inline-flex items-center gap-3">
              <span
                className="h-12 w-12 rounded-full grid place-items-center font-display text-xl tabular-nums"
                style={{
                  background: `${scoreColor(score)}1c`,
                  color: scoreColor(score),
                }}
              >
                {score}
              </span>
              <div className="text-left">
                <div className="text-xs font-mono uppercase tracking-eyebrow text-muted">
                  Votre score
                </div>
                <div className="text-sm text-ink font-medium">
                  {scoreLabel(score)}
                </div>
              </div>
            </div>
          )}
          {comment && (
            <div className="mt-4 p-4 rounded-xl bg-white border border-ink/10 text-left text-sm text-graphite italic max-w-md mx-auto">
              « {comment} »
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream py-12 lg:py-20 px-4">
      <div className="container max-w-2xl">
        <div className="rounded-3xl border border-ink/10 bg-white shadow-soft p-8 lg:p-12">
          <div className="font-mono text-[10px] uppercase tracking-eyebrow text-copper mb-4">
            Votre avis nous intéresse
          </div>
          <h1 className="font-display text-2xl lg:text-3xl text-ink mb-3">
            {state.recipientName}, sur une échelle de 0 à 10, à quel point
            recommanderiez-vous nos services ?
          </h1>
          <p className="text-graphite mb-8">
            0 = Pas du tout · 10 = Absolument.
          </p>

          {/* Score buttons */}
          <div className="grid grid-cols-11 gap-1 mb-8">
            {Array.from({ length: 11 }).map((_, i) => {
              const active = score === i;
              return (
                <button
                  key={i}
                  onClick={() => setScore(i)}
                  className="aspect-square rounded-xl border-2 font-display text-lg tabular-nums transition-all"
                  style={{
                    background: active
                      ? scoreColor(i)
                      : `${scoreColor(i)}10`,
                    color: active ? "#fff" : scoreColor(i),
                    borderColor: active ? scoreColor(i) : "transparent",
                    transform: active ? "scale(1.1)" : "scale(1)",
                  }}
                >
                  {i}
                </button>
              );
            })}
          </div>

          {score !== null && (
            <div
              className="mb-6 p-3 rounded-xl text-center text-sm font-medium"
              style={{
                background: `${scoreColor(score)}10`,
                color: scoreColor(score),
              }}
            >
              {scoreLabel(score)}
            </div>
          )}

          <label className="font-mono text-[10px] uppercase tracking-eyebrow text-muted block mb-2">
            Un commentaire ? (optionnel)
          </label>
          <textarea
            rows={4}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Ce qui vous a plu, ce qui pourrait être amélioré…"
            className="w-full bg-cream border border-ink/12 rounded-xl px-4 py-3 text-sm focus:border-copper focus:outline-none resize-none mb-6"
          />

          <button
            onClick={submit}
            disabled={score === null || submitting}
            className="w-full inline-flex items-center justify-center gap-2 rounded-full bg-ink text-cream px-5 py-3 text-base font-medium hover:bg-copper disabled:opacity-40 transition-colors"
          >
            {submitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Star className="h-4 w-4" />
            )}
            Envoyer mon avis
          </button>
          <p className="mt-4 text-xs text-muted text-center">
            Lien personnel et unique. Vos réponses restent confidentielles.
          </p>
        </div>
      </div>
    </div>
  );
}
