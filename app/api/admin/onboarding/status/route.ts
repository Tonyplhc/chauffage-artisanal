import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/require-admin";
import { hasAnyUser } from "@/lib/users-store";
import { getBrand } from "@/lib/brand-settings";
import { readCatalogue } from "@/lib/catalogue-store";
import { listLeads } from "@/lib/leads-store";
import { isTotpEnabled } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const auth = await requireAdminApi(req);
  if (!auth.ok) return auth.response;

  const [users, brand, catalogue, leads, twofa] = await Promise.all([
    hasAnyUser(),
    getBrand(),
    readCatalogue(),
    listLeads(),
    isTotpEnabled(),
  ]);

  const steps = {
    multiUserSetup: users,
    brandConfigured: brand.name !== "Chauffage Artisanal" || brand.contactPhone !== "+352 00 00 00 00",
    catalogueUploaded: !!(catalogue && catalogue.items.length > 0),
    firstLead: leads.length > 0,
    twoFactor: twofa,
  };
  const completed = Object.values(steps).filter(Boolean).length;
  const total = Object.keys(steps).length;
  return NextResponse.json({ steps, completed, total });
}
