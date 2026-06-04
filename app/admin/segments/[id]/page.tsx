"use client";

/**
 * Page détail d'un segment.
 *
 * Liste des membres + actions :
 *   - Voir dans la pipeline (pré-remplit search)
 *   - Export CSV des membres
 *   - Bulk actions (status / envoi template) via /api/admin/leads/bulk existant
 */

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import {
  ArrowLeft,
  Loader2,
  Layers,
  ArrowRight,
  Download,
  ListFilter,
} from "lucide-react";

type Member = {
  reference: string;
  fullName: string;
  email: string;
  commune: string;
  services: string[];
  status: string;
  level?: "hot" | "warm" | "cold";
  score?: number;
  submittedAt: string;
};

type Segment = {
  id: string;
  name: string;
  description?: string;
  query: string;
  isShared: boolean;
};

const STATUS_LABELS: Record<string, string> = {
  nouveau: "Nouveau",
  contacte: "Contacté",
  devis_envoye: "Devis envoyé",
  converti: "Converti",
  perdu: "Perdu",
};

export default function SegmentDetailPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const [segment, setSegment] = useState<Segment | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [count, setCount] = useState(0);
  const [loaded, setLoaded] = useState(false);

  const load = useCallback(async () => {
    const res = await fetch(`/api/admin/segments/${params.id}`, {
      cache: "no-store",
    });
    if (res.status === 401) {
      router.replace("/admin/login");
      return;
    }
    if (res.ok) {
      const d = await res.json();
      setSegment(d.segment);
      setMembers(d.members ?? []);
      setCount(d.count ?? 0);
    }
    setLoaded(true);
  }, [params.id, router]);

  useEffect(() => {
    load();
    const i = setInterval(load, 30_000);
    return () => clearInterval(i);
  }, [load]);

  const exportCsv = () => {
    const rows = [
      ["Référence", "Nom", "Email", "Commune", "Statut", "Level", "Score", "Services"],
      ...members.map((m) => [
        m.reference,
        m.fullName,
        m.email,
        m.commune,
        STATUS_LABELS[m.status] ?? m.status,
        m.level ?? "",
        m.score?.toString() ?? "",
        m.services.join("·"),
      ]),
    ];
    const csv = rows
      .map((r) =>
        r
          .map((c) =>
            /[",;\n]/.test(c) ? `"${c.replace(/"/g, '""')}"` : c,
          )
          .join(";"),
      )
      .join("\n");
    const blob = new Blob([`﻿${csv}`], {
      type: "text/csv;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `segment-${segment?.name?.replace(/\s+/g, "-").toLowerCase()}-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-cream py-10 lg:py-14">
      <div className="container max-w-6xl">
        <Link
          href="/admin/segments"
          className="inline-flex items-center gap-2 text-sm font-mono uppercase tracking-eyebrow text-graphite hover:text-copper transition-colors mb-6"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Retour aux segments
        </Link>

        {!loaded ? (
          <div className="py-16 text-center text-muted">
            <Loader2 className="h-6 w-6 animate-spin mx-auto" />
          </div>
        ) : !segment ? (
          <div className="rounded-2xl border border-ember/40 bg-ember/5 p-6 text-ember">
            Segment introuvable.
          </div>
        ) : (
          <>
            <div className="flex items-start justify-between gap-4 flex-wrap mb-8">
              <div className="flex items-center gap-3">
                <div
                  className="h-12 w-12 rounded-full grid place-items-center"
                  style={{
                    background: "rgba(184,106,54,0.12)",
                    color: "#b86a36",
                  }}
                >
                  <Layers className="h-5 w-5" />
                </div>
                <div>
                  <h1 className="font-display text-display-md text-ink">
                    {segment.name}
                  </h1>
                  {segment.description && (
                    <p className="mt-1 text-graphite text-sm">
                      {segment.description}
                    </p>
                  )}
                  <p className="mt-1 font-mono text-xs text-copper">
                    {segment.query}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <Link
                  href={`/admin/leads?seg=${encodeURIComponent(segment.query)}`}
                  className="inline-flex items-center gap-2 rounded-full border border-ink/15 bg-white px-4 py-2 text-sm hover:border-copper/40 transition-colors"
                >
                  <ListFilter className="h-3.5 w-3.5" />
                  Voir dans le pipeline
                </Link>
                <button
                  onClick={exportCsv}
                  disabled={members.length === 0}
                  className="inline-flex items-center gap-2 rounded-full bg-ink text-cream px-4 py-2 text-sm hover:bg-copper transition-colors disabled:opacity-40"
                >
                  <Download className="h-3.5 w-3.5" />
                  Export CSV
                </button>
              </div>
            </div>

            <div className="rounded-2xl border border-ink/10 bg-white shadow-soft overflow-hidden">
              <div className="px-5 py-3 border-b border-ink/8 bg-cream/40 flex items-center gap-2">
                <span className="font-mono text-[10px] uppercase tracking-eyebrow text-copper">
                  Membres
                </span>
                <span className="ml-auto font-mono text-xs text-muted">
                  {count} lead{count > 1 ? "s" : ""}
                </span>
              </div>
              {members.length === 0 ? (
                <div className="py-12 text-center text-muted text-sm">
                  Aucun lead ne correspond actuellement à ce segment.
                </div>
              ) : (
                <ul className="divide-y divide-ink/8">
                  {members.map((m) => (
                    <li key={m.reference}>
                      <Link
                        href={`/admin/leads/${m.reference}`}
                        className="flex items-center gap-3 px-5 py-3 hover:bg-cream/40 transition-colors group"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-medium text-ink truncate">
                            {m.fullName}
                          </div>
                          <div className="font-mono text-[11px] text-muted truncate">
                            {m.reference} · {m.commune} ·{" "}
                            {m.services.join(" · ")}
                          </div>
                        </div>
                        <span className="text-[10px] font-mono uppercase tracking-eyebrow text-graphite bg-cream border border-ink/8 px-2 py-0.5 rounded-full">
                          {STATUS_LABELS[m.status] ?? m.status}
                        </span>
                        {m.level && (
                          <span className="font-mono text-[10px] text-muted">
                            {m.level}
                          </span>
                        )}
                        <ArrowRight className="h-3.5 w-3.5 text-muted opacity-0 group-hover:opacity-100 transition-opacity" />
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
