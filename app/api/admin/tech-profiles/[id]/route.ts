/**
 * DELETE /api/admin/tech-profiles/[id]
 */

import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/require-admin";
import { deleteProfile } from "@/lib/tech-profiles-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } },
) {
  const auth = await requireAdminApi(req);
  if (!auth.ok) return auth.response;
  await deleteProfile(params.id);
  return NextResponse.json({ ok: true });
}
