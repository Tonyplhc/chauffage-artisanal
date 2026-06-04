"use client";

/**
 * Édition fine d'un utilisateur — capabilities granulaires.
 *
 * Affiche les capabilities groupées par catégorie, avec :
 *   - cases à cocher individuelles
 *   - boutons "Tout cocher" / "Décocher tout" par section
 *   - boutons presets en haut (Tech, Commercial, Analyste, Manager, Admin) qui
 *     remplissent rapidement la sélection — l'utilisateur peut ensuite ajuster
 *
 * Sauvegarde via PATCH /api/admin/users { id, capabilities }.
 */

import { useEffect, useState, useCallback, useMemo } from "react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import {
  ArrowLeft,
  CheckSquare,
  Square,
  Save,
  Loader2,
  CheckCircle2,
} from "lucide-react";
import {
  CAPABILITIES,
  CATEGORY_LABEL,
  CATEGORY_DESCRIPTION,
  PRESETS,
  capabilitiesByCategory,
  type CapabilityCategory,
} from "@/lib/capabilities";

type User = {
  id: string;
  email: string;
  role: string;
  capabilities?: string[];
  displayName?: string;
  createdAt: string;
};

export default function UserCapabilitiesPage() {
  const router = useRouter();
  const params = useParams() as { id: string };
  const [user, setUser] = useState<User | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [displayName, setDisplayName] = useState("");
  const [saving, setSaving] = useState(false);
  const [savedFlash, setSavedFlash] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const res = await fetch("/api/admin/users", { cache: "no-store" });
    if (res.status === 401 || res.status === 403) {
      router.replace("/admin/leads");
      return;
    }
    const data = await res.json();
    const u = (data.users ?? []).find((x: User) => x.id === params.id);
    if (!u) {
      setError("Utilisateur introuvable.");
      return;
    }
    setUser(u);
    setSelected(new Set(u.capabilities ?? []));
    setDisplayName(u.displayName ?? "");
  }, [params.id, router]);

  useEffect(() => {
    load();
  }, [load]);

  const grouped = useMemo(() => capabilitiesByCategory(), []);

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleCategory = (cat: CapabilityCategory, allOn: boolean) => {
    setSelected((prev) => {
      const next = new Set(prev);
      const caps = grouped[cat] ?? [];
      for (const c of caps) {
        if (allOn) next.delete(c.id);
        else next.add(c.id);
      }
      return next;
    });
  };

  const applyPreset = (presetId: string) => {
    const p = PRESETS[presetId];
    if (!p) return;
    setSelected(new Set(p.capabilityIds));
  };

  const clearAll = () => setSelected(new Set());

  const save = async () => {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: params.id,
          capabilities: Array.from(selected),
          displayName: displayName || undefined,
        }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error ?? "Erreur");
      }
      setSavedFlash(true);
      setTimeout(() => setSavedFlash(false), 2000);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setSaving(false);
    }
  };

  if (error && !user) {
    return (
      <div className="min-h-screen bg-cream py-12">
        <div className="container max-w-3xl">
          <Link
            href="/admin/users"
            className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-eyebrow text-graphite hover:text-copper mb-4"
          >
            <ArrowLeft className="h-3 w-3" />
            Retour utilisateurs
          </Link>
          <div className="rounded-2xl border border-ember/30 bg-ember/5 p-6 text-ember">
            {error}
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="py-16 text-center text-muted">
        <Loader2 className="h-6 w-6 animate-spin mx-auto" />
      </div>
    );
  }

  const totalSelected = selected.size;
  const total = CAPABILITIES.length;

  return (
    <div className="min-h-screen bg-cream py-10 lg:py-14">
      <div className="container max-w-5xl">
        <Link
          href="/admin/users"
          className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-eyebrow text-graphite hover:text-copper mb-4"
        >
          <ArrowLeft className="h-3 w-3" />
          Retour utilisateurs
        </Link>

        <div className="flex items-start justify-between gap-4 flex-wrap mb-6">
          <div>
            <h1 className="font-display text-display-md text-ink">
              Permissions
            </h1>
            <p className="mt-1 text-graphite">
              <span className="font-mono">{user.email}</span> · rôle :{" "}
              <span className="text-copper">{user.role}</span>
            </p>
            <p className="text-xs text-muted mt-1">
              {totalSelected} / {total} capabilities cochées
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={save}
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-full bg-ink text-cream px-4 py-2 text-sm hover:bg-copper transition-colors"
            >
              {saving ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : savedFlash ? (
                <CheckCircle2 className="h-3.5 w-3.5 text-[#22a06b]" />
              ) : (
                <Save className="h-3.5 w-3.5" />
              )}
              {savedFlash ? "Enregistré ✓" : "Enregistrer"}
            </button>
          </div>
        </div>

        {/* Nom affiché */}
        <div className="rounded-2xl border border-ink/10 bg-white shadow-soft p-5 mb-5">
          <label className="block text-xs font-mono uppercase tracking-eyebrow text-graphite mb-1.5">
            Nom affiché (optionnel)
          </label>
          <input
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="Ex : Marc Dupont"
            className="w-full bg-cream border border-ink/12 rounded-lg px-3 py-2 text-sm focus:border-copper focus:outline-none"
          />
        </div>

        {/* Presets */}
        <div className="rounded-2xl border border-copper/30 bg-copper/5 p-4 mb-6">
          <div className="font-mono text-[10px] uppercase tracking-eyebrow text-copper mb-3">
            Préréglages rapides (vous pouvez ajuster ensuite)
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {Object.entries(PRESETS).map(([k, p]) => (
              <button
                key={k}
                onClick={() => applyPreset(k)}
                className="inline-flex items-center gap-1 text-xs rounded-full bg-white border border-ink/15 px-3 py-1.5 hover:border-copper/60 transition-colors"
              >
                {p.label}{" "}
                <span className="text-muted">({p.capabilityIds.length})</span>
              </button>
            ))}
            <button
              onClick={clearAll}
              className="inline-flex items-center gap-1 text-xs rounded-full bg-white border border-ember/30 text-ember px-3 py-1.5 hover:bg-ember/5"
            >
              Tout décocher
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-4 rounded-xl border border-ember/30 bg-ember/5 px-4 py-3 text-sm text-ember">
            {error}
          </div>
        )}

        {/* Catégories de capabilities */}
        <div className="space-y-4">
          {(Object.keys(grouped) as CapabilityCategory[]).map((cat) => {
            const items = grouped[cat] ?? [];
            const allOn = items.every((c) => selected.has(c.id));
            return (
              <div
                key={cat}
                className="rounded-2xl border border-ink/10 bg-white shadow-soft overflow-hidden"
              >
                <div className="px-5 py-3 border-b border-ink/8 bg-cream/40 flex items-center justify-between gap-3">
                  <div>
                    <div className="font-mono text-[10px] uppercase tracking-eyebrow text-copper">
                      {CATEGORY_LABEL[cat]}
                    </div>
                    <p className="text-[11px] text-muted mt-0.5">
                      {CATEGORY_DESCRIPTION[cat]}
                    </p>
                  </div>
                  <button
                    onClick={() => toggleCategory(cat, allOn)}
                    className="inline-flex items-center gap-1 text-xs text-graphite hover:text-copper transition-colors"
                  >
                    {allOn ? (
                      <>
                        <Square className="h-3 w-3" />
                        Tout décocher
                      </>
                    ) : (
                      <>
                        <CheckSquare className="h-3 w-3" />
                        Tout cocher
                      </>
                    )}
                  </button>
                </div>
                <ul className="divide-y divide-ink/5">
                  {items.map((c) => {
                    const checked = selected.has(c.id);
                    return (
                      <li key={c.id}>
                        <button
                          onClick={() => toggle(c.id)}
                          className={`w-full text-left px-5 py-3 hover:bg-cream/40 transition-colors flex items-start gap-3 ${
                            checked ? "bg-cream/20" : ""
                          }`}
                        >
                          <span className="mt-0.5 shrink-0">
                            {checked ? (
                              <CheckSquare className="h-4 w-4 text-copper" />
                            ) : (
                              <Square className="h-4 w-4 text-graphite" />
                            )}
                          </span>
                          <div className="min-w-0 flex-1">
                            <div className="text-sm font-medium text-ink">
                              {c.label}
                            </div>
                            <div className="text-[11px] text-muted">
                              {c.description}
                            </div>
                            <div className="text-[10px] text-graphite font-mono mt-0.5">
                              {c.id}
                            </div>
                          </div>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })}
        </div>

        <div className="mt-8 flex items-center justify-end gap-2">
          <button
            onClick={save}
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-full bg-ink text-cream px-5 py-2.5 text-sm hover:bg-copper transition-colors"
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            Enregistrer les permissions
          </button>
        </div>

        <p className="mt-6 text-xs text-muted">
          Les capabilities filtrent ce que l&apos;utilisateur voit dans la
          sidebar et peut faire dans l&apos;admin. Pour les routes API
          sensibles, une vérification supplémentaire est faite côté serveur.
        </p>
      </div>
    </div>
  );
}
