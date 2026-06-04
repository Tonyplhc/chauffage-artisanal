"use client";

/**
 * Page de gestion de ma signature email.
 *
 * Édition HTML / texte, preview rendue côté droit, toggles d'application.
 */

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Loader2,
  Save,
  Check,
  Mail,
  Eye,
  RotateCcw,
} from "lucide-react";
import { cn } from "@/lib/utils";

type Signature = {
  userEmail: string;
  html: string;
  text: string;
  includeInTemplates: boolean;
  includeInCampaigns: boolean;
  updatedAt: string;
} | null;

const HTML_TEMPLATE = `<p><strong>Prénom Nom</strong> · Chauffage Artisanal</p>
<p>📞 <a href="tel:+352000000000">+352 00 00 00 00</a></p>
<p>✉ <a href="mailto:contact@chauffage-artisanal.lu">contact@chauffage-artisanal.lu</a></p>
<p>🌐 <a href="https://www.chauffage-artisanal.lu">www.chauffage-artisanal.lu</a></p>`;

const TEXT_TEMPLATE = `Prénom Nom · Chauffage Artisanal
+352 00 00 00 00
contact@chauffage-artisanal.lu
www.chauffage-artisanal.lu`;

export default function MySignaturePage() {
  const router = useRouter();
  const [email, setEmail] = useState<string | null>(null);
  const [draft, setDraft] = useState<{
    html: string;
    text: string;
    includeInTemplates: boolean;
    includeInCampaigns: boolean;
  }>({
    html: "",
    text: "",
    includeInTemplates: true,
    includeInCampaigns: true,
  });
  const [loaded, setLoaded] = useState(false);
  const [busy, setBusy] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<"html" | "text" | "preview">("html");

  const load = useCallback(async () => {
    const res = await fetch("/api/admin/me/signature", { cache: "no-store" });
    if (res.status === 401) {
      router.replace("/admin/login");
      return;
    }
    if (res.ok) {
      const data: { signature: Signature; email: string } = await res.json();
      setEmail(data.email);
      if (data.signature) {
        setDraft({
          html: data.signature.html,
          text: data.signature.text,
          includeInTemplates: data.signature.includeInTemplates,
          includeInCampaigns: data.signature.includeInCampaigns,
        });
      }
      setLoaded(true);
    }
  }, [router]);

  useEffect(() => {
    load();
  }, [load]);

  const save = async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/me/signature", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(draft),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Erreur");
      setDirty(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setBusy(false);
    }
  };

  const reset = async () => {
    if (
      !confirm(
        "Réinitialiser votre signature ? L'édition courante sera perdue.",
      )
    )
      return;
    setBusy(true);
    try {
      await fetch("/api/admin/me/signature", { method: "DELETE" });
      setDraft({
        html: "",
        text: "",
        includeInTemplates: true,
        includeInCampaigns: true,
      });
      setDirty(false);
    } finally {
      setBusy(false);
    }
  };

  const insertTemplate = () => {
    setDraft({
      ...draft,
      html: HTML_TEMPLATE,
      text: TEXT_TEMPLATE,
    });
    setDirty(true);
  };

  return (
    <div className="min-h-screen bg-cream py-10 lg:py-14">
      <div className="container max-w-5xl">
        <Link
          href="/admin/leads"
          className="inline-flex items-center gap-2 text-sm font-mono uppercase tracking-eyebrow text-graphite hover:text-copper transition-colors mb-6"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Retour pipeline
        </Link>

        <div className="mb-8">
          <h1 className="font-display text-display-md text-ink">
            Ma signature email
          </h1>
          <p className="mt-2 text-graphite">
            Signature appliquée automatiquement aux emails de templates et
            campagnes envoyés depuis votre compte.{" "}
            {email && (
              <span className="text-muted">· compte : {email}</span>
            )}
          </p>
        </div>

        {!loaded ? (
          <div className="py-16 text-center text-muted">
            <Loader2 className="h-6 w-6 animate-spin mx-auto" />
          </div>
        ) : (
          <div className="rounded-2xl border border-ink/10 bg-white shadow-soft overflow-hidden">
            {/* Toolbar tabs */}
            <div className="border-b border-ink/8 bg-cream/40 flex items-center gap-1 px-2">
              {(["html", "text", "preview"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={cn(
                    "px-3 py-2 text-xs font-mono uppercase tracking-eyebrow border-b-2 transition-colors",
                    tab === t
                      ? "border-copper text-copper"
                      : "border-transparent text-graphite hover:text-ink",
                  )}
                >
                  {t === "preview" ? "Aperçu" : t.toUpperCase()}
                </button>
              ))}
              <button
                onClick={insertTemplate}
                className="ml-auto inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-white border border-ink/10 text-graphite text-xs hover:border-copper/40"
              >
                Insérer modèle de base
              </button>
            </div>

            {/* Content */}
            <div className="p-5">
              {tab === "html" && (
                <textarea
                  rows={12}
                  value={draft.html}
                  onChange={(e) => {
                    setDraft({ ...draft, html: e.target.value });
                    setDirty(true);
                  }}
                  placeholder='<p><strong>Prénom Nom</strong> · Chauffage Artisanal</p>…'
                  className="w-full bg-cream border border-ink/12 rounded-xl px-4 py-3 text-sm focus:border-copper focus:outline-none resize-none font-mono"
                />
              )}
              {tab === "text" && (
                <textarea
                  rows={12}
                  value={draft.text}
                  onChange={(e) => {
                    setDraft({ ...draft, text: e.target.value });
                    setDirty(true);
                  }}
                  placeholder="Prénom Nom · Chauffage Artisanal&#10;+352 …"
                  className="w-full bg-cream border border-ink/12 rounded-xl px-4 py-3 text-sm focus:border-copper focus:outline-none resize-none font-mono"
                />
              )}
              {tab === "preview" && (
                <div>
                  <div className="font-mono text-[10px] uppercase tracking-eyebrow text-muted mb-2 inline-flex items-center gap-1">
                    <Eye className="h-3 w-3" />
                    Aperçu HTML
                  </div>
                  <div className="rounded-xl border border-ink/12 bg-white p-5">
                    <div
                      dangerouslySetInnerHTML={{
                        __html: draft.html || "<em>Aucune signature</em>",
                      }}
                    />
                  </div>
                  <div className="mt-4 font-mono text-[10px] uppercase tracking-eyebrow text-muted mb-2">
                    Aperçu texte
                  </div>
                  <pre className="rounded-xl border border-ink/12 bg-cream/40 p-4 text-xs whitespace-pre-wrap font-mono">
                    {draft.text || "(Aucune signature texte)"}
                  </pre>
                </div>
              )}
            </div>

            {/* Settings */}
            <div className="border-t border-ink/8 p-5 grid gap-3">
              <Toggle
                label="Inclure dans les emails de templates"
                hint="Tous les templates envoyés depuis votre compte"
                checked={draft.includeInTemplates}
                onChange={(v) => {
                  setDraft({ ...draft, includeInTemplates: v });
                  setDirty(true);
                }}
              />
              <Toggle
                label="Inclure dans les campagnes newsletter"
                hint="Campagnes envoyées sous votre identité"
                checked={draft.includeInCampaigns}
                onChange={(v) => {
                  setDraft({ ...draft, includeInCampaigns: v });
                  setDirty(true);
                }}
              />
            </div>

            {/* Actions */}
            {error && (
              <div className="px-5 py-2 text-xs text-ember bg-ember/5 border-t border-ember/20">
                {error}
              </div>
            )}
            <div className="border-t border-ink/8 px-5 py-3 bg-cream/40 flex items-center gap-2">
              <button
                onClick={save}
                disabled={busy || !dirty}
                className="inline-flex items-center gap-1.5 rounded-full bg-ink text-cream px-4 py-2 text-sm hover:bg-copper disabled:opacity-40"
              >
                {busy ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : dirty ? (
                  <Save className="h-3.5 w-3.5" />
                ) : (
                  <Check className="h-3.5 w-3.5" />
                )}
                {dirty ? "Enregistrer" : "Enregistré"}
              </button>
              <button
                onClick={reset}
                disabled={busy}
                className="inline-flex items-center gap-1.5 text-xs text-graphite hover:text-ember disabled:opacity-40"
              >
                <RotateCcw className="h-3 w-3" />
                Réinitialiser
              </button>
              <span className="ml-auto inline-flex items-center gap-1 text-[11px] text-muted">
                <Mail className="h-3 w-3" />
                Appliquée par le serveur au moment de l&apos;envoi
              </span>
            </div>
          </div>
        )}

        <p className="mt-4 text-xs text-muted">
          La signature est ajoutée juste avant la balise <code>&lt;/body&gt;</code>
          des emails HTML (et avec un séparateur <code>--</code> dans les
          emails texte). Marker idempotent : si l&apos;email contient déjà
          votre signature, elle n&apos;est pas ré-ajoutée.
        </p>
      </div>
    </div>
  );
}

function Toggle({
  label,
  hint,
  checked,
  onChange,
}: {
  label: string;
  hint?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex items-start gap-3 cursor-pointer">
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`mt-0.5 h-5 w-9 rounded-full transition-colors relative shrink-0 ${
          checked ? "bg-ink" : "bg-cream border border-ink/15"
        }`}
      >
        <span
          className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-all ${
            checked ? "left-[18px]" : "left-0.5"
          }`}
        />
      </button>
      <span className="min-w-0 flex-1">
        <div className="text-sm text-ink">{label}</div>
        {hint && <div className="text-[11px] text-muted">{hint}</div>}
      </span>
    </label>
  );
}
