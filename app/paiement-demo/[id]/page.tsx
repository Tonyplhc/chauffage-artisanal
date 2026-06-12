"use client";

/**
 * Page de démo paiement — utilisée uniquement quand STRIPE_SECRET_KEY est
 * absent. Affiche le récap du paiement avec un bouton « Simuler le paiement »
 * pour la démo client. Pas de validation token côté public ici car les IDs
 * sont aléatoires et la page ne déclenche le mark-paid que via l'API admin.
 *
 * En prod réelle, cette route est inactive (jamais générée) et c'est Stripe
 * Checkout qui prend le relais.
 */

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
  CreditCard,
  Lock,
  Loader2,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";

type Payment = {
  id: string;
  leadReference: string;
  amountCents: number;
  description: string;
  status: "pending" | "completed" | "canceled" | "expired";
  mode: "live" | "demo";
};

function formatEur(cents: number) {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
  }).format(cents / 100);
}

export default function PaiementDemoPage() {
  const params = useParams<{ id: string }>();
  const [payment, setPayment] = useState<Payment | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Lecture publique limitée — on n'a pas d'auth ici. On retourne juste
    // le récap. La simulation effective requiert l'admin connecté.
    fetch(`/api/paiement-demo/${params.id}`, { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : Promise.reject(r)))
      .then((d) => setPayment(d.payment))
      .catch(() => setError("Paiement introuvable"));
  }, [params.id]);

  if (error) {
    return (
      <div className="min-h-screen bg-creme grid place-items-center px-4">
        <div className="max-w-md text-center">
          <AlertTriangle className="h-12 w-12 mx-auto text-terracotta mb-3" />
          <p className="text-taupe">{error}</p>
        </div>
      </div>
    );
  }

  if (!payment) {
    return (
      <div className="min-h-screen bg-creme grid place-items-center">
        <Loader2 className="h-6 w-6 animate-spin text-bleu" />
      </div>
    );
  }

  const paid = payment.status === "completed";

  return (
    <div className="min-h-screen bg-creme py-12 lg:py-20 px-4">
      <div className="container max-w-xl">
        <div className="rounded-3xl border border-pierre bg-white shadow-soft overflow-hidden">
          {/* Header */}
          <div className="bg-navy text-creme px-6 py-5">
            <div className="font-mono text-[10px] uppercase tracking-eyebrow text-bleu mb-1">
              Démonstration — mode interne
            </div>
            <div className="font-display text-2xl">Paiement d&apos;acompte</div>
            <div className="text-xs opacity-70 mt-1 font-mono">
              Dossier {payment.leadReference}
            </div>
          </div>

          {/* Body */}
          <div className="p-6 lg:p-8">
            {paid ? (
              <div className="text-center py-8">
                <CheckCircle2 className="h-14 w-14 mx-auto text-[#2E7D5A] mb-3" />
                <h1 className="font-display text-2xl text-anthra mb-1">
                  Paiement confirmé
                </h1>
                <p className="text-taupe text-sm">
                  Merci, votre acompte de{" "}
                  <strong>{formatEur(payment.amountCents)}</strong> a été
                  enregistré.
                </p>
              </div>
            ) : (
              <>
                <div className="rounded-2xl bg-creme border border-pierre p-5 mb-6">
                  <div className="font-mono text-[10px] uppercase tracking-eyebrow text-muted mb-2">
                    Détail
                  </div>
                  <div className="text-sm text-anthra leading-relaxed">
                    {payment.description}
                  </div>
                  <div className="mt-4 pt-4 border-t border-pierre flex items-center justify-between">
                    <span className="text-sm text-muted">Montant à régler</span>
                    <span className="font-display text-3xl text-anthra tabular-nums">
                      {formatEur(payment.amountCents)}
                    </span>
                  </div>
                </div>

                <div className="rounded-xl bg-bleu/8 border border-bleu/30 p-4 mb-6">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 text-bleu shrink-0 mt-0.5" />
                    <div className="text-xs text-anthra">
                      <strong>Mode démonstration :</strong> aucun débit réel ne
                      sera effectué. En production, cette page est remplacée
                      par <code className="bg-white px-1 rounded">Stripe Checkout</code>{" "}
                      avec saisie carte sécurisée 3D-Secure et confirmation par
                      webhook signé.
                    </div>
                  </div>
                </div>

                <button
                  disabled
                  className="w-full inline-flex items-center justify-center gap-2 rounded-full bg-navy text-creme px-5 py-3 text-base font-medium opacity-60 cursor-not-allowed"
                >
                  <CreditCard className="h-4 w-4" />
                  Payer maintenant (désactivé en démo)
                </button>
                <p className="mt-3 text-[11px] text-muted text-center inline-flex items-center justify-center gap-1">
                  <Lock className="h-3 w-3" />
                  La confirmation se fait depuis le back-office admin pour la
                  démo
                </p>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
