"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Send,
  Loader2,
  Eye,
  Users,
  CheckCircle2,
  Clock,
  XCircle,
  Mail,
} from "lucide-react";
import { cn } from "@/lib/utils";

type Entry = {
  email: string;
  status: "pending" | "confirmed" | "unsubscribed";
  createdAt: string;
  confirmedAt?: string;
  unsubscribedAt?: string;
  source?: string;
};

type Stats = {
  total: number;
  confirmed: number;
  pending: number;
  unsubscribed: number;
};

export default function AdminNewsletterPage() {
  const router = useRouter();
  const [entries, setEntries] = useState<Entry[] | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [testEmail, setTestEmail] = useState("");
  const [previewMode, setPreviewMode] = useState(false);

  const refresh = async () => {
    const res = await fetch("/api/admin/newsletter", { cache: "no-store" });
    if (res.status === 401) {
      router.replace("/admin/login");
      return;
    }
    const data = await res.json();
    setEntries(data.entries ?? []);
    setStats(data.stats ?? null);
  };

  useEffect(() => {
    refresh();
  }, []);

  const send = async (testMode: boolean) => {
    if (!subject.trim() || !body.trim()) return;
    if (
      !testMode &&
      !confirm(
        `Envoyer cette newsletter à ${stats?.confirmed ?? 0} destinataire(s) confirmé(s) ?`,
      )
    ) {
      return;
    }
    setBusy(true);
    setResult(null);
    setError(null);
    try {
      const res = await fetch("/api/admin/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject,
          body,
          testMode,
          ...(testMode && testEmail ? { testEmail } : {}),
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setResult(
          `Envoi terminé · ${data.sent} succès${data.failed ? ` · ${data.failed} échec(s)` : ""}`,
        );
        if (!testMode) {
          setSubject("");
          setBody("");
        }
      } else {
        setError(data.error ?? "Erreur d'envoi");
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-cream py-10 lg:py-14">
      <div className="container max-w-7xl">
        {/* Header */}
        <div className="flex items-start justify-between gap-6 flex-wrap mb-8">
          <div>
            <Link
              href="/admin/leads"
              className="inline-flex items-center gap-2 text-sm font-mono uppercase tracking-eyebrow text-graphite hover:text-copper transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Retour pipeline
            </Link>
            <h1 className="mt-3 font-display text-display-md text-ink">
              Newsletter
            </h1>
            <p className="mt-2 text-graphite text-base">
              Rédigez et envoyez une newsletter à vos abonnés confirmés.
            </p>
          </div>
          <Link
            href="/admin/campaigns"
            className="inline-flex items-center gap-2 rounded-full border border-ink/15 px-5 py-2.5 text-base bg-white hover:border-copper/40 transition-colors"
          >
            <Clock className="h-4 w-4" />
            Campagnes programmées
          </Link>
        </div>

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
            <StatTile
              label="Total"
              value={stats.total}
              icon={Users}
              accent="copper"
            />
            <StatTile
              label="Confirmés"
              value={stats.confirmed}
              icon={CheckCircle2}
              accent="green"
            />
            <StatTile
              label="En attente"
              value={stats.pending}
              icon={Clock}
              accent="copper"
            />
            <StatTile
              label="Désinscrits"
              value={stats.unsubscribed}
              icon={XCircle}
              accent="muted"
            />
          </div>
        )}

        <div className="grid lg:grid-cols-12 gap-6">
          {/* Composer */}
          <div className="lg:col-span-7">
            <div className="rounded-2xl border border-ink/10 bg-white shadow-soft p-6 lg:p-8">
              <h2 className="font-display text-2xl text-ink mb-5">
                Composer
              </h2>
              <div className="grid gap-4">
                <div>
                  <label className="font-mono text-[10px] uppercase tracking-eyebrow text-muted mb-2 block">
                    Objet
                  </label>
                  <input
                    type="text"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="Klimabonus 2026 · les changements à retenir"
                    className="w-full bg-cream border border-ink/12 rounded-xl px-4 py-2.5 text-sm text-ink focus:border-copper focus:outline-none focus:ring-2 focus:ring-copper/20"
                  />
                </div>
                <div>
                  <label className="font-mono text-[10px] uppercase tracking-eyebrow text-muted mb-2 block">
                    Corps du message (texte simple, paragraphes séparés par une
                    ligne vide)
                  </label>
                  <textarea
                    rows={14}
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    placeholder="Bonjour à toutes et tous,&#10;&#10;Ce mois-ci, nous revenons sur..."
                    className="w-full bg-cream border border-ink/12 rounded-xl px-4 py-3 text-sm text-ink focus:border-copper focus:outline-none focus:ring-2 focus:ring-copper/20 resize-none"
                  />
                </div>
              </div>

              {/* Test send */}
              <div className="mt-6 p-4 rounded-xl bg-cream border border-ink/8">
                <div className="font-mono text-[10px] uppercase tracking-eyebrow text-copper mb-2">
                  Envoi test
                </div>
                <div className="flex gap-2 flex-wrap">
                  <input
                    type="email"
                    value={testEmail}
                    onChange={(e) => setTestEmail(e.target.value)}
                    placeholder="vous@email.lu"
                    className="flex-1 min-w-[200px] bg-white border border-ink/12 rounded-xl px-4 py-2 text-sm text-ink focus:border-copper focus:outline-none"
                  />
                  <button
                    onClick={() => send(true)}
                    disabled={busy || !subject.trim() || !body.trim() || !testEmail.trim()}
                    className="inline-flex items-center gap-2 rounded-full border border-ink/15 px-4 py-2 text-sm text-ink hover:border-copper/40 hover:text-copper transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
                    M&apos;envoyer un test
                  </button>
                </div>
              </div>

              {/* Result */}
              {result && (
                <div className="mt-5 p-3 rounded-xl border border-[#22a06b]/40 bg-[#22a06b]/5 text-sm text-ink">
                  {result}
                </div>
              )}
              {error && (
                <div className="mt-5 p-3 rounded-xl border border-ember/40 bg-ember/5 text-sm text-ember">
                  {error}
                </div>
              )}

              <div className="mt-6 pt-6 border-t border-ink/8 flex items-center justify-between gap-3">
                <button
                  onClick={() => setPreviewMode((v) => !v)}
                  className="inline-flex items-center gap-2 text-sm text-graphite hover:text-ink"
                >
                  <Eye className="h-4 w-4" />
                  {previewMode ? "Masquer l'aperçu" : "Afficher l'aperçu"}
                </button>
                <button
                  onClick={() => send(false)}
                  disabled={
                    busy ||
                    !subject.trim() ||
                    !body.trim() ||
                    !stats ||
                    stats.confirmed === 0
                  }
                  className={cn(
                    "inline-flex items-center gap-2 rounded-full bg-ink text-cream px-5 py-2.5 text-sm font-medium transition-colors",
                    busy ||
                      !subject.trim() ||
                      !body.trim() ||
                      !stats ||
                      stats.confirmed === 0
                      ? "opacity-40 cursor-not-allowed"
                      : "hover:bg-copper",
                  )}
                >
                  {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  Envoyer aux {stats?.confirmed ?? 0} abonnés
                </button>
              </div>

              {/* Preview */}
              {previewMode && (
                <div className="mt-6 pt-6 border-t border-ink/8">
                  <div className="font-mono text-[10px] uppercase tracking-eyebrow text-copper mb-3">
                    Aperçu de l&apos;email
                  </div>
                  <div className="rounded-2xl bg-charcoal text-cream p-5">
                    <div className="font-mono text-[10px] uppercase tracking-eyebrow text-copper">
                      Chauffage Artisanal · Luxembourg
                    </div>
                    <div className="mt-2 font-display text-xl">
                      {subject || "(sans objet)"}
                    </div>
                  </div>
                  <div className="mt-3 p-5 rounded-2xl bg-white border border-ink/10">
                    <pre className="font-sans text-sm text-graphite whitespace-pre-wrap leading-relaxed">
                      {body || "(corps vide)"}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Liste abonnés */}
          <div className="lg:col-span-5">
            <div className="rounded-2xl border border-ink/10 bg-white shadow-soft p-5 lg:p-6">
              <h2 className="font-display text-2xl text-ink mb-4">Abonnés</h2>
              {entries === null ? (
                <div className="py-6 text-center text-muted text-sm">Chargement…</div>
              ) : entries.length === 0 ? (
                <div className="py-6 text-center text-muted text-sm">
                  Pas encore d&apos;abonné.
                </div>
              ) : (
                <ul className="grid gap-2">
                  {entries.map((e) => (
                    <li
                      key={e.email}
                      className="flex items-center justify-between gap-3 p-3 rounded-xl bg-cream/50 border border-ink/8"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="text-sm text-ink truncate">{e.email}</div>
                        <div className="text-xs text-muted">
                          {e.source ?? "—"} ·{" "}
                          {new Date(e.createdAt).toLocaleDateString("fr-FR")}
                        </div>
                      </div>
                      <StatusChip status={e.status} />
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatTile({
  label,
  value,
  icon: Icon,
  accent,
}: {
  label: string;
  value: number;
  icon: typeof Users;
  accent: "copper" | "green" | "muted";
}) {
  const accentClass =
    accent === "green"
      ? "bg-[#22a06b]/10 border-[#22a06b]/30 text-[#22a06b]"
      : accent === "muted"
      ? "bg-ink/5 border-ink/15 text-muted"
      : "bg-copper/10 border-copper/30 text-copper";
  return (
    <div className="p-4 rounded-2xl bg-white border border-ink/10 shadow-soft">
      <div className="flex items-center gap-3">
        <span className={cn("h-10 w-10 rounded-full grid place-items-center border", accentClass)}>
          <Icon className="h-4 w-4" />
        </span>
        <div>
          <div className="font-mono text-[10px] uppercase tracking-eyebrow text-muted">
            {label}
          </div>
          <div className="font-display text-2xl text-ink tabular-nums">{value}</div>
        </div>
      </div>
    </div>
  );
}

function StatusChip({ status }: { status: Entry["status"] }) {
  const cfg =
    status === "confirmed"
      ? { color: "#22a06b", label: "Confirmé" }
      : status === "pending"
      ? { color: "#b86a36", label: "En attente" }
      : { color: "#8b847a", label: "Désinscrit" };
  return (
    <span
      className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-mono uppercase tracking-eyebrow border"
      style={{
        background: `${cfg.color}15`,
        borderColor: `${cfg.color}55`,
        color: cfg.color,
      }}
    >
      {cfg.label}
    </span>
  );
}
