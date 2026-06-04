import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/require-admin";
import { getBrand, saveBrand, BrandSettingsSchema } from "@/lib/brand-settings";
import { logActivity } from "@/lib/activity-log";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const auth = await requireAdminApi(req);
  if (!auth.ok) return auth.response;
  const brand = await getBrand();
  return NextResponse.json({ brand });
}

export async function POST(req: Request) {
  const auth = await requireAdminApi(req, { roles: ["admin"] });
  if (!auth.ok) return auth.response;
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON invalide" }, { status: 400 });
  }
  const parsed = BrandSettingsSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Données invalides", details: parsed.error.flatten() },
      { status: 400 },
    );
  }
  const saved = await saveBrand(parsed.data);
  void logActivity("auth.login", "Brand settings mis à jour", {
    meta: { name: saved.name },
  });
  return NextResponse.json({ brand: saved });
}
