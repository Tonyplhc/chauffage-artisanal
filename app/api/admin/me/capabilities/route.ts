/**
 * GET /api/admin/me/capabilities → la liste des capabilities de l'utilisateur
 * connecté. Utilisé par la sidebar pour filtrer les entrées affichées.
 *
 * Si la session a un userId, on récupère les capabilities du store.
 * Sinon (mode mono-admin legacy via ADMIN_PASSWORD), on renvoie TOUT.
 */

import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/require-admin";
import { getUserCapabilities } from "@/lib/users-store";
import { CAPABILITIES } from "@/lib/capabilities";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const auth = await requireAdminApi(req);
  if (!auth.ok) return auth.response;

  const session = auth.session as { userId?: string; role?: string } | undefined;
  if (session?.userId) {
    const caps = await getUserCapabilities(session.userId);
    return NextResponse.json({
      capabilities: caps,
      role: session.role ?? null,
    });
  }
  // Legacy : pas de user en base → admin unique = toutes capabilities
  return NextResponse.json({
    capabilities: CAPABILITIES.map((c) => c.id),
    role: "admin",
  });
}
