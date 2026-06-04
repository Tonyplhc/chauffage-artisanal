/**
 * GET /api/experiment?target=home_hero_cta&visitor=xxx
 * → renvoie le variant assigné et son config
 *
 * Public, rate-limited.
 */

import { NextResponse } from "next/server";
import { rateLimit, clientKey } from "@/lib/rate-limit";
import {
  getActiveExperimentByTarget,
  assignAndRecord,
} from "@/lib/experiments-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const ip = clientKey(req.headers);
  const limit = rateLimit(`exp:${ip}`, { windowMs: 60_000, max: 60 });
  if (!limit.ok) return NextResponse.json({ error: "rate" }, { status: 429 });

  const url = new URL(req.url);
  const target = url.searchParams.get("target");
  const visitor = url.searchParams.get("visitor");
  if (!target || !visitor || visitor.length < 4 || visitor.length > 80) {
    return NextResponse.json({ error: "params" }, { status: 400 });
  }

  const exp = await getActiveExperimentByTarget(target as never);
  if (!exp) {
    return NextResponse.json({ variant: null, config: {} });
  }
  const result = await assignAndRecord(exp.id, visitor);
  if (!result) return NextResponse.json({ variant: null, config: {} });
  return NextResponse.json({
    expId: exp.id,
    variant: result.variantId,
    config: result.config,
  });
}
