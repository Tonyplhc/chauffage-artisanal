"use client";

/**
 * Édition des drip campaigns (séquences emails).
 */

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Plus,
  Loader2,
  Trash2,
  Save,
  Check,
  Mail,
  Clock,
  Send,
  Pause,
  Play,
} from "lucide-react";
import { cn } from "@/lib/utils";

type Step = {
  id?: string;
  delayDays: number;
  subject: string;
  body: string;
};

type Campaign = {
  id: string;
  name: string;
  description?: string;
  trigger: "status_change" | "conversion" | "abandonment" | "manual";
  conditions: {
    status?: string;
    level?: string;
    fromStatus?: string;
    toStatus?: string;
  };
  steps: Step[];
  status: "active" | "paused";
};

type Enrollment = {
  id: string;
  campaignId: string;
  leadReference: string;
  enrolledAt: string;
  nextStepIndex: number;
  nextStepDueAt: string;
  completed: boolean;
  unsubscribed: boolean;
};

const TRIGGER_LABELS = {
  status_change: "Changement de statut",
  conversion: "Conversion",
  abandonment: "Abandon devis",
  manual: "Manuel",
};

export default function DripCampaignsPage() {
  const router = useRouter();
  const [campaigns, setCampaigns] = useState<Campaign[] | null>(null);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Campaign | null>(null);
  const [dirty, setDirty] = useState(false);
  const [busy, setBusy] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const res = await fetch("/api/admin/drip-campaigns", { cache: "no-store" });
    if (res.status === 401) {
      router.replace("/admin/login");
      return;
    }
    if (res.ok) {
      const d = await res.json();
      setCampaigns(d.campaigns ?? []);
      setEnrollments(d.enrollments ?? []);
    }
  }, [router]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!activeId || !campaigns) {
      setDraft(null);
      return;
    }
    const c = campaigns.find((x) => x.id === activeId);
    if (c) {
      setDraft(JSON.parse(JSON.stringify(c)));
      setDirty(false);
    }
  }, [activeId, campaigns]);

  const createNew = async () => {
    setBusy(true);
    try {
      const res = await fetch("/api/admin/drip-campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "Nouvelle séquence",
          trigger: "conversion",
          conditions: {},
          steps: [
            {
              delayDays: 1,
              subject: "Merci pour votre confiance, {{lead.fullName}}",
              body: "Bonjour {{lead.fullName}},\n\nMerci pour votre confiance dans {{brand.name}}.\n\nÀ très bientôt,\nL'équipe",
            },
          ],
        }),
      });
      const d = await res.json();
      if (res.ok) {
        await load();
        setActiveId(d.campaign.id);
      }
    } finally {
      setBusy(false);
    }
  };

  const save = async () => {
    if (!draft || !activeId) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/drip-campaigns/${activeId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(draft),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error ?? "Erreur");
      await load();
      setDirty(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    if (!activeId) return;
    if (!confirm("Supprimer cette séquence ?")) return;
    await fetch(`/api/admin/drip-campaigns/${activeId}`, { method: "DELETE" });
    setActiveId(null);
    await load();
  };

  const processQueue = async () => {
    setProcessing(true);
    try {
      const res = await fetch("/api/admin/drip-campaigns/process", {
        method: "POST",
      });
      if (res.ok) {
        const d = await res.json();
        alert(
          `${d.sent} email${d.sent > 1 ? "s" : ""} envoyé${d.sent > 1 ? "s" : ""} · ${d.failed} échec${d.failed > 1 ? "s" : ""} · ${d.examined} examinés`,
        );
        await load();
      }
    } finally {
      setProcessing(false);
    }
  };

  const update = (patch: Partial<Campaign>) => {
    if (!draft) return;
    setDraft({ ...draft, ...patch });
    setDirty(true);
  };

  const updateStep = (i: number, patch: Partial<Step>) => {
    if (!draft) return;
    update({
      steps: draft.steps.map((s, idx) => (idx === i ? { ...s, ...patch } : s)),
    });
  };

  const addStep = () => {
    if (!draft) return;
    update({
      steps: [
        ...draft.steps,
        {
          delayDays: 3,
          subject: "Nouvelle étape",
          body: "Bonjour {{lead.fullName}}…",
        },
      ],
    });
  };

  const removeStep = (i: number) => {
    if (!draft) return;
    update({ steps: draft.steps.filter((_, idx) => idx !== i) });
  };

  return (
    <div className="min-h-screen bg-cream py-8 lg:py-10">
      <div className="container max-w-7xl">
        <Link
          href="/admin/leads"
          className="inline-flex items-center gap-2 text-sm font-mono uppercase tracking-eyebrow text-graphite hover:text-copper transition-colors mb-6"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Retour pipeline
        </Link>

        <div className="flex items-start justify-between gap-4 flex-wrap mb-6">
          <div>
            <h1 className="font-display text-display-md text-ink">
              Drip campaigns
            </h1>
            <p className="mt-2 text-graphite">
              Séquences emails automatiques déclenchées par événement (conversion,
              abandon, changement statut). Variables :{" "}
              <code className="font-mono text-xs">{`{{lead.fullName}}`}</code>{" "}
              <code className="font-mono text-xs">{`{{brand.name}}`}</code>.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={processQueue}
              disabled={processing}
              className="inline-flex items-center gap-1.5 rounded-full bg-white border border-ink/15 px-4 py-2 text-sm hover:border-copper/40 disabled:opacity-50"
            >
              {processing ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Send className="h-3.5 w-3.5" />
              )}
              Traiter la queue
            </button>
            <button
              onClick={createNew}
              className="inline-flex items-center gap-1.5 rounded-full bg-ink text-cream px-4 py-2 text-sm hover:bg-copper"
            >
              <Plus className="h-3.5 w-3.5" />
              Nouvelle séquence
            </button>
          </div>
        </div>

        <div className="mb-6 text-xs text-muted">
          Enrollments actifs :{" "}
          {enrollments.filter((e) => !e.completed && !e.unsubscribed).length}{" "}
          · Complétés : {enrollments.filter((e) => e.completed).length}
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl border border-ember/40 bg-ember/5 text-sm text-ember">
            {error}
          </div>
        )}

        <div className="grid lg:grid-cols-12 gap-4">
          {/* List */}
          <div className="lg:col-span-4 rounded-2xl border border-ink/10 bg-white shadow-soft overflow-hidden">
            <div className="px-4 py-3 border-b border-ink/8 bg-cream/40 font-mono text-[10px] uppercase tracking-eyebrow text-copper">
              Séquences ({campaigns?.length ?? 0})
            </div>
            {campaigns === null ? (
              <div className="py-8 text-center text-muted">
                <Loader2 className="h-5 w-5 animate-spin mx-auto" />
              </div>
            ) : campaigns.length === 0 ? (
              <div className="py-8 text-center text-muted text-sm">
                Aucune séquence.
              </div>
            ) : (
              <ul>
                {campaigns.map((c) => (
                  <li key={c.id}>
                    <button
                      onClick={() => setActiveId(c.id)}
                      className={cn(
                        "w-full text-left px-4 py-3 border-b border-ink/8 last:border-0 transition-colors",
                        activeId === c.id
                          ? "bg-cream/60"
                          : "hover:bg-cream/30",
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-ink truncate flex-1">
                          {c.name}
                        </span>
                        {c.status === "paused" && (
                          <Pause className="h-3 w-3 text-muted" />
                        )}
                      </div>
                      <div className="text-[11px] text-muted mt-0.5 flex items-center gap-1">
                        <span className="text-copper">
                          {TRIGGER_LABELS[c.trigger]}
                        </span>
                        <span>·</span>
                        <span>
                          {c.steps.length} étape{c.steps.length > 1 ? "s" : ""}
                        </span>
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Editor */}
          <div className="lg:col-span-8 rounded-2xl border border-ink/10 bg-white shadow-soft p-5">
            {!draft ? (
              <div className="h-full grid place-items-center text-muted py-16">
                <div className="text-center">
                  <Mail className="h-12 w-12 mx-auto opacity-20" />
                  <p className="mt-3 text-sm">
                    Sélectionnez ou créez une séquence.
                  </p>
                </div>
              </div>
            ) : (
              <>
                <div className="grid lg:grid-cols-2 gap-2 mb-4">
                  <input
                    value={draft.name}
                    onChange={(e) => update({ name: e.target.value })}
                    className="bg-cream border border-ink/12 rounded-xl px-3 py-2 text-base font-medium focus:border-copper focus:outline-none"
                  />
                  <select
                    value={draft.trigger}
                    onChange={(e) =>
                      update({ trigger: e.target.value as Campaign["trigger"] })
                    }
                    className="bg-cream border border-ink/12 rounded-xl px-3 py-2 text-sm focus:border-copper focus:outline-none"
                  >
                    {(
                      Object.entries(TRIGGER_LABELS) as [
                        Campaign["trigger"],
                        string,
                      ][]
                    ).map(([k, label]) => (
                      <option key={k} value={k}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>
                <input
                  value={draft.description ?? ""}
                  onChange={(e) =>
                    update({ description: e.target.value })
                  }
                  placeholder="Description courte"
                  className="w-full bg-cream border border-ink/12 rounded-xl px-3 py-2 text-sm focus:border-copper focus:outline-none mb-4"
                />
                <div className="font-mono text-[10px] uppercase tracking-eyebrow text-muted mb-2">
                  Étapes
                </div>
                <ul className="grid gap-3 mb-4">
                  {draft.steps.map((s, i) => (
                    <li
                      key={i}
                      className="rounded-xl border border-ink/8 bg-cream/40 p-3"
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <Clock className="h-3 w-3 text-copper" />
                        <span className="font-mono text-[10px] uppercase tracking-eyebrow text-copper">
                          Étape {i + 1} · J+
                        </span>
                        <input
                          type="number"
                          value={s.delayDays}
                          onChange={(e) =>
                            updateStep(i, {
                              delayDays: Number(e.target.value) || 0,
                            })
                          }
                          className="w-16 bg-white border border-ink/12 rounded-md px-2 py-0.5 text-xs font-mono focus:border-copper focus:outline-none"
                        />
                        <span className="text-xs text-muted">j</span>
                        <button
                          onClick={() => removeStep(i)}
                          className="ml-auto h-6 w-6 grid place-items-center rounded-full bg-white border border-ember/30 text-ember hover:bg-ember hover:text-cream"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                      <input
                        value={s.subject}
                        onChange={(e) =>
                          updateStep(i, { subject: e.target.value })
                        }
                        placeholder="Sujet"
                        className="w-full bg-white border border-ink/12 rounded-lg px-3 py-1.5 text-sm focus:border-copper focus:outline-none mb-2"
                      />
                      <textarea
                        rows={3}
                        value={s.body}
                        onChange={(e) =>
                          updateStep(i, { body: e.target.value })
                        }
                        placeholder="Corps du message…"
                        className="w-full bg-white border border-ink/12 rounded-lg px-3 py-2 text-sm font-mono focus:border-copper focus:outline-none resize-none"
                      />
                    </li>
                  ))}
                </ul>
                <button
                  onClick={addStep}
                  className="inline-flex items-center gap-1 text-xs text-copper hover:underline mb-4"
                >
                  <Plus className="h-3 w-3" />
                  Ajouter une étape
                </button>

                <div className="flex items-center gap-2 pt-4 border-t border-ink/8">
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
                    {dirty ? "Enregistrer" : "À jour"}
                  </button>
                  <button
                    onClick={() =>
                      update({
                        status: draft.status === "active" ? "paused" : "active",
                      })
                    }
                    className="inline-flex items-center gap-1.5 rounded-full bg-white border border-ink/15 px-3 py-2 text-sm hover:border-copper/40"
                  >
                    {draft.status === "active" ? (
                      <>
                        <Pause className="h-3.5 w-3.5" />
                        Mettre en pause
                      </>
                    ) : (
                      <>
                        <Play className="h-3.5 w-3.5" />
                        Activer
                      </>
                    )}
                  </button>
                  <button
                    onClick={remove}
                    className="ml-auto inline-flex items-center gap-1.5 rounded-full bg-white border border-ember/30 text-ember px-3 py-2 text-sm hover:bg-ember/10"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Supprimer
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
