/**
 * Export RGPD COMPLET — bundle JSON exhaustif pour un lead.
 *
 * Contrairement à `/rgpd/export` (lead + documents + quote), celui-ci aggrège
 * absolument toutes les données détenues sur la personne concernée :
 *
 *   - Lead record + statusHistory
 *   - Documents listés (avec URLs admin)
 *   - Quote(s) officiel(s)
 *   - Toutes les conversations chat avec ce visitorEmail
 *   - Toutes les entrées activity log liées à la référence
 *   - Tous les événements email tracking (opens + clicks) liés au lead
 *
 * Format : JSON pretty avec _meta indiquant timestamp + version + RGPD article.
 * À conserver par le DPO comme preuve d'exécution du droit d'accès.
 *
 * Note : les emails tracking sont hashés (recipientHash) par design, donc le
 * matching se fait par refKey (= reference) en plus du hash de l'email.
 */

import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/require-admin";
import { getLead } from "@/lib/leads-store";
import { listDocuments } from "@/lib/documents-store";
import { getQuote } from "@/lib/quotes-store";
import { listConversations } from "@/lib/chat-store";
import { listActivity } from "@/lib/activity-log";
import { listTracking } from "@/lib/email-tracking-store";
import { logger } from "@/lib/logger";
import { logActivity } from "@/lib/activity-log";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function hashRecipient(email: string): string {
  // Doit matcher lib/email-tracking-store.ts → hashRecipient
  return Buffer.from(email).toString("base64").slice(0, 12);
}

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

  const [documents, quote, allConvs, allActivity, allTracking] =
    await Promise.all([
      listDocuments(params.reference),
      getQuote(params.reference),
      listConversations(),
      listActivity(),
      listTracking(),
    ]);

  // Chat : on filtre par visitorEmail (case-insensitive)
  const leadEmail = lead.email.toLowerCase().trim();
  const conversations = allConvs.filter(
    (c) => (c.visitorEmail ?? "").toLowerCase().trim() === leadEmail,
  );

  // Activity : filtrage par reference
  const activity = allActivity.filter((a) => a.reference === params.reference);

  // Email tracking : matchage par refKey (= reference) OU par recipientHash
  const recipientHash = hashRecipient(lead.email);
  const emailTracking = allTracking.filter(
    (t) =>
      t.refKey === params.reference ||
      t.recipientHash === recipientHash,
  );

  const bundle = {
    _meta: {
      exportedAt: new Date().toISOString(),
      exportedBy: "admin",
      purpose:
        "RGPD article 15 — droit d'accès complet aux données personnelles",
      version: 2,
      kind: "full-export",
      coverage: {
        lead: true,
        documents: documents.length,
        quote: !!quote,
        chatConversations: conversations.length,
        activityEntries: activity.length,
        emailTrackingEvents: emailTracking.length,
      },
    },
    lead: {
      ...lead,
      statusHistory: lead.statusHistory ?? [],
    },
    documents: documents.map((d) => ({
      ...d,
      url: `/api/admin/leads/${params.reference}/documents/${d.id}`,
    })),
    quote: quote ?? null,
    chat: conversations.map((c) => ({
      id: c.id,
      status: c.status,
      visitorName: c.visitorName,
      visitorEmail: c.visitorEmail,
      visitorPath: c.visitorPath,
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
      messages: c.messages.map((m) => ({
        id: m.id,
        sender: m.sender,
        agentEmail: m.agentEmail,
        text: m.text,
        at: m.at,
      })),
    })),
    activity: activity.map((a) => ({
      id: a.id,
      type: a.type,
      summary: a.summary,
      at: a.at,
      actorEmail: (a as { actorEmail?: string }).actorEmail,
      meta: (a as { meta?: unknown }).meta,
    })),
    emailTracking: emailTracking.map((t) => ({
      id: t.id,
      kind: t.kind,
      refKey: t.refKey,
      createdAt: t.createdAt,
      opens: t.opens,
      lastOpenAt: t.lastOpenAt,
      clicks: t.clicks,
      lastClickAt: t.lastClickAt,
      clickedUrls: t.clickedUrls,
    })),
  };

  logger.info("admin.rgpd_full_export", {
    reference: params.reference,
    coverage: bundle._meta.coverage,
  });
  void logActivity(
    "lead.rgpd_export",
    "Export RGPD complet effectué",
    {
      reference: params.reference,
      meta: { kind: "full", coverage: bundle._meta.coverage },
    },
  );

  const filename = `rgpd-full-${params.reference}-${new Date()
    .toISOString()
    .slice(0, 10)}.json`;

  return new NextResponse(JSON.stringify(bundle, null, 2), {
    status: 200,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
