/**
 * POST /api/chat → ouvre une conversation
 * body: { name?, email?, path? }
 */

import { NextResponse } from "next/server";
import { z } from "zod";
import { rateLimit, clientKey } from "@/lib/rate-limit";
import { createConversation } from "@/lib/chat-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const Schema = z.object({
  name: z.string().max(120).optional(),
  email: z.string().email().max(180).optional(),
  path: z.string().max(500).optional(),
});

export async function POST(req: Request) {
  const ip = clientKey(req.headers);
  const limit = rateLimit(`chat-open:${ip}`, { windowMs: 60_000, max: 5 });
  if (!limit.ok) {
    return NextResponse.json({ error: "rate" }, { status: 429 });
  }
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    raw = {};
  }
  const parsed = Schema.safeParse(raw);
  const data = parsed.success ? parsed.data : {};
  const c = await createConversation({
    visitorName: data.name,
    visitorEmail: data.email,
    visitorPath: data.path,
  });
  return NextResponse.json({ conversationId: c.id });
}
