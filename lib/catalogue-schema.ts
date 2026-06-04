import { z } from "zod";
import { ServiceEnum } from "./devis-schema";

/**
 * Entrée catalogue produit/prestation — fournie par le client via Excel/CSV.
 * Tout est tolérant pour faciliter l'import depuis Excel grand public.
 */

export const CatalogueItemSchema = z.object({
  ref: z.string().min(1).max(60),
  service: ServiceEnum,
  name: z.string().min(1).max(200),
  description: z.string().max(2000).default(""),
  priceMin: z.number().int().nonnegative().nullable().default(null),
  priceMax: z.number().int().nonnegative().nullable().default(null),
  unit: z.string().max(40).default("forfait"),
  advantages: z.array(z.string().max(300)).default([]),
  inconvenients: z.array(z.string().max(300)).default([]),
  brand: z.string().max(80).default(""),
  power: z.string().max(60).default(""),
  // Plage de surface adaptée (en m²) — optionnel
  surfaceMin: z.number().int().nullable().default(null),
  surfaceMax: z.number().int().nullable().default(null),
});

export type CatalogueItem = z.infer<typeof CatalogueItemSchema>;

export const CatalogueStateSchema = z.object({
  items: z.array(CatalogueItemSchema),
  uploadedAt: z.string(),
  source: z.string().default("upload"),
});

export type CatalogueState = z.infer<typeof CatalogueStateSchema>;

/** Mapping libellé budget → tranche en €. Sert au matching. */
export const BUDGET_RANGE: Record<string, { min: number; max: number }> = {
  less10: { min: 0, max: 10_000 },
  "10-20": { min: 10_000, max: 20_000 },
  "20-40": { min: 20_000, max: 40_000 },
  "40plus": { min: 40_000, max: 1_000_000 },
  inconnu: { min: 0, max: 1_000_000 },
};
