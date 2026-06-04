"use client";

/**
 * Sidebar admin — structure plate, inspirée Linear / Jobber / ServiceTitan.
 *
 * Principe :
 *   • Top-level FLAT : 1 clic = 1 destination. Pas de dossier à 1 item.
 *   • Une seule section collapsible en bas : "Plus de modules" (les ~60 outils
 *     avancés rarement utilisés au quotidien).
 *   • Chaque entrée porte une `capability` requise — filtrage côté ergonomie,
 *     la sécurité reste serveur.
 */

import { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ChevronDown,
  ChevronRight,
  Menu,
  X,
  LayoutDashboard,
  Inbox,
  FileText,
  Receipt,
  CalendarDays,
  Users,
  Wrench,
  Briefcase,
  MoreHorizontal,
  Star,
  type LucideIcon,
} from "lucide-react";

type NavItem = {
  label: string;
  href: string;
  icon?: LucideIcon;
  capability?: string;
  badgeKey?: string;
  desc?: string;
};

/* ─────────────── ENTRÉES PRINCIPALES (FLAT) ─────────────── */
/**
 * 6 items max. Le quotidien tient là-dedans :
 *   Pipeline → Devis → Factures (chaîne commerciale)
 *   Planning → Équipe (organisation interne)
 */
const TOP_ITEMS: NavItem[] = [
  {
    label: "Dashboard",
    href: "/admin/dashboard",
    icon: LayoutDashboard,
    desc: "Vue d'ensemble du jour — KPI, urgents, suggestions IA",
  },
  {
    label: "Pipeline",
    href: "/admin/leads",
    icon: Inbox,
    capability: "leads.view",
    badgeKey: "leads.nouveau",
    desc: "Tous les leads + scoring",
  },
  {
    label: "Devis",
    href: "/admin/quote-templates",
    icon: FileText,
    capability: "quotes.templates",
    desc: "Création, validation, modèles",
  },
  {
    label: "Factures",
    href: "/admin/invoices",
    icon: Receipt,
    capability: "invoices.manage",
    badgeKey: "invoices.to_create",
    desc: "À émettre, envoyées, payées",
  },
  {
    label: "Planning",
    href: "/admin/calendar",
    icon: CalendarDays,
    capability: "calendar.view",
    desc: "Agenda, dispatch techs, mode terrain",
  },
  {
    label: "Interventions",
    href: "/admin/visits",
    icon: Wrench,
    capability: "visits.manage",
    badgeKey: "visits.scheduled",
    desc: "Comptes-rendus terrain · signature client · notes",
  },
  {
    label: "Recrutement",
    href: "/admin/jobs",
    icon: Briefcase,
    desc: "Postes ouverts, fermer une offre, profils recherchés",
  },
];

/* ─────────────── PLUS DE MODULES (COLLAPSIBLE) ─────────────── */
const MORE_ITEMS: NavItem[] = [
  // Pipeline avancé
  { label: "Kanban", href: "/admin/leads/kanban", capability: "leads.view" },
  { label: "Workflow validation", href: "/admin/approvals", capability: "quotes.approve", badgeKey: "approvals.pending" },
  { label: "Doublons", href: "/admin/duplicates", capability: "duplicates.manage", badgeKey: "duplicates.detected" },
  { label: "Rappels & snooze", href: "/admin/reminders", capability: "leads.edit", badgeKey: "reminders.due" },
  { label: "Segments", href: "/admin/segments", capability: "segments.manage" },
  { label: "Vues sauvegardées", href: "/admin/views", capability: "leads.view" },
  { label: "Tags", href: "/admin/tags", capability: "tags.manage" },
  { label: "Sources & UTM", href: "/admin/sources", capability: "leads.view" },
  { label: "Paiements", href: "/admin/payments", capability: "payments.manage" },
  { label: "Chat live", href: "/admin/chat", capability: "communications.send", badgeKey: "chat.unread" },
  { label: "NPS", href: "/admin/nps", capability: "leads.view" },
  { label: "Témoignages", href: "/admin/testimonials", capability: "leads.view" },
  { label: "Parrainage", href: "/admin/referrals", capability: "leads.view" },
  // Production avancé
  { label: "Planning auto-calculé", href: "/admin/planning-auto", capability: "dispatch.manage" },
  { label: "Mode terrain (mobile)", href: "/admin/field", capability: "visits.manage" },
  { label: "Bons d'intervention", href: "/admin/service-orders", capability: "service_orders.create", badgeKey: "service_orders.draft" },
  { label: "Maintenance contrats", href: "/admin/maintenance", capability: "maintenance.manage" },
  { label: "Bons de commande", href: "/admin/purchase-orders", capability: "purchase_orders.manage", badgeKey: "purchase_orders.draft" },
  { label: "Équipements installés", href: "/admin/equipment", capability: "equipment.view" },
  { label: "Lifecycle équipements", href: "/admin/equipment-lifecycle", capability: "equipment.view" },
  { label: "Stock & camions", href: "/admin/stock-locations", capability: "inventory.view" },
  { label: "Inventaire", href: "/admin/inventory", capability: "inventory.view" },
  { label: "Fournisseurs", href: "/admin/suppliers", capability: "suppliers.manage" },
  { label: "Garantie & SAV", href: "/admin/warranty", capability: "warranty.manage", badgeKey: "warranty.open" },
  { label: "Health & safety", href: "/admin/safety", capability: "safety.read" },
  { label: "Knowledge base", href: "/admin/kb", capability: "kb.read" },
  { label: "Catalogue produits", href: "/admin/catalogue", capability: "quotes.create" },
  // Équipe avancé
  { label: "Utilisateurs", href: "/admin/users", capability: "users.manage" },
  { label: "Profils techs", href: "/admin/tech-profiles", capability: "tech_profiles.manage" },
  { label: "Productivité", href: "/admin/productivity", capability: "productivity.read" },
  { label: "Objectifs", href: "/admin/goals", capability: "goals.manage" },
  { label: "Certifications", href: "/admin/certifications", capability: "certifications.manage" },
  { label: "Onboarding employé", href: "/admin/onboarding", capability: "onboarding.read" },
  { label: "Tâches récurrentes", href: "/admin/recurring", capability: "recurring.manage" },
  // Analyse
  { label: "Stats globales", href: "/admin/stats", capability: "stats.read" },
  { label: "Forecast pondéré", href: "/admin/pipeline/value", capability: "pipeline_value.read" },
  { label: "Forecast saisonnier", href: "/admin/forecast", capability: "forecast.read" },
  { label: "Pricing intelligence", href: "/admin/pricing", capability: "pricing.read" },
  { label: "Heat map géo", href: "/admin/geo-pipeline", capability: "geo.read" },
  { label: "ROI marketing", href: "/admin/marketing-roi", capability: "marketing_roi.read" },
  { label: "Lead aging", href: "/admin/lead-aging", capability: "lead_aging.read" },
  { label: "Customer health", href: "/admin/customer-health", capability: "customer_health.read" },
  { label: "Budgets projets", href: "/admin/project-budgets", capability: "project_budgets.read" },
  { label: "Loyalty", href: "/admin/loyalty", capability: "loyalty.read" },
  { label: "Carbon footprint", href: "/admin/carbon", capability: "carbon.read" },
  { label: "Heatmap activité", href: "/admin/heatmap", capability: "stats.read" },
  { label: "SLA tracker", href: "/admin/sla", capability: "stats.read" },
  { label: "Rapports mensuels", href: "/admin/reports/monthly", capability: "reports.read" },
  { label: "A/B testing", href: "/admin/experiments", capability: "experiments.read" },
  { label: "Sentiment", href: "/admin/sentiment", capability: "stats.read" },
  { label: "Email tracking", href: "/admin/email-tracking", capability: "stats.read" },
  { label: "Analytics interne", href: "/admin/analytics", capability: "analytics.read" },
  { label: "Export warehouse", href: "/admin/export", capability: "exports.use" },
  // Configuration
  { label: "2FA personnel", href: "/admin/2fa", capability: "twofa.manage" },
  { label: "Marque (branding)", href: "/admin/brand", capability: "brand.manage" },
  { label: "Marques blanches", href: "/admin/tenants", capability: "tenants.manage" },
  { label: "Automations", href: "/admin/automations", capability: "automations.manage" },
  { label: "Webhooks", href: "/admin/webhooks", capability: "webhooks.manage" },
  { label: "Clés API", href: "/admin/api-keys", capability: "api_keys.manage" },
  { label: "Email templates", href: "/admin/templates", capability: "templates.manage" },
  { label: "Snippets", href: "/admin/snippets", capability: "snippets.manage" },
  { label: "Drip campaigns", href: "/admin/drip-campaigns", capability: "drip.manage" },
  { label: "Newsletter", href: "/admin/newsletter", capability: "newsletter.send" },
  { label: "Signature email", href: "/admin/me/signature", capability: "communications.send" },
  { label: "Scoring rules", href: "/admin/scoring-rules", capability: "scoring_rules.manage" },
  { label: "Sync calendrier", href: "/admin/calendar-sync", capability: "calendar_sync.manage" },
  { label: "Backup / restore", href: "/admin/backup", capability: "backup.use" },
  { label: "Activity log", href: "/admin/activity", capability: "audit.read" },
  { label: "Rapport RGPD", href: "/admin/rgpd", capability: "rgpd.manage" },
  // Aide
  { label: "Guide utilisateur", href: "/admin/guide", capability: "guide.read" },
];

// v3 : reset du localStorage après refonte flat (les anciennes section IDs
// "devis"/"planning"/"equipe" n'existent plus).
const STORAGE_KEY = "ca-sidebar-state-v3";

/**
 * Favoris : hrefs épinglés par l'utilisateur depuis "Plus de modules" via
 * l'étoile. Persistant localStorage, section dédiée "Mes favoris" affichée
 * juste au-dessus de "Plus de modules". Si l'utilisateur a souvent besoin
 * d'un module avancé, il l'épingle en 1 clic.
 */
const FAVORITES_KEY = "ca-sidebar-favorites-v1";

type SidebarState = {
  morePanelOpen: boolean;
};

function readState(): SidebarState {
  if (typeof window === "undefined") return { morePanelOpen: false };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return { morePanelOpen: false };
}

function writeState(s: SidebarState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
  } catch {}
}

function readFavorites(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(FAVORITES_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed))
        return parsed.filter((s): s is string => typeof s === "string");
    }
  } catch {}
  return [];
}

function writeFavorites(arr: string[]) {
  try {
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(arr));
  } catch {}
}

export function AdminSidebar() {
  const pathname = usePathname() ?? "";
  const [caps, setCaps] = useState<string[] | null>(null);
  const [state, setState] = useState<SidebarState>({ morePanelOpen: false });
  const [favorites, setFavorites] = useState<string[]>([]);
  const [mounted, setMounted] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [badges, setBadges] = useState<Record<string, number>>({});

  useEffect(() => {
    setMounted(true);
    setState(readState());
    setFavorites(readFavorites());
    fetch("/api/admin/me/capabilities", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d && Array.isArray(d.capabilities)) setCaps(d.capabilities);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const fetchBadges = () => {
      fetch("/api/admin/sidebar-badges", { cache: "no-store" })
        .then((r) => (r.ok ? r.json() : null))
        .then((d) => {
          if (d && d.counts && typeof d.counts === "object") {
            setBadges(d.counts as Record<string, number>);
          }
        })
        .catch(() => {});
    };
    fetchBadges();
    const i = setInterval(fetchBadges, 45_000);
    return () => clearInterval(i);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const toggleMore = useCallback(() => {
    setState((s) => {
      const next = { ...s, morePanelOpen: !s.morePanelOpen };
      writeState(next);
      return next;
    });
  }, []);

  const toggleFavorite = useCallback((href: string) => {
    setFavorites((prev) => {
      const next = prev.includes(href)
        ? prev.filter((h) => h !== href)
        : [...prev, href];
      writeFavorites(next);
      return next;
    });
  }, []);

  const { visibleTop, visibleMore, moreBadgeSum, visibleFavorites } = useMemo(() => {
    if (!caps)
      return {
        visibleTop: [],
        visibleMore: [],
        moreBadgeSum: 0,
        visibleFavorites: [] as NavItem[],
      };
    const set = new Set(caps);
    const top = TOP_ITEMS.filter((it) => !it.capability || set.has(it.capability));
    const more = MORE_ITEMS.filter((it) => !it.capability || set.has(it.capability));
    const moreSum = more.reduce(
      (s, it) => s + (it.badgeKey ? badges[it.badgeKey] ?? 0 : 0),
      0,
    );
    // Favoris : on garde l'ordre dans lequel l'utilisateur les a ajoutés,
    // donc on map sur `favorites` (et pas sur `more`) pour préserver ça.
    // On filtre les hrefs qui n'existent plus ou qui ne sont pas accessibles.
    const moreByHref = new Map(more.map((it) => [it.href, it]));
    const favs = favorites
      .map((href) => moreByHref.get(href))
      .filter((it): it is NavItem => !!it);
    return {
      visibleTop: top,
      visibleMore: more,
      moreBadgeSum: moreSum,
      visibleFavorites: favs,
    };
  }, [caps, badges, favorites]);

  if (!mounted) {
    return (
      <aside className="hidden lg:block w-64 shrink-0 border-r border-ink/8 bg-white/60" />
    );
  }

  const renderItem = (
    item: NavItem,
    opts: { indent?: boolean; favoritable?: boolean; keyPrefix?: string } = {},
  ) => {
    const { indent = false, favoritable = false, keyPrefix = "" } = opts;
    const isActive =
      pathname === item.href ||
      (item.href !== "/admin/leads" && pathname.startsWith(item.href + "/"));
    const itemBadge = item.badgeKey ? badges[item.badgeKey] ?? 0 : 0;
    const Icon = item.icon;
    const isFav = favorites.includes(item.href);
    return (
      <li key={`${keyPrefix}${item.href}`} className="group/item relative">
        <Link
          href={item.href}
          title={item.desc}
          className={`
            flex items-center justify-between gap-2 ${favoritable ? "pr-9" : ""} px-3 py-2 rounded-md text-sm transition-colors
            ${indent ? "pl-6" : ""}
            ${
              isActive
                ? "bg-copper/10 text-copper font-medium"
                : "text-ink hover:bg-cream"
            }
          `}
        >
          <span className="inline-flex items-center gap-2 min-w-0">
            {Icon && (
              <Icon
                className={`h-4 w-4 shrink-0 ${
                  isActive ? "text-copper" : "text-graphite"
                }`}
              />
            )}
            <span className="truncate">{item.label}</span>
          </span>
          {itemBadge > 0 && (
            <span className="shrink-0 inline-flex items-center justify-center min-w-[20px] h-[20px] px-1.5 rounded-full bg-ember text-white text-[10px] font-bold tabular-nums">
              {itemBadge > 99 ? "99+" : itemBadge}
            </span>
          )}
        </Link>
        {/* Bouton étoile favoris — superposé à droite, n'interfère pas avec
            le Link grâce à stopPropagation et position absolue. */}
        {favoritable && (
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              toggleFavorite(item.href);
            }}
            aria-label={isFav ? "Retirer des favoris" : "Ajouter aux favoris"}
            title={isFav ? "Retirer des favoris" : "Épingler en favoris"}
            className={`
              absolute right-1.5 top-1/2 -translate-y-1/2 h-6 w-6 grid place-items-center rounded-md
              transition-all
              ${
                isFav
                  ? "text-copper opacity-100"
                  : "text-graphite/40 opacity-0 group-hover/item:opacity-100 hover:text-copper hover:bg-cream"
              }
            `}
          >
            <Star
              className="h-3.5 w-3.5"
              fill={isFav ? "currentColor" : "none"}
              strokeWidth={isFav ? 0 : 2}
            />
          </button>
        )}
      </li>
    );
  };

  return (
    <>
      <button
        aria-label="Ouvrir le menu"
        onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-40 inline-flex items-center justify-center h-10 w-10 rounded-full bg-ink text-cream shadow-soft"
      >
        <Menu className="h-4 w-4" />
      </button>

      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-ink/40"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={`
          ${mobileOpen ? "translate-x-0" : "-translate-x-full"}
          lg:translate-x-0
          fixed lg:sticky lg:top-0 left-0 top-0 z-50
          h-screen w-72 lg:w-64
          flex flex-col
          bg-white border-r border-ink/8
          transition-transform duration-200
          overflow-y-auto
          shrink-0
        `}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 pt-5 pb-4">
          <Link
            href="/admin/dashboard"
            className="inline-flex flex-col leading-tight hover:text-copper transition-colors"
          >
            <span className="font-display text-base text-ink">
              Chauffage Artisanal
            </span>
            <span className="font-mono text-[9px] uppercase tracking-eyebrow text-muted">
              Admin · pipeline interne
            </span>
          </Link>
          <button
            onClick={() => setMobileOpen(false)}
            className="lg:hidden text-graphite hover:text-ink"
            aria-label="Fermer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-2 pb-6">
          {caps === null ? (
            <div className="px-3 py-4 text-xs text-muted">Chargement…</div>
          ) : visibleTop.length === 0 && visibleMore.length === 0 ? (
            <div className="px-3 py-4 text-xs text-muted">
              Aucun module accessible. Contactez votre administrateur.
            </div>
          ) : (
            <>
              {/* Entrées principales : FLAT */}
              <ul className="grid gap-0.5">
                {visibleTop.map((it) => renderItem(it))}
              </ul>

              {/* Mes favoris : modules épinglés par l'utilisateur depuis
                  "Plus de modules". Visible uniquement s'il y en a au
                  moins un. Étoile = retirer des favoris. */}
              {visibleFavorites.length > 0 && (
                <div className="mt-5 pt-3 border-t border-ink/8">
                  <div className="px-3 py-1.5 inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-eyebrow text-copper">
                    <Star className="h-3 w-3" fill="currentColor" strokeWidth={0} />
                    Mes favoris
                    <span className="text-muted normal-case">
                      ({visibleFavorites.length})
                    </span>
                  </div>
                  <ul className="mt-0.5 grid gap-0.5">
                    {visibleFavorites.map((it) =>
                      renderItem(it, { favoritable: true, keyPrefix: "fav-" }),
                    )}
                  </ul>
                </div>
              )}

              {/* Plus de modules : collapsible discret */}
              {visibleMore.length > 0 && (
                <div className="mt-5 pt-3 border-t border-ink/8">
                  <button
                    onClick={toggleMore}
                    className="w-full inline-flex items-center justify-between px-3 py-2 rounded-md text-xs font-mono uppercase tracking-eyebrow text-graphite hover:bg-cream transition-colors"
                  >
                    <span className="inline-flex items-center gap-2">
                      <MoreHorizontal className="h-3.5 w-3.5 text-copper" />
                      Plus de modules
                      <span className="text-muted normal-case">
                        ({visibleMore.length})
                      </span>
                      {moreBadgeSum > 0 && !state.morePanelOpen && (
                        <span className="inline-flex items-center justify-center min-w-[20px] h-[20px] px-1.5 rounded-full bg-ember text-white text-[10px] font-bold tabular-nums">
                          {moreBadgeSum > 99 ? "99+" : moreBadgeSum}
                        </span>
                      )}
                    </span>
                    {state.morePanelOpen ? (
                      <ChevronDown className="h-3 w-3" />
                    ) : (
                      <ChevronRight className="h-3 w-3" />
                    )}
                  </button>
                  {state.morePanelOpen && (
                    <ul className="mt-0.5 mb-2 grid gap-0.5">
                      {visibleMore.map((it) =>
                        renderItem(it, { indent: true, favoritable: true }),
                      )}
                    </ul>
                  )}
                </div>
              )}
            </>
          )}
        </nav>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-ink/8 text-[10px] text-muted">
          <Link href="/admin/me" className="hover:text-copper">
            Mon compte
          </Link>
          <span className="mx-2">·</span>
          <Link href="/api/admin/logout" className="hover:text-copper">
            Déconnexion
          </Link>
        </div>
      </aside>
    </>
  );
}
