/**
 * GET /api/admin/safety               → templates + completions récentes
 * POST /api/admin/safety               { templateId, leadReference?, slotId?, technicianEmail }
 */

import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/require-admin";
import {
  TEMPLATES,
  listCompletions,
  createCompletion,
} from "@/lib/safety-checklists-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const auth = await requireAdminApi(req);
  if (!auth.ok) return auth.response;
  const url = new URL(req.url);
  const leadReference = url.searchParams.get("leadReference") ?? undefined;
  const completions = await listCompletions({ leadReference, limit: 50 });
  return NextResponse.json({ templates: TEMPLATES, completions });
}

export async function POST(req: Request) {
  const auth = await requireAdminApi(req);
  if (!auth.ok) return auth.response;
  const email = (auth.session as { email?: string } | undefined)?.email;
  let body: {
    templateId?: string;
    leadReference?: string;
    slotId?: string;
    technicianEmail?: string;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON invalide" }, { status: 400 });
  }
  if (!body.templateId) {
    return NextResponse.json(
      { error: "templateId requis" },
      { status: 400 },
    );
  }
  try {
    const completion = await createCompletion({
      templateId: body.templateId,
      leadReference: body.leadReference,
      slotId: body.slotId,
      technicianEmail:
        body.technicianEmail || email || "tech@chauffage-artisanal.lu",
    });
    return NextResponse.json({ completion });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Erreur" },
      { status: 400 },
    );
  }
}
