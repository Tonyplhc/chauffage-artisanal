/**
 * Store des demandes de paiement d'acompte post-acceptation de devis.
 *
 * Pas de stockage de PAN ni de données carte — uniquement les références
 * vers la session de paiement externe (Stripe Checkout) + le statut.
 *
 * Cycle de vie :
 *   pending → completed (webhook reçu) | canceled | expired
 *
 * En mode démo (STRIPE_SECRET_KEY absent) : on n'appelle pas Stripe, on
 * génère une URL fictive vers /paiement-demo/[id] qui demande à l'admin
 * de simuler. Utile pour la démo client sans clés réelles.
 */

import { promises as fs } from "node:fs";
import path from "node:path";
import { randomBytes } from "node:crypto";

const DATA_DIR = path.join(process.cwd(), "data");
const PAYMENTS_FILE = path.join(DATA_DIR, "payments.json");

export type PaymentStatus = "pending" | "completed" | "canceled" | "expired";

export type Payment = {
  id: string;
  leadReference: string;
  quoteNumber?: string;
  amountCents: number; // EUR cents (Stripe smallest unit)
  description: string;
  status: PaymentStatus;
  createdAt: string;
  paidAt?: string;
  // Référence externe (Stripe Checkout session id) ou mock-…
  externalSessionId?: string;
  // URL où l'admin envoie le client (Stripe Checkout hosted ou page démo)
  paymentUrl: string;
  // Mode "demo" si STRIPE_SECRET_KEY absent — pour identifier en UI
  mode: "live" | "demo";
};

async function ensureDir() {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
  } catch {}
}

async function readAll(): Promise<Payment[]> {
  try {
    return JSON.parse(await fs.readFile(PAYMENTS_FILE, "utf8"));
  } catch {
    return [];
  }
}

async function writeAll(arr: Payment[]) {
  await ensureDir();
  await fs.writeFile(PAYMENTS_FILE, JSON.stringify(arr, null, 2), "utf8");
}

function makeId(): string {
  return `pay-${randomBytes(7).toString("hex")}`;
}

export async function listPayments(): Promise<Payment[]> {
  const all = await readAll();
  return [...all].sort(
    (a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}

export async function listPaymentsForLead(
  reference: string,
): Promise<Payment[]> {
  const all = await readAll();
  return all
    .filter((p) => p.leadReference === reference)
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
}

export async function getPayment(id: string): Promise<Payment | null> {
  const all = await readAll();
  return all.find((p) => p.id === id) ?? null;
}

export async function createPayment(input: {
  leadReference: string;
  quoteNumber?: string;
  amountCents: number;
  description: string;
}): Promise<Payment> {
  if (input.amountCents <= 0) throw new Error("Montant doit être > 0");
  if (input.amountCents > 5_000_000_00) throw new Error("Montant trop élevé");
  const baseUrl = process.env.PUBLIC_URL ?? "http://localhost:3020";
  const id = makeId();
  const hasStripe = !!process.env.STRIPE_SECRET_KEY;

  let paymentUrl: string;
  let externalSessionId: string | undefined;

  if (hasStripe) {
    // Stripe Checkout API — implémentation réelle.
    // On ne fait PAS l'appel ici pour rester découplé (pas de dépendance).
    // L'appelant (route API) doit créer la session et compléter le record.
    paymentUrl = ""; // sera complété par l'API route
    externalSessionId = undefined;
  } else {
    // Mode démo : page interne où l'admin peut simuler le paiement
    paymentUrl = `${baseUrl}/paiement-demo/${id}`;
    externalSessionId = `mock-${randomBytes(8).toString("hex")}`;
  }

  const payment: Payment = {
    id,
    leadReference: input.leadReference,
    quoteNumber: input.quoteNumber,
    amountCents: input.amountCents,
    description: input.description.slice(0, 400),
    status: "pending",
    createdAt: new Date().toISOString(),
    externalSessionId,
    paymentUrl,
    mode: hasStripe ? "live" : "demo",
  };

  const all = await readAll();
  all.push(payment);
  await writeAll(all);
  return payment;
}

export async function updatePayment(
  id: string,
  patch: Partial<Pick<Payment, "status" | "paymentUrl" | "externalSessionId" | "paidAt">>,
): Promise<Payment | null> {
  const all = await readAll();
  const idx = all.findIndex((p) => p.id === id);
  if (idx === -1) return null;
  all[idx] = { ...all[idx], ...patch };
  await writeAll(all);
  return all[idx];
}

export async function markPaid(id: string): Promise<Payment | null> {
  return await updatePayment(id, {
    status: "completed",
    paidAt: new Date().toISOString(),
  });
}

/**
 * Stats simples pour le dashboard paiements.
 */
export type PaymentStats = {
  total: number;
  pending: number;
  completed: number;
  canceled: number;
  amountReceived: number; // somme des completed, en EUR
  amountPending: number;
};

export async function computeStats(): Promise<PaymentStats> {
  const all = await readAll();
  const stats: PaymentStats = {
    total: all.length,
    pending: 0,
    completed: 0,
    canceled: 0,
    amountReceived: 0,
    amountPending: 0,
  };
  for (const p of all) {
    if (p.status === "pending") {
      stats.pending += 1;
      stats.amountPending += p.amountCents / 100;
    } else if (p.status === "completed") {
      stats.completed += 1;
      stats.amountReceived += p.amountCents / 100;
    } else if (p.status === "canceled") {
      stats.canceled += 1;
    }
  }
  return stats;
}
