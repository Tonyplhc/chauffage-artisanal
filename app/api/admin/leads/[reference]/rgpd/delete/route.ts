/**
 * Suppression définitive d'un lead — droit à l'oubli (RGPD art. 17).
 *
 * Supprime le lead du store + tous ses documents + son devis officiel.
 * Conserve un log textuel (sans données personnelles) pour traçabilité.
 *
 * Confirmation supplémentaire requise via header X-Confirm-Reference qui doit
 * matcher la référence — protection contre suppression accidentelle.
 */

import { NextResponse } from "next/server";
import { promises as fs } from "node:fs";
import path from "node:path";
import { requireAdminApi } from "@/lib/require-admin";
import { getLead } from "@/lib/leads-store";
import { deleteQuote } from "@/lib/quotes-store";
import { logger } from "@/lib/logger";
import { logActivity } from "@/lib/activity-log";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DATA_DIR = path.join(process.cwd(), "data");
const INDEX_FILE = path.join(DATA_DIR, "leads.json");
const PHOTOS_DIR = path.join(DATA_DIR, "photos");
const DOCS_DIR = path.join(DATA_DIR, "documents");

export async function DELETE(
  req: Request,
  { params }: { params: { reference: string } },
) {
  const auth = await requireAdminApi(req);
  if (!auth.ok) return auth.response;

  // Double-confirmation
  const confirm = req.headers.get("x-confirm-reference");
  if (confirm !== params.reference) {
    return NextResponse.json(
      { error: "Confirmation manquante (header X-Confirm-Reference invalide)" },
      { status: 400 },
    );
  }

  const lead = await getLead(params.reference);
  if (!lead) {
    return NextResponse.json({ error: "Lead introuvable" }, { status: 404 });
  }

  // 1. Retirer du store fichier
  try {
    const raw = await fs.readFile(INDEX_FILE, "utf8");
    const all = JSON.parse(raw) as { reference: string }[];
    const filtered = all.filter((x) => x.reference !== params.reference);
    await fs.writeFile(INDEX_FILE, JSON.stringify(filtered, null, 2), "utf8");
  } catch (e) {
    logger.error("admin.rgpd_delete_index_failed", e, { reference: params.reference });
  }

  // 2. Supprimer photos
  try {
    await fs.rm(path.join(PHOTOS_DIR, params.reference), {
      recursive: true,
      force: true,
    });
  } catch {}

  // 3. Supprimer documents
  try {
    await fs.rm(path.join(DOCS_DIR, params.reference), {
      recursive: true,
      force: true,
    });
  } catch {}

  // 4. Supprimer devis officiel
  await deleteQuote(params.reference);

  // Log textuel anonymisé (pas de données personnelles dedans)
  logger.info("admin.rgpd_delete_complete", {
    reference: params.reference,
    deletedAt: new Date().toISOString(),
  });
  void logActivity(
    "lead.rgpd_delete",
    "Dossier supprimé définitivement (droit à l'oubli RGPD)",
    { reference: params.reference },
  );

  return NextResponse.json({
    ok: true,
    message: `Lead ${params.reference} et toutes ses données associées supprimés définitivement.`,
  });
}
