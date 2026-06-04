"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ShieldCheck,
  ShieldAlert,
  QrCode,
  KeyRound,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  Copy,
  Check,
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function TwoFactorAdminPage() {
  const router = useRouter();
  const [enabled, setEnabled] = useState<boolean | null>(null);
  const [enrollment, setEnrollment] = useState<{
    secret: string;
    qrUrl: string;
  } | null>(null);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const refresh = async () => {
    const res = await fetch("/api/admin/2fa", { cache: "no-store" });
    if (res.status === 401) {
      router.replace("/admin/login");
      return;
    }
    const data = await res.json();
    setEnabled(data.enabled);
  };

  useEffect(() => {
    refresh();
  }, []);

  const startEnrollment = async () => {
    setBusy(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch("/api/admin/2fa", { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        setEnrollment({ secret: data.secret, qrUrl: data.qrUrl });
      } else {
        setError(data.error ?? "Erreur");
      }
    } finally {
      setBusy(false);
    }
  };

  const confirm = async () => {
    if (code.replace(/\s/g, "").length !== 6) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/2fa", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const data = await res.json();
      if (res.ok) {
        setSuccess("2FA activé. Vous devrez saisir un code à votre prochaine connexion.");
        setEnrollment(null);
        setCode("");
        await refresh();
      } else {
        setError(data.error ?? "Code invalide");
      }
    } finally {
      setBusy(false);
    }
  };

  const disable = async () => {
    if (code.replace(/\s/g, "").length !== 6) {
      setError("Saisissez votre code actuel pour confirmer la désactivation.");
      return;
    }
    if (!confirm) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/2fa?code=${encodeURIComponent(code)}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (res.ok) {
        setSuccess("2FA désactivé.");
        setCode("");
        await refresh();
      } else {
        setError(data.error ?? "Code invalide");
      }
    } finally {
      setBusy(false);
    }
  };

  const copySecret = () => {
    if (!enrollment) return;
    navigator.clipboard.writeText(enrollment.secret);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="min-h-screen bg-cream py-10 lg:py-14">
      <div className="container max-w-3xl">
        <Link
          href="/admin/leads"
          className="inline-flex items-center gap-2 text-sm font-mono uppercase tracking-eyebrow text-graphite hover:text-copper transition-colors mb-6"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Retour pipeline
        </Link>

        <div className="flex items-start gap-4 mb-8">
          <div
            className={cn(
              "h-14 w-14 rounded-full grid place-items-center border",
              enabled
                ? "bg-[#22a06b]/10 border-[#22a06b]/40 text-[#22a06b]"
                : "bg-ember/10 border-ember/40 text-ember",
            )}
          >
            {enabled ? <ShieldCheck className="h-6 w-6" /> : <ShieldAlert className="h-6 w-6" />}
          </div>
          <div>
            <h1 className="font-display text-display-md text-ink">
              Authentification 2 facteurs
            </h1>
            <p className="mt-2 text-graphite">
              {enabled === null
                ? "Chargement…"
                : enabled
                ? "2FA activé · code requis à chaque connexion."
                : "2FA non activé · seul le mot de passe est requis."}
            </p>
          </div>
        </div>

        {success && (
          <div className="mb-6 p-4 rounded-2xl border border-[#22a06b]/40 bg-[#22a06b]/5 flex items-start gap-3">
            <CheckCircle2 className="h-5 w-5 text-[#22a06b] shrink-0 mt-0.5" />
            <div className="text-sm text-ink">{success}</div>
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 rounded-2xl border border-ember/40 bg-ember/5 flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-ember shrink-0 mt-0.5" />
            <div className="text-sm text-ink">{error}</div>
          </div>
        )}

        {!enabled && !enrollment && (
          <div className="p-6 lg:p-8 rounded-3xl border border-ink/10 bg-white shadow-soft">
            <h2 className="font-display text-2xl text-ink mb-3">
              Activer le 2FA
            </h2>
            <p className="text-graphite leading-relaxed">
              Le 2FA renforce significativement la sécurité de votre compte
              admin. Vous aurez besoin d&apos;une application
              d&apos;authentification (Google Authenticator, Authy, 1Password,
              Microsoft Authenticator…) installée sur votre téléphone.
            </p>
            <button
              onClick={startEnrollment}
              disabled={busy}
              className="mt-5 inline-flex items-center gap-2 rounded-full bg-ink text-cream px-5 py-3 text-sm font-medium hover:bg-copper transition-colors"
            >
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <QrCode className="h-4 w-4" />}
              Commencer l&apos;enrôlement
            </button>
          </div>
        )}

        {enrollment && (
          <div className="p-6 lg:p-8 rounded-3xl border border-copper/40 bg-copper/5">
            <h2 className="font-display text-2xl text-ink mb-2">
              Étape 1 — Scanner le QR code
            </h2>
            <p className="text-sm text-graphite mb-5">
              Ouvrez votre application d&apos;authentification et scannez ce
              code. Vous pouvez aussi saisir le secret manuellement.
            </p>
            <div className="grid sm:grid-cols-[auto_1fr] gap-6 items-start">
              <div className="bg-white p-3 rounded-2xl border border-ink/10">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={enrollment.qrUrl}
                  alt="QR code 2FA"
                  className="w-[180px] h-[180px] block"
                />
              </div>
              <div>
                <div className="font-mono text-[10px] uppercase tracking-eyebrow text-muted mb-2">
                  Secret (saisie manuelle)
                </div>
                <div className="flex items-center gap-2 p-3 rounded-xl bg-white border border-ink/10">
                  <code className="font-mono text-sm text-ink break-all flex-1">
                    {enrollment.secret}
                  </code>
                  <button
                    onClick={copySecret}
                    className="h-8 w-8 grid place-items-center rounded-full bg-cream border border-ink/10 hover:bg-ink hover:text-cream transition-colors"
                  >
                    {copied ? <Check className="h-3.5 w-3.5 text-[#22a06b]" /> : <Copy className="h-3.5 w-3.5" />}
                  </button>
                </div>
                <p className="mt-3 text-xs text-muted">
                  Conservez ce secret hors ligne (gestionnaire de mots de passe)
                  pour pouvoir restaurer l&apos;accès en cas de perte de
                  téléphone.
                </p>
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-ink/10">
              <h2 className="font-display text-2xl text-ink mb-2">
                Étape 2 — Confirmer avec un code
              </h2>
              <p className="text-sm text-graphite mb-3">
                Saisissez le code à 6 chiffres généré par votre app.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9 ]*"
                  maxLength={7}
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/[^\d\s]/g, ""))}
                  placeholder="123 456"
                  className="flex-1 bg-white border border-ink/12 rounded-xl px-4 py-3 text-center font-mono text-xl tracking-[0.4em] focus:border-copper focus:outline-none focus:ring-2 focus:ring-copper/20"
                />
                <button
                  onClick={confirm}
                  disabled={busy || code.replace(/\s/g, "").length !== 6}
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-ink text-cream px-6 py-3 text-sm font-medium hover:bg-copper transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />}
                  Activer le 2FA
                </button>
              </div>
            </div>
          </div>
        )}

        {enabled && (
          <div className="p-6 lg:p-8 rounded-3xl border border-ember/30 bg-ember/5">
            <h2 className="font-display text-2xl text-ink mb-2">
              Désactiver le 2FA
            </h2>
            <p className="text-sm text-graphite mb-4">
              Pour désactiver le 2FA, saisissez votre code actuel à 6 chiffres.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9 ]*"
                maxLength={7}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/[^\d\s]/g, ""))}
                placeholder="123 456"
                className="flex-1 bg-white border border-ink/12 rounded-xl px-4 py-3 text-center font-mono text-xl tracking-[0.4em] focus:border-ember focus:outline-none"
              />
              <button
                onClick={disable}
                disabled={busy || code.replace(/\s/g, "").length !== 6}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-ember text-cream px-5 py-3 text-sm font-medium hover:bg-ember/85 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldAlert className="h-4 w-4" />}
                Désactiver
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
