/**
 * GET /api/recrutement → liste des offres ouvertes (public).
 */

import { NextResponse } from "next/server";
import { listJobs } from "@/lib/jobs-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const jobs = await listJobs({ status: "open" });
  return NextResponse.json({ jobs });
}
