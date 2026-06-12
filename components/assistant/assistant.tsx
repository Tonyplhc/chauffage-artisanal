"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight, Send, Sparkles } from "lucide-react";

/**
 * Assistant devis IA — interface de conversation.
 * Le client n'envoie que du texte ; tous les calculs (Règle N°4) se font côté
 * serveur via /api/assistant (Claude + outils du référentiel).
 */

type Msg = { role: "user" | "assistant"; content: string };

const SUGGESTIONS = [
  "Je chauffe au mazout, combien je peux économiser ?",
  "Quelles aides pour une pompe à chaleur en appartement ?",
  "Je veux prendre rendez-vous pour une visite technique",
];

const WELCOME =
  "Bonjour ! Je suis l'assistant de Chauffage Artisanal. Je peux estimer vos économies en passant à la pompe à chaleur, détailler vos aides (Klimabonus 2026, commune, TVA…) et réserver votre visite technique gratuite. Par quoi commence-t-on ?";

export function Assistant() {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [offline, setOffline] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, busy]);

  async function send(text: string) {
    const content = text.trim();
    if (!content || busy) return;
    setError(null);
    const next: Msg[] = [...messages, { role: "user", content }];
    setMessages(next);
    setInput("");
    setBusy(true);
    try {
      const res = await fetch("/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next }),
      });
      if (res.status === 503) {
        setOffline(true);
        return;
      }
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Une erreur est survenue. Réessayez.");
        return;
      }
      setMessages((m) => [...m, { role: "assistant", content: data.reply }]);
    } catch {
      setError("Connexion impossible. Vérifiez votre réseau puis réessayez.");
    } finally {
      setBusy(false);
    }
  }

  if (offline) {
    return (
      <div className="max-w-xl mx-auto px-5 py-16 text-center font-ui">
        <div className="mx-auto h-12 w-12 rounded-full bg-voile grid place-items-center">
          <Sparkles className="h-6 w-6 text-bleu" />
        </div>
        <h2 className="mt-5 font-display text-3xl tracking-tightest text-anthra">
          L&apos;assistant arrive très bientôt.
        </h2>
        <p className="mt-3 text-taupe">
          En attendant, obtenez vos chiffres en 60 secondes avec notre estimateur — économie, aides
          et gain sur 10 ans, sur votre vraie facture.
        </p>
        <Link
          href="/estimation"
          className="mt-6 inline-flex items-center gap-2 rounded-full bg-bleu text-creme px-7 py-3.5 text-sm font-semibold hover:bg-navy transition"
        >
          Estimer mes économies <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-5 py-8 lg:py-10 font-ui flex flex-col" style={{ minHeight: "70vh" }}>
      {/* Fil de conversation */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-4 pb-4">
        <Bubble role="assistant" content={WELCOME} />
        {messages.map((m, i) => (
          <Bubble key={i} role={m.role} content={m.content} />
        ))}
        {busy && (
          <div className="flex items-center gap-1.5 px-4 py-3">
            <Dot delay="0ms" /> <Dot delay="150ms" /> <Dot delay="300ms" />
          </div>
        )}
        {error && (
          <div className="rounded-xl bg-perteBg border border-perte/20 px-4 py-3 text-sm text-perte">
            {error}
          </div>
        )}
      </div>

      {/* Suggestions (avant le premier message) */}
      {messages.length === 0 && (
        <div className="flex flex-wrap gap-2 pb-3">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              onClick={() => send(s)}
              className="rounded-full border border-pierre bg-white px-4 py-2 text-sm text-taupe hover:border-bleu hover:text-bleu transition"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Saisie */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
        className="flex items-end gap-2"
      >
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              send(input);
            }
          }}
          rows={1}
          placeholder="Écrivez votre message…"
          className="flex-1 resize-none rounded-2xl border border-pierre bg-white px-5 py-3.5 text-anthra focus:border-bleu outline-none"
        />
        <button
          type="submit"
          disabled={busy || !input.trim()}
          aria-label="Envoyer"
          className="h-12 w-12 grid place-items-center rounded-full bg-bleu text-creme hover:bg-navy transition disabled:opacity-50 shrink-0"
        >
          <Send className="h-5 w-5" />
        </button>
      </form>
      <p className="mt-2.5 text-[11px] text-muted text-center">
        Montants estimés — calculés par nos moteurs (forfaits Klimabonus 2026 vérifiés), confirmés
        lors de l&apos;étude gratuite. L&apos;assistant ne remplace pas un devis.
      </p>
    </div>
  );
}

function Bubble({ role, content }: Msg) {
  const isUser = role === "user";
  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
          isUser
            ? "bg-bleu text-creme rounded-br-md"
            : "bg-white border border-pierre text-anthra rounded-bl-md"
        }`}
      >
        {content}
      </div>
    </div>
  );
}

const Dot = ({ delay }: { delay: string }) => (
  <span
    className="inline-block h-2 w-2 rounded-full bg-taupe/50 animate-bounce"
    style={{ animationDelay: delay }}
  />
);
