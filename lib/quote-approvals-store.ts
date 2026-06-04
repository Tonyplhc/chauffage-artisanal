/**
 * Workflow de validation des devis avant envoi client.
 *
 * Pattern : l'admin qui prépare un devis peut demander une validation à un
 * collègue (ou manager) avant d'envoyer. Utile pour les gros montants ou les
 * configurations sensibles. Un seuil indicatif (`APPROVAL_THRESHOLD_EUR`) est
 * proposé mais l'usage reste volontaire — pas de blocage automatique.
 *
 * Pas de rôles séparés en V1 — tout admin peut valider, le but est la
 * traçabilité, pas la hiérarchie.
 */

import { promises as fs } from "node:fs";
import path from "node:path";
import { randomBytes } from "node:crypto";
import { getQuote } from "./quotes-store";
import { computeTotals } from "./quote-schema";

const DATA_DIR = path.join(process.cwd(), "data");
const APPROVALS_FILE = path.join(DATA_DIR, "quote-approvals.json");

/** Seuil indicatif pour suggérer une validation. Adaptable plus tard. */
export const APPROVAL_THRESHOLD_EUR = 15_000;

export type ApprovalStatus = "pending" | "approved" | "rejected" | "withdrawn";

export type QuoteApproval = {
  id: string;
  leadReference: string;
  quoteNumber?: string;
  /** Montant TTC du devis au moment de la demande (en EUR, arrondi). */
  amountTtc: number;
  notes?: string; // contexte fourni par le demandeur
  status: ApprovalStatus;
  requestedBy: string;
  requestedAt: string;
  reviewedBy?: string;
  reviewedAt?: string;
  reviewerComment?: string;
};

async function ensureDir() {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
  } catch {}
}

async function readAll(): Promise<QuoteApproval[]> {
  try {
    return JSON.parse(await fs.readFile(APPROVALS_FILE, "utf8"));
  } catch {
    return [];
  }
}

async function writeAll(arr: QuoteApproval[]) {
  await ensureDir();
  await fs.writeFile(APPROVALS_FILE, JSON.stringify(arr, null, 2), "utf8");
}

function makeId(): string {
  return `apv-${randomBytes(5).toString("hex")}`;
}

export async function listApprovals(opts: {
  status?: ApprovalStatus;
  leadReference?: string;
} = {}): Promise<QuoteApproval[]> {
  const all = await readAll();
  return all
    .filter((a) => {
      if (opts.status && a.status !== opts.status) return false;
      if (opts.leadReference && a.leadReference !== opts.leadReference)
        return false;
      return true;
    })
    .sort(
      (a, b) =>
        new Date(b.requestedAt).getTime() -
        new Date(a.requestedAt).getTime(),
    );
}

export async function getApproval(id: string): Promise<QuoteApproval | null> {
  const all = await readAll();
  return all.find((a) => a.id === id) ?? null;
}

export async function getLatestApprovalForLead(
  leadReference: string,
): Promise<QuoteApproval | null> {
  const all = await listApprovals({ leadReference });
  return all[0] ?? null;
}

export async function requestApproval(input: {
  leadReference: string;
  requestedBy: string;
  notes?: string;
}): Promise<QuoteApproval> {
  const quote = await getQuote(input.leadReference);
  if (!quote) throw new Error("Aucun devis trouvé pour ce lead");
  const totals = computeTotals({ lines: quote.lines, tvaRate: quote.tvaRate });
  const all = await readAll();
  // Retire la dernière demande pending s'il y en a une (remplace)
  const filtered = all.map((a) => {
    if (
      a.leadReference === input.leadReference &&
      a.status === "pending"
    ) {
      return {
        ...a,
        status: "withdrawn" as ApprovalStatus,
        reviewedAt: new Date().toISOString(),
        reviewerComment: "Remplacée par une nouvelle demande",
      };
    }
    return a;
  });
  const approval: QuoteApproval = {
    id: makeId(),
    leadReference: input.leadReference,
    quoteNumber: quote.number,
    amountTtc: Math.round(totals.ttcAmount),
    notes: input.notes?.slice(0, 1000),
    status: "pending",
    requestedBy: input.requestedBy,
    requestedAt: new Date().toISOString(),
  };
  filtered.push(approval);
  await writeAll(filtered);
  return approval;
}

export async function decideApproval(
  id: string,
  decision: "approved" | "rejected",
  reviewedBy: string,
  comment?: string,
): Promise<QuoteApproval | null> {
  const all = await readAll();
  const idx = all.findIndex((a) => a.id === id);
  if (idx === -1) return null;
  if (all[idx].status !== "pending") {
    throw new Error("Cette demande a déjà été traitée");
  }
  // Garde-fou : on n'auto-bloque pas le self-approval mais on log
  const next: QuoteApproval = {
    ...all[idx],
    status: decision,
    reviewedBy,
    reviewedAt: new Date().toISOString(),
    reviewerComment: comment?.slice(0, 1000),
  };
  all[idx] = next;
  await writeAll(all);
  return next;
}

export async function withdrawApproval(
  id: string,
  callerEmail: string,
): Promise<QuoteApproval | null> {
  const all = await readAll();
  const idx = all.findIndex((a) => a.id === id);
  if (idx === -1) return null;
  const cur = all[idx];
  if (cur.status !== "pending") return cur;
  if (cur.requestedBy !== callerEmail) {
    throw new Error("Seul l'auteur de la demande peut la retirer");
  }
  const next: QuoteApproval = {
    ...cur,
    status: "withdrawn",
    reviewedAt: new Date().toISOString(),
    reviewedBy: callerEmail,
    reviewerComment: "Retirée par l'auteur",
  };
  all[idx] = next;
  await writeAll(all);
  return next;
}

/* ─────────────── Stats ─────────────── */

export type ApprovalStats = {
  pending: number;
  approved: number;
  rejected: number;
  withdrawn: number;
  amountPending: number;
};

export async function computeStats(): Promise<ApprovalStats> {
  const all = await readAll();
  const stats: ApprovalStats = {
    pending: 0,
    approved: 0,
    rejected: 0,
    withdrawn: 0,
    amountPending: 0,
  };
  for (const a of all) {
    stats[a.status] += 1;
    if (a.status === "pending") stats.amountPending += a.amountTtc;
  }
  return stats;
}
