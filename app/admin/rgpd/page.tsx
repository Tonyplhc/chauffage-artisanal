"use client";

/**
 * Rapport conformité RGPD — registre des traitements + métriques d'usage.
 *
 * Imprimable via la fonction d'impression du navigateur (print CSS dédié pour
 * masquer la navigation et formater proprement). C'est la « preuve » que le
 * responsable peut présenter à la CNIL/CNPD ou à un sous-traitant.
 */

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Loader2,
  ShieldCheck,
  Printer,
  AlertTriangle,
  Info,
  FileText,
  Lock,
} from "lucide-react";
import { cn } from "@/lib/utils";

type Purpose = {
  id: string;
  title: string;
  legalBasis:
    | "contrat"
    | "consentement"
    | "obligation_legale"
    | "interet_legitime";
  dataCategories: string[];
  recipients: string[];
  retention: string;
  securityMeasures: string[];
  outsideEu: { transferred: boolean; safeguards?: string };
};

type Report = {
  generatedAt: string;
  brand: { name: string; contactEmail: string; address: string };
  purposes: Purpose[];
  rights: { title: string; description: string; procedureFr: string }[];
  metrics: {
    leadsTotal: number;
    oldestLeadAt: string | null;
    newestLeadAt: string | null;
    exportsCount: number;
    dernierExportAt: string | null;
    deletionsCount: number;
    dernierDeletionAt: string | null;
    leadsBeyondStandardRetention: number;
  };
  recommendations: { severity: "info" | "warning" | "critical"; text: string }[];
};

const LEGAL_BASIS_LABEL: Record<Purpose["legalBasis"], string> = {
  contrat: "Exécution d'un contrat",
  consentement: "Consentement explicite",
  obligation_legale: "Obligation légale",
  interet_legitime: "Intérêt légitime",
};

function formatDate(iso: string | null) {
  if (!iso) return "—";
  try {
    return new Intl.DateTimeFormat("fr-FR", {
      dateStyle: "long",
      timeStyle: "short",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

function formatDateShort(iso: string | null) {
  if (!iso) return "—";
  try {
    return new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium" }).format(
      new Date(iso),
    );
  } catch {
    return iso;
  }
}

export default function RgpdReportPage() {
  const router = useRouter();
  const [report, setReport] = useState<Report | null>(null);

  const load = useCallback(async () => {
    const res = await fetch("/api/admin/rgpd-report", { cache: "no-store" });
    if (res.status === 401) {
      router.replace("/admin/login");
      return;
    }
    if (res.ok) {
      const d = await res.json();
      setReport(d.report);
    }
  }, [router]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="min-h-screen bg-cream py-10 lg:py-14 print:bg-white print:py-0">
      <style jsx global>{`
        @media print {
          .print\\:hidden {
            display: none !important;
          }
          .print\\:block {
            display: block !important;
          }
          .print\\:break-before {
            break-before: page;
          }
          .print\\:avoid-break {
            break-inside: avoid;
          }
          body {
            background: white !important;
          }
        }
      `}</style>

      <div className="container max-w-5xl">
        <div className="print:hidden">
          <Link
            href="/admin/leads"
            className="inline-flex items-center gap-2 text-sm font-mono uppercase tracking-eyebrow text-graphite hover:text-copper transition-colors mb-6"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Retour pipeline
          </Link>
        </div>

        <div className="flex items-start justify-between gap-3 flex-wrap mb-8 print:mb-4">
          <div>
            <h1 className="font-display text-display-md text-ink">
              Registre des traitements RGPD
            </h1>
            {report && (
              <p className="mt-2 text-graphite text-sm">
                Généré le {formatDate(report.generatedAt)} ·{" "}
                {report.brand.name}
              </p>
            )}
          </div>
          <button
            onClick={() => window.print()}
            className="print:hidden inline-flex items-center gap-2 bg-ink text-cream px-4 py-2 rounded-full text-sm hover:bg-copper transition-colors"
          >
            <Printer className="h-4 w-4" />
            Imprimer / PDF
          </button>
        </div>

        {!report ? (
          <div className="py-16 text-center text-muted">
            <Loader2 className="h-6 w-6 animate-spin mx-auto" />
          </div>
        ) : (
          <>
            {/* Responsable de traitement */}
            <section className="rounded-2xl border border-ink/10 bg-white shadow-soft overflow-hidden mb-6 print:avoid-break print:shadow-none">
              <div className="px-5 py-3 border-b border-ink/8 bg-cream/40 print:bg-white flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-copper" />
                <span className="font-mono text-[10px] uppercase tracking-eyebrow text-copper">
                  Responsable de traitement
                </span>
              </div>
              <div className="p-5 grid lg:grid-cols-3 gap-4 text-sm">
                <div>
                  <div className="text-xs text-muted">Entité</div>
                  <div className="text-ink font-medium">
                    {report.brand.name}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-muted">Contact RGPD</div>
                  <div className="text-ink font-mono">
                    {report.brand.contactEmail}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-muted">Adresse</div>
                  <div className="text-ink">{report.brand.address}</div>
                </div>
              </div>
            </section>

            {/* Métriques */}
            <section className="rounded-2xl border border-ink/10 bg-white shadow-soft overflow-hidden mb-6 print:avoid-break print:shadow-none">
              <div className="px-5 py-3 border-b border-ink/8 bg-cream/40 print:bg-white flex items-center gap-2">
                <FileText className="h-4 w-4 text-copper" />
                <span className="font-mono text-[10px] uppercase tracking-eyebrow text-copper">
                  Métriques d&apos;activité
                </span>
              </div>
              <div className="p-5 grid lg:grid-cols-4 gap-4 text-sm">
                <Metric label="Leads en base" value={String(report.metrics.leadsTotal)} />
                <Metric
                  label="Plus ancien lead"
                  value={formatDateShort(report.metrics.oldestLeadAt)}
                />
                <Metric
                  label="Exports RGPD effectués"
                  value={String(report.metrics.exportsCount)}
                  hint={
                    report.metrics.dernierExportAt
                      ? `dernier ${formatDateShort(report.metrics.dernierExportAt)}`
                      : undefined
                  }
                />
                <Metric
                  label="Suppressions RGPD"
                  value={String(report.metrics.deletionsCount)}
                  hint={
                    report.metrics.dernierDeletionAt
                      ? `dernière ${formatDateShort(report.metrics.dernierDeletionAt)}`
                      : undefined
                  }
                />
              </div>
              {report.metrics.leadsBeyondStandardRetention > 0 && (
                <div className="px-5 pb-4 -mt-2">
                  <div className="text-xs text-copper flex items-start gap-2">
                    <AlertTriangle className="h-3.5 w-3.5 mt-0.5" />
                    <span>
                      {report.metrics.leadsBeyondStandardRetention} lead(s)
                      non-converti(s) au-delà de 24 mois — revoir la politique
                      de conservation.
                    </span>
                  </div>
                </div>
              )}
            </section>

            {/* Recommandations */}
            {report.recommendations.length > 0 && (
              <section className="rounded-2xl border border-ink/10 bg-white shadow-soft overflow-hidden mb-6 print:avoid-break print:shadow-none">
                <div className="px-5 py-3 border-b border-ink/8 bg-cream/40 print:bg-white flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-copper" />
                  <span className="font-mono text-[10px] uppercase tracking-eyebrow text-copper">
                    Recommandations ({report.recommendations.length})
                  </span>
                </div>
                <ul className="divide-y divide-ink/5">
                  {report.recommendations.map((r, i) => (
                    <li
                      key={i}
                      className="px-5 py-3 flex items-start gap-3 text-sm"
                    >
                      <SeverityIcon severity={r.severity} />
                      <div className="text-graphite">{r.text}</div>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {/* Finalités */}
            <section className="rounded-2xl border border-ink/10 bg-white shadow-soft overflow-hidden mb-6 print:break-before print:shadow-none">
              <div className="px-5 py-3 border-b border-ink/8 bg-cream/40 print:bg-white flex items-center gap-2">
                <Lock className="h-4 w-4 text-copper" />
                <span className="font-mono text-[10px] uppercase tracking-eyebrow text-copper">
                  Finalités de traitement ({report.purposes.length})
                </span>
              </div>
              <ul className="divide-y divide-ink/8">
                {report.purposes.map((p) => (
                  <li
                    key={p.id}
                    className="p-5 print:avoid-break"
                  >
                    <div className="flex items-start justify-between gap-3 flex-wrap mb-3">
                      <h3 className="font-display text-lg text-ink">
                        {p.title}
                      </h3>
                      <span className="text-[10px] font-mono uppercase tracking-eyebrow bg-copper/10 text-copper px-2 py-0.5 rounded-full">
                        {LEGAL_BASIS_LABEL[p.legalBasis]}
                      </span>
                    </div>
                    <div className="grid lg:grid-cols-2 gap-4 text-sm">
                      <Block label="Données collectées" items={p.dataCategories} />
                      <Block label="Destinataires" items={p.recipients} />
                      <div className="lg:col-span-2">
                        <div className="font-mono text-[10px] uppercase tracking-eyebrow text-graphite mb-1">
                          Durée de conservation
                        </div>
                        <div className="text-graphite">{p.retention}</div>
                      </div>
                      <div className="lg:col-span-2">
                        <Block
                          label="Mesures de sécurité"
                          items={p.securityMeasures}
                        />
                      </div>
                      <div className="lg:col-span-2">
                        <div className="font-mono text-[10px] uppercase tracking-eyebrow text-graphite mb-1">
                          Transferts hors UE
                        </div>
                        <div className="text-graphite">
                          {p.outsideEu.transferred
                            ? `Oui — ${p.outsideEu.safeguards ?? "garanties à préciser"}`
                            : "Aucun transfert hors UE."}
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </section>

            {/* Droits des personnes */}
            <section className="rounded-2xl border border-ink/10 bg-white shadow-soft overflow-hidden mb-6 print:break-before print:shadow-none">
              <div className="px-5 py-3 border-b border-ink/8 bg-cream/40 print:bg-white flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-copper" />
                <span className="font-mono text-[10px] uppercase tracking-eyebrow text-copper">
                  Droits des personnes concernées
                </span>
              </div>
              <ul className="divide-y divide-ink/8">
                {report.rights.map((r) => (
                  <li key={r.title} className="p-5 print:avoid-break">
                    <h3 className="font-display text-base text-ink">
                      {r.title}
                    </h3>
                    <p className="text-sm text-graphite mt-1">
                      {r.description}
                    </p>
                    <div className="mt-2 rounded-lg bg-cream/40 px-3 py-2 text-xs text-graphite print:bg-white print:border print:border-ink/10">
                      <span className="font-mono text-[10px] uppercase tracking-eyebrow text-copper mr-2">
                        Procédure
                      </span>
                      {r.procedureFr}
                    </div>
                  </li>
                ))}
              </ul>
            </section>

            <p className="text-xs text-muted mt-6 print:hidden">
              Ce rapport est une AIDE à la conformité, pas un substitut à une
              revue juridique. Le responsable RGPD reste accountable. La CNPD
              (Luxembourg) est l&apos;autorité de référence.
            </p>

            <div className="hidden print:block text-[10px] text-muted mt-6 border-t border-ink/10 pt-3">
              Document généré automatiquement le {formatDate(report.generatedAt)}.
              Aide à la conformité — ne se substitue pas à une revue juridique.
              Autorité compétente Luxembourg : CNPD.
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function Block({ label, items }: { label: string; items: string[] }) {
  return (
    <div>
      <div className="font-mono text-[10px] uppercase tracking-eyebrow text-graphite mb-1">
        {label}
      </div>
      <ul className="text-graphite space-y-0.5">
        {items.map((it, i) => (
          <li key={i} className="flex items-start gap-1.5">
            <span className="text-copper mt-1.5 inline-block h-1 w-1 rounded-full bg-copper shrink-0" />
            <span>{it}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Metric({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div>
      <div className="font-mono text-[10px] uppercase tracking-eyebrow text-graphite">
        {label}
      </div>
      <div className="mt-1 font-display text-xl text-ink tabular-nums">
        {value}
      </div>
      {hint && <div className="text-[11px] text-muted mt-0.5">{hint}</div>}
    </div>
  );
}

function SeverityIcon({
  severity,
}: {
  severity: "info" | "warning" | "critical";
}) {
  if (severity === "critical") {
    return (
      <AlertTriangle className="h-4 w-4 text-ember mt-0.5 shrink-0" />
    );
  }
  if (severity === "warning") {
    return <AlertTriangle className="h-4 w-4 text-copper mt-0.5 shrink-0" />;
  }
  return <Info className={cn("h-4 w-4 text-[#6ba3c5] mt-0.5 shrink-0")} />;
}
