"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, ArrowUpRight, Phone, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { useI18n } from "@/components/i18n-provider";
import { LanguageSwitcher } from "@/components/language-switcher";
import { Logo } from "@/components/brand/logo";

type NavItem = { href: string; label: string; badge?: string };

// ── Particuliers : métiers + services + aides (routes réelles existantes) ──
function buildParticuliersMetiers(t: ReturnType<typeof useI18n>["t"]): NavItem[] {
  return [
    { href: "/chauffage", label: t.nav.chauffage },
    { href: "/pompes-a-chaleur", label: t.nav.pac },
    { href: "/climatisation", label: t.nav.climatisation },
    { href: "/sanitaire", label: t.nav.sanitaire },
    { href: "/energies-renouvelables", label: t.nav.enr },
  ];
}
function buildParticuliersServices(t: ReturnType<typeof useI18n>["t"]): NavItem[] {
  return [
    { href: "/depannage", label: t.nav.depannage },
    { href: "/entretien", label: t.nav.entretien },
    { href: "/primes-aides", label: t.nav.aides, badge: t.nav.aidesBadge },
  ];
}

// ── Promoteurs : pas de page dédiée pour l'instant → routes réelles B2B.
//    (Repointera vers la page/section Promoteurs dédiée dans un lot ultérieur.)
function buildPromoteurs(t: ReturnType<typeof useI18n>["t"]): NavItem[] {
  return [
    { href: "/contact", label: t.nav.consultation },
    { href: "/realisations", label: t.nav.realisations },
    { href: "/savoir-faire", label: t.nav.savoirFaire },
  ];
}

// ── Outils : calculateurs/simulateurs (pages FR — libellés non traduits,
//    cohérent avec le contenu des pages). ──
const OUTILS: NavItem[] = [
  { href: "/estimation", label: "Estimation gratuite · 60 s" },
  { href: "/assistant", label: "Assistant devis (IA)" },
  { href: "/outils/estimateur-prix", label: "Estimateur de prix" },
  { href: "/outils/eligibilite-klimabonus", label: "Éligibilité Klimabonus" },
  { href: "/outils/roi-pac", label: "ROI pompe à chaleur" },
  { href: "/outils/dimensionnement-pac", label: "Dimensionnement PAC" },
  { href: "/outils/economies-energie", label: "Économies d'énergie" },
  { href: "/outils/auto-diagnostic", label: "Auto-diagnostic" },
];

// ── Mobile drawer — bloc « Maison & infos » (liens secondaires) ──
function buildMaison(t: ReturnType<typeof useI18n>["t"]): NavItem[] {
  return [
    { href: "/marques", label: t.nav.marques },
    { href: "/realisations", label: t.nav.realisations },
    { href: "/savoir-faire", label: t.nav.savoirFaire },
    { href: "/actualites", label: t.nav.actualites },
    { href: "/a-propos", label: t.nav.aPropos },
    { href: "/contact", label: t.nav.contact },
  ];
}

export function Nav() {
  // Nav par rôle (Lot B) — Particuliers / Promoteurs / Outils + logo réel.
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const { t } = useI18n();

  const particuliersMetiers = buildParticuliersMetiers(t);
  const particuliersServices = buildParticuliersServices(t);
  const promoteurs = buildPromoteurs(t);
  const maison = buildMaison(t);

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
    <>
      <header
        className={cn(
          "sticky top-0 z-40 font-ui transition-all duration-500",
          scrolled
            ? "bg-creme/90 backdrop-blur-xl border-b border-pierre shadow-soft"
            : "bg-creme/70 backdrop-blur-sm border-b border-transparent",
        )}
      >
        <div className="container flex items-center justify-between h-16 md:h-20">
          {/* Logo réel — couleur sur fond clair, clear-space via padding + filet */}
          <Link
            href="/"
            className="flex items-center gap-3 pr-4 lg:border-r lg:border-pierre"
            aria-label="Chauffage Artisanal — accueil"
          >
            <Logo heightClass="h-8 md:h-9" priority />
            <span className="hidden lg:block font-mono text-[9px] uppercase tracking-eyebrow text-taupe leading-tight">
              Depuis 1994
              <br />
              Luxembourg
            </span>
          </Link>

          {/* Navigation par rôle (desktop) */}
          <nav className="hidden lg:flex items-center gap-1">
            <NavMenu label={t.nav.particuliers}>
              <MenuSection label={t.nav.metiers} />
              {particuliersMetiers.map((i) => (
                <MenuLink key={i.href} item={i} pathname={pathname} />
              ))}
              <div className="my-1.5 border-t border-pierre" />
              {particuliersServices.map((i) => (
                <MenuLink key={i.href} item={i} pathname={pathname} />
              ))}
            </NavMenu>

            <NavMenu label={t.nav.promoteurs}>
              {promoteurs.map((i) => (
                <MenuLink key={i.href} item={i} pathname={pathname} />
              ))}
            </NavMenu>

            <NavMenu label={t.nav.outils}>
              {OUTILS.map((i) => (
                <MenuLink key={i.href} item={i} pathname={pathname} />
              ))}
              <div className="my-1.5 border-t border-pierre" />
              <MenuLink
                item={{ href: "/outils", label: t.nav.outilsAll }}
                pathname={pathname}
                accent
              />
            </NavMenu>

            <Link
              href="/marques"
              className={cn(
                "relative px-3 py-2 text-sm transition-colors",
                pathname === "/marques" ? "text-anthra" : "text-taupe hover:text-anthra",
              )}
            >
              {t.nav.marques}
            </Link>
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <LanguageSwitcher />

            {/* CTA Recrutement — pulse bleu, visible en permanence */}
            <Link
              href="/recrutement"
              className="hidden md:inline-flex items-center gap-2 rounded-full bg-creme border border-bleu/40 text-anthra px-4 py-2 text-sm font-medium hover:bg-bleu/10 hover:border-bleu transition-all"
              aria-label="Voir les postes ouverts"
            >
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-bleu opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-bleu" />
              </span>
              <span>{t.nav.recrutementBadge}</span>
            </Link>

            {/* Dépannage — accent terracotta (urgence) */}
            <a
              href="/depannage"
              className="hidden sm:grid place-items-center h-10 w-10 rounded-full border border-terracotta/40 text-terracotta hover:bg-terracotta/10 transition-colors"
              aria-label={t.nav.depannage}
            >
              <Phone className="h-4 w-4" />
            </a>

            {/* CTA principal — bleu (structure/confiance). Mène à l'estimateur
                (produit cœur, Charte Règle N°2 : tout converge vers l'estimation). */}
            <Link
              href="/estimation"
              className="hidden md:inline-flex items-center gap-2 rounded-full bg-bleu text-creme px-5 py-2.5 text-sm font-semibold hover:bg-navy transition-colors"
            >
              {t.nav.estimationCta}
              <ArrowUpRight className="h-4 w-4" />
            </Link>

            <button
              onClick={() => setOpen((v) => !v)}
              className="lg:hidden h-10 w-10 grid place-items-center rounded-full border border-anthra/15 text-anthra"
              aria-label="Menu"
            >
              {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </button>
          </div>
        </div>
      </header>

      {/* ─────────── Mobile drawer (bottom sheet) ─────────── */}
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setOpen(false)}
              className="lg:hidden fixed inset-0 z-[55] bg-navy/40 backdrop-blur-sm"
              aria-hidden
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", stiffness: 320, damping: 36 }}
              className="lg:hidden fixed inset-x-0 bottom-0 z-[56] bg-creme font-ui rounded-t-[28px] border-t border-pierre shadow-[0_-12px_40px_-8px_rgba(10,61,110,0.25)] max-h-[88vh] overflow-y-auto"
              role="dialog"
              aria-modal="true"
              aria-label="Menu"
            >
              {/* Handle bar */}
              <div className="sticky top-0 z-10 bg-creme pt-3 pb-2 flex flex-col items-center">
                <button
                  onClick={() => setOpen(false)}
                  className="h-1 w-12 rounded-full bg-anthra/20 hover:bg-anthra/40 transition-colors"
                  aria-label="Fermer le menu"
                />
              </div>

              <div className="container px-5 pb-8">
                {/* Header drawer : logo réel + close */}
                <div className="flex items-center justify-between pt-2 pb-5 border-b border-pierre mb-5">
                  <Logo heightClass="h-8" />
                  <button
                    onClick={() => setOpen(false)}
                    className="h-10 w-10 grid place-items-center rounded-full bg-white border border-pierre text-anthra hover:bg-anthra hover:text-creme transition-colors"
                    aria-label="Fermer"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                {/* Particuliers */}
                <DrawerHeading>{t.nav.particuliers}</DrawerHeading>
                <div className="grid gap-1.5 mb-5">
                  {[...particuliersMetiers, ...particuliersServices].map((i) => (
                    <DrawerPrimaryLink key={i.href} item={i} pathname={pathname} />
                  ))}
                </div>

                {/* Promoteurs */}
                <DrawerHeading>{t.nav.promoteurs}</DrawerHeading>
                <div className="grid gap-1.5 mb-5">
                  {promoteurs.map((i) => (
                    <DrawerPrimaryLink key={`promo-${i.href}`} item={i} pathname={pathname} />
                  ))}
                </div>

                {/* Outils */}
                <DrawerHeading>{t.nav.outils}</DrawerHeading>
                <div className="grid grid-cols-2 gap-1.5 mb-5">
                  {[...OUTILS, { href: "/outils", label: t.nav.outilsAll }].map((i) => (
                    <DrawerSecondaryLink key={`out-${i.href}`} item={i} pathname={pathname} />
                  ))}
                </div>

                {/* Maison & infos */}
                <DrawerHeading>{t.nav.maisonInfos}</DrawerHeading>
                <div className="grid grid-cols-2 gap-1.5 mb-5">
                  {maison.map((i) => (
                    <DrawerSecondaryLink key={`maison-${i.href}`} item={i} pathname={pathname} />
                  ))}
                </div>

                {/* CTAs */}
                <div className="grid grid-cols-2 gap-2 pt-4 border-t border-pierre">
                  <Link
                    href="/estimation"
                    className="inline-flex justify-center items-center gap-2 rounded-full bg-bleu text-creme px-5 py-3.5 text-sm font-semibold"
                  >
                    {t.nav.estimationCta}
                    <ArrowUpRight className="h-4 w-4" />
                  </Link>
                  <a
                    href="/depannage"
                    className="inline-flex justify-center items-center gap-2 rounded-full border border-terracotta/50 bg-terracotta/5 text-terracotta px-5 py-3.5 text-sm font-semibold"
                  >
                    <Phone className="h-4 w-4" />
                    {t.nav.depannage}
                  </a>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

/* ─────────────── Desktop dropdown (CSS hover/focus, sans JS) ─────────────── */

function NavMenu({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="relative group">
      <button
        className="inline-flex items-center gap-1 px-3 py-2 text-sm text-taupe group-hover:text-anthra transition-colors"
        aria-haspopup="true"
      >
        {label}
        <ChevronDown className="h-3.5 w-3.5 transition-transform group-hover:rotate-180" />
      </button>
      {/* pt-3 = pont invisible pour éviter la perte de hover entre trigger et panel */}
      <div className="absolute left-0 top-full pt-3 min-w-[264px] opacity-0 invisible translate-y-1 group-hover:opacity-100 group-hover:visible group-hover:translate-y-0 group-focus-within:opacity-100 group-focus-within:visible group-focus-within:translate-y-0 transition-all duration-200">
        <div className="bg-creme border border-pierre rounded-2xl shadow-lift p-2">{children}</div>
      </div>
    </div>
  );
}

function MenuSection({ label }: { label: string }) {
  return (
    <div className="px-3 pt-2 pb-1 text-[10px] font-mono uppercase tracking-eyebrow text-taupe">
      {label}
    </div>
  );
}

function MenuLink({
  item,
  pathname,
  accent,
}: {
  item: NavItem;
  pathname: string;
  accent?: boolean;
}) {
  const active = pathname === item.href;
  return (
    <Link
      href={item.href}
      className={cn(
        "flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl text-sm transition-colors",
        accent
          ? "text-bleu font-semibold hover:bg-bleu/5"
          : active
            ? "bg-bleu/8 text-bleu"
            : "text-anthra hover:bg-bleu/5 hover:text-bleu",
      )}
    >
      <span className="flex items-center gap-2">
        {item.label}
        {item.badge && (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-bleu/12 border border-bleu/40 text-[9px] font-mono uppercase tracking-eyebrow text-bleu">
            {item.badge}
          </span>
        )}
      </span>
      <ArrowUpRight className={cn("h-3.5 w-3.5 shrink-0", active ? "opacity-100" : "opacity-40")} />
    </Link>
  );
}

/* ─────────────── Mobile drawer building blocks ─────────────── */

function DrawerHeading({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-[10px] font-mono uppercase tracking-eyebrow text-taupe mb-2">{children}</div>
  );
}

function DrawerPrimaryLink({ item, pathname }: { item: NavItem; pathname: string }) {
  const active = pathname === item.href;
  return (
    <Link
      href={item.href}
      className={cn(
        "py-3.5 px-4 -mx-2 rounded-2xl text-lg font-display tracking-tight flex items-center justify-between gap-3 transition-colors",
        active ? "bg-bleu text-creme" : "text-anthra hover:bg-anthra/5",
      )}
    >
      <span className="flex items-center gap-2">
        {item.label}
        {item.badge && (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-bleu/15 border border-bleu/40 text-[9px] font-mono uppercase tracking-eyebrow text-bleu">
            {item.badge}
          </span>
        )}
      </span>
      <ArrowUpRight className={cn("h-4 w-4 shrink-0", active ? "opacity-100" : "opacity-50")} />
    </Link>
  );
}

function DrawerSecondaryLink({ item, pathname }: { item: NavItem; pathname: string }) {
  const active = pathname === item.href;
  return (
    <Link
      href={item.href}
      className={cn(
        "py-3 px-3.5 rounded-xl text-sm flex items-center gap-2 border transition-all",
        active
          ? "bg-creme border-bleu/40 text-anthra"
          : "bg-white border-pierre text-taupe hover:border-bleu/30",
      )}
    >
      <span className="truncate">{item.label}</span>
    </Link>
  );
}
