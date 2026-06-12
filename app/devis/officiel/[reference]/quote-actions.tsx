"use client";

/**
 * Bloc d'action sur la page publique du devis : accepter / refuser.
 * Discipline UX : décision binaire claire, signature électronique simple.
 */

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle2,
  XCircle,
  PenLine,
  Loader2,
  AlertCircle,
} from "lucide-react";

type Props = {
  reference: string;
  token: string;
  initialStatus: "draft" | "sent" | "accepted" | "refused";
  signerNameHint?: string;
};

export function QuoteActions({
  reference,
  token,
  initialStatus,
  signerNameHint,
}: Props) {
  const [status, setStatus] = useState(initialStatus);
  const [mode, setMode] = useState<"idle" | "accepting" | "refusing">("idle");
  const [signerName, setSignerName] = useState(signerNameHint ?? "");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [refusalReason, setRefusalReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (decision: "accepted" | "refused") => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/quote-decision", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          decision === "accepted"
            ? {
                decision,
                reference,
                token,
                signerName,
                acceptedTerms,
              }
            : {
                decision,
                reference,
                token,
                refusalReason,
              },
        ),
      });
      if (res.ok) {
        setStatus(decision);
        setMode("idle");
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Erreur");
      }
    } catch {
      setError("Erreur réseau");
    } finally {
      setBusy(false);
    }
  };

  if (status === "accepted") {
    return (
      <div className="my-6 p-6 rounded-2xl border-2 border-[#2E7D5A]/40 bg-[#2E7D5A]/8">
        <div className="flex items-start gap-4">
          <CheckCircle2 className="h-7 w-7 text-[#2E7D5A] shrink-0" />
          <div>
            <div className="font-mono text-[10px] uppercase tracking-eyebrow text-[#2E7D5A]">
              Devis accepté
            </div>
            <h3 className="mt-2 font-display text-2xl text-anthra">
              Merci pour votre confiance.
            </h3>
            <p className="mt-2 text-sm text-taupe leading-relaxed">
              Notre équipe vous contacte sous 24 heures ouvrées pour planifier
              les prochaines étapes (visite de chantier, calendrier, signature
              papier si applicable).
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (status === "refused") {
    return (
      <div className="my-6 p-6 rounded-2xl border border-pierre bg-creme">
        <div className="flex items-start gap-4">
          <XCircle className="h-6 w-6 text-taupe shrink-0" />
          <div>
            <div className="font-mono text-[10px] uppercase tracking-eyebrow text-taupe">
              Devis non retenu
            </div>
            <p className="mt-2 text-sm text-taupe leading-relaxed">
              Votre réponse a été enregistrée. Nous restons à votre disposition
              si votre projet évolue.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="my-6 print:hidden">
      <AnimatePresence mode="wait">
        {mode === "idle" && (
          <motion.div
            key="idle"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="p-6 rounded-2xl border border-bleu/30 bg-bleu/5"
          >
            <div className="font-mono text-[10px] uppercase tracking-eyebrow text-bleu">
              Votre réponse
            </div>
            <h3 className="mt-2 font-display text-2xl text-anthra">
              Vous souhaitez donner suite à ce devis&nbsp;?
            </h3>
            <p className="mt-2 text-sm text-taupe leading-relaxed">
              Une réponse en ligne nous permet de réserver votre créneau
              chantier plus rapidement. Vous pouvez aussi nous contacter
              directement.
            </p>
            <div className="mt-5 flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => setMode("accepting")}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-navy text-creme px-5 py-3 text-sm font-medium hover:bg-bleu transition-colors"
              >
                <PenLine className="h-4 w-4" />
                Accepter ce devis
              </button>
              <button
                onClick={() => setMode("refusing")}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-white border border-pierre px-5 py-3 text-sm text-taupe hover:border-bleu/40 hover:text-bleu transition-colors"
              >
                Décliner
              </button>
            </div>
          </motion.div>
        )}

        {mode === "accepting" && (
          <motion.div
            key="accepting"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="p-6 rounded-2xl border border-[#2E7D5A]/40 bg-[#2E7D5A]/5"
          >
            <div className="font-mono text-[10px] uppercase tracking-eyebrow text-[#2E7D5A]">
              Signature électronique
            </div>
            <h3 className="mt-2 font-display text-2xl text-anthra">
              Accepter le devis
            </h3>
            <p className="mt-2 text-sm text-taupe">
              En signant ci-dessous, vous acceptez les lignes du devis et nos
              conditions générales. La signature papier reste possible et peut
              être réalisée avec notre équipe.
            </p>

            <div className="mt-5 grid gap-4">
              <div>
                <label className="font-mono text-[10px] uppercase tracking-eyebrow text-muted mb-2 block">
                  Votre nom complet
                </label>
                <input
                  type="text"
                  value={signerName}
                  onChange={(e) => setSignerName(e.target.value)}
                  placeholder="Prénom NOM"
                  className="w-full bg-white border border-pierre rounded-xl px-4 py-2.5 text-sm text-anthra focus:border-bleu focus:outline-none focus:ring-2 focus:ring-bleu/20"
                />
              </div>
              <label className="flex items-start gap-3 text-sm text-taupe leading-relaxed cursor-pointer">
                <input
                  type="checkbox"
                  checked={acceptedTerms}
                  onChange={(e) => setAcceptedTerms(e.target.checked)}
                  className="mt-1 h-4 w-4 accent-bleu"
                />
                <span>
                  J&apos;accepte les termes du devis n° {reference}. Cette
                  signature électronique vaut consentement explicite et a valeur
                  d&apos;accord de principe.
                </span>
              </label>
            </div>

            {error && (
              <div className="mt-4 p-3 rounded-xl border border-terracotta/40 bg-white text-sm text-terracotta flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" /> {error}
              </div>
            )}

            <div className="mt-5 flex items-center justify-between gap-3 flex-wrap">
              <button
                onClick={() => setMode("idle")}
                disabled={busy}
                className="text-sm text-taupe hover:text-anthra"
              >
                ← Retour
              </button>
              <button
                onClick={() => submit("accepted")}
                disabled={busy || signerName.trim().length < 2 || !acceptedTerms}
                className={`inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-medium transition-all ${
                  signerName.trim().length >= 2 && acceptedTerms && !busy
                    ? "bg-[#2E7D5A] text-white hover:bg-[#1d8b5e]"
                    : "bg-sable/60 text-anthra/40 cursor-not-allowed"
                }`}
              >
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                Signer & accepter
              </button>
            </div>
          </motion.div>
        )}

        {mode === "refusing" && (
          <motion.div
            key="refusing"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="p-6 rounded-2xl border border-pierre bg-creme"
          >
            <div className="font-mono text-[10px] uppercase tracking-eyebrow text-taupe">
              Décliner le devis
            </div>
            <h3 className="mt-2 font-display text-2xl text-anthra">
              Pourquoi décliner&nbsp;?
            </h3>
            <p className="mt-2 text-sm text-taupe">
              Quelques mots aident notre bureau d&apos;études à mieux ajuster
              les futurs devis. Champ facultatif.
            </p>

            <div className="mt-4">
              <textarea
                rows={4}
                value={refusalReason}
                onChange={(e) => setRefusalReason(e.target.value)}
                placeholder="Budget, délai, autre prestataire choisi…"
                className="w-full bg-white border border-pierre rounded-xl px-4 py-2.5 text-sm text-anthra focus:border-bleu focus:outline-none focus:ring-2 focus:ring-bleu/20 resize-none"
              />
            </div>

            {error && (
              <div className="mt-4 p-3 rounded-xl border border-terracotta/40 bg-white text-sm text-terracotta">
                {error}
              </div>
            )}

            <div className="mt-5 flex items-center justify-between gap-3 flex-wrap">
              <button
                onClick={() => setMode("idle")}
                disabled={busy}
                className="text-sm text-taupe hover:text-anthra"
              >
                ← Retour
              </button>
              <button
                onClick={() => submit("refused")}
                disabled={busy}
                className="inline-flex items-center gap-2 rounded-full bg-navy text-creme px-5 py-3 text-sm font-medium hover:bg-bleu transition-colors"
              >
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />}
                Envoyer ma réponse
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
