"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Download,
  Trash2,
  Loader2,
  AlertTriangle,
  X as XIcon,
  Package,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export function RgpdActions({ reference }: { reference: string }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState<"export" | "full" | "delete" | null>(null);
  const [error, setError] = useState<string | null>(null);

  const exportData = () => {
    setBusy("export");
    window.location.href = `/api/admin/leads/${reference}/rgpd/export`;
    setTimeout(() => setBusy(null), 1500);
  };

  const fullExport = () => {
    setBusy("full");
    window.location.href = `/api/admin/leads/${reference}/rgpd/full-export`;
    setTimeout(() => setBusy(null), 1500);
  };

  const performDelete = async () => {
    setBusy("delete");
    setError(null);
    try {
      const res = await fetch(`/api/admin/leads/${reference}/rgpd/delete`, {
        method: "DELETE",
        headers: { "X-Confirm-Reference": reference },
      });
      if (res.ok) {
        router.replace("/admin/leads");
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Erreur de suppression");
      }
    } catch {
      setError("Erreur réseau");
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="p-6 lg:p-8 rounded-3xl border border-ember/30 bg-ember/5">
      <div className="flex items-center gap-2 mb-4">
        <AlertTriangle className="h-5 w-5 text-ember" />
        <h2 className="font-display text-xl text-ink">RGPD</h2>
      </div>
      <p className="text-sm text-graphite leading-relaxed">
        Droit d&apos;accès et droit à l&apos;oubli — actions à effectuer
        uniquement sur demande explicite du client, traçables dans l&apos;activity
        log.
      </p>

      <div className="mt-5 flex flex-col sm:flex-row flex-wrap gap-2">
        <button
          onClick={exportData}
          disabled={busy === "export"}
          className="inline-flex items-center justify-center gap-2 rounded-full bg-white border border-ink/15 px-4 py-2.5 text-sm text-ink hover:border-copper/40 hover:text-copper transition-colors"
        >
          {busy === "export" ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Download className="h-4 w-4" />
          )}
          Export basique (JSON)
        </button>
        <button
          onClick={fullExport}
          disabled={busy === "full"}
          className="inline-flex items-center justify-center gap-2 rounded-full bg-ink text-cream border border-ink px-4 py-2.5 text-sm hover:bg-copper hover:border-copper transition-colors"
          title="Bundle complet : lead, devis, documents, chat, activity log, email tracking"
        >
          {busy === "full" ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Package className="h-4 w-4" />
          )}
          Export RGPD complet
        </button>
        <button
          onClick={() => setConfirming(true)}
          className="inline-flex items-center justify-center gap-2 rounded-full bg-white border border-ember/40 text-ember px-4 py-2.5 text-sm hover:bg-ember/10 transition-colors"
        >
          <Trash2 className="h-4 w-4" />
          Supprimer définitivement
        </button>
      </div>
      <p className="mt-3 text-[11px] text-muted leading-relaxed">
        Export basique = lead + documents + devis. Export complet = bundle
        exhaustif incluant chat, activity log et événements email tracking pour
        une preuve d&apos;exécution du droit d&apos;accès RGPD article 15.
      </p>

      {error && (
        <div className="mt-4 p-3 rounded-xl border border-ember/40 bg-white text-sm text-ember">
          {error}
        </div>
      )}

      <AnimatePresence>
        {confirming && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[80] bg-charcoal/50 backdrop-blur-sm grid place-items-center p-4"
            onClick={(e) => {
              if (e.target === e.currentTarget) setConfirming(false);
            }}
          >
            <motion.div
              initial={{ y: 16, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 16, opacity: 0 }}
              className="bg-white rounded-3xl border border-ember/40 shadow-lift max-w-md w-full overflow-hidden"
            >
              <div className="bg-ember text-cream px-6 py-5 flex items-start justify-between gap-3">
                <div>
                  <div className="font-mono text-[10px] uppercase tracking-eyebrow opacity-90">
                    Action irréversible
                  </div>
                  <div className="mt-1.5 font-display text-xl">
                    Confirmer la suppression
                  </div>
                </div>
                <button
                  onClick={() => setConfirming(false)}
                  className="h-8 w-8 grid place-items-center rounded-full bg-cream/15 hover:bg-cream/25 transition-colors"
                >
                  <XIcon className="h-4 w-4" />
                </button>
              </div>
              <div className="px-6 py-5">
                <p className="text-sm text-graphite leading-relaxed">
                  Cette action supprime <strong className="text-ink">définitivement</strong>{" "}
                  le dossier <strong className="text-ink">{reference}</strong> et
                  toutes ses données associées : photos, documents, devis officiel,
                  historique de transitions, notes.
                </p>
                <p className="mt-3 text-sm text-graphite leading-relaxed">
                  Vous ne pourrez pas récupérer ces données après suppression.
                </p>
                <div className="mt-5 flex items-center justify-between gap-3">
                  <button
                    onClick={() => setConfirming(false)}
                    className="text-sm text-graphite hover:text-ink"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={performDelete}
                    disabled={busy === "delete"}
                    className="inline-flex items-center gap-2 rounded-full bg-ember text-cream px-5 py-2.5 text-sm font-medium hover:bg-ember/85 transition-colors"
                  >
                    {busy === "delete" ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                    Supprimer définitivement
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
