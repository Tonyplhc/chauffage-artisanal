"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Lock, Shield, AlertTriangle, KeyRound } from "lucide-react";

// La page utilise useSearchParams() pour lire le paramètre `from`. En build
// prod statique, le prerender du Suspense fallback échoue silencieusement et
// la page se résout sur le not-found.tsx. force-dynamic règle ça.
// (export const ne marche pas dans un Client Component — on s'appuie sur
//  l'absence d'export statique pour rester dynamic.)

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  // Landing par défaut = dashboard moderne (pas la liste de leads brute).
  // Si l'utilisateur a été redirigé depuis une page protégée, on le ramène là.
  const from = params.get("from") ?? "/admin/dashboard";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [totp, setTotp] = useState("");
  const [step, setStep] = useState<"password" | "totp">("password");
  const [multiUser, setMultiUser] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [attemptsLeft, setAttemptsLeft] = useState<number | null>(null);
  const [locked, setLocked] = useState(false);

  useEffect(() => {
    // Sonde mode multi-user au montage
    fetch("/api/admin/users/probe", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : { multiUser: false }))
      .then((d) => setMultiUser(!!d.multiUser))
      .catch(() => {});
    const t = setTimeout(() => {
      const el = document.getElementById("password-input");
      if (el) (el as HTMLInputElement).focus();
    }, 100);
    return () => clearTimeout(t);
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (step === "password" && !password) return;
    if (step === "totp" && totp.replace(/\s/g, "").length !== 6) return;
    setPending(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...(multiUser ? { email } : {}),
          password,
          ...(step === "totp" ? { totp } : {}),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.ok) {
        router.replace(from);
        router.refresh();
        return;
      }
      // Réponse 200 mais twoFactorRequired = on bascule à l'étape TOTP
      if (res.ok && data.twoFactorRequired) {
        setStep("totp");
        setTimeout(() => {
          const el = document.getElementById("totp-input");
          if (el) (el as HTMLInputElement).focus();
        }, 100);
        return;
      }
      if (res.status === 429) {
        setLocked(true);
        setError(data.error ?? "Trop d'échecs.");
      } else {
        setError(data.error ?? "Échec de connexion.");
        if (data.twoFactorRequired) setStep("totp");
        if (typeof data.attemptsLeft === "number") setAttemptsLeft(data.attemptsLeft);
      }
    } catch {
      setError("Connexion impossible.");
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="min-h-screen bg-cream grid place-items-center px-5 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <div className="inline-grid place-items-center h-14 w-14 rounded-full bg-copper/10 border border-copper/30 mb-5">
            <Lock className="h-6 w-6 text-copper" />
          </div>
          <div className="font-mono text-[10px] uppercase tracking-eyebrow text-copper">
            Accès interne · pipeline
          </div>
          <h1 className="mt-3 font-display text-3xl text-ink">Connexion administrateur</h1>
          <p className="mt-3 text-sm text-graphite">
            Tableau de bord des leads Chauffage Artisanal.
          </p>
        </div>

        <form
          onSubmit={submit}
          className="p-7 lg:p-8 rounded-3xl border border-ink/10 bg-white shadow-card"
        >
          {step === "password" ? (
            <div className="grid gap-4">
              {multiUser && (
                <label htmlFor="email-input" className="block">
                  <div className="font-mono text-[10px] uppercase tracking-eyebrow text-muted mb-3">
                    Email
                  </div>
                  <input
                    id="email-input"
                    type="email"
                    autoComplete="username"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={pending || locked}
                    placeholder="email@chauffage-artisanal.lu"
                    className="w-full bg-cream border border-ink/12 rounded-xl px-4 py-3.5 text-ink focus:border-copper focus:outline-none focus:ring-2 focus:ring-copper/20 transition-all disabled:opacity-50"
                  />
                </label>
              )}
              <label htmlFor="password-input" className="block">
                <div className="font-mono text-[10px] uppercase tracking-eyebrow text-muted mb-3">
                  Mot de passe
                </div>
                <input
                  id="password-input"
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={pending || locked}
                  className="w-full bg-cream border border-ink/12 rounded-xl px-4 py-3.5 text-ink focus:border-copper focus:outline-none focus:ring-2 focus:ring-copper/20 transition-all disabled:opacity-50"
                />
              </label>
            </div>
          ) : (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <KeyRound className="h-3.5 w-3.5 text-copper" />
                <span className="font-mono text-[10px] uppercase tracking-eyebrow text-muted">
                  Code 2FA — 6 chiffres
                </span>
              </div>
              <input
                id="totp-input"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                pattern="[0-9 ]*"
                maxLength={7}
                value={totp}
                onChange={(e) => setTotp(e.target.value.replace(/[^\d\s]/g, ""))}
                disabled={pending || locked}
                placeholder="123 456"
                className="w-full bg-cream border border-ink/12 rounded-xl px-4 py-3.5 text-ink text-center font-mono text-2xl tracking-[0.5em] focus:border-copper focus:outline-none focus:ring-2 focus:ring-copper/20 transition-all disabled:opacity-50"
              />
              <p className="mt-3 text-xs text-muted">
                Saisissez le code généré par votre application
                d&apos;authentification (Google Authenticator, Authy…).
              </p>
            </div>
          )}

          {error && (
            <div className="mt-5 p-3.5 rounded-xl bg-ember/8 border border-ember/30 flex gap-3 items-start text-sm text-ink">
              <AlertTriangle className="h-4 w-4 text-ember shrink-0 mt-0.5" />
              <div>
                <div>{error}</div>
                {attemptsLeft !== null && !locked && (
                  <div className="mt-1 text-xs text-muted">
                    {attemptsLeft} tentative{attemptsLeft > 1 ? "s" : ""} restante
                    {attemptsLeft > 1 ? "s" : ""}.
                  </div>
                )}
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={
              pending ||
              locked ||
              (step === "password" ? !password : totp.replace(/\s/g, "").length !== 6)
            }
            className="mt-6 w-full inline-flex items-center justify-center gap-2 rounded-full bg-ink text-cream px-6 py-3.5 text-sm font-medium hover:bg-copper transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            {pending
              ? "Vérification…"
              : locked
              ? "Verrouillé temporairement"
              : step === "totp"
              ? "Valider le code"
              : "Continuer"}
          </button>

          {step === "totp" && (
            <button
              type="button"
              onClick={() => {
                setStep("password");
                setTotp("");
                setError(null);
              }}
              className="mt-3 w-full text-xs text-graphite hover:text-ink transition-colors"
            >
              ← Modifier le mot de passe
            </button>
          )}

          <div className="mt-6 pt-6 border-t border-ink/8 flex items-center justify-center gap-2 text-[10px] font-mono uppercase tracking-eyebrow text-muted">
            <Shield className="h-3 w-3 text-copper" />
            Session signée · expiration 12 h
            {step === "totp" && " · 2FA"}
          </div>
        </form>
      </div>
    </div>
  );
}

export function LoginPageInner() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
