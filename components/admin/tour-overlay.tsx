"use client";

/**
 * Overlay du tour interactif admin (W33.4).
 *
 * Comportement :
 *   - Lit localStorage["ca-tour-step"] au montage. Si vide / null, le tour est
 *     inactif et le composant ne rend rien.
 *   - Quand actif, affiche un panneau flottant en bas-droite avec le titre,
 *     le corps, et les boutons Précédent / Suivant / Quitter.
 *   - Surveille pathname : si l'étape courante a une `path` différente de la
 *     page actuelle, affiche un bouton "Aller à [path]" plutôt que "Suivant".
 *   - Si `anchorSelector` est défini, applique un halo discret autour du
 *     premier élément matchant + scroll into view.
 *
 * Persistance : index courant en localStorage. Suppression à la fin ou
 * au clic "Quitter".
 *
 * Mounté dans `app/admin/layout.tsx` → présent partout en /admin/*.
 * Inerte si /admin/login, etc. (rien si l'utilisateur n'a pas démarré).
 */

import { useEffect, useState, useCallback } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  X,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  MapPin,
  Sparkles,
} from "lucide-react";
import {
  TOUR_STEPS,
  TOUR_STORAGE_KEY,
  TOUR_DISMISSED_KEY,
} from "@/lib/tour-steps";

const HALO_CLASS = "ca-tour-halo";

function readStep(): number | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(TOUR_STORAGE_KEY);
  if (raw === null) return null;
  const n = parseInt(raw, 10);
  if (Number.isNaN(n) || n < 0 || n >= TOUR_STEPS.length) return null;
  return n;
}

function writeStep(n: number | null) {
  if (typeof window === "undefined") return;
  if (n === null) {
    localStorage.removeItem(TOUR_STORAGE_KEY);
  } else {
    localStorage.setItem(TOUR_STORAGE_KEY, String(n));
  }
}

export function TourOverlay() {
  const router = useRouter();
  const pathname = usePathname();
  const [stepIdx, setStepIdx] = useState<number | null>(null);
  const [mounted, setMounted] = useState(false);

  // Init au montage uniquement (évite hydration mismatch)
  useEffect(() => {
    setMounted(true);
    setStepIdx(readStep());
  }, []);

  // Écoute les changements externes (autres onglets, ou trigger côté UI)
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === TOUR_STORAGE_KEY) {
        setStepIdx(readStep());
      }
    };
    const onCustom = () => setStepIdx(readStep());
    window.addEventListener("storage", onStorage);
    window.addEventListener("ca-tour-changed", onCustom);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("ca-tour-changed", onCustom);
    };
  }, []);

  const step = stepIdx !== null ? TOUR_STEPS[stepIdx] : null;
  const onCorrectPage =
    step !== null && (pathname === step.path || pathname?.startsWith(step.path));

  // Halo sur l'élément cible
  useEffect(() => {
    if (!step?.anchorSelector || !onCorrectPage) return;
    const el = document.querySelector(step.anchorSelector);
    if (!el) return;
    el.classList.add(HALO_CLASS);
    el.scrollIntoView({ behavior: "smooth", block: "center" });
    return () => {
      el.classList.remove(HALO_CLASS);
    };
  }, [step, onCorrectPage, pathname]);

  const navigate = useCallback(
    (nextIdx: number | null) => {
      writeStep(nextIdx);
      setStepIdx(nextIdx);
      window.dispatchEvent(new Event("ca-tour-changed"));
      if (nextIdx !== null) {
        const target = TOUR_STEPS[nextIdx];
        if (target && target.path !== pathname) {
          router.push(target.path);
        }
      }
    },
    [router, pathname],
  );

  const quit = useCallback(() => {
    writeStep(null);
    if (typeof window !== "undefined") {
      localStorage.setItem(TOUR_DISMISSED_KEY, new Date().toISOString());
    }
    setStepIdx(null);
    window.dispatchEvent(new Event("ca-tour-changed"));
  }, []);

  if (!mounted || step === null || stepIdx === null) return null;

  const isLast = stepIdx === TOUR_STEPS.length - 1;
  const isFirst = stepIdx === 0;

  return (
    <>
      <style jsx global>{`
        .${HALO_CLASS} {
          position: relative;
          z-index: 1;
        }
        .${HALO_CLASS}::before {
          content: "";
          position: absolute;
          inset: -8px;
          border-radius: 12px;
          background: radial-gradient(
            circle at center,
            rgba(184, 106, 54, 0.18) 0%,
            rgba(184, 106, 54, 0) 70%
          );
          box-shadow: 0 0 0 2px rgba(184, 106, 54, 0.4),
            0 0 0 6px rgba(184, 106, 54, 0.12);
          pointer-events: none;
          animation: ca-tour-pulse 2s ease-in-out infinite;
          z-index: -1;
        }
        @keyframes ca-tour-pulse {
          0%, 100% {
            opacity: 0.8;
          }
          50% {
            opacity: 1;
          }
        }
      `}</style>

      <div
        role="dialog"
        aria-label="Tour interactif"
        className="fixed bottom-5 right-5 z-[100] w-[min(380px,calc(100vw-2.5rem))] rounded-2xl border border-ink/10 bg-white shadow-xl"
      >
        {/* Barre de progression */}
        <div className="h-1 rounded-t-2xl bg-cream overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-copper to-ember transition-all duration-500"
            style={{
              width: `${((stepIdx + 1) / TOUR_STEPS.length) * 100}%`,
            }}
          />
        </div>

        <div className="p-5">
          <div className="flex items-start justify-between gap-2 mb-3">
            <div className="flex items-center gap-2">
              <span className="h-7 w-7 rounded-full grid place-items-center bg-copper/10 border border-copper/30 text-copper">
                <Sparkles className="h-3.5 w-3.5" />
              </span>
              <div>
                <div className="font-mono text-[10px] uppercase tracking-eyebrow text-copper">
                  Tour guidé · étape {stepIdx + 1}/{TOUR_STEPS.length}
                </div>
                <div className="font-display text-base text-ink">
                  {step.title}
                </div>
              </div>
            </div>
            <button
              onClick={quit}
              aria-label="Quitter le tour"
              className="text-graphite hover:text-ink transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <p className="text-sm text-graphite leading-relaxed mb-3">
            {step.body}
          </p>

          {step.hint && onCorrectPage && (
            <div className="rounded-lg bg-cream/60 px-3 py-2 text-xs text-graphite mb-3">
              <span className="font-mono text-[9px] uppercase tracking-eyebrow text-copper mr-1.5">
                Astuce
              </span>
              {step.hint}
            </div>
          )}

          {!onCorrectPage && (
            <div className="rounded-lg bg-copper/5 border border-copper/20 px-3 py-2 text-xs text-graphite mb-3 inline-flex items-start gap-2 w-full">
              <MapPin className="h-3.5 w-3.5 text-copper mt-0.5 shrink-0" />
              <span>
                Cette étape se passe sur <span className="font-mono">{step.path}</span>.
                Cliquez « Y aller ».
              </span>
            </div>
          )}

          <div className="flex items-center gap-2 justify-between">
            <button
              onClick={() => navigate(stepIdx - 1)}
              disabled={isFirst}
              className="inline-flex items-center gap-1 text-xs text-graphite hover:text-copper disabled:opacity-30 transition-colors"
            >
              <ArrowLeft className="h-3 w-3" />
              Précédent
            </button>

            <div className="flex items-center gap-2">
              {!onCorrectPage ? (
                <button
                  onClick={() => router.push(step.path)}
                  className="inline-flex items-center gap-1 rounded-full bg-ink text-cream px-3 py-1.5 text-xs hover:bg-copper transition-colors"
                >
                  <MapPin className="h-3 w-3" />
                  Y aller
                </button>
              ) : isLast ? (
                <button
                  onClick={quit}
                  className="inline-flex items-center gap-1 rounded-full bg-[#22a06b] text-cream px-3 py-1.5 text-xs hover:opacity-90 transition-opacity"
                >
                  <CheckCircle2 className="h-3 w-3" />
                  Terminer
                </button>
              ) : (
                <button
                  onClick={() => navigate(stepIdx + 1)}
                  className="inline-flex items-center gap-1 rounded-full bg-ink text-cream px-3 py-1.5 text-xs hover:bg-copper transition-colors"
                >
                  Suivant
                  <ArrowRight className="h-3 w-3" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

/**
 * Bouton à monter dans `/admin/guide` ou ailleurs pour démarrer ou reprendre
 * le tour. Lit/écrit localStorage et dispatch un event pour notifier l'overlay.
 */
export function TourLauncher() {
  const router = useRouter();
  const [current, setCurrent] = useState<number | null>(null);

  useEffect(() => {
    setCurrent(readStep());
    const onCustom = () => setCurrent(readStep());
    window.addEventListener("ca-tour-changed", onCustom);
    return () => window.removeEventListener("ca-tour-changed", onCustom);
  }, []);

  const start = () => {
    writeStep(0);
    window.dispatchEvent(new Event("ca-tour-changed"));
    router.push(TOUR_STEPS[0].path);
  };

  const resume = () => {
    if (current === null) return start();
    window.dispatchEvent(new Event("ca-tour-changed"));
    router.push(TOUR_STEPS[current].path);
  };

  const stop = () => {
    writeStep(null);
    window.dispatchEvent(new Event("ca-tour-changed"));
  };

  if (current !== null) {
    return (
      <div className="inline-flex items-center gap-2">
        <button
          onClick={resume}
          className="inline-flex items-center gap-2 rounded-full bg-ink text-cream px-4 py-2 text-sm hover:bg-copper transition-colors"
        >
          <Sparkles className="h-3.5 w-3.5" />
          Reprendre le tour (étape {current + 1}/{TOUR_STEPS.length})
        </button>
        <button
          onClick={stop}
          className="inline-flex items-center gap-1 text-xs text-graphite hover:text-ember transition-colors"
        >
          <X className="h-3 w-3" />
          Arrêter
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={start}
      className="inline-flex items-center gap-2 rounded-full bg-ink text-cream px-4 py-2 text-sm hover:bg-copper transition-colors"
    >
      <Sparkles className="h-3.5 w-3.5" />
      Démarrer le tour guidé (8 étapes, 4 min)
    </button>
  );
}
