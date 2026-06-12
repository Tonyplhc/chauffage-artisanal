/**
 * Brand settings types et defaults — extraits pour usage client + serveur.
 *
 * Pas d'import node:* ici, peut être importé par les Client Components.
 * Le store fichier est dans `lib/brand-settings.ts` (server-only).
 */

import { z } from "zod";

export const BrandSettingsSchema = z.object({
  name: z.string().min(2).max(120),
  tagline: z.string().min(2).max(280),
  shortDescription: z.string().min(10).max(500),
  foundedYear: z.number().int().min(1900).max(new Date().getFullYear()),
  contactEmail: z.string().email().max(180),
  contactPhone: z.string().min(4).max(40),
  contactAddress: z.string().max(280),
  cityLabel: z.string().max(120),
  emergencyAvailability: z.string().max(120),
  logoUrl: z.string().max(2000).optional(),
  colorAccent: z.string().regex(/^#[0-9a-fA-F]{6}$/).default("#0B57A0"),
  colorAccentSecondary: z.string().regex(/^#[0-9a-fA-F]{6}$/).default("#C24A2C"),
  socials: z
    .object({
      linkedin: z.string().url().max(280).optional(),
      instagram: z.string().url().max(280).optional(),
      facebook: z.string().url().max(280).optional(),
    })
    .default({}),
  updatedAt: z.string().optional(),
});

export type BrandSettings = z.infer<typeof BrandSettingsSchema>;

export const DEFAULT_BRAND: BrandSettings = {
  name: "Chauffage Artisanal",
  tagline: "Le confort thermique nouvelle génération au Luxembourg",
  shortDescription:
    "Depuis 1994, la maison technique luxembourgeoise du chauffage, des pompes à chaleur, de la climatisation et des énergies renouvelables.",
  foundedYear: 1994,
  contactEmail: "contact@chauffage-artisanal.lu",
  contactPhone: "+352 00 00 00 00",
  contactAddress: "Adresse à confirmer · Luxembourg",
  cityLabel: "Luxembourg",
  emergencyAvailability: "Astreinte selon politique en vigueur",
  colorAccent: "#0B57A0",
  colorAccentSecondary: "#C24A2C",
  socials: {},
};
