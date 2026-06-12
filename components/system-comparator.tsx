"use client";

/**
 * Comparateur avant/après par service.
 *
 * UI : deux cartes côte à côte, l'une "Ancien système" l'autre "Nouveau".
 * Pour chaque dimension comparée (rendement, émissions, bruit, maintenance,
 * etc.), une jauge horizontale qualitative — pas de chiffre inventé.
 *
 * Toggle entre plusieurs scénarios courants par service (ex: PAC vs gaz,
 * chaudière condensation vs fioul, etc.).
 */

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight,
  ArrowDown,
  CircleAlert,
  CheckCircle2,
  type LucideIcon,
} from "lucide-react";
import { Eyebrow, Reveal, SectionTitle } from "@/components/ui";

export type Scenario = {
  id: string;
  label: string;
  before: { title: string; subtitle?: string };
  after: { title: string; subtitle?: string };
  /** Score qualitatif 0..5 : -1 indique "non applicable" / pas mesuré. */
  dimensions: {
    label: string;
    before: number; // 0..5
    after: number; // 0..5
    note?: string;
  }[];
  takeaways: string[];
};

const DIM_LEVELS = [
  { from: 0, to: 1, label: "Faible", color: "#C0392B" },
  { from: 1, to: 2, label: "Moyen-faible", color: "#C0392B" },
  { from: 2, to: 3, label: "Moyen", color: "#0B57A0" },
  { from: 3, to: 4, label: "Bon", color: "#2E7D5A" },
  { from: 4, to: 5, label: "Excellent", color: "#2E7D5A" },
];

function dimColor(v: number): string {
  if (v <= 1.5) return "#C0392B";
  if (v <= 3) return "#0B57A0";
  return "#2E7D5A";
}

export function SystemComparator({
  scenarios,
  number,
  eyebrow = "Comparateur",
  title,
  intro,
  icon: Icon,
}: {
  scenarios: Scenario[];
  number?: string;
  eyebrow?: string;
  title?: React.ReactNode;
  intro?: string;
  icon?: LucideIcon;
}) {
  const [activeId, setActiveId] = useState(scenarios[0]?.id);
  const active = scenarios.find((s) => s.id === activeId) ?? scenarios[0];

  return (
    <section className="py-14 lg:py-20 bg-creme border-y border-pierre">
      <div className="container">
        <div className="max-w-3xl mb-10">
          <Eyebrow number={number}>{eyebrow}</Eyebrow>
          <Reveal>
            <SectionTitle className="mt-4">
              {title ?? (
                <>
                  Ce qui change <em className="not-italic text-bleu">concrètement</em>.
                </>
              )}
            </SectionTitle>
          </Reveal>
          <Reveal delay={1}>
            <p className="mt-5 text-taupe leading-relaxed">
              {intro ??
                "Lecture qualitative — pas de chiffres marketing. Les performances réelles dépendent du dimensionnement et de la pose."}
            </p>
          </Reveal>
        </div>

        {/* Toggle scénarios */}
        {scenarios.length > 1 && (
          <div className="mb-8 flex flex-wrap gap-2">
            {scenarios.map((s) => (
              <button
                key={s.id}
                onClick={() => setActiveId(s.id)}
                className={`px-4 py-2 rounded-full text-sm font-mono uppercase tracking-eyebrow border transition-all ${
                  activeId === s.id
                    ? "bg-navy text-creme border-anthra"
                    : "bg-white text-taupe border-pierre hover:border-bleu/40 hover:text-anthra"
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        )}

        {/* Deux cartes côte à côte */}
        <AnimatePresence mode="wait">
          <motion.div
            key={active.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.35 }}
            className="grid md:grid-cols-2 gap-4 lg:gap-6"
          >
            {/* Avant */}
            <div className="p-6 lg:p-8 rounded-3xl border border-pierre bg-white relative">
              <div className="font-mono text-[10px] uppercase tracking-eyebrow text-muted mb-3">
                Ancien système
              </div>
              <div className="flex items-start gap-3 mb-6">
                <CircleAlert className="h-5 w-5 text-taupe mt-1 shrink-0" />
                <div>
                  <h3 className="font-display text-2xl text-anthra tracking-tight">
                    {active.before.title}
                  </h3>
                  {active.before.subtitle && (
                    <p className="mt-1 text-sm text-taupe">{active.before.subtitle}</p>
                  )}
                </div>
              </div>

              <div className="space-y-3">
                {active.dimensions.map((d) => (
                  <DimRow
                    key={d.label}
                    label={d.label}
                    value={d.before}
                    side="before"
                  />
                ))}
              </div>
            </div>

            {/* Connector flèche entre cartes (mobile : flèche bas) */}
            <div className="hidden md:flex absolute -mt-3" />

            {/* Après */}
            <div className="p-6 lg:p-8 rounded-3xl border-2 border-bleu/40 bg-white relative">
              <div className="font-mono text-[10px] uppercase tracking-eyebrow text-bleu mb-3">
                Nouveau système
              </div>
              <div className="flex items-start gap-3 mb-6">
                <CheckCircle2 className="h-5 w-5 text-bleu mt-1 shrink-0" />
                <div>
                  <h3 className="font-display text-2xl text-anthra tracking-tight">
                    {active.after.title}
                  </h3>
                  {active.after.subtitle && (
                    <p className="mt-1 text-sm text-taupe">{active.after.subtitle}</p>
                  )}
                </div>
              </div>

              <div className="space-y-3">
                {active.dimensions.map((d) => (
                  <DimRow
                    key={d.label}
                    label={d.label}
                    value={d.after}
                    side="after"
                  />
                ))}
              </div>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Takeaways */}
        {active.takeaways.length > 0 && (
          <motion.div
            key={`${active.id}-take`}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-6 p-5 lg:p-6 rounded-2xl bg-white border border-pierre"
          >
            <div className="font-mono text-[10px] uppercase tracking-eyebrow text-bleu mb-3">
              Ce que vous gagnez concrètement
            </div>
            <ul className="grid sm:grid-cols-2 gap-2.5">
              {active.takeaways.map((t) => (
                <li key={t} className="flex items-start gap-2.5 text-sm text-taupe">
                  <CheckCircle2 className="h-4 w-4 text-bleu mt-0.5 shrink-0" />
                  <span>{t}</span>
                </li>
              ))}
            </ul>
          </motion.div>
        )}
      </div>
    </section>
  );
}

function DimRow({
  label,
  value,
  side,
}: {
  label: string;
  value: number;
  side: "before" | "after";
}) {
  const clamped = Math.max(0, Math.min(5, value));
  const pct = (clamped / 5) * 100;
  const color = side === "before" ? "#8b847a" : dimColor(clamped);
  const tier = DIM_LEVELS.find((l) => clamped >= l.from && clamped < l.to + 0.01)?.label ?? "—";
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-xs text-taupe">{label}</span>
        <span
          className="text-xs font-mono uppercase tracking-eyebrow"
          style={{ color }}
        >
          {tier}
        </span>
      </div>
      <div className="h-1.5 rounded-full bg-sable/60 overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.6 }}
          className="h-full rounded-full"
          style={{ background: color }}
        />
      </div>
    </div>
  );
}
