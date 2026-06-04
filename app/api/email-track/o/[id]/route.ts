/**
 * GET /api/email-track/o/<id>
 * Pixel d'ouverture — renvoie un GIF transparent 1x1 et incrémente le compteur.
 */

import { NextResponse } from "next/server";
import { recordOpen } from "@/lib/email-tracking-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GIF transparent 1x1 (43 bytes)
const TRANSPARENT_GIF = Buffer.from([
  0x47, 0x49, 0x46, 0x38, 0x39, 0x61, 0x01, 0x00, 0x01, 0x00, 0x80, 0x00,
  0x00, 0xff, 0xff, 0xff, 0x00, 0x00, 0x00, 0x21, 0xf9, 0x04, 0x01, 0x00,
  0x00, 0x00, 0x00, 0x2c, 0x00, 0x00, 0x00, 0x00, 0x01, 0x00, 0x01, 0x00,
  0x00, 0x02, 0x02, 0x44, 0x01, 0x00, 0x3b,
]);

export async function GET(
  _req: Request,
  { params }: { params: { id: string } },
) {
  // Best-effort, ne bloque pas la réponse
  void recordOpen(params.id);
  return new NextResponse(TRANSPARENT_GIF, {
    status: 200,
    headers: {
      "Content-Type": "image/gif",
      "Cache-Control": "private, no-cache, no-store, must-revalidate",
      Pragma: "no-cache",
      Expires: "0",
    },
  });
}
