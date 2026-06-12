import type { Metadata } from "next";
import { Fraunces, Inter_Tight, JetBrains_Mono, Montserrat } from "next/font/google";
import "./globals.css";
import { Nav } from "@/components/nav";
import { Footer } from "@/components/footer";
import { EmergencyBar } from "@/components/emergency-bar";
import { SmoothScroll } from "@/components/smooth-scroll";
import { CookieConsent } from "@/components/cookie-consent";
import { PageTransition } from "@/components/page-transition";
import { WhatsAppCta } from "@/components/whatsapp-cta";
import { MobileStickyCta } from "@/components/mobile-sticky-cta";
import { buildOrganizationJsonLd } from "@/lib/company-info";
import { I18nProvider } from "@/components/i18n-provider";
import { SwRegister } from "@/components/sw-register";
import { CommandPalette } from "@/components/command-palette";
import { AnalyticsTracker } from "@/components/analytics-tracker";
import { ChatWidget } from "@/components/chat-widget";
import { SourceTracker } from "@/components/source-tracker";
import { PublicShell } from "@/components/public-shell";

// Fraunces : police titre — variable font, préchargée car critique au LCP.
// On ne spécifie PAS de `weight` : `axes` impose le mode variable, et fournir
// `weight` casse le build avec "Axes can only be defined for variable fonts".
const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
  axes: ["opsz", "SOFT"],
  preload: true,
});

// Inter Tight : sans-serif principale — préchargée également (corps de texte)
const interTight = Inter_Tight({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
  preload: true,
  weight: ["400", "500", "600", "700"],
});

// JetBrains Mono : utilisée uniquement pour les eyebrows — pas critique au LCP,
// on désactive le preload pour économiser une requête bloquante.
const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
  preload: false,
  weight: ["400", "500"],
});

// Montserrat : police d'interface & de corps du design system v2 (identité
// historique « chart2013 »). Exposée via --font-ui / classe `font-ui`.
// Non préchargée pour l'instant : disponible pour la migration (Lot B+) sans
// impacter le LCP de la version actuelle qui utilise encore --font-sans.
const montserrat = Montserrat({
  subsets: ["latin"],
  variable: "--font-ui",
  display: "swap",
  preload: false,
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://www.chauffage-artisanal.lu"),
  title: {
    default: "Chauffage Artisanal — Le confort thermique nouvelle génération au Luxembourg",
    template: "%s · Chauffage Artisanal",
  },
  description:
    "Depuis 1994, la maison technique luxembourgeoise du chauffage, des pompes à chaleur, de la climatisation et des énergies renouvelables. Intervention <2h, devis sous 24h.",
  openGraph: { type: "website", locale: "fr_LU", siteName: "Chauffage Artisanal" },
  robots: { index: true, follow: true },
  // Le site n'a pas d'URLs localisées (rendu FR unique, switch de langue par
  // cookie côté client). On ne déclare donc qu'un canonical, sans hreflang
  // `languages` de/en factices qui pointeraient tous vers la même URL FR.
  alternates: {
    canonical: "/",
  },
};

// JSON-LD LocalBusiness site-wide — adresse + téléphone + horaires +
// RCS officiels (sourced via lib/company-info.ts). Donne à Google les
// données pour Knowledge Panel et résultats locaux.
const ORGANIZATION_LD = buildOrganizationJsonLd();

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={`${fraunces.variable} ${interTight.variable} ${jetbrains.variable} ${montserrat.variable}`}>
      <head>
        {/*
          Preconnect aux origines critiques chargées sur la home et les pages
          contenu — économise ~150-300 ms par origine sur le LCP en éliminant
          le DNS lookup + TCP handshake + TLS négociation.
          Origines validées : images.unsplash.com (hero), images.pexels.com
          (covers articles), api.qrserver.com (QR équipements). OSM tiles
          chargées en lazy (iframe) — pas besoin de preconnect.
        */}
        <link rel="preconnect" href="https://images.unsplash.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://images.pexels.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://api.qrserver.com" />
        {/*
          DNS prefetch sur Supabase et Resend — connexion établie tôt si le
          visiteur arrive ensuite sur /devis qui POST vers Supabase.
        */}
        <link rel="dns-prefetch" href="https://rinwvyroexrbssvcaxpo.supabase.co" />
        <link rel="dns-prefetch" href="https://api.resend.com" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(ORGANIZATION_LD) }}
        />
      </head>
      <body className="grain font-sans antialiased bg-cream text-ink overflow-x-hidden">
        {/*
          Skip link a11y — visible uniquement au focus clavier, permet aux
          utilisateurs lecteur d'écran de sauter directement au contenu
          principal sans tabber dans la navigation. WCAG 2.4.1.
        */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[100] focus:bg-ink focus:text-cream focus:px-4 focus:py-2 focus:rounded-full focus:font-medium focus:outline-none focus:ring-2 focus:ring-copper"
        >
          Aller au contenu principal
        </a>
        <I18nProvider>
          <SwRegister />
          <SmoothScroll />
          <PublicShell>
            <EmergencyBar />
            <Nav />
          </PublicShell>
          <main id="main-content" className="relative">
            <PageTransition>{children}</PageTransition>
          </main>
          <PublicShell>
            <Footer />
            <WhatsAppCta />
            <ChatWidget />
            <MobileStickyCta />
          </PublicShell>
          <CookieConsent />
          <CommandPalette />
          <AnalyticsTracker />
          <SourceTracker />
        </I18nProvider>
      </body>
    </html>
  );
}
