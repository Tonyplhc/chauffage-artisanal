"use client";

/**
 * Éditeur de rapport de chantier pour un lead.
 *
 * Upload photos avant/après, légendes, publication pour visibilité côté
 * espace client. Print CSS pour génération PDF.
 */

import { useEffect, useState, useCallback, useRef } from "react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import {
  ArrowLeft,
  Loader2,
  Camera,
  Trash2,
  Eye,
  EyeOff,
  Printer,
  Save,
  Check,
  X as XIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

type Photo = {
  id: string;
  kind: "before" | "in_progress" | "after" | "detail";
  caption?: string;
  dataUrl: string;
  uploadedAt: string;
};

type Report = {
  leadReference: string;
  title: string;
  summary?: string;
  photos: Photo[];
  technicianNames?: string[];
  publishedAt?: string;
  updatedAt: string;
};

const KIND_LABELS = {
  before: "Avant",
  in_progress: "En cours",
  after: "Après",
  detail: "Détail",
};

const KIND_COLORS = {
  before: "#8b847a",
  in_progress: "#b86a36",
  after: "#22a06b",
  detail: "#6ba3c5",
};

export default function ReportEditorPage() {
  const router = useRouter();
  const params = useParams<{ reference: string }>();
  const [report, setReport] = useState<Report | null>(null);
  const [uploadingKind, setUploadingKind] = useState<Photo["kind"] | null>(null);
  const [dirty, setDirty] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    const res = await fetch(`/api/admin/leads/${params.reference}/report`, {
      cache: "no-store",
    });
    if (res.status === 401) {
      router.replace("/admin/login");
      return;
    }
    if (res.ok) {
      const d = await res.json();
      setReport(d.report);
      setDirty(false);
    }
  }, [params.reference, router]);

  useEffect(() => {
    load();
  }, [load]);

  const saveMeta = async () => {
    if (!report) return;
    setBusy(true);
    setError(null);
    try {
      await fetch(`/api/admin/leads/${params.reference}/report`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: report.title,
          summary: report.summary,
          technicianNames: report.technicianNames,
          publishedAt: report.publishedAt,
        }),
      });
      setDirty(false);
    } finally {
      setBusy(false);
    }
  };

  const togglePublish = async () => {
    if (!report) return;
    const publishedAt = report.publishedAt ? null : new Date().toISOString();
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/leads/${params.reference}/report`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ publishedAt }),
      });
      if (res.ok) {
        const d = await res.json();
        setReport(d.report);
      }
    } finally {
      setBusy(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !uploadingKind) return;
    const reader = new FileReader();
    reader.onloadend = async () => {
      const dataUrl = reader.result as string;
      setBusy(true);
      setError(null);
      try {
        const res = await fetch(
          `/api/admin/leads/${params.reference}/report`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ kind: uploadingKind, dataUrl }),
          },
        );
        const d = await res.json();
        if (!res.ok) throw new Error(d.error ?? "Erreur");
        setReport(d.report);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erreur");
      } finally {
        setBusy(false);
        setUploadingKind(null);
        if (fileInput.current) fileInput.current.value = "";
      }
    };
    reader.readAsDataURL(file);
  };

  const removePhoto = async (id: string) => {
    if (!confirm("Supprimer cette photo ?")) return;
    await fetch(
      `/api/admin/leads/${params.reference}/report/${id}`,
      { method: "DELETE" },
    );
    await load();
  };

  const updateCaption = async (id: string, caption: string) => {
    await fetch(
      `/api/admin/leads/${params.reference}/report/${id}`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ caption }),
      },
    );
  };

  if (!report) {
    return (
      <div className="min-h-screen bg-cream grid place-items-center">
        <Loader2 className="h-6 w-6 animate-spin text-copper" />
      </div>
    );
  }

  const photosByKind: Record<Photo["kind"], Photo[]> = {
    before: [],
    in_progress: [],
    after: [],
    detail: [],
  };
  for (const p of report.photos) photosByKind[p.kind].push(p);

  return (
    <div className="min-h-screen bg-cream py-10 lg:py-14">
      <div className="container max-w-5xl">
        <div className="flex items-center justify-between gap-3 mb-6 print:hidden">
          <Link
            href={`/admin/leads/${params.reference}`}
            className="inline-flex items-center gap-2 text-sm font-mono uppercase tracking-eyebrow text-graphite hover:text-copper"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Retour au dossier
          </Link>
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={saveMeta}
              disabled={busy || !dirty}
              className="inline-flex items-center gap-1.5 rounded-full bg-ink text-cream px-4 py-2 text-sm hover:bg-copper disabled:opacity-40"
            >
              {busy ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : dirty ? (
                <Save className="h-3.5 w-3.5" />
              ) : (
                <Check className="h-3.5 w-3.5" />
              )}
              {dirty ? "Enregistrer" : "À jour"}
            </button>
            <button
              onClick={togglePublish}
              disabled={busy}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm",
                report.publishedAt
                  ? "bg-[#22a06b] text-cream hover:opacity-90"
                  : "bg-white border border-ink/15 hover:border-copper/40",
              )}
            >
              {report.publishedAt ? (
                <>
                  <Eye className="h-3.5 w-3.5" />
                  Visible client
                </>
              ) : (
                <>
                  <EyeOff className="h-3.5 w-3.5" />
                  Privé
                </>
              )}
            </button>
            <button
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 rounded-full bg-white border border-ink/15 px-4 py-2 text-sm hover:border-copper/40"
            >
              <Printer className="h-3.5 w-3.5" />
              Imprimer / PDF
            </button>
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-ink/10 shadow-soft p-8 lg:p-12 print:shadow-none print:border-0">
          <div className="font-mono text-[10px] uppercase tracking-eyebrow text-copper mb-2">
            Rapport de chantier · {params.reference}
          </div>
          <input
            value={report.title}
            onChange={(e) => {
              setReport({ ...report, title: e.target.value });
              setDirty(true);
            }}
            className="w-full font-display text-3xl text-ink bg-transparent focus:outline-none mb-4 print:pointer-events-none"
          />
          <textarea
            rows={3}
            value={report.summary ?? ""}
            onChange={(e) => {
              setReport({ ...report, summary: e.target.value });
              setDirty(true);
            }}
            placeholder="Résumé / contexte du chantier…"
            className="w-full bg-cream/40 border border-ink/8 rounded-xl p-3 text-sm focus:border-copper focus:outline-none resize-none mb-6 print:bg-transparent print:border-0 print:p-0 print:pointer-events-none"
          />

          {error && (
            <div className="mb-4 p-3 rounded-xl border border-ember/40 bg-ember/5 text-sm text-ember">
              {error}
            </div>
          )}

          {/* Sections par kind */}
          {(["before", "in_progress", "after", "detail"] as const).map(
            (kind) => {
              const photos = photosByKind[kind];
              return (
                <section
                  key={kind}
                  className="mb-8 pb-6 border-b border-ink/8 last:border-0"
                >
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="font-display text-xl text-ink">
                      <span
                        className="inline-block h-2 w-2 rounded-full mr-2"
                        style={{ background: KIND_COLORS[kind] }}
                      />
                      {KIND_LABELS[kind]}{" "}
                      <span className="text-sm text-muted font-mono">
                        ({photos.length})
                      </span>
                    </h2>
                    <button
                      onClick={() => {
                        setUploadingKind(kind);
                        fileInput.current?.click();
                      }}
                      className="inline-flex items-center gap-1.5 rounded-full bg-cream border border-ink/10 px-3 py-1 text-xs hover:border-copper/40 print:hidden"
                    >
                      <Camera className="h-3 w-3" />
                      Ajouter
                    </button>
                  </div>
                  {photos.length === 0 ? (
                    <div className="text-sm text-muted py-4 text-center print:hidden">
                      Aucune photo {KIND_LABELS[kind].toLowerCase()}.
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                      {photos.map((p) => (
                        <figure
                          key={p.id}
                          className="rounded-xl overflow-hidden bg-cream border border-ink/8 relative group"
                        >
                          <img
                            src={p.dataUrl}
                            alt={p.caption ?? ""}
                            className="w-full aspect-[4/3] object-cover"
                          />
                          <button
                            onClick={() => removePhoto(p.id)}
                            className="absolute top-2 right-2 h-7 w-7 grid place-items-center rounded-full bg-ember text-cream opacity-0 group-hover:opacity-100 transition-opacity print:hidden"
                          >
                            <XIcon className="h-3 w-3" />
                          </button>
                          <input
                            defaultValue={p.caption ?? ""}
                            onBlur={(e) => updateCaption(p.id, e.target.value)}
                            placeholder="Légende…"
                            className="w-full bg-white px-3 py-2 text-xs border-t border-ink/8 focus:outline-none focus:border-copper print:bg-transparent print:border-0"
                          />
                        </figure>
                      ))}
                    </div>
                  )}
                </section>
              );
            },
          )}

          {report.publishedAt && (
            <p className="text-xs text-muted print:text-[10px]">
              Publié le{" "}
              {new Date(report.publishedAt).toLocaleString("fr-FR")} · Visible
              dans l&apos;espace client.
            </p>
          )}
        </div>

        <input
          ref={fileInput}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileSelect}
        />
      </div>

      <style jsx global>{`
        @media print {
          body {
            background: white !important;
          }
        }
      `}</style>
    </div>
  );
}
