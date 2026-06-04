"use client";

import { useEffect } from "react";

/**
 * Lenis smooth-scroll uniquement :
 *   - desktop avec souris (pas tactile)
 *   - sans prefers-reduced-motion
 *   - largeur écran >= 1024px
 * Sur mobile, le scroll natif est plus fluide et économise du CPU/RAM.
 */
export function SmoothScroll() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    const isTouch = window.matchMedia("(pointer: coarse)").matches;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const tooSmall = window.innerWidth < 1024;
    if (isTouch || reduced || tooSmall) return;

    let lenis: any;
    let raf: number;
    (async () => {
      const Lenis = (await import("lenis")).default;
      lenis = new Lenis({
        duration: 1.15,
        easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        smoothWheel: true,
      });
      const tick = (time: number) => {
        lenis.raf(time);
        raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    })();
    return () => {
      cancelAnimationFrame(raf);
      lenis?.destroy?.();
    };
  }, []);
  return null;
}
