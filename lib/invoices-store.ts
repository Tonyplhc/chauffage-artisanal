/**
 * Module de facturation post-acceptation devis.
 *
 * Génère des factures officielles avec numérotation séquentielle annuelle
 * (FAC-YYYY-NNNN). Mentions légales tirées de brand-settings.
 *
 * Statuts :
 *   draft   : brouillon admin
 *   sent    : envoyée au client (mail / impression)
 *   paid    : payée (manuellement marquée ou via webhook paiement)
 *   void    : annulée (jamais supprimée — traçabilité comptable)
 *
 * Format des lignes : identique à QuoteLine pour pouvoir copier depuis un
 * devis accepté en 1 clic.
 */

import { promises as fs } from "node:fs";
import path from "node:path";
import { randomBytes } from "node:crypto";
import { getQuote } from "./quotes-store";

const DATA_DIR = path.join(process.cwd(), "data");
const INVOICES_FILE = path.join(DATA_DIR, "invoices.json");

export type InvoiceStatus = "draft" | "sent" | "paid" | "void";

export type InvoiceLine = {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  unit: string;
};

export type Invoice = {
  id: string;
  number: string; // FAC-YYYY-NNNN
  leadReference: string;
  quoteNumber?: string;
  clientName: string;
  clientEmail?: string;
  clientAddress?: string;
  status: InvoiceStatus;
  issueDate: string; // ISO
  dueDate?: string; // ISO
  paidAt?: string;
  sentAt?: string;
  lines: InvoiceLine[];
  tvaRate: number; // %
  notes?: string;
  createdAt: string;
  updatedAt: string;
};

async function ensureDir() {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
  } catch {}
}

async function readAll(): Promise<Invoice[]> {
  try {
    return JSON.parse(await fs.readFile(INVOICES_FILE, "utf8"));
  } catch {
    return [];
  }
}

async function writeAll(arr: Invoice[]) {
  await ensureDir();
  await fs.writeFile(INVOICES_FILE, JSON.stringify(arr, null, 2), "utf8");
}

function makeId(): string {
  return `inv-${randomBytes(6).toString("hex")}`;
}

function makeLineId(): string {
  return `il-${randomBytes(4).toString("hex")}`;
}

/** Génère le prochain numéro de facture pour l'année donnée. */
async function nextInvoiceNumber(year: number): Promise<string> {
  const all = await readAll();
  const prefix = `FAC-${year}-`;
  let maxN = 0;
  for (const inv of all) {
    if (inv.number.startsWith(prefix)) {
      const n = parseInt(inv.number.slice(prefix.length), 10);
      if (!isNaN(n) && n > maxN) maxN = n;
    }
  }
  return `${prefix}${String(maxN + 1).padStart(4, "0")}`;
}

/* ─────────────── Reads ─────────────── */

export async function listInvoices(): Promise<Invoice[]> {
  const all = await readAll();
  return [...all].sort(
    (a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}

export async function listInvoicesForLead(
  leadReference: string,
): Promise<Invoice[]> {
  const all = await readAll();
  return all
    .filter((i) => i.leadReference === leadReference)
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
}

export async function getInvoice(id: string): Promise<Invoice | null> {
  const all = await readAll();
  return all.find((i) => i.id === id) ?? null;
}

/* ─────────────── Mutations ─────────────── */

export async function createInvoice(input: {
  leadReference: string;
  clientName: string;
  clientEmail?: string;
  clientAddress?: string;
  lines: Omit<InvoiceLine, "id">[];
  tvaRate: number;
  quoteNumber?: string;
  notes?: string;
  dueDate?: string;
}): Promise<Invoice> {
  const now = new Date();
  const year = now.getUTCFullYear();
  const number = await nextInvoiceNumber(year);
  const invoice: Invoice = {
    id: makeId(),
    number,
    leadReference: input.leadReference,
    quoteNumber: input.quoteNumber,
    clientName: input.clientName.trim().slice(0, 200),
    clientEmail: input.clientEmail?.trim().slice(0, 200) || undefined,
    clientAddress: input.clientAddress?.trim().slice(0, 500) || undefined,
    status: "draft",
    issueDate: now.toISOString(),
    dueDate: input.dueDate,
    lines: input.lines.slice(0, 100).map((l) => ({
      id: makeLineId(),
      description: String(l.description ?? "").slice(0, 500),
      quantity: Number(l.quantity) || 0,
      unitPrice: Number(l.unitPrice) || 0,
      unit: String(l.unit ?? "forfait").slice(0, 20),
    })),
    tvaRate: Math.max(0, Math.min(100, Number(input.tvaRate))),
    notes: input.notes?.slice(0, 2000),
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
  };
  const all = await readAll();
  all.push(invoice);
  await writeAll(all);
  return invoice;
}

export async function createInvoiceFromQuote(
  leadReference: string,
): Promise<Invoice | null> {
  const quote = await getQuote(leadReference);
  if (!quote) return null;
  // On copie les lignes du devis tel quel
  return await createInvoice({
    leadReference,
    quoteNumber: quote.number,
    clientName: quote.signature?.signerName ?? "Client",
    lines: quote.lines.map((l) => ({
      description: l.description,
      quantity: l.quantity,
      unitPrice: l.unitPrice,
      unit: l.unit ?? "forfait",
    })),
    tvaRate: quote.tvaRate,
    notes: `Facture émise sur la base du devis n° ${quote.number ?? "(sans numéro)"}.`,
  });
}

export async function updateInvoice(
  id: string,
  patch: Partial<
    Pick<
      Invoice,
      | "clientName"
      | "clientEmail"
      | "clientAddress"
      | "status"
      | "lines"
      | "tvaRate"
      | "notes"
      | "dueDate"
      | "issueDate"
    >
  >,
): Promise<Invoice | null> {
  const all = await readAll();
  const idx = all.findIndex((i) => i.id === id);
  if (idx === -1) return null;
  const cur = all[idx];
  const next: Invoice = { ...cur };
  if (patch.clientName !== undefined) next.clientName = patch.clientName.trim();
  if (patch.clientEmail !== undefined)
    next.clientEmail = patch.clientEmail.trim() || undefined;
  if (patch.clientAddress !== undefined)
    next.clientAddress = patch.clientAddress.trim() || undefined;
  if (patch.lines !== undefined) {
    next.lines = patch.lines.slice(0, 100).map((l) => ({
      id: l.id || makeLineId(),
      description: String(l.description ?? "").slice(0, 500),
      quantity: Number(l.quantity) || 0,
      unitPrice: Number(l.unitPrice) || 0,
      unit: String(l.unit ?? "forfait").slice(0, 20),
    }));
  }
  if (patch.tvaRate !== undefined)
    next.tvaRate = Math.max(0, Math.min(100, Number(patch.tvaRate)));
  if (patch.notes !== undefined) next.notes = patch.notes.slice(0, 2000);
  if (patch.dueDate !== undefined) next.dueDate = patch.dueDate || undefined;
  if (patch.issueDate !== undefined) next.issueDate = patch.issueDate;
  if (patch.status !== undefined) {
    next.status = patch.status;
    if (patch.status === "paid" && !cur.paidAt) {
      next.paidAt = new Date().toISOString();
    }
    if (patch.status === "sent" && !cur.sentAt) {
      next.sentAt = new Date().toISOString();
    }
  }
  next.updatedAt = new Date().toISOString();
  all[idx] = next;
  await writeAll(all);
  return next;
}

/* ─────────────── Totaux ─────────────── */

export type InvoiceTotals = {
  htAmount: number;
  tvaAmount: number;
  ttcAmount: number;
};

export function computeTotals(
  invoice: Pick<Invoice, "lines" | "tvaRate">,
): InvoiceTotals {
  const htAmount = invoice.lines.reduce(
    (s, l) => s + l.quantity * l.unitPrice,
    0,
  );
  const tvaAmount = htAmount * (invoice.tvaRate / 100);
  const ttcAmount = htAmount + tvaAmount;
  return {
    htAmount: Math.round(htAmount * 100) / 100,
    tvaAmount: Math.round(tvaAmount * 100) / 100,
    ttcAmount: Math.round(ttcAmount * 100) / 100,
  };
}

export type InvoiceStats = {
  total: number;
  draft: number;
  sent: number;
  paid: number;
  void: number;
  amountPaid: number;
  amountOutstanding: number;
};

export async function computeStats(): Promise<InvoiceStats> {
  const all = await readAll();
  const stats: InvoiceStats = {
    total: all.length,
    draft: 0,
    sent: 0,
    paid: 0,
    void: 0,
    amountPaid: 0,
    amountOutstanding: 0,
  };
  for (const inv of all) {
    stats[inv.status] += 1;
    const totals = computeTotals(inv);
    if (inv.status === "paid") stats.amountPaid += totals.ttcAmount;
    if (inv.status === "sent") stats.amountOutstanding += totals.ttcAmount;
  }
  return stats;
}
