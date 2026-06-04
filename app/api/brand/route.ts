/**
 * Endpoint public lecture brand settings — utilisé par le SwR client si on
 * voulait propager en temps réel. Pas d'auth (les infos sont publiques).
 *
 * Cache 60s côté client pour éviter spam.
 */

import { NextResponse } from "next/server";
import { getBrand } from "@/lib/brand-settings";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const brand = await getBrand();
  return NextResponse.json(
    { brand },
    {
      headers: {
        "Cache-Control": "public, max-age=60, stale-while-revalidate=300",
      },
    },
  );
}
