/**
 * Page publique du devis officiel — accès via lien tokenisé dans l'email
 * envoyé au client. Lecture seule, imprimable (Ctrl+P → PDF propre).
 */

import { notFound } from "next/navigation";
import Link from "next/link";
import { getLead } from "@/lib/leads-store";
import { getQuote } from "@/lib/quotes-store";
import { computeTotals, formatEur } from "@/lib/quote-schema";
import { verifyRecapToken } from "@/lib/recap-token";
import { RecapPrint } from "@/app/devis/recap/[reference]/recap-print";
import { QuoteActions } from "./quote-actions";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export const metadata = {
  title: "Votre devis · Chauffage Artisanal",
  robots: { index: false, follow: false },
};

export default async function QuotePublicPage({
  params,
  searchParams,
}: {
  params: { reference: string };
  searchParams: { t?: string };
}) {
  // Le token est calculé sur `quote:<reference>` pour ne pas réutiliser le
  // token recap qui circule plus largement.
  if (!verifyRecapToken(`quote:${params.reference}`, searchParams.t)) {
    notFound();
  }
  const lead = await getLead(params.reference);
  const quote = await getQuote(params.reference);
  if (!lead || !quote) notFound();

  const totals = computeTotals(quote);
  const issuedAt = quote.sentAt
    ? new Date(quote.sentAt)
    : new Date(quote.updatedAt ?? Date.now());

  return (
    <main className="min-h-screen bg-cream py-12 lg:py-16 print:bg-white print:py-0">
      <div className="container max-w-3xl">
        <div className="flex items-center justify-between gap-4 mb-8 print:hidden">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-mono uppercase tracking-eyebrow text-graphite hover:text-copper transition-colors"
          >
            ← Retour au site
          </Link>
          <RecapPrint />
        </div>

        <article className="bg-white rounded-3xl border border-ink/10 shadow-soft overflow-hidden print:border-0 print:shadow-none print:rounded-none">
          {/* Header */}
          <header className="bg-charcoal text-cream px-8 py-10 print:bg-white print:text-ink">
            <div className="flex items-start justify-between gap-6 flex-wrap">
              <div>
                <div className="font-mono text-[10px] uppercase tracking-eyebrow text-copper">
                  Chauffage Artisanal · Luxembourg
                </div>
                <h1 className="mt-3 font-display text-3xl lg:text-4xl tracking-tight">
                  Devis n° {quote.number}
                </h1>
                <p className="mt-3 text-sm text-cream/70 print:text-muted">
                  Émis le {issuedAt.toLocaleDateString("fr-FR", { dateStyle: "long" })}
                  {quote.validUntil
                    ? ` · valable jusqu'au ${new Date(quote.validUntil).toLocaleDateString("fr-FR", { dateStyle: "long" })}`
                    : ""}
                </p>
              </div>
              <div className="text-right">
                <div className="font-mono text-[10px] uppercase tracking-eyebrow text-cream/60 print:text-muted">
                  Dossier
                </div>
                <div className="mt-1 font-mono text-base text-copper">{lead.reference}</div>
              </div>
            </div>
          </header>

          {/* Client */}
          <div className="px-8 py-6 border-b border-ink/8 grid sm:grid-cols-2 gap-6">
            <div>
              <div className="font-mono text-[10px] uppercase tracking-eyebrow text-muted">
                Émetteur
              </div>
              <div className="mt-2 text-sm text-ink font-medium">Chauffage Artisanal</div>
              <div className="text-xs text-graphite">Luxembourg</div>
            </div>
            <div>
              <div className="font-mono text-[10px] uppercase tracking-eyebrow text-muted">
                Client
              </div>
              <div className="mt-2 text-sm text-ink font-medium">{lead.fullName}</div>
              <div className="text-xs text-graphite">{lead.commune}</div>
              <div className="text-xs text-graphite">{lead.email}</div>
            </div>
          </div>

          {/* Lignes */}
          <div className="px-8 py-8">
            <table className="w-full border-collapse">
              <thead>
                <tr className="text-left border-b border-ink/15 font-mono text-[10px] uppercase tracking-eyebrow text-muted">
                  <th className="pb-3 pr-4">Description</th>
                  <th className="pb-3 px-2 text-right w-20">Qté</th>
                  <th className="pb-3 px-2 text-right w-20">Unité</th>
                  <th className="pb-3 px-2 text-right w-28">PU HT</th>
                  <th className="pb-3 pl-2 text-right w-28">Total HT</th>
                </tr>
              </thead>
              <tbody>
                {quote.lines.map((l) => (
                  <tr key={l.id} className="border-b border-ink/8">
                    <td className="py-3 pr-4 text-sm text-ink whitespace-pre-wrap">
                      {l.description}
                    </td>
                    <td className="py-3 px-2 text-right text-sm text-ink tabular-nums">
                      {l.quantity}
                    </td>
                    <td className="py-3 px-2 text-right text-sm text-muted">{l.unit}</td>
                    <td className="py-3 px-2 text-right text-sm text-ink tabular-nums">
                      {formatEur(l.unitPrice)}
                    </td>
                    <td className="py-3 pl-2 text-right text-sm text-ink font-medium tabular-nums">
                      {formatEur(l.quantity * l.unitPrice)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Totaux */}
            <div className="mt-8 ml-auto max-w-xs">
              <div className="grid gap-2 text-sm">
                <div className="flex items-baseline justify-between">
                  <span className="text-muted">Total HT</span>
                  <span className="text-ink tabular-nums">
                    {formatEur(totals.htAmount)}
                  </span>
                </div>
                <div className="flex items-baseline justify-between">
                  <span className="text-muted">TVA ({quote.tvaRate}%)</span>
                  <span className="text-ink tabular-nums">
                    {formatEur(totals.tvaAmount)}
                  </span>
                </div>
                <div className="pt-3 border-t border-ink/15 flex items-baseline justify-between">
                  <span className="text-ink font-medium">Total TTC</span>
                  <span className="font-display text-2xl text-copper tabular-nums">
                    {formatEur(totals.ttcAmount)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Action client : accepter / refuser */}
          <div className="px-8">
            <QuoteActions
              reference={params.reference}
              token={searchParams.t!}
              initialStatus={quote.status}
              signerNameHint={lead.fullName}
            />
          </div>

          {/* Notes */}
          {quote.notes && (
            <div className="px-8 py-6 border-t border-ink/8 bg-cream/40 print:bg-white">
              <div className="font-mono text-[10px] uppercase tracking-eyebrow text-copper mb-2">
                Notes complémentaires
              </div>
              <p className="text-sm text-graphite leading-relaxed whitespace-pre-wrap">
                {quote.notes}
              </p>
            </div>
          )}

          {/* Footer */}
          <footer className="bg-linen border-t border-ink/8 px-8 py-6 print:bg-white">
            <p className="text-xs text-graphite leading-relaxed">
              Devis sans engagement de votre part. Pour acceptation, retournez ce
              document signé ou contactez directement notre bureau d&apos;études.
            </p>
            <p className="mt-3 font-mono text-[10px] uppercase tracking-eyebrow text-muted">
              chauffage-artisanal.lu · Luxembourg · Réf. dossier {lead.reference}
            </p>
          </footer>
        </article>
      </div>
    </main>
  );
}
