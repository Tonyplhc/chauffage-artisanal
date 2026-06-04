"use client";

/**
 * Notifications foreground pour l'admin.
 *
 * Quand l'onglet admin n'est pas focalisé et qu'un événement arrive sur le SSE
 * (/api/admin/events), on :
 *   - Incrémente un compteur d'événements non-vus
 *   - Fait clignoter le titre de l'onglet "(N) ▸ Pipeline · Admin"
 *   - Redessine la favicon avec un point copper en bas à droite (canvas)
 *   - Joue un petit bip discret (WebAudio, désactivable)
 *
 * Au retour de focus (visibilitychange → visible) : reset complet, on remet le
 * titre original et la favicon vide.
 *
 * Préférences persistées localStorage `ca-fg-notify` : { sound, favicon, title }.
 *
 * À monter dans `app/admin/layout.tsx` au-dessus de children. Indépendant du
 * <LiveFeed/> qui gère les toasts en page.
 */

import { useEffect, useRef, useState, useCallback } from "react";
import { Bell, BellOff, X as XIcon } from "lucide-react";

type Prefs = {
  sound: boolean;
  favicon: boolean;
  title: boolean;
};

const DEFAULTS: Prefs = { sound: true, favicon: true, title: true };
const STORAGE_KEY = "ca-fg-notify";

function readPrefs(): Prefs {
  if (typeof window === "undefined") return DEFAULTS;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULTS;
    return { ...DEFAULTS, ...(JSON.parse(raw) as Partial<Prefs>) };
  } catch {
    return DEFAULTS;
  }
}

function writePrefs(p: Prefs) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(p));
  } catch {}
}

/* ---------- Audio : un bip court via WebAudio, sans asset externe ---------- */
function playBeep() {
  try {
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(660, ctx.currentTime + 0.15);
    gain.gain.setValueAtTime(0.0001, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.18, ctx.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.35);
    osc.connect(gain).connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.4);
    osc.onended = () => ctx.close().catch(() => {});
  } catch {
    // ignore — audio peut être bloqué jusqu'à une interaction user
  }
}

/* ---------- Favicon helpers ---------- */

function getFaviconLink(): HTMLLinkElement {
  let link = document.querySelector<HTMLLinkElement>("link[rel~='icon']");
  if (!link) {
    link = document.createElement("link");
    link.rel = "icon";
    document.head.appendChild(link);
  }
  return link;
}

function drawBadgeFavicon(originalHref: string): Promise<string> {
  return new Promise((resolve) => {
    const size = 64;
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");
    if (!ctx) return resolve(originalHref);

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      ctx.drawImage(img, 0, 0, size, size);
      // Pastille copper en bas à droite
      ctx.beginPath();
      ctx.arc(size - 16, size - 16, 16, 0, Math.PI * 2);
      ctx.fillStyle = "#b86a36";
      ctx.fill();
      ctx.lineWidth = 4;
      ctx.strokeStyle = "#fff";
      ctx.stroke();
      resolve(canvas.toDataURL("image/png"));
    };
    img.onerror = () => {
      // Pas de favicon source — on génère une favicon générique copper
      ctx.fillStyle = "#1e1a15";
      ctx.fillRect(0, 0, size, size);
      ctx.beginPath();
      ctx.arc(size - 16, size - 16, 16, 0, Math.PI * 2);
      ctx.fillStyle = "#b86a36";
      ctx.fill();
      resolve(canvas.toDataURL("image/png"));
    };
    img.src = originalHref || "/favicon.ico";
  });
}

/* ---------- Component principal ---------- */

export function ForegroundNotifier() {
  const [prefs, setPrefs] = useState<Prefs>(DEFAULTS);
  const [panelOpen, setPanelOpen] = useState(false);
  const [count, setCount] = useState(0);

  const originalTitleRef = useRef<string>("");
  const originalFaviconRef = useRef<string>("");
  const badgeFaviconRef = useRef<string>("");
  const flashTimerRef = useRef<number | null>(null);
  const flashStateRef = useRef<boolean>(false);
  const sourceRef = useRef<EventSource | null>(null);

  // Hydrate prefs
  useEffect(() => {
    setPrefs(readPrefs());
  }, []);

  // Mémorise le titre + la favicon originaux au mount
  useEffect(() => {
    originalTitleRef.current = document.title;
    const link = getFaviconLink();
    originalFaviconRef.current = link.href || "/favicon.ico";
  }, []);

  const stopFlashing = useCallback(() => {
    if (flashTimerRef.current !== null) {
      window.clearInterval(flashTimerRef.current);
      flashTimerRef.current = null;
    }
    flashStateRef.current = false;
    if (originalTitleRef.current) {
      document.title = originalTitleRef.current;
    }
    if (originalFaviconRef.current) {
      getFaviconLink().href = originalFaviconRef.current;
    }
  }, []);

  const reset = useCallback(() => {
    setCount(0);
    stopFlashing();
  }, [stopFlashing]);

  // Détecte le retour de focus → reset
  useEffect(() => {
    const onVisible = () => {
      if (!document.hidden) reset();
    };
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", onVisible);
    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", onVisible);
    };
  }, [reset]);

  // Connecte le SSE
  useEffect(() => {
    let cancelled = false;
    let backoffMs = 1000;

    const connect = () => {
      if (cancelled) return;
      const es = new EventSource("/api/admin/events");
      sourceRef.current = es;

      es.onopen = () => {
        backoffMs = 1000;
      };

      es.onmessage = (evt) => {
        try {
          const data = JSON.parse(evt.data) as { type: string };
          if (data.type === "hello" || !data.type) return;
          // Compte uniquement quand l'onglet n'est pas focalisé
          if (!document.hidden) return;
          setCount((c) => c + 1);
        } catch {
          // ignore
        }
      };

      es.onerror = () => {
        es.close();
        if (cancelled) return;
        window.setTimeout(connect, backoffMs);
        backoffMs = Math.min(backoffMs * 2, 15_000);
      };
    };

    connect();
    return () => {
      cancelled = true;
      sourceRef.current?.close();
      sourceRef.current = null;
    };
  }, []);

  // Effets visuels + sonores quand count change
  useEffect(() => {
    if (count === 0) {
      stopFlashing();
      return;
    }

    // Son (best-effort, peut être bloqué tant que l'utilisateur n'a pas
    // interagi avec la page)
    if (prefs.sound) playBeep();

    // Favicon badge
    if (prefs.favicon) {
      // Calcule la favicon badge si pas déjà fait
      if (!badgeFaviconRef.current && originalFaviconRef.current) {
        drawBadgeFavicon(originalFaviconRef.current).then((dataUrl) => {
          badgeFaviconRef.current = dataUrl;
          if (count > 0) {
            getFaviconLink().href = dataUrl;
          }
        });
      } else if (badgeFaviconRef.current) {
        getFaviconLink().href = badgeFaviconRef.current;
      }
    }

    // Titre clignotant
    if (prefs.title) {
      if (flashTimerRef.current !== null)
        window.clearInterval(flashTimerRef.current);
      const original = originalTitleRef.current || document.title;
      const badge = `(${count}) ▸ ${original}`;
      flashStateRef.current = true;
      document.title = badge;
      flashTimerRef.current = window.setInterval(() => {
        flashStateRef.current = !flashStateRef.current;
        document.title = flashStateRef.current ? badge : original;
      }, 1500);
    }
  }, [count, prefs.sound, prefs.favicon, prefs.title, stopFlashing]);

  // Cleanup global au démontage
  useEffect(() => {
    return () => {
      stopFlashing();
    };
  }, [stopFlashing]);

  const updatePref = (k: keyof Prefs, v: boolean) => {
    setPrefs((p) => {
      const next = { ...p, [k]: v };
      writePrefs(next);
      return next;
    });
  };

  return (
    <div className="pointer-events-none fixed bottom-4 left-4 z-[70] flex flex-col items-start gap-2">
      {panelOpen && (
        <div className="pointer-events-auto rounded-2xl border border-ink/10 bg-white shadow-lift p-4 w-72">
          <div className="flex items-center justify-between mb-3">
            <div className="font-mono text-[10px] uppercase tracking-eyebrow text-copper">
              Notifications onglet
            </div>
            <button
              onClick={() => setPanelOpen(false)}
              className="h-6 w-6 grid place-items-center rounded-full bg-cream border border-ink/10 text-graphite hover:bg-ink hover:text-cream transition-colors"
              aria-label="Fermer"
            >
              <XIcon className="h-3 w-3" />
            </button>
          </div>
          <div className="grid gap-2">
            <Toggle
              label="Clignotement du titre"
              hint="(3) ▸ Pipeline …"
              checked={prefs.title}
              onChange={(v) => updatePref("title", v)}
            />
            <Toggle
              label="Pastille favicon"
              hint="Point copper sur l'icône"
              checked={prefs.favicon}
              onChange={(v) => updatePref("favicon", v)}
            />
            <Toggle
              label="Bip sonore"
              hint="Court signal à chaque event"
              checked={prefs.sound}
              onChange={(v) => updatePref("sound", v)}
            />
          </div>
          <p className="mt-3 pt-3 border-t border-ink/8 text-[11px] text-muted leading-relaxed">
            Actif uniquement quand l&apos;onglet est en arrière-plan. Reset au
            retour de focus.
          </p>
        </div>
      )}
      <button
        onClick={() => setPanelOpen((v) => !v)}
        className="pointer-events-auto relative h-10 w-10 grid place-items-center rounded-full bg-white border border-ink/10 shadow-soft text-graphite hover:bg-ink hover:text-cream hover:border-ink transition-colors"
        aria-label="Préférences notifications onglet"
        title="Notifications onglet"
      >
        {prefs.sound || prefs.title || prefs.favicon ? (
          <Bell className="h-4 w-4" />
        ) : (
          <BellOff className="h-4 w-4" />
        )}
        {count > 0 && (
          <span className="absolute -top-1 -right-1 h-4 min-w-[16px] px-1 rounded-full bg-copper text-cream text-[10px] font-mono grid place-items-center">
            {count}
          </span>
        )}
      </button>
    </div>
  );
}

function Toggle({
  label,
  hint,
  checked,
  onChange,
}: {
  label: string;
  hint?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex items-start gap-3 cursor-pointer">
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`mt-0.5 h-5 w-9 rounded-full transition-colors relative shrink-0 ${
          checked ? "bg-ink" : "bg-cream border border-ink/15"
        }`}
      >
        <span
          className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-all ${
            checked ? "left-[18px]" : "left-0.5"
          }`}
        />
      </button>
      <span className="min-w-0 flex-1">
        <div className="text-sm text-ink">{label}</div>
        {hint && <div className="text-[11px] text-muted">{hint}</div>}
      </span>
    </label>
  );
}

