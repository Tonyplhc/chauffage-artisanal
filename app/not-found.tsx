import Link from "next/link";
import { ArrowRight, Home, Phone, Wrench } from "lucide-react";

export const metadata = {
  title: "Page introuvable · Chauffage Artisanal",
  robots: { index: false, follow: false },
};

const SUGGESTIONS = [
  { href: "/chauffage", label: "Chauffage" },
  { href: "/pompes-a-chaleur", label: "Pompes à chaleur" },
  { href: "/climatisation", label: "Climatisation" },
  { href: "/sanitaire", label: "Sanitaire" },
  { href: "/primes-aides", label: "Primes & aides" },
  { href: "/devis", label: "Demander un devis" },
];

export default function NotFound() {
  return (
    <main className="min-h-screen bg-cream flex items-center py-16 lg:py-24">
      <div className="container max-w-4xl">
        <div className="rounded-3xl border border-ink/10 bg-white shadow-soft overflow-hidden">
          {/* Header sombre */}
          <header className="bg-charcoal text-cream px-8 py-10 lg:px-12 lg:py-14">
            <div className="font-mono text-[10px] uppercase tracking-eyebrow text-copper">
              Erreur 404 · Page introuvable
            </div>
            <h1 className="mt-4 font-display text-4xl lg:text-5xl tracking-tight text-balance">
              Ce lien ne mène <em className="not-italic text-copper">nulle part chez nous</em>.
            </h1>
            <p className="mt-5 text-cream/75 text-lg max-w-xl leading-relaxed">
              La page que vous cherchez n&apos;existe pas — ou n&apos;existe plus.
              Peut-être un lien périmé, ou une URL mal tapée.
            </p>
          </header>

          {/* Suggestions */}
          <div className="px-8 lg:px-12 py-8">
            <div className="font-mono text-[10px] uppercase tracking-eyebrow text-muted mb-4">
              Vous cherchiez peut-être
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {SUGGESTIONS.map((s) => (
                <Link
                  key={s.href}
                  href={s.href}
                  className="group inline-flex items-center justify-between gap-3 px-4 py-3 rounded-xl border border-ink/10 bg-cream hover:border-copper/40 hover:bg-white transition-all"
                >
                  <span className="text-sm text-ink">{s.label}</span>
                  <ArrowRight className="h-3.5 w-3.5 text-graphite group-hover:text-copper group-hover:translate-x-0.5 transition-all" />
                </Link>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="border-t border-ink/8 bg-linen/40 px-8 lg:px-12 py-6 flex flex-col sm:flex-row gap-3 justify-between items-center">
            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-full bg-ink text-cream px-5 py-3 text-sm font-medium hover:bg-copper transition-colors"
            >
              <Home className="h-4 w-4" />
              Retour à l&apos;accueil
            </Link>
            <div className="flex flex-wrap gap-3 justify-center">
              <Link
                href="/depannage"
                className="inline-flex items-center gap-2 rounded-full border border-ember/40 bg-ember/5 px-5 py-3 text-sm font-medium text-ember hover:bg-ember/15 transition-colors"
              >
                <Wrench className="h-4 w-4" />
                Dépannage
              </Link>
              <Link
                href="/contact"
                className="inline-flex items-center gap-2 rounded-full border border-ink/15 bg-white px-5 py-3 text-sm font-medium text-ink hover:border-copper hover:text-copper transition-colors"
              >
                <Phone className="h-4 w-4" />
                Contact
              </Link>
            </div>
          </div>
        </div>

        <p className="mt-6 text-center font-mono text-[10px] uppercase tracking-eyebrow text-muted">
          Chauffage Artisanal · Luxembourg · Depuis 1994
        </p>
      </div>
    </main>
  );
}
