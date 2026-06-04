/**
 * GET  /api/bookings        → liste créneaux dispos (publique)
 * POST /api/bookings { ... } → soumission RDV (publique avec validation)
 */

import { NextResponse } from "next/server";
import { z } from "zod";
import {
  listAvailableSlots,
  createBooking,
} from "@/lib/booking-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const PurposeEnum = z.enum([
  "visite-technique",
  "entretien",
  "depannage",
  "autre",
]);

const BookingInput = z.object({
  slotIso: z.string().min(10),
  purpose: PurposeEnum,
  fullName: z.string().min(2).max(120),
  email: z.string().email().max(180),
  phone: z.string().min(6).max(40),
  commune: z.string().max(120).optional(),
  notes: z.string().max(800).optional(),
  // honeypot
  trap: z.string().max(0).optional(),
});

export async function GET() {
  const data = await listAvailableSlots(14);
  return NextResponse.json(data);
}

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON invalide" }, { status: 400 });
  }
  const parsed = BookingInput.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Champs invalides", issues: parsed.error.issues },
      { status: 400 },
    );
  }
  // Honeypot
  if (parsed.data.trap && parsed.data.trap.length > 0) {
    return NextResponse.json({ ok: true }); // fake success silencieux
  }
  try {
    const booking = await createBooking({
      slotIso: parsed.data.slotIso,
      durationMin: 45,
      purpose: parsed.data.purpose,
      fullName: parsed.data.fullName,
      email: parsed.data.email,
      phone: parsed.data.phone,
      commune: parsed.data.commune,
      notes: parsed.data.notes,
    });
    return NextResponse.json({ booking });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Erreur" },
      { status: 400 },
    );
  }
}
