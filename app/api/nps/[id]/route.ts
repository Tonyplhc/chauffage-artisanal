/**
 * Endpoint public (sans auth) pour les enquêtes NPS.
 *
 * GET  /api/nps/[id]?t=<token>      → état de l'enquête (déjà répondue ?)
 * POST /api/nps/[id]?t=<token>      { score, comment } → enregistre la réponse
 *
 * Sécurité : token HMAC obligatoire. Si invalide → 401.
 * Anti-replay : une réponse une fois enregistrée n'est pas écrasable.
 */

import { NextResponse } from "next/server";
import { getSurvey, recordResponse } from "@/lib/nps-store";
import { verifyNpsToken } from "@/lib/nps-token";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  req: Request,
  { params }: { params: { id: string } },
) {
  const url = new URL(req.url);
  const token = url.searchParams.get("t") ?? undefined;
  if (!verifyNpsToken(params.id, token)) {
    return NextResponse.json({ error: "Lien invalide" }, { status: 401 });
  }
  const survey = await getSurvey(params.id);
  if (!survey) {
    return NextResponse.json({ error: "Enquête introuvable" }, { status: 404 });
  }
  return NextResponse.json({
    survey: {
      id: survey.id,
      recipientName: survey.recipientName,
      sentAt: survey.sentAt,
      respondedAt: survey.respondedAt,
      score: survey.score,
      comment: survey.comment,
    },
  });
}

export async function POST(
  req: Request,
  { params }: { params: { id: string } },
) {
  const url = new URL(req.url);
  const token = url.searchParams.get("t") ?? undefined;
  if (!verifyNpsToken(params.id, token)) {
    return NextResponse.json({ error: "Lien invalide" }, { status: 401 });
  }
  let body: { score?: unknown; comment?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON invalide" }, { status: 400 });
  }
  if (
    typeof body.score !== "number" ||
    !Number.isFinite(body.score) ||
    body.score < 0 ||
    body.score > 10
  ) {
    return NextResponse.json(
      { error: "Score requis entre 0 et 10" },
      { status: 400 },
    );
  }
  const comment = typeof body.comment === "string" ? body.comment : "";
  const survey = await recordResponse(params.id, body.score, comment);
  if (!survey) {
    return NextResponse.json({ error: "Enquête introuvable" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
