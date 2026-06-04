/**
 * GET /api/admin/reports/monthly?year=YYYY&month=MM
 *
 * Calcule un rapport mensuel avec comparaisons MoM/YoY.
 * Sans paramètres : retourne le rapport du mois en cours + la liste des mois
 * disponibles pour peupler un sélecteur UI.
 */

import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/require-admin";
import {
  computeMonthlyReport,
  listAvailableMonths,
} from "@/lib/monthly-report";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const auth = await requireAdminApi(req);
  if (!auth.ok) return auth.response;

  const url = new URL(req.url);
  const yearStr = url.searchParams.get("year");
  const monthStr = url.searchParams.get("month");

  const now = new Date();
  const year = yearStr ? Number(yearStr) : now.getUTCFullYear();
  const month = monthStr ? Number(monthStr) : now.getUTCMonth() + 1;

  if (
    !Number.isInteger(year) ||
    !Number.isInteger(month) ||
    year < 2000 ||
    year > 2100 ||
    month < 1 ||
    month > 12
  ) {
    return NextResponse.json(
      { error: "invalid_period" },
      { status: 400 },
    );
  }

  const report = await computeMonthlyReport(year, month);
  const available = await listAvailableMonths();

  return NextResponse.json({ report, available });
}
