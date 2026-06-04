"use client";

/**
 * Page de téléchargement des exports structurés warehouse-ready.
 */

import Link from "next/link";
import {
  ArrowLeft,
  Download,
  Database,
  FileSpreadsheet,
  FileJson,
  Users,
  FileText,
  Receipt,
  Activity,
} from "lucide-react";

const ENTITIES = [
  {
    id: "leads",
    label: "Leads",
    icon: Users,
    description: "Tous les leads avec attribution UTM, score, statut, conversion",
  },
  {
    id: "quotes",
    label: "Devis",
    icon: FileText,
    description: "Devis officiels avec totaux HT/TVA/TTC et statut",
  },
  {
    id: "invoices",
    label: "Factures",
    icon: Receipt,
    description: "Factures émises avec montants et délais paiement",
  },
  {
    id: "events",
    label: "Événements pipeline",
    icon: Activity,
    description: "Format event-sourcing : création + transitions de statut",
  },
];

export default function ExportPage() {
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
          <div className="inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-eyebrow text-copper bg-copper/10 border border-copper/20 px-3 py-1 rounded-full">
            <Database className="h-3 w-3" />
            Exports warehouse-ready
          </div>
          <h1 className="mt-3 font-display text-display-md text-ink">
            Données structurées
          </h1>
          <p className="mt-2 text-graphite">
            Exports par entité avec schéma stable (colonnes snake_case, types
            explicites). À brancher sur votre outil BI (Metabase, Looker,
            Power BI, Excel).
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-4">
          {ENTITIES.map((e) => {
            const Icon = e.icon;
            return (
              <div
                key={e.id}
                className="rounded-2xl border border-ink/10 bg-white shadow-soft p-5"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div
                    className="h-12 w-12 rounded-full grid place-items-center shrink-0"
                    style={{
                      background: "rgba(184,106,54,0.12)",
                      color: "#b86a36",
                    }}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="font-display text-lg text-ink">
                      {e.label}
                    </div>
                    <div className="text-xs text-graphite mt-0.5">
                      {e.description}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-4">
                  <a
                    href={`/api/admin/export/${e.id}?format=csv`}
                    className="inline-flex items-center gap-1.5 rounded-full bg-ink text-cream px-4 py-2 text-sm hover:bg-copper transition-colors"
                  >
                    <FileSpreadsheet className="h-3.5 w-3.5" />
                    CSV
                  </a>
                  <a
                    href={`/api/admin/export/${e.id}?format=json`}
                    className="inline-flex items-center gap-1.5 rounded-full bg-white border border-ink/15 px-4 py-2 text-sm hover:border-copper/40 transition-colors"
                  >
                    <FileJson className="h-3.5 w-3.5" />
                    JSON
                  </a>
                  <span className="ml-auto inline-flex items-center gap-1 text-[10px] font-mono text-muted">
                    <Download className="h-2.5 w-2.5" />
                    Téléchargement immédiat
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-8 rounded-2xl border border-copper/30 bg-copper/5 p-5">
          <div className="font-mono text-[10px] uppercase tracking-eyebrow text-copper mb-2">
            Notes d&apos;intégration
          </div>
          <ul className="text-xs text-graphite leading-relaxed grid gap-1.5 list-disc pl-4">
            <li>
              CSV séparateur point-virgule (compatible Excel France/Luxembourg)
              avec BOM UTF-8.
            </li>
            <li>
              JSON tableau d&apos;objets aplatis, prêts pour insertion en
              table relationnelle ou colonne JSONB.
            </li>
            <li>
              Schéma stable : ajouter une colonne dans l&apos;avenir ne casse
              pas vos imports historiques.
            </li>
            <li>
              Cron suggéré : 1× / jour via{" "}
              <code className="font-mono bg-white px-1 rounded">
                curl
              </code>{" "}
              + auth admin token, push vers S3 ou BigQuery.
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
