"use client";

/**
 * Bouton "Démarrer une intervention" sur la fiche lead.
 *
 * Permet à un opérateur de créer en 1 clic un compte-rendu d'intervention
 * (sans avoir à passer par un contrat d'entretien). Choix du type :
 * entretien / dépannage / pose / diagnostic.
 *
 * Création → POST /api/admin/visits puis redirection sur l'éditeur.
 */

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Wrench, Loader2, Plus, Stethoscope, AlertTriangle, Hammer } from "lucide-react";

type VisitType = "entretien" | "depannage" | "pose" | "diagnostic";

const TYPE_OPTIONS: {
  key: VisitType;
  label: string;
  icon: typeof Wrench;
  color: string;
  desc: string;
}[] = [
  {
    key: "depannage",
    label: "Dépannage",
    icon: AlertTriangle,
    color: "#dc5a28",
    desc: "Panne, fuite, urgence",
  },
  {
    key: "entretien",
    label: "Entretien",
    icon: Wrench,
    color: "#b86a36",
    desc: "Visite programmée, contrôle",
  },
  {
    key: "pose",
    label: "Pose / Installation",
    icon: Hammer,
    color: "#6ba3c5",
    desc: "Installation neuve, remplacement",
  },
  {
    key: "diagnostic",
    label: "Diagnostic",
    icon: Stethoscope,
    color: "#8b847a",
    desc: "Étude, chiffrage, expertise",
  },
];

export function LeadStartInterventionBlock({
  reference,
}: {
  reference: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const start = async (type: VisitType) => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/visits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          leadReference: reference,
          type,
          visitedAt: new Date().toISOString(),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Erreur");
      router.push(`/admin/visits/${data.visit.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
      setBusy(false);
    }
  };

  return (
    <div className="rounded-2xl border border-ink/10 bg-white shadow-soft p-4">
      <div className="flex items-center gap-3 mb-3">
        <span className="inline-grid place-items-center h-8 w-8 rounded-full bg-copper/10 text-copper shrink-0">
          <Wrench className="h-4 w-4" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="text-sm text-ink font-medium">
            Démarrer une intervention
          </div>
          <div className="text-[11px] text-muted">
            Compte-rendu terrain · checklist · signature client
          </div>
        </div>
        {!open && (
          <button
            onClick={() => setOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-full bg-ink text-cream px-3 py-1.5 text-xs font-medium hover:bg-copper transition-colors shrink-0"
          >
            <Plus className="h-3 w-3" />
            Nouvelle
          </button>
        )}
      </div>

      {open && (
        <div className="grid grid-cols-2 gap-2 mt-2">
          {TYPE_OPTIONS.map((opt) => (
            <button
              key={opt.key}
              onClick={() => start(opt.key)}
              disabled={busy}
              className="text-left p-3 rounded-xl border border-ink/10 bg-cream/30 hover:border-copper/40 hover:bg-cream transition-colors disabled:opacity-40"
              title={opt.desc}
            >
              <div className="flex items-center gap-2 mb-1">
                <span
                  className="grid place-items-center h-6 w-6 rounded-full shrink-0"
                  style={{ background: `${opt.color}18`, color: opt.color }}
                >
                  {busy ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <opt.icon className="h-3 w-3" />
                  )}
                </span>
                <span className="text-sm text-ink font-medium">
                  {opt.label}
                </span>
              </div>
              <div className="text-[10px] text-muted leading-tight">
                {opt.desc}
              </div>
            </button>
          ))}
        </div>
      )}

      {open && !busy && (
        <button
          onClick={() => setOpen(false)}
          className="mt-2 text-[10px] font-mono uppercase tracking-eyebrow text-muted hover:text-ink"
        >
          Annuler
        </button>
      )}

      {error && (
        <div className="mt-2 text-[11px] text-ember bg-ember/8 border border-ember/30 rounded-lg px-2 py-1.5">
          {error}
        </div>
      )}
    </div>
  );
}
