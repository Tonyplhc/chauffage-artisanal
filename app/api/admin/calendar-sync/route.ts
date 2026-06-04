/**
 * GET /api/admin/calendar-sync → URLs des feeds iCal (admin global + perso).
 */

import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/require-admin";
import { makeIcalToken } from "@/lib/ical-token";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const auth = await requireAdminApi(req);
  if (!auth.ok) return auth.response;
  const email = (auth.session as { email?: string } | undefined)?.email;
  const baseUrl = process.env.PUBLIC_URL ?? "http://localhost:3020";

  const globalToken = makeIcalToken("admin");
  const globalUrl = `${baseUrl}/api/calendar/admin.ics?t=${globalToken}`;

  let personalUrl: string | undefined;
  if (email) {
    const userToken = makeIcalToken(email);
    personalUrl = `${baseUrl}/api/calendar/admin.ics?t=${userToken}&u=${encodeURIComponent(email)}`;
  }

  return NextResponse.json({
    globalUrl,
    personalUrl,
    email,
  });
}
