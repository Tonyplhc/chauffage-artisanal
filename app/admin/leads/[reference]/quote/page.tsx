"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Plus,
  Trash2,
  Save,
  Send,
  Eye,
  Check,
  Loader2,
} from "lucide-react";
import type { Quote, QuoteLine } from "@/lib/quote-schema";
import { computeTotals, formatEur } from "@/lib/quote-schema";
import { QuoteTemplatePicker } from "@/components/admin/quote-template-picker";
import { QuoteRecommendations } from "@/components/admin/quote-recommendations";
import { cn } from "@/lib/utils";

function newLineId() {
  return `ln-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
}

const EMPTY_QUOTE: Omit<Quote, "leadReference" | "number"> = {
  status: "draft",
  lines: [
    {
      id: newLineId(),
      description: "",
      quantity: 1,
      unitPrice: 0,
      unit: "forfait",
    },
  ],
  tvaRate: 17,
  notes: "",
};

export default function QuoteBuilderPage() {
  const params = useParams<{ reference: string }>();
  const router = useRouter();
  const [quote, setQuote] = useState<Quote | null>(null);
  const [saving, setSaving] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedFlash, setSavedFlash] = useState(false);
  const [sentFlash, setSentFlash] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`/api/admin/leads/${params.reference}/quote`, {
          cache: "no-store",
        });
        if (res.status === 401) {
          router.replace("/admin/login");
          return;
        }
        const data = await res.json();
        if (data.quote) {
          setQuote(data.quote);
        } else {
          setQuote({
            ...EMPTY_QUOTE,
            leadReference: params.reference,
            number: "",
          });
        }
      } catch {
        setError("Erreur de chargement.");
      }
    })();
  }, [params.reference, router]);

  if (!quote) {
    return (
      <div className="min-h-screen bg-cream py-10 grid place-items-center">
        <div className="text-muted">{error ?? "Chargement…"}</div>
      </div>
    );
  }

  const totals = computeTotals(quote);

  const updateLine = (id: string, patch: Partial<QuoteLine>) => {
    setQuote({
      ...quote,
      lines: quote.lines.map((l) => (l.id === id ? { ...l, ...patch } : l)),
    });
  };

  const addLine = () => {
    setQuote({
      ...quote,
      lines: [
        ...quote.lines,
        {
          id: newLineId(),
          description: "",
          quantity: 1,
          unitPrice: 0,
          unit: "forfait",
        },
      ],
    });
  };

  const removeLine = (id: string) => {
    if (quote.lines.length <= 1) return;
    setQuote({ ...quote, lines: quote.lines.filter((l) => l.id !== id) });
  };

  const save = async () => {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/leads/${params.reference}/quote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(quote),
      });
      const data = await res.json();
      if (res.ok) {
        setQuote(data.quote);
        setSavedFlash(true);
        setTimeout(() => setSavedFlash(false), 2000);
      } else {
        setError(data.error ?? "Erreur");
      }
    } finally {
      setSaving(false);
    }
  };

  const sendToClient = async () => {
    if (!confirm("Envoyer ce devis au client par email ?")) return;
    setSending(true);
    try {
      // Sauvegarde d'abord
      const saveRes = await fetch(`/api/admin/leads/${params.reference}/quote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(quote),
      });
      if (!saveRes.ok) {
        setError("Sauvegarde échouée");
        return;
      }
      // Puis envoi
      const sendRes = await fetch(`/api/admin/leads/${params.reference}/quote`, {
        method: "PATCH",
      });
      const data = await sendRes.json();
      if (sendRes.ok) {
        setQuote(data.quote);
        setSentFlash(data.quoteUrl);
      } else {
        setError(data.error ?? "Envoi échoué");
      }
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-cream py-10 lg:py-14">
      <div className="container max-w-5xl">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-8 flex-wrap">
          <div>
            <Link
              href={`/admin/leads/${params.reference}`}
              className="inline-flex items-center gap-2 text-sm font-mono uppercase tracking-eyebrow text-graphite hover:text-copper transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Retour au dossier
            </Link>
            <h1 className="mt-3 font-display text-display-md text-ink">
              Devis officiel
            </h1>
            <p className="mt-2 text-graphite">
              Pour le dossier {params.reference}
              {quote.number ? ` · n° ${quote.number}` : ""}
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {quote.status === "sent" && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#22a06b]/10 border border-[#22a06b]/40 px-3 py-1.5 text-xs font-mono uppercase tracking-eyebrow text-[#22a06b]">
                <Check className="h-3 w-3" /> Envoyé
              </span>
            )}
            <button
              onClick={save}
              disabled={saving}
              className={cn(
                "inline-flex items-center gap-2 rounded-full border border-ink/15 px-5 py-2.5 text-base bg-white hover:border-copper/40 transition-colors",
                saving && "opacity-60 cursor-not-allowed",
              )}
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {savedFlash ? "Enregistré ✓" : "Enregistrer"}
            </button>
            <button
              onClick={sendToClient}
              disabled={sending || quote.lines.every((l) => !l.description.trim())}
              className={cn(
                "inline-flex items-center gap-2 rounded-full bg-ink text-cream px-5 py-2.5 text-base hover:bg-copper transition-colors",
                (sending || quote.lines.every((l) => !l.description.trim())) &&
                  "opacity-50 cursor-not-allowed",
              )}
            >
              {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              Envoyer au client
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl border border-ember/40 bg-ember/5 text-sm text-ember">
            {error}
          </div>
        )}

        {sentFlash && (
          <div className="mb-4 p-4 rounded-2xl border border-[#22a06b]/40 bg-[#22a06b]/5">
            <div className="font-medium text-ink mb-1">Devis envoyé au client.</div>
            <a
              href={sentFlash}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-copper underline inline-flex items-center gap-1"
            >
              <Eye className="h-3.5 w-3.5" /> Voir la page publique du devis
            </a>
          </div>
        )}

        {/* Devis */}
        <div className="rounded-3xl border border-ink/10 bg-white shadow-soft p-6 lg:p-10">
          {/* Recommandations basées sur historique des conversions */}
          <QuoteRecommendations
            reference={params.reference as string}
            onApply={(line) =>
              setQuote((prev) => ({
                ...prev,
                lines: [
                  ...prev.lines,
                  {
                    id: newLineId(),
                    description: line.description,
                    quantity: line.quantity,
                    unitPrice: line.unitPrice,
                    unit: line.unit,
                  },
                ],
              }))
            }
          />

          {/* Lignes */}
          <div className="flex items-center justify-between mb-4 gap-3">
            <div className="font-mono text-[10px] uppercase tracking-eyebrow text-copper">
              Lignes du devis
            </div>
            <QuoteTemplatePicker
              onApply={(lines, tvaRate, mode) => {
                const newLines = lines.map((l) => ({
                  id: newLineId(),
                  description: l.description,
                  quantity: l.quantity,
                  unitPrice: l.unitPrice,
                  unit: l.unit ?? "forfait",
                }));
                setQuote((prev) => ({
                  ...prev,
                  tvaRate,
                  lines:
                    mode === "merge" ? [...prev.lines, ...newLines] : newLines,
                }));
              }}
            />
          </div>
          <div className="grid gap-3 mb-6">
            {quote.lines.map((line) => (
              <div
                key={line.id}
                className="grid grid-cols-12 gap-3 items-start p-3 rounded-xl bg-cream border border-ink/8"
              >
                <div className="col-span-12 sm:col-span-6">
                  <label className="font-mono text-[10px] uppercase tracking-eyebrow text-muted mb-1.5 block">
                    Description
                  </label>
                  <textarea
                    rows={2}
                    value={line.description}
                    onChange={(e) => updateLine(line.id, { description: e.target.value })}
                    className="w-full bg-white border border-ink/12 rounded-lg px-3 py-2 text-sm text-ink focus:border-copper focus:outline-none resize-none"
                    placeholder="Ex : Fourniture et pose chaudière gaz à condensation Viessmann Vitodens 100-W 32 kW…"
                  />
                </div>
                <div className="col-span-4 sm:col-span-1">
                  <label className="font-mono text-[10px] uppercase tracking-eyebrow text-muted mb-1.5 block">
                    Qté
                  </label>
                  <input
                    type="number"
                    min={1}
                    step={0.5}
                    value={line.quantity}
                    onChange={(e) =>
                      updateLine(line.id, { quantity: Number(e.target.value) || 1 })
                    }
                    className="w-full bg-white border border-ink/12 rounded-lg px-3 py-2 text-sm text-ink focus:border-copper focus:outline-none tabular-nums"
                  />
                </div>
                <div className="col-span-4 sm:col-span-2">
                  <label className="font-mono text-[10px] uppercase tracking-eyebrow text-muted mb-1.5 block">
                    Unité
                  </label>
                  <input
                    type="text"
                    value={line.unit}
                    onChange={(e) => updateLine(line.id, { unit: e.target.value })}
                    className="w-full bg-white border border-ink/12 rounded-lg px-3 py-2 text-sm text-ink focus:border-copper focus:outline-none"
                  />
                </div>
                <div className="col-span-3 sm:col-span-2">
                  <label className="font-mono text-[10px] uppercase tracking-eyebrow text-muted mb-1.5 block">
                    PU HT (€)
                  </label>
                  <input
                    type="number"
                    min={0}
                    step={1}
                    value={line.unitPrice}
                    onChange={(e) =>
                      updateLine(line.id, { unitPrice: Number(e.target.value) || 0 })
                    }
                    className="w-full bg-white border border-ink/12 rounded-lg px-3 py-2 text-sm text-ink focus:border-copper focus:outline-none tabular-nums"
                  />
                </div>
                <div className="col-span-1 flex items-end justify-end pb-1">
                  <button
                    onClick={() => removeLine(line.id)}
                    disabled={quote.lines.length <= 1}
                    className="h-9 w-9 grid place-items-center rounded-full text-muted hover:text-ember hover:bg-ember/10 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                    title="Supprimer"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                {/* Sous-total ligne */}
                <div className="col-span-12 text-right text-xs text-muted">
                  Sous-total ligne ·{" "}
                  <strong className="text-ink tabular-nums">
                    {formatEur(line.quantity * line.unitPrice)}
                  </strong>
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={addLine}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-dashed border-ink/30 text-sm text-graphite hover:border-copper/40 hover:text-copper transition-colors"
          >
            <Plus className="h-4 w-4" /> Ajouter une ligne
          </button>

          {/* TVA et totaux */}
          <div className="mt-8 pt-6 border-t border-ink/8 grid lg:grid-cols-12 gap-6">
            <div className="lg:col-span-7 grid gap-4">
              <div>
                <label className="font-mono text-[10px] uppercase tracking-eyebrow text-muted mb-1.5 block">
                  TVA (%)
                </label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  step={0.5}
                  value={quote.tvaRate}
                  onChange={(e) =>
                    setQuote({ ...quote, tvaRate: Number(e.target.value) || 0 })
                  }
                  className="w-32 bg-white border border-ink/12 rounded-lg px-3 py-2 text-sm text-ink focus:border-copper focus:outline-none tabular-nums"
                />
              </div>
              <div>
                <label className="font-mono text-[10px] uppercase tracking-eyebrow text-muted mb-1.5 block">
                  Validité jusqu&apos;au
                </label>
                <input
                  type="date"
                  value={quote.validUntil?.slice(0, 10) ?? ""}
                  onChange={(e) =>
                    setQuote({ ...quote, validUntil: e.target.value || undefined })
                  }
                  className="bg-white border border-ink/12 rounded-lg px-3 py-2 text-sm text-ink focus:border-copper focus:outline-none"
                />
              </div>
              <div>
                <label className="font-mono text-[10px] uppercase tracking-eyebrow text-muted mb-1.5 block">
                  Notes complémentaires (visibles client)
                </label>
                <textarea
                  rows={3}
                  value={quote.notes}
                  onChange={(e) => setQuote({ ...quote, notes: e.target.value })}
                  className="w-full bg-white border border-ink/12 rounded-lg px-3 py-2 text-sm text-ink focus:border-copper focus:outline-none resize-none"
                  placeholder="Conditions de paiement, délai d'exécution prévu, garanties…"
                />
              </div>
            </div>
            <div className="lg:col-span-5 p-5 rounded-2xl bg-charcoal text-cream">
              <div className="font-mono text-[10px] uppercase tracking-eyebrow text-copper">
                Récapitulatif
              </div>
              <div className="mt-4 grid gap-3 text-sm">
                <Row label="Total HT" value={formatEur(totals.htAmount)} />
                <Row
                  label={`TVA (${quote.tvaRate}%)`}
                  value={formatEur(totals.tvaAmount)}
                />
                <div className="border-t border-cream/15 pt-3">
                  <Row
                    label="Total TTC"
                    value={formatEur(totals.ttcAmount)}
                    big
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Actions de bas de page (dupliquées du header pour ergonomie) */}
          <div className="mt-8 pt-6 border-t border-ink/8 flex items-center justify-end gap-2 flex-wrap">
            <button
              onClick={save}
              disabled={saving}
              className={cn(
                "inline-flex items-center gap-2 rounded-full border border-ink/15 px-5 py-2.5 text-base bg-white hover:border-copper/40 transition-colors",
                saving && "opacity-60 cursor-not-allowed",
              )}
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {savedFlash ? "Enregistré ✓" : "Enregistrer le brouillon"}
            </button>
            <button
              onClick={sendToClient}
              disabled={sending || quote.lines.every((l) => !l.description.trim())}
              className={cn(
                "inline-flex items-center gap-2 rounded-full bg-ink text-cream px-5 py-2.5 text-base hover:bg-copper transition-colors",
                (sending || quote.lines.every((l) => !l.description.trim())) &&
                  "opacity-50 cursor-not-allowed",
              )}
            >
              {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              Valider & envoyer au client
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Row({
  label,
  value,
  big,
}: {
  label: string;
  value: string;
  big?: boolean;
}) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <span className={big ? "text-cream/80" : "text-cream/60"}>{label}</span>
      <span
        className={cn(
          "tabular-nums",
          big ? "font-display text-2xl text-copper" : "text-cream",
        )}
      >
        {value}
      </span>
    </div>
  );
}
