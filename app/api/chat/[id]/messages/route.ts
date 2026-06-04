/**
 * GET  /api/chat/[id]/messages?since=ISO  → messages depuis `since`
 * POST /api/chat/[id]/messages           → ajouter un message (visitor)
 */

import { NextResponse } from "next/server";
import { z } from "zod";
import { rateLimit, clientKey } from "@/lib/rate-limit";
import {
  getConversation,
  getMessagesSince,
  addMessage,
  markRead,
} from "@/lib/chat-store";
import { publish } from "@/lib/event-bus";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const PostSchema = z.object({
  text: z.string().min(1).max(2000),
  visitorName: z.string().max(120).optional(),
  visitorEmail: z.string().email().max(180).optional(),
});

export async function GET(
  req: Request,
  { params }: { params: { id: string } },
) {
  const url = new URL(req.url);
  const since = url.searchParams.get("since") ?? "1970-01-01T00:00:00.000Z";
  const c = await getConversation(params.id);
  if (!c) return NextResponse.json({ error: "not_found" }, { status: 404 });
  // Mark as read by visitor
  if (url.searchParams.get("ack") === "1") {
    await markRead(params.id, "visitor");
  }
  const messages = await getMessagesSince(params.id, since);
  return NextResponse.json({
    status: c.status,
    messages,
    unreadVisitor: c.unreadVisitor,
  });
}

export async function POST(
  req: Request,
  { params }: { params: { id: string } },
) {
  const ip = clientKey(req.headers);
  const limit = rateLimit(`chat-msg:${ip}`, { windowMs: 60_000, max: 30 });
  if (!limit.ok) return NextResponse.json({ error: "rate" }, { status: 429 });

  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return NextResponse.json({ error: "json" }, { status: 400 });
  }
  const parsed = PostSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid" }, { status: 400 });
  }
  const conv = await getConversation(params.id);
  if (!conv) return NextResponse.json({ error: "not_found" }, { status: 404 });
  if (conv.status === "closed") {
    return NextResponse.json({ error: "closed" }, { status: 409 });
  }
  const m = await addMessage(params.id, {
    sender: "visitor",
    text: parsed.data.text,
  });
  publish({
    type: "lead.created",
    at: m?.at ?? new Date().toISOString(),
    reference: params.id,
    fullName: parsed.data.visitorName ?? conv.visitorName ?? "Visiteur",
    services: ["autre"] as never,
    commune: "Chat",
  });
  return NextResponse.json({ ok: true, message: m });
}
