/**
 * GET  /api/admin/jobs       → liste TOUTES les offres (toutes statuts)
 * POST /api/admin/jobs       → crée une nouvelle offre
 */

import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminApi } from "@/lib/require-admin";
import { listJobs, createJob } from "@/lib/jobs-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const CreateSchema = z.object({
  slug: z
    .string()
    .min(2)
    .max(80)
    .regex(/^[a-z0-9-]+$/, "slug : lettres, chiffres, tirets"),
  title: z.string().min(3).max(120),
  contractType: z.enum(["CDI", "CDD", "interim", "alternance", "stage", "freelance"]),
  workTime: z.enum(["plein", "partiel"]),
  salaryMin: z.number().int().min(0).max(50000).optional(),
  salaryMax: z.number().int().min(0).max(50000).optional(),
  description: z.string().min(20).max(8000),
  benefits: z.array(z.string().min(2).max(160)).max(20).default([]),
  status: z.enum(["open", "closed", "draft"]).default("open"),
});

export async function GET(req: Request) {
  const auth = await requireAdminApi(req);
  if (!auth.ok) return auth.response;
  const jobs = await listJobs({});
  return NextResponse.json({ jobs });
}

export async function POST(req: Request) {
  const auth = await requireAdminApi(req);
  if (!auth.ok) return auth.response;
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON invalide" }, { status: 400 });
  }
  const parsed = CreateSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Données invalides", details: parsed.error.flatten() },
      { status: 400 },
    );
  }
  const job = await createJob(parsed.data);
  return NextResponse.json({ job });
}
