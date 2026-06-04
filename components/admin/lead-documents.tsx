"use client";

import { useEffect, useRef, useState } from "react";
import {
  FileText,
  Upload,
  Download,
  Trash2,
  File,
  FileImage,
  FileSpreadsheet,
  X as XIcon,
  Loader2,
} from "lucide-react";
import type { LeadDocument } from "@/lib/documents-store";
import { cn } from "@/lib/utils";

const ICON_FOR_MIME: Record<string, typeof FileText> = {
  "application/pdf": FileText,
  "text/csv": FileSpreadsheet,
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": FileSpreadsheet,
  "application/vnd.ms-excel": FileSpreadsheet,
};

function iconFor(mime: string) {
  if (mime.startsWith("image/")) return FileImage;
  return ICON_FOR_MIME[mime] ?? File;
}

function humanSize(n: number): string {
  if (n < 1024) return `${n} o`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} Ko`;
  return `${(n / 1024 / 1024).toFixed(1)} Mo`;
}

export function LeadDocuments({ reference }: { reference: string }) {
  const [docs, setDocs] = useState<LeadDocument[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const refresh = async () => {
    try {
      const res = await fetch(`/api/admin/leads/${reference}/documents`, {
        cache: "no-store",
      });
      if (res.ok) {
        const data = await res.json();
        setDocs(data.documents ?? []);
      }
    } catch {
      setDocs([]);
    }
  };

  useEffect(() => {
    refresh();
  }, [reference]);

  const upload = async (file: File) => {
    setBusy(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch(`/api/admin/leads/${reference}/documents`, {
        method: "POST",
        body: fd,
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? `Échec ${res.status}`);
      } else {
        await refresh();
      }
    } catch (e) {
      setError(String(e));
    } finally {
      setBusy(false);
    }
  };

  const handleFiles = async (files: FileList | null) => {
    if (!files) return;
    for (let i = 0; i < files.length; i++) {
      await upload(files[i]);
    }
  };

  const remove = async (docId: string) => {
    if (!confirm("Supprimer ce document définitivement ?")) return;
    const res = await fetch(
      `/api/admin/leads/${reference}/documents/${docId}`,
      { method: "DELETE" },
    );
    if (res.ok) await refresh();
  };

  return (
    <div className="p-6 lg:p-8 rounded-3xl border border-ink/10 bg-white shadow-soft">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-copper" />
          <h2 className="font-display text-2xl text-ink">
            Documents{docs && docs.length > 0 ? ` (${docs.length})` : ""}
          </h2>
        </div>
        <button
          onClick={() => inputRef.current?.click()}
          disabled={busy}
          className={cn(
            "inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors",
            busy
              ? "bg-ink/10 text-ink/40 cursor-not-allowed"
              : "bg-ink text-cream hover:bg-copper",
          )}
        >
          {busy ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Upload className="h-4 w-4" />
          )}
          Ajouter
        </button>
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          multiple
          onChange={(e) => handleFiles(e.target.files)}
          accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx,.xls,.xlsx,.csv,.txt"
        />
      </div>

      {/* Drop zone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          handleFiles(e.dataTransfer.files);
        }}
        className={cn(
          "rounded-2xl border-2 border-dashed p-6 text-center transition-colors",
          dragOver
            ? "border-copper bg-copper/5"
            : "border-ink/15 bg-cream/50 hover:border-copper/40",
        )}
      >
        <Upload className="h-6 w-6 text-graphite mx-auto" />
        <p className="mt-2 text-sm text-graphite">
          Glissez-déposez vos fichiers ici, ou cliquez sur « Ajouter ».
        </p>
        <p className="mt-1 text-xs text-muted">
          PDF, images, Word, Excel · 20 Mo max par fichier
        </p>
      </div>

      {error && (
        <div className="mt-4 p-3 rounded-xl border border-ember/40 bg-ember/5 text-sm text-ember flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError(null)}>
            <XIcon className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Liste */}
      {docs && docs.length > 0 && (
        <ul className="mt-5 grid gap-2">
          {docs.map((d) => {
            const Icon = iconFor(d.mime);
            return (
              <li
                key={d.id}
                className="flex items-center gap-3 p-3 rounded-xl border border-ink/10 bg-cream hover:border-copper/40 transition-colors"
              >
                <span className="h-10 w-10 rounded-lg bg-white border border-ink/10 grid place-items-center shrink-0">
                  <Icon className="h-4 w-4 text-copper" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="text-sm text-ink font-medium truncate">
                    {d.filename}
                  </div>
                  <div className="text-xs text-muted">
                    {humanSize(d.size)} · {new Date(d.uploadedAt).toLocaleString("fr-FR")}
                  </div>
                </div>
                <a
                  href={`/api/admin/leads/${reference}/documents/${d.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="h-9 w-9 grid place-items-center rounded-full bg-white border border-ink/10 text-graphite hover:bg-copper hover:text-cream hover:border-copper transition-colors"
                  title="Télécharger / ouvrir"
                >
                  <Download className="h-4 w-4" />
                </a>
                <button
                  onClick={() => remove(d.id)}
                  className="h-9 w-9 grid place-items-center rounded-full bg-white border border-ink/10 text-graphite hover:bg-ember hover:text-cream hover:border-ember transition-colors"
                  title="Supprimer"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
