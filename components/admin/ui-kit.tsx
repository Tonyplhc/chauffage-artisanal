"use client";

/**
 * Kit UI partagé pour l'admin — éviter les duplications de KPI cards,
 * skeleton loaders, empty states, page shells.
 *
 * Tout est en client-component car la majorité des pages admin sont en
 * `"use client"`. Pour réutilisation côté Server Component, on pourra
 * extraire des versions purement présentationnelles plus tard.
 */

import { type LucideIcon, ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";

/* ── KpiCard ───────────────────────────────────────────────────────────── */

export type KpiCardProps = {
  label: string;
  value: string;
  hint?: string;
  /** Couleur hex appliquée au label + value (pour mettre en avant un état). */
  color?: string;
  /** Icône optionnelle à gauche du label. */
  icon?: LucideIcon;
};

export function KpiCard({ label, value, hint, color, icon: Icon }: KpiCardProps) {
  return (
    <div className="rounded-2xl border border-ink/10 bg-white shadow-soft p-5">
      <div
        className="font-mono text-[10px] uppercase tracking-eyebrow inline-flex items-center gap-1.5"
        style={{ color: color ?? "#8b847a" }}
      >
        {Icon && <Icon className="h-3 w-3" />}
        {label}
      </div>
      <div
        className="mt-2 font-display text-2xl tabular-nums"
        style={{ color: color ?? "#1e1a15" }}
      >
        {value}
      </div>
      {hint && <div className="text-xs text-muted mt-1">{hint}</div>}
    </div>
  );
}

/* ── AdminPageShell ────────────────────────────────────────────────────── */

export type AdminPageShellProps = {
  /** Titre h1 affiché en haut. */
  title: string;
  /** Sous-titre optionnel sous le h1. */
  description?: string;
  /** Lien retour (href + label) — par défaut "Retour pipeline". */
  backHref?: string;
  backLabel?: string;
  /** Élément optionnel à droite du titre (boutons d'action). */
  actions?: React.ReactNode;
  /** Largeur max du container ; défaut 6xl. */
  maxWidth?: "3xl" | "4xl" | "5xl" | "6xl" | "7xl";
  children: React.ReactNode;
};

const MAX_WIDTH_CLASS: Record<NonNullable<AdminPageShellProps["maxWidth"]>, string> = {
  "3xl": "max-w-3xl",
  "4xl": "max-w-4xl",
  "5xl": "max-w-5xl",
  "6xl": "max-w-6xl",
  "7xl": "max-w-7xl",
};

export function AdminPageShell({
  title,
  description,
  backHref = "/admin/leads",
  backLabel = "Retour pipeline",
  actions,
  maxWidth = "6xl",
  children,
}: AdminPageShellProps) {
  return (
    <div className="min-h-screen bg-cream py-10 lg:py-14">
      <div className={`container ${MAX_WIDTH_CLASS[maxWidth]}`}>
        <Link
          href={backHref}
          className="inline-flex items-center gap-2 text-sm font-mono uppercase tracking-eyebrow text-graphite hover:text-copper transition-colors mb-6"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          {backLabel}
        </Link>
        <div className="flex items-start justify-between gap-3 flex-wrap mb-8">
          <div>
            <h1 className="font-display text-display-md text-ink">{title}</h1>
            {description && (
              <p className="mt-2 text-graphite max-w-2xl">{description}</p>
            )}
          </div>
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>
        {children}
      </div>
    </div>
  );
}

/* ── Skeletons ─────────────────────────────────────────────────────────── */

/**
 * Skeleton ligne tableau : utilisé pour les listes (n lignes répétées).
 */
export function SkeletonRow({
  columns = 4,
  className,
}: {
  columns?: number;
  className?: string;
}) {
  return (
    <div
      className={`flex items-center gap-3 py-2.5 ${className ?? ""}`}
      aria-hidden
    >
      {Array.from({ length: columns }).map((_, i) => (
        <div
          key={i}
          className="h-3 flex-1 rounded-full bg-ink/5 animate-pulse"
          style={{ animationDelay: `${i * 80}ms` }}
        />
      ))}
    </div>
  );
}

/**
 * Skeleton card (KPI / bloc carré).
 */
export function SkeletonCard({ height = 120 }: { height?: number }) {
  return (
    <div
      className="rounded-2xl border border-ink/10 bg-white shadow-soft p-5 animate-pulse"
      style={{ height }}
      aria-hidden
    >
      <div className="h-3 w-24 rounded-full bg-ink/5 mb-3" />
      <div className="h-6 w-16 rounded-md bg-ink/5 mb-2" />
      <div className="h-2 w-32 rounded-full bg-ink/5" />
    </div>
  );
}

/**
 * Grille de KPI skeleton (réutilise SkeletonCard).
 */
export function SkeletonKpiGrid({ count = 4 }: { count?: number }) {
  return (
    <div className="grid lg:grid-cols-4 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}

/**
 * Loader centré sobre — fallback pour quand le skeleton n'est pas adapté.
 */
export function CenteredLoader({ label }: { label?: string }) {
  return (
    <div className="py-16 text-center text-muted">
      <Loader2 className="h-6 w-6 animate-spin mx-auto" />
      {label && <div className="mt-3 text-sm">{label}</div>}
    </div>
  );
}

/* ── EmptyState ────────────────────────────────────────────────────────── */

export type EmptyStateProps = {
  icon?: LucideIcon;
  title: string;
  body?: string;
  /** Texte du CTA optionnel. */
  ctaLabel?: string;
  /** Href du CTA. */
  ctaHref?: string;
  /** Couleur d'accent — défaut copper. */
  accentColor?: string;
};

export function EmptyState({
  icon: Icon,
  title,
  body,
  ctaLabel,
  ctaHref,
  accentColor = "#b86a36",
}: EmptyStateProps) {
  return (
    <div className="rounded-2xl border border-dashed border-ink/15 bg-white py-12 px-6 text-center">
      {Icon && (
        <div
          className="inline-flex h-12 w-12 items-center justify-center rounded-full mb-4"
          style={{ background: `${accentColor}15`, color: accentColor }}
        >
          <Icon className="h-5 w-5" />
        </div>
      )}
      <h3 className="font-display text-lg text-ink">{title}</h3>
      {body && (
        <p className="mt-2 text-sm text-graphite max-w-md mx-auto">{body}</p>
      )}
      {ctaLabel && ctaHref && (
        <Link
          href={ctaHref}
          className="mt-5 inline-flex items-center gap-2 rounded-full bg-ink text-cream px-4 py-2 text-sm hover:bg-copper transition-colors"
        >
          {ctaLabel}
        </Link>
      )}
    </div>
  );
}

/* ── SectionCard ───────────────────────────────────────────────────────── */

/**
 * Carte section avec header eyebrow + contenu. Pattern récurrent admin.
 */
export function SectionCard({
  icon: Icon,
  eyebrow,
  children,
  className,
  accentColor = "#b86a36",
}: {
  icon?: LucideIcon;
  eyebrow: string;
  children: React.ReactNode;
  className?: string;
  accentColor?: string;
}) {
  return (
    <div
      className={`rounded-2xl border border-ink/10 bg-white shadow-soft overflow-hidden ${className ?? ""}`}
    >
      <div className="px-5 py-3 border-b border-ink/8 bg-cream/40 flex items-center gap-2">
        {Icon && (
          <Icon className="h-4 w-4" style={{ color: accentColor }} />
        )}
        <span
          className="font-mono text-[10px] uppercase tracking-eyebrow"
          style={{ color: accentColor }}
        >
          {eyebrow}
        </span>
      </div>
      {children}
    </div>
  );
}
