"use client";

/**
 * Menu admin structuré — remplace progressivement la barre de 60+ boutons.
 *
 * Hiérarchie en 5 grandes catégories métier :
 *   1. Pipeline       — gestion quotidienne des leads
 *   2. Analytics      — tableaux de bord & rapports
 *   3. Ops            — exploitation terrain (techs, chantiers, stock)
 *   4. Config         — paramétrage de la plateforme
 *   5. Aide & démo    — guide, tour, RGPD, seed
 *
 * UI : trigger en barre top fixe ; au clic, panneau dropdown avec colonnes.
 * Recherche rapide intégrée pour filtrer les entrées.
 *
 * Inspiration : palettes de commandes (Linear, GitHub) — efficacité avant
 * tout, sobriété visuelle.
 */

import { useState, useRef, useEffect, useMemo } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Menu,
  X,
  Search,
  Inbox,
  BarChart3,
  Wrench,
  Settings,
  HelpCircle,
  type LucideIcon,
} from "lucide-react";

type MenuEntry = {
  label: string;
  href: string;
  /** Description courte (1 ligne) — affichée au survol / petit. */
  desc?: string;
};

type MenuCategory = {
  id: string;
  label: string;
  icon: LucideIcon;
  entries: MenuEntry[];
};

const CATEGORIES: MenuCategory[] = [
  {
    id: "pipeline",
    label: "Pipeline",
    icon: Inbox,
    entries: [
      { label: "Pipeline (liste)", href: "/admin/leads", desc: "Tous les leads, triables" },
      { label: "Kanban", href: "/admin/leads/kanban", desc: "Vue drag&drop" },
      { label: "Rappels & snooze", href: "/admin/reminders" },
      { label: "Doublons", href: "/admin/duplicates" },
      { label: "Sources & UTM", href: "/admin/sources" },
      { label: "Segments dynamiques", href: "/admin/segments" },
      { label: "Vues sauvegardées", href: "/admin/views" },
      { label: "Tags", href: "/admin/tags" },
    ],
  },
  {
    id: "analytics",
    label: "Analytics",
    icon: BarChart3,
    entries: [
      { label: "Stats globales", href: "/admin/stats" },
      { label: "Forecast pondéré", href: "/admin/pipeline/value", desc: "Pipeline value × probabilité statut" },
      { label: "Forecast saisonnier", href: "/admin/forecast", desc: "Projection N mois" },
      { label: "Pricing intelligence", href: "/admin/pricing" },
      { label: "Heat map géographique", href: "/admin/geo-pipeline" },
      { label: "ROI marketing", href: "/admin/marketing-roi" },
      { label: "Lead aging", href: "/admin/lead-aging" },
      { label: "Customer health", href: "/admin/customer-health" },
      { label: "Loyalty", href: "/admin/loyalty" },
      { label: "Carbon footprint", href: "/admin/carbon" },
      { label: "Productivité équipe", href: "/admin/productivity" },
      { label: "Objectifs mensuels", href: "/admin/goals" },
      { label: "SLA tracker", href: "/admin/sla" },
      { label: "Rapports mensuels", href: "/admin/reports/monthly" },
      { label: "Heatmap activité leads", href: "/admin/heatmap" },
      { label: "Sentiment analysis", href: "/admin/sentiment" },
      { label: "NPS", href: "/admin/nps" },
      { label: "A/B testing", href: "/admin/experiments" },
      { label: "Email tracking", href: "/admin/email-tracking" },
    ],
  },
  {
    id: "ops",
    label: "Ops & terrain",
    icon: Wrench,
    entries: [
      { label: "Devis (templates)", href: "/admin/quote-templates" },
      { label: "Workflow validation devis", href: "/admin/approvals" },
      { label: "Factures", href: "/admin/invoices" },
      { label: "Budgets projets", href: "/admin/project-budgets" },
      { label: "Catalogue", href: "/admin/catalogue" },
      { label: "Stock inventaire", href: "/admin/inventory" },
      { label: "Fournisseurs", href: "/admin/suppliers" },
      { label: "Bons de commande", href: "/admin/purchase-orders" },
      { label: "Bons d'intervention", href: "/admin/service-orders" },
      { label: "Garantie & SAV", href: "/admin/warranty" },
      { label: "Équipements installés", href: "/admin/equipment" },
      { label: "Lifecycle équipements", href: "/admin/equipment-lifecycle" },
      { label: "Maintenance contrats", href: "/admin/maintenance" },
      { label: "Interventions", href: "/admin/visits" },
      { label: "Planning techniciens", href: "/admin/dispatch" },
      { label: "Tech profiles", href: "/admin/tech-profiles" },
      { label: "Certifications", href: "/admin/certifications" },
      { label: "Mode terrain (mobile)", href: "/admin/field" },
      { label: "Calendrier RDV", href: "/admin/calendar" },
      { label: "Sync calendrier (iCal)", href: "/admin/calendar-sync" },
      { label: "Health & safety", href: "/admin/safety" },
      { label: "Chat live", href: "/admin/chat" },
      { label: "Activité (audit log)", href: "/admin/activity" },
      { label: "Témoignages", href: "/admin/testimonials" },
      { label: "Knowledge base", href: "/admin/kb" },
      { label: "Recurring tasks", href: "/admin/recurring" },
    ],
  },
  {
    id: "config",
    label: "Configuration",
    icon: Settings,
    entries: [
      { label: "Marque (branding)", href: "/admin/brand" },
      { label: "Marques blanches (multi-tenant)", href: "/admin/tenants" },
      { label: "Utilisateurs & rôles", href: "/admin/users" },
      { label: "2FA", href: "/admin/2fa" },
      { label: "API keys", href: "/admin/api-keys" },
      { label: "Webhooks", href: "/admin/webhooks" },
      { label: "Automations", href: "/admin/automations" },
      { label: "Drip campaigns", href: "/admin/drip-campaigns" },
      { label: "Email templates", href: "/admin/templates" },
      { label: "Snippets", href: "/admin/snippets" },
      { label: "Signature email", href: "/admin/me/signature" },
      { label: "Newsletter", href: "/admin/newsletter" },
      { label: "Scoring rules", href: "/admin/scoring-rules" },
      { label: "Programme parrainage", href: "/admin/referrals" },
      { label: "Paiements (Stripe)", href: "/admin/payments" },
      { label: "Analytics interne", href: "/admin/analytics" },
      { label: "Backup / restore", href: "/admin/backup" },
      { label: "Export warehouse", href: "/admin/export" },
    ],
  },
  {
    id: "aide",
    label: "Aide & démo",
    icon: HelpCircle,
    entries: [
      { label: "Guide utilisateur", href: "/admin/guide", desc: "10 chapitres + tour guidé" },
      { label: "Onboarding (premier lancement)", href: "/admin/onboarding", desc: "+ bouton seed démo" },
      { label: "Rapport conformité RGPD", href: "/admin/rgpd" },
    ],
  },
];

export function AdminMenu() {
  const pathname = usePathname() ?? "";
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const panelRef = useRef<HTMLDivElement>(null);

  // Ferme au clic en dehors
  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (!panelRef.current) return;
      if (!panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onEsc);
    };
  }, [open]);

  // Ferme à la navigation
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return CATEGORIES;
    return CATEGORIES.map((cat) => ({
      ...cat,
      entries: cat.entries.filter(
        (e) =>
          e.label.toLowerCase().includes(q) ||
          e.desc?.toLowerCase().includes(q),
      ),
    })).filter((cat) => cat.entries.length > 0);
  }, [query]);

  const totalMatches = filtered.reduce((s, c) => s + c.entries.length, 0);

  return (
    <div className="relative" ref={panelRef}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="inline-flex items-center gap-2 rounded-full bg-ink text-cream px-4 py-2 text-sm hover:bg-copper transition-colors"
        aria-expanded={open}
        aria-haspopup="menu"
      >
        {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        Menu
      </button>

      {open && (
        <div
          role="menu"
          className="absolute z-50 mt-2 right-0 lg:left-0 w-[min(720px,calc(100vw-2rem))] rounded-2xl border border-ink/10 bg-white shadow-xl overflow-hidden"
        >
          <div className="border-b border-ink/8 bg-cream/40 px-4 py-2 flex items-center gap-2">
            <Search className="h-4 w-4 text-graphite" />
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Rechercher dans le menu…"
              className="flex-1 bg-transparent text-sm focus:outline-none placeholder:text-muted"
            />
            <span className="text-[10px] font-mono uppercase tracking-eyebrow text-muted">
              {totalMatches} entrée{totalMatches > 1 ? "s" : ""}
            </span>
          </div>

          <div className="max-h-[calc(100vh-12rem)] overflow-auto p-4 grid lg:grid-cols-2 gap-4">
            {filtered.map((cat) => (
              <div key={cat.id}>
                <div className="font-mono text-[10px] uppercase tracking-eyebrow text-copper inline-flex items-center gap-1.5 mb-2">
                  <cat.icon className="h-3 w-3" />
                  {cat.label}
                </div>
                <ul className="space-y-0.5">
                  {cat.entries.map((e) => {
                    const isActive = pathname === e.href;
                    return (
                      <li key={e.href}>
                        <Link
                          href={e.href}
                          className={`block rounded-md px-2 py-1.5 transition-colors ${
                            isActive
                              ? "bg-copper/10 text-copper"
                              : "hover:bg-cream/50 text-ink"
                          }`}
                        >
                          <div className="text-sm font-medium">{e.label}</div>
                          {e.desc && (
                            <div className="text-[11px] text-muted leading-tight">
                              {e.desc}
                            </div>
                          )}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
            {filtered.length === 0 && (
              <div className="lg:col-span-2 py-8 text-center text-muted text-sm">
                Aucune entrée pour « {query} ».
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
