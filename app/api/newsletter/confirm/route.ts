/**
 * GET /api/newsletter/confirm?email=...&t=...
 *
 * Confirme une inscription newsletter via le lien envoyé par email.
 * Redirige vers une page de remerciement.
 */

import { NextResponse } from "next/server";
import { confirmEmail, verifyNewsletterToken } from "@/lib/newsletter-store";
import { logger } from "@/lib/logger";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const email = url.searchParams.get("email");
  const token = url.searchParams.get("t");
  const baseUrl = `${url.protocol}//${url.host}`;

  if (!email || !verifyNewsletterToken(email, "confirm", token ?? undefined)) {
    return NextResponse.redirect(`${baseUrl}/newsletter/confirme?ok=0`);
  }

  const entry = await confirmEmail(email);
  if (!entry) {
    return NextResponse.redirect(`${baseUrl}/newsletter/confirme?ok=0`);
  }

  logger.info("newsletter.confirmed", { email: entry.email });
  return NextResponse.redirect(`${baseUrl}/newsletter/confirme?ok=1`);
}
