"use client";

/**
 * Page édition d'une checklist sécurité.
 *
 * Pour chaque item : 3 boutons OK / KO / N/A + commentaire. Signature
 * technicien à la fin. Print CSS pour traçabilité papier.
 */

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import {
  ArrowLeft,
  Loader2,
  ShieldCheck,
  AlertTriangle,
  XOctagon,
  Check,
  Printer,
  Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";

type Item = {
  key: string;
  label: string;
  severity: "info" | "warn" | "critical";
};

type Template = {
  id: string;
  name: string;
  category: string;
  description: string;
  items: Item[];
};

type Completion = {
  id: string;
  templateId: string;
  leadReference?: string;
  technicianEmail: string;
  results: { key: string; status: "ok" | "ko" | "na"; comment?: string }[];
  notes?: string;
  signedAt?: string;
  signedBy?: string;
  createdAt: string;
};

const STATUS_COLORS = {
  ok: "#22a06b",
  ko: "#dc5a28",
  na: "#8b847a",
};

const STATUS_LABELS = {
  ok: "OK",
  ko: "KO",
  na: "N/A",
};

export default function SafetyCompletionPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const [data, setData] = useState<{
    completion: Completion;
    template: Template;
    passing: boolean;
  } | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const res = await fetch(`/api/admin/safety/${params.id}`, {
      cache: "no-store",
    });
    if (res.status === 401) {
      router.replace("/admin/login");
      return;
    }
    if (res.ok) {
      setData(await res.json());
    }
  }, [params.id, router]);

  useEffect(() => {
    load();
  }, [load]);

  const update = async (patch: Partial<Completion>) => {
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/safety/${params.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      if (res.ok) setData(await res.json());
    } finally {
      setBusy(false);
    }
  };

  const setStatus = (key: string, status: "ok" | "ko" | "na") => {
    if (!data) return;
    update({
      results: data.completion.results.map((r) =>
        r.key === key ? { ...r, status } : r,
      ),
    });
  };

  const setComment = (key: string, comment: string) => {
    if (!data) return;
    update({
      results: data.completion.results.map((r) =>
        r.key === key ? { ...r, comment } : r,
      ),
    });
  };

  const sign = () => {
    update({
      signedAt: new Date().toISOString(),
      signedBy: data?.completion.technicianEmail,
    });
  };

  const remove = async () => {
    if (!confirm("Supprimer cette checklist ?")) return;
    await fetch(`/api/admin/safety/${params.id}`, { method: "DELETE" });
    router.push("/admin/safety");
  };

  if (!data) {
    return (
      <div className="min-h-screen bg-cream grid place-items-center">
        <Loader2 className="h-6 w-6 animate-spin text-copper" />
      </div>
    );
  }

  const { completion, template, passing } = data;
  const koCriticalCount = template.items.filter((item) => {
    if (item.severity !== "critical") return false;
    const r = completion.results.find((x) => x.key === item.key);
    return r?.status === "ko";
  }).length;

  return (
    <div className="min-h-screen bg-cream py-10 lg:py-14">
      <div className="container max-w-4xl">
        <div className="flex items-center justify-between gap-3 mb-6 print:hidden">
          <Link
            href="/admin/safety"
            className="inline-flex items-center gap-2 text-sm font-mono uppercase tracking-eyebrow text-graphite hover:text-copper"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Retour
          </Link>
          <div className="flex items-center gap-2">
            {!completion.signedAt && (
              <button
                onClick={sign}
                disabled={busy}
                className="inline-flex items-center gap-1.5 rounded-full bg-[#22a06b] text-cream px-4 py-2 text-sm hover:opacity-90"
              >
                <ShieldCheck className="h-3.5 w-3.5" />
                Signer
              </button>
            )}
            <button
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 rounded-full bg-white border border-ink/15 px-4 py-2 text-sm hover:border-copper/40"
            >
              <Printer className="h-3.5 w-3.5" />
              Imprimer
            </button>
            <button
              onClick={remove}
              className="inline-flex items-center gap-1.5 rounded-full bg-white border border-ember/40 text-ember px-3 py-2 text-sm hover:bg-ember/10"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-ink/10 shadow-soft p-8 lg:p-12 print:shadow-none print:border-0">
          <div className="flex items-start justify-between gap-3 mb-6 pb-6 border-b border-ink/8">
            <div>
              <div className="font-mono text-[10px] uppercase tracking-eyebrow text-copper">
                Checklist sécurité · {template.category}
              </div>
              <div className="font-display text-2xl text-ink mt-1">
                {template.name}
              </div>
              <p className="text-xs text-graphite mt-2">
                {template.description}
              </p>
            </div>
            <div className="text-right text-xs text-graphite">
              <div className="font-mono text-[10px] uppercase tracking-eyebrow text-muted">
                Technicien
              </div>
              <div className="text-ink mt-0.5">{completion.technicianEmail}</div>
              <div className="font-mono text-[10px] mt-2 text-muted">
                Créée le{" "}
                {new Date(completion.createdAt).toLocaleString("fr-FR")}
              </div>
            </div>
          </div>

          {koCriticalCount > 0 && (
            <div className="mb-6 p-4 rounded-2xl border border-ember/40 bg-ember/5 flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-ember shrink-0" />
              <div>
                <div className="text-sm font-medium text-ember">
                  {koCriticalCount} point{koCriticalCount > 1 ? "s" : ""}{" "}
                  critique{koCriticalCount > 1 ? "s" : ""} en KO
                </div>
                <div className="text-xs text-graphite mt-1">
                  Conformité non assurée. Ne pas démarrer l&apos;intervention
                  avant résolution.
                </div>
              </div>
            </div>
          )}

          <ul className="grid gap-2 mb-6">
            {template.items.map((item) => {
              const result = completion.results.find((r) => r.key === item.key);
              const status = result?.status ?? "na";
              const isCritical = item.severity === "critical";
              return (
                <li
                  key={item.key}
                  className={cn(
                    "p-3 rounded-xl border",
                    isCritical
                      ? "bg-ember/5 border-ember/20"
                      : "bg-cream/40 border-ink/8",
                  )}
                >
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm text-ink flex-1">
                      {item.label}
                      {isCritical && (
                        <span className="ml-2 text-[10px] font-mono uppercase tracking-eyebrow text-ember">
                          Critique
                        </span>
                      )}
                    </span>
                    <div className="flex items-center gap-1 print:gap-2">
                      {(["ok", "ko", "na"] as const).map((s) => (
                        <button
                          key={s}
                          onClick={() => setStatus(item.key, s)}
                          disabled={busy || !!completion.signedAt}
                          className={cn(
                            "px-2 py-1 rounded-full text-[10px] font-mono uppercase tracking-eyebrow border transition-colors",
                            status === s && "ring-2 ring-offset-1",
                            (busy || completion.signedAt) && "opacity-70",
                          )}
                          style={
                            status === s
                              ? {
                                  background: STATUS_COLORS[s],
                                  color: "#fff",
                                  borderColor: STATUS_COLORS[s],
                                }
                              : {
                                  borderColor: "rgba(42,37,30,0.1)",
                                  color: STATUS_COLORS[s],
                                }
                          }
                        >
                          {STATUS_LABELS[s]}
                        </button>
                      ))}
                    </div>
                  </div>
                  <input
                    value={result?.comment ?? ""}
                    onChange={(e) => setComment(item.key, e.target.value)}
                    onBlur={(e) => setComment(item.key, e.target.value)}
                    disabled={!!completion.signedAt}
                    placeholder="Commentaire / mesure prise…"
                    className="mt-2 w-full bg-transparent border-0 border-b border-ink/8 px-0 py-1 text-xs focus:outline-none focus:border-copper disabled:opacity-70"
                  />
                </li>
              );
            })}
          </ul>

          <div className="mb-4">
            <label className="font-mono text-[10px] uppercase tracking-eyebrow text-muted block mb-1">
              Notes générales
            </label>
            <textarea
              rows={2}
              value={completion.notes ?? ""}
              onChange={(e) => update({ notes: e.target.value })}
              disabled={!!completion.signedAt}
              className="w-full bg-cream/50 border border-ink/12 rounded-xl p-3 text-sm focus:border-copper focus:outline-none resize-none disabled:opacity-70"
            />
          </div>

          {completion.signedAt && (
            <div className="mt-6 p-4 rounded-2xl bg-[#22a06b]/8 border border-[#22a06b]/30 text-xs text-ink flex items-center gap-2">
              <Check className="h-4 w-4 text-[#22a06b]" />
              Signée par <strong>{completion.signedBy}</strong> le{" "}
              {new Date(completion.signedAt).toLocaleString("fr-FR")}.
              {passing ? (
                <span className="ml-2 text-[#22a06b]">
                  ✓ Tous les critères critiques OK
                </span>
              ) : (
                <span className="ml-2 text-ember">
                  ⚠ Critères critiques non conformes
                </span>
              )}
            </div>
          )}
        </div>
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
