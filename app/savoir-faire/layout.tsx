import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Savoir-faire & méthode — Chauffage Artisanal Luxembourg",
  description:
    "Notre méthode en 5 étapes, les technologies que nous installons, et les raisons qui font de nous une maison technique de confiance au Luxembourg depuis 1994.",
  keywords: [
    "savoir-faire chauffage Luxembourg",
    "méthode installation chauffage",
    "marques chaudière PAC Luxembourg",
    "Viessmann Daikin Vaillant Luxembourg",
    "installateur certifié Luxembourg",
  ],
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
