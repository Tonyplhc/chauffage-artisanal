/**
 * GET /api/calendar/admin.ics?t=<token>
 *
 * Endpoint public — protégé uniquement par le token HMAC. Renvoie un feed
 * iCal RFC 5545 abonnable depuis Google Calendar / Apple / Outlook.
 *
 * Filtre optionnel ?u=<email> pour limiter aux RDV assignés à un user.
 */

import { NextResponse } from "next/server";
import { composeCalendarEvents } from "@/lib/admin-calendar";
import { generateIcal } from "@/lib/ical";
import { verifyIcalToken } from "@/lib/ical-token";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const token = url.searchParams.get("t") ?? undefined;
  const user = url.searchParams.get("u")?.trim() || undefined;
  const scope = user ? user : "admin";
  if (!verifyIcalToken(scope, token)) {
    return NextResponse.json({ error: "Token invalide" }, { status: 401 });
  }

  const events = await composeCalendarEvents({
    assignedToFilter: user,
  });
  const ics = generateIcal({
    name: user
      ? `Chauffage Artisanal · ${user}`
      : "Chauffage Artisanal · Pipeline admin",
    events,
  });

  return new Response(ics, {
    status: 200,
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Cache-Control": "public, max-age=300", // 5 min cache CDN-side
      "Content-Disposition": `inline; filename="chauffage-artisanal${user ? `-${user.replace(/[^a-z0-9]/gi, "_")}` : ""}.ics"`,
    },
  });
}
