"use client";

import { useRef, useState, useCallback } from "react";
import Image from "next/image";

export function BeforeAfter({
  before,
  after,
  beforeAlt = "",
  afterAlt = "",
  ratio = "4/3",
}: {
  before: string;
  after: string;
  beforeAlt?: string;
  afterAlt?: string;
  ratio?: string;
}) {
  const [pos, setPos] = useState(50);
  const wrap = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);

  const handleMove = useCallback((clientX: number) => {
    if (!wrap.current) return;
    const rect = wrap.current.getBoundingClientRect();
    const p = Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100));
    setPos(p);
  }, []);

  return (
    <div
      ref={wrap}
      className="relative w-full overflow-hidden rounded-2xl border border-ink/10 bg-stone select-none touch-none"
      style={{ aspectRatio: ratio.replace("/", " / ") }}
      onPointerDown={(e) => {
        dragging.current = true;
        wrap.current?.setPointerCapture(e.pointerId);
        handleMove(e.clientX);
      }}
      onPointerMove={(e) => {
        if (dragging.current) handleMove(e.clientX);
      }}
      onPointerUp={() => (dragging.current = false)}
    >
      {/* After (background) */}
      <Image src={after} alt={afterAlt} fill sizes="100vw" className="object-cover" />

      {/* Before (clipped) */}
      <div
        className="absolute inset-0 overflow-hidden"
        style={{ clipPath: `inset(0 ${100 - pos}% 0 0)` }}
      >
        <Image src={before} alt={beforeAlt} fill sizes="100vw" className="object-cover" />
      </div>

      {/* Labels */}
      <span className="absolute top-4 left-4 px-3 py-1.5 rounded-full bg-charcoal/70 backdrop-blur-md text-cream text-[10px] font-mono uppercase tracking-eyebrow">
        Avant
      </span>
      <span className="absolute top-4 right-4 px-3 py-1.5 rounded-full bg-copper text-cream text-[10px] font-mono uppercase tracking-eyebrow">
        Après
      </span>

      {/* Handle */}
      <div
        className="absolute top-0 bottom-0 w-px bg-copper pointer-events-none"
        style={{ left: `${pos}%` }}
      >
        <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 h-12 w-12 rounded-full bg-cream border-2 border-copper shadow-card grid place-items-center">
          <span className="font-mono text-copper text-xs">‹ ›</span>
        </div>
      </div>
    </div>
  );
}
