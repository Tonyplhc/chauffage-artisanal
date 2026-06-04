import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/require-admin";

/**
 * GET /api/admin/diagnostic
 *
 * Diagnostic en temps réel des intégrations critiques :
 *   - Resend (clé API + domaine FROM + admin TO)
 *   - Supabase (URL + service key + connectivité)
 *   - Variables d'environnement requises
 *
 * Utilisé pour vérifier que le pipeline post-deploy fonctionne, sans avoir
 * à attendre qu'un vrai client soumette un devis.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Check = {
  name: string;
  category: "env" | "resend" | "supabase" | "config";
  status: "ok" | "warn" | "fail";
  message: string;
  details?: string;
};

export async function GET(req: Request) {
  const auth = await requireAdminApi(req);
  if (!auth.ok) return auth.response;

  const checks: Check[] = [];

  // ─── Env vars critiques ─────────────────────────────────────
  const envChecks: Array<[string, string, boolean]> = [
    ["RESEND_API_KEY", "Clé API Resend (envoi d'emails)", true],
    ["EMAIL_FROM", "Adresse FROM des emails (ex: devis@...)", true],
    ["EMAIL_ADMIN", "Email où arrivent les notifications de leads", true],
    ["SUPABASE_URL", "URL projet Supabase", true],
    ["SUPABASE_SERVICE_ROLE_KEY", "Service role key Supabase", true],
    ["ADMIN_PASSWORD", "Mot de passe admin", true],
    ["SESSION_SECRET", "Clé secrète signature sessions", true],
    ["PUBLIC_URL", "URL publique du site", false],
    ["GROQ_API_KEY", "Clé Groq (IA assistant admin, optionnel)", false],
    ["WEBHOOK_URL", "Webhook Slack/Discord (optionnel)", false],
    ["SENTRY_DSN", "Sentry monitoring (optionnel)", false],
  ];

  for (const [key, label, required] of envChecks) {
    const value = process.env[key];
    if (value && value.length > 0) {
      checks.push({
        name: label,
        category: "env",
        status: "ok",
        message: `${key} configurée (${value.slice(0, 6)}…${value.slice(-2)})`,
      });
    } else if (required) {
      checks.push({
        name: label,
        category: "env",
        status: "fail",
        message: `${key} manquante — bloquant`,
      });
    } else {
      checks.push({
        name: label,
        category: "env",
        status: "warn",
        message: `${key} non configurée — fonctionnalité optionnelle désactivée`,
      });
    }
  }

  // ─── Test Resend : ping API ─────────────────────────────────
  if (process.env.RESEND_API_KEY) {
    try {
      const res = await fetch("https://api.resend.com/domains", {
        method: "GET",
        headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}` },
      });
      if (res.ok) {
        const data = await res.json();
        const domains = (data?.data ?? []) as Array<{ name: string; status: string }>;
        checks.push({
          name: "Connectivité API Resend",
          category: "resend",
          status: "ok",
          message: `API joignable · ${domains.length} domaine(s) configuré(s)`,
          details: domains.map((d) => `${d.name} (${d.status})`).join(", "),
        });
        if (process.env.EMAIL_FROM) {
          const fromDomain = process.env.EMAIL_FROM.split("@")[1];
          const found = domains.find((d) => d.name === fromDomain);
          if (!found) {
            checks.push({
              name: "Domaine EMAIL_FROM vérifié",
              category: "resend",
              status: "warn",
              message: `${fromDomain} non listé dans Resend — utiliser onboarding@resend.dev en test`,
            });
          } else if (found.status !== "verified") {
            checks.push({
              name: "Domaine EMAIL_FROM vérifié",
              category: "resend",
              status: "warn",
              message: `${fromDomain} en statut "${found.status}" — vérifier DNS`,
            });
          } else {
            checks.push({
              name: "Domaine EMAIL_FROM vérifié",
              category: "resend",
              status: "ok",
              message: `${fromDomain} vérifié et opérationnel`,
            });
          }
        }
      } else {
        const errText = await res.text();
        checks.push({
          name: "Connectivité API Resend",
          category: "resend",
          status: "fail",
          message: `API rejette la clé : ${res.status}`,
          details: errText.slice(0, 200),
        });
      }
    } catch (e) {
      checks.push({
        name: "Connectivité API Resend",
        category: "resend",
        status: "fail",
        message: `Erreur réseau : ${(e as Error).message}`,
      });
    }
  }

  // ─── Test Supabase : ping REST ──────────────────────────────
  if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
    try {
      const res = await fetch(
        `${process.env.SUPABASE_URL}/rest/v1/leads?select=reference&limit=1`,
        {
          headers: {
            apikey: process.env.SUPABASE_SERVICE_ROLE_KEY,
            Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
          },
        },
      );
      if (res.ok) {
        const rows = await res.json();
        checks.push({
          name: "Connectivité Supabase REST",
          category: "supabase",
          status: "ok",
          message: `API joignable · table 'leads' accessible · ${Array.isArray(rows) ? rows.length : 0} ligne(s) vue(s)`,
        });
      } else {
        const errText = await res.text();
        checks.push({
          name: "Connectivité Supabase REST",
          category: "supabase",
          status: "fail",
          message: `API rejette : ${res.status}`,
          details: errText.slice(0, 200),
        });
      }
    } catch (e) {
      checks.push({
        name: "Connectivité Supabase REST",
        category: "supabase",
        status: "fail",
        message: `Erreur réseau : ${(e as Error).message}`,
      });
    }
  }

  // ─── Summary ────────────────────────────────────────────────
  const summary = {
    ok: checks.filter((c) => c.status === "ok").length,
    warn: checks.filter((c) => c.status === "warn").length,
    fail: checks.filter((c) => c.status === "fail").length,
    timestamp: new Date().toISOString(),
    nodeVersion: process.version,
    vercelRegion: process.env.VERCEL_REGION ?? "unknown",
  };

  return NextResponse.json({ summary, checks });
}
