/**
 * Recherche transversale admin — utilisée par le command palette en zone admin.
 *
 * Cherche dans : leads (référence/nom/email/commune/notes), conversations chat,
 * activity log, devis officiels (numéro/lignes), articles.
 *
 * Retour : résultats groupés par type, max 5 par type.
 */

import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/require-admin";
import { listLeads } from "@/lib/leads-store";
import { listConversations } from "@/lib/chat-store";
import { listActivity } from "@/lib/activity-log";
import { ARTICLES } from "@/lib/articles";
import { promises as fs } from "node:fs";
import path from "node:path";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DATA_DIR = path.join(process.cwd(), "data");

type Hit = {
  type: "lead" | "chat" | "activity" | "quote" | "article";
  id: string;
  title: string;
  subtitle: string;
  href: string;
  score: number;
};

function scoreMatch(haystack: string, query: string): number {
  const hL = haystack.toLowerCase();
  const qL = query.toLowerCase();
  if (!hL.includes(qL)) return 0;
  let s = 1;
  if (hL.startsWith(qL)) s += 3;
  if (hL.split(/\s+/).includes(qL)) s += 2;
  return s;
}

export async function GET(req: Request) {
  const auth = await requireAdminApi(req);
  if (!auth.ok) return auth.response;
  const url = new URL(req.url);
  const q = (url.searchParams.get("q") ?? "").trim();
  if (!q || q.length < 2) {
    return NextResponse.json({ hits: [] });
  }

  const hits: Hit[] = [];

  // Leads
  const leads = await listLeads();
  for (const l of leads) {
    const blob = `${l.reference} ${l.fullName} ${l.email} ${l.commune} ${l.services.join(" ")} ${l.notes ?? ""}`;
    const s = scoreMatch(blob, q);
    if (s > 0) {
      hits.push({
        type: "lead",
        id: l.reference,
        title: l.fullName,
        subtitle: `${l.reference} · ${l.commune} · ${l.services.join(" · ")}`,
        href: `/admin/leads/${l.reference}`,
        score: s,
      });
    }
  }

  // Conversations chat
  const convs = await listConversations();
  for (const c of convs) {
    const lastMsg = c.messages[c.messages.length - 1];
    const blob = `${c.visitorName ?? ""} ${c.visitorEmail ?? ""} ${lastMsg?.text ?? ""}`;
    const s = scoreMatch(blob, q);
    if (s > 0) {
      hits.push({
        type: "chat",
        id: c.id,
        title: c.visitorName ?? "Conversation",
        subtitle: lastMsg?.text?.slice(0, 100) ?? "(vide)",
        href: `/admin/chat`,
        score: s,
      });
    }
  }

  // Activity
  const acts = await listActivity();
  for (const a of acts.slice(0, 500)) {
    const blob = `${a.summary} ${a.reference ?? ""}`;
    const s = scoreMatch(blob, q);
    if (s > 0) {
      hits.push({
        type: "activity",
        id: a.id,
        title: a.summary,
        subtitle: `${new Date(a.at).toLocaleString("fr-FR")} · ${a.reference ?? a.type}`,
        href: a.reference ? `/admin/leads/${a.reference}` : "/admin/activity",
        score: s * 0.5, // moins prioritaire
      });
    }
  }

  // Quotes — lecture directe fichier
  try {
    const raw = await fs.readFile(path.join(DATA_DIR, "quotes.json"), "utf8");
    const quotes = JSON.parse(raw) as { leadReference: string; number: string; lines: { description: string }[] }[];
    for (const qt of quotes) {
      const linesText = qt.lines.map((l) => l.description).join(" ");
      const blob = `${qt.number} ${qt.leadReference} ${linesText}`;
      const s = scoreMatch(blob, q);
      if (s > 0) {
        hits.push({
          type: "quote",
          id: qt.leadReference,
          title: `Devis n° ${qt.number}`,
          subtitle: `${qt.leadReference} · ${qt.lines.length} ligne(s)`,
          href: `/admin/leads/${qt.leadReference}/quote`,
          score: s,
        });
      }
    }
  } catch {
    // pas de quotes
  }

  // Articles
  for (const a of ARTICLES) {
    const blob = `${a.title} ${a.excerpt} ${a.slug}`;
    const s = scoreMatch(blob, q);
    if (s > 0) {
      hits.push({
        type: "article",
        id: a.slug,
        title: a.title,
        subtitle: a.excerpt,
        href: `/actualites/${a.slug}`,
        score: s * 0.7,
      });
    }
  }

  // Sort + cap par type
  const sorted = hits.sort((a, b) => b.score - a.score);
  const grouped: Record<string, Hit[]> = {};
  for (const h of sorted) {
    if (!grouped[h.type]) grouped[h.type] = [];
    if (grouped[h.type].length < 5) grouped[h.type].push(h);
  }

  return NextResponse.json({
    hits: sorted.slice(0, 25),
    grouped,
    counts: {
      lead: sorted.filter((h) => h.type === "lead").length,
      chat: sorted.filter((h) => h.type === "chat").length,
      activity: sorted.filter((h) => h.type === "activity").length,
      quote: sorted.filter((h) => h.type === "quote").length,
      article: sorted.filter((h) => h.type === "article").length,
    },
  });
}
