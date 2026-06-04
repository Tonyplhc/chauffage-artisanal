"use client";

/**
 * Bouton "Émettre une facture depuis le devis" pour la fiche lead.
 *
 * Crée une facture depuis le devis du lead (réuse les lignes + tvaRate) et
 * navigue vers la page d'édition pour finaliser et envoyer.
 */

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Receipt, Loader2 } from "lucide-react";

export function LeadInvoiceButton({
  reference,
  hasQuote,
}: {
  reference: string;
  hasQuote: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const emit = async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fromQuote: reference }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error ?? "Erreur");
      }
      router.push(`/admin/invoices/${data.invoice.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setBusy(false);
    }
  };

  if (!hasQuote) return null;

  return (
    <div className="rounded-2xl border border-ink/10 bg-white shadow-soft p-4 flex items-center gap-3">
      <Receipt className="h-4 w-4 text-copper shrink-0" />
      <div className="min-w-0 flex-1">
        <div className="text-sm text-ink font-medium">Émettre une facture</div>
        <div className="text-xs text-muted">
          Génère <code className="font-mono">FAC-AAAA-NNNN</code> à partir du
          devis officiel
        </div>
        {error && <div className="text-xs text-ember mt-1">{error}</div>}
      </div>
      <button
        onClick={emit}
        disabled={busy}
        className="inline-flex items-center gap-1.5 rounded-full bg-ink text-cream px-3 py-1.5 text-xs hover:bg-copper disabled:opacity-50"
      >
        {busy ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <Receipt className="h-3.5 w-3.5" />
        )}
        Émettre
      </button>
    </div>
  );
}
