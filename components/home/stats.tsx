"use client";

import { useEffect, useRef, useState } from "react";
import { STATS } from "@/lib/demo-data";

/**
 * Chiffres clés — bande navy, compteurs animés.
 *
 * Source unique : lib/demo-data.ts → STATS (chaque entrée porte un flag `real`).
 *   ✓ réels  : anneesExperience (30), delaiDevis (<24 h)
 *   ⚠ démo   : projetsRealises (3 200), satisfaction (4,8/5)
 * Les valeurs de démo sont marquées DANS LE CODE (demo-data.ts) — aucun badge
 * « démo » n'est affiché côté client. À remplacer par les vraies données avant
 * production.
 */

function Counter({ to, prefix = "" }: { to: number; prefix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [val, setVal] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      setVal(to);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (!e.isIntersecting) return;
          const dur = 1400;
          const t0 = performance.now();
          const tick = (t: number) => {
            const p = Math.min((t - t0) / dur, 1);
            setVal(Math.floor(p * to));
            if (p < 1) requestAnimationFrame(tick);
          };
          requestAnimationFrame(tick);
          io.unobserve(el);
        });
      },
      { threshold: 0.5 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [to]);

  return (
    <span ref={ref}>
      {prefix}
      {val.toLocaleString("fr-FR")}
    </span>
  );
}

export function Stats() {
  return (
    <section className="bg-navy text-creme font-ui">
      <div className="container py-16 grid grid-cols-2 lg:grid-cols-4 gap-8 text-center">
        {/* 30 ans — réel */}
        <div>
          <div className="font-display text-5xl lg:text-6xl tracking-tightest text-bleuvif">
            <Counter to={STATS.anneesExperience.value} />
          </div>
          <div className="mt-2 text-sm text-creme/70">{STATS.anneesExperience.label}</div>
        </div>

        {/* +3 200 installations — démo */}
        <div>
          <div className="font-display text-5xl lg:text-6xl tracking-tightest text-bleuvif">
            <Counter to={STATS.projetsRealises.value} prefix="+" />
          </div>
          <div className="mt-2 text-sm text-creme/70">{STATS.projetsRealises.label}</div>
        </div>

        {/* < 24 h — réel */}
        <div>
          <div className="font-display text-5xl lg:text-6xl tracking-tightest text-bleuvif">
            &lt;{STATS.delaiDevis.value}
            <span className="text-3xl align-baseline">{STATS.delaiDevis.unit}</span>
          </div>
          <div className="mt-2 text-sm text-creme/70">{STATS.delaiDevis.label}</div>
        </div>

        {/* 4,8/5 — démo */}
        <div>
          <div className="font-display text-5xl lg:text-6xl tracking-tightest text-bleuvif">
            {STATS.satisfaction.value.toLocaleString("fr-FR")}
            <span className="text-2xl text-creme/50">{STATS.satisfaction.unit}</span>
          </div>
          <div className="mt-2 text-sm text-creme/70">{STATS.satisfaction.label}</div>
        </div>
      </div>
    </section>
  );
}
