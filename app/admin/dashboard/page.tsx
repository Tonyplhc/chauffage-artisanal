"use client";

/**
 * Dashboard admin — landing page premium 2026.
 *
 * Layout bento (cartes de tailles variables) inspiré Linear / Vercel /
 * Mercury : grand hero KPI, suggestion IA mise en avant, à-faire-du-jour
 * cliquable. Animations stagger Framer Motion, glassmorphism subtil sur les
 * cartes, gradients copper/ember pour les accents.
 *
 * Data : on tire depuis /api/admin/leads (et /api/admin/sidebar-badges déjà
 * en place). Pas d'endpoint stats dédié pour rester simple — l'agrégation
 * client-side suffit largement pour ~1000 leads.
 */

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Inbox,
  TrendingUp,
  AlertCircle,
  Sparkles,
  CalendarDays,
  Wallet,
  Users,
  ArrowRight,
  Flame,
  Clock,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import type { LeadRecord } from "@/lib/devis-schema";

/* ─────────────── Helpers ─────────────── */

function pipelineValueFromLeads(leads: LeadRecord[]): number {
  // Estimation : moyenne par service × probabilité par statut.
  // Suffisant pour donner un chiffre crédible sur dashboard.
  const AVG_BY_SERVICE: Record<string, number> = {
    chaudiere: 8500,
    pac: 14000,
    climatisation: 6500,
    sanitaire: 4500,
    enr: 12000,
    depannage: 800,
    entretien: 250,
  };
  const PROBA: Record<string, number> = {
    nouveau: 0.15,
    contact: 0.25,
    rdv_planifie: 0.4,
    devis_envoye: 0.55,
    devis_signe: 0.85,
    converti: 1.0,
    perdu: 0,
    refuse: 0,
  };
  let total = 0;
  for (const l of leads) {
    if (PROBA[l.status] === undefined) continue;
    const services = Array.isArray(l.services) ? l.services : [];
    const value = services.reduce(
      (s, srv) => s + (AVG_BY_SERVICE[srv] ?? 5000),
      0,
    );
    total += value * (PROBA[l.status] ?? 0.1);
  }
  return Math.round(total);
}

function formatEur(n: number): string {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(n);
}

function greeting(): string {
  const h = new Date().getHours();
  if (h < 6) return "Bonne nuit";
  if (h < 12) return "Bonjour";
  if (h < 18) return "Bon après-midi";
  return "Bonsoir";
}

const STATUS_LABELS: Record<string, string> = {
  nouveau: "Nouveau",
  contact: "Contact établi",
  rdv_planifie: "RDV planifié",
  devis_envoye: "Devis envoyé",
  devis_signe: "Devis signé",
  converti: "Converti",
  perdu: "Perdu",
  refuse: "Refusé",
};

const STATUS_COLOR: Record<string, string> = {
  nouveau: "#b86a36",
  contact: "#7a6a52",
  rdv_planifie: "#3a78c2",
  devis_envoye: "#a87c2c",
  devis_signe: "#22a06b",
  converti: "#1f8a5f",
  perdu: "#8b847a",
  refuse: "#8b847a",
};

/* ─────────────── Component ─────────────── */

export default function DashboardPage() {
  const [leads, setLeads] = useState<LeadRecord[] | null>(null);
  const [me, setMe] = useState<{ email?: string; displayName?: string } | null>(
    null,
  );
  const [aiSuggestion, setAiSuggestion] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);

  // Fetch leads
  useEffect(() => {
    fetch("/api/admin/leads", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d && Array.isArray(d.leads)) setLeads(d.leads as LeadRecord[]);
      })
      .catch(() => setLeads([]));
    fetch("/api/admin/me", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setMe(d))
      .catch(() => {});
  }, []);

  /* ─────────────── Computed stats ─────────────── */

  const stats = useMemo(() => {
    if (!leads) return null;
    const now = Date.now();
    const week = 7 * 24 * 3600 * 1000;
    const thisWeek = leads.filter(
      (l) => l.submittedAt && now - new Date(l.submittedAt).getTime() < week,
    );
    const prevWeek = leads.filter((l) => {
      if (!l.submittedAt) return false;
      const t = now - new Date(l.submittedAt).getTime();
      return t >= week && t < 2 * week;
    });
    const converted = leads.filter((l) => l.status === "converti").length;
    const total = leads.length;
    const conv = total > 0 ? Math.round((converted / total) * 100) : 0;

    const byStatus: Record<string, number> = {};
    for (const l of leads) {
      byStatus[l.status] = (byStatus[l.status] ?? 0) + 1;
    }

    const urgent = leads
      .filter(
        (l) =>
          l.status === "nouveau" &&
          (l.timeline === "immediat" || l.timeline === "urgent" || l.level === "hot"),
      )
      .slice(0, 6);

    const dormants = leads.filter((l) => {
      if (l.status !== "contact" && l.status !== "devis_envoye") return false;
      const last = l.statusHistory?.[l.statusHistory.length - 1]?.at;
      const ref = last ?? l.submittedAt;
      return ref && now - new Date(ref).getTime() > 7 * 24 * 3600 * 1000;
    });

    const value = pipelineValueFromLeads(leads);

    const trendWeek = thisWeek.length - prevWeek.length;

    return {
      total,
      thisWeek: thisWeek.length,
      trendWeek,
      conv,
      value,
      urgent,
      dormantsCount: dormants.length,
      byStatus,
    };
  }, [leads]);

  /* ─────────────── AI suggestion (1 fetch au mount) ─────────────── */

  useEffect(() => {
    // Skip si IA pas activée — évite un appel qui renverra 503 (clé absente)
    if (process.env.NEXT_PUBLIC_ENABLE_AI !== "1") return;
    if (!stats || aiSuggestion || aiLoading) return;
    if (stats.dormantsCount === 0 && stats.urgent.length === 0) return;
    setAiLoading(true);
    fetch("/api/admin/ai/draft", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        kind: "note",
        brief: `Dashboard du jour : ${stats.urgent.length} leads urgents non traités, ${stats.dormantsCount} dossiers dormants depuis +7j, ${stats.thisWeek} nouveaux leads cette semaine. Donne UNE recommandation actionable de 2 phrases max pour la matinée.`,
        context: `Pipeline value estimée : ${formatEur(stats.value)}, taux de conversion ${stats.conv}%.`,
      }),
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setAiSuggestion(d?.text ?? null))
      .catch(() => {})
      .finally(() => setAiLoading(false));
  }, [stats, aiSuggestion, aiLoading]);

  /* ─────────────── Render ─────────────── */

  return (
    <div className="min-h-screen bg-gradient-to-br from-cream via-cream to-copper/5">
      <div className="container max-w-7xl px-4 lg:px-8 py-8 lg:py-10">
        {/* HERO HEADER */}
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-8 lg:mb-10"
        >
          <div className="font-mono text-[10px] uppercase tracking-eyebrow text-copper mb-2">
            {new Date().toLocaleDateString("fr-FR", {
              weekday: "long",
              day: "numeric",
              month: "long",
            })}
            <span className="mx-2 text-graphite/40">·</span>
            <span className="text-graphite">
              {new Date().toLocaleTimeString("fr-FR", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          </div>
          <h1 className="font-display text-3xl lg:text-5xl text-ink tracking-tight">
            {greeting()},{" "}
            <span className="text-copper">
              {me?.displayName?.split(" ")[0] ??
                me?.email?.split("@")[0] ??
                "Jérôme"}
            </span>
            .
          </h1>
          {stats && (
            <p className="mt-2 text-graphite text-base lg:text-lg">
              {stats.urgent.length > 0 ? (
                <>
                  Vous avez{" "}
                  <strong className="text-ember">
                    {stats.urgent.length} lead{stats.urgent.length > 1 ? "s" : ""}{" "}
                    urgent{stats.urgent.length > 1 ? "s" : ""}
                  </strong>{" "}
                  à contacter et{" "}
                  <strong className="text-ink">
                    {stats.dormantsCount} dossier{stats.dormantsCount > 1 ? "s" : ""}{" "}
                    dormant{stats.dormantsCount > 1 ? "s" : ""}
                  </strong>{" "}
                  à relancer ce matin.
                </>
              ) : (
                <>Aucune urgence ce matin. Belle journée pour avancer sur les chantiers.</>
              )}
            </p>
          )}
        </motion.div>

        {/* HERO KPI (3 colonnes desktop) */}
        <motion.div
          initial="hidden"
          animate="show"
          variants={{ show: { transition: { staggerChildren: 0.08 } } }}
          className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-5 mb-5"
        >
          <KpiHero
            icon={Wallet}
            label="Pipeline value"
            value={stats ? formatEur(stats.value) : null}
            sublabel="Estimé · pondéré par statut"
            tone="copper"
          />
          <KpiHero
            icon={TrendingUp}
            label="Nouveaux leads · 7j"
            value={stats ? String(stats.thisWeek) : null}
            sublabel={
              stats
                ? stats.trendWeek > 0
                  ? `↗ +${stats.trendWeek} vs semaine précédente`
                  : stats.trendWeek < 0
                  ? `↘ ${stats.trendWeek} vs semaine précédente`
                  : "= stable"
                : ""
            }
            tone="ink"
          />
          <KpiHero
            icon={CheckCircle2}
            label="Conversion globale"
            value={stats ? `${stats.conv}%` : null}
            sublabel={
              stats ? `${stats.byStatus.converti ?? 0} convertis sur ${stats.total}` : ""
            }
            tone="ember"
          />
        </motion.div>

        {/* BENTO ROW 1 : À faire (large) + Suggestion IA (large) */}
        <motion.div
          initial="hidden"
          animate="show"
          variants={{ show: { transition: { staggerChildren: 0.08, delayChildren: 0.2 } } }}
          className="grid grid-cols-1 lg:grid-cols-5 gap-4 lg:gap-5 mb-5"
        >
          {/* À TRAITER */}
          <BentoCard className="lg:col-span-3">
            <div className="flex items-center gap-2 mb-4">
              <div className="grid place-items-center h-8 w-8 rounded-lg bg-ember/10">
                <AlertCircle className="h-4 w-4 text-ember" />
              </div>
              <h2 className="font-display text-lg text-ink">
                À traiter ce matin
              </h2>
              {stats && stats.urgent.length > 0 && (
                <span className="ml-auto inline-flex items-center justify-center min-w-[24px] h-6 px-2 rounded-full bg-ember text-white text-xs font-bold tabular-nums">
                  {stats.urgent.length}
                </span>
              )}
            </div>
            {!stats ? (
              <BentoSkeleton lines={4} />
            ) : stats.urgent.length === 0 ? (
              <div className="py-6 text-center text-sm text-muted">
                <CheckCircle2 className="h-6 w-6 mx-auto mb-2 text-green-600" />
                Aucun lead urgent en attente. Bravo.
              </div>
            ) : (
              <ul className="grid gap-2">
                {stats.urgent.map((l, i) => (
                  <motion.li
                    key={l.reference}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 + i * 0.04 }}
                  >
                    <Link
                      href={`/admin/leads/${l.reference}`}
                      className="group flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-cream transition-colors"
                    >
                      <Flame className="h-3.5 w-3.5 text-ember shrink-0" />
                      <div className="min-w-0 flex-1">
                        <div className="text-sm text-ink font-medium truncate">
                          {l.fullName}{" "}
                          <span className="font-mono text-[10px] text-muted">
                            {l.reference}
                          </span>
                        </div>
                        <div className="text-xs text-graphite truncate">
                          {(Array.isArray(l.services) ? l.services : []).join(" · ")} ·{" "}
                          {l.commune ?? "—"}
                        </div>
                      </div>
                      <ArrowRight className="h-3.5 w-3.5 text-graphite group-hover:text-copper group-hover:translate-x-0.5 transition-all shrink-0" />
                    </Link>
                  </motion.li>
                ))}
              </ul>
            )}
          </BentoCard>

          {/* SUGGESTION IA */}
          <BentoCard className="lg:col-span-2 bg-gradient-to-br from-copper/10 to-ember/5 border-copper/20">
            <div className="flex items-center gap-2 mb-4">
              <div className="relative grid place-items-center h-8 w-8 rounded-lg bg-copper/15">
                <Sparkles className="h-4 w-4 text-copper" />
                <span className="absolute inset-0 rounded-lg bg-copper/20 animate-ping opacity-50" />
              </div>
              <div>
                <h2 className="font-display text-lg text-ink leading-tight">
                  Suggestion IA
                </h2>
                <div className="font-mono text-[9px] uppercase tracking-eyebrow text-copper/80">
                  Llama 3.3 · Live
                </div>
              </div>
            </div>
            {aiLoading ? (
              <div className="flex items-center gap-2 text-sm text-graphite">
                <Loader2 className="h-3.5 w-3.5 animate-spin text-copper" />
                L&apos;IA analyse votre pipeline…
              </div>
            ) : aiSuggestion ? (
              <p className="text-sm text-ink leading-relaxed">{aiSuggestion}</p>
            ) : (
              <p className="text-sm text-muted leading-relaxed italic">
                Aucune suggestion aujourd&apos;hui — pipeline en ordre.
              </p>
            )}
          </BentoCard>
        </motion.div>

        {/* BENTO ROW 2 : Funnel + Quick links */}
        <motion.div
          initial="hidden"
          animate="show"
          variants={{ show: { transition: { staggerChildren: 0.08, delayChildren: 0.4 } } }}
          className="grid grid-cols-1 lg:grid-cols-5 gap-4 lg:gap-5"
        >
          {/* FUNNEL */}
          <BentoCard className="lg:col-span-3">
            <div className="flex items-center gap-2 mb-4">
              <div className="grid place-items-center h-8 w-8 rounded-lg bg-ink/5">
                <Inbox className="h-4 w-4 text-ink" />
              </div>
              <h2 className="font-display text-lg text-ink">Funnel pipeline</h2>
            </div>
            {!stats ? (
              <BentoSkeleton lines={5} />
            ) : (
              <div className="grid gap-2">
                {Object.entries(stats.byStatus)
                  .sort((a, b) => b[1] - a[1])
                  .map(([status, count]) => {
                    const max = Math.max(...Object.values(stats.byStatus));
                    const pct = max > 0 ? (count / max) * 100 : 0;
                    const color = STATUS_COLOR[status] ?? "#7a6a52";
                    return (
                      <div key={status} className="grid grid-cols-[140px_1fr_auto] gap-3 items-center">
                        <div className="text-xs text-graphite truncate">
                          {STATUS_LABELS[status] ?? status}
                        </div>
                        <div className="h-2 rounded-full bg-cream overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${pct}%` }}
                            transition={{ duration: 0.6, ease: "easeOut" }}
                            className="h-full rounded-full"
                            style={{ backgroundColor: color }}
                          />
                        </div>
                        <div className="font-mono text-xs text-ink tabular-nums w-8 text-right">
                          {count}
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </BentoCard>

          {/* QUICK ACTIONS */}
          <BentoCard className="lg:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <div className="grid place-items-center h-8 w-8 rounded-lg bg-ink/5">
                <Clock className="h-4 w-4 text-ink" />
              </div>
              <h2 className="font-display text-lg text-ink">Accès rapides</h2>
            </div>
            <div className="grid gap-2">
              {[
                { href: "/admin/leads", label: "Pipeline complet", icon: Inbox },
                { href: "/admin/calendar", label: "Planning du jour", icon: CalendarDays },
                { href: "/admin/quote-templates", label: "Nouveau devis", icon: Wallet },
                { href: "/admin/users", label: "Équipe", icon: Users },
              ].map((q) => (
                <Link
                  key={q.href}
                  href={q.href}
                  className="group flex items-center gap-3 px-3 py-2.5 rounded-xl border border-ink/8 bg-white hover:border-copper/40 hover:bg-cream/40 transition-all"
                >
                  <q.icon className="h-4 w-4 text-copper" />
                  <span className="text-sm text-ink flex-1">{q.label}</span>
                  <ArrowRight className="h-3.5 w-3.5 text-graphite group-hover:text-copper group-hover:translate-x-0.5 transition-all" />
                </Link>
              ))}
            </div>
          </BentoCard>
        </motion.div>
      </div>
    </div>
  );
}

/* ─────────────── Subcomponents ─────────────── */

function BentoCard({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 16 },
        show: { opacity: 1, y: 0 },
      }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className={`
        relative p-5 lg:p-6 rounded-2xl border border-ink/8 bg-white
        shadow-[0_1px_3px_rgba(0,0,0,0.02),0_8px_24px_-12px_rgba(184,106,54,0.08)]
        ${className}
      `}
    >
      {children}
    </motion.div>
  );
}

function KpiHero({
  icon: Icon,
  label,
  value,
  sublabel,
  tone,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string | null;
  sublabel: string;
  tone: "copper" | "ink" | "ember";
}) {
  const toneClass = {
    copper:
      "from-copper/10 via-copper/5 to-transparent border-copper/15 [--accent:theme(colors.copper)]",
    ink: "from-ink/8 via-ink/3 to-transparent border-ink/10 [--accent:theme(colors.ink)]",
    ember:
      "from-ember/10 via-ember/5 to-transparent border-ember/15 [--accent:theme(colors.ember)]",
  }[tone];

  return (
    <motion.div
      variants={{ hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className={`
        relative overflow-hidden p-6 lg:p-7 rounded-2xl border bg-gradient-to-br
        ${toneClass}
        shadow-[0_1px_3px_rgba(0,0,0,0.02),0_12px_32px_-16px_var(--accent)]
      `}
    >
      <div className="flex items-center gap-2 mb-3">
        <div className="grid place-items-center h-9 w-9 rounded-lg bg-white/60 backdrop-blur-sm">
          <Icon className="h-4 w-4 text-[var(--accent)]" />
        </div>
        <div className="font-mono text-[10px] uppercase tracking-eyebrow text-graphite">
          {label}
        </div>
      </div>
      {value === null ? (
        <div className="h-10 w-32 rounded bg-ink/5 animate-pulse" />
      ) : (
        <div className="font-display text-4xl lg:text-5xl text-ink tabular-nums tracking-tight">
          {value}
        </div>
      )}
      <div className="mt-1 text-xs text-graphite">{sublabel || " "}</div>
    </motion.div>
  );
}

function BentoSkeleton({ lines = 3 }: { lines?: number }) {
  return (
    <div className="grid gap-2">
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className="h-8 rounded bg-ink/5 animate-pulse"
          style={{ width: `${100 - i * 8}%` }}
        />
      ))}
    </div>
  );
}
