/**
 * GET /api/admin/me
 * Retourne les infos de l'utilisateur connecté (email, role) à partir du token.
 */

import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/require-admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const auth = await requireAdminApi(req);
  if (!auth.ok) return auth.response;
  return NextResponse.json({
    email: auth.session.email ?? null,
    role: auth.session.role,
    userId: auth.session.userId ?? null,
  });
}
