"use client";

/**
 * Fil de commentaires multi-utilisateurs pour la fiche lead.
 *
 * Distinct des notes (qui restent un champ libre admin). Ici on a un thread
 * chronologique avec author + timestamp, @mentions parsées et highlightées,
 * suggestions de mention basées sur la liste des users admin.
 */

import { useEffect, useState, useCallback, useRef, useMemo } from "react";
import {
  MessageSquare,
  Send,
  Loader2,
  Trash2,
  AtSign,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { AIDraftButton } from "@/components/admin/ai-draft-button";

type Comment = {
  id: string;
  leadReference: string;
  authorEmail: string;
  body: string;
  mentions: string[];
  createdAt: string;
  deletedAt?: string;
};

type User = { email: string };

function fmtDate(iso: string): string {
  const d = new Date(iso);
  const now = Date.now();
  const diffMs = now - d.getTime();
  if (diffMs < 60_000) return "à l'instant";
  const min = Math.floor(diffMs / 60_000);
  if (min < 60) return `il y a ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `il y a ${h} h`;
  return d.toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" });
}

function renderBody(body: string): React.ReactNode {
  // Surligne les @email@domain.tld
  const parts = body.split(/(@[a-zA-Z0-9._+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,})/g);
  return parts.map((p, i) =>
    p.startsWith("@") ? (
      <span
        key={i}
        className="px-1 py-0.5 rounded bg-copper/15 text-copper font-mono text-[0.95em]"
      >
        {p}
      </span>
    ) : (
      <span key={i}>{p}</span>
    ),
  );
}

export function LeadCommentsBlock({
  reference,
  currentUserEmail,
}: {
  reference: string;
  currentUserEmail?: string;
}) {
  const [comments, setComments] = useState<Comment[] | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mentionOpen, setMentionOpen] = useState(false);
  const [mentionQuery, setMentionQuery] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const load = useCallback(async () => {
    const res = await fetch(`/api/admin/leads/${reference}/comments`, {
      cache: "no-store",
    });
    if (res.ok) {
      const data = await res.json();
      setComments(data.comments ?? []);
    }
  }, [reference]);

  const loadUsers = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/users", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users ?? []);
      }
    } catch {
      // ignore — pas grave si pas d'API users dispo
    }
  }, []);

  useEffect(() => {
    load();
    loadUsers();
    const i = setInterval(load, 30_000);
    return () => clearInterval(i);
  }, [load, loadUsers]);

  const send = async () => {
    const body = draft.trim();
    if (!body) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/leads/${reference}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Erreur");
      setDraft("");
      setMentionOpen(false);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setBusy(false);
    }
  };

  const remove = async (id: string) => {
    if (!confirm("Supprimer ce commentaire ?")) return;
    setBusy(true);
    try {
      await fetch(`/api/admin/comments/${id}`, { method: "DELETE" });
      await load();
    } finally {
      setBusy(false);
    }
  };

  // Détection du contexte de mention dans le draft
  const handleDraftChange = (next: string) => {
    setDraft(next);
    setError(null);
    // Cherche la dernière séquence "@..." sans espace après
    const m = next.match(/@([a-zA-Z0-9._+\-]*)$/);
    if (m) {
      setMentionQuery(m[1].toLowerCase());
      setMentionOpen(true);
    } else {
      setMentionOpen(false);
    }
  };

  const filteredUsers = useMemo(() => {
    if (!mentionQuery) return users.slice(0, 5);
    return users
      .filter((u) => u.email.toLowerCase().includes(mentionQuery))
      .slice(0, 5);
  }, [users, mentionQuery]);

  const insertMention = (email: string) => {
    const next = draft.replace(
      /@([a-zA-Z0-9._+\-]*)$/,
      `@${email} `,
    );
    setDraft(next);
    setMentionOpen(false);
    textareaRef.current?.focus();
  };

  return (
    <div className="p-6 lg:p-8 rounded-3xl border border-ink/10 bg-white shadow-soft">
      <div className="flex items-center gap-2 mb-4">
        <MessageSquare className="h-5 w-5 text-copper" />
        <h2 className="font-display text-xl text-ink">Discussion équipe</h2>
        {comments && comments.length > 0 && (
          <span className="ml-auto font-mono text-xs text-muted">
            {comments.length} commentaire{comments.length > 1 ? "s" : ""}
          </span>
        )}
      </div>

      <p className="text-sm text-graphite leading-relaxed mb-4">
        Fil de discussion partagé. Mentionnez un collègue avec{" "}
        <code className="px-1 py-0.5 rounded bg-cream font-mono text-xs">
          @jerome@chauffage-artisanal.lu
        </code>
        .
      </p>

      {/* Composer */}
      <div className="rounded-2xl border border-ink/10 bg-cream/40 p-3 mb-4 relative">
        <textarea
          ref={textareaRef}
          rows={3}
          value={draft}
          onChange={(e) => handleDraftChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
              e.preventDefault();
              send();
            }
          }}
          placeholder="Ajouter un commentaire (Ctrl+Entrée pour envoyer)…"
          className="w-full bg-transparent text-sm resize-none focus:outline-none placeholder:text-muted"
        />
        <div className="flex items-center justify-between mt-1 gap-3">
          <div className="flex items-center gap-3 min-w-0 flex-wrap">
            <div className="text-[11px] text-muted shrink-0">
              {draft.length}/4000 · {currentUserEmail ?? "admin"}
            </div>
            {process.env.NEXT_PUBLIC_ENABLE_AI === "1" && (
              <AIDraftButton
                kind="comment"
                context={`Lead ${reference}`}
                size="sm"
                onResult={(text) => handleDraftChange(text)}
              />
            )}
          </div>
          <button
            onClick={send}
            disabled={busy || !draft.trim()}
            className="inline-flex items-center gap-1.5 rounded-full bg-ink text-cream px-3 py-1.5 text-xs hover:bg-copper disabled:opacity-50 transition-colors shrink-0"
          >
            {busy ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <Send className="h-3 w-3" />
            )}
            Envoyer
          </button>
        </div>
        {mentionOpen && filteredUsers.length > 0 && (
          <div className="absolute left-3 right-3 -bottom-2 translate-y-full bg-white rounded-xl border border-ink/10 shadow-lift z-10 overflow-hidden">
            <div className="px-3 py-1.5 font-mono text-[10px] uppercase tracking-eyebrow text-muted bg-cream/40 inline-flex items-center gap-1">
              <AtSign className="h-2.5 w-2.5" />
              Mentionner
            </div>
            <ul>
              {filteredUsers.map((u) => (
                <li key={u.email}>
                  <button
                    onClick={() => insertMention(u.email)}
                    className="w-full text-left px-3 py-2 text-xs hover:bg-cream/40 transition-colors"
                  >
                    @{u.email}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {error && (
        <div className="mb-3 text-xs text-ember">{error}</div>
      )}

      {/* Fil */}
      {comments === null ? (
        <Loader2 className="h-5 w-5 animate-spin text-muted" />
      ) : comments.length === 0 ? (
        <div className="py-8 text-center text-muted text-sm">
          Aucun commentaire pour l&apos;instant. Lancez la discussion.
        </div>
      ) : (
        <ul className="grid gap-3">
          {comments.map((c) => {
            const isOwn =
              !!currentUserEmail && currentUserEmail === c.authorEmail;
            const isDeleted = !!c.deletedAt;
            return (
              <li
                key={c.id}
                className={cn(
                  "flex gap-3",
                  isOwn ? "flex-row-reverse" : "flex-row",
                )}
              >
                <div
                  className={cn(
                    "h-8 w-8 rounded-full shrink-0 grid place-items-center text-xs font-mono uppercase",
                    isOwn
                      ? "bg-copper text-cream"
                      : "bg-ink text-cream",
                  )}
                  title={c.authorEmail}
                >
                  {c.authorEmail.slice(0, 2)}
                </div>
                <div
                  className={cn(
                    "max-w-[80%] rounded-2xl border px-4 py-3",
                    isOwn
                      ? "bg-copper/8 border-copper/20"
                      : "bg-cream/40 border-ink/8",
                    isDeleted && "opacity-60 italic",
                  )}
                >
                  <div className="flex items-center gap-2 mb-1 text-[11px] font-mono">
                    <span className="text-graphite">{c.authorEmail}</span>
                    <span className="text-muted">{fmtDate(c.createdAt)}</span>
                    {isOwn && !isDeleted && (
                      <button
                        onClick={() => remove(c.id)}
                        className="ml-auto text-muted hover:text-ember"
                        title="Supprimer"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                  <div className="text-sm text-ink whitespace-pre-wrap break-words leading-relaxed">
                    {renderBody(c.body)}
                  </div>
                  {c.mentions.length > 0 && !isDeleted && (
                    <div className="mt-2 flex items-center gap-1 flex-wrap">
                      {c.mentions.map((m) => (
                        <span
                          key={m}
                          className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-copper/10 text-copper text-[10px] font-mono"
                        >
                          <AtSign className="h-2.5 w-2.5" />
                          {m}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
