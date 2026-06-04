"use client";

/**
 * Assistant IA flottant — bouton ✨ en bas à droite de l'admin.
 *
 * Pattern Linear AI / Notion AI : un panneau qui s'ouvre, un chat streaming,
 * réponse en token-par-token visible. Ouverture clavier : Ctrl/Cmd+J.
 *
 * État local uniquement (la conversation n'est pas persistée). Volontaire :
 * pour un assistant générique, l'historique 24h ne sert à rien, et zéro
 * persistance = zéro PII à protéger.
 */

import { useEffect, useRef, useState } from "react";
import { Sparkles, X, Send, Loader2, AlertCircle } from "lucide-react";

type Message = {
  role: "user" | "assistant";
  content: string;
};

const SUGGESTIONS = [
  "Résume-moi les leads urgents de la semaine",
  "Rédige un email de relance pour un devis sans retour depuis 7 jours",
  "Quelle est la marge moyenne sur les installations PAC ?",
  "Donne-moi un plan de tournée pour 3 visites entretien à Esch demain",
];

export function AIAssistant() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  // Raccourci clavier Cmd/Ctrl + J
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "j") {
        e.preventDefault();
        setOpen((v) => !v);
      }
      if (e.key === "Escape" && open) setOpen(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open]);

  // Focus input à l'ouverture
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  // Auto-scroll bas
  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages]);

  const send = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || sending) return;

    setError(null);
    const userMsg: Message = { role: "user", content: trimmed };
    const draft: Message = { role: "assistant", content: "" };
    const next = [...messages, userMsg];
    setMessages([...next, draft]);
    setInput("");
    setSending(true);

    try {
      const res = await fetch("/api/admin/ai/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next }),
      });

      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        const errMsg =
          (errBody as { error?: string }).error ?? `HTTP ${res.status}`;
        const hint = res.status === 503 ? " (clé Groq absente — voir .env.local)" : "";
        throw new Error(errMsg + hint);
      }
      if (!res.body) throw new Error("Réponse vide");

      // Streaming : on lit chunk par chunk et on append au dernier message
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let acc = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        acc += decoder.decode(value, { stream: true });
        setMessages((m) => {
          const copy = [...m];
          copy[copy.length - 1] = { role: "assistant", content: acc };
          return copy;
        });
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Erreur inconnue";
      setError(msg);
      setMessages((m) => m.slice(0, -1)); // retire le draft vide
    } finally {
      setSending(false);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  };

  const reset = () => {
    setMessages([]);
    setError(null);
  };

  return (
    <>
      {/* Bouton flottant */}
      <button
        onClick={() => setOpen(true)}
        className={`
          fixed bottom-6 right-6 z-50
          group inline-flex items-center gap-2.5 pl-4 pr-5 py-3
          rounded-full bg-ink text-cream shadow-lift
          hover:bg-copper transition-all
          ${open ? "opacity-0 pointer-events-none scale-90" : "opacity-100 scale-100"}
        `}
        aria-label="Ouvrir l'assistant IA"
        title="Assistant IA (Cmd/Ctrl + J)"
      >
        <span className="relative grid place-items-center h-6 w-6 rounded-full bg-copper/20 group-hover:bg-cream/20">
          <Sparkles className="h-3.5 w-3.5 text-copper group-hover:text-cream" />
          <span className="absolute inset-0 rounded-full bg-copper/30 animate-ping opacity-60" />
        </span>
        <span className="text-sm font-medium">Assistant IA</span>
        <kbd className="hidden sm:inline-flex font-mono text-[10px] text-cream/60 border border-cream/15 px-1.5 py-0.5 rounded">
          ⌘J
        </kbd>
      </button>

      {/* Overlay + panneau */}
      {open && (
        <>
          <div
            className="fixed inset-0 z-50 bg-ink/30 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />
          <div
            className="
              fixed z-50 bottom-6 right-6
              w-[calc(100vw-3rem)] sm:w-[480px] max-w-[480px]
              h-[600px] max-h-[80vh]
              bg-white rounded-2xl shadow-lift border border-ink/10
              flex flex-col overflow-hidden
              animate-in fade-in slide-in-from-bottom-4
            "
            role="dialog"
            aria-label="Assistant IA"
          >
            {/* Header */}
            <div className="px-5 py-4 border-b border-ink/8 flex items-center justify-between bg-cream/30">
              <div className="flex items-center gap-3">
                <div className="grid place-items-center h-8 w-8 rounded-full bg-copper/10">
                  <Sparkles className="h-4 w-4 text-copper" />
                </div>
                <div>
                  <div className="font-display text-sm text-ink leading-tight">
                    Assistant IA
                  </div>
                  <div className="font-mono text-[9px] uppercase tracking-eyebrow text-muted">
                    Llama 3.3 · Groq
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1">
                {messages.length > 0 && (
                  <button
                    onClick={reset}
                    className="text-[10px] font-mono uppercase tracking-eyebrow text-graphite hover:text-copper px-2 py-1"
                  >
                    Reset
                  </button>
                )}
                <button
                  onClick={() => setOpen(false)}
                  className="h-7 w-7 grid place-items-center rounded-full bg-white border border-ink/10 text-graphite hover:bg-ink hover:text-cream transition-colors"
                  aria-label="Fermer"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            {/* Conversation */}
            <div
              ref={scrollRef}
              className="flex-1 overflow-y-auto px-5 py-4 grid gap-4"
            >
              {messages.length === 0 ? (
                <div className="grid gap-4 mt-2">
                  <div className="text-xs text-muted">
                    Suggestions pour commencer :
                  </div>
                  <div className="grid gap-2">
                    {SUGGESTIONS.map((s) => (
                      <button
                        key={s}
                        onClick={() => send(s)}
                        disabled={sending}
                        className="text-left text-sm px-3 py-2.5 rounded-lg bg-cream/40 hover:bg-cream border border-ink/8 text-ink transition-colors disabled:opacity-50"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                messages.map((m, i) => (
                  <div
                    key={i}
                    className={
                      m.role === "user" ? "ml-auto max-w-[85%]" : "mr-auto max-w-[90%]"
                    }
                  >
                    {m.role === "assistant" && (
                      <div className="font-mono text-[9px] uppercase tracking-eyebrow text-copper mb-1">
                        Assistant
                      </div>
                    )}
                    <div
                      className={`
                        px-4 py-3 rounded-2xl text-sm whitespace-pre-wrap leading-relaxed
                        ${
                          m.role === "user"
                            ? "bg-ink text-cream rounded-tr-sm"
                            : "bg-cream/50 text-ink rounded-tl-sm border border-ink/8"
                        }
                      `}
                    >
                      {m.content || (
                        <span className="inline-flex items-center gap-2 text-muted">
                          <Loader2 className="h-3 w-3 animate-spin" />
                          Rédaction…
                        </span>
                      )}
                    </div>
                  </div>
                ))
              )}

              {error && (
                <div className="flex items-start gap-2 px-3 py-2.5 rounded-lg bg-ember/8 border border-ember/30 text-xs text-ink">
                  <AlertCircle className="h-3.5 w-3.5 text-ember shrink-0 mt-0.5" />
                  <div>{error}</div>
                </div>
              )}
            </div>

            {/* Input */}
            <div className="border-t border-ink/8 px-3 py-3 bg-white">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  send(input);
                }}
                className="flex items-end gap-2"
              >
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      send(input);
                    }
                  }}
                  disabled={sending}
                  rows={1}
                  placeholder="Demande quelque chose…"
                  className="flex-1 resize-none bg-cream/40 border border-ink/10 rounded-xl px-4 py-2.5 text-sm text-ink placeholder:text-muted focus:border-copper focus:outline-none focus:ring-2 focus:ring-copper/20 transition-all disabled:opacity-50 max-h-[120px]"
                />
                <button
                  type="submit"
                  disabled={sending || !input.trim()}
                  className="h-10 w-10 shrink-0 grid place-items-center rounded-xl bg-ink text-cream hover:bg-copper disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  aria-label="Envoyer"
                >
                  {sending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </button>
              </form>
              <div className="mt-2 text-[10px] text-muted text-center">
                Entrée pour envoyer · Maj+Entrée pour ligne · ⌘J pour ouvrir
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}
