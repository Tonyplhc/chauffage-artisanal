import { NextResponse } from "next/server";
import { listLeads, expressCreateLead } from "@/lib/leads-store";
import { requireAdminApi } from "@/lib/require-admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const auth = await requireAdminApi(req);
  if (!auth.ok) return auth.response;
  const leads = await listLeads();
  return NextResponse.json({ leads });
}

/**
 * POST /api/admin/leads — création express d'un lead par un opérateur.
 *
 * Strict minimum : fullName + commune. phone/email/notes optionnels.
 *
 * NB : ce n'est PAS le formulaire public /devis (qui passe par /api/devis
 * avec validation Zod stricte). C'est l'entrée admin pour les cas de
 * dépannage urgent où l'opérateur doit créer un dossier en 10 secondes.
 */
export async function POST(req: Request) {
  const auth = await requireAdminApi(req);
  if (!auth.ok) return auth.response;
  const email = (auth.session as { email?: string } | undefined)?.email;
  let body: {
    fullName?: string;
    commune?: string;
    phone?: string;
    email?: string;
    notes?: string;
  } = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON invalide" }, { status: 400 });
  }
  try {
    const lead = await expressCreateLead({
      fullName: String(body.fullName ?? ""),
      commune: String(body.commune ?? ""),
      phone: body.phone,
      email: body.email,
      notes: body.notes,
      createdBy: email,
    });
    return NextResponse.json({ lead });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Erreur" },
      { status: 400 },
    );
  }
}
