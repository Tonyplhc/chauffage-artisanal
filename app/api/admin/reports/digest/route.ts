import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/require-admin";
import {
  maybeSendWeeklyDigest,
  computeWeeklyStats,
  getLastDigestInfo,
} from "@/lib/weekly-digest";
import { logActivity } from "@/lib/activity-log";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const auth = await requireAdminApi(req);
  if (!auth.ok) return auth.response;
  const stats = await computeWeeklyStats();
  const info = await getLastDigestInfo();
  return NextResponse.json({ stats, lastSentAt: info.lastSentAt, history: info.lastDigest });
}

export async function POST(req: Request) {
  const auth = await requireAdminApi(req, { roles: ["admin"] });
  if (!auth.ok) return auth.response;
  const url = new URL(req.url);
  const force = url.searchParams.get("force") === "1";
  const result = await maybeSendWeeklyDigest(force);
  void logActivity(
    "lead.template_sent",
    `Digest hebdo ${result.sent ? `envoyé à ${result.sent}` : "ignoré"}${
      result.reason ? ` (${result.reason})` : ""
    }`,
    { meta: result },
  );
  return NextResponse.json(result);
}
