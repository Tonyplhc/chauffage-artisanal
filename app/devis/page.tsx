import { Suspense } from "react";
import { Configurator } from "@/components/devis/configurator";

export const metadata = {
  title: "Devis personnalisé — Configurateur Chauffage Artisanal",
  description:
    "Configurez votre projet en 7 étapes : services, bâtiment, contexte, délai & budget, marque souhaitée, photos, contact. Devis sous 24h.",
};

export default function DevisPage() {
  return (
    <div className="relative">
      <div className="absolute inset-x-0 top-0 h-[60vh] bg-copper-glow opacity-100 pointer-events-none" />
      <div className="absolute inset-x-0 top-0 h-[60vh] bg-grid [background-size:64px_64px] opacity-50 pointer-events-none [mask-image:radial-gradient(ellipse_at_top,black,transparent_70%)]" />
      {/* Suspense requis par Next.js 14 pour useSearchParams (?marque=xxx) */}
      <Suspense fallback={<div className="min-h-[60vh]" />}>
        <Configurator />
      </Suspense>
    </div>
  );
}
