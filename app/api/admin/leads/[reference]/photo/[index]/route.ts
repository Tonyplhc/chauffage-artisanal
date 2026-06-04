import { NextResponse } from "next/server";
import { readPhotoFromFs } from "@/lib/leads-store";
import { requireAdminApi } from "@/lib/require-admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  req: Request,
  { params }: { params: { reference: string; index: string } },
) {
  const auth = await requireAdminApi(req);
  if (!auth.ok) return auth.response;
  const idx = Number.parseInt(params.index, 10);
  if (!Number.isInteger(idx) || idx < 0 || idx > 100) {
    return NextResponse.json({ error: "index invalide" }, { status: 400 });
  }
  const photo = await readPhotoFromFs(params.reference, idx);
  if (!photo) return NextResponse.json({ error: "photo introuvable" }, { status: 404 });
  return new NextResponse(photo.buffer as unknown as BodyInit, {
    headers: {
      "Content-Type": photo.mime,
      "Cache-Control": "private, max-age=300",
    },
  });
}
