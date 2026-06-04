"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Save,
  Trash2,
  Plus,
  Mail,
  Eye,
  Copy,
  Check,
} from "lucide-react";
import type { EmailTemplate } from "@/lib/email-templates-store";
import { TEMPLATE_VARIABLES } from "@/lib/email-templates-store";
import { cn } from "@/lib/utils";

export default function TemplatesPage() {
  const router = useRouter();
  const [templates, setTemplates] = useState<EmailTemplate[] | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [draft, setDraft] = useState<EmailTemplate | null>(null);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  const refresh = async () => {
    const res = await fetch("/api/admin/templates", { cache: "no-store" });
    if (res.status === 401) {
      router.replace("/admin/login");
      return;
    }
    const data = await res.json();
    setTemplates(data.templates ?? []);
    if (!activeId && data.templates?.[0]) {
      setActiveId(data.templates[0].id);
      setDraft(data.templates[0]);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  useEffect(() => {
    if (activeId && templates) {
      const t = templates.find((x) => x.id === activeId);
      if (t) setDraft(t);
    }
  }, [activeId, templates]);

  const save = async () => {
    if (!draft) return;
    setSaving(true);
    try {
      const res = await fetch("/api/admin/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(draft),
      });
      if (res.ok) await refresh();
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: string) => {
    if (!confirm("Supprimer ce template définitivement ?")) return;
    const res = await fetch(`/api/admin/templates?id=${encodeURIComponent(id)}`, {
      method: "DELETE",
    });
    if (res.ok) {
      setActiveId(null);
      setDraft(null);
      await refresh();
    }
  };

  const createNew = () => {
    const id = `tpl-${Date.now()}`;
    const newTpl: EmailTemplate = {
      id,
      name: "Nouveau template",
      subject: "",
      body: "",
    };
    setTemplates((ts) => (ts ? [...ts, newTpl] : [newTpl]));
    setActiveId(id);
    setDraft(newTpl);
  };

  const copyVar = (key: string) => {
    navigator.clipboard.writeText(`{{${key}}}`);
    setCopied(key);
    setTimeout(() => setCopied(null), 1500);
  };

  return (
    <div className="min-h-screen bg-cream py-10 lg:py-14">
      <div className="container max-w-7xl">
        {/* Header */}
        <div className="flex items-start justify-between gap-6 flex-wrap mb-8">
          <div>
            <div className="font-mono text-xs uppercase tracking-eyebrow text-copper">
              Pipeline interne · démo
            </div>
            <h1 className="mt-3 font-display text-display-md text-ink">
              Templates d&apos;email
            </h1>
            <p className="mt-2 text-graphite text-base">
              Modèles éditables avec variables · envoi manuel depuis chaque dossier.
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Link
              href="/admin/leads"
              className="inline-flex items-center gap-2 rounded-full border border-ink/15 px-5 py-2.5 text-base bg-white hover:border-copper/40 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Retour pipeline
            </Link>
            <button
              onClick={createNew}
              className="inline-flex items-center gap-2 rounded-full bg-ink text-cream px-5 py-2.5 text-base hover:bg-copper transition-colors"
            >
              <Plus className="h-4 w-4" />
              Nouveau template
            </button>
          </div>
        </div>

        {/* Grid */}
        <div className="grid lg:grid-cols-12 gap-6">
          {/* Liste */}
          <div className="lg:col-span-4">
            <div className="rounded-2xl border border-ink/10 bg-white shadow-soft p-3">
              {templates === null ? (
                <div className="p-6 text-center text-muted text-sm">Chargement…</div>
              ) : templates.length === 0 ? (
                <div className="p-6 text-center text-muted text-sm">
                  Aucun template. Cliquez « Nouveau template ».
                </div>
              ) : (
                <ul className="grid gap-1">
                  {templates.map((t) => (
                    <li key={t.id}>
                      <button
                        onClick={() => setActiveId(t.id)}
                        className={cn(
                          "w-full text-left px-4 py-3 rounded-xl transition-colors flex items-start gap-3",
                          activeId === t.id
                            ? "bg-ink text-cream"
                            : "bg-cream/50 hover:bg-cream text-ink",
                        )}
                      >
                        <Mail
                          className={cn(
                            "h-4 w-4 mt-0.5 shrink-0",
                            activeId === t.id ? "text-copper" : "text-graphite",
                          )}
                        />
                        <div className="min-w-0 flex-1">
                          <div className="font-medium text-sm truncate">{t.name}</div>
                          <div
                            className={cn(
                              "text-xs truncate",
                              activeId === t.id ? "text-cream/70" : "text-muted",
                            )}
                          >
                            {t.subject || "(sans objet)"}
                          </div>
                        </div>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Variables disponibles */}
            <div className="mt-4 rounded-2xl border border-copper/30 bg-copper/5 p-4">
              <div className="font-mono text-[10px] uppercase tracking-eyebrow text-copper mb-3">
                Variables disponibles
              </div>
              <ul className="grid gap-2">
                {TEMPLATE_VARIABLES.map((v) => (
                  <li
                    key={v.key}
                    className="flex items-center justify-between gap-3 text-xs"
                  >
                    <code className="font-mono text-ink bg-white border border-ink/10 px-2 py-1 rounded">
                      {`{{${v.key}}}`}
                    </code>
                    <button
                      onClick={() => copyVar(v.key)}
                      className="inline-flex items-center gap-1 text-graphite hover:text-copper transition-colors shrink-0"
                      aria-label="Copier"
                    >
                      {copied === v.key ? (
                        <>
                          <Check className="h-3 w-3 text-[#22a06b]" /> Copié
                        </>
                      ) : (
                        <>
                          <Copy className="h-3 w-3" />
                          {v.description}
                        </>
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Éditeur + preview */}
          <div className="lg:col-span-8">
            {draft ? (
              <div className="rounded-2xl border border-ink/10 bg-white shadow-soft p-6 lg:p-8">
                <div className="grid gap-5">
                  <Field
                    label="Nom interne du template"
                    value={draft.name}
                    onChange={(v) => setDraft({ ...draft, name: v })}
                  />
                  <Field
                    label="Objet de l'email"
                    value={draft.subject}
                    onChange={(v) => setDraft({ ...draft, subject: v })}
                    placeholder="Ex : Votre projet {{reference}} · prochaine étape"
                    mono
                  />
                  <div>
                    <label className="font-mono text-[10px] uppercase tracking-eyebrow text-muted mb-2 block">
                      Corps du message
                    </label>
                    <textarea
                      rows={14}
                      value={draft.body}
                      onChange={(e) => setDraft({ ...draft, body: e.target.value })}
                      className="w-full bg-cream border border-ink/12 rounded-xl px-4 py-3 text-sm text-ink font-mono focus:border-copper focus:outline-none focus:ring-2 focus:ring-copper/20 transition-all resize-none"
                      placeholder="Bonjour {{firstName}},..."
                    />
                  </div>
                </div>

                <div className="mt-6 flex items-center justify-between gap-3 flex-wrap">
                  <button
                    onClick={() => remove(draft.id)}
                    className="inline-flex items-center gap-2 text-sm text-graphite hover:text-ember transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                    Supprimer
                  </button>
                  <div className="flex items-center gap-2">
                    {draft.updatedAt && (
                      <span className="text-xs text-muted">
                        Mise à jour · {new Date(draft.updatedAt).toLocaleString("fr-FR")}
                      </span>
                    )}
                    <button
                      onClick={save}
                      disabled={saving}
                      className={cn(
                        "inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium transition-all",
                        saving
                          ? "bg-ink/15 text-ink/40 cursor-not-allowed"
                          : "bg-ink text-cream hover:bg-copper",
                      )}
                    >
                      <Save className="h-4 w-4" />
                      Enregistrer
                    </button>
                  </div>
                </div>

                {/* Preview rendu */}
                <div className="mt-8 pt-6 border-t border-ink/8">
                  <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-eyebrow text-copper mb-3">
                    <Eye className="h-3.5 w-3.5" />
                    Aperçu (variables non substituées)
                  </div>
                  <div className="p-5 rounded-2xl bg-cream border border-ink/8">
                    <div className="text-xs text-muted mb-2">Objet</div>
                    <div className="font-display text-lg text-ink mb-4">
                      {draft.subject || <span className="text-muted">(à remplir)</span>}
                    </div>
                    <div className="text-xs text-muted mb-2">Corps</div>
                    <pre className="font-sans text-sm text-graphite whitespace-pre-wrap leading-relaxed">
                      {draft.body || "(à remplir)"}
                    </pre>
                  </div>
                </div>
              </div>
            ) : (
              <div className="rounded-2xl border border-ink/10 bg-white p-12 text-center">
                <Mail className="h-12 w-12 mx-auto text-ink/15" />
                <p className="mt-4 text-graphite">
                  Sélectionnez un template à gauche, ou créez-en un nouveau.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  mono,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  mono?: boolean;
}) {
  return (
    <div>
      <label className="font-mono text-[10px] uppercase tracking-eyebrow text-muted mb-2 block">
        {label}
      </label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={cn(
          "w-full bg-cream border border-ink/12 rounded-xl px-4 py-2.5 text-sm text-ink focus:border-copper focus:outline-none focus:ring-2 focus:ring-copper/20 transition-all",
          mono && "font-mono",
        )}
      />
    </div>
  );
}
