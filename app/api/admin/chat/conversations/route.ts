import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/require-admin";
import { listConversations } from "@/lib/chat-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const auth = await requireAdminApi(req);
  if (!auth.ok) return auth.response;
  const conversations = await listConversations();
  const totalUnread = conversations.reduce((s, c) => s + c.unreadAgent, 0);
  return NextResponse.json({
    conversations: conversations.map((c) => ({
      id: c.id,
      visitorName: c.visitorName,
      visitorEmail: c.visitorEmail,
      visitorPath: c.visitorPath,
      status: c.status,
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
      unreadAgent: c.unreadAgent,
      lastMessage: c.messages[c.messages.length - 1] ?? null,
    })),
    totalUnread,
  });
}
