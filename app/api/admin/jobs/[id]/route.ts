/**
 * PATCH  /api/admin/jobs/[id]  → met à jour une offre
 * DELETE /api/admin/jobs/[id]  → supprime une offre
 */

import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminApi } from "@/lib/require-admin";
import { updateJob, deleteJob } from "@/lib/jobs-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const PatchSchema = z.object({
  slug: z.string().min(2).max(80).optional(),
  title: z.string().min(3).max(120).optional(),
  contractType: z
    .enum(["CDI", "CDD", "interim", "alternance", "stage", "freelance"])
    .optional(),
  workTime: z.enum(["plein", "partiel"]).optional(),
  salaryMin: z.number().int().min(0).max(50000).optional(),
  salaryMax: z.number().int().min(0).max(50000).optional(),
  description: z.string().min(20).max(8000).optional(),
  benefits: z.array(z.string().min(2).max(160)).max(20).optional(),
  status: z.enum(["open", "closed", "draft"]).optional(),
});

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } },
) {
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
  const job = await updateJob(params.id, parsed.data);
  if (!job)
    return NextResponse.json({ error: "Offre introuvable" }, { status: 404 });
  return NextResponse.json({ job });
}

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } },
) {
  const auth = await requireAdminApi(req);
  if (!auth.ok) return auth.response;
  const ok = await deleteJob(params.id);
  if (!ok)
    return NextResponse.json({ error: "Offre introuvable" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
