/**
 * GET   /api/admin/leads/[ref]/loyalty
 * POST  /api/admin/leads/[ref]/loyalty { points, reason } → ajustement manuel
 */

import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/require-admin";
import { getLead } from "@/lib/leads-store";
import {
  getAccount,
  ensureAccount,
  setManualAdjustment,
} from "@/lib/loyalty-store";

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
  let account = await getAccount(params.reference);
  if (!account && lead.status === "converti") {
    account = await ensureAccount({
      leadReference: lead.reference,
      clientName: lead.fullName,
      email: lead.email,
    });
  }
  return NextResponse.json({ account });
}

export async function POST(
  req: Request,
  { params }: { params: { reference: string } },
) {
  const auth = await requireAdminApi(req);
  if (!auth.ok) return auth.response;
  const lead = await getLead(params.reference);
  if (!lead) {
    return NextResponse.json({ error: "Lead introuvable" }, { status: 404 });
  }
  let body: { points?: number; reason?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON invalide" }, { status: 400 });
  }
  if (typeof body.points !== "number") {
    return NextResponse.json(
      { error: "points (number) requis" },
      { status: 400 },
    );
  }
  // Crée le compte si absent
  await ensureAccount({
    leadReference: lead.reference,
    clientName: lead.fullName,
    email: lead.email,
  });
  const account = await setManualAdjustment(
    params.reference,
    Math.round(body.points),
    (body.reason ?? "Ajustement manuel").slice(0, 200),
  );
  return NextResponse.json({ account });
}
