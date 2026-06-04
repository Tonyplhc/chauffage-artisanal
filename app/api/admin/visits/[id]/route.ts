/**
 * GET    /api/admin/visits/[id]   → détail visite
 * PATCH  /api/admin/visits/[id]   → édition / finalisation
 * PUT    /api/admin/visits/[id]   → upsert (self-healing après cold-start Vercel)
 * DELETE /api/admin/visits/[id]
 */

import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/require-admin";
import {
  getVisit,
  updateVisit,
  deleteVisit,
  upsertVisit,
} from "@/lib/maintenance-visits-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  req: Request,
  { params }: { params: { id: string } },
) {
  const auth = await requireAdminApi(req);
  if (!auth.ok) return auth.response;
  const visit = await getVisit(params.id);
  if (!visit) {
    return NextResponse.json({ error: "Introuvable" }, { status: 404 });
  }
  return NextResponse.json({ visit });
}

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } },
) {
  const auth = await requireAdminApi(req);
  if (!auth.ok) return auth.response;
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON invalide" }, { status: 400 });
  }
  try {
    const visit = await updateVisit(params.id, body as never);
    if (!visit) {
      return NextResponse.json({ error: "Introuvable" }, { status: 404 });
    }
    return NextResponse.json({ visit });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Erreur" },
      { status: 400 },
    );
  }
}

/**
 * PUT — upsert. Le client envoie la visite COMPLÈTE (tel qu'elle existe dans
 * sa mémoire locale après un cold-start Vercel qui aurait perdu la row).
 * Permet au front de "se réparer" tout seul si la PATCH renvoie 404 parce
 * que l'instance Lambda du PATCH n'a pas vu la création initiale.
 *
 * Sécurité : l'ID dans l'URL prime sur celui du body. Auth admin obligatoire.
 */
export async function PUT(
  req: Request,
  { params }: { params: { id: string } },
) {
  const auth = await requireAdminApi(req);
  if (!auth.ok) return auth.response;
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON invalide" }, { status: 400 });
  }
  try {
    const visit = await upsertVisit(params.id, body as never);
    return NextResponse.json({ visit });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Erreur" },
      { status: 400 },
    );
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } },
) {
  const auth = await requireAdminApi(req);
  if (!auth.ok) return auth.response;
  await deleteVisit(params.id);
  return NextResponse.json({ ok: true });
}
