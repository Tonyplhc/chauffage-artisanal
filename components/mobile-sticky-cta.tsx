"use client";

/**
 * <MobileStickyCta /> — barre fixe en bas de l'écran sur mobile.
 *
 * Présente 2 actions principales : Devis + Appel — toujours à portée
 * de pouce, pour maximiser la conversion mobile.
 *
 * Cachée :
 *   - sur /devis (redondant, on est déjà dans le funnel)
 *   - sur /admin/* (interface gestionnaire, pas de CTA public)
 *   - sur /espace/* (espace client)
 *   - quand la nav drawer mobile est ouverte (z-index conflict évité)
 *
 * Animation : slide-up à l'apparition après scroll initial (~200px),
 * disparaît si l'utilisateur scroll vers le haut très fort (= lit le contenu).
 */

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowUpRight, Phone } from "lucide-react";
import { COMPANY } from "@/lib/company-info";
import { trackEvent } from "@/lib/track-event";

export function MobileStickyCta() {
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);

  // Routes où on cache le CTA
  const hidden =
    pathname?.startsWith("/devis") ||
    pathname?.startsWith("/admin") ||
    pathname?.startsWith("/espace") ||
    pathname?.startsWith("/recrutement/candidature");

  useEffect(() => {
    if (hidden) {
      setVisible(false);
      return;
    }
    // Affiche après que l'utilisateur ait scrollé au moins 240px
    // (= il a vu le hero, il évalue le contenu, le CTA devient utile)
    const onScroll = () => {
      setVisible(window.scrollY > 240);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [hidden, pathname]);

  if (hidden) return null;

  return (
    <div
      aria-hidden={!visible}
      className={`lg:hidden fixed inset-x-0 bottom-0 z-30 transition-transform duration-300 ease-out pointer-events-none ${
        visible ? "translate-y-0" : "translate-y-full"
      }`}
    >
      <div className="container pb-3 pointer-events-auto">
        <div className="rounded-2xl bg-creme/95 backdrop-blur-md border border-pierre shadow-[0_-8px_24px_-12px_rgba(42,37,30,0.25)] p-2 flex gap-2">
          <Link
            href="/devis"
            className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-navy text-creme px-4 py-3.5 text-sm font-medium hover:bg-bleu transition-colors group"
          >
            Devis
            <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </Link>
          <a
            href={`tel:${COMPANY.phone.tel}`}
            onClick={() => trackEvent("phone_click", { ctaSurface: "mobile-sticky" })}
            className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-terracotta/15 border border-terracotta/50 text-terracotta px-4 py-3.5 text-sm font-medium hover:bg-terracotta/25 transition-colors"
          >
            <Phone className="h-4 w-4" />
            Appel
          </a>
        </div>
      </div>
    </div>
  );
}
