"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Plus,
  Trash2,
  Send,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Calendar,
  Loader2,
} from "lucide-react";
import type { Campaign } from "@/lib/scheduled-campaigns";
import { cn } from "@/lib/utils";

const STATUS_STYLE: Record<Campaign["status"], { color: string; label: string; icon: typeof Clock }> = {
  scheduled: { color: "#b86a36", label: "Programmée", icon: Clock },
  sending: { color: "#6ba3c5", label: "En cours", icon: Loader2 },
  sent: { color: "#22a06b", label: "Envoyée", icon: CheckCircle2 },
  cancelled: { color: "#8b847a", label: "Annulée", icon: XCircle },
  failed: { color: "#dc5a28", label: "Échouée", icon: AlertCircle },
};

export default function CampaignsPage() {
  const router = useRouter();
  const [campaigns, setCampaigns] = useState<Campaign[] | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraft] = useState({
    subject: "",
    body: "",
    scheduledAt: defaultScheduledAt(),
  });

  const refresh = async () => {
    const res = await fetch("/api/admin/campaigns", { cache: "no-store" });
    if (res.status === 401) {
      router.replace("/admin/login");
      return;
    }
    const data = await res.json();
    setCampaigns(data.campaigns ?? []);
  };

  useEffect(() => {
    refresh();
    // Refresh régulièrement pour voir l'état (le processeur tourne au lazy mode)
    const i = setInterval(refresh, 15_000);
    return () => clearInterval(i);
  }, []);

  const create = async () => {
    setBusy(true);
    setError(null);
    try {
      const id = `camp-${Date.now()}`;
      const res = await fetch("/api/admin/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id,
          subject: draft.subject,
          body: draft.body,
          scheduledAt: new Date(draft.scheduledAt).toISOString(),
          status: "scheduled",
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setShowForm(false);
        setDraft({ subject: "", body: "", scheduledAt: defaultScheduledAt() });
        await refresh();
      } else {
        setError(data.error ?? "Erreur");
      }
    } finally {
      setBusy(false);
    }
  };

  const remove = async (id: string) => {
    if (!confirm("Supprimer cette campagne ?")) return;
    const res = await fetch(`/api/admin/campaigns?id=${encodeURIComponent(id)}`, {
      method: "DELETE",
    });
    if (res.ok) await refresh();
  };

  return (
    <div className="min-h-screen bg-cream py-10 lg:py-14">
      <div className="container max-w-5xl">
        <Link
          href="/admin/newsletter"
          className="inline-flex items-center gap-2 text-sm font-mono uppercase tracking-eyebrow text-graphite hover:text-copper transition-colors mb-6"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Retour newsletter
        </Link>

        <div className="flex items-start justify-between gap-4 mb-8 flex-wrap">
          <div>
            <h1 className="font-display text-display-md text-ink">
              Campagnes programmées
            </h1>
            <p className="mt-2 text-graphite">
              Planifier l&apos;envoi d&apos;une newsletter à une date et heure précise.
            </p>
          </div>
          <button
            onClick={() => setShowForm((v) => !v)}
            className="inline-flex items-center gap-2 rounded-full bg-ink text-cream px-5 py-2.5 text-sm font-medium hover:bg-copper transition-colors"
          >
            <Plus className="h-4 w-4" />
            {showForm ? "Annuler" : "Nouvelle campagne"}
          </button>
        </div>

        {showForm && (
          <div className="mb-6 rounded-2xl border border-copper/30 bg-copper/5 p-6 lg:p-8">
            <div className="font-mono text-[10px] uppercase tracking-eyebrow text-copper mb-4">
              Nouvelle campagne
            </div>
            <div className="grid gap-4">
              <Field label="Objet">
                <input
                  type="text"
                  value={draft.subject}
                  onChange={(e) => setDraft({ ...draft, subject: e.target.value })}
                  placeholder="Klimabonus 2026 · les nouveautés"
                  className="w-full bg-white border border-ink/12 rounded-xl px-4 py-2.5 text-sm text-ink focus:border-copper focus:outline-none"
                />
              </Field>
              <Field label="Corps">
                <textarea
                  rows={10}
                  value={draft.body}
                  onChange={(e) => setDraft({ ...draft, body: e.target.value })}
                  placeholder="Bonjour à toutes et tous,..."
                  className="w-full bg-white border border-ink/12 rounded-xl px-4 py-2.5 text-sm text-ink focus:border-copper focus:outline-none resize-none"
                />
              </Field>
              <Field label="Date et heure d'envoi">
                <input
                  type="datetime-local"
                  value={draft.scheduledAt}
                  onChange={(e) => setDraft({ ...draft, scheduledAt: e.target.value })}
                  className="bg-white border border-ink/12 rounded-xl px-4 py-2.5 text-sm text-ink focus:border-copper focus:outline-none"
                />
              </Field>
              {error && (
                <div className="p-3 rounded-xl border border-ember/40 bg-white text-sm text-ember">
                  {error}
                </div>
              )}
              <div className="flex items-center justify-end gap-3">
                <button
                  onClick={() => setShowForm(false)}
                  className="text-sm text-graphite hover:text-ink"
                >
                  Annuler
                </button>
                <button
                  onClick={create}
                  disabled={busy || !draft.subject.trim() || !draft.body.trim()}
                  className={cn(
                    "inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium transition-colors",
                    busy || !draft.subject.trim() || !draft.body.trim()
                      ? "bg-ink/15 text-ink/40 cursor-not-allowed"
                      : "bg-ink text-cream hover:bg-copper",
                  )}
                >
                  {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Calendar className="h-4 w-4" />}
                  Programmer
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Liste */}
        <div className="rounded-2xl border border-ink/10 bg-white shadow-soft overflow-hidden">
          {campaigns === null ? (
            <div className="py-12 text-center text-muted">Chargement…</div>
          ) : campaigns.length === 0 ? (
            <div className="py-12 text-center">
              <Send className="h-10 w-10 mx-auto text-ink/15" />
              <p className="mt-3 text-graphite">Aucune campagne programmée pour le moment.</p>
            </div>
          ) : (
            <ul>
              {campaigns
                .sort((a, b) => new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime())
                .map((c) => {
                  const st = STATUS_STYLE[c.status];
                  const isOverdue =
                    c.status === "scheduled" && new Date(c.scheduledAt).getTime() < Date.now();
                  return (
                    <li
                      key={c.id}
                      className="border-b border-ink/8 last:border-0 p-5 flex items-start gap-4 hover:bg-cream/40 transition-colors"
                    >
                      <span
                        className="h-10 w-10 rounded-full grid place-items-center border shrink-0"
                        style={{ background: `${st.color}15`, borderColor: `${st.color}55`, color: st.color }}
                      >
                        <st.icon
                          className={cn(
                            "h-4 w-4",
                            c.status === "sending" && "animate-spin",
                          )}
                        />
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span
                            className="font-mono text-[10px] uppercase tracking-eyebrow px-2 py-0.5 rounded-full"
                            style={{
                              color: st.color,
                              background: `${st.color}15`,
                              border: `1px solid ${st.color}55`,
                            }}
                          >
                            {st.label}
                          </span>
                          {isOverdue && (
                            <span className="font-mono text-[10px] uppercase tracking-eyebrow px-2 py-0.5 rounded-full text-ember bg-ember/10 border border-ember/40">
                              En retard
                            </span>
                          )}
                        </div>
                        <div className="mt-1 font-display text-lg text-ink truncate">
                          {c.subject}
                        </div>
                        <div className="mt-1 text-xs text-muted">
                          {c.status === "sent" && c.sentCount !== undefined
                            ? `Envoyée à ${c.sentCount} abonné(s) le ${new Date(c.sentAt ?? "").toLocaleString("fr-FR")}`
                            : `Planifiée pour le ${new Date(c.scheduledAt).toLocaleString("fr-FR")}`}
                        </div>
                        {c.error && (
                          <div className="mt-2 text-xs text-ember">{c.error}</div>
                        )}
                      </div>
                      {c.status === "scheduled" && (
                        <button
                          onClick={() => remove(c.id)}
                          className="h-9 w-9 grid place-items-center rounded-full bg-cream border border-ink/10 text-graphite hover:bg-ember hover:text-cream hover:border-ember transition-colors shrink-0"
                          title="Supprimer"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </li>
                  );
                })}
            </ul>
          )}
        </div>

        <p className="mt-4 text-xs text-muted">
          Le processeur de campagnes s&apos;exécute à chaque chargement de cette page
          (mode démo). En production, on brancherait un cron job pour
          déclenchement précis.
        </p>
      </div>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <div className="font-mono text-[10px] uppercase tracking-eyebrow text-muted mb-2">
        {label}
      </div>
      {children}
    </label>
  );
}

function defaultScheduledAt(): string {
  const d = new Date(Date.now() + 60 * 60 * 1000); // +1h
  d.setSeconds(0, 0);
  // datetime-local format YYYY-MM-DDTHH:mm
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
