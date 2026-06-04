/**
 * Backup / restore admin.
 *
 * GET    → export complet de toutes les données (JSON ZIP-like dans un objet)
 * POST   → restore depuis un backup (remplace les fichiers data/*)
 *
 * Auth admin requise (role admin uniquement pour POST).
 */

import { NextResponse } from "next/server";
import { promises as fs } from "node:fs";
import path from "node:path";
import { z } from "zod";
import { requireAdminApi } from "@/lib/require-admin";
import { logger } from "@/lib/logger";
import { logActivity } from "@/lib/activity-log";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DATA_DIR = path.join(process.cwd(), "data");

const BACKUP_FILES = [
  "leads.json",
  "catalogue.json",
  "quotes.json",
  "email-templates.json",
  "newsletter.json",
  "activity-log.json",
  "users.json",
  "analytics-events.json",
  "2fa-secret.txt",
] as const;

const BackupSchema = z.object({
  version: z.number(),
  exportedAt: z.string(),
  files: z.record(z.string()),
});

export async function GET(req: Request) {
  const auth = await requireAdminApi(req);
  if (!auth.ok) return auth.response;

  const files: Record<string, string> = {};
  for (const f of BACKUP_FILES) {
    try {
      files[f] = await fs.readFile(path.join(DATA_DIR, f), "utf8");
    } catch {
      // Fichier inexistant — on ignore (sera créé au prochain restore si besoin)
    }
  }

  const payload = {
    version: 1,
    exportedAt: new Date().toISOString(),
    files,
  };

  void logActivity("auth.login", "Backup complet exporté", {
    meta: { fileCount: Object.keys(files).length },
  });
  logger.info("admin.backup_exported", { files: Object.keys(files).length });

  const filename = `backup-chauffage-artisanal-${new Date()
    .toISOString()
    .slice(0, 10)}.json`;

  return new NextResponse(JSON.stringify(payload, null, 2), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}

export async function POST(req: Request) {
  const auth = await requireAdminApi(req, { roles: ["admin"] });
  if (!auth.ok) return auth.response;

  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON invalide" }, { status: 400 });
  }
  const parsed = BackupSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Format backup invalide" },
      { status: 400 },
    );
  }

  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
  } catch {}

  let restored = 0;
  for (const [name, content] of Object.entries(parsed.data.files)) {
    if (!(BACKUP_FILES as readonly string[]).includes(name)) continue; // sécurité : whitelist
    try {
      await fs.writeFile(path.join(DATA_DIR, name), content, "utf8");
      restored++;
    } catch (e) {
      logger.warn("admin.backup_restore_file_failed", { file: name, error: String(e) });
    }
  }

  void logActivity("auth.login", `Restore backup · ${restored} fichier(s)`, {
    meta: { restored, source: "upload", backupDate: parsed.data.exportedAt },
  });
  logger.info("admin.backup_restored", { restored });

  return NextResponse.json({ ok: true, restored });
}
