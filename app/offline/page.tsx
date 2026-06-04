import Link from "next/link";
import { WifiOff, RefreshCw, Phone } from "lucide-react";

export const metadata = {
  title: "Hors ligne · Chauffage Artisanal",
  robots: { index: false, follow: false },
};

// Force dynamic pour éviter le static-page-generation-timeout (la page contient
// des imports qui ralentissent la pré-génération en build prod).
export const dynamic = "force-dynamic";

export default function OfflinePage() {
  return (
    <main className="min-h-screen bg-cream py-16 lg:py-24 grid place-items-center">
      <div className="container max-w-2xl">
        <div className="rounded-3xl border border-ink/10 bg-white shadow-soft overflow-hidden">
          <header className="bg-charcoal text-cream px-8 py-10 lg:px-12 lg:py-14">
            <WifiOff className="h-10 w-10 text-copper" />
            <div className="mt-4 font-mono text-[10px] uppercase tracking-eyebrow text-copper">
              Hors ligne
            </div>
            <h1 className="mt-3 font-display text-3xl lg:text-4xl tracking-tight text-balance">
              Pas de connexion — <em className="not-italic text-copper">vous restez chez nous</em>.
            </h1>
            <p className="mt-5 text-cream/75 leading-relaxed">
              Vous consultez actuellement une version mise en cache du site.
              Certaines pages restent accessibles, mais les formulaires et le
              dashboard admin nécessitent une connexion active.
            </p>
          </header>
          <div className="px-8 lg:px-12 py-6 flex flex-col sm:flex-row gap-3 justify-between items-center bg-linen/40">
            <button
              onClick={() => window.location.reload()}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-ink text-cream px-5 py-3 text-sm font-medium hover:bg-copper transition-colors"
            >
              <RefreshCw className="h-4 w-4" />
              Réessayer
            </button>
            <a
              href="tel:"
              className="inline-flex items-center gap-2 rounded-full bg-white border border-ember/40 px-5 py-3 text-sm font-medium text-ember hover:bg-ember/10 transition-colors"
            >
              <Phone className="h-4 w-4" />
              Urgence — numéro
            </a>
          </div>
        </div>

        <p className="mt-6 text-center font-mono text-[10px] uppercase tracking-eyebrow text-muted">
          Chauffage Artisanal · Luxembourg · Depuis 1994
        </p>
      </div>
    </main>
  );
}
