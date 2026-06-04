/**
 * GET  /api/admin/certifications → liste + stats
 * POST /api/admin/certifications → création
 */

import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/require-admin";
import {
  listCertifications,
  createCertification,
  computeStats,
} from "@/lib/certifications-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const auth = await requireAdminApi(req);
  if (!auth.ok) return auth.response;
  const url = new URL(req.url);
  const techEmail = url.searchParams.get("techEmail") ?? undefined;
  const [certs, stats] = await Promise.all([
    listCertifications({ techEmail }),
    computeStats(),
  ]);
  return NextResponse.json({ certifications: certs, stats });
}

export async function POST(req: Request) {
  const auth = await requireAdminApi(req);
  if (!auth.ok) return auth.response;
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON invalide" }, { status: 400 });
  }
  try {
    const cert = await createCertification(body as never);
    return NextResponse.json({ certification: cert });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Erreur" },
      { status: 400 },
    );
  }
}
