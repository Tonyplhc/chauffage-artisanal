"use client";

/**
 * Badge inline pour la fiche lead : affiche les doublons potentiels détectés.
 *
 * Pas de bouton "fusionner" — c'est trop sensible côté données. On affiche
 * juste un lien vers les autres dossiers + une option "ignorer" cette
 * détection pour chaque match.
 */

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  Copy,
  Loader2,
  ArrowRight,
  AtSign,
  Phone,
  X as XIcon,
} from "lucide-react";

type Match = {
  reason: "email" | "phone" | "both";
  normalizedEmail?: string;
  normalizedPhone?: string;
  lead: {
    reference: string;
    fullName: string;
    commune: string;
    status: string;
    submittedAt: string;
    services: string[];
    level?: "hot" | "warm" | "cold";
  };
};

export function DuplicateBadge({ reference }: { reference: string }) {
  const [matches, setMatches] = useState<Match[] | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const res = await fetch(`/api/admin/leads/${reference}/duplicates`, {
      cache: "no-store",
    });
    if (res.ok) {
      const data = await res.json();
      setMatches(data.matches ?? []);
    }
  }, [reference]);

  useEffect(() => {
    load();
  }, [load]);

  const dismiss = async (otherRef: string, reason: string) => {
    setBusy(true);
    try {
      await fetch(`/api/admin/leads/${reference}/duplicates`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ otherRef, reason }),
      });
      await load();
    } finally {
      setBusy(false);
    }
  };

  // Pas de doublons → on n'affiche rien (silent quand tout est propre)
  if (matches === null || matches.length === 0) return null;

  return (
    <div className="p-5 rounded-2xl border border-copper/30 bg-copper/5">
      <div className="flex items-center gap-2 mb-3">
        <Copy className="h-4 w-4 text-copper" />
        <span className="font-mono text-[10px] uppercase tracking-eyebrow text-copper">
          Doublon{matches.length > 1 ? "s" : ""} potentiel
          {matches.length > 1 ? "s" : ""} ({matches.length})
        </span>
        {busy && <Loader2 className="ml-auto h-3 w-3 animate-spin text-copper" />}
      </div>
      <p className="text-xs text-graphite mb-3">
        Ce lead partage un email ou un téléphone avec d&apos;autres dossiers.
        Vérifiez avant relance.
      </p>
      <ul className="grid gap-2">
        {matches.map((m) => (
          <li
            key={m.lead.reference}
            className="rounded-xl bg-white border border-ink/8 p-3"
          >
            <div className="flex items-start gap-2">
              <div className="min-w-0 flex-1">
                <Link
                  href={`/admin/leads/${m.lead.reference}`}
                  className="text-sm font-medium text-ink hover:text-copper truncate block"
                >
                  {m.lead.fullName}
                </Link>
                <div className="font-mono text-[10px] text-muted mt-0.5">
                  {m.lead.reference} · {m.lead.commune} ·{" "}
                  {new Date(m.lead.submittedAt).toLocaleDateString("fr-FR")}
                </div>
                <div className="mt-1 flex items-center gap-1 text-[10px] font-mono">
                  {(m.reason === "email" || m.reason === "both") && (
                    <span className="inline-flex items-center gap-0.5 text-copper">
                      <AtSign className="h-2.5 w-2.5" />
                      même email
                    </span>
                  )}
                  {(m.reason === "phone" || m.reason === "both") && (
                    <span className="inline-flex items-center gap-0.5 text-copper">
                      <Phone className="h-2.5 w-2.5" />
                      même téléphone
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={() => dismiss(m.lead.reference, m.reason)}
                  disabled={busy}
                  className="h-6 w-6 grid place-items-center rounded-full bg-cream border border-ink/10 text-muted hover:text-ember hover:border-ember/40 disabled:opacity-40"
                  title="Ce n'est pas un doublon — ignorer"
                >
                  <XIcon className="h-3 w-3" />
                </button>
                <Link
                  href={`/admin/leads/${m.lead.reference}`}
                  className="h-6 w-6 grid place-items-center rounded-full bg-ink text-cream hover:bg-copper"
                  title="Ouvrir ce lead"
                >
                  <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
