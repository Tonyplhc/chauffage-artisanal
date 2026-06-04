"use client";

/**
 * Feed temps réel pour le dashboard admin.
 *
 * Connexion EventSource à /api/admin/events. À chaque nouvel événement :
 *   - Affichage d'un toast dans le coin (auto-dismiss 8s)
 *   - Petit son (optionnel, désactivable)
 *   - Callback `onLead` pour rafraîchir la liste dans le parent
 *
 * Reconnexion auto en cas de coupure. Indicateur de connexion visible.
 */

import { useEffect, useRef, useState, useCallback } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bell,
  BellOff,
  Inbox,
  ArrowRight,
  X as XIcon,
  Wifi,
  WifiOff,
  Flame,
} from "lucide-react";

type LeadEvent = {
  type: "lead.created";
  at: string;
  reference: string;
  fullName: string;
  services: string[];
  commune: string;
  level?: "hot" | "warm" | "cold";
  score?: number;
};

type StatusEvent = {
  type: "lead.status_changed";
  at: string;
  reference: string;
  from: string;
  to: string;
};

type BusEvent = LeadEvent | StatusEvent | { type: "hello"; at: string };

type Toast = {
  id: string;
  event: LeadEvent;
};

export function AdminLiveFeed({ onLead }: { onLead?: () => void }) {
  const [connected, setConnected] = useState(false);
  const [enabled, setEnabled] = useState(true);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const sourceRef = useRef<EventSource | null>(null);

  const dismiss = useCallback((id: string) => {
    setToasts((ts) => ts.filter((t) => t.id !== id));
  }, []);

  useEffect(() => {
    if (!enabled) {
      sourceRef.current?.close();
      sourceRef.current = null;
      setConnected(false);
      return;
    }

    const src = new EventSource("/api/admin/events");
    sourceRef.current = src;

    src.onopen = () => setConnected(true);
    src.onerror = () => setConnected(false);

    src.onmessage = (msg) => {
      try {
        const evt = JSON.parse(msg.data) as BusEvent;
        if (evt.type === "lead.created") {
          const toast: Toast = {
            id: `${evt.reference}-${evt.at}`,
            event: evt,
          };
          setToasts((ts) => [toast, ...ts].slice(0, 5));
          onLead?.();
          // Auto-dismiss 8s
          setTimeout(() => dismiss(toast.id), 8000);
          // Tentative de son (silencieux si bloqué)
          try {
            const ctx = new (window.AudioContext ||
              (window as unknown as { webkitAudioContext: typeof AudioContext })
                .webkitAudioContext)();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.frequency.value = evt.level === "hot" ? 880 : 660;
            gain.gain.setValueAtTime(0.0001, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.15, ctx.currentTime + 0.02);
            gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.3);
            osc.start();
            osc.stop(ctx.currentTime + 0.32);
          } catch {
            // pas grave si le navigateur bloque
          }
        } else if (evt.type === "lead.status_changed") {
          onLead?.();
        }
      } catch {
        // ignore malformed
      }
    };

    return () => {
      src.close();
      sourceRef.current = null;
    };
  }, [enabled, onLead, dismiss]);

  return (
    <>
      {/* Indicateur dans le header admin */}
      <button
        onClick={() => setEnabled((v) => !v)}
        title={enabled ? "Désactiver les notifications" : "Activer les notifications"}
        className={`inline-flex items-center gap-2 rounded-full border px-4 py-2.5 text-sm transition-colors ${
          enabled
            ? connected
              ? "border-[#22a06b]/40 bg-[#22a06b]/8 text-[#22a06b]"
              : "border-ember/40 bg-ember/8 text-ember"
            : "border-ink/15 bg-white text-graphite hover:border-copper/40"
        }`}
      >
        {enabled ? (
          connected ? (
            <>
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#22a06b] opacity-75"></span>
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[#22a06b]"></span>
              </span>
              <Wifi className="h-4 w-4" />
              Live
            </>
          ) : (
            <>
              <WifiOff className="h-4 w-4" />
              Reconnexion…
            </>
          )
        ) : (
          <>
            <BellOff className="h-4 w-4" />
            Notifs off
          </>
        )}
      </button>

      {/* Toasts en bas à droite */}
      <div className="fixed bottom-4 right-4 lg:bottom-6 lg:right-6 z-[60] grid gap-2 max-w-sm pointer-events-none">
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 12, x: 20 }}
              animate={{ opacity: 1, y: 0, x: 0 }}
              exit={{ opacity: 0, x: 40 }}
              transition={{ type: "spring", stiffness: 320, damping: 28 }}
              className="pointer-events-auto p-4 rounded-2xl bg-white border border-ink/10 shadow-lift flex items-start gap-3"
            >
              <span
                className={`h-10 w-10 rounded-full grid place-items-center border shrink-0 ${
                  t.event.level === "hot"
                    ? "bg-ember/10 border-ember/40 text-ember"
                    : t.event.level === "warm"
                    ? "bg-copper/10 border-copper/40 text-copper"
                    : "bg-cream border-ink/10 text-graphite"
                }`}
              >
                {t.event.level === "hot" ? (
                  <Flame className="h-4 w-4" />
                ) : (
                  <Inbox className="h-4 w-4" />
                )}
              </span>
              <div className="min-w-0 flex-1">
                <div className="font-mono text-[10px] uppercase tracking-eyebrow text-copper">
                  Nouveau lead · {t.event.level ? t.event.level.toUpperCase() : "?"}{" "}
                  {t.event.score != null && (
                    <span className="text-muted">({t.event.score}/100)</span>
                  )}
                </div>
                <div className="mt-1 font-medium text-sm text-ink truncate">
                  {t.event.fullName}
                </div>
                <div className="mt-0.5 text-xs text-muted truncate">
                  {t.event.services.join(" · ")} · {t.event.commune}
                </div>
                <Link
                  href={`/admin/leads/${t.event.reference}`}
                  onClick={() => dismiss(t.id)}
                  className="mt-2 inline-flex items-center gap-1 text-xs font-mono uppercase tracking-eyebrow text-ink hover:text-copper transition-colors"
                >
                  Ouvrir
                  <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
              <button
                onClick={() => dismiss(t.id)}
                className="h-6 w-6 rounded-full grid place-items-center text-muted hover:text-ink transition-colors shrink-0"
                aria-label="Fermer"
              >
                <XIcon className="h-3 w-3" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </>
  );
}
