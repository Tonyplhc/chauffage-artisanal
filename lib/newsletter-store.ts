/**
 * Store newsletter avec double opt-in.
 *
 * Flow :
 *   1. POST /api/newsletter avec email → status="pending", token HMAC envoyé par email
 *   2. Click sur lien /api/newsletter/confirm?email=…&t=… → status="confirmed"
 *   3. POST /api/newsletter/unsubscribe?email=…&t=… → status="unsubscribed"
 *
 * Persistance dev : `data/newsletter.json`. En prod, table Supabase.
 */

import { promises as fs } from "node:fs";
import path from "node:path";
import { createHmac, timingSafeEqual } from "node:crypto";

const DATA_DIR = path.join(process.cwd(), "data");
const NEWSLETTER_FILE = path.join(DATA_DIR, "newsletter.json");

export type NewsletterStatus = "pending" | "confirmed" | "unsubscribed";

export type NewsletterEntry = {
  email: string;
  status: NewsletterStatus;
  createdAt: string;
  confirmedAt?: string;
  unsubscribedAt?: string;
  source?: string;
};

async function ensureDir() {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
  } catch {}
}

async function readAll(): Promise<NewsletterEntry[]> {
  try {
    return JSON.parse(await fs.readFile(NEWSLETTER_FILE, "utf8"));
  } catch {
    return [];
  }
}

async function writeAll(list: NewsletterEntry[]): Promise<void> {
  await ensureDir();
  await fs.writeFile(NEWSLETTER_FILE, JSON.stringify(list, null, 2), "utf8");
}

export async function listNewsletter(): Promise<NewsletterEntry[]> {
  return (await readAll()).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}

export async function upsertPending(email: string, source = "/footer"): Promise<NewsletterEntry> {
  const normalized = email.toLowerCase().trim();
  const all = await readAll();
  const existing = all.find((e) => e.email === normalized);
  if (existing) {
    if (existing.status === "confirmed") return existing;
    existing.status = "pending";
    existing.createdAt = new Date().toISOString();
    await writeAll(all);
    return existing;
  }
  const entry: NewsletterEntry = {
    email: normalized,
    status: "pending",
    createdAt: new Date().toISOString(),
    source,
  };
  all.push(entry);
  await writeAll(all);
  return entry;
}

export async function confirmEmail(email: string): Promise<NewsletterEntry | null> {
  const normalized = email.toLowerCase().trim();
  const all = await readAll();
  const entry = all.find((e) => e.email === normalized);
  if (!entry) return null;
  entry.status = "confirmed";
  entry.confirmedAt = new Date().toISOString();
  await writeAll(all);
  return entry;
}

export async function unsubscribe(email: string): Promise<NewsletterEntry | null> {
  const normalized = email.toLowerCase().trim();
  const all = await readAll();
  const entry = all.find((e) => e.email === normalized);
  if (!entry) return null;
  entry.status = "unsubscribed";
  entry.unsubscribedAt = new Date().toISOString();
  await writeAll(all);
  return entry;
}

/* ─────────────── Token HMAC ─────────────── */

function secret(): string {
  const s = process.env.SESSION_SECRET;
  if (s && s.length >= 16) return s;
  if (process.env.NODE_ENV === "production") {
    throw new Error("[newsletter] SESSION_SECRET manquant en production");
  }
  return "dev-only-secret-change-me-in-prod-32chars-minimum";
}

export function makeNewsletterToken(email: string, action: "confirm" | "unsubscribe"): string {
  return createHmac("sha256", secret())
    .update(`${action}:${email.toLowerCase().trim()}`)
    .digest("base64url")
    .slice(0, 32);
}

export function verifyNewsletterToken(
  email: string,
  action: "confirm" | "unsubscribe",
  token: string | undefined,
): boolean {
  if (!token) return false;
  const expected = makeNewsletterToken(email, action);
  if (token.length !== expected.length) return false;
  try {
    return timingSafeEqual(Buffer.from(token), Buffer.from(expected));
  } catch {
    return false;
  }
}
