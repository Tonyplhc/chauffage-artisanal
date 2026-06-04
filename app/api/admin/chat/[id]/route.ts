import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminApi } from "@/lib/require-admin";
import {
  getConversation,
  addMessage,
  markRead,
  closeConversation,
} from "@/lib/chat-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const PostSchema = z.object({
  text: z.string().min(1).max(2000),
});

export async function GET(
  req: Request,
  { params }: { params: { id: string } },
) {
  const auth = await requireAdminApi(req);
  if (!auth.ok) return auth.response;
  const c = await getConversation(params.id);
  if (!c) return NextResponse.json({ error: "not_found" }, { status: 404 });
  // Mark read by agent
  await markRead(params.id, "agent");
  return NextResponse.json({ conversation: c });
}

export async function POST(
  req: Request,
  { params }: { params: { id: string } },
) {
  const auth = await requireAdminApi(req);
  if (!auth.ok) return auth.response;
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return NextResponse.json({ error: "json" }, { status: 400 });
  }
  const parsed = PostSchema.safeParse(raw);
  if (!parsed.success) return NextResponse.json({ error: "invalid" }, { status: 400 });
  const conv = await getConversation(params.id);
  if (!conv) return NextResponse.json({ error: "not_found" }, { status: 404 });
  if (conv.status === "closed") {
    return NextResponse.json({ error: "closed" }, { status: 409 });
  }
  const m = await addMessage(params.id, {
    sender: "agent",
    agentEmail: auth.session.email,
    text: parsed.data.text,
  });
  return NextResponse.json({ message: m });
}

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } },
) {
  const auth = await requireAdminApi(req);
  if (!auth.ok) return auth.response;
  const ok = await closeConversation(params.id);
  if (!ok) return NextResponse.json({ error: "not_found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
