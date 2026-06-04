"use client";

/**
 * Carnet des techniciens — compétences, zone de base, taux horaire.
 */

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Plus,
  Loader2,
  Trash2,
  User,
  Check,
  X as XIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

type Skill =
  | "chaudiere"
  | "pac"
  | "clim"
  | "sanitaire"
  | "enr"
  | "vmc"
  | "depannage";

const SKILL_LABELS: Record<Skill, string> = {
  chaudiere: "Chaudière",
  pac: "PAC",
  clim: "Climatisation",
  sanitaire: "Sanitaire",
  enr: "ENR",
  vmc: "VMC",
  depannage: "Dépannage",
};

type Profile = {
  id: string;
  email: string;
  displayName: string;
  skills: Skill[];
  homeBase: string;
  maxKmRadius?: number;
  hourlyRateEur?: number;
  notes?: string;
  isActive: boolean;
};

export default function TechProfilesPage() {
  const router = useRouter();
  const [profiles, setProfiles] = useState<Profile[] | null>(null);
  const [creating, setCreating] = useState(false);
  const [draft, setDraft] = useState<Partial<Profile>>({
    skills: [],
    isActive: true,
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const res = await fetch("/api/admin/tech-profiles", { cache: "no-store" });
    if (res.status === 401) {
      router.replace("/admin/login");
      return;
    }
    if (res.ok) {
      const d = await res.json();
      setProfiles(d.profiles ?? []);
    }
  }, [router]);

  useEffect(() => {
    load();
  }, [load]);

  const save = async () => {
    if (!draft.email?.trim() || !draft.displayName?.trim() || !draft.homeBase?.trim()) {
      setError("Email, nom et commune base requis");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/tech-profiles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...draft,
          skills: draft.skills ?? [],
        }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error ?? "Erreur");
      setCreating(false);
      setDraft({ skills: [], isActive: true });
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setBusy(false);
    }
  };

  const toggleSkill = (s: Skill) => {
    const current = draft.skills ?? [];
    setDraft({
      ...draft,
      skills: current.includes(s)
        ? current.filter((x) => x !== s)
        : [...current, s],
    });
  };

  const remove = async (id: string, name: string) => {
    if (!confirm(`Supprimer ${name} ?`)) return;
    await fetch(`/api/admin/tech-profiles/${id}`, { method: "DELETE" });
    await load();
  };

  const startEdit = (p: Profile) => {
    setDraft(p);
    setCreating(true);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-cream py-10 lg:py-14">
      <div className="container max-w-4xl">
        <Link
          href="/admin/leads"
          className="inline-flex items-center gap-2 text-sm font-mono uppercase tracking-eyebrow text-graphite hover:text-copper transition-colors mb-6"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Retour pipeline
        </Link>

        <div className="flex items-start justify-between gap-4 flex-wrap mb-8">
          <div>
            <h1 className="font-display text-display-md text-ink">
              Techniciens
            </h1>
            <p className="mt-2 text-graphite">
              Compétences, zone d&apos;action et disponibilité. Le routing
              intelligent (suggéré sur fiche lead) utilise ces données.
            </p>
          </div>
          {!creating && (
            <button
              onClick={() => {
                setCreating(true);
                setDraft({ skills: [], isActive: true });
              }}
              className="inline-flex items-center gap-2 rounded-full bg-ink text-cream px-5 py-2.5 text-sm hover:bg-copper"
            >
              <Plus className="h-4 w-4" />
              Nouveau technicien
            </button>
          )}
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl border border-ember/40 bg-ember/5 text-sm text-ember">
            {error}
          </div>
        )}

        {creating && (
          <div className="mb-6 rounded-2xl border border-copper/40 bg-white shadow-soft p-5">
            <div className="grid lg:grid-cols-2 gap-2">
              <input
                value={draft.email ?? ""}
                onChange={(e) => setDraft({ ...draft, email: e.target.value })}
                placeholder="Email"
                type="email"
                className="bg-cream border border-ink/12 rounded-xl px-3 py-2 text-sm focus:border-copper focus:outline-none"
              />
              <input
                value={draft.displayName ?? ""}
                onChange={(e) =>
                  setDraft({ ...draft, displayName: e.target.value })
                }
                placeholder="Nom affiché"
                className="bg-cream border border-ink/12 rounded-xl px-3 py-2 text-sm focus:border-copper focus:outline-none"
              />
              <input
                value={draft.homeBase ?? ""}
                onChange={(e) =>
                  setDraft({ ...draft, homeBase: e.target.value })
                }
                placeholder="Commune de base (ex : Esch-sur-Alzette)"
                className="bg-cream border border-ink/12 rounded-xl px-3 py-2 text-sm focus:border-copper focus:outline-none"
              />
              <input
                type="number"
                value={draft.maxKmRadius ?? ""}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    maxKmRadius: e.target.value
                      ? Number(e.target.value)
                      : undefined,
                  })
                }
                placeholder="Rayon préféré (km)"
                className="bg-cream border border-ink/12 rounded-xl px-3 py-2 text-sm font-mono focus:border-copper focus:outline-none"
              />
              <input
                type="number"
                value={draft.hourlyRateEur ?? ""}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    hourlyRateEur: e.target.value
                      ? Number(e.target.value)
                      : undefined,
                  })
                }
                placeholder="Taux horaire (€)"
                className="bg-cream border border-ink/12 rounded-xl px-3 py-2 text-sm font-mono focus:border-copper focus:outline-none"
              />
              <label className="inline-flex items-center gap-2 text-sm text-graphite">
                <input
                  type="checkbox"
                  checked={draft.isActive ?? true}
                  onChange={(e) =>
                    setDraft({ ...draft, isActive: e.target.checked })
                  }
                />
                Actif (disponible pour routing)
              </label>
            </div>
            <div className="mt-3">
              <div className="font-mono text-[10px] uppercase tracking-eyebrow text-muted mb-2">
                Compétences
              </div>
              <div className="flex items-center gap-1.5 flex-wrap">
                {(Object.keys(SKILL_LABELS) as Skill[]).map((s) => {
                  const active = draft.skills?.includes(s);
                  return (
                    <button
                      key={s}
                      onClick={() => toggleSkill(s)}
                      className={cn(
                        "px-3 py-1.5 rounded-full text-xs font-medium transition-colors",
                        active
                          ? "bg-ink text-cream"
                          : "bg-cream border border-ink/10 text-graphite hover:border-copper/40",
                      )}
                    >
                      {SKILL_LABELS[s]}
                    </button>
                  );
                })}
              </div>
            </div>
            <textarea
              rows={2}
              value={draft.notes ?? ""}
              onChange={(e) => setDraft({ ...draft, notes: e.target.value })}
              placeholder="Notes…"
              className="mt-3 w-full bg-cream border border-ink/12 rounded-xl px-3 py-2 text-sm focus:border-copper focus:outline-none resize-none"
            />
            <div className="mt-3 flex items-center gap-2">
              <button
                onClick={save}
                disabled={busy}
                className="inline-flex items-center gap-1.5 rounded-full bg-ink text-cream px-4 py-2 text-sm hover:bg-copper disabled:opacity-50"
              >
                {busy ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Check className="h-3.5 w-3.5" />
                )}
                Enregistrer
              </button>
              <button
                onClick={() => {
                  setCreating(false);
                  setError(null);
                  setDraft({ skills: [], isActive: true });
                }}
                className="text-xs text-graphite hover:text-ink"
              >
                Annuler
              </button>
            </div>
          </div>
        )}

        {profiles === null ? (
          <div className="py-16 text-center text-muted">
            <Loader2 className="h-6 w-6 animate-spin mx-auto" />
          </div>
        ) : profiles.length === 0 ? (
          <div className="rounded-2xl border border-ink/10 bg-white shadow-soft py-16 text-center text-muted">
            <User className="h-12 w-12 mx-auto opacity-20 text-copper mb-2" />
            <p>Aucun technicien enregistré.</p>
          </div>
        ) : (
          <ul className="grid gap-3">
            {profiles.map((p) => (
              <li
                key={p.id}
                className="rounded-2xl border border-ink/10 bg-white shadow-soft p-5"
              >
                <div className="flex items-start gap-3">
                  <div
                    className="h-12 w-12 rounded-full grid place-items-center shrink-0"
                    style={{
                      background: "rgba(184,106,54,0.12)",
                      color: "#b86a36",
                    }}
                  >
                    <User className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-base font-medium text-ink">
                        {p.displayName}
                      </span>
                      {!p.isActive && (
                        <span className="text-[10px] font-mono uppercase tracking-eyebrow text-muted bg-cream border border-ink/10 px-2 py-0.5 rounded-full">
                          Inactif
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-graphite mt-0.5 font-mono">
                      {p.email}
                    </div>
                    <div className="text-xs text-graphite mt-1">
                      🏠 {p.homeBase}
                      {p.maxKmRadius && ` · rayon ${p.maxKmRadius} km`}
                      {p.hourlyRateEur && ` · ${p.hourlyRateEur} €/h`}
                    </div>
                    <div className="mt-2 flex items-center gap-1 flex-wrap">
                      {p.skills.map((s) => (
                        <span
                          key={s}
                          className="text-[10px] font-mono uppercase tracking-eyebrow text-copper bg-copper/10 px-2 py-0.5 rounded-full"
                        >
                          {SKILL_LABELS[s]}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => startEdit(p)}
                      className="px-2 py-1 rounded-full bg-cream border border-ink/10 text-xs text-graphite hover:border-copper/40"
                    >
                      Modifier
                    </button>
                    <button
                      onClick={() => remove(p.id, p.displayName)}
                      className="h-7 w-7 grid place-items-center rounded-full bg-cream border border-ember/30 text-ember hover:bg-ember hover:text-cream"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
        {/* Suppress unused */}
        <span className="hidden">
          <XIcon className="h-3 w-3" />
        </span>
      </div>
    </div>
  );
}
