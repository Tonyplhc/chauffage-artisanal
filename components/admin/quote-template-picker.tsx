"use client";

/**
 * Picker compact pour charger un template de devis dans le quote builder.
 *
 * Reçoit une callback `onApply(lines, tvaRate)` qui fait l'injection côté
 * parent (le quote builder remplace les lignes courantes après confirmation).
 *
 * Trois modes :
 *   - "merge" : ajoute les lignes du template aux existantes
 *   - "replace" : remplace toutes les lignes par celles du template
 */

import { useEffect, useState } from "react";
import {
  FileStack,
  ChevronDown,
  Loader2,
  Plus,
  RotateCcw,
  X as XIcon,
} from "lucide-react";

type Line = {
  description: string;
  quantity: number;
  unitPrice: number;
  unit?: string;
};

type Template = {
  id: string;
  name: string;
  category?: string;
  description?: string;
  lines: Line[];
  tvaRate: number;
  usageCount: number;
};

export function QuoteTemplatePicker({
  onApply,
}: {
  onApply: (lines: Line[], tvaRate: number, mode: "merge" | "replace") => void;
}) {
  const [open, setOpen] = useState(false);
  const [templates, setTemplates] = useState<Template[] | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    if (!open || templates !== null) return;
    fetch("/api/admin/quote-templates", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setTemplates(d?.templates ?? []))
      .catch(() => setTemplates([]));
  }, [open, templates]);

  const apply = async (
    t: Template,
    mode: "merge" | "replace",
  ) => {
    setBusyId(t.id);
    try {
      // Fire-and-forget tracking de l'usage
      void fetch(`/api/admin/quote-templates/${t.id}`, {
        cache: "no-store",
        headers: { "x-track-use": "1" },
      });
      onApply(t.lines, t.tvaRate, mode);
      setOpen(false);
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="relative inline-block">
      <button
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-2 rounded-full border border-copper/40 bg-copper/8 px-4 py-2 text-sm text-copper hover:bg-copper/15 transition-colors"
      >
        <FileStack className="h-4 w-4" />
        Charger un template
        <ChevronDown className="h-3 w-3" />
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-96 max-h-[60vh] overflow-y-auto rounded-2xl border border-ink/10 bg-white shadow-lift z-30">
          <div className="px-4 py-3 border-b border-ink/8 flex items-center justify-between">
            <span className="font-mono text-[10px] uppercase tracking-eyebrow text-copper">
              Templates disponibles
            </span>
            <button
              onClick={() => setOpen(false)}
              className="h-6 w-6 grid place-items-center rounded-full bg-cream border border-ink/10 text-graphite hover:bg-ink hover:text-cream"
              aria-label="Fermer"
            >
              <XIcon className="h-3 w-3" />
            </button>
          </div>
          {templates === null ? (
            <div className="py-6 text-center text-muted">
              <Loader2 className="h-4 w-4 animate-spin mx-auto" />
            </div>
          ) : templates.length === 0 ? (
            <div className="py-8 text-center text-muted text-sm px-4">
              Aucun template enregistré.{" "}
              <a
                href="/admin/quote-templates"
                className="text-copper underline"
              >
                Créer le premier
              </a>
            </div>
          ) : (
            <ul className="divide-y divide-ink/8">
              {templates.map((t) => (
                <li key={t.id} className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium text-ink truncate">
                        {t.name}
                      </div>
                      <div className="text-[11px] text-muted">
                        {t.category && (
                          <span className="text-copper font-mono uppercase tracking-eyebrow mr-2">
                            {t.category}
                          </span>
                        )}
                        {t.lines.length} ligne{t.lines.length > 1 ? "s" : ""}
                        {t.usageCount > 0 && (
                          <span className="ml-2">· {t.usageCount} usages</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="mt-2 flex items-center gap-1">
                    <button
                      onClick={() => apply(t, "merge")}
                      disabled={busyId === t.id}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-cream border border-ink/10 text-graphite text-[11px] hover:border-copper/40 disabled:opacity-50"
                    >
                      {busyId === t.id ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <Plus className="h-3 w-3" />
                      )}
                      Ajouter aux lignes
                    </button>
                    <button
                      onClick={() => apply(t, "replace")}
                      disabled={busyId === t.id}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-ink text-cream text-[11px] hover:bg-copper disabled:opacity-50"
                    >
                      <RotateCcw className="h-3 w-3" />
                      Remplacer tout
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
          <div className="px-4 py-2 border-t border-ink/8 bg-cream/40">
            <a
              href="/admin/quote-templates"
              className="text-[11px] text-copper hover:underline"
            >
              Gérer les templates →
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
