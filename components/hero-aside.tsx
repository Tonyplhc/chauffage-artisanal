import type { LucideIcon } from "lucide-react";

export type HeroAsideItem = {
  label: string;
  body: string;
};

/**
 * Bloc latéral compact pour combler la droite des hero `PageHeader`.
 * Utilisé sur toutes les pages métier + pages institutionnelles pour densifier
 * la mise en page et éviter le grand vide sous l'intro.
 */
export function HeroAside({
  icon: Icon,
  eyebrow,
  items,
  footnote,
  tone = "copper",
}: {
  icon: LucideIcon;
  eyebrow: string;
  items: HeroAsideItem[];
  footnote?: string;
  tone?: "copper" | "ember";
}) {
  const accent = tone === "ember" ? "text-ember" : "text-copper";
  const dot = tone === "ember" ? "bg-ember" : "bg-copper";
  return (
    <div className="rounded-2xl border border-ink/10 bg-white/80 backdrop-blur-sm p-5 lg:p-6 shadow-soft">
      <div
        className={`flex items-center gap-2 font-mono text-[10px] uppercase tracking-eyebrow ${accent}`}
      >
        <Icon className="h-3.5 w-3.5" />
        {eyebrow}
      </div>
      <ul className="mt-4 grid gap-3">
        {items.map((it) => (
          <li key={it.label} className="flex items-start gap-3">
            <span
              className={`mt-1.5 h-1.5 w-1.5 rounded-full ${dot} shrink-0`}
            />
            <div>
              <div className="text-ink font-medium">{it.label}</div>
              <div className="text-xs text-muted">{it.body}</div>
            </div>
          </li>
        ))}
      </ul>
      {footnote && (
        <div className="mt-5 pt-5 border-t border-ink/8 font-mono text-[10px] uppercase tracking-eyebrow text-muted">
          {footnote}
        </div>
      )}
    </div>
  );
}
