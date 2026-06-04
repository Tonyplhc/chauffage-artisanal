"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  MessageCircle,
  Send,
  X as XIcon,
  Loader2,
  Circle,
} from "lucide-react";
import { cn } from "@/lib/utils";

type Message = {
  id: string;
  sender: "visitor" | "agent";
  text: string;
  at: string;
  agentEmail?: string;
};

type Conversation = {
  id: string;
  visitorName?: string;
  visitorEmail?: string;
  visitorPath?: string;
  status: "open" | "closed";
  createdAt: string;
  updatedAt: string;
  unreadAgent: number;
  messages: Message[];
};

type ConvSummary = Omit<Conversation, "messages"> & { lastMessage: Message | null };

export default function AdminChatPage() {
  const router = useRouter();
  const [conversations, setConversations] = useState<ConvSummary[] | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [activeConv, setActiveConv] = useState<Conversation | null>(null);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const scrollerRef = useRef<HTMLDivElement>(null);

  const refreshList = useCallback(async () => {
    const res = await fetch("/api/admin/chat/conversations", { cache: "no-store" });
    if (res.status === 401) {
      router.replace("/admin/login");
      return;
    }
    const data = await res.json();
    setConversations(data.conversations ?? []);
  }, [router]);

  const refreshActive = useCallback(async () => {
    if (!activeId) return;
    const res = await fetch(`/api/admin/chat/${activeId}`, { cache: "no-store" });
    if (!res.ok) return;
    const data = await res.json();
    setActiveConv(data.conversation);
  }, [activeId]);

  useEffect(() => {
    refreshList();
    const i = setInterval(refreshList, 10_000);
    return () => clearInterval(i);
  }, [refreshList]);

  useEffect(() => {
    if (!activeId) {
      setActiveConv(null);
      return;
    }
    refreshActive();
    const i = setInterval(refreshActive, 5_000);
    return () => clearInterval(i);
  }, [activeId, refreshActive]);

  useEffect(() => {
    scrollerRef.current?.scrollTo({
      top: scrollerRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [activeConv?.messages.length]);

  const send = async () => {
    if (!activeId || !draft.trim()) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/chat/${activeId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: draft }),
      });
      if (res.ok) {
        setDraft("");
        await refreshActive();
        await refreshList();
      }
    } finally {
      setBusy(false);
    }
  };

  const close = async () => {
    if (!activeId) return;
    if (!confirm("Clôturer cette conversation ?")) return;
    const res = await fetch(`/api/admin/chat/${activeId}`, { method: "DELETE" });
    if (res.ok) {
      await refreshActive();
      await refreshList();
    }
  };

  return (
    <div className="min-h-screen bg-cream py-8 lg:py-12">
      <div className="container max-w-7xl">
        <Link
          href="/admin/leads"
          className="inline-flex items-center gap-2 text-sm font-mono uppercase tracking-eyebrow text-graphite hover:text-copper transition-colors mb-6"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Retour pipeline
        </Link>

        <div className="mb-6">
          <h1 className="font-display text-display-md text-ink">Chat live</h1>
          <p className="mt-2 text-graphite">
            Conversations en direct avec les visiteurs du site.
          </p>
        </div>

        <div className="grid lg:grid-cols-12 gap-4 h-[75vh]">
          {/* Conversations list */}
          <div className="lg:col-span-4 rounded-2xl border border-ink/10 bg-white shadow-soft overflow-hidden flex flex-col">
            <div className="px-4 py-3 border-b border-ink/8 bg-cream/40 font-mono text-[10px] uppercase tracking-eyebrow text-copper">
              Conversations
            </div>
            <div className="flex-1 overflow-y-auto">
              {conversations === null ? (
                <div className="p-6 text-center text-muted text-sm">Chargement…</div>
              ) : conversations.length === 0 ? (
                <div className="p-6 text-center text-muted text-sm">
                  <MessageCircle className="h-10 w-10 mx-auto opacity-30 mb-2" />
                  Aucune conversation pour l&apos;instant.
                </div>
              ) : (
                <ul>
                  {conversations.map((c) => (
                    <li key={c.id}>
                      <button
                        onClick={() => setActiveId(c.id)}
                        className={cn(
                          "w-full text-left px-4 py-3 border-b border-ink/8 last:border-0 hover:bg-cream/40 transition-colors flex items-start gap-3",
                          activeId === c.id && "bg-cream/60",
                        )}
                      >
                        <div className="relative mt-0.5">
                          <div className="h-9 w-9 rounded-full bg-copper/10 border border-copper/30 grid place-items-center text-xs font-mono uppercase text-copper">
                            {(c.visitorName ?? "?").slice(0, 2)}
                          </div>
                          {c.status === "open" && (
                            <Circle className="absolute -bottom-0.5 -right-0.5 h-3 w-3 fill-[#22a06b] text-[#22a06b]" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-sm text-ink font-medium truncate">
                              {c.visitorName ?? "Visiteur"}
                            </span>
                            {c.unreadAgent > 0 && (
                              <span className="h-5 min-w-5 px-1 rounded-full bg-copper text-cream text-xs font-mono grid place-items-center">
                                {c.unreadAgent}
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-muted truncate">
                            {c.lastMessage?.text ?? "(pas encore de message)"}
                          </div>
                          <div className="text-[10px] text-muted mt-0.5">
                            {new Date(c.updatedAt).toLocaleString("fr-FR", {
                              dateStyle: "short",
                              timeStyle: "short",
                            })}
                          </div>
                        </div>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {/* Active conversation */}
          <div className="lg:col-span-8 rounded-2xl border border-ink/10 bg-white shadow-soft overflow-hidden flex flex-col">
            {activeConv ? (
              <>
                <div className="px-5 py-4 border-b border-ink/8 bg-cream/40 flex items-start justify-between gap-3">
                  <div>
                    <div className="font-display text-xl text-ink">
                      {activeConv.visitorName ?? "Visiteur"}
                    </div>
                    <div className="text-xs text-muted mt-0.5">
                      {activeConv.visitorEmail ?? "—"}
                      {activeConv.visitorPath && ` · depuis ${activeConv.visitorPath}`}
                    </div>
                  </div>
                  {activeConv.status === "open" && (
                    <button
                      onClick={close}
                      className="inline-flex items-center gap-1.5 rounded-full border border-ember/40 px-3 py-1.5 text-xs text-ember hover:bg-ember/10"
                    >
                      <XIcon className="h-3 w-3" /> Clôturer
                    </button>
                  )}
                  {activeConv.status === "closed" && (
                    <span className="inline-flex items-center text-xs font-mono uppercase tracking-eyebrow text-muted">
                      Clôturée
                    </span>
                  )}
                </div>
                <div ref={scrollerRef} className="flex-1 overflow-y-auto px-5 py-4 bg-cream/20">
                  {activeConv.messages.length === 0 ? (
                    <div className="h-full grid place-items-center text-sm text-muted">
                      Le visiteur n&apos;a pas encore envoyé de message.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {activeConv.messages.map((m) => (
                        <Bubble key={m.id} message={m} />
                      ))}
                    </div>
                  )}
                </div>
                {activeConv.status === "open" && (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      send();
                    }}
                    className="px-4 py-3 border-t border-ink/8 bg-white flex items-end gap-2"
                  >
                    <textarea
                      rows={1}
                      value={draft}
                      onChange={(e) => setDraft(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          send();
                        }
                      }}
                      placeholder="Votre réponse…"
                      className="flex-1 bg-cream border border-ink/12 rounded-xl px-4 py-2.5 text-sm focus:border-copper focus:outline-none resize-none max-h-32"
                    />
                    <button
                      type="submit"
                      disabled={busy || !draft.trim()}
                      className="h-10 w-10 grid place-items-center rounded-full bg-ink text-cream hover:bg-copper disabled:opacity-40"
                    >
                      {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                    </button>
                  </form>
                )}
              </>
            ) : (
              <div className="h-full grid place-items-center text-muted">
                <div className="text-center">
                  <MessageCircle className="h-12 w-12 mx-auto opacity-20" />
                  <p className="mt-3 text-sm">Sélectionnez une conversation à gauche.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Bubble({ message }: { message: Message }) {
  const isAgent = message.sender === "agent";
  return (
    <div className={`flex ${isAgent ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
          isAgent
            ? "bg-copper text-cream rounded-br-md"
            : "bg-white border border-ink/10 text-ink rounded-bl-md"
        }`}
      >
        <div className="whitespace-pre-wrap break-words">{message.text}</div>
        <div className={`mt-1 text-[10px] font-mono ${isAgent ? "text-cream/70" : "text-muted"}`}>
          {new Date(message.at).toLocaleTimeString("fr-FR", {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </div>
      </div>
    </div>
  );
}
