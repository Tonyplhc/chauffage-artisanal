/**
 * Client Groq — wrapper minimal pour les routes server-side.
 *
 * Pourquoi Groq : free tier généreux (14k tokens/min, 14400 req/jour),
 * pas de CB requise, latence excellente (custom LPU). Modèle par défaut :
 * Llama 3.3 70B Versatile — équivalent GPT-4 sur les tâches courtes.
 *
 * SÉCURITÉ : ne JAMAIS importer ce module côté client (clé API leak).
 * Toutes les routes qui s'en servent doivent rester sous `runtime = "nodejs"`
 * et passer par `requireAdminApi`.
 *
 * Pour activer : ajouter dans .env.local :
 *   GROQ_API_KEY=gsk_xxxxxxxxxxxxxxxxxx
 * Récupérable gratuitement sur https://console.groq.com/keys
 */

const GROQ_ENDPOINT = "https://api.groq.com/openai/v1/chat/completions";
const DEFAULT_MODEL = "llama-3.3-70b-versatile";

export type GroqMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

export type GroqOptions = {
  /** Override du modèle (par défaut llama-3.3-70b-versatile) */
  model?: string;
  /** Tokens max en sortie (par défaut 1024) */
  maxTokens?: number;
  /** Créativité 0-1 (par défaut 0.5 — équilibré pour métier) */
  temperature?: number;
  /** Timeout en ms (par défaut 30s) */
  timeoutMs?: number;
};

export class GroqError extends Error {
  constructor(
    message: string,
    public status?: number,
    public body?: string,
  ) {
    super(message);
    this.name = "GroqError";
  }
}

/**
 * Appel synchrone à Groq — retourne le texte de la réponse.
 * Throw GroqError si problème (clé absente, rate limit, etc.).
 */
export async function groqChat(
  messages: GroqMessage[],
  opts: GroqOptions = {},
): Promise<string> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new GroqError(
      "GROQ_API_KEY absente. Ajoutez-la dans .env.local (gratuit sur console.groq.com/keys).",
    );
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), opts.timeoutMs ?? 30_000);

  try {
    const res = await fetch(GROQ_ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: opts.model ?? DEFAULT_MODEL,
        messages,
        max_tokens: opts.maxTokens ?? 1024,
        temperature: opts.temperature ?? 0.5,
        stream: false,
      }),
      signal: controller.signal,
    });

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      throw new GroqError(
        `Groq HTTP ${res.status}`,
        res.status,
        body.slice(0, 500),
      );
    }

    const data = (await res.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const content = data.choices?.[0]?.message?.content;
    if (!content) throw new GroqError("Réponse Groq vide");
    return content.trim();
  } catch (e) {
    if (e instanceof GroqError) throw e;
    if (e instanceof DOMException && e.name === "AbortError") {
      throw new GroqError("Timeout Groq");
    }
    throw new GroqError(`Erreur réseau Groq: ${String(e)}`);
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Streaming Groq — pour le chat assistant qui doit afficher la réponse
 * progressivement. Retourne un ReadableStream de texte (chaque chunk est
 * un bout de texte du LLM).
 */
export async function groqChatStream(
  messages: GroqMessage[],
  opts: GroqOptions = {},
): Promise<ReadableStream<Uint8Array>> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new GroqError("GROQ_API_KEY absente.");
  }

  const res = await fetch(GROQ_ENDPOINT, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: opts.model ?? DEFAULT_MODEL,
      messages,
      max_tokens: opts.maxTokens ?? 1024,
      temperature: opts.temperature ?? 0.5,
      stream: true,
    }),
  });

  if (!res.ok || !res.body) {
    const body = await res.text().catch(() => "");
    throw new GroqError(`Groq HTTP ${res.status}`, res.status, body.slice(0, 500));
  }

  // Re-encode le flux SSE Groq (OpenAI-compatible) en chunks de texte simples.
  // Format SSE entrant : "data: {...json...}\n\n" → on extrait choices[0].delta.content
  const encoder = new TextEncoder();
  const decoder = new TextDecoder();
  let buffer = "";

  return new ReadableStream<Uint8Array>({
    async start(controller) {
      const reader = res.body!.getReader();
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";
          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed || !trimmed.startsWith("data:")) continue;
            const payload = trimmed.slice(5).trim();
            if (payload === "[DONE]") continue;
            try {
              const json = JSON.parse(payload) as {
                choices?: Array<{ delta?: { content?: string } }>;
              };
              const piece = json.choices?.[0]?.delta?.content;
              if (piece) controller.enqueue(encoder.encode(piece));
            } catch {
              // chunk JSON malformé — on ignore
            }
          }
        }
      } finally {
        controller.close();
      }
    },
  });
}

/**
 * System prompt commun pour toutes les tâches admin Chauffage Artisanal.
 * Donne le ton, le contexte métier, les contraintes.
 */
export const SYSTEM_PROMPT_BASE = `Tu es l'assistant IA de Chauffage Artisanal, entreprise luxembourgeoise spécialisée dans le chauffage, les pompes à chaleur, la climatisation et les énergies renouvelables depuis 1994.

Ton rôle :
- Aider l'équipe (commerciaux, techniciens, direction) à mieux servir les clients
- Rédiger des emails, devis, comptes-rendus dans un ton professionnel artisanal (chaleureux mais précis)
- Résumer des historiques de leads, suggérer des actions, expliquer des points techniques

Contraintes :
- Réponses concises et actionnables (3-6 phrases max sauf demande explicite)
- Français de Belgique/Luxembourg (pas québécois)
- Si on te demande un email : tu n'inventes JAMAIS de prix, de dates ou d'engagements
- Si tu ne sais pas : tu le dis franchement plutôt que d'inventer`;
