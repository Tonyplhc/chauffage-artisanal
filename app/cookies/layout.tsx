import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Politique cookies",
  description:
    "Politique d'utilisation des cookies sur le site Chauffage Artisanal Luxembourg.",
  robots: { index: true, follow: true },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
