import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/require-admin";

/**
 * POST /api/admin/diagnostic/send-test
 *
 * Envoie un email de test via Resend pour vérifier la chaîne complète :
 * clé API + domaine FROM + destinataire. Affiche l'ID Resend en cas de
 * succès — sert de preuve que tout est branché.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const auth = await requireAdminApi(req);
  if (!auth.ok) return auth.response;

  const { to } = (await req.json()) as { to?: string };
  if (!to || !/^.+@.+\..+/.test(to)) {
    return NextResponse.json({ error: "Email destinataire invalide" }, { status: 400 });
  }

  if (!process.env.RESEND_API_KEY) {
    return NextResponse.json(
      { error: "RESEND_API_KEY non configurée sur Vercel — impossible d'envoyer" },
      { status: 503 },
    );
  }

  // Fallback FROM : si EMAIL_FROM n'est pas configuré, on utilise le sender
  // par défaut Resend qui marche sans vérification de domaine (utile pour
  // un premier test avant DNS du domaine client).
  const from = process.env.EMAIL_FROM ?? "onboarding@resend.dev";

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [to],
        subject:
          "Test diagnostic · Chauffage Artisanal — la chaîne email fonctionne",
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, sans-serif; max-width: 560px; margin: 0 auto; padding: 32px; background: #f6f0e4; color: #14110d;">
            <div style="background: #ffffff; padding: 32px; border-radius: 16px; border: 1px solid rgba(20,17,13,0.1);">
              <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.15em; color: #b86a36; font-family: monospace; margin-bottom: 8px;">Diagnostic · ${new Date().toLocaleString("fr-LU")}</div>
              <h1 style="font-size: 24px; margin: 0 0 16px; color: #14110d;">L'intégration email fonctionne ✓</h1>
              <p style="line-height: 1.6; margin: 0 0 12px; color: #4a4339;">
                Si vous lisez ce message, le pipeline Resend → ${from} → ${to} est
                opérationnel.
              </p>
              <p style="line-height: 1.6; margin: 0 0 12px; color: #4a4339;">
                Concrètement : à partir de maintenant, quand un client soumet le formulaire
                /devis sur le site, vous recevrez automatiquement la notification du lead
                avec toutes les informations remplies — référence, services demandés, budget,
                délai, contact.
              </p>
              <div style="margin-top: 24px; padding-top: 24px; border-top: 1px solid rgba(20,17,13,0.08); font-size: 12px; color: #8a7d6b;">
                Email envoyé depuis le diagnostic admin · Chauffage Artisanal Luxembourg
              </div>
            </div>
          </div>
        `,
        text: `Test diagnostic Chauffage Artisanal\n\nSi vous lisez ce message, le pipeline Resend (${from} → ${to}) est opérationnel.\n\nÀ partir de maintenant, chaque devis soumis sur le site déclenchera une notification automatique.\n\nEnvoyé le ${new Date().toLocaleString("fr-LU")}`,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      return NextResponse.json(
        { error: `Resend HTTP ${res.status} : ${err.slice(0, 300)}` },
        { status: 502 },
      );
    }
    const data = (await res.json()) as { id?: string };
    return NextResponse.json({ ok: true, id: data.id, from, to });
  } catch (e) {
    return NextResponse.json(
      { error: `Erreur réseau : ${(e as Error).message}` },
      { status: 500 },
    );
  }
}
