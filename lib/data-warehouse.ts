/**
 * Exports structurés warehouse-ready par entité.
 *
 * Schéma stable : noms de colonnes en snake_case, types explicites côté
 * sérialisation CSV. Format JSON exposé en parallèle pour BI moderne.
 */

import { listLeads } from "./leads-store";
import { listInvoices, computeTotals } from "./invoices-store";
import { promises as fs } from "node:fs";
import path from "node:path";

const DATA_DIR = path.join(process.cwd(), "data");
const QUOTES_FILE = path.join(DATA_DIR, "quotes.json");

type StoredQuote = {
  leadReference: string;
  number?: string;
  status: string;
  tvaRate: number;
  createdAt?: string;
  sentAt?: string;
  lines: { quantity: number; unitPrice: number }[];
  signature?: { signedAt?: string; signerName?: string };
};

async function readQuotes(): Promise<StoredQuote[]> {
  try {
    return JSON.parse(await fs.readFile(QUOTES_FILE, "utf8"));
  } catch {
    return [];
  }
}

/* ─────────────── CSV helper ─────────────── */

export function rowsToCsv(
  headers: string[],
  rows: (string | number | boolean | null | undefined)[][],
): string {
  const escape = (v: string | number | boolean | null | undefined): string => {
    if (v === null || v === undefined) return "";
    const s = String(v);
    if (/[",;\n\r]/.test(s)) {
      return `"${s.replace(/"/g, '""')}"`;
    }
    return s;
  };
  const out = [headers.join(";")];
  for (const row of rows) {
    out.push(row.map(escape).join(";"));
  }
  // BOM UTF-8 pour Excel
  return "﻿" + out.join("\n");
}

/* ─────────────── Datasets ─────────────── */

export async function exportLeads(): Promise<{
  rows: Record<string, unknown>[];
  csv: string;
}> {
  const leads = await listLeads();
  const headers = [
    "reference",
    "full_name",
    "email",
    "phone",
    "commune",
    "status",
    "level",
    "score",
    "services",
    "building_type",
    "construction",
    "current_energy",
    "surface_m2",
    "timeline",
    "budget",
    "submitted_at",
    "converted_at",
    "assigned_to",
    "utm_source",
    "utm_campaign",
  ];
  const rows = leads.map((l) => {
    const history = l.statusHistory ?? [];
    let convertedAt: string | null = null;
    for (let i = history.length - 1; i >= 0; i--) {
      if (history[i].to === "converti") {
        convertedAt = history[i].at;
        break;
      }
    }
    const meta = l.metadata as
      | { source?: { utmSource?: string; utmCampaign?: string } }
      | undefined;
    return {
      reference: l.reference,
      full_name: l.fullName,
      email: l.email,
      phone: l.phone,
      commune: l.commune,
      status: l.status,
      level: l.level ?? "",
      score: l.score ?? "",
      services: l.services.join("|"),
      building_type: l.buildingType,
      construction: l.construction,
      current_energy: l.currentEnergy,
      surface_m2: l.surface,
      timeline: l.timeline,
      budget: l.budget,
      submitted_at: l.submittedAt,
      converted_at: convertedAt ?? "",
      assigned_to: l.assignedTo ?? "",
      utm_source: meta?.source?.utmSource ?? "",
      utm_campaign: meta?.source?.utmCampaign ?? "",
    };
  });
  const csv = rowsToCsv(
    headers,
    rows.map((r) => headers.map((h) => (r as Record<string, unknown>)[h] as never)),
  );
  return { rows, csv };
}

export async function exportQuotes(): Promise<{
  rows: Record<string, unknown>[];
  csv: string;
}> {
  const quotes = await readQuotes();
  const headers = [
    "lead_reference",
    "number",
    "status",
    "tva_rate",
    "ht_amount",
    "tva_amount",
    "ttc_amount",
    "line_count",
    "created_at",
    "sent_at",
    "signed_at",
    "signer_name",
  ];
  const rows = quotes.map((q) => {
    const ht = q.lines.reduce((s, l) => s + l.quantity * l.unitPrice, 0);
    const tva = ht * (q.tvaRate / 100);
    return {
      lead_reference: q.leadReference,
      number: q.number ?? "",
      status: q.status,
      tva_rate: q.tvaRate,
      ht_amount: Math.round(ht * 100) / 100,
      tva_amount: Math.round(tva * 100) / 100,
      ttc_amount: Math.round((ht + tva) * 100) / 100,
      line_count: q.lines.length,
      created_at: q.createdAt ?? "",
      sent_at: q.sentAt ?? "",
      signed_at: q.signature?.signedAt ?? "",
      signer_name: q.signature?.signerName ?? "",
    };
  });
  const csv = rowsToCsv(
    headers,
    rows.map((r) => headers.map((h) => (r as Record<string, unknown>)[h] as never)),
  );
  return { rows, csv };
}

export async function exportInvoices(): Promise<{
  rows: Record<string, unknown>[];
  csv: string;
}> {
  const all = await listInvoices();
  const headers = [
    "number",
    "lead_reference",
    "client_name",
    "client_email",
    "status",
    "issue_date",
    "due_date",
    "sent_at",
    "paid_at",
    "tva_rate",
    "ht_amount",
    "tva_amount",
    "ttc_amount",
    "quote_number",
  ];
  const rows = all.map((inv) => {
    const totals = computeTotals(inv);
    return {
      number: inv.number,
      lead_reference: inv.leadReference,
      client_name: inv.clientName,
      client_email: inv.clientEmail ?? "",
      status: inv.status,
      issue_date: inv.issueDate,
      due_date: inv.dueDate ?? "",
      sent_at: inv.sentAt ?? "",
      paid_at: inv.paidAt ?? "",
      tva_rate: inv.tvaRate,
      ht_amount: totals.htAmount,
      tva_amount: totals.tvaAmount,
      ttc_amount: totals.ttcAmount,
      quote_number: inv.quoteNumber ?? "",
    };
  });
  const csv = rowsToCsv(
    headers,
    rows.map((r) => headers.map((h) => (r as Record<string, unknown>)[h] as never)),
  );
  return { rows, csv };
}

export async function exportEvents(): Promise<{
  rows: Record<string, unknown>[];
  csv: string;
}> {
  const leads = await listLeads();
  const headers = [
    "lead_reference",
    "event_type",
    "from_status",
    "to_status",
    "at",
  ];
  const rows: Record<string, unknown>[] = [];
  for (const lead of leads) {
    rows.push({
      lead_reference: lead.reference,
      event_type: "lead_created",
      from_status: "",
      to_status: "nouveau",
      at: lead.submittedAt,
    });
    for (const t of lead.statusHistory ?? []) {
      rows.push({
        lead_reference: lead.reference,
        event_type: "status_changed",
        from_status: t.from,
        to_status: t.to,
        at: t.at,
      });
    }
  }
  rows.sort((a, b) => String(a.at).localeCompare(String(b.at)));
  const csv = rowsToCsv(
    headers,
    rows.map((r) => headers.map((h) => (r as Record<string, unknown>)[h] as never)),
  );
  return { rows, csv };
}
