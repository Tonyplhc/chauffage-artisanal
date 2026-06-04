import { z } from "zod";

/**
 * Devis officiel — créé par l'admin pour un lead, envoyé au client par email,
 * consultable et imprimable via une page publique tokenisée.
 *
 * Pas de génération PDF côté serveur — on s'appuie sur le print du navigateur
 * (CSS print) qui produit un PDF propre.
 */

export const QuoteLineSchema = z.object({
  id: z.string().min(1).max(40),
  description: z.string().min(1).max(500),
  quantity: z.number().positive().max(10000).default(1),
  unitPrice: z.number().nonnegative().max(10_000_000).default(0),
  unit: z.string().max(20).default("forfait"),
});

export type QuoteLine = z.infer<typeof QuoteLineSchema>;

export const QuoteSignatureSchema = z.object({
  signerName: z.string().min(2).max(120),
  acceptedTerms: z.literal(true),
  signedAt: z.string(),
  ipHash: z.string().optional(), // SHA-256 IP — preuve sans stockage perso
  userAgent: z.string().max(400).optional(),
});

export type QuoteSignature = z.infer<typeof QuoteSignatureSchema>;

export const QuoteSchema = z.object({
  // Accepte le format standard `DEV-YYYY-NNNN` ET le format démo
  // `DEV-SEED-YYYY-NNNN` généré par `lib/demo-seed.ts`.
  leadReference: z.string().regex(/^DEV-(SEED-)?\d{4}-\d{4}$/),
  number: z.string().min(1).max(40), // Numéro officiel (ex: 2026-0042)
  status: z.enum(["draft", "sent", "accepted", "refused"]).default("draft"),
  lines: z.array(QuoteLineSchema).min(1).max(50),
  tvaRate: z.number().min(0).max(100).default(17),
  notes: z.string().max(5000).default(""),
  validUntil: z.string().optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
  sentAt: z.string().optional(),
  // Réponse client
  signature: QuoteSignatureSchema.optional(),
  refusalReason: z.string().max(2000).optional(),
  decidedAt: z.string().optional(),
});

export type Quote = z.infer<typeof QuoteSchema>;

/* ─────────────── Computations ─────────────── */

export type QuoteTotals = {
  htAmount: number;
  tvaAmount: number;
  ttcAmount: number;
};

export function computeTotals(q: Pick<Quote, "lines" | "tvaRate">): QuoteTotals {
  const htAmount = q.lines.reduce(
    (sum, l) => sum + l.quantity * l.unitPrice,
    0,
  );
  const tvaAmount = (htAmount * q.tvaRate) / 100;
  const ttcAmount = htAmount + tvaAmount;
  return {
    htAmount: Math.round(htAmount * 100) / 100,
    tvaAmount: Math.round(tvaAmount * 100) / 100,
    ttcAmount: Math.round(ttcAmount * 100) / 100,
  };
}

export function formatEur(n: number): string {
  return n.toLocaleString("fr-FR", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/** Génère un nouveau numéro de devis basé sur l'année + suffixe random. */
export function makeQuoteNumber(): string {
  const year = new Date().getFullYear();
  const seq = String(Math.floor(Math.random() * 9000) + 1000);
  return `${year}-${seq}`;
}
