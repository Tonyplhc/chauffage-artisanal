import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/require-admin";
import { getLead } from "@/lib/leads-store";
import { readCatalogue, matchByBudgetTiers } from "@/lib/catalogue-store";
import { BUDGET_RANGE } from "@/lib/catalogue-schema";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  req: Request,
  { params }: { params: { reference: string } },
) {
  const auth = await requireAdminApi(req);
  if (!auth.ok) return auth.response;

  const lead = await getLead(params.reference);
  if (!lead) return NextResponse.json({ error: "Lead introuvable" }, { status: 404 });

  const catalogue = await readCatalogue();
  if (!catalogue || catalogue.items.length === 0) {
    return NextResponse.json({
      lead,
      tiers: null,
      hasCatalogue: false,
      message:
        "Aucun catalogue n'est encore configuré. Importez votre fichier Excel/CSV depuis /admin/catalogue.",
    });
  }

  const budgetRange = BUDGET_RANGE[lead.budget] ?? { min: 0, max: 1_000_000 };
  const tiers = matchByBudgetTiers(
    catalogue.items,
    {
      services: lead.services,
      surface: lead.surface,
      budget: lead.budget,
    },
    budgetRange,
    lead.budget === "inconnu",
  );

  return NextResponse.json({
    lead,
    tiers,
    hasCatalogue: true,
    catalogueSize: catalogue.items.length,
    budgetRange,
  });
}
