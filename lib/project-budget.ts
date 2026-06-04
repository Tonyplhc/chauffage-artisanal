/**
 * Suivi budgétaire des projets convertis : prévu (devis) vs réalisé (facture
 * + heures pointées × taux horaires).
 *
 * Méthodologie simplifiée :
 *   - Prévu HT      = devis HT
 *   - Réalisé HT    = somme factures émises HT
 *   - Coût matériel = 50% du HT (estimation indicative — à affiner avec
 *     prix fournisseurs réels)
 *   - Coût main-d'œuvre = somme (slots pointés × taux horaire technicien)
 *   - Marge brute estimée = Réalisé HT - coûts estimés
 *
 * Volontairement indicatif. Pour précision réelle, il faudrait coupler aux
 * factures fournisseur (à implémenter).
 */

import { listLeads } from "./leads-store";
import { promises as fs } from "node:fs";
import path from "node:path";
import { listInvoicesForLead, computeTotals } from "./invoices-store";
import { listSlots, slotActualMinutes } from "./dispatch-store";
import { getProfileByEmail } from "./tech-profiles-store";

const DATA_DIR = path.join(process.cwd(), "data");
const QUOTES_FILE = path.join(DATA_DIR, "quotes.json");

const MATERIAL_COST_RATIO = 0.5; // 50% du HT = coût matériel estimé

type StoredQuote = {
  leadReference: string;
  status: string;
  tvaRate: number;
  lines: { quantity: number; unitPrice: number }[];
};

async function readQuotes(): Promise<StoredQuote[]> {
  try {
    return JSON.parse(await fs.readFile(QUOTES_FILE, "utf8"));
  } catch {
    return [];
  }
}

export type ProjectBudget = {
  leadReference: string;
  fullName: string;
  /** Devis HT accepté. */
  quoteHt: number;
  quoteTtc: number;
  /** Réalisé via factures. */
  invoicedHt: number;
  invoicedTtc: number;
  /** Cumul heures pointées (toutes interventions). */
  workedMinutes: number;
  /** Coûts estimés. */
  estimatedMaterialCost: number;
  estimatedLaborCost: number;
  estimatedTotalCost: number;
  /** Marge brute estimée. */
  grossMarginEur: number;
  grossMarginPct: number | null;
  /** Écart prévu vs réalisé. */
  varianceHtEur: number;
  varianceHtPct: number | null;
};

function computeQuoteTotals(q: StoredQuote): { ht: number; ttc: number } {
  const ht = q.lines.reduce((s, l) => s + l.quantity * l.unitPrice, 0);
  const ttc = ht * (1 + q.tvaRate / 100);
  return { ht: Math.round(ht), ttc: Math.round(ttc) };
}

export async function listBudgets(): Promise<ProjectBudget[]> {
  const [leads, quotes] = await Promise.all([listLeads(), readQuotes()]);
  const converted = leads.filter((l) => l.status === "converti");
  const out: ProjectBudget[] = [];

  for (const lead of converted) {
    const quote = quotes.find((q) => q.leadReference === lead.reference);
    const { ht: quoteHt, ttc: quoteTtc } = quote
      ? computeQuoteTotals(quote)
      : { ht: 0, ttc: 0 };

    const invoices = await listInvoicesForLead(lead.reference);
    let invoicedHt = 0;
    let invoicedTtc = 0;
    for (const inv of invoices) {
      const totals = computeTotals(inv);
      invoicedHt += totals.htAmount;
      invoicedTtc += totals.ttcAmount;
    }
    invoicedHt = Math.round(invoicedHt);
    invoicedTtc = Math.round(invoicedTtc);

    // Heures pointées via slots ayant lead reference et clock complet
    const allSlots = await listSlots({});
    let workedMinutes = 0;
    let laborCost = 0;
    for (const s of allSlots) {
      if (s.leadReference !== lead.reference) continue;
      const minutes = slotActualMinutes(s);
      if (minutes === null) continue;
      workedMinutes += minutes;
      // Taux horaire selon profil tech
      const profile = await getProfileByEmail(s.technicianEmail);
      const rate = profile?.hourlyRateEur ?? 45; // défaut 45 €/h
      laborCost += (minutes / 60) * rate;
    }
    const estimatedLaborCost = Math.round(laborCost);
    const estimatedMaterialCost = Math.round(invoicedHt * MATERIAL_COST_RATIO);
    const estimatedTotalCost = estimatedLaborCost + estimatedMaterialCost;
    const grossMarginEur = invoicedHt - estimatedTotalCost;
    const grossMarginPct =
      invoicedHt > 0 ? Math.round((grossMarginEur / invoicedHt) * 100) : null;

    const varianceHtEur = invoicedHt - quoteHt;
    const varianceHtPct =
      quoteHt > 0 ? Math.round((varianceHtEur / quoteHt) * 100) : null;

    out.push({
      leadReference: lead.reference,
      fullName: lead.fullName,
      quoteHt,
      quoteTtc,
      invoicedHt,
      invoicedTtc,
      workedMinutes,
      estimatedMaterialCost,
      estimatedLaborCost,
      estimatedTotalCost,
      grossMarginEur,
      grossMarginPct,
      varianceHtEur,
      varianceHtPct,
    });
  }

  return out.sort((a, b) => b.invoicedHt - a.invoicedHt);
}

export type BudgetStats = {
  projects: number;
  totalQuoteHt: number;
  totalInvoicedHt: number;
  totalEstimatedCost: number;
  totalGrossMargin: number;
  averageMarginPct: number | null;
};

export async function computeStats(): Promise<BudgetStats> {
  const budgets = await listBudgets();
  const stats: BudgetStats = {
    projects: budgets.length,
    totalQuoteHt: 0,
    totalInvoicedHt: 0,
    totalEstimatedCost: 0,
    totalGrossMargin: 0,
    averageMarginPct: null,
  };
  const pcts: number[] = [];
  for (const b of budgets) {
    stats.totalQuoteHt += b.quoteHt;
    stats.totalInvoicedHt += b.invoicedHt;
    stats.totalEstimatedCost += b.estimatedTotalCost;
    stats.totalGrossMargin += b.grossMarginEur;
    if (b.grossMarginPct !== null) pcts.push(b.grossMarginPct);
  }
  stats.averageMarginPct =
    pcts.length === 0
      ? null
      : Math.round(pcts.reduce((a, b) => a + b, 0) / pcts.length);
  return stats;
}
