/**
 * Endpoint Server-Sent Events pour le dashboard admin.
 *
 * Connexion persistante : le client reçoit les événements en temps réel sans
 * polling. Auth admin requise.
 *
 * Format chaque message :
 *   data: <JSON>\n\n
 *
 * Heartbeat toutes les 25s pour garder la connexion vivante (timeout proxy).
 */

import { requireAdminApi } from "@/lib/require-admin";
import { subscribe } from "@/lib/event-bus";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const auth = await requireAdminApi(req);
  if (!auth.ok) return auth.response;

  const stream = new ReadableStream({
    start(controller) {
      const enc = new TextEncoder();
      const send = (data: unknown) => {
        try {
          controller.enqueue(enc.encode(`data: ${JSON.stringify(data)}\n\n`));
        } catch {
          // contrôleur fermé
        }
      };

      // Message d'ouverture
      send({ type: "hello", at: new Date().toISOString() });

      // Subscribe au bus
      const unsubscribe = subscribe((event) => send(event));

      // Heartbeat
      const heartbeat = setInterval(() => {
        try {
          controller.enqueue(enc.encode(": ping\n\n"));
        } catch {
          clearInterval(heartbeat);
        }
      }, 25_000);

      // Cleanup si le client coupe
      req.signal.addEventListener("abort", () => {
        clearInterval(heartbeat);
        unsubscribe();
        try {
          controller.close();
        } catch {}
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no", // désactive le buffering nginx
    },
  });
}
