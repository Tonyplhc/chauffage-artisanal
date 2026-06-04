"use client";

/**
 * Auto-diagnostic dépannage HVAC.
 *
 * Arbre de questions interactif → recommandation finale colorée par
 * sévérité (ok/modéré/urgent) avec action concrète.
 */

import { useState } from "react";
import Link from "next/link";
import {
  Wrench,
  ArrowLeft,
  AlertTriangle,
  CheckCircle2,
  Phone,
  RefreshCw,
} from "lucide-react";
import {
  QUESTIONS,
  SEVERITY_LABEL,
  type Question,
  type Recommendation,
} from "@/lib/troubleshoot-tree";

export default function TroubleshootPage() {
  const [currentId, setCurrentId] = useState<string>("root");
  const [final, setFinal] = useState<Recommendation | null>(null);
  const [history, setHistory] = useState<string[]>([]);

  const question: Question | undefined = QUESTIONS[currentId];

  const choose = (option: Question["options"][number]) => {
    if (option.next.recommendation) {
      setFinal(option.next.recommendation);
      return;
    }
    if (option.next.questionId) {
      setHistory((h) => [...h, currentId]);
      setCurrentId(option.next.questionId);
    }
  };

  const back = () => {
    if (final) {
      setFinal(null);
      return;
    }
    if (history.length === 0) return;
    const last = history[history.length - 1];
    setHistory((h) => h.slice(0, -1));
    setCurrentId(last);
  };

  const restart = () => {
    setCurrentId("root");
    setHistory([]);
    setFinal(null);
  };

  return (
    <div className="min-h-screen bg-cream py-12 lg:py-16">
      <div className="container max-w-3xl">
        <div className="mb-8">
          <Link
            href="/"
            className="text-xs font-mono uppercase tracking-eyebrow text-graphite hover:text-copper"
          >
            ← Retour accueil
          </Link>
          <h1 className="mt-4 font-display text-display-md text-ink">
            Auto-diagnostic dépannage
          </h1>
          <p className="mt-2 text-graphite max-w-2xl">
            Quelques questions pour comprendre la situation, identifier ce que
            vous pouvez tenter vous-même, et savoir quand nous appeler.
          </p>
        </div>

        {final ? (
          <FinalCard
            recommendation={final}
            onBack={back}
            onRestart={restart}
          />
        ) : question ? (
          <QuestionCard
            question={question}
            onChoose={choose}
            onBack={history.length > 0 ? back : undefined}
          />
        ) : (
          <div className="rounded-2xl border border-ink/10 bg-white shadow-soft p-8 text-center">
            <p className="text-graphite">Question introuvable.</p>
            <button
              onClick={restart}
              className="mt-4 inline-flex items-center gap-2 rounded-full bg-ink text-cream px-4 py-2 text-sm"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Recommencer
            </button>
          </div>
        )}

        <p className="mt-8 text-xs text-muted text-center">
          Cet outil ne remplace pas un diagnostic technicien. En cas de doute
          réel sur la sécurité (gaz, eau, électricité), contactez-nous ou les
          secours.
        </p>
      </div>
    </div>
  );
}

function QuestionCard({
  question,
  onChoose,
  onBack,
}: {
  question: Question;
  onChoose: (o: Question["options"][number]) => void;
  onBack?: () => void;
}) {
  return (
    <div className="rounded-2xl border border-ink/10 bg-white shadow-soft p-6 lg:p-8">
      <div className="flex items-start gap-3 mb-5">
        <span className="h-10 w-10 rounded-full grid place-items-center bg-copper/10 border border-copper/30 text-copper shrink-0">
          <Wrench className="h-4 w-4" />
        </span>
        <div>
          <div className="font-mono text-[10px] uppercase tracking-eyebrow text-copper">
            Question
          </div>
          <h2 className="font-display text-xl text-ink mt-0.5">
            {question.prompt}
          </h2>
        </div>
      </div>
      <ul className="space-y-2">
        {question.options.map((o, i) => (
          <li key={i}>
            <button
              onClick={() => onChoose(o)}
              className="w-full text-left rounded-xl border border-ink/10 bg-cream/40 hover:bg-cream hover:border-copper/40 px-4 py-3 text-sm text-ink transition-colors"
            >
              {o.label}
            </button>
          </li>
        ))}
      </ul>
      {onBack && (
        <button
          onClick={onBack}
          className="mt-4 inline-flex items-center gap-1 text-xs text-graphite hover:text-copper"
        >
          <ArrowLeft className="h-3 w-3" />
          Question précédente
        </button>
      )}
    </div>
  );
}

function FinalCard({
  recommendation: r,
  onBack,
  onRestart,
}: {
  recommendation: Recommendation;
  onBack: () => void;
  onRestart: () => void;
}) {
  const severity = SEVERITY_LABEL[r.severity];
  const isUrgent = r.severity === "urgent";
  return (
    <div
      className="rounded-2xl border bg-white shadow-soft p-6 lg:p-8"
      style={{ borderColor: `${severity.color}40` }}
    >
      <div className="flex items-start gap-3 mb-4">
        <span
          className="h-10 w-10 rounded-full grid place-items-center border shrink-0"
          style={{
            background: `${severity.color}15`,
            borderColor: `${severity.color}40`,
            color: severity.color,
          }}
        >
          {r.severity === "urgent" ? (
            <AlertTriangle className="h-4 w-4" />
          ) : (
            <CheckCircle2 className="h-4 w-4" />
          )}
        </span>
        <div>
          <div
            className="font-mono text-[10px] uppercase tracking-eyebrow"
            style={{ color: severity.color }}
          >
            Diagnostic · {severity.label}
          </div>
          <h2 className="font-display text-xl text-ink mt-0.5">{r.title}</h2>
        </div>
      </div>

      <p className="text-sm text-graphite leading-relaxed mb-5">{r.body}</p>

      <div className="flex items-center gap-2 flex-wrap">
        {r.action === "emergency" ? (
          <a
            href="tel:112"
            className="inline-flex items-center gap-2 rounded-full bg-ember text-cream px-5 py-2.5 text-sm hover:opacity-90 transition-opacity"
          >
            <Phone className="h-4 w-4" />
            {r.cta}
          </a>
        ) : r.action === "call-urgent" || r.action === "call-soon" ? (
          <Link
            href="/devis"
            className="inline-flex items-center gap-2 rounded-full bg-ink text-cream px-5 py-2.5 text-sm hover:bg-copper transition-colors"
            style={isUrgent ? { background: severity.color } : undefined}
          >
            <Phone className="h-4 w-4" />
            {r.cta}
          </Link>
        ) : (
          <span className="text-sm text-graphite italic">{r.cta}</span>
        )}

        <button
          onClick={onBack}
          className="inline-flex items-center gap-1 text-xs text-graphite hover:text-copper px-3 py-1.5"
        >
          <ArrowLeft className="h-3 w-3" />
          Question précédente
        </button>
        <button
          onClick={onRestart}
          className="inline-flex items-center gap-1 text-xs text-graphite hover:text-copper px-3 py-1.5"
        >
          <RefreshCw className="h-3 w-3" />
          Recommencer
        </button>
      </div>
    </div>
  );
}
