/**
 * POST /api/admin/ai/assistant
 *
 * Chat streaming pour l'assistant IA flottant de l'admin.
 * L'assistant a accès en lecture aux leads/devis/équipe via un "tool" textuel
 * léger (on injecte un résumé de l'état pipeline dans le system prompt).
 *
 * Body : { messages: [{ role, content }, ...] }  (historique de la conversation)
 * Réponse : streaming texte brut (chaque chunk = morceau de réponse Groq)
 */

import { z } from "zod";
import { requireAdminApi } from "@/lib/require-admin";
import { groqChatStream, SYSTEM_PROMPT_BASE, GroqError } from "@/lib/groq";
import { listLeads } from "@/lib/leads-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MessageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().min(1).max(4000),
});

const Schema = z.object({
  messages: z.array(MessageSchema).min(1).max(30),
});

/**
 * Construit un snapshot textuel du pipeline pour donner à l'assistant
 * du contexte réel. On reste sobre : 8 leads les plus récents, agrégats.
 */
async function buildPipelineContext(): Promise<string> {
  try {
    const leads = await listLeads();
    const total = leads.length;
    const byStatus = leads.reduce<Record<string, number>>((acc, l) => {
      acc[l.status] = (acc[l.status] ?? 0) + 1;
      return acc;
    }, {});
    const recent = [...leads]
      .sort((a, b) => (b.submittedAt ?? "").localeCompare(a.submittedAt ?? ""))
      .slice(0, 8)
      .map((l) => {
        const services = Array.isArray(l.services) ? l.services.join("+") : "?";
        const urgentMark =
          l.timeline === "immediat" || l.timeline === "urgent"
            ? " · ⚠️ URGENT"
            : "";
        return `- ${l.reference} · ${services} · ${l.status} · ${l.commune ?? "?"}${urgentMark}`;
      });

    return [
      "Snapshot du pipeline (live) :",
      `- ${total} leads total`,
      `- Par statut : ${Object.entries(byStatus)
        .map(([k, v]) => `${k}=${v}`)
        .join(", ")}`,
      "",
      "8 leads les plus récents :",
      ...recent,
    ].join("\n");
  } catch {
    return "(Snapshot pipeline indisponible.)";
  }
}

export async function POST(req: Request) {
  const auth = await requireAdminApi(req);
  if (!auth.ok) return auth.response;

  const json = await req.json().catch(() => null);
  const parsed = Schema.safeParse(json);
  if (!parsed.success) {
    return new Response(
      JSON.stringify({ error: "Requête invalide.", details: parsed.error.flatten() }),
      { status: 400, headers: { "Content-Type": "application/json" } },
    );
  }

  const pipelineCtx = await buildPipelineContext();
  const systemPrompt = `${SYSTEM_PROMPT_BASE}

Contexte LIVE du moment (mis à jour à chaque message) :
${pipelineCtx}

Tu peux faire référence à ces données quand c'est pertinent. Si l'utilisateur demande des chiffres ou des leads précis, tu t'appuies dessus.`;

  try {
    const stream = await groqChatStream(
      [
        { role: "system", content: systemPrompt },
        ...parsed.data.messages,
      ],
      { maxTokens: 800, temperature: 0.5 },
    );
    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache, no-store",
      },
    });
  } catch (e) {
    if (e instanceof GroqError) {
      return new Response(
        JSON.stringify({ error: e.message }),
        {
          status: e.status === 401 ? 503 : 502,
          headers: { "Content-Type": "application/json" },
        },
      );
    }
    return new Response(
      JSON.stringify({ error: "Erreur IA inconnue." }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
}
