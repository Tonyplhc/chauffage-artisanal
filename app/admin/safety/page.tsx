"use client";

/**
 * Page index Health & Safety — liste des templates + historique completions.
 */

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Loader2,
  ShieldCheck,
  AlertTriangle,
  ArrowRight,
  Flame,
  HardHat,
  Snowflake,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";

type Template = {
  id: string;
  name: string;
  category: string;
  description: string;
  items: { key: string; label: string; severity: "info" | "warn" | "critical" }[];
};

type Completion = {
  id: string;
  templateId: string;
  leadReference?: string;
  technicianEmail: string;
  results: { key: string; status: "ok" | "ko" | "na" }[];
  signedAt?: string;
  createdAt: string;
};

const CATEGORY_ICONS: Record<string, typeof Flame> = {
  Gaz: Flame,
  Hauteur: HardHat,
  Frigorigène: Snowflake,
  Électrique: Zap,
};

export default function SafetyPage() {
  const router = useRouter();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [completions, setCompletions] = useState<Completion[]>([]);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const res = await fetch("/api/admin/safety", { cache: "no-store" });
    if (res.status === 401) {
      router.replace("/admin/login");
      return;
    }
    if (res.ok) {
      const d = await res.json();
      setTemplates(d.templates ?? []);
      setCompletions(d.completions ?? []);
    }
  }, [router]);

  useEffect(() => {
    load();
  }, [load]);

  const startChecklist = async (templateId: string) => {
    setBusy(true);
    try {
      const res = await fetch("/api/admin/safety", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ templateId }),
      });
      if (res.ok) {
        const d = await res.json();
        router.push(`/admin/safety/${d.completion.id}`);
      }
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
            Health & Safety
          </h1>
          <p className="mt-2 text-graphite">
            Checklists pré-chantier obligatoires (gaz, hauteur, frigorigène,
            électrique). Traçabilité conformité — n&apos;empêche pas le départ
            mais documente.
          </p>
        </div>

        <h2 className="font-mono text-[10px] uppercase tracking-eyebrow text-copper mb-3">
          Démarrer une checklist
        </h2>
        <div className="grid lg:grid-cols-2 gap-4 mb-10">
          {templates.map((t) => {
            const Icon = CATEGORY_ICONS[t.category] ?? ShieldCheck;
            const criticalCount = t.items.filter(
              (i) => i.severity === "critical",
            ).length;
            return (
              <div
                key={t.id}
                className="rounded-2xl border border-ink/10 bg-white shadow-soft p-5"
              >
                <div className="flex items-center gap-3 mb-2">
                  <div
                    className="h-10 w-10 rounded-full grid place-items-center shrink-0"
                    style={{
                      background: "rgba(220,90,40,0.12)",
                      color: "#dc5a28",
                    }}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-base font-medium text-ink">
                      {t.name}
                    </div>
                    <div className="text-[10px] font-mono uppercase tracking-eyebrow text-copper">
                      {t.category}
                    </div>
                  </div>
                </div>
                <p className="text-xs text-graphite mb-3">{t.description}</p>
                <div className="text-[11px] text-muted mb-3">
                  {t.items.length} points · {criticalCount} critiques
                </div>
                <button
                  onClick={() => startChecklist(t.id)}
                  disabled={busy}
                  className="inline-flex items-center gap-1.5 rounded-full bg-ink text-cream px-3 py-1.5 text-xs hover:bg-copper disabled:opacity-50"
                >
                  {busy ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <ShieldCheck className="h-3 w-3" />
                  )}
                  Démarrer
                </button>
              </div>
            );
          })}
        </div>

        <h2 className="font-mono text-[10px] uppercase tracking-eyebrow text-copper mb-3">
          Historique récent
        </h2>
        <div className="rounded-2xl border border-ink/10 bg-white shadow-soft overflow-hidden">
          {completions.length === 0 ? (
            <div className="py-12 text-center text-muted">
              <ShieldCheck className="h-12 w-12 mx-auto opacity-30 text-copper mb-2" />
              <p>Aucune checklist remplie.</p>
            </div>
          ) : (
            <ul className="divide-y divide-ink/8">
              {completions.map((c) => {
                const tpl = templates.find((t) => t.id === c.templateId);
                const koCount = c.results.filter((r) => r.status === "ko").length;
                return (
                  <li key={c.id}>
                    <Link
                      href={`/admin/safety/${c.id}`}
                      className="grid lg:grid-cols-12 gap-3 items-center px-5 py-3 hover:bg-cream/40 transition-colors group"
                    >
                      <div className="lg:col-span-5 min-w-0">
                        <div className="text-sm font-medium text-ink truncate">
                          {tpl?.name ?? c.templateId}
                        </div>
                        <div className="text-xs text-graphite">
                          {c.technicianEmail}
                        </div>
                      </div>
                      <div className="lg:col-span-3 text-xs text-graphite font-mono">
                        {c.leadReference ?? "—"}
                      </div>
                      <div className="lg:col-span-2 text-xs text-muted font-mono">
                        {new Date(c.createdAt).toLocaleString("fr-FR")}
                      </div>
                      <div className="lg:col-span-2 text-right">
                        {koCount > 0 ? (
                          <span className="inline-flex items-center gap-1 text-ember text-xs font-mono">
                            <AlertTriangle className="h-3 w-3" />
                            {koCount} KO
                          </span>
                        ) : c.signedAt ? (
                          <span className="inline-flex items-center gap-1 text-[#22a06b] text-xs font-mono">
                            <ShieldCheck className="h-3 w-3" />
                            Signée
                          </span>
                        ) : (
                          <span className="text-[10px] text-muted font-mono">
                            En cours
                          </span>
                        )}
                        <ArrowRight className="inline h-3 w-3 ml-1 text-muted opacity-0 group-hover:opacity-100" />
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

// Suppress unused
void cn;
