/**
 * Export CSV des leads — accessible uniquement aux admins authentifiés.
 *
 * Format : RFC 4180 (séparateur virgule, échappement par doubles guillemets).
 * Encoding : UTF-8 avec BOM pour qu'Excel reconnaisse les accents.
 *
 * Filtres acceptés via query string :
 *   ?from=YYYY-MM-DD&to=YYYY-MM-DD     plage de dates
 *   ?status=nouveau|contacte|...        filtre statut
 *   ?level=hot|warm|cold                filtre niveau scoring
 */

import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/require-admin";
import { listLeads } from "@/lib/leads-store";
import { SERVICE_LABELS } from "@/lib/devis-schema";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const COL_HEADERS = [
  "Référence",
  "Date soumission",
  "Statut",
  "Score",
  "Niveau",
  "Nom",
  "Email",
  "Téléphone",
  "Canal préféré",
  "Services",
  "Type bâtiment",
  "Construction",
  "Surface (m²)",
  "Énergie actuelle",
  "Commune",
  "Délai",
  "Budget",
  "Photos jointes",
  "Message",
  "Source",
  "Notes internes",
];

/** Échappe une cellule selon RFC 4180 : guillemets doublés + entourée si besoin. */
function csvCell(v: unknown): string {
  if (v == null) return "";
  const s = String(v);
  if (s.includes(",") || s.includes('"') || s.includes("\n") || s.includes("\r")) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

const BUILDING_LABELS: Record<string, string> = {
  maison: "Maison individuelle",
  appartement: "Appartement",
  collectif: "Immeuble collectif",
  tertiaire: "Tertiaire",
  autre: "Autre",
};

const CONSTRUCTION_LABELS: Record<string, string> = {
  neuf: "Neuf",
  renovation: "Rénovation",
};

const ENERGY_LABELS: Record<string, string> = {
  fioul: "Fioul",
  gaz: "Gaz",
  electrique: "Électrique",
  bois: "Bois / pellets",
  pac: "PAC",
  autre: "Autre",
  inconnu: "Inconnu",
};

const TIMELINE_LABELS: Record<string, string> = {
  urgent: "Urgent",
  court: "< 3 mois",
  annee: "Cette année",
  exploration: "Exploration",
};

const BUDGET_LABELS: Record<string, string> = {
  less10: "< 10 k€",
  "10-20": "10-20 k€",
  "20-40": "20-40 k€",
  "40plus": "> 40 k€",
  inconnu: "Non précisé",
};

const CHANNEL_LABELS: Record<string, string> = {
  phone: "Téléphone",
  email: "Email",
  sms: "SMS",
  whatsapp: "WhatsApp",
};

const STATUS_LABELS: Record<string, string> = {
  nouveau: "Nouveau",
  contacte: "Contacté",
  devis_envoye: "Devis envoyé",
  converti: "Converti",
  perdu: "Perdu",
};

const LEVEL_LABELS: Record<string, string> = {
  hot: "Chaud",
  warm: "Tiède",
  cold: "Froid",
};

export async function GET(req: Request) {
  const auth = await requireAdminApi(req);
  if (!auth.ok) return auth.response;

  const url = new URL(req.url);
  const from = url.searchParams.get("from");
  const to = url.searchParams.get("to");
  const status = url.searchParams.get("status");
  const level = url.searchParams.get("level");

  let leads = await listLeads();

  if (from) {
    const fromMs = new Date(from).getTime();
    if (!Number.isNaN(fromMs)) {
      leads = leads.filter((l) => new Date(l.submittedAt).getTime() >= fromMs);
    }
  }
  if (to) {
    const toMs = new Date(to).getTime() + 86_400_000; // inclusif jusqu'à fin de journée
    if (!Number.isNaN(toMs)) {
      leads = leads.filter((l) => new Date(l.submittedAt).getTime() < toMs);
    }
  }
  if (status) leads = leads.filter((l) => l.status === status);
  if (level) leads = leads.filter((l) => l.level === level);

  // BOM UTF-8 pour qu'Excel ouvre proprement les accents
  let csv = "﻿" + COL_HEADERS.map(csvCell).join(",") + "\r\n";

  for (const l of leads) {
    const services = l.services.map((s) => SERVICE_LABELS[s]).join(" · ");
    const row = [
      l.reference,
      new Date(l.submittedAt).toLocaleString("fr-FR"),
      STATUS_LABELS[l.status] ?? l.status,
      l.score ?? "",
      l.level ? LEVEL_LABELS[l.level] : "",
      l.fullName,
      l.email,
      l.phone,
      CHANNEL_LABELS[l.preferredChannel] ?? l.preferredChannel,
      services,
      BUILDING_LABELS[l.buildingType] ?? l.buildingType,
      CONSTRUCTION_LABELS[l.construction] ?? l.construction,
      l.surface,
      ENERGY_LABELS[l.currentEnergy] ?? l.currentEnergy,
      l.commune,
      TIMELINE_LABELS[l.timeline] ?? l.timeline,
      BUDGET_LABELS[l.budget] ?? l.budget,
      l.photoUrls.length,
      l.message ?? "",
      l.source,
      l.notes ?? "",
    ];
    csv += row.map(csvCell).join(",") + "\r\n";
  }

  const today = new Date().toISOString().slice(0, 10);
  const filename = `leads-chauffage-artisanal-${today}.csv`;

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
