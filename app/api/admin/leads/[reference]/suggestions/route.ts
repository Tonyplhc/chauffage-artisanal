/**
 * GET /api/admin/leads/[reference]/suggestions
 *   → renvoie 3-6 suggestions de réponse contextuelles pour ce lead.
 *
 * Le moteur (`lib/email-assistant`) est rules-based, déterministe, et
 * cherche le dernier message client (chat ou commentaire) pour ajuster le ton.
 */

import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/require-admin";
import { getLead } from "@/lib/leads-store";
import { listConversations } from "@/lib/chat-store";
import { suggestEmailReplies } from "@/lib/email-assistant";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  req: Request,
  { params }: { params: { reference: string } },
) {
  const auth = await requireAdminApi(req);
  if (!auth.ok) return auth.response;
  const lead = await getLead(params.reference);
  if (!lead) {
    return NextResponse.json({ error: "Lead introuvable" }, { status: 404 });
  }

  // Cherche le dernier message visiteur via l'email du lead
  let lastClientMessage: string | undefined;
  let lastClientMessageAt: string | undefined;
  try {
    const convs = await listConversations();
    const candidates = convs.filter(
      (c) =>
        c.visitorEmail &&
        lead.email &&
        c.visitorEmail.toLowerCase() === lead.email.toLowerCase(),
    );
    let bestMsg: { text: string; at: string } | null = null;
    for (const c of candidates) {
      for (const m of c.messages) {
        if (m.sender !== "visitor") continue;
        if (!bestMsg || new Date(m.at).getTime() > new Date(bestMsg.at).getTime()) {
          bestMsg = { text: m.text, at: m.at };
        }
      }
    }
    if (bestMsg) {
      lastClientMessage = bestMsg.text;
      lastClientMessageAt = bestMsg.at;
    }
  } catch {
    // chat store absent ou illisible — on continue sans contexte sentiment
  }

  const suggestions = await suggestEmailReplies({
    lead,
    lastClientMessage,
    lastClientMessageAt,
  });

  return NextResponse.json({
    suggestions,
    context: {
      lastClientMessageAt: lastClientMessageAt ?? null,
      hasClientMessage: Boolean(lastClientMessage),
    },
  });
}
