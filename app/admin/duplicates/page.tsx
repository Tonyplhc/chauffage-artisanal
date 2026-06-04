"use client";

/**
 * Page de revue des doublons détectés dans la base.
 *
 * Groupes par email ou téléphone partagé. Boutons :
 *   - Ouvrir le lead
 *   - Ignorer la paire (dismiss = ce n'est pas un doublon)
 *
 * La fusion automatique n'est pas implémentée (trop sensible) — c'est à
 * l'admin de décider quel lead garder et quoi y reporter.
 */

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Copy,
  Loader2,
  CheckCircle2,
  AtSign,
  Phone,
  ArrowRight,
  X as XIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

type LeadSummary = {
  reference: string;
  fullName: string;
  email: string;
  phone: string;
  commune: string;
  services: string[];
  status: string;
  submittedAt: string;
  level?: "hot" | "warm" | "cold";
  score?: number;
};

type Group = {
  key: string;
  reason: "email" | "phone";
  value: string;
  leads: LeadSummary[];
};

const STATUS_LABELS: Record<string, string> = {
  nouveau: "Nouveau",
  contacte: "Contacté",
  devis_envoye: "Devis envoyé",
  converti: "Converti",
  perdu: "Perdu",
};

const STATUS_COLORS: Record<string, string> = {
  nouveau: "#b86a36",
  contacte: "#6ba3c5",
  devis_envoye: "#94532a",
  converti: "#22a06b",
  perdu: "#8b847a",
};

export default function DuplicatesPage() {
  const router = useRouter();
  const [groups, setGroups] = useState<Group[] | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const res = await fetch("/api/admin/duplicates", { cache: "no-store" });
    if (res.status === 401) {
      router.replace("/admin/login");
      return;
    }
    if (res.ok) {
      const data = await res.json();
      setGroups(data.groups ?? []);
    }
  }, [router]);

  useEffect(() => {
    load();
  }, [load]);

  const dismiss = async (refA: string, refB: string, reason: string) => {
    if (!confirm(`Marquer ${refA} ↔ ${refB} comme non-doublons ?`)) return;
    setBusy(true);
    try {
      await fetch(`/api/admin/leads/${refA}/duplicates`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ otherRef: refB, reason }),
      });
      await load();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-cream py-10 lg:py-14">
      <div className="container max-w-5xl">
        <Link
          href="/admin/leads"
          className="inline-flex items-center gap-2 text-sm font-mono uppercase tracking-eyebrow text-graphite hover:text-copper transition-colors mb-6"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Retour pipeline
        </Link>

        <div className="mb-8">
          <h1 className="font-display text-display-md text-ink">
            Doublons détectés
          </h1>
          <p className="mt-2 text-graphite">
            Leads partageant un email ou un téléphone normalisé. Pas de fusion
            automatique — décidez quel dossier garder et reportez l&apos;info.
          </p>
        </div>

        {groups === null ? (
          <div className="py-16 text-center text-muted">
            <Loader2 className="h-6 w-6 animate-spin mx-auto" />
          </div>
        ) : groups.length === 0 ? (
          <div className="rounded-2xl border border-ink/10 bg-white shadow-soft py-16 text-center">
            <CheckCircle2 className="h-12 w-12 mx-auto text-[#22a06b] opacity-60 mb-2" />
            <p className="text-ink font-medium">Aucun doublon détecté.</p>
            <p className="text-xs text-muted mt-1">
              La base est propre — pas d&apos;email ou téléphone partagé.
            </p>
          </div>
        ) : (
          <div className="grid gap-4">
            {groups.map((g) => (
              <div
                key={g.key}
                className="rounded-2xl border border-ink/10 bg-white shadow-soft overflow-hidden"
              >
                <div className="px-5 py-3 border-b border-ink/8 bg-cream/40 flex items-center gap-2 flex-wrap">
                  {g.reason === "email" ? (
                    <AtSign className="h-4 w-4 text-copper" />
                  ) : (
                    <Phone className="h-4 w-4 text-copper" />
                  )}
                  <span className="font-mono text-[10px] uppercase tracking-eyebrow text-copper">
                    {g.reason === "email"
                      ? "Email partagé"
                      : "Téléphone partagé"}
                  </span>
                  <span className="font-mono text-sm text-ink">{g.value}</span>
                  <span className="ml-auto font-mono text-xs text-muted">
                    {g.leads.length} leads
                  </span>
                </div>
                <ul className="divide-y divide-ink/8">
                  {g.leads.map((l, i) => (
                    <li
                      key={l.reference}
                      className="px-5 py-3 grid lg:grid-cols-12 gap-3 items-center"
                    >
                      <div className="lg:col-span-5 min-w-0">
                        <Link
                          href={`/admin/leads/${l.reference}`}
                          className="text-sm font-medium text-ink hover:text-copper truncate block"
                        >
                          {l.fullName}
                        </Link>
                        <div className="text-xs text-muted mt-0.5 font-mono">
                          {l.reference} · {l.commune}
                        </div>
                        <div className="text-[11px] text-graphite mt-0.5 truncate">
                          {l.services.join(" · ")}
                        </div>
                      </div>
                      <div className="lg:col-span-3 flex items-center gap-2">
                        <span
                          className="px-2 py-0.5 rounded-full text-[10px] font-mono uppercase tracking-eyebrow"
                          style={{
                            background: `${STATUS_COLORS[l.status]}1c`,
                            color: STATUS_COLORS[l.status],
                          }}
                        >
                          {STATUS_LABELS[l.status] ?? l.status}
                        </span>
                        {l.level && (
                          <span className="text-[10px] font-mono text-muted">
                            {l.level}
                            {l.score !== undefined && (
                              <span className="ml-0.5">· {l.score}</span>
                            )}
                          </span>
                        )}
                      </div>
                      <div className="lg:col-span-2 text-xs text-muted">
                        {new Date(l.submittedAt).toLocaleDateString("fr-FR", {
                          dateStyle: "medium",
                        })}
                      </div>
                      <div className="lg:col-span-2 flex items-center gap-1 lg:justify-end">
                        {i < g.leads.length - 1 && (
                          <button
                            onClick={() =>
                              dismiss(
                                l.reference,
                                g.leads[i + 1].reference,
                                g.reason,
                              )
                            }
                            disabled={busy}
                            className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-cream border border-ink/10 text-graphite text-[10px] hover:border-ember/30 hover:text-ember disabled:opacity-40"
                            title="Ignorer cette paire (faux positif)"
                          >
                            <XIcon className="h-2.5 w-2.5" />
                            Ignorer suivant
                          </button>
                        )}
                        <Link
                          href={`/admin/leads/${l.reference}`}
                          className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-ink text-cream text-[10px] hover:bg-copper"
                        >
                          Ouvrir
                          <ArrowRight className="h-2.5 w-2.5" />
                        </Link>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
        {/* Suppress unused icon warning */}
        <span className="hidden">
          <Copy className="h-3 w-3" />
        </span>
      </div>
    </div>
  );
}
