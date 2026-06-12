import Link from "next/link";
import { CheckCircle2, AlertCircle } from "lucide-react";

export const metadata = {
  title: "Désinscription newsletter · Chauffage Artisanal",
  robots: { index: false, follow: false },
};

export default function UnsubscribedPage({
  searchParams,
}: {
  searchParams: { ok?: string };
}) {
  const ok = searchParams.ok === "1";
  return (
    <main className="min-h-screen bg-cream py-16 grid place-items-center">
      <div className="container max-w-xl">
        <div className="rounded-3xl border border-ink/10 bg-white shadow-soft p-10 text-center">
          {ok ? (
            <CheckCircle2 className="h-12 w-12 mx-auto text-[#22a06b]" />
          ) : (
            <AlertCircle className="h-12 w-12 mx-auto text-ember" />
          )}
          <h1 className="mt-5 font-display text-3xl text-ink">
            {ok ? "Vous êtes désabonné" : "Lien invalide"}
          </h1>
          <p className="mt-3 text-graphite leading-relaxed">
            {ok
              ? "Vous ne recevrez plus nos communications par email. Vous pouvez vous réinscrire à tout moment depuis le site."
              : "Le lien que vous avez utilisé n'est plus valide. Si vous souhaitez vraiment vous désabonner, contactez-nous."}
          </p>
          <Link
            href="/"
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-ink text-cream px-5 py-3 text-sm font-medium hover:bg-copper transition-colors"
          >
            Retour à l&apos;accueil
          </Link>
        </div>
      </div>
    </main>
  );
}
