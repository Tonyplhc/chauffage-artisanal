import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/require-admin";
import { parseCatalogueFile } from "@/lib/catalogue-parser";
import { readCatalogue, writeCatalogue, clearCatalogue } from "@/lib/catalogue-store";
import { logger } from "@/lib/logger";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_SIZE = 5 * 1024 * 1024; // 5 MB

export async function GET(req: Request) {
  const auth = await requireAdminApi(req);
  if (!auth.ok) return auth.response;
  const state = await readCatalogue();
  return NextResponse.json({ catalogue: state });
}

export async function POST(req: Request) {
  const auth = await requireAdminApi(req);
  if (!auth.ok) return auth.response;

  const form = await req.formData().catch(() => null);
  if (!form) return NextResponse.json({ error: "FormData invalide" }, { status: 400 });

  const file = form.get("file");
  if (!(file instanceof File))
    return NextResponse.json({ error: "Aucun fichier" }, { status: 400 });
  if (file.size > MAX_SIZE)
    return NextResponse.json({ error: "Fichier trop volumineux (max 5 Mo)" }, { status: 413 });

  const buffer = await file.arrayBuffer();
  const result = await parseCatalogueFile(buffer, file.name);

  if (result.items.length === 0) {
    logger.warn("catalogue.parse_failed", { filename: file.name, errors: result.errors.length });
    return NextResponse.json(
      { error: "Aucune ligne valide trouvée.", details: result.errors.slice(0, 20) },
      { status: 400 },
    );
  }

  const state = {
    items: result.items,
    uploadedAt: new Date().toISOString(),
    source: file.name,
  };
  await writeCatalogue(state);
  logger.info("catalogue.uploaded", { filename: file.name, items: result.items.length });

  return NextResponse.json({
    ok: true,
    imported: result.items.length,
    skipped: result.errors.length,
    errors: result.errors.slice(0, 20),
    catalogue: state,
  });
}

export async function DELETE(req: Request) {
  const auth = await requireAdminApi(req);
  if (!auth.ok) return auth.response;
  await clearCatalogue();
  return NextResponse.json({ ok: true });
}
