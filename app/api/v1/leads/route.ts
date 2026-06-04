/**
 * GET /api/v1/leads
 * Auth : Bearer token API key avec scope read:leads.
 * Filtres : ?status=...&from=YYYY-MM-DD&to=YYYY-MM-DD&limit=N
 * Réponse : liste de leads sans données photos.
 */

import { NextResponse } from "next/server";
import { extractApiKey, verifyKey } from "@/lib/api-keys-store";
import { listLeads } from "@/lib/leads-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const raw = extractApiKey(req);
  if (!raw) {
    return NextResponse.json(
      {
        error: "missing_api_key",
        message: "Passez votre clé en Authorization: Bearer <key> ou en X-API-Key.",
      },
      { status: 401 },
    );
  }
  const verified = await verifyKey(raw, "read:leads");
  if (!verified.ok) {
    return NextResponse.json(
      { error: verified.error },
      { status: verified.error === "scope_missing" ? 403 : 401 },
    );
  }

  const url = new URL(req.url);
  const status = url.searchParams.get("status");
  const from = url.searchParams.get("from");
  const to = url.searchParams.get("to");
  const limit = Math.min(500, Math.max(1, Number(url.searchParams.get("limit") ?? 100)));

  let leads = await listLeads();
  if (status) leads = leads.filter((l) => l.status === status);
  if (from) {
    const fm = new Date(from).getTime();
    if (!Number.isNaN(fm)) leads = leads.filter((l) => new Date(l.submittedAt).getTime() >= fm);
  }
  if (to) {
    const tm = new Date(to).getTime() + 86_400_000;
    if (!Number.isNaN(tm)) leads = leads.filter((l) => new Date(l.submittedAt).getTime() < tm);
  }
  leads = leads.slice(0, limit);

  // Filtrer les champs lourds (photos en data URL non incluses anyway)
  const safe = leads.map((l) => ({
    reference: l.reference,
    submittedAt: l.submittedAt,
    status: l.status,
    services: l.services,
    buildingType: l.buildingType,
    construction: l.construction,
    surface: l.surface,
    currentEnergy: l.currentEnergy,
    commune: l.commune,
    timeline: l.timeline,
    budget: l.budget,
    fullName: l.fullName,
    email: l.email,
    phone: l.phone,
    score: l.score,
    level: l.level,
    photoCount: l.photoUrls.length,
  }));

  return NextResponse.json({
    data: safe,
    count: safe.length,
    apiVersion: "v1",
  });
}
