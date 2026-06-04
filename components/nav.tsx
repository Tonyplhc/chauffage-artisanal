"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, ArrowUpRight, Phone } from "lucide-react";
import { cn } from "@/lib/utils";
import { useI18n } from "@/components/i18n-provider";
import { LanguageSwitcher } from "@/components/language-switcher";

function buildPrimary(t: ReturnType<typeof useI18n>["t"]) {
  return [
    { href: "/chauffage", label: t.nav.chauffage },
    { href: "/pompes-a-chaleur", label: t.nav.pac },
    { href: "/climatisation", label: t.nav.climatisation },
    { href: "/sanitaire", label: t.nav.sanitaire },
    { href: "/energies-renouvelables", label: t.nav.enr },
    { href: "/primes-aides", label: t.nav.aides, badge: t.nav.aidesBadge },
    { href: "/recrutement", label: t.nav.recrutement, badge: t.nav.recrutementBadge },
  ];
}

function buildSecondary(t: ReturnType<typeof useI18n>["t"]) {
  return [
    { href: "/depannage", label: t.nav.depannage },
    { href: "/entretien", label: t.nav.entretien },
    { href: "/savoir-faire", label: t.nav.savoirFaire },
    { href: "/marques", label: t.nav.marques },
    { href: "/realisations", label: t.nav.realisations },
    { href: "/actualites", label: t.nav.actualites },
    { href: "/a-propos", label: t.nav.aPropos },
    { href: "/contact", label: t.nav.contact },
  ];
}

export function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const { t } = useI18n();
  const PRIMARY = buildPrimary(t);
  const SECONDARY = buildSecondary(t);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // Lock body scroll quand le drawer est ouvert (mobile)
  useEffect(() => {
    if (typeof document === "undefined") return;
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <header
      className={cn(
        "sticky top-0 z-40 transition-all duration-500",
        scrolled
          ? "bg-cream/90 backdrop-blur-xl border-b border-ink/8 shadow-soft"
          : "bg-cream/70 backdrop-blur-sm border-b border-transparent",
      )}
    >
      <div className="container flex items-center justify-between h-16 md:h-20">
        <Link href="/" className="flex items-center gap-3 group">
          <Logo />
          <div className="hidden sm:block leading-none">
            <div className="font-display text-lg tracking-tighter text-ink">Chauffage Artisanal</div>
            <div className="font-mono text-[10px] uppercase tracking-eyebrow text-muted mt-0.5">
              Depuis 1994 · Luxembourg
            </div>
          </div>
        </Link>

        <nav className="hidden lg:flex items-center gap-1">
          {PRIMARY.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "relative px-3 py-2 text-sm transition-colors inline-flex items-center gap-2",
                  active ? "text-ink" : "text-graphite hover:text-ink",
                )}
              >
                {item.label}
                {item.badge && (
                  <span className="hidden xl:inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-copper/12 border border-copper/40 text-[9px] font-mono uppercase tracking-eyebrow text-copper">
                    <span className="relative flex h-1 w-1">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-copper opacity-75"></span>
                      <span className="relative inline-flex h-1 w-1 rounded-full bg-copper"></span>
                    </span>
                    {item.badge}
                  </span>
                )}
                {active && (
                  <motion.span
                    layoutId="nav-underline"
                    className="absolute left-3 right-3 bottom-1 h-px bg-copper"
                  />
                )}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
          <LanguageSwitcher />
          {/* CTA Recrutement — pulse copper, visible en permanence */}
          <Link
            href="/recrutement"
            className="hidden md:inline-flex items-center gap-2 rounded-full bg-cream border border-copper/40 text-ink px-4 py-2 text-sm font-medium hover:bg-copper/10 hover:border-copper transition-all group"
            aria-label="Voir les postes ouverts"
          >
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-copper opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-copper" />
            </span>
            <span>Nous recrutons</span>
            <span className="hidden lg:inline-flex items-center px-2 py-0.5 rounded-full bg-copper text-cream text-[9px] font-mono uppercase tracking-eyebrow">
              Postes ouverts
            </span>
          </Link>
          <Link
            href="/devis"
            className="hidden md:inline-flex items-center gap-2 rounded-full bg-ink text-cream px-5 py-2.5 text-sm font-medium hover:bg-copper transition-colors"
          >
            {t.nav.devisCta}
            <ArrowUpRight className="h-4 w-4" />
          </Link>
          <button
            onClick={() => setOpen((v) => !v)}
            className="lg:hidden h-10 w-10 grid place-items-center rounded-full border border-ink/15 text-ink"
            aria-label="Menu"
          >
            {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {open && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setOpen(false)}
              className="lg:hidden fixed inset-0 z-[55] bg-charcoal/40 backdrop-blur-sm"
              aria-hidden
            />
            {/* Bottom sheet */}
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", stiffness: 320, damping: 36 }}
              className="lg:hidden fixed inset-x-0 bottom-0 z-[56] bg-cream rounded-t-[28px] border-t border-ink/10 shadow-[0_-12px_40px_-8px_rgba(42,37,30,0.25)] max-h-[88vh] overflow-y-auto"
              role="dialog"
              aria-modal="true"
              aria-label="Menu"
            >
              {/* Handle bar */}
              <div className="sticky top-0 z-10 bg-cream pt-3 pb-2 flex flex-col items-center">
                <button
                  onClick={() => setOpen(false)}
                  className="h-1 w-12 rounded-full bg-ink/20 hover:bg-ink/40 transition-colors"
                  aria-label="Fermer le menu"
                />
              </div>

              <div className="container px-5 pb-8">
                {/* Header avec close */}
                <div className="flex items-center justify-between pt-2 pb-5 border-b border-ink/8 mb-5">
                  <div>
                    <div className="font-mono text-[10px] uppercase tracking-eyebrow text-copper">
                      Navigation
                    </div>
                    <div className="mt-1 font-display text-xl text-ink">
                      Chauffage Artisanal
                    </div>
                  </div>
                  <button
                    onClick={() => setOpen(false)}
                    className="h-10 w-10 grid place-items-center rounded-full bg-white border border-ink/12 text-ink hover:bg-ink hover:text-cream transition-colors"
                    aria-label="Fermer"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                {/* Métiers */}
                <div className="text-[10px] font-mono uppercase tracking-eyebrow text-muted mb-2">
                  {t.nav.metiers}
                </div>
                <div className="grid gap-1.5 mb-5">
                  {PRIMARY.map((i) => {
                    const active = pathname === i.href;
                    return (
                      <Link
                        key={i.href}
                        href={i.href}
                        className={cn(
                          "py-3.5 px-4 -mx-2 rounded-2xl text-lg font-display tracking-tight flex items-center justify-between gap-3 transition-colors",
                          active
                            ? "bg-ink text-cream"
                            : "text-ink hover:bg-ink/5",
                        )}
                      >
                        <span className="flex items-center gap-2">
                          {i.label}
                          {i.badge && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-copper/15 border border-copper/40 text-[9px] font-mono uppercase tracking-eyebrow text-copper">
                              {i.badge}
                            </span>
                          )}
                        </span>
                        <ArrowUpRight
                          className={cn(
                            "h-4 w-4 shrink-0 opacity-50",
                            active && "opacity-100",
                          )}
                        />
                      </Link>
                    );
                  })}
                </div>

                {/* Maison */}
                <div className="text-[10px] font-mono uppercase tracking-eyebrow text-muted mb-2">
                  {t.nav.maisonInfos}
                </div>
                <div className="grid grid-cols-2 gap-1.5 mb-5">
                  {SECONDARY.map((i) => {
                    const active = pathname === i.href;
                    return (
                      <Link
                        key={i.href}
                        href={i.href}
                        className={cn(
                          "py-3 px-3.5 rounded-xl text-sm flex items-center gap-2 border transition-all",
                          active
                            ? "bg-cream border-copper/40 text-ink"
                            : "bg-white border-ink/8 text-graphite hover:border-copper/30",
                        )}
                      >
                        <span className="truncate">{i.label}</span>
                      </Link>
                    );
                  })}
                </div>

                {/* CTAs */}
                <div className="grid grid-cols-2 gap-2 pt-4 border-t border-ink/8">
                  <Link
                    href="/devis"
                    className="inline-flex justify-center items-center gap-2 rounded-full bg-ink text-cream px-5 py-3.5 text-sm font-medium"
                  >
                    Devis
                    <ArrowUpRight className="h-4 w-4" />
                  </Link>
                  <Link
                    href="/depannage"
                    className="inline-flex justify-center items-center gap-2 rounded-full border border-ember/40 bg-ember/5 text-ember px-5 py-3.5 text-sm font-medium"
                  >
                    <Phone className="h-4 w-4" />
                    Dépannage
                  </Link>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </header>
  );
}

function Logo() {
  return (
    <span className="relative inline-grid place-items-center h-10 w-10 rounded-full bg-copper/12 border border-copper/30 overflow-hidden">
      <svg viewBox="0 0 24 24" className="h-5 w-5 text-copper" fill="none">
        <path
          d="M12 2c1.5 3 4 4.5 4 8a4 4 0 11-8 0c0-1.5.5-2.5 1.5-3.5C10.5 5 11 3.5 12 2z"
          fill="currentColor"
          fillOpacity="0.95"
        />
        <path d="M9 14c1 1.5 4.5 1.5 6 0" stroke="#F6F0E4" strokeWidth="1.2" strokeLinecap="round" />
      </svg>
    </span>
  );
}
