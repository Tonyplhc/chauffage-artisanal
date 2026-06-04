import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/require-admin";
import { deleteDocument, readDocument } from "@/lib/documents-store";
import { logger } from "@/lib/logger";
import { logActivity } from "@/lib/activity-log";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  req: Request,
  { params }: { params: { reference: string; docId: string } },
) {
  const auth = await requireAdminApi(req);
  if (!auth.ok) return auth.response;
  const found = await readDocument(params.reference, params.docId);
  if (!found) {
    return NextResponse.json({ error: "Document introuvable" }, { status: 404 });
  }
  return new NextResponse(found.buffer, {
    status: 200,
    headers: {
      "Content-Type": found.doc.mime,
      "Content-Disposition": `inline; filename="${encodeURIComponent(found.doc.filename)}"`,
      "Cache-Control": "private, no-cache",
    },
  });
}

export async function DELETE(
  req: Request,
  { params }: { params: { reference: string; docId: string } },
) {
  const auth = await requireAdminApi(req);
  if (!auth.ok) return auth.response;
  const ok = await deleteDocument(params.reference, params.docId);
  if (!ok) {
    return NextResponse.json({ error: "Document introuvable" }, { status: 404 });
  }
  logger.info("admin.document_deleted", {
    reference: params.reference,
    docId: params.docId,
  });
  void logActivity("lead.document_deleted", "Document supprimé", {
    reference: params.reference,
    meta: { docId: params.docId },
  });
  return NextResponse.json({ ok: true });
}
