/**
 * GET /api/admin/sidebar-badges
 *
 * Renvoie des compteurs précis, chacun identifié par une clé métier unique
 * (ex : "leads.nouveau", "chat.unread", "warranty.open"). Chaque item de la
 * sidebar a un `badgeKey` optionnel qui pointe vers une de ces clés.
 *
 * Important : on N'UTILISE PAS les capability IDs comme clés de badge.
 * Plusieurs items partagent la même capability (ex : leads.view) — utiliser
 * la capability comme clé ferait apparaître le même compteur sur Pipeline,
 * Kanban, Segments, Vues sauvegardées, NPS, etc.
 */

import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/require-admin";
import { listLeads } from "@/lib/leads-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const auth = await requireAdminApi(req);
  if (!auth.ok) return auth.response;

  const counts: Record<string, number> = {};

  try {
    const leads = await listLeads();

    // Pipeline : leads nouveaux à contacter
    const nouveau = leads.filter((l) => l.status === "nouveau").length;
    if (nouveau > 0) counts["leads.nouveau"] = nouveau;

    // Devis envoyés en attente de retour client (à relancer)
    const devisEnvoyes = leads.filter((l) => l.status === "devis_envoye").length;
    if (devisEnvoyes > 0) counts["leads.devis_envoye"] = devisEnvoyes;

    // Doublons détectés
    try {
      const { findDuplicates } = await import("@/lib/duplicate-detection");
      const dupes = findDuplicates(leads);
      if (dupes.length > 0) counts["duplicates.detected"] = dupes.length;
    } catch {}

    // Chat non lu
    try {
      const { listConversations } = await import("@/lib/chat-store");
      const convs = await listConversations();
      const unread = convs.reduce((s, c) => s + (c.unreadAgent ?? 0), 0);
      if (unread > 0) counts["chat.unread"] = unread;
    } catch {}

    // Devis en attente de validation (workflow)
    try {
      const { listApprovals } = await import("@/lib/quote-approvals-store");
      const approvals = await listApprovals();
      const pending = approvals.filter(
        (a: { status: string }) => a.status === "pending",
      ).length;
      if (pending > 0) counts["approvals.pending"] = pending;
    } catch {}

    // Rappels échus
    try {
      const { listReminders } = await import("@/lib/reminders-store");
      const reminders = await listReminders();
      const now = Date.now();
      const due = reminders.filter(
        (r: { fireAt: string; status: string }) =>
          r.status === "pending" && new Date(r.fireAt).getTime() <= now,
      ).length;
      if (due > 0) counts["reminders.due"] = due;
    } catch {}

    // SAV ouverts
    try {
      const { listClaims } = await import("@/lib/warranty-store");
      const claims = await listClaims();
      const open = claims.filter(
        (c) => c.status !== "resolu" && c.status !== "refuse",
      ).length;
      if (open > 0) counts["warranty.open"] = open;
    } catch {}

    // Interventions à finaliser (draft + passées de plus de 24h)
    try {
      const { listVisits } = await import("@/lib/maintenance-visits-store");
      const visits = await listVisits();
      const now = Date.now();
      const oneDayMs = 24 * 60 * 60 * 1000;
      const toFinalize = visits.filter(
        (v) =>
          v.status === "draft" &&
          new Date(v.visitedAt).getTime() < now - oneDayMs,
      ).length;
      if (toFinalize > 0) counts["visits.scheduled"] = toFinalize;
    } catch {}

    // Factures à émettre (leads convertis non encore facturés)
    const toInvoice = leads.filter(
      (l) =>
        l.status === "converti" &&
        !(l.metadata as { invoiced?: boolean } | undefined)?.invoiced,
    ).length;
    if (toInvoice > 0) counts["invoices.to_create"] = toInvoice;

    // Bons d'intervention non signés
    try {
      const { listServiceOrders } = await import("@/lib/service-orders-store");
      const orders = await listServiceOrders();
      const draft = orders.filter((o) => o.status === "draft").length;
      if (draft > 0) counts["service_orders.draft"] = draft;
    } catch {}

    // BC fournisseurs non envoyés
    try {
      const { listPurchaseOrders } = await import("@/lib/purchase-orders-store");
      const pos = await listPurchaseOrders();
      const draft = pos.filter((o) => o.status === "draft").length;
      if (draft > 0) counts["purchase_orders.draft"] = draft;
    } catch {}
  } catch (e) {
    console.error("[sidebar-badges] error:", e);
  }

  return NextResponse.json({ counts });
}
