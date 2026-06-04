/**
 * Webhooks personnalisables — configurables via UI admin.
 *
 * Permet de POST un payload JSON arbitraire vers une URL externe à chaque
 * occurrence d'un événement métier (lead.created, quote.accepted, etc.).
 *
 * Cas d'usage typiques :
 *   - Pousser vers un CRM externe
 *   - Trigger un Zapier / Make / n8n
 *   - Notifier Microsoft Teams via incoming webhook
 *   - Logger dans Datadog / Sentry custom event
 *
 * Sécurité : signature HMAC du payload avec `secret` configuré côté admin →
 * le récepteur peut vérifier l'origine.
 */

import { promises as fs } from "node:fs";
import path from "node:path";
import { createHmac } from "node:crypto";
import { z } from "zod";

const DATA_DIR = path.join(process.cwd(), "data");
const HOOKS_FILE = path.join(DATA_DIR, "custom-webhooks.json");

export const WEBHOOK_EVENTS = [
  "lead.created",
  "lead.status_changed",
  "lead.quote_sent",
  "lead.quote_accepted",
  "lead.quote_refused",
  "newsletter.subscribed",
  "newsletter.confirmed",
] as const;

export const CustomWebhookSchema = z.object({
  id: z.string().min(1).max(40),
  name: z.string().min(2).max(120),
  url: z.string().url().max(500),
  events: z.array(z.enum(WEBHOOK_EVENTS)).min(1),
  enabled: z.boolean().default(true),
  secret: z.string().max(120).optional(), // optional shared secret pour HMAC
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
  lastFiredAt: z.string().optional(),
  fireCount: z.number().int().min(0).default(0),
  failureCount: z.number().int().min(0).default(0),
});

export type CustomWebhook = z.infer<typeof CustomWebhookSchema>;
export type WebhookEvent = (typeof WEBHOOK_EVENTS)[number];

async function ensureDir() {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
  } catch {}
}

export async function listWebhooks(): Promise<CustomWebhook[]> {
  try {
    return JSON.parse(await fs.readFile(HOOKS_FILE, "utf8"));
  } catch {
    return [];
  }
}

export async function saveWebhook(hook: CustomWebhook): Promise<CustomWebhook> {
  const all = await listWebhooks();
  const idx = all.findIndex((h) => h.id === hook.id);
  const now = new Date().toISOString();
  const next: CustomWebhook = {
    ...hook,
    createdAt: hook.createdAt ?? now,
    updatedAt: now,
  };
  if (idx === -1) all.push(next);
  else all[idx] = next;
  await ensureDir();
  await fs.writeFile(HOOKS_FILE, JSON.stringify(all, null, 2), "utf8");
  return next;
}

export async function deleteWebhook(id: string): Promise<boolean> {
  const all = await listWebhooks();
  const filtered = all.filter((h) => h.id !== id);
  if (filtered.length === all.length) return false;
  await fs.writeFile(HOOKS_FILE, JSON.stringify(filtered, null, 2), "utf8");
  return true;
}

async function recordFire(id: string, success: boolean) {
  const all = await listWebhooks();
  const h = all.find((x) => x.id === id);
  if (!h) return;
  h.fireCount = (h.fireCount ?? 0) + 1;
  if (!success) h.failureCount = (h.failureCount ?? 0) + 1;
  h.lastFiredAt = new Date().toISOString();
  await fs.writeFile(HOOKS_FILE, JSON.stringify(all, null, 2), "utf8");
}

/* ─────────────── Fire un événement vers tous les webhooks abonnés ─────────────── */

export async function fireCustomWebhooks(
  event: WebhookEvent,
  payload: Record<string, unknown>,
): Promise<void> {
  const all = await listWebhooks();
  const targets = all.filter((h) => h.enabled && h.events.includes(event));
  for (const h of targets) {
    void deliverOne(h, event, payload);
  }
}

async function deliverOne(
  hook: CustomWebhook,
  event: WebhookEvent,
  payload: Record<string, unknown>,
): Promise<void> {
  const body = JSON.stringify({
    event,
    firedAt: new Date().toISOString(),
    payload,
  });

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "X-CA-Event": event,
    "X-CA-Webhook-Id": hook.id,
  };
  if (hook.secret) {
    const sig = createHmac("sha256", hook.secret).update(body).digest("hex");
    headers["X-CA-Signature"] = `sha256=${sig}`;
  }

  try {
    const res = await fetch(hook.url, {
      method: "POST",
      headers,
      body,
      signal: AbortSignal.timeout(5000),
    });
    await recordFire(hook.id, res.ok);
  } catch {
    await recordFire(hook.id, false);
  }
}

/* ─────────────── Test ad-hoc ─────────────── */

export async function testWebhook(hook: CustomWebhook): Promise<{
  ok: boolean;
  status?: number;
  error?: string;
}> {
  const body = JSON.stringify({
    event: "test",
    firedAt: new Date().toISOString(),
    payload: { message: "Test from Chauffage Artisanal admin" },
  });
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "X-CA-Event": "test",
    "X-CA-Webhook-Id": hook.id,
  };
  if (hook.secret) {
    const sig = createHmac("sha256", hook.secret).update(body).digest("hex");
    headers["X-CA-Signature"] = `sha256=${sig}`;
  }
  try {
    const res = await fetch(hook.url, {
      method: "POST",
      headers,
      body,
      signal: AbortSignal.timeout(5000),
    });
    return { ok: res.ok, status: res.status };
  } catch (e) {
    return { ok: false, error: String(e) };
  }
}
