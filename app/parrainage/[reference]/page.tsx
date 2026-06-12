"use client";

/**
 * Page publique de parrainage.
 *
 * Accessible via /parrainage/[reference]?t=<token>. Le visiteur reçoit le
 * lien d'un client converti, on l'accueille et on l'incite à demander un
 * devis. Au click sur "Demander mon devis", on persiste la référence du
 * parrain en sessionStorage pour qu'elle remonte au submit.
 */

import { useEffect, useState, useCallback } from "react";
import { useParams, useSearchParams } from "next/navigation";
import {
  Heart,
  AlertTriangle,
  Loader2,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import Link from "next/link";

export default function ParrainagePage() {
  const params = useParams<{ reference: string }>();
  const search = useSearchParams();
  const token = search.get("t") ?? "";
  const [status, setStatus] = useState<"loading" | "ok" | "invalid">("loading");
  const [referrerName, setReferrerName] = useState<string | null>(null);

  const checkAndRegister = useCallback(async () => {
    try {
      const res = await fetch(
        `/api/referral/${params.reference}?t=${token}`,
        { cache: "no-store" },
      );
      if (!res.ok) {
        setStatus("invalid");
        return;
      }
      const data = await res.json();
      setReferrerName(data.referrerName ?? null);
      setStatus("ok");
      // Persiste pour /devis submit
      try {
        const raw = window.sessionStorage.getItem("ca-lead-source");
        const source = raw ? JSON.parse(raw) : {};
        window.sessionStorage.setItem(
          "ca-lead-source",
          JSON.stringify({
            ...source,
            referralToken: params.reference,
            utmSource: source.utmSource ?? "parrainage",
            utmCampaign: source.utmCampaign ?? `ref:${params.reference}`,
            capturedAt: new Date().toISOString(),
          }),
        );
      } catch {}
    } catch {
      setStatus("invalid");
    }
  }, [params.reference, token]);

  useEffect(() => {
    checkAndRegister();
  }, [checkAndRegister]);

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-creme grid place-items-center">
        <Loader2 className="h-6 w-6 animate-spin text-bleu" />
      </div>
    );
  }

  if (status === "invalid") {
    return (
      <div className="min-h-screen bg-creme grid place-items-center px-4">
        <div className="max-w-md text-center">
          <AlertTriangle className="h-12 w-12 mx-auto text-terracotta mb-3" />
          <h1 className="font-display text-2xl text-anthra mb-2">
            Lien invalide
          </h1>
          <p className="text-taupe mb-4">
            Le lien de parrainage est incorrect ou a expiré.
          </p>
          <Link
            href="/devis"
            className="inline-flex items-center gap-2 rounded-full bg-navy text-creme px-5 py-2.5 text-sm hover:bg-bleu transition-colors"
          >
            Demander un devis sans parrainage
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-creme py-12 lg:py-20 px-4">
      <div className="container max-w-2xl">
        <div className="rounded-3xl border border-pierre bg-white shadow-soft p-8 lg:p-12 text-center">
          <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-bleu/10 mb-4">
            <Heart className="h-7 w-7 text-bleu" />
          </div>
          <div className="font-mono text-[10px] uppercase tracking-eyebrow text-bleu mb-2">
            Vous êtes recommandé
          </div>
          <h1 className="font-display text-3xl lg:text-4xl text-anthra mb-3">
            {referrerName ? (
              <>
                {referrerName} vous a recommandé
                <br />
                <span className="text-bleu">Chauffage Artisanal</span>
              </>
            ) : (
              <>
                Bienvenue chez{" "}
                <span className="text-bleu">Chauffage Artisanal</span>
              </>
            )}
          </h1>
          <p className="text-taupe mb-8 max-w-lg mx-auto">
            Profitez d&apos;un devis personnalisé pour votre projet de
            chauffage, climatisation, pompe à chaleur ou énergies renouvelables.
            Réponse sous 24 h ouvrées.
          </p>

          <Link
            href="/devis"
            className="inline-flex items-center gap-2 rounded-full bg-navy text-creme px-6 py-3 text-base font-medium hover:bg-bleu transition-colors"
          >
            <Sparkles className="h-4 w-4" />
            Demander mon devis
            <ArrowRight className="h-4 w-4" />
          </Link>
          <p className="mt-4 text-xs text-muted">
            Votre demande sera identifiée comme issue de cette recommandation.
          </p>
        </div>
      </div>
    </div>
  );
}
