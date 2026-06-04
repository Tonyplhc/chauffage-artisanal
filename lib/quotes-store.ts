/**
 * Store des devis officiels — un devis par lead max pour la démo.
 *
 * Persistance dev : data/quotes.json (indexé par leadReference).
 */

import { promises as fs } from "node:fs";
import path from "node:path";
import type { Quote } from "./quote-schema";

const DATA_DIR = path.join(process.cwd(), "data");
const QUOTES_FILE = path.join(DATA_DIR, "quotes.json");

async function ensureDir() {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
  } catch {}
}

async function readAll(): Promise<Quote[]> {
  try {
    return JSON.parse(await fs.readFile(QUOTES_FILE, "utf8"));
  } catch {
    return [];
  }
}

async function writeAll(quotes: Quote[]) {
  await ensureDir();
  await fs.writeFile(QUOTES_FILE, JSON.stringify(quotes, null, 2), "utf8");
}

export async function getQuote(leadReference: string): Promise<Quote | undefined> {
  const all = await readAll();
  return all.find((q) => q.leadReference === leadReference);
}

export async function upsertQuote(quote: Quote): Promise<Quote> {
  const all = await readAll();
  const idx = all.findIndex((q) => q.leadReference === quote.leadReference);
  const now = new Date().toISOString();
  const next: Quote = {
    ...quote,
    updatedAt: now,
    createdAt: quote.createdAt ?? now,
  };
  if (idx === -1) all.push(next);
  else all[idx] = next;
  await writeAll(all);
  return next;
}

export async function deleteQuote(leadReference: string): Promise<boolean> {
  const all = await readAll();
  const next = all.filter((q) => q.leadReference !== leadReference);
  if (next.length === all.length) return false;
  await writeAll(next);
  return true;
}

export async function markSent(leadReference: string): Promise<Quote | undefined> {
  const all = await readAll();
  const q = all.find((x) => x.leadReference === leadReference);
  if (!q) return undefined;
  q.status = "sent";
  q.sentAt = new Date().toISOString();
  await writeAll(all);
  return q;
}

export async function markDecision(
  leadReference: string,
  decision: "accepted" | "refused",
  extra: { signature?: import("./quote-schema").QuoteSignature; refusalReason?: string },
): Promise<Quote | undefined> {
  const all = await readAll();
  const q = all.find((x) => x.leadReference === leadReference);
  if (!q) return undefined;
  q.status = decision;
  q.decidedAt = new Date().toISOString();
  if (extra.signature) q.signature = extra.signature;
  if (extra.refusalReason) q.refusalReason = extra.refusalReason;
  await writeAll(all);
  return q;
}
