"use client";

/**
 * Admin /admin/jobs — gestion des offres d'emploi.
 *
 * Liste les offres + éditeur inline (modale) + suppression.
 * Les candidatures par offre sont consultables via /admin/candidates?jobId=xxx
 * (à venir Phase ultérieure).
 */

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Briefcase,
  Plus,
  Edit2,
  Trash2,
  Eye,
  EyeOff,
  ExternalLink,
  Loader2,
  X as XIcon,
  Save,
  AlertCircle,
} from "lucide-react";
import {
  AdminPageShell,
  KpiCard,
  SectionCard,
  EmptyState,
  CenteredLoader,
} from "@/components/admin/ui-kit";
import type {
  JobRecord,
  ContractType,
  WorkTime,
  JobStatus,
} from "@/lib/jobs-store";

const CONTRACT_TYPES: { value: ContractType; label: string }[] = [
  { value: "CDI", label: "CDI" },
  { value: "CDD", label: "CDD" },
  { value: "interim", label: "Intérim" },
  { value: "alternance", label: "Alternance" },
  { value: "stage", label: "Stage" },
  { value: "freelance", label: "Indépendant" },
];

const STATUS_LABEL: Record<JobStatus, string> = {
  open: "Publiée",
  closed: "Fermée",
  draft: "Brouillon",
};

const STATUS_COLOR: Record<JobStatus, string> = {
  open: "#22a06b",
  closed: "#8b847a",
  draft: "#b86a36",
};

function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 80);
}

type EditorState = {
  open: boolean;
  job: Partial<JobRecord> | null;
};

export default function AdminJobsPage() {
  const router = useRouter();
  const [jobs, setJobs] = useState<JobRecord[] | null>(null);
  const [editor, setEditor] = useState<EditorState>({ open: false, job: null });

  const load = useCallback(async () => {
    const res = await fetch("/api/admin/jobs", { cache: "no-store" });
    if (res.status === 401) {
      router.replace("/admin/login");
      return;
    }
    if (res.ok) {
      const d = await res.json();
      setJobs(d.jobs ?? []);
    } else {
      setJobs([]);
    }
  }, [router]);

  useEffect(() => {
    load();
  }, [load]);

  const openNew = () => {
    setEditor({
      open: true,
      job: {
        slug: "",
        title: "",
        contractType: "CDI",
        workTime: "plein",
        description: "",
        benefits: [],
        status: "open",
      },
    });
  };

  const openEdit = (job: JobRecord) => {
    setEditor({ open: true, job: { ...job } });
  };

  const close = () => setEditor({ open: false, job: null });

  const remove = async (job: JobRecord) => {
    if (!confirm(`Supprimer l'offre « ${job.title} » ?`)) return;
    const res = await fetch(`/api/admin/jobs/${job.id}`, { method: "DELETE" });
    if (res.ok) await load();
  };

  const toggleStatus = async (job: JobRecord) => {
    const next: JobStatus = job.status === "open" ? "closed" : "open";
    const res = await fetch(`/api/admin/jobs/${job.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: next }),
    });
    if (res.ok) await load();
  };

  const stats = {
    total: jobs?.length ?? 0,
    open: jobs?.filter((j) => j.status === "open").length ?? 0,
    closed: jobs?.filter((j) => j.status === "closed").length ?? 0,
    draft: jobs?.filter((j) => j.status === "draft").length ?? 0,
  };

  return (
    <AdminPageShell
      title="Offres d'emploi"
      description="Gestion des offres publiées sur /recrutement. Création, modification, ouverture/fermeture."
      actions={
        <button
          onClick={openNew}
          className="inline-flex items-center gap-2 rounded-full bg-ink text-cream px-5 py-2.5 text-sm font-medium hover:bg-copper transition-colors"
        >
          <Plus className="h-4 w-4" />
          Nouvelle offre
        </button>
      }
    >
      {/* KPI */}
      <div className="grid sm:grid-cols-4 gap-4 mb-6">
        <KpiCard label="Total" value={String(stats.total)} />
        <KpiCard label="Publiées" value={String(stats.open)} color="#22a06b" />
        <KpiCard label="Fermées" value={String(stats.closed)} />
        <KpiCard label="Brouillons" value={String(stats.draft)} color="#b86a36" />
      </div>

      <SectionCard icon={Briefcase} eyebrow="Liste des offres">
        {jobs === null ? (
          <CenteredLoader />
        ) : jobs.length === 0 ? (
          <EmptyState
            icon={Briefcase}
            title="Aucune offre publiée"
            body="Créez votre première offre pour la rendre visible sur la page Recrutement — cliquez le bouton « Nouvelle offre » en haut à droite."
          />
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-cream/30 text-left text-graphite text-xs">
                <th className="px-5 py-2.5 font-mono uppercase tracking-eyebrow">Titre</th>
                <th className="px-3 py-2.5 font-mono uppercase tracking-eyebrow">Contrat</th>
                <th className="px-3 py-2.5 font-mono uppercase tracking-eyebrow">Salaire</th>
                <th className="px-3 py-2.5 font-mono uppercase tracking-eyebrow">Publiée</th>
                <th className="px-3 py-2.5 font-mono uppercase tracking-eyebrow">Statut</th>
                <th className="px-5 py-2.5 font-mono uppercase tracking-eyebrow text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink/5">
              {jobs.map((j) => (
                <tr key={j.id} className="hover:bg-cream/30">
                  <td className="px-5 py-3">
                    <div className="text-ink font-medium">{j.title}</div>
                    <div className="font-mono text-[10px] text-muted">/{j.slug}</div>
                  </td>
                  <td className="px-3 py-3 text-xs text-graphite">
                    {CONTRACT_TYPES.find((c) => c.value === j.contractType)?.label}
                    <div className="text-[10px] text-muted">
                      {j.workTime === "plein" ? "Temps plein" : "Temps partiel"}
                    </div>
                  </td>
                  <td className="px-3 py-3 font-mono text-xs text-graphite">
                    {j.salaryMin || j.salaryMax
                      ? `${j.salaryMin ?? "?"} – ${j.salaryMax ?? "?"} €`
                      : "—"}
                  </td>
                  <td className="px-3 py-3 text-xs text-graphite">
                    {new Date(j.publishedAt).toLocaleDateString("fr-FR", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}
                  </td>
                  <td className="px-3 py-3">
                    <button
                      onClick={() => toggleStatus(j)}
                      className="font-mono text-[10px] uppercase tracking-eyebrow px-2 py-0.5 rounded-full inline-flex items-center gap-1 hover:opacity-80"
                      style={{
                        background: `${STATUS_COLOR[j.status]}15`,
                        color: STATUS_COLOR[j.status],
                      }}
                    >
                      {j.status === "open" ? (
                        <Eye className="h-2.5 w-2.5" />
                      ) : (
                        <EyeOff className="h-2.5 w-2.5" />
                      )}
                      {STATUS_LABEL[j.status]}
                    </button>
                  </td>
                  <td className="px-5 py-3 text-right">
                    <div className="inline-flex items-center gap-1">
                      <Link
                        href={`/recrutement#${j.slug}`}
                        target="_blank"
                        className="h-7 w-7 grid place-items-center rounded-full text-graphite hover:text-copper hover:bg-cream"
                        title="Voir en ligne"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                      </Link>
                      <button
                        onClick={() => openEdit(j)}
                        className="h-7 w-7 grid place-items-center rounded-full text-graphite hover:text-copper hover:bg-cream"
                        title="Éditer"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => remove(j)}
                        className="h-7 w-7 grid place-items-center rounded-full text-graphite hover:text-ember hover:bg-cream"
                        title="Supprimer"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </SectionCard>

      {/* Éditeur modal */}
      {editor.open && editor.job && (
        <JobEditor
          job={editor.job}
          onClose={close}
          onSaved={async () => {
            await load();
            close();
          }}
        />
      )}
    </AdminPageShell>
  );
}

/* ─────────────── Éditeur modal ─────────────── */

function JobEditor({
  job,
  onClose,
  onSaved,
}: {
  job: Partial<JobRecord>;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState<Partial<JobRecord>>(job);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [benefitDraft, setBenefitDraft] = useState("");
  const isEdit = !!job.id;

  const save = async () => {
    setSaving(true);
    setError(null);
    try {
      const payload = {
        slug: form.slug,
        title: form.title,
        contractType: form.contractType,
        workTime: form.workTime,
        salaryMin: form.salaryMin,
        salaryMax: form.salaryMax,
        description: form.description,
        benefits: form.benefits ?? [],
        status: form.status,
      };
      const res = isEdit
        ? await fetch(`/api/admin/jobs/${job.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          })
        : await fetch("/api/admin/jobs", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) throw new Error(data.error ?? `HTTP ${res.status}`);
      onSaved();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur inconnue.");
    } finally {
      setSaving(false);
    }
  };

  const addBenefit = () => {
    const v = benefitDraft.trim();
    if (!v) return;
    setForm({ ...form, benefits: [...(form.benefits ?? []), v] });
    setBenefitDraft("");
  };

  const removeBenefit = (idx: number) => {
    const next = [...(form.benefits ?? [])];
    next.splice(idx, 1);
    setForm({ ...form, benefits: next });
  };

  return (
    <div className="fixed inset-0 z-[100] bg-ink/30 backdrop-blur-sm grid place-items-center px-4 py-8 overflow-y-auto">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-lift border border-ink/10 overflow-hidden">
        <div className="px-5 py-4 border-b border-ink/8 flex items-center justify-between bg-cream/30">
          <div>
            <div className="font-mono text-[10px] uppercase tracking-eyebrow text-copper">
              {isEdit ? "Éditer l'offre" : "Nouvelle offre"}
            </div>
            <div className="font-display text-lg text-ink">
              {form.title || "Sans titre"}
            </div>
          </div>
          <button
            onClick={onClose}
            className="h-8 w-8 grid place-items-center rounded-full bg-white border border-ink/10 hover:bg-cream"
          >
            <XIcon className="h-4 w-4 text-graphite" />
          </button>
        </div>

        <div className="px-5 py-5 grid gap-4 max-h-[70vh] overflow-y-auto">
          <Field label="Titre du poste *">
            <input
              type="text"
              value={form.title ?? ""}
              onChange={(e) => {
                const title = e.target.value;
                setForm({
                  ...form,
                  title,
                  slug: form.slug || slugify(title),
                });
              }}
              placeholder="Ex: Chauffagiste confirmé — CDI"
              className="w-full bg-cream border border-ink/12 rounded-xl px-4 py-2.5 text-ink focus:border-copper focus:outline-none"
            />
          </Field>

          <Field label="URL (slug) *" hint="Lettres minuscules, chiffres, tirets uniquement">
            <input
              type="text"
              value={form.slug ?? ""}
              onChange={(e) => setForm({ ...form, slug: slugify(e.target.value) })}
              placeholder="chauffagiste-confirme-cdi"
              className="w-full bg-cream border border-ink/12 rounded-xl px-4 py-2.5 text-ink font-mono text-sm focus:border-copper focus:outline-none"
            />
          </Field>

          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Type de contrat *">
              <select
                value={form.contractType ?? "CDI"}
                onChange={(e) =>
                  setForm({ ...form, contractType: e.target.value as ContractType })
                }
                className="w-full bg-cream border border-ink/12 rounded-xl px-4 py-2.5 text-ink focus:border-copper focus:outline-none"
              >
                {CONTRACT_TYPES.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Temps de travail *">
              <select
                value={form.workTime ?? "plein"}
                onChange={(e) =>
                  setForm({ ...form, workTime: e.target.value as WorkTime })
                }
                className="w-full bg-cream border border-ink/12 rounded-xl px-4 py-2.5 text-ink focus:border-copper focus:outline-none"
              >
                <option value="plein">Temps plein</option>
                <option value="partiel">Temps partiel</option>
              </select>
            </Field>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Salaire min (€/mois)">
              <input
                type="number"
                value={form.salaryMin ?? ""}
                onChange={(e) =>
                  setForm({
                    ...form,
                    salaryMin: e.target.value ? Number(e.target.value) : undefined,
                  })
                }
                className="w-full bg-cream border border-ink/12 rounded-xl px-4 py-2.5 text-ink focus:border-copper focus:outline-none"
              />
            </Field>
            <Field label="Salaire max (€/mois)">
              <input
                type="number"
                value={form.salaryMax ?? ""}
                onChange={(e) =>
                  setForm({
                    ...form,
                    salaryMax: e.target.value ? Number(e.target.value) : undefined,
                  })
                }
                className="w-full bg-cream border border-ink/12 rounded-xl px-4 py-2.5 text-ink focus:border-copper focus:outline-none"
              />
            </Field>
          </div>

          <Field label="Description *" hint="Markdown supporté pour le rendu public">
            <textarea
              rows={10}
              value={form.description ?? ""}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Mission, profil recherché, ce que vous offrez…"
              className="w-full bg-cream border border-ink/12 rounded-xl px-4 py-2.5 text-ink focus:border-copper focus:outline-none resize-none font-mono text-sm"
            />
          </Field>

          <Field label="Avantages (badges)">
            <div className="flex flex-wrap gap-2 mb-2">
              {(form.benefits ?? []).map((b, i) => (
                <span
                  key={i}
                  className="inline-flex items-center gap-1.5 text-xs text-graphite bg-cream border border-ink/12 px-2.5 py-1 rounded-full"
                >
                  ✓ {b}
                  <button
                    onClick={() => removeBenefit(i)}
                    className="text-muted hover:text-ember"
                  >
                    <XIcon className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={benefitDraft}
                onChange={(e) => setBenefitDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addBenefit();
                  }
                }}
                placeholder="Ex: Véhicule de service"
                className="flex-1 bg-cream border border-ink/12 rounded-xl px-4 py-2 text-sm text-ink focus:border-copper focus:outline-none"
              />
              <button
                type="button"
                onClick={addBenefit}
                className="px-3 py-2 rounded-xl bg-ink/8 hover:bg-ink/15 text-sm text-ink"
              >
                Ajouter
              </button>
            </div>
          </Field>

          <Field label="Statut">
            <select
              value={form.status ?? "open"}
              onChange={(e) =>
                setForm({ ...form, status: e.target.value as JobStatus })
              }
              className="w-full bg-cream border border-ink/12 rounded-xl px-4 py-2.5 text-ink focus:border-copper focus:outline-none"
            >
              <option value="open">Publiée (visible)</option>
              <option value="draft">Brouillon (non publiée)</option>
              <option value="closed">Fermée (archivée)</option>
            </select>
          </Field>

          {error && (
            <div className="flex items-start gap-2 p-3 rounded-xl border border-ember/30 bg-ember/8 text-sm text-ink">
              <AlertCircle className="h-4 w-4 text-ember shrink-0 mt-0.5" />
              {error}
            </div>
          )}
        </div>

        <div className="px-5 py-4 border-t border-ink/8 bg-cream/30 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            disabled={saving}
            className="px-4 py-2 rounded-full text-sm text-graphite hover:text-ink"
          >
            Annuler
          </button>
          <button
            onClick={save}
            disabled={saving || !form.title || !form.slug || !form.description}
            className="inline-flex items-center gap-2 rounded-full bg-ink text-cream px-5 py-2.5 text-sm font-medium hover:bg-copper transition-colors disabled:opacity-40"
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            Enregistrer
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block font-mono text-[10px] uppercase tracking-eyebrow text-muted mb-1.5">
        {label}
      </label>
      {children}
      {hint && <div className="mt-1 text-[11px] text-muted">{hint}</div>}
    </div>
  );
}
