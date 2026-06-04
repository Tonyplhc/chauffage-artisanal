/**
 * POST /api/admin/ai/draft
 *
 * Rédige un texte (email, commentaire, note, description de devis) à partir
 * d'un brief court. Utilisé par le bouton "✨ Rédiger avec l'IA" sur tous les
 * formulaires textuels de l'admin.
 *
 * Body : { kind: "email" | "comment" | "note" | "quote_item", brief: string, context?: string }
 * Réponse : { text: string }
 */

import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminApi } from "@/lib/require-admin";
import { groqChat, SYSTEM_PROMPT_BASE, GroqError } from "@/lib/groq";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const Schema = z.object({
  kind: z.enum(["email", "comment", "note", "quote_item"]),
  brief: z.string().min(3).max(2000),
  context: z.string().max(4000).optional(),
});

const TASK_PROMPTS: Record<z.infer<typeof Schema>["kind"], string> = {
  email:
    "Rédige un email professionnel et chaleureux pour un client. Objet implicite. Pas de signature (l'admin signera). Pas de salutation 'Cher Monsieur/Madame' (le client est tutoyé en interne mais vouvoyé par défaut — utilise un ton neutre 'Bonjour, Cordialement').",
  comment:
    "Rédige un commentaire interne sur une fiche lead — pour notre équipe, pas pour le client. Factuel, court, actionnable.",
  note:
    "Rédige une note technique brève. Format télégraphique acceptable. Pas de fioritures.",
  quote_item:
    "Rédige la description d'une ligne de devis. Style technique précis, 1-3 phrases max. Pas de prix ni de quantité (gérés par d'autres champs).",
};

export async function POST(req: Request) {
  const auth = await requireAdminApi(req);
  if (!auth.ok) return auth.response;

  const json = await req.json().catch(() => null);
  const parsed = Schema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Requête invalide.", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { kind, brief, context } = parsed.data;
  const taskPrompt = TASK_PROMPTS[kind];

  try {
    const text = await groqChat(
      [
        { role: "system", content: SYSTEM_PROMPT_BASE },
        {
          role: "user",
          content: [
            taskPrompt,
            "",
            context ? `Contexte de la fiche :\n${context}\n` : "",
            `Brief de ce qu'il faut écrire :\n${brief}`,
          ]
            .filter(Boolean)
            .join("\n"),
        },
      ],
      { maxTokens: 600, temperature: 0.6 },
    );
    return NextResponse.json({ text });
  } catch (e) {
    if (e instanceof GroqError) {
      const code = e.status === 401 ? 503 : e.status === 429 ? 429 : 502;
      return NextResponse.json(
        { error: e.message, hint: code === 503 ? "Clé GROQ_API_KEY absente ou invalide. Voir .env.local." : undefined },
        { status: code },
      );
    }
    return NextResponse.json({ error: "Erreur IA inconnue." }, { status: 500 });
  }
}
