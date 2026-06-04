"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Plus,
  Trash2,
  Webhook,
  Save,
  Power,
  TestTube,
  Loader2,
  CheckCircle2,
  XCircle,
  KeyRound,
} from "lucide-react";
import type { CustomWebhook, WebhookEvent } from "@/lib/custom-webhooks-store";
import { cn } from "@/lib/utils";

const EVENT_LABELS: Record<WebhookEvent, string> = {
  "lead.created": "Nouveau lead créé",
  "lead.status_changed": "Statut lead changé",
  "lead.quote_sent": "Devis envoyé",
  "lead.quote_accepted": "Devis accepté",
  "lead.quote_refused": "Devis refusé",
  "newsletter.subscribed": "Inscription newsletter",
  "newsletter.confirmed": "Newsletter confirmée",
};

export default function WebhooksPage() {
  const router = useRouter();
  const [hooks, setHooks] = useState<CustomWebhook[] | null>(null);
  const [events, setEvents] = useState<WebhookEvent[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [draft, setDraft] = useState<CustomWebhook | null>(null);
  const [busy, setBusy] = useState<"save" | "test" | "delete" | null>(null);
  const [testResult, setTestResult] = useState<{ ok: boolean; status?: number; error?: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const refresh = async () => {
    const res = await fetch("/api/admin/webhooks", { cache: "no-store" });
    if (res.status === 401) {
      router.replace("/admin/login");
      return;
    }
    const data = await res.json();
    setHooks(data.webhooks ?? []);
    setEvents(data.events ?? []);
    if (!activeId && data.webhooks?.[0]) {
      setActiveId(data.webhooks[0].id);
      setDraft(data.webhooks[0]);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  useEffect(() => {
    if (activeId && hooks) {
      const h = hooks.find((x) => x.id === activeId);
      if (h) setDraft(h);
    }
  }, [activeId, hooks]);

  const createNew = () => {
    const id = `hook-${Date.now()}`;
    const hook: CustomWebhook = {
      id,
      name: "Nouveau webhook",
      url: "",
      events: ["lead.created"],
      enabled: true,
      fireCount: 0,
      failureCount: 0,
    };
    setHooks((hs) => (hs ? [...hs, hook] : [hook]));
    setActiveId(id);
    setDraft(hook);
  };

  const save = async () => {
    if (!draft) return;
    setBusy("save");
    setError(null);
    try {
      const res = await fetch("/api/admin/webhooks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(draft),
      });
      const data = await res.json();
      if (res.ok) await refresh();
      else setError(data.error ?? "Erreur");
    } finally {
      setBusy(null);
    }
  };

  const test = async () => {
    if (!draft) return;
    setBusy("test");
    setTestResult(null);
    try {
      const res = await fetch("/api/admin/webhooks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "test", webhook: draft }),
      });
      const data = await res.json();
      setTestResult(data);
    } finally {
      setBusy(null);
    }
  };

  const remove = async () => {
    if (!draft) return;
    if (!confirm(`Supprimer le webhook « ${draft.name} » ?`)) return;
    setBusy("delete");
    try {
      const res = await fetch(`/api/admin/webhooks?id=${encodeURIComponent(draft.id)}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setActiveId(null);
        setDraft(null);
        await refresh();
      }
    } finally {
      setBusy(null);
    }
  };

  const toggleEvent = (ev: WebhookEvent) => {
    if (!draft) return;
    const set = new Set(draft.events);
    if (set.has(ev)) set.delete(ev);
    else set.add(ev);
    setDraft({ ...draft, events: Array.from(set) as WebhookEvent[] });
  };

  return (
    <div className="min-h-screen bg-cream py-10 lg:py-14">
      <div className="container max-w-7xl">
        <Link
          href="/admin/leads"
          className="inline-flex items-center gap-2 text-sm font-mono uppercase tracking-eyebrow text-graphite hover:text-copper transition-colors mb-6"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Retour pipeline
        </Link>

        <div className="flex items-start justify-between gap-4 mb-8 flex-wrap">
          <div>
            <h1 className="font-display text-display-md text-ink">
              Webhooks personnalisés
            </h1>
            <p className="mt-2 text-graphite">
              POST JSON vers des URLs externes (CRM, Zapier, Teams, Datadog…) à chaque événement métier.
            </p>
          </div>
          <button
            onClick={createNew}
            className="inline-flex items-center gap-2 rounded-full bg-ink text-cream px-5 py-2.5 text-sm font-medium hover:bg-copper transition-colors"
          >
            <Plus className="h-4 w-4" />
            Nouveau webhook
          </button>
        </div>

        <div className="grid lg:grid-cols-12 gap-6">
          {/* Liste */}
          <div className="lg:col-span-4">
            <div className="rounded-2xl border border-ink/10 bg-white shadow-soft p-3">
              {hooks === null ? (
                <div className="p-6 text-center text-muted text-sm">Chargement…</div>
              ) : hooks.length === 0 ? (
                <div className="p-6 text-center text-muted text-sm">
                  Aucun webhook. Cliquez « Nouveau webhook ».
                </div>
              ) : (
                <ul className="grid gap-1">
                  {hooks.map((h) => (
                    <li key={h.id}>
                      <button
                        onClick={() => setActiveId(h.id)}
                        className={cn(
                          "w-full text-left px-4 py-3 rounded-xl transition-colors flex items-start gap-3",
                          activeId === h.id
                            ? "bg-ink text-cream"
                            : "bg-cream/50 hover:bg-cream text-ink",
                        )}
                      >
                        <Webhook
                          className={cn(
                            "h-4 w-4 mt-0.5 shrink-0",
                            h.enabled ? "text-copper" : "text-muted",
                          )}
                        />
                        <div className="min-w-0 flex-1">
                          <div className="font-medium text-sm truncate flex items-center gap-2">
                            {h.name}
                            {!h.enabled && (
                              <span className="text-[9px] font-mono uppercase opacity-60">
                                Off
                              </span>
                            )}
                          </div>
                          <div
                            className={cn(
                              "text-xs truncate",
                              activeId === h.id ? "text-cream/70" : "text-muted",
                            )}
                          >
                            {h.events.length} événement(s) · {h.fireCount ?? 0} ping(s)
                          </div>
                        </div>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Signature info */}
            <div className="mt-4 p-4 rounded-2xl border border-copper/30 bg-copper/5">
              <div className="font-mono text-[10px] uppercase tracking-eyebrow text-copper mb-2">
                Signature HMAC
              </div>
              <p className="text-xs text-graphite leading-relaxed">
                Si vous renseignez un <code className="font-mono">secret</code>,
                chaque requête inclut un header{" "}
                <code className="font-mono">X-CA-Signature: sha256=&lt;hex&gt;</code>{" "}
                que votre récepteur peut vérifier pour authentifier l&apos;origine.
              </p>
            </div>
          </div>

          {/* Éditeur */}
          <div className="lg:col-span-8">
            {draft ? (
              <div className="rounded-2xl border border-ink/10 bg-white shadow-soft p-6 lg:p-8">
                <div className="grid gap-4 mb-5">
                  <Field label="Nom interne">
                    <input
                      type="text"
                      value={draft.name}
                      onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                      className="w-full bg-cream border border-ink/12 rounded-xl px-4 py-2.5 text-sm text-ink focus:border-copper focus:outline-none"
                    />
                  </Field>
                  <Field label="URL cible">
                    <input
                      type="url"
                      value={draft.url}
                      onChange={(e) => setDraft({ ...draft, url: e.target.value })}
                      placeholder="https://hooks.zapier.com/..."
                      className="w-full bg-cream border border-ink/12 rounded-xl px-4 py-2.5 text-sm text-ink font-mono focus:border-copper focus:outline-none"
                    />
                  </Field>
                  <Field label="Secret HMAC (optionnel)">
                    <div className="flex items-center gap-3">
                      <KeyRound className="h-4 w-4 text-graphite shrink-0" />
                      <input
                        type="text"
                        value={draft.secret ?? ""}
                        onChange={(e) =>
                          setDraft({
                            ...draft,
                            secret: e.target.value || undefined,
                          })
                        }
                        placeholder="Si renseigné, X-CA-Signature inclus"
                        className="flex-1 bg-cream border border-ink/12 rounded-xl px-4 py-2.5 text-sm text-ink font-mono focus:border-copper focus:outline-none"
                      />
                    </div>
                  </Field>
                </div>

                <div className="font-mono text-[10px] uppercase tracking-eyebrow text-copper mb-3">
                  Événements écoutés
                </div>
                <div className="grid sm:grid-cols-2 gap-2 mb-6">
                  {events.map((ev) => {
                    const active = draft.events.includes(ev);
                    return (
                      <button
                        key={ev}
                        onClick={() => toggleEvent(ev)}
                        className={cn(
                          "text-left px-3 py-2.5 rounded-xl border text-sm transition-colors flex items-center justify-between gap-2",
                          active
                            ? "bg-copper text-cream border-copper"
                            : "bg-cream border-ink/12 text-ink hover:border-copper/40",
                        )}
                      >
                        <span>{EVENT_LABELS[ev]}</span>
                        {active && <CheckCircle2 className="h-4 w-4" />}
                      </button>
                    );
                  })}
                </div>

                {testResult && (
                  <div
                    className={cn(
                      "p-3 rounded-xl border mb-4 text-sm flex items-start gap-2",
                      testResult.ok
                        ? "bg-[#22a06b]/10 border-[#22a06b]/40 text-ink"
                        : "bg-ember/10 border-ember/40 text-ink",
                    )}
                  >
                    {testResult.ok ? (
                      <CheckCircle2 className="h-4 w-4 text-[#22a06b] shrink-0 mt-0.5" />
                    ) : (
                      <XCircle className="h-4 w-4 text-ember shrink-0 mt-0.5" />
                    )}
                    <div>
                      {testResult.ok
                        ? `Test OK · HTTP ${testResult.status}`
                        : `Test échoué · ${testResult.error ?? `HTTP ${testResult.status}`}`}
                    </div>
                  </div>
                )}

                {error && (
                  <div className="p-3 rounded-xl border border-ember/40 bg-ember/5 text-sm text-ember mb-4">
                    {error}
                  </div>
                )}

                <div className="pt-5 border-t border-ink/8 flex items-center justify-between gap-3 flex-wrap">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setDraft({ ...draft, enabled: !draft.enabled })}
                      className={cn(
                        "inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm border transition-colors",
                        draft.enabled
                          ? "border-[#22a06b]/40 bg-[#22a06b]/8 text-[#22a06b]"
                          : "border-ink/15 bg-white text-graphite",
                      )}
                    >
                      <Power className="h-3.5 w-3.5" />
                      {draft.enabled ? "Activé" : "Désactivé"}
                    </button>
                    <button
                      onClick={remove}
                      disabled={busy === "delete"}
                      className="inline-flex items-center gap-1.5 rounded-full border border-ember/40 bg-white px-4 py-2 text-sm text-ember hover:bg-ember/10 transition-colors"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Supprimer
                    </button>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={test}
                      disabled={busy !== null || !draft.url}
                      className="inline-flex items-center gap-2 rounded-full border border-ink/15 bg-white px-4 py-2 text-sm text-ink hover:border-copper/40 transition-colors disabled:opacity-40"
                    >
                      {busy === "test" ? <Loader2 className="h-4 w-4 animate-spin" /> : <TestTube className="h-4 w-4" />}
                      Tester
                    </button>
                    <button
                      onClick={save}
                      disabled={busy !== null || !draft.url || !draft.name}
                      className={cn(
                        "inline-flex items-center gap-2 rounded-full px-5 py-2 text-sm font-medium transition-colors",
                        busy !== null || !draft.url || !draft.name
                          ? "bg-ink/15 text-ink/40 cursor-not-allowed"
                          : "bg-ink text-cream hover:bg-copper",
                      )}
                    >
                      {busy === "save" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                      Enregistrer
                    </button>
                  </div>
                </div>

                {/* Stats */}
                <div className="mt-5 pt-5 border-t border-ink/8 grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <Stat label="Total fires" value={draft.fireCount ?? 0} />
                  <Stat label="Failures" value={draft.failureCount ?? 0} />
                  <Stat
                    label="Dernier tir"
                    value={
                      draft.lastFiredAt
                        ? new Date(draft.lastFiredAt).toLocaleString("fr-FR", {
                            dateStyle: "short",
                            timeStyle: "short",
                          })
                        : "—"
                    }
                    small
                  />
                  <Stat
                    label="Taux succès"
                    value={
                      draft.fireCount
                        ? `${Math.round(((draft.fireCount - (draft.failureCount ?? 0)) / draft.fireCount) * 100)}%`
                        : "—"
                    }
                  />
                </div>
              </div>
            ) : (
              <div className="rounded-2xl border border-ink/10 bg-white p-12 text-center">
                <Webhook className="h-10 w-10 mx-auto text-ink/15" />
                <p className="mt-4 text-graphite">
                  Sélectionnez un webhook à gauche ou créez-en un nouveau.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <div className="font-mono text-[10px] uppercase tracking-eyebrow text-muted mb-2">
        {label}
      </div>
      {children}
    </label>
  );
}

function Stat({ label, value, small }: { label: string; value: number | string; small?: boolean }) {
  return (
    <div className="p-3 rounded-xl bg-cream border border-ink/8">
      <div className="font-mono text-[10px] uppercase tracking-eyebrow text-muted">
        {label}
      </div>
      <div
        className={cn(
          "mt-1 font-display text-ink tabular-nums",
          small ? "text-base truncate" : "text-xl",
        )}
      >
        {value}
      </div>
    </div>
  );
}
