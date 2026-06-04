/**
 * GET   /api/admin/candidates       → liste des candidatures (filtrable jobId)
 * PATCH /api/admin/candidates       → change le statut (id + status)
 */

import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminApi } from "@/lib/require-admin";
import { listCandidates, updateCandidateStatus } from "@/lib/candidates-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const PatchSchema = z.object({
  id: z.string().min(1).max(40),
  status: z.enum(["new", "reviewed", "shortlisted", "rejected", "hired"]),
});

export async function GET(req: Request) {
  const auth = await requireAdminApi(req);
  if (!auth.ok) return auth.response;
  const { searchParams } = new URL(req.url);
  const jobId = searchParams.get("jobId") ?? undefined;
  const candidates = await listCandidates({ jobId });
  return NextResponse.json({ candidates });
}

export async function PATCH(req: Request) {
  const auth = await requireAdminApi(req);
  if (!auth.ok) return auth.response;
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON invalide" }, { status: 400 });
  }
  const parsed = PatchSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Données invalides", details: parsed.error.flatten() },
      { status: 400 },
    );
  }
  const c = await updateCandidateStatus(parsed.data.id, parsed.data.status);
  if (!c)
    return NextResponse.json(
      { error: "Candidat introuvable" },
      { status: 404 },
    );
  return NextResponse.json({ candidate: c });
}
