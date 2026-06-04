/**
 * Gestion des push subscriptions admin.
 *
 * GET     → état (vapid public key + liste subscriptions de l'utilisateur)
 * POST    → enregistrer une subscription
 * DELETE  → désinscrire par endpoint
 */

import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminApi } from "@/lib/require-admin";
import {
  listSubscriptions,
  addSubscription,
  removeSubscription,
  vapidPublicKey,
} from "@/lib/push-subscriptions-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SubSchema = z.object({
  endpoint: z.string().url().max(500),
  keys: z.object({
    p256dh: z.string().min(10).max(200),
    auth: z.string().min(10).max(200),
  }),
});

export async function GET(req: Request) {
  const auth = await requireAdminApi(req);
  if (!auth.ok) return auth.response;
  const all = await listSubscriptions();
  const mine = auth.session.email
    ? all.filter((s) => s.userEmail === auth.session.email)
    : [];
  return NextResponse.json({
    vapidPublicKey: vapidPublicKey(),
    subscriptions: mine,
    totalAll: all.length,
  });
}

export async function POST(req: Request) {
  const auth = await requireAdminApi(req);
  if (!auth.ok) return auth.response;
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON invalide" }, { status: 400 });
  }
  const parsed = SubSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ error: "Données invalides" }, { status: 400 });
  }
  const sub = await addSubscription(parsed.data.endpoint, parsed.data.keys, {
    userAgent: req.headers.get("user-agent") ?? undefined,
    userEmail: auth.session.email,
  });
  return NextResponse.json({ subscription: sub });
}

export async function DELETE(req: Request) {
  const auth = await requireAdminApi(req);
  if (!auth.ok) return auth.response;
  const url = new URL(req.url);
  const endpoint = url.searchParams.get("endpoint");
  if (!endpoint) return NextResponse.json({ error: "endpoint manquant" }, { status: 400 });
  const ok = await removeSubscription(endpoint);
  return NextResponse.json({ ok });
}
