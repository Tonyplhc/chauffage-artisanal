import Link from "next/link";
import { CheckCircle2, AlertCircle, ArrowUpRight } from "lucide-react";

export const metadata = {
  title: "Confirmation newsletter · Chauffage Artisanal",
  robots: { index: false, follow: false },
};

export default function NewsletterConfirmedPage({
  searchParams,
}: {
  searchParams: { ok?: string };
}) {
  const ok = searchParams.ok === "1";
  return (
    <main className="min-h-screen bg-creme py-16 lg:py-24 grid place-items-center">
      <div className="container max-w-xl">
        <div className="rounded-3xl border border-pierre bg-white shadow-soft overflow-hidden">
          <header className="bg-navy text-creme px-8 py-10 lg:px-12 lg:py-14">
            {ok ? (
              <CheckCircle2 className="h-10 w-10 text-[#2E7D5A]" />
            ) : (
              <AlertCircle className="h-10 w-10 text-terracotta" />
            )}
            <div className="mt-4 font-mono text-[10px] uppercase tracking-eyebrow text-bleu">
              {ok ? "Inscription confirmée" : "Lien invalide"}
            </div>
            <h1 className="mt-3 font-display text-3xl lg:text-4xl tracking-tight text-balance">
              {ok ? (
                <>
                  Bienvenue à bord —{" "}
                  <em className="not-italic text-bleu">votre inscription est confirmée</em>.
                </>
              ) : (
                <>
                  Ce lien <em className="not-italic text-terracotta">n&apos;est plus valide</em>.
                </>
              )}
            </h1>
            <p className="mt-5 text-creme/75 leading-relaxed">
              {ok
                ? "Vous recevrez nos prochaines analyses techniques et lectures Klimabonus directement par email. Sans spam — uniquement quand on a quelque chose à dire."
                : "Le lien que vous avez utilisé a peut-être expiré ou été modifié. Vous pouvez vous réinscrire depuis n'importe quelle page du site."}
            </p>
          </header>
          <div className="px-8 lg:px-12 py-6 flex flex-col sm:flex-row gap-3 justify-between items-center">
            <Link
              href="/actualites"
              className="inline-flex items-center gap-2 rounded-full bg-navy text-creme px-5 py-3 text-sm font-medium hover:bg-bleu transition-colors"
            >
              Lire les actualités
              <ArrowUpRight className="h-4 w-4" />
            </Link>
            <Link
              href="/"
              className="text-sm text-taupe hover:text-bleu transition-colors"
            >
              Retour à l&apos;accueil
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
