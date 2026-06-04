"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Plus,
  Trash2,
  Key,
  Copy,
  Check,
  Loader2,
  Power,
  ExternalLink,
} from "lucide-react";
import type { ApiKey, Scope } from "@/lib/api-keys-store";
import { cn } from "@/lib/utils";

export default function ApiKeysPage() {
  const router = useRouter();
  const [keys, setKeys] = useState<ApiKey[] | null>(null);
  const [scopes, setScopes] = useState<Scope[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [newLabel, setNewLabel] = useState("");
  const [newScopes, setNewScopes] = useState<Scope[]>(["read:leads"]);
  const [busy, setBusy] = useState(false);
  const [revealedKey, setRevealedKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const refresh = async () => {
    const res = await fetch("/api/admin/api-keys", { cache: "no-store" });
    if (res.status === 401) {
      router.replace("/admin/login");
      return;
    }
    const data = await res.json();
    setKeys(data.keys ?? []);
    setScopes(data.scopes ?? []);
  };

  useEffect(() => {
    refresh();
  }, []);

  const create = async () => {
    if (!newLabel.trim() || newScopes.length === 0) return;
    setBusy(true);
    try {
      const res = await fetch("/api/admin/api-keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ label: newLabel, scopes: newScopes }),
      });
      const data = await res.json();
      if (res.ok) {
        setRevealedKey(data.rawKey);
        setShowCreate(false);
        setNewLabel("");
        setNewScopes(["read:leads"]);
        await refresh();
      }
    } finally {
      setBusy(false);
    }
  };

  const revoke = async (id: string) => {
    if (!confirm("Révoquer cette clé ? Elle ne fonctionnera plus.")) return;
    await fetch(`/api/admin/api-keys?id=${encodeURIComponent(id)}&action=revoke`, {
      method: "DELETE",
    });
    await refresh();
  };

  const remove = async (id: string) => {
    if (!confirm("Supprimer définitivement cette clé ?")) return;
    await fetch(`/api/admin/api-keys?id=${encodeURIComponent(id)}`, {
      method: "DELETE",
    });
    await refresh();
  };

  const copyKey = () => {
    if (!revealedKey) return;
    navigator.clipboard.writeText(revealedKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
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

        <div className="flex items-start justify-between gap-4 mb-8 flex-wrap">
          <div>
            <h1 className="font-display text-display-md text-ink">
              Clés API
            </h1>
            <p className="mt-2 text-graphite">
              Accès programmatique à vos données via{" "}
              <code className="font-mono text-sm">/api/v1/*</code> ·{" "}
              <Link href="/api-docs" className="text-copper underline inline-flex items-center gap-1">
                Voir la doc <ExternalLink className="h-3 w-3" />
              </Link>
            </p>
          </div>
          <button
            onClick={() => setShowCreate((v) => !v)}
            className="inline-flex items-center gap-2 rounded-full bg-ink text-cream px-5 py-2.5 text-sm font-medium hover:bg-copper transition-colors"
          >
            <Plus className="h-4 w-4" />
            {showCreate ? "Annuler" : "Nouvelle clé"}
          </button>
        </div>

        {/* Reveal one-time */}
        {revealedKey && (
          <div className="mb-6 p-5 rounded-2xl border border-[#22a06b]/40 bg-[#22a06b]/5">
            <div className="font-mono text-[10px] uppercase tracking-eyebrow text-[#22a06b] mb-2">
              Clé créée · à conserver maintenant
            </div>
            <p className="text-sm text-graphite mb-3">
              Cette clé ne sera <strong className="text-ink">plus jamais affichée</strong>{" "}
              en clair. Copiez-la et stockez-la dans un gestionnaire sécurisé.
            </p>
            <div className="flex items-center gap-2 p-3 rounded-xl bg-white border border-ink/10">
              <code className="font-mono text-sm text-ink flex-1 break-all">
                {revealedKey}
              </code>
              <button
                onClick={copyKey}
                className="h-9 w-9 grid place-items-center rounded-full bg-cream border border-ink/10 hover:bg-ink hover:text-cream transition-colors shrink-0"
              >
                {copied ? <Check className="h-4 w-4 text-[#22a06b]" /> : <Copy className="h-4 w-4" />}
              </button>
            </div>
            <button
              onClick={() => setRevealedKey(null)}
              className="mt-3 text-xs text-graphite hover:text-ink"
            >
              J&apos;ai sauvegardé la clé — masquer
            </button>
          </div>
        )}

        {/* Création */}
        {showCreate && (
          <div className="mb-6 p-6 rounded-2xl border border-copper/30 bg-copper/5">
            <div className="font-mono text-[10px] uppercase tracking-eyebrow text-copper mb-4">
              Nouvelle clé API
            </div>
            <div className="grid gap-4">
              <div>
                <label className="font-mono text-[10px] uppercase tracking-eyebrow text-muted mb-2 block">
                  Label
                </label>
                <input
                  type="text"
                  value={newLabel}
                  onChange={(e) => setNewLabel(e.target.value)}
                  placeholder="Ex: Intégration CRM HubSpot"
                  className="w-full bg-white border border-ink/12 rounded-xl px-4 py-2.5 text-sm text-ink focus:border-copper focus:outline-none"
                />
              </div>
              <div>
                <label className="font-mono text-[10px] uppercase tracking-eyebrow text-muted mb-2 block">
                  Scopes (permissions)
                </label>
                <div className="grid sm:grid-cols-2 gap-2">
                  {scopes.map((s) => {
                    const active = newScopes.includes(s);
                    return (
                      <button
                        key={s}
                        onClick={() => {
                          if (active) setNewScopes(newScopes.filter((x) => x !== s));
                          else setNewScopes([...newScopes, s]);
                        }}
                        className={cn(
                          "px-3 py-2 rounded-xl border text-sm font-mono transition-colors flex items-center justify-between",
                          active
                            ? "bg-copper text-cream border-copper"
                            : "bg-white border-ink/12 text-ink hover:border-copper/40",
                        )}
                      >
                        <span>{s}</span>
                        {active && <Check className="h-3.5 w-3.5" />}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div className="flex items-center justify-end gap-3">
                <button
                  onClick={() => setShowCreate(false)}
                  className="text-sm text-graphite hover:text-ink"
                >
                  Annuler
                </button>
                <button
                  onClick={create}
                  disabled={busy || !newLabel.trim() || newScopes.length === 0}
                  className={cn(
                    "inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium transition-colors",
                    busy || !newLabel.trim() || newScopes.length === 0
                      ? "bg-ink/15 text-ink/40 cursor-not-allowed"
                      : "bg-ink text-cream hover:bg-copper",
                  )}
                >
                  {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Key className="h-4 w-4" />}
                  Créer la clé
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Liste */}
        <div className="rounded-2xl border border-ink/10 bg-white shadow-soft overflow-hidden">
          {keys === null ? (
            <div className="py-12 text-center text-muted">Chargement…</div>
          ) : keys.length === 0 ? (
            <div className="py-12 text-center">
              <Key className="h-10 w-10 mx-auto text-ink/15" />
              <p className="mt-3 text-graphite">Aucune clé API pour l&apos;instant.</p>
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-cream/40 border-b border-ink/10 text-left text-xs font-mono uppercase tracking-eyebrow text-muted">
                <tr>
                  <th className="px-5 py-3">Label</th>
                  <th className="px-5 py-3">Préfixe</th>
                  <th className="px-5 py-3">Scopes</th>
                  <th className="px-5 py-3">Utilisations</th>
                  <th className="px-5 py-3">État</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {keys.map((k) => (
                  <tr key={k.id} className="border-b border-ink/8 last:border-0">
                    <td className="px-5 py-4">
                      <div className="text-ink font-medium">{k.label}</div>
                      <div className="text-xs text-muted">
                        Créée · {new Date(k.createdAt).toLocaleDateString("fr-FR")}
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <code className="font-mono text-xs text-graphite">
                        {k.prefix}…
                      </code>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex flex-wrap gap-1">
                        {k.scopes.map((s) => (
                          <span
                            key={s}
                            className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-copper/10 border border-copper/30 text-copper"
                          >
                            {s}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-5 py-4 text-sm text-graphite tabular-nums">
                      {k.useCount ?? 0}×
                      {k.lastUsedAt && (
                        <div className="text-xs text-muted">
                          dernière · {new Date(k.lastUsedAt).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" })}
                        </div>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      {k.enabled ? (
                        <span className="inline-flex items-center gap-1.5 text-xs font-mono uppercase tracking-eyebrow text-[#22a06b]">
                          <Power className="h-3 w-3" /> Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-xs font-mono uppercase tracking-eyebrow text-muted">
                          <Power className="h-3 w-3" /> Révoquée
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        {k.enabled && (
                          <button
                            onClick={() => revoke(k.id)}
                            className="h-9 px-3 inline-flex items-center gap-1.5 rounded-full border border-ember/40 text-ember text-xs hover:bg-ember/10 transition-colors"
                          >
                            <Power className="h-3 w-3" /> Révoquer
                          </button>
                        )}
                        <button
                          onClick={() => remove(k.id)}
                          className="h-9 w-9 grid place-items-center rounded-full bg-white border border-ink/10 text-graphite hover:bg-ember hover:text-cream hover:border-ember transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
