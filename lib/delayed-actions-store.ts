/**
 * File d'actions retardées (delayed actions).
 *
 * Persistance : data/delayed-actions.json.
 * Processeur : trigger lazy à chaque GET admin (mode démo), idéalement cron en
 * prod (Vercel Cron tous les 5 min suffit pour cette résolution).
 */

import { promises as fs } from "node:fs";
import path from "node:path";
import type { Action } from "./automations-store";

const DATA_DIR = path.join(process.cwd(), "data");
const QUEUE_FILE = path.join(DATA_DIR, "delayed-actions.json");

export type DelayedAction = {
  id: string;
  leadReference: string;
  action: Action;
  ruleName: string;
  scheduledFor: string; // ISO
  createdAt: string;
  executed: boolean;
  executedAt?: string;
};

async function ensureDir() {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
  } catch {}
}

async function readAll(): Promise<DelayedAction[]> {
  try {
    return JSON.parse(await fs.readFile(QUEUE_FILE, "utf8"));
  } catch {
    return [];
  }
}

async function writeAll(actions: DelayedAction[]) {
  await ensureDir();
  await fs.writeFile(QUEUE_FILE, JSON.stringify(actions, null, 2), "utf8");
}

export async function scheduleDelayedAction(
  leadReference: string,
  action: Action,
  ruleName: string,
  delaySeconds: number,
): Promise<DelayedAction> {
  const all = await readAll();
  const da: DelayedAction = {
    id: `da-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
    leadReference,
    action,
    ruleName,
    scheduledFor: new Date(Date.now() + delaySeconds * 1000).toISOString(),
    createdAt: new Date().toISOString(),
    executed: false,
  };
  all.push(da);
  await writeAll(all);
  return da;
}

export async function listPending(): Promise<DelayedAction[]> {
  const all = await readAll();
  return all.filter((a) => !a.executed);
}

export async function processDelayedActions(): Promise<{ processed: number }> {
  const all = await readAll();
  const now = Date.now();
  let processed = 0;

  const { executePlainAction } = await import("./automations-executor");

  for (const da of all) {
    if (da.executed) continue;
    if (new Date(da.scheduledFor).getTime() > now) continue;
    // Lock anti-doublon via flag executed
    da.executed = true;
    da.executedAt = new Date().toISOString();
    try {
      const { getLead } = await import("./leads-store");
      const lead = await getLead(da.leadReference);
      if (lead) {
        await executePlainAction(da.action, lead, da.ruleName);
      }
      processed++;
    } catch {
      // log silent
    }
  }
  await writeAll(all);
  return { processed };
}
