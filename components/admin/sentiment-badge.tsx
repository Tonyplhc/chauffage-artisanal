"use client";

/**
 * Badge sentiment basé sur l'analyse rules-based locale (synchrone).
 *
 * Volontairement discret — c'est un signal indicatif. Tooltip avec les mots
 * déclencheurs pour transparence (l'admin voit pourquoi l'algo dit "négatif").
 */

import { useMemo } from "react";
import {
  analyzeSentiment,
  sentimentColor,
  sentimentLabelFr,
} from "@/lib/sentiment";

export function SentimentBadge({
  text,
  compact = false,
}: {
  text: string;
  compact?: boolean;
}) {
  const result = useMemo(() => analyzeSentiment(text), [text]);
  if (result.matches.length === 0) return null;
  const color = sentimentColor(result.label);
  const label = sentimentLabelFr(result.label);
  const matchWords = result.matches
    .map((m) => `${m.word}${m.negated ? " (nié)" : ""}`)
    .join(", ");

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full text-[10px] font-mono uppercase tracking-eyebrow ${
        compact ? "px-1.5 py-0.5" : "px-2 py-0.5"
      }`}
      style={{
        background: `${color}1c`,
        color,
        border: `1px solid ${color}40`,
      }}
      title={`Score ${result.score} · Détecté : ${matchWords}`}
    >
      <span
        className="h-1.5 w-1.5 rounded-full"
        style={{ background: color }}
      />
      {compact ? label.slice(0, 3) : label}
    </span>
  );
}
