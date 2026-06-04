/**
 * Email tracking — opens + clicks.
 *
 * Open : pixel transparent 1x1 GIF inséré dans le HTML email
 *   → GET /api/email-track/o/<tid>
 *
 * Click : tous les liens externes sont réécrits via /api/email-track/c/<tid>?u=<url>
 *   → GET /api/email-track/c/<tid>?u=<url> → redirige et incrémente
 *
 * Anonymisation : on n'enregistre PAS d'IP, juste le compteur. Pour ne pas
 * faire de tracking abusif.
 */

import { promises as fs } from "node:fs";
import path from "node:path";
import { randomBytes } from "node:crypto";

const DATA_DIR = path.join(process.cwd(), "data");
const TRACK_FILE = path.join(DATA_DIR, "email-tracking.json");

export type TrackedEmail = {
  id: string;
  // Type d'email tracké
  kind: "template" | "newsletter" | "campaign" | "quote";
  // Identifiant secondaire (templateId, campaignId, leadRef…)
  refKey: string;
  // Email du destinataire (hashé pour analyse aggrégée)
  recipientHash: string;
  createdAt: string;
  opens: number;
  clicks: number;
  lastOpenAt?: string;
  lastClickAt?: string;
  // Liste des URLs cliquées avec leur count
  clickedUrls: Record<string, number>;
};

async function ensureDir() {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
  } catch {}
}

async function readAll(): Promise<TrackedEmail[]> {
  try {
    return JSON.parse(await fs.readFile(TRACK_FILE, "utf8"));
  } catch {
    return [];
  }
}

async function writeAll(all: TrackedEmail[]) {
  await ensureDir();
  await fs.writeFile(TRACK_FILE, JSON.stringify(all, null, 2), "utf8");
}

function hashRecipient(email: string): string {
  // Hash léger pour préserver l'anonymat partiel
  return Buffer.from(email).toString("base64").slice(0, 12);
}

/**
 * Crée une entrée de tracking et retourne l'ID. À appeler juste avant envoi.
 */
export async function createTracking(
  kind: TrackedEmail["kind"],
  refKey: string,
  recipientEmail: string,
): Promise<string> {
  const id = randomBytes(8).toString("hex");
  const all = await readAll();
  all.push({
    id,
    kind,
    refKey,
    recipientHash: hashRecipient(recipientEmail),
    createdAt: new Date().toISOString(),
    opens: 0,
    clicks: 0,
    clickedUrls: {},
  });
  await writeAll(all);
  return id;
}

export async function recordOpen(id: string): Promise<void> {
  const all = await readAll();
  const t = all.find((x) => x.id === id);
  if (!t) return;
  t.opens++;
  t.lastOpenAt = new Date().toISOString();
  await writeAll(all);
}

export async function recordClick(id: string, url: string): Promise<void> {
  const all = await readAll();
  const t = all.find((x) => x.id === id);
  if (!t) return;
  t.clicks++;
  t.lastClickAt = new Date().toISOString();
  t.clickedUrls[url] = (t.clickedUrls[url] ?? 0) + 1;
  await writeAll(all);
}

export async function listTracking(): Promise<TrackedEmail[]> {
  return await readAll();
}

/* ─────────────── Helpers pour injecter dans un HTML email ─────────────── */

/**
 * Réécrit les liens d'un HTML pour passer par le tracker.
 * Ne touche pas aux ancres `#` et aux mailto:/tel:.
 */
export function injectTracking(html: string, trackingId: string, baseUrl: string): string {
  let out = html;
  // Pixel d'ouverture
  const pixel = `<img src="${baseUrl}/api/email-track/o/${trackingId}" width="1" height="1" alt="" style="display:none;border:0;width:1px;height:1px;" />`;
  // Ajoute le pixel juste avant </body> (ou à la fin)
  if (out.includes("</body>")) {
    out = out.replace("</body>", `${pixel}</body>`);
  } else {
    out += pixel;
  }
  // Réécrit les href externes
  out = out.replace(
    /href=(["'])(https?:\/\/[^"']+)\1/g,
    (_full, q, url) => {
      const encoded = encodeURIComponent(url);
      return `href=${q}${baseUrl}/api/email-track/c/${trackingId}?u=${encoded}${q}`;
    },
  );
  return out;
}
