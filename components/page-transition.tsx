"use client";

/**
 * Transition de page sobre — fade-in du contenu + barre copper en haut
 * pendant ~400ms à chaque changement de route.
 *
 * Pas de full-screen curtain (trop tape-à-l'œil) — juste un signal de chargement
 * subtil + un fade des sections. Réinitialise le scroll en haut à chaque
 * navigation (que Next ne fait pas toujours sur changements de query/hash).
 *
 * À placer une fois dans `app/layout.tsx`, autour de `{children}`.
 */

import { useEffect, useState, useRef } from "react";
import { usePathname } from "next/navigation";

export function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [pulse, setPulse] = useState(false);
  const first = useRef(true);

  useEffect(() => {
    // Skip l'effet au premier rendu (hydration)
    if (first.current) {
      first.current = false;
      return;
    }
    setPulse(true);
    // Scroll top sur navigation interne (Next ne le fait pas toujours sur les
    // changements de search params / hash dynamiques).
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
    }
    const t = setTimeout(() => setPulse(false), 600);
    return () => clearTimeout(t);
  }, [pathname]);

  return (
    <>
      {/* Barre copper en haut pendant la transition */}
      <div
        aria-hidden
        className={`fixed top-0 left-0 right-0 z-[70] pointer-events-none transition-opacity duration-200 ${
          pulse ? "opacity-100" : "opacity-0"
        }`}
      >
        <div className="h-0.5 w-full bg-ink/5 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-copper via-ember to-copper"
            style={{
              width: "40%",
              animation: "page-transition-slide 0.6s ease-out forwards",
            }}
          />
        </div>
        <style>{`
          @keyframes page-transition-slide {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(350%); }
          }
        `}</style>
      </div>

      {/* Fade du contenu — clé sur le pathname pour forcer le remount */}
      <div
        key={pathname}
        className="motion-safe:animate-page-fade"
        style={{
          animation: "page-fade-in 0.4s cubic-bezier(0.22, 1, 0.36, 1)",
        }}
      >
        {children}
      </div>

      <style>{`
        @keyframes page-fade-in {
          0% {
            opacity: 0;
            transform: translateY(6px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @media (prefers-reduced-motion: reduce) {
          @keyframes page-fade-in {
            0%, 100% { opacity: 1; transform: none; }
          }
        }
      `}</style>
    </>
  );
}
