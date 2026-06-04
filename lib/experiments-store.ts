/**
 * A/B testing — expériences avec variants.
 *
 * Une expérience = id + nom + variants + métrique de conversion.
 * Assignation déterministe : hash(visitorId + expId) → variant. Toujours
 * la même réponse pour le même visiteur (cookie ca-visitor).
 *
 * Tracking : chaque variant assigné est compté en "exposure". Quand un
 * événement de conversion arrive avec un visitorId connu, on l'attribue
 * au variant qui lui était assigné.
 *
 * Pas de framework externe — tout en fichiers JSON.
 */

import { promises as fs } from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { z } from "zod";

const DATA_DIR = path.join(process.cwd(), "data");
const EXPS_FILE = path.join(DATA_DIR, "experiments.json");

export const VariantSchema = z.object({
  id: z.string().min(1).max(40),
  label: z.string().min(1).max(120),
  weight: z.number().int().min(1).max(100).default(50),
  // Données propagées au front pour personnaliser le rendu
  config: z.record(z.union([z.string(), z.number(), z.boolean()])).default({}),
});

export const ExperimentSchema = z.object({
  id: z.string().min(1).max(40),
  name: z.string().min(2).max(200),
  description: z.string().max(2000).default(""),
  enabled: z.boolean().default(true),
  // Cible : sélecteur d'où l'expérience s'applique (page, événement)
  target: z.enum(["home_hero_cta", "devis_step1_intro"]).default("home_hero_cta"),
  // Métrique attribuée (event name) — sur quoi on mesure la conversion
  conversionEvent: z.string().min(1).max(80).default("devis_submitted"),
  variants: z.array(VariantSchema).min(2).max(6),
  // Stats agrégées
  exposures: z.record(z.number().int().min(0)).default({}),
  conversions: z.record(z.number().int().min(0)).default({}),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

export type Variant = z.infer<typeof VariantSchema>;
export type Experiment = z.infer<typeof ExperimentSchema>;

async function ensureDir() {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
  } catch {}
}

export async function listExperiments(): Promise<Experiment[]> {
  try {
    return JSON.parse(await fs.readFile(EXPS_FILE, "utf8"));
  } catch {
    return [];
  }
}

export async function saveExperiment(exp: Experiment): Promise<Experiment> {
  const all = await listExperiments();
  const idx = all.findIndex((x) => x.id === exp.id);
  const now = new Date().toISOString();
  const next: Experiment = {
    ...exp,
    createdAt: exp.createdAt ?? now,
    updatedAt: now,
    exposures: exp.exposures ?? {},
    conversions: exp.conversions ?? {},
  };
  if (idx === -1) all.push(next);
  else all[idx] = { ...all[idx], ...next };
  await ensureDir();
  await fs.writeFile(EXPS_FILE, JSON.stringify(all, null, 2), "utf8");
  return next;
}

export async function deleteExperiment(id: string): Promise<boolean> {
  const all = await listExperiments();
  const filtered = all.filter((x) => x.id !== id);
  if (filtered.length === all.length) return false;
  await fs.writeFile(EXPS_FILE, JSON.stringify(filtered, null, 2), "utf8");
  return true;
}

/* ─────────────── Assignation déterministe ─────────────── */

function pickVariant(exp: Experiment, visitorId: string): Variant {
  const totalWeight = exp.variants.reduce((s, v) => s + v.weight, 0);
  const hash = createHash("sha256")
    .update(`${exp.id}:${visitorId}`)
    .digest();
  // Prendre les 4 premiers octets comme uint32, modulo totalWeight
  const r = hash.readUInt32BE(0) % totalWeight;
  let cumul = 0;
  for (const v of exp.variants) {
    cumul += v.weight;
    if (r < cumul) return v;
  }
  return exp.variants[exp.variants.length - 1];
}

export async function getActiveExperimentByTarget(
  target: Experiment["target"],
): Promise<Experiment | undefined> {
  const all = await listExperiments();
  return all.find((x) => x.enabled && x.target === target);
}

export async function assignAndRecord(
  expId: string,
  visitorId: string,
): Promise<{ variantId: string; config: Variant["config"] } | null> {
  const all = await listExperiments();
  const exp = all.find((x) => x.id === expId && x.enabled);
  if (!exp) return null;
  const variant = pickVariant(exp, visitorId);
  // Increment exposure
  exp.exposures = {
    ...exp.exposures,
    [variant.id]: (exp.exposures[variant.id] ?? 0) + 1,
  };
  await ensureDir();
  await fs.writeFile(EXPS_FILE, JSON.stringify(all, null, 2), "utf8");
  return { variantId: variant.id, config: variant.config };
}

export async function recordConversion(
  conversionEvent: string,
  visitorId: string,
): Promise<void> {
  const all = await listExperiments();
  let changed = false;
  for (const exp of all) {
    if (!exp.enabled) continue;
    if (exp.conversionEvent !== conversionEvent) continue;
    // Re-pick le variant assigné de ce visitor (déterministe)
    const variant = pickVariant(exp, visitorId);
    exp.conversions = {
      ...exp.conversions,
      [variant.id]: (exp.conversions[variant.id] ?? 0) + 1,
    };
    changed = true;
  }
  if (changed) {
    await ensureDir();
    await fs.writeFile(EXPS_FILE, JSON.stringify(all, null, 2), "utf8");
  }
}
