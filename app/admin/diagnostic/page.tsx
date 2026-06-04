"use client";

/**
 * /admin/diagnostic — page de diagnostic temps réel.
 *
 * Lance un test live de toutes les intégrations critiques (Resend,
 * Supabase, env vars) et affiche un rapport visuel. Bouton "Envoyer un
 * email de test" pour vérifier que Resend marche pour de vrai.
 */

import { useEffect, useState } from "react";
import { CheckCircle2, AlertCircle, XCircle, RefreshCw, Send } from "lucide-react";

type Check = {
  name: string;
  category: "env" | "resend" | "supabase" | "config";
  status: "ok" | "warn" | "fail";
  message: string;
  details?: string;
};

type Diagnostic = {
  summary: { ok: number; warn: number; fail: number; timestamp: string; nodeVersion: string; vercelRegion: string };
  checks: Check[];
};

export default function DiagnosticPage() {
  const [data, setData] = useState<Diagnostic | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [testEmail, setTestEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [emailResult, setEmailResult] = useState<string | null>(null);

  const fetchDiagnostic = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/diagnostic");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const d = await res.json();
      setData(d);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDiagnostic();
  }, []);

  const sendTestEmail = async () => {
    if (!testEmail) return;
    setSending(true);
    setEmailResult(null);
    try {
      const res = await fetch("/api/admin/diagnostic/send-test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to: testEmail }),
      });
      const data = await res.json();
      if (res.ok) {
        setEmailResult(`Email envoyé · ID Resend : ${data.id}`);
      } else {
        setEmailResult(`Erreur : ${data.error ?? "inconnue"}`);
      }
    } catch (e) {
      setEmailResult(`Erreur réseau : ${(e as Error).message}`);
    } finally {
      setSending(false);
    }
  };

  const grouped: Record<string, Check[]> = {};
  for (const c of data?.checks ?? []) {
    grouped[c.category] ??= [];
    grouped[c.category].push(c);
  }

  const CATEGORY_LABELS: Record<string, string> = {
    env: "Variables d'environnement",
    resend: "Intégration Resend (email)",
    supabase: "Intégration Supabase (DB)",
    config: "Configuration générale",
  };

  return (
    <div className="min-h-screen bg-cream py-12">
      <div className="container max-w-5xl">
        <div className="mb-8 flex items-end justify-between flex-wrap gap-4">
          <div>
            <h1 className="font-display text-3xl text-ink tracking-tight">
              Diagnostic intégrations
            </h1>
            <p className="mt-2 text-sm text-graphite">
              Test live des services connectés (Resend, Supabase, env vars)
            </p>
          </div>
          <button
            onClick={fetchDiagnostic}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-full bg-ink text-cream px-5 py-2.5 text-sm font-medium hover:bg-copper transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            {loading ? "Test en cours…" : "Relancer le test"}
          </button>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-2xl bg-ember/10 border border-ember/40 text-sm">
            Erreur : {error}
          </div>
        )}

        {data && (
          <>
            {/* Summary card */}
            <div className="grid grid-cols-3 gap-4 mb-8">
              <SummaryCard label="OK" count={data.summary.ok} color="copper" />
              <SummaryCard label="Avertissements" count={data.summary.warn} color="ember" />
              <SummaryCard label="Échecs" count={data.summary.fail} color="red" />
            </div>

            {/* Grouped checks */}
            <div className="space-y-6">
              {Object.entries(grouped).map(([cat, checks]) => (
                <section key={cat}>
                  <h2 className="font-mono text-[11px] uppercase tracking-eyebrow text-copper mb-3">
                    {CATEGORY_LABELS[cat] ?? cat}
                  </h2>
                  <div className="space-y-2">
                    {checks.map((c, i) => (
                      <CheckRow key={i} check={c} />
                    ))}
                  </div>
                </section>
              ))}
            </div>

            {/* Test email send */}
            <section className="mt-10 p-6 rounded-2xl border border-ink/10 bg-white">
              <h2 className="font-display text-xl text-ink tracking-tight mb-2">
                Envoyer un email de test
              </h2>
              <p className="text-sm text-graphite mb-4">
                Test concret : envoie un email à l&apos;adresse indiquée via Resend. Si vous le
                recevez en ~5 secondes, l&apos;intégration est opérationnelle.
              </p>
              <div className="flex gap-2 flex-wrap">
                <input
                  type="email"
                  value={testEmail}
                  onChange={(e) => setTestEmail(e.target.value)}
                  placeholder="votre.email@example.com"
                  className="flex-1 min-w-[200px] px-4 py-2.5 rounded-xl border border-ink/15 bg-cream text-sm"
                />
                <button
                  onClick={sendTestEmail}
                  disabled={sending || !testEmail}
                  className="inline-flex items-center gap-2 rounded-xl bg-ink text-cream px-5 py-2.5 text-sm font-medium hover:bg-copper transition-colors disabled:opacity-50"
                >
                  <Send className="h-4 w-4" />
                  {sending ? "Envoi…" : "Envoyer"}
                </button>
              </div>
              {emailResult && (
                <div
                  className={`mt-4 p-3 rounded-xl text-sm ${
                    emailResult.startsWith("Email envoyé")
                      ? "bg-copper/10 border border-copper/30 text-ink"
                      : "bg-ember/10 border border-ember/30 text-ink"
                  }`}
                >
                  {emailResult}
                </div>
              )}
            </section>

            <div className="mt-6 text-xs text-muted font-mono">
              Test effectué : {new Date(data.summary.timestamp).toLocaleString("fr-LU")} ·
              Node {data.summary.nodeVersion} · Vercel {data.summary.vercelRegion}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function SummaryCard({
  label,
  count,
  color,
}: {
  label: string;
  count: number;
  color: "copper" | "ember" | "red";
}) {
  const colors = {
    copper: "border-copper/30 bg-copper/5 text-copper",
    ember: "border-ember/30 bg-ember/5 text-ember",
    red: "border-red-500/30 bg-red-500/5 text-red-600",
  };
  return (
    <div className={`p-5 rounded-2xl border ${colors[color]}`}>
      <div className="font-mono text-[10px] uppercase tracking-eyebrow opacity-70">
        {label}
      </div>
      <div className="mt-2 font-display text-4xl">{count}</div>
    </div>
  );
}

function CheckRow({ check }: { check: Check }) {
  const Icon =
    check.status === "ok"
      ? CheckCircle2
      : check.status === "warn"
        ? AlertCircle
        : XCircle;
  const colorClass =
    check.status === "ok"
      ? "text-copper"
      : check.status === "warn"
        ? "text-ember"
        : "text-red-600";

  return (
    <div className="flex items-start gap-3 p-4 rounded-xl border border-ink/8 bg-white">
      <Icon className={`h-5 w-5 mt-0.5 shrink-0 ${colorClass}`} />
      <div className="min-w-0 flex-1">
        <div className="font-medium text-ink text-sm">{check.name}</div>
        <div className="mt-0.5 text-xs text-graphite">{check.message}</div>
        {check.details && (
          <div className="mt-1 font-mono text-[11px] text-muted bg-cream rounded px-2 py-1 break-all">
            {check.details}
          </div>
        )}
      </div>
    </div>
  );
}
