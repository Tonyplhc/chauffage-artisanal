/**
 * Endpoint booking inline : reçoit nom/email/téléphone/adresse/slot et crée
 * un lead avec metadata.bookingSlot.
 *
 * Pas de validation Zod ultra-stricte ici parce que le flow est minimaliste —
 * on récupère le minimum vital, l'admin requalifiera le RDV manuellement.
 */

import { NextResponse } from "next/server";
import { z } from "zod";
import { makeReference } from "@/lib/devis-schema";
import { rateLimit, clientKey } from "@/lib/rate-limit";
import { createLead } from "@/lib/leads-store";
import { sendAdminNotification, sendClientConfirmation } from "@/lib/email";
import { sendLeadWebhook } from "@/lib/webhook";
import { logger } from "@/lib/logger";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BookingSchema = z.object({
  fullName: z.string().min(2).max(120),
  email: z.string().email().max(180),
  phone: z.string().min(6).max(40),
  address: z.string().max(200).default(""),
  note: z.string().max(2000).default(""),
  slot: z.string().min(1).max(40), // ISO date
});

export async function POST(req: Request) {
  const ip = clientKey(req.headers);
  const limit = rateLimit(`booking:${ip}`, { windowMs: 60_000, max: 5 });
  if (!limit.ok) {
    return NextResponse.json(
      { error: "Trop de tentatives. Réessayez dans une minute." },
      { status: 429 },
    );
  }

  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON invalide." }, { status: 400 });
  }
  const parsed = BookingSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Données incomplètes." },
      { status: 400 },
    );
  }

  const d = parsed.data;
  const slotDate = new Date(d.slot);
  if (Number.isNaN(slotDate.getTime())) {
    return NextResponse.json(
      { error: "Créneau invalide." },
      { status: 400 },
    );
  }

  // On crée un lead "autre" avec metadata.bookingSlot — sera requalifié à
  // l'admin (changement de service au moment de la confirmation RDV).
  const reference = makeReference();
  const payload = {
    trap: "",
    services: ["autre" as const],
    buildingType: "autre" as const,
    construction: "renovation" as const,
    surface: 100,
    currentEnergy: "inconnu" as const,
    commune: d.address.trim() || "À préciser",
    timeline: "exploration" as const,
    budget: "inconnu" as const,
    fullName: d.fullName,
    email: d.email,
    phone: d.phone,
    preferredChannel: "phone" as const,
    preferredBrand: "aucune" as const,
    message: `Demande de visite technique\nCréneau souhaité : ${slotDate.toLocaleString("fr-FR")}\nAdresse : ${d.address}\n\n${d.note}`.trim(),
    rgpdConsent: true as const,
    photos: [],
    metadata: {
      bookingSlot: slotDate.toISOString(),
      bookingSource: "inline-booking",
    },
  };

  try {
    const lead = await createLead(payload, reference);
    logger.info("booking.created", {
      reference: lead.reference,
      slot: slotDate.toISOString(),
    });
    // Side-effects non bloquants
    Promise.allSettled([
      sendAdminNotification(lead),
      sendClientConfirmation(lead),
      sendLeadWebhook(lead),
    ]);
    return NextResponse.json(
      { ok: true, reference: lead.reference },
      { status: 201 },
    );
  } catch (e) {
    logger.error("booking.persist_error", e, { ip });
    return NextResponse.json(
      { error: "Impossible d'enregistrer le créneau." },
      { status: 500 },
    );
  }
}
