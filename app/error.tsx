"use client";

/**
 * Erreur globale — fallback Next.js pour toute erreur runtime non capturée
 * dans une page. Doit rester un client component (directive use client).
 */

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RotateCcw, Home, Phone } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // eslint-disable-next-line no-console
    console.error("[app/error] runtime error captured:", error);
  }, [error]);

  return (
    <main className="min-h-screen bg-creme flex items-center py-16 lg:py-24">
      <div className="container max-w-3xl">
        <div className="rounded-3xl border border-terracotta/30 bg-white shadow-soft overflow-hidden">
          <header className="bg-navy text-creme px-8 py-10 lg:px-12 lg:py-14">
            <div className="flex items-center gap-3 font-mono text-[10px] uppercase tracking-eyebrow text-terracotta">
              <AlertTriangle className="h-4 w-4" />
              Erreur inattendue
            </div>
            <h1 className="mt-4 font-display text-4xl lg:text-5xl tracking-tight text-balance">
              Quelque chose s&apos;est{" "}
              <em className="not-italic text-terracotta">cassé de notre côté</em>.
            </h1>
            <p className="mt-5 text-creme/75 text-lg max-w-xl leading-relaxed">
              Le site a rencontré une erreur en chargeant cette page. L&apos;équipe
              technique en a été notifiée. Vous pouvez réessayer, ou revenir à l&apos;accueil.
            </p>
            {error.digest && (
              <div className="mt-5 font-mono text-[10px] uppercase tracking-eyebrow text-creme/40">
                Code · {error.digest}
              </div>
            )}
          </header>

          <div className="px-8 lg:px-12 py-6 flex flex-col sm:flex-row gap-3 justify-between bg-creme/40">
            <button
              onClick={reset}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-navy text-creme px-5 py-3 text-sm font-medium hover:bg-bleu transition-colors"
            >
              <RotateCcw className="h-4 w-4" />
              Réessayer
            </button>
            <div className="flex flex-wrap gap-3 justify-center">
              <Link
                href="/"
                className="inline-flex items-center gap-2 rounded-full border border-pierre bg-white px-5 py-3 text-sm font-medium text-anthra hover:border-bleu hover:text-bleu transition-colors"
              >
                <Home className="h-4 w-4" />
                Accueil
              </Link>
              <Link
                href="/contact"
                className="inline-flex items-center gap-2 rounded-full border border-pierre bg-white px-5 py-3 text-sm font-medium text-anthra hover:border-bleu hover:text-bleu transition-colors"
              >
                <Phone className="h-4 w-4" />
                Contact
              </Link>
            </div>
          </div>
        </div>

        <p className="mt-6 text-center font-mono text-[10px] uppercase tracking-eyebrow text-muted">
          Chauffage Artisanal · Luxembourg
        </p>
      </div>
    </main>
  );
}
