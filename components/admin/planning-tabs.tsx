"use client";

/**
 * PlanningTabs — barre d'onglets partagée par les 3 vues planning.
 *
 * Pattern inspiré ServiceTitan / Jobber : 1 seule entrée sidebar "Planning",
 * 3 angles d'affichage selon le besoin du moment :
 *   • Agenda     → vue calendrier mois/semaine des interventions
 *   • Dispatch   → vue "qui fait quoi", drag-drop par tech
 *   • Terrain    → preview de ce que le tech voit sur son mobile
 *
 * On reste sur 3 routes distinctes (rétro-compat bookmarks + permissions
 * granulaires), mais la nav est unifiée en haut de chaque page.
 */

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarDays, Users, Smartphone } from "lucide-react";

const TABS = [
  {
    href: "/admin/calendar",
    label: "Agenda",
    icon: CalendarDays,
    desc: "Vue calendrier",
  },
  {
    href: "/admin/dispatch",
    label: "Dispatch",
    icon: Users,
    desc: "Par technicien",
  },
  {
    href: "/admin/field",
    label: "Terrain",
    icon: Smartphone,
    desc: "Preview mobile",
  },
];

export function PlanningTabs() {
  const pathname = usePathname() ?? "";

  return (
    <div className="border-b border-ink/8 -mt-6 mb-6 px-1">
      <nav className="flex gap-1" aria-label="Vues planning">
        {TABS.map((t) => {
          const active = pathname === t.href || pathname.startsWith(t.href + "/");
          return (
            <Link
              key={t.href}
              href={t.href}
              className={`
                relative inline-flex items-center gap-2 px-4 py-3 text-sm
                border-b-2 transition-colors
                ${
                  active
                    ? "border-copper text-ink font-medium"
                    : "border-transparent text-graphite hover:text-ink hover:border-ink/15"
                }
              `}
            >
              <t.icon className="h-4 w-4" />
              <span>{t.label}</span>
              <span className="hidden sm:inline text-[10px] font-mono uppercase tracking-eyebrow text-muted">
                {t.desc}
              </span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
