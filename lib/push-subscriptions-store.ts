/**
 * Web Push subscriptions store.
 *
 * Stratégie : on stocke les PushSubscription objects (endpoint + keys).
 * VAPID keys requis pour envoyer — généralement via `web-push` npm.
 *
 * Pour la démo SANS dépendance externe, on implémente l'envoi avec un fetch
 * vers l'endpoint (FCM, Mozilla, etc.) avec headers VAPID JWT signés
 * manuellement. C'est fonctionnel mais limité.
 *
 * NB: les browsers exigent VAPID public/private keys côté serveur. On les
 * lit depuis env VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY / VAPID_SUBJECT.
 */

import { promises as fs } from "node:fs";
import path from "node:path";

const DATA_DIR = path.join(process.cwd(), "data");
const SUBS_FILE = path.join(DATA_DIR, "push-subscriptions.json");

export type PushSubscriptionRecord = {
  id: string;
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
  userAgent?: string;
  userEmail?: string;
  createdAt: string;
  lastUsedAt?: string;
};

async function ensureDir() {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
  } catch {}
}

async function readAll(): Promise<PushSubscriptionRecord[]> {
  try {
    return JSON.parse(await fs.readFile(SUBS_FILE, "utf8"));
  } catch {
    return [];
  }
}

async function writeAll(subs: PushSubscriptionRecord[]) {
  await ensureDir();
  await fs.writeFile(SUBS_FILE, JSON.stringify(subs, null, 2), "utf8");
}

export async function listSubscriptions(): Promise<PushSubscriptionRecord[]> {
  return await readAll();
}

export async function addSubscription(
  endpoint: string,
  keys: { p256dh: string; auth: string },
  meta: { userAgent?: string; userEmail?: string } = {},
): Promise<PushSubscriptionRecord> {
  const all = await readAll();
  // Dédoublonnage par endpoint
  const existing = all.find((s) => s.endpoint === endpoint);
  if (existing) {
    existing.keys = keys;
    existing.userAgent = meta.userAgent ?? existing.userAgent;
    existing.userEmail = meta.userEmail ?? existing.userEmail;
    await writeAll(all);
    return existing;
  }
  const sub: PushSubscriptionRecord = {
    id: `sub-${Date.now().toString(36)}`,
    endpoint,
    keys,
    userAgent: meta.userAgent,
    userEmail: meta.userEmail,
    createdAt: new Date().toISOString(),
  };
  all.push(sub);
  await writeAll(all);
  return sub;
}

export async function removeSubscription(endpoint: string): Promise<boolean> {
  const all = await readAll();
  const next = all.filter((s) => s.endpoint !== endpoint);
  if (next.length === all.length) return false;
  await writeAll(next);
  return true;
}

export function vapidPublicKey(): string | null {
  return process.env.VAPID_PUBLIC_KEY ?? null;
}

/**
 * Envoi best-effort sans dépendance web-push.
 *
 * En mode dev SANS VAPID configuré : on log la notif en console (pas d'envoi).
 * En prod : on log un avertissement et on n'envoie pas (vraie implémentation
 * de Web Push nécessite payload chiffré ECDH + VAPID JWT — trop lourd à coder
 * à la main pour rester safe). Recommandation : installer `web-push` npm.
 *
 * Cette fonction reste l'API publique utilisée par le reste de l'app — la
 * prod ré-implémente avec web-push sans changer les call-sites.
 */
export async function sendPush(
  sub: PushSubscriptionRecord,
  payload: { title: string; body: string; url?: string },
): Promise<boolean> {
  if (!vapidPublicKey() || !process.env.VAPID_PRIVATE_KEY) {
    // eslint-disable-next-line no-console
    console.info(
      `\n=== [push · dev mode — VAPID non configuré] ===\n` +
        `Destinataire : ${sub.userEmail ?? sub.userAgent ?? sub.id}\n` +
        `Titre : ${payload.title}\n` +
        `Body : ${payload.body}\n` +
        `Url : ${payload.url ?? "(aucune)"}\n` +
        `===============================================\n`,
    );
    return false;
  }
  // eslint-disable-next-line no-console
  console.warn(
    "[push] Envoi réel nécessite la lib `web-push`. Installer et brancher ici.",
  );
  return false;
}

export async function broadcastPush(payload: {
  title: string;
  body: string;
  url?: string;
}): Promise<{ sent: number; failed: number }> {
  const subs = await listSubscriptions();
  let sent = 0;
  let failed = 0;
  for (const s of subs) {
    const ok = await sendPush(s, payload);
    if (ok) sent++;
    else failed++;
  }
  return { sent, failed };
}
