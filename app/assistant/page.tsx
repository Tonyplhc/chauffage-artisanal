import type { Metadata } from "next";
import { Assistant } from "@/components/assistant/assistant";

export const metadata: Metadata = {
  title: "Assistant devis — vos économies et vos aides, en conversation",
  description:
    "Posez vos questions à notre assistant : économies en passant à la pompe à chaleur, aides Klimabonus 2026, rendez-vous de visite technique gratuite. Chiffres calculés par nos moteurs vérifiés.",
  alternates: { canonical: "/assistant" },
};

export default function AssistantPage() {
  return (
    <div className="bg-creme">
      <div className="max-w-2xl mx-auto px-5 pt-10 lg:pt-14 font-ui">
        <div className="font-mono text-[11px] uppercase tracking-eyebrow text-bleu">
          Assistant devis · Chauffage Artisanal
        </div>
        <h1 className="mt-3 font-display text-4xl lg:text-5xl tracking-tightest text-anthra">
          Posez vos questions. Obtenez vos chiffres.
        </h1>
        <p className="mt-3 text-taupe">
          Économies, aides Klimabonus 2026, rendez-vous — l&apos;assistant répond et calcule avec
          les mêmes moteurs vérifiés que notre estimateur.
        </p>
      </div>
      <Assistant />
    </div>
  );
}
