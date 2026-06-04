/**
 * Endpoint public pour ingérer un pageview/event.
 *
 * Rate-limited par IP pour éviter spam. Anonymisation côté serveur.
 */

import { NextResponse } from "next/server";
import { z } from "zod";
import { rateLimit, clientKey } from "@/lib/rate-limit";
import {
  track,
  hashSession,
  detectBrowser,
  detectDevice,
  shortReferer,
} from "@/lib/analytics-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const EventSchema = z.object({
  type: z.enum(["pageview", "event"]).default("pageview"),
  path: z.string().min(1).max(500),
  name: z.string().max(120).optional(),
  duration: z.number().int().min(0).max(3_600_000).optional(),
  meta: z.record(z.union([z.string(), z.number(), z.boolean()])).optional(),
});

export async function POST(req: Request) {
  const ip = clientKey(req.headers);
  const limit = rateLimit(`analytics:${ip}`, { windowMs: 60_000, max: 60 });
  if (!limit.ok) {
    return NextResponse.json({ error: "Rate limit" }, { status: 429 });
  }
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON invalide" }, { status: 400 });
  }
  const parsed = EventSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ ok: true }); // silent fail
  }

  const ua = req.headers.get("user-agent") ?? "";
  const referer = req.headers.get("referer");

  await track({
    type: parsed.data.type,
    path: parsed.data.path,
    name: parsed.data.name,
    duration: parsed.data.duration,
    meta: parsed.data.meta,
    refererHost: shortReferer(referer),
    browser: detectBrowser(ua),
    device: detectDevice(ua),
    sessionHash: hashSession(ip, ua),
  });

  return NextResponse.json({ ok: true });
}
