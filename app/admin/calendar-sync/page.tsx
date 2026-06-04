"use client";

/**
 * Page de configuration de l'abonnement calendrier (Google/Apple/Outlook).
 *
 * Présente deux URLs :
 *   - Globale : tous les événements admin
 *   - Personnelle : filtrée sur ses RDV assignés
 *
 * Instructions pas-à-pas pour chaque plateforme.
 */

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Loader2,
  Copy,
  Check,
  Calendar,
  ExternalLink,
  AlertTriangle,
} from "lucide-react";
import { cn } from "@/lib/utils";

type Data = {
  globalUrl: string;
  personalUrl?: string;
  email?: string;
};

export default function CalendarSyncPage() {
  const router = useRouter();
  const [data, setData] = useState<Data | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const load = useCallback(async () => {
    const res = await fetch("/api/admin/calendar-sync", { cache: "no-store" });
    if (res.status === 401) {
      router.replace("/admin/login");
      return;
    }
    if (res.ok) {
      const d = await res.json();
      setData(d);
    }
  }, [router]);

  useEffect(() => {
    load();
  }, [load]);

  const copy = async (id: string, value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 1500);
    } catch {}
  };

  return (
    <div className="min-h-screen bg-cream py-10 lg:py-14">
      <div className="container max-w-4xl">
        <Link
          href="/admin/leads"
          className="inline-flex items-center gap-2 text-sm font-mono uppercase tracking-eyebrow text-graphite hover:text-copper transition-colors mb-6"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Retour pipeline
        </Link>

        <div className="mb-8">
          <h1 className="font-display text-display-md text-ink">
            Sync calendrier
          </h1>
          <p className="mt-2 text-graphite">
            Abonnez votre Google Calendar / Apple / Outlook pour voir tous vos
            RDV, urgents, relances et rappels dans votre agenda habituel.
            Mise à jour automatique côté client (lecture seule).
          </p>
        </div>

        {!data ? (
          <div className="py-16 text-center text-muted">
            <Loader2 className="h-6 w-6 animate-spin mx-auto" />
          </div>
        ) : (
          <>
            <div className="grid gap-4 mb-8">
              <FeedCard
                id="global"
                label="Feed global"
                description="Tous les événements pipeline — utile si vous gérez l'équipe complète"
                url={data.globalUrl}
                onCopy={copy}
                isCopied={copiedId === "global"}
              />
              {data.personalUrl && (
                <FeedCard
                  id="personal"
                  label={`Mon feed personnel · ${data.email}`}
                  description="Uniquement vos leads assignés (RDV, rappels, relances)"
                  url={data.personalUrl}
                  onCopy={copy}
                  isCopied={copiedId === "personal"}
                  highlight
                />
              )}
            </div>

            {/* Instructions par plateforme */}
            <div className="rounded-2xl border border-ink/10 bg-white shadow-soft p-6">
              <div className="font-mono text-[10px] uppercase tracking-eyebrow text-copper mb-3">
                Comment s&apos;abonner
              </div>
              <div className="grid gap-5">
                <Platform
                  title="Google Calendar"
                  steps={[
                    "Ouvrir Google Calendar sur ordinateur",
                    "Dans la barre latérale gauche : « Autres agendas » → « + » → « À partir de l'URL »",
                    "Coller l'URL ci-dessus → Ajouter",
                    "L'agenda apparaît avec rafraîchissement automatique (~24 h)",
                  ]}
                />
                <Platform
                  title="Apple Calendar (macOS / iOS)"
                  steps={[
                    "macOS : Fichier → Nouvel abonnement → coller l'URL",
                    "iOS : Réglages → Calendrier → Comptes → Ajouter → Autre → Ajouter un calendrier avec abonnement",
                    "Choisir la fréquence de mise à jour (5 min recommandé)",
                  ]}
                />
                <Platform
                  title="Outlook (web ou desktop)"
                  steps={[
                    "Outlook web : Calendrier → « Ajouter un calendrier » → « S'abonner à partir du Web »",
                    "Coller l'URL → nommer le calendrier → Importer",
                    "Outlook desktop : Fichier → Ouvrir → calendriers Internet",
                  ]}
                />
              </div>
            </div>

            <div className="mt-6 p-4 rounded-2xl border border-copper/30 bg-copper/5">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-copper shrink-0 mt-0.5" />
                <div className="text-xs text-ink leading-relaxed">
                  <strong>Sécurité du lien :</strong> l&apos;URL contient un
                  token unique signé HMAC. Ne la partagez qu&apos;avec votre
                  propre agenda. Pour révoquer un lien partagé par erreur, il
                  suffit de faire tourner la variable d&apos;environnement{" "}
                  <code className="bg-white px-1 rounded">SESSION_SECRET</code>{" "}
                  — tous les tokens deviennent invalides.
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function FeedCard({
  id,
  label,
  description,
  url,
  onCopy,
  isCopied,
  highlight,
}: {
  id: string;
  label: string;
  description: string;
  url: string;
  onCopy: (id: string, value: string) => void;
  isCopied: boolean;
  highlight?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border p-5",
        highlight
          ? "border-copper/40 bg-copper/5"
          : "border-ink/10 bg-white shadow-soft",
      )}
    >
      <div className="flex items-center gap-2 mb-1">
        <Calendar className="h-4 w-4 text-copper" />
        <span className="text-base font-medium text-ink">{label}</span>
      </div>
      <p className="text-xs text-graphite mb-3">{description}</p>
      <div className="flex items-stretch gap-2">
        <input
          readOnly
          value={url}
          onClick={(e) => e.currentTarget.select()}
          className="flex-1 bg-white border border-ink/12 rounded-xl px-3 py-2 text-xs font-mono focus:border-copper focus:outline-none truncate"
        />
        <button
          onClick={() => onCopy(id, url)}
          className="inline-flex items-center gap-1.5 rounded-xl bg-ink text-cream px-3 py-2 text-xs hover:bg-copper transition-colors"
        >
          {isCopied ? (
            <>
              <Check className="h-3 w-3" />
              Copié
            </>
          ) : (
            <>
              <Copy className="h-3 w-3" />
              Copier
            </>
          )}
        </button>
        <a
          href={url}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1.5 rounded-xl bg-white border border-ink/15 px-3 py-2 text-xs hover:border-copper/40 transition-colors"
        >
          <ExternalLink className="h-3 w-3" />
          Tester
        </a>
      </div>
    </div>
  );
}

function Platform({ title, steps }: { title: string; steps: string[] }) {
  return (
    <div>
      <div className="text-sm font-medium text-ink mb-2">{title}</div>
      <ol className="grid gap-1.5">
        {steps.map((s, i) => (
          <li key={i} className="flex items-start gap-2 text-xs text-graphite">
            <span className="h-4 w-4 rounded-full bg-copper/10 text-copper grid place-items-center text-[10px] font-mono shrink-0 mt-0.5">
              {i + 1}
            </span>
            <span className="leading-relaxed">{s}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}
