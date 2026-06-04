import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/require-admin";
import {
  listDocuments,
  saveDocument,
  ALLOWED_MIME,
  MAX_BYTES,
} from "@/lib/documents-store";
import { logger } from "@/lib/logger";
import { logActivity } from "@/lib/activity-log";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  req: Request,
  { params }: { params: { reference: string } },
) {
  const auth = await requireAdminApi(req);
  if (!auth.ok) return auth.response;
  const documents = await listDocuments(params.reference);
  return NextResponse.json({ documents });
}

export async function POST(
  req: Request,
  { params }: { params: { reference: string } },
) {
  const auth = await requireAdminApi(req);
  if (!auth.ok) return auth.response;

  const form = await req.formData();
  const file = form.get("file");
  const label = (form.get("label") as string | null) ?? undefined;

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Fichier manquant" }, { status: 400 });
  }
  if (file.size === 0) {
    return NextResponse.json({ error: "Fichier vide" }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json(
      { error: `Fichier trop volumineux (max ${MAX_BYTES / 1024 / 1024} MB)` },
      { status: 413 },
    );
  }
  if (!ALLOWED_MIME.includes(file.type)) {
    return NextResponse.json(
      { error: `Type non autorisé : ${file.type}` },
      { status: 400 },
    );
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const doc = await saveDocument(params.reference, file.name, file.type, buffer, label);
  logger.info("admin.document_uploaded", {
    reference: params.reference,
    docId: doc.id,
    size: doc.size,
  });
  void logActivity("lead.document_uploaded", `Document ajouté · ${doc.filename}`, {
    reference: params.reference,
    meta: { docId: doc.id, size: doc.size, mime: doc.mime },
  });
  return NextResponse.json({ document: doc }, { status: 201 });
}
