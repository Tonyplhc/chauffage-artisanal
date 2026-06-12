"use client";

/**
 * Widget d'inscription newsletter pour le footer ou autre.
 * Double opt-in : on stocke en pending, l'email confirmation va envoyer un
 * lien à cliquer côté client.
 */

import { useState } from "react";
import { Mail, Send, CheckCircle2, Loader2 } from "lucide-react";

export function NewsletterSignup({
  variant = "default",
}: {
  variant?: "default" | "compact";
}) {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "loading" | "success" | "error">(
    "idle",
  );
  const [message, setMessage] = useState<string>("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.includes("@")) return;
    setState("loading");
    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setState("success");
        setMessage(
          data.message ?? "Vérifiez vos emails pour confirmer votre inscription.",
        );
      } else {
        setState("error");
        setMessage(data.error ?? "Une erreur est survenue.");
      }
    } catch {
      setState("error");
      setMessage("Erreur réseau.");
    }
  };

  if (state === "success") {
    return (
      <div className="rounded-2xl border border-[#2E7D5A]/30 bg-[#2E7D5A]/5 p-5">
        <div className="flex items-start gap-3">
          <CheckCircle2 className="h-5 w-5 text-[#2E7D5A] shrink-0 mt-0.5" />
          <div>
            <div className="font-mono text-[10px] uppercase tracking-eyebrow text-[#2E7D5A]">
              Inscription en attente
            </div>
            <p className="mt-2 text-sm text-taupe leading-relaxed">{message}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <div>
        <div className="font-mono text-[10px] uppercase tracking-eyebrow text-bleu mb-2">
          {variant === "compact" ? "Newsletter" : "Newsletter technique"}
        </div>
        <div className="flex items-center gap-0 rounded-full border border-pierre bg-white overflow-hidden focus-within:border-bleu transition-colors">
          <span className="pl-4 pr-2 text-taupe">
            <Mail className="h-4 w-4" />
          </span>
          <input
            type="email"
            required
            placeholder="vous@email.lu"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={state === "loading"}
            className="flex-1 py-3 pr-2 text-sm bg-transparent focus:outline-none text-anthra placeholder:text-muted"
          />
          <button
            type="submit"
            disabled={state === "loading" || !email.includes("@")}
            className="m-1 inline-flex items-center gap-1.5 rounded-full bg-navy text-creme px-4 py-2 text-sm font-medium hover:bg-bleu transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {state === "loading" ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
            S&apos;inscrire
          </button>
        </div>
        {variant !== "compact" && (
          <p className="mt-2 text-xs text-muted leading-relaxed">
            Lectures Klimabonus, articles techniques, retours d&apos;expérience. Pas
            de spam — désinscription en un clic.
          </p>
        )}
      </div>
      {state === "error" && (
        <p className="text-xs text-terracotta">{message}</p>
      )}
    </form>
  );
}
