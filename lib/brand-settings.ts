/**
 * Brand settings — données éditables côté admin et propagées partout
 * (nav, footer, emails, OG image, recap PDF…).
 *
 * Stockage dev : data/brand.json.
 * Si pas de fichier, defaults harcodés Chauffage Artisanal.
 */

import { promises as fs } from "node:fs";
import path from "node:path";
export {
  BrandSettingsSchema,
  DEFAULT_BRAND,
  type BrandSettings,
} from "./brand-settings-types";
import { BrandSettingsSchema, DEFAULT_BRAND, type BrandSettings } from "./brand-settings-types";

const DATA_DIR = path.join(process.cwd(), "data");
const BRAND_FILE = path.join(DATA_DIR, "brand.json");

// BrandSettingsSchema, BrandSettings et DEFAULT_BRAND sont importés depuis
// `brand-settings-types.ts` (séparation client-safe).

async function ensureDir() {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
  } catch {}
}

export async function getBrand(): Promise<BrandSettings> {
  try {
    const raw = await fs.readFile(BRAND_FILE, "utf8");
    const parsed = BrandSettingsSchema.safeParse(JSON.parse(raw));
    if (parsed.success) return parsed.data;
  } catch {
    // pas de fichier ou JSON invalide
  }
  return DEFAULT_BRAND;
}

export async function saveBrand(brand: BrandSettings): Promise<BrandSettings> {
  await ensureDir();
  const next = { ...brand, updatedAt: new Date().toISOString() };
  await fs.writeFile(BRAND_FILE, JSON.stringify(next, null, 2), "utf8");
  return next;
}
