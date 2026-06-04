/**
 * Activity log global de l'admin.
 *
 * Chaque action notable (changement de statut, ajout de note, upload doc,
 * envoi devis officiel, export RGPD, suppression…) est tracée dans
 * `data/activity-log.json` avec timestamp, type, ref, et payload résumé.
 *
 * Lecture : `/admin/activity` pour audit / supervision.
 * Pas de personnel identifiable au-delà de la référence du lead.
 */

import { promises as fs } from "node:fs";
import path from "node:path";

const DATA_DIR = path.join(process.cwd(), "data");
const LOG_FILE = path.join(DATA_DIR, "activity-log.json");

export type ActivityType =
  | "lead.created"
  | "lead.status_changed"
  | "lead.notes_updated"
  | "lead.document_uploaded"
  | "lead.document_deleted"
  | "lead.quote_saved"
  | "lead.quote_sent"
  | "lead.template_sent"
  | "lead.bulk_status"
  | "lead.rgpd_export"
  | "lead.rgpd_delete"
  | "catalogue.updated"
  | "auth.login"
  | "auth.logout"
  | "admin.tag_created"
  | "admin.tag_updated"
  | "admin.tag_deleted"
  | "lead.tags_updated"
  | "admin.snippet_created"
  | "admin.snippet_updated"
  | "admin.snippet_deleted"
  | "lead.value_updated"
  | "lead.reminder_created"
  | "lead.reminder_cleared"
  | "lead.reminder_fired"
  | "lead.comment_added"
  | "lead.comment_deleted"
  | "admin.view_saved"
  | "admin.view_deleted"
  | "admin.tenant_created"
  | "admin.tenant_updated"
  | "admin.tenant_deleted"
  | "admin.tenant_switched"
  | "admin.demo_seed_created"
  | "admin.demo_seed_removed"
  | "admin.purchase_order_created"
  | "admin.purchase_order_updated"
  | "admin.service_order_created"
  | "admin.warranty_claim_created";

export type ActivityEntry = {
  id: string;
  at: string;
  type: ActivityType;
  reference?: string;
  summary: string;
  meta?: Record<string, unknown>;
};

const MAX_ENTRIES = 5000;

async function ensureDir() {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
  } catch {}
}

async function readAll(): Promise<ActivityEntry[]> {
  try {
    return JSON.parse(await fs.readFile(LOG_FILE, "utf8"));
  } catch {
    return [];
  }
}

async function writeAll(entries: ActivityEntry[]) {
  await ensureDir();
  // Cap pour ne pas exploser le fichier
  const capped = entries.slice(0, MAX_ENTRIES);
  await fs.writeFile(LOG_FILE, JSON.stringify(capped, null, 2), "utf8");
}

export async function logActivity(
  type: ActivityType,
  summary: string,
  options: { reference?: string; meta?: Record<string, unknown> } = {},
): Promise<void> {
  try {
    const all = await readAll();
    const entry: ActivityEntry = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      at: new Date().toISOString(),
      type,
      reference: options.reference,
      summary,
      meta: options.meta,
    };
    all.unshift(entry);
    await writeAll(all);
  } catch {
    // best-effort, ne casse pas l'opération principale
  }
}

export async function listActivity(): Promise<ActivityEntry[]> {
  return await readAll();
}
