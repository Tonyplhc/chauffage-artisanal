/**
 * Endpoint public (sans auth) : indique si le mode multi-utilisateurs est
 * activé (= s'il existe au moins un utilisateur dans le store).
 *
 * Utilisé par la page de login pour décider d'afficher le champ email ou non.
 * Ne révèle pas la liste des utilisateurs — juste un booléen.
 */

import { NextResponse } from "next/server";
import { hasAnyUser } from "@/lib/users-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const multiUser = await hasAnyUser();
  return NextResponse.json({ multiUser });
}
