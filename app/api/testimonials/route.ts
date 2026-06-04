/**
 * GET /api/testimonials → liste publique des témoignages approuvés.
 *
 * Public, pas d'auth — utilisé par /temoignages côté site.
 */

import { NextResponse } from "next/server";
import { listPublicTestimonials } from "@/lib/testimonials-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const testimonials = await listPublicTestimonials();
  return NextResponse.json({
    testimonials,
    count: testimonials.length,
  });
}
