import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/require-admin";
import { listActivity } from "@/lib/activity-log";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const auth = await requireAdminApi(req);
  if (!auth.ok) return auth.response;
  const entries = await listActivity();
  return NextResponse.json({ entries });
}
