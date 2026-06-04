import { NextResponse } from "next/server";
import { DevisSubmitSchema, makeReference, sanitizeText } from "@/lib/devis-schema";
import { rateLimit, clientKey } from "@/lib/rate-limit";
import { createLead } from "@/lib/leads-store";
import { sendAdminNotification, sendClientConfirmation } from "@/lib/email";
import { sendLeadWebhook } from "@/lib/webhook";
import { publish } from "@/lib/event-bus";
import { logActivity } from "@/lib/activity-log";
import { runAutomations } from "@/lib/automations-store";
import { fireCustomWebhooks } from "@/lib/custom-webhooks-store";
import { logger } from "@/lib/logger";

export const runtime = "nodejs"; // file system + email need Node
export const dynamic = "force-dynamic";

const MAX_BODY_SIZE = 50 * 1024 * 1024; // 50 MB (photos base64 expanded)

export async function POST(req: Request) {
  /* 1. Rate limit par IP */
  const ip = clientKey(req.headers);
  const limit = rateLimit(`devis:${ip}`, { windowMs: 60_000, max: 6 });
  if (!limit.ok) {
    logger.warn("devis.rate_limited", { ip });
    return NextResponse.json(
      { error: "Trop de requêtes. Merci de réessayer dans une minute." },
      { status: 429, headers: { "Retry-After": String(Math.ceil((limit.resetAt - Date.now()) / 1000)) } },
    );
  }

  /* 2. Parse + taille */
  let raw: unknown;
  try {
    const text = await req.text();
    if (text.length > MAX_BODY_SIZE) {
      return NextResponse.json({ error: "Payload trop volumineux." }, { status: 413 });
    }
    raw = JSON.parse(text);
  } catch {
    return NextResponse.json({ error: "JSON invalide." }, { status: 400 });
  }

  /* 3. Validation Zod stricte */
  const parsed = DevisSubmitSchema.safeParse(raw);
  if (!parsed.success) {
    logger.warn("devis.validation_failed", { ip, issues: parsed.error.issues?.length });
    return NextResponse.json(
      {
        error: "Données invalides.",
        details: parsed.error.flatten?.() ?? parsed.error.issues,
      },
      { status: 400 },
    );
  }

  /* 4. Honeypot — silencieux */
  if ((parsed.data.trap ?? "").length > 0) {
    logger.warn("devis.honeypot_triggered", { ip });
    return NextResponse.json({ ok: true, reference: makeReference() }, { status: 200 });
  }

  /* 5. Sanitisation message libre */
  const payload = {
    ...parsed.data,
    message: sanitizeText(parsed.data.message ?? ""),
  };

  /* 6. Persistance */
  const reference = makeReference();
  let lead;
  try {
    lead = await createLead(payload, reference);
    logger.info("devis.lead_created", {
      reference: lead.reference,
      services: lead.services,
      budget: lead.budget,
      timeline: lead.timeline,
      level: lead.level,
      score: lead.score,
      hasPhotos: lead.photoUrls.length > 0,
    });
  } catch (e) {
    logger.error("devis.persist_error", e, { ip, reference });
    return NextResponse.json(
      { error: "Impossible de sauvegarder la demande. Réessayez ou contactez-nous." },
      { status: 500 },
    );
  }

  /* 7. Activity log */
  void logActivity(
    "lead.created",
    `Nouveau lead · ${lead.services.join(" · ")} · ${lead.commune}`,
    { reference: lead.reference, meta: { level: lead.level, score: lead.score } },
  );

  /* 7b. Broadcast live (SSE) — admin tab ouvert reçoit le ping immédiatement */
  publish({
    type: "lead.created",
    at: lead.submittedAt,
    reference: lead.reference,
    fullName: lead.fullName,
    services: lead.services,
    commune: lead.commune,
    level: lead.level,
    score: lead.score,
  });

  /* 7c. Automations — exécutées en async, non bloquant */
  void runAutomations(lead);

  /* 7d. Custom webhooks externes (admin-configured) */
  void fireCustomWebhooks("lead.created", {
    reference: lead.reference,
    fullName: lead.fullName,
    email: lead.email,
    services: lead.services,
    commune: lead.commune,
    level: lead.level,
    score: lead.score,
    timeline: lead.timeline,
    budget: lead.budget,
  });

  /* 8. Side-effects asynchrones (non bloquants pour la réponse) */
  Promise.allSettled([
    sendAdminNotification(lead),
    sendClientConfirmation(lead),
    sendLeadWebhook(lead),
  ]).then((results) => {
    const labels = ["email_admin", "email_client", "webhook"];
    results.forEach((r, i) => {
      const label = labels[i];
      if (r.status === "rejected") {
        logger.error(`devis.${label}_failed`, r.reason, { reference: lead.reference });
        return;
      }
      const v = r.value as any;
      if (v && "ok" in v && !v.ok) {
        logger.warn(`devis.${label}_error`, {
          reference: lead.reference,
          mode: v.mode,
          error: v.error,
        });
      } else {
        logger.info(`devis.${label}_sent`, {
          reference: lead.reference,
          mode: v?.mode,
        });
      }
    });
  });

  /* 9. Réponse client */
  return NextResponse.json(
    {
      ok: true,
      reference: lead.reference,
      submittedAt: lead.submittedAt,
    },
    { status: 201 },
  );
}
