/**
 * GET /api/admin/me/signature  → signature du user connecté
 * PUT /api/admin/me/signature  { html, text, includeInTemplates, includeInCampaigns }
 * DELETE /api/admin/me/signature → réinitialise
 */

import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/require-admin";
import {
  getSignature,
  upsertSignature,
  deleteSignature,
} from "@/lib/email-signatures-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function getEmail(session: unknown): string | null {
  if (!session || typeof session !== "object") return null;
  const e = (session as { email?: unknown }).email;
  return typeof e === "string" ? e : null;
}

export async function GET(req: Request) {
  const auth = await requireAdminApi(req);
  if (!auth.ok) return auth.response;
  const email = getEmail(auth.session);
  if (!email) {
    return NextResponse.json(
      { error: "Session sans email" },
      { status: 400 },
    );
  }
  const signature = await getSignature(email);
  return NextResponse.json({ signature, email });
}

export async function PUT(req: Request) {
  const auth = await requireAdminApi(req);
  if (!auth.ok) return auth.response;
  const email = getEmail(auth.session);
  if (!email) {
    return NextResponse.json(
      { error: "Session sans email" },
      { status: 400 },
    );
  }
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON invalide" }, { status: 400 });
  }
  try {
    const sig = await upsertSignature(email, {
      html: typeof body.html === "string" ? body.html : undefined,
      text: typeof body.text === "string" ? body.text : undefined,
      includeInTemplates:
        typeof body.includeInTemplates === "boolean"
          ? body.includeInTemplates
          : undefined,
      includeInCampaigns:
        typeof body.includeInCampaigns === "boolean"
          ? body.includeInCampaigns
          : undefined,
    });
    return NextResponse.json({ signature: sig });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Erreur" },
      { status: 400 },
    );
  }
}

export async function DELETE(req: Request) {
  const auth = await requireAdminApi(req);
  if (!auth.ok) return auth.response;
  const email = getEmail(auth.session);
  if (!email) {
    return NextResponse.json(
      { error: "Session sans email" },
      { status: 400 },
    );
  }
  await deleteSignature(email);
  return NextResponse.json({ ok: true });
}
