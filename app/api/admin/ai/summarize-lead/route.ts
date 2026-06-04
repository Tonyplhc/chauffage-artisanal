/**
 * POST /api/admin/ai/summarize-lead
 *
 * Génère un TL;DR par l'IA d'un lead à partir de tout son contexte
 * (qualification, historique, commentaires, devis, etc.).
 *
 * Body : { reference: string }
 * Réponse : { summary: string }
 */

import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminApi } from "@/lib/require-admin";
import { getLead } from "@/lib/leads-store";
import { groqChat, SYSTEM_PROMPT_BASE, GroqError } from "@/lib/groq";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const Schema = z.object({ reference: z.string().min(3).max(40) });

export async function POST(req: Request) {
  const auth = await requireAdminApi(req);
  if (!auth.ok) return auth.response;

  const json = await req.json().catch(() => null);
  const parsed = Schema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Référence invalide." }, { status: 400 });
  }

  const lead = await getLead(parsed.data.reference);
  if (!lead) {
    return NextResponse.json({ error: "Lead introuvable." }, { status: 404 });
  }

  // On construit un dossier texte concis. Pas de PII inutile — l'IA n'a besoin
  // que de ce qui éclaire la situation.
  const services = Array.isArray(lead.services) ? lead.services.join(", ") : "—";
  const ctxParts: string[] = [
    `Référence: ${lead.reference}`,
    `Statut: ${lead.status}`,
    `Services demandés: ${services}`,
    `Bâtiment: ${lead.buildingType ?? "—"} (${lead.surface ?? "?"} m²)`,
    `Localisation: ${lead.commune ?? "?"}`,
    `Timeline: ${lead.timeline ?? "—"}`,
    `Budget: ${lead.budget ?? "—"}`,
    `Énergie actuelle: ${lead.currentEnergy ?? "—"}`,
    `Score lead: ${lead.score ?? "?"} (niveau ${lead.level ?? "?"})`,
    lead.message ? `Message client:\n${lead.message}` : "",
    lead.notes ? `Note interne:\n${lead.notes}` : "",
  ];
  const ctx = ctxParts.filter(Boolean).join("\n");

  try {
    const summary = await groqChat(
      [
        { role: "system", content: SYSTEM_PROMPT_BASE },
        {
          role: "user",
          content: `Voici une fiche lead. Génère un TL;DR pour un commercial qui va le rappeler dans 5 minutes : enjeu principal, urgence, prochaine action recommandée. 4 phrases max.

${ctx}`,
        },
      ],
      { maxTokens: 400, temperature: 0.3 },
    );
    return NextResponse.json({ summary });
  } catch (e) {
    if (e instanceof GroqError) {
      return NextResponse.json(
        { error: e.message },
        { status: e.status === 401 ? 503 : 502 },
      );
    }
    return NextResponse.json({ error: "Erreur IA inconnue." }, { status: 500 });
  }
}
