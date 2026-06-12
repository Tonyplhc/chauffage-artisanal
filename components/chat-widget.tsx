"use client";

/**
 * Chat widget public — flotte en bas-droite (sous WhatsApp si présent).
 *
 * Polling toutes les 5s tant que la fenêtre est ouverte. Caché sur /admin/*.
 */

import { useEffect, useRef, useState, useCallback } from "react";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  MessageCircle,
  X as XIcon,
  Send,
  Loader2,
} from "lucide-react";

type Message = {
  id: string;
  sender: "visitor" | "agent";
  text: string;
  at: string;
};

const STORAGE_KEY = "ca-chat-id";
const LAST_MSG_KEY = "ca-chat-last";

export function ChatWidget() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [name, setName] = useState("");
  const [needsName, setNeedsName] = useState(false);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const lastFetchedRef = useRef<string>("1970-01-01T00:00:00.000Z");

  // Skip admin pages
  const skip = pathname?.startsWith("/admin");

  // Restaurer ID depuis localStorage
  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored) setConversationId(stored);
    const lastMsg = window.localStorage.getItem(LAST_MSG_KEY);
    if (lastMsg) lastFetchedRef.current = lastMsg;
  }, []);

  const openConversation = async (visitorName: string) => {
    setBusy(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: visitorName, path: pathname }),
      });
      const data = await res.json();
      if (data.conversationId) {
        setConversationId(data.conversationId);
        window.localStorage.setItem(STORAGE_KEY, data.conversationId);
        setNeedsName(false);
      }
    } finally {
      setBusy(false);
    }
  };

  const sendMessage = async () => {
    if (!conversationId || !draft.trim()) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/chat/${conversationId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: draft, visitorName: name || undefined }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.message) {
          setMessages((prev) => [...prev, data.message]);
          lastFetchedRef.current = data.message.at;
          window.localStorage.setItem(LAST_MSG_KEY, data.message.at);
        }
        setDraft("");
      }
    } finally {
      setBusy(false);
    }
  };

  const pollMessages = useCallback(async () => {
    if (!conversationId) return;
    try {
      const res = await fetch(
        `/api/chat/${conversationId}/messages?since=${encodeURIComponent(lastFetchedRef.current)}${open ? "&ack=1" : ""}`,
        { cache: "no-store" },
      );
      if (!res.ok) return;
      const data = await res.json();
      if (data.messages && data.messages.length > 0) {
        setMessages((prev) => {
          const ids = new Set(prev.map((m) => m.id));
          const next = [
            ...prev,
            ...data.messages.filter((m: Message) => !ids.has(m.id)),
          ];
          return next;
        });
        const last = data.messages[data.messages.length - 1];
        lastFetchedRef.current = last.at;
        window.localStorage.setItem(LAST_MSG_KEY, last.at);
      }
    } catch {
      // silent
    }
  }, [conversationId, open]);

  // Polling 5s quand widget ouvert ou conversationId présent
  useEffect(() => {
    if (skip) return;
    if (!conversationId) return;
    pollMessages();
    const interval = open ? 4000 : 15_000; // poll plus vite quand ouvert
    const id = setInterval(pollMessages, interval);
    return () => clearInterval(id);
  }, [conversationId, open, pollMessages, skip]);

  // Scroll en bas à chaque nouveau message
  useEffect(() => {
    if (!open) return;
    scrollerRef.current?.scrollTo({
      top: scrollerRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages.length, open]);

  if (skip) return null;

  const unreadCount = messages.filter(
    (m) => m.sender === "agent" && !open && new Date(m.at) > new Date(lastFetchedRef.current),
  ).length;

  return (
    <>
      {/* Bouton flottant */}
      <button
        onClick={() => {
          if (!conversationId) setNeedsName(true);
          setOpen((v) => !v);
        }}
        className="fixed bottom-24 right-5 lg:bottom-28 lg:right-7 z-[55] h-14 w-14 lg:h-16 lg:w-16 rounded-full bg-bleu text-creme shadow-lift border border-bleu/40 grid place-items-center hover:scale-105 transition-transform"
        aria-label="Ouvrir le chat"
      >
        <MessageCircle className="h-5 w-5 lg:h-6 lg:w-6" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 h-5 min-w-5 px-1 rounded-full bg-terracotta text-creme text-xs font-mono grid place-items-center border-2 border-creme">
            {unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-44 right-5 lg:bottom-48 lg:right-7 z-[55] w-[90vw] max-w-md h-[60vh] max-h-[600px] bg-white rounded-3xl border border-pierre shadow-lift overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="bg-navy text-creme px-5 py-4 flex items-start justify-between gap-3">
              <div>
                <div className="font-mono text-[10px] uppercase tracking-eyebrow text-bleu">
                  Chat
                </div>
                <div className="mt-0.5 font-display text-lg">
                  Bureau d&apos;études
                </div>
                <div className="text-xs text-creme/60 mt-0.5">
                  Réponse rapide pendant les heures ouvrées
                </div>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="h-8 w-8 grid place-items-center rounded-full bg-creme/15 hover:bg-creme/25 transition-colors"
              >
                <XIcon className="h-4 w-4" />
              </button>
            </div>

            {/* Body */}
            {needsName && !conversationId ? (
              <div className="flex-1 p-5 grid place-items-center">
                <div className="w-full">
                  <div className="font-mono text-[10px] uppercase tracking-eyebrow text-bleu mb-2">
                    Pour démarrer
                  </div>
                  <p className="text-sm text-taupe mb-4">
                    Comment vous appelez-vous ? Cela nous aide à organiser la
                    conversation.
                  </p>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Votre prénom"
                    className="w-full bg-creme border border-pierre rounded-xl px-4 py-2.5 text-sm focus:border-bleu focus:outline-none mb-3"
                  />
                  <button
                    onClick={() => openConversation(name || "Visiteur")}
                    disabled={busy}
                    className="w-full inline-flex items-center justify-center gap-2 rounded-full bg-navy text-creme px-5 py-3 text-sm font-medium hover:bg-bleu transition-colors"
                  >
                    {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                    Démarrer la conversation
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div
                  ref={scrollerRef}
                  className="flex-1 overflow-y-auto px-4 py-4 bg-creme/30"
                >
                  {messages.length === 0 ? (
                    <div className="h-full grid place-items-center text-sm text-muted text-center">
                      Posez votre question — un membre de l&apos;équipe vous
                      répond dès que possible.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {messages.map((m) => (
                        <Bubble key={m.id} message={m} />
                      ))}
                    </div>
                  )}
                </div>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    sendMessage();
                  }}
                  className="px-3 py-3 border-t border-pierre bg-white flex items-end gap-2"
                >
                  <textarea
                    rows={1}
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        sendMessage();
                      }
                    }}
                    placeholder="Votre message…"
                    className="flex-1 bg-creme border border-pierre rounded-xl px-4 py-2.5 text-sm focus:border-bleu focus:outline-none resize-none max-h-32"
                  />
                  <button
                    type="submit"
                    disabled={busy || !draft.trim()}
                    className="h-10 w-10 grid place-items-center rounded-full bg-navy text-creme hover:bg-bleu transition-colors disabled:opacity-40"
                  >
                    {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  </button>
                </form>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function Bubble({ message }: { message: Message }) {
  const isAgent = message.sender === "agent";
  return (
    <div className={`flex ${isAgent ? "justify-start" : "justify-end"}`}>
      <div
        className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
          isAgent
            ? "bg-white border border-pierre text-anthra rounded-bl-md"
            : "bg-bleu text-creme rounded-br-md"
        }`}
      >
        <div className="whitespace-pre-wrap break-words">{message.text}</div>
        <div
          className={`mt-1 text-[10px] font-mono ${
            isAgent ? "text-muted" : "text-creme/70"
          }`}
        >
          {new Date(message.at).toLocaleTimeString("fr-FR", {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </div>
      </div>
    </div>
  );
}
