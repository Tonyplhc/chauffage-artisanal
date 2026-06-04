"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  UserPlus,
  Trash2,
  KeyRound,
  ShieldCheck,
  Mail,
  Loader2,
  Check,
  X as XIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ROLE_LABELS, type Role } from "@/lib/users-store";

type User = {
  id: string;
  email: string;
  role: Role;
  createdAt: string;
  lastLoginAt?: string;
  has2fa: boolean;
};

const ROLE_COLORS: Record<Role, string> = {
  admin: "#b86a36",
  commercial: "#6ba3c5",
  viewer: "#8b847a",
};

export default function AdminUsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState<User[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [newUser, setNewUser] = useState({
    email: "",
    password: "",
    role: "commercial" as Role,
  });

  const refresh = async () => {
    try {
      const res = await fetch("/api/admin/users", { cache: "no-store" });
      // Pas connecté → on renvoie sur login (la session a expiré)
      if (res.status === 401) {
        router.replace("/admin/login?from=/admin/users");
        return;
      }
      // Connecté mais sans droit "admin" → on l'affiche au lieu de rediriger
      // silencieusement (avant on bouclait vers /admin/leads, ce qui donnait
      // l'impression que la page était cassée).
      if (res.status === 403) {
        setError(
          "Accès réservé aux administrateurs. Demandez à un admin de vous attribuer le rôle 'admin' depuis cette page.",
        );
        setUsers([]);
        return;
      }
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        setError(body.error ?? `Erreur HTTP ${res.status}`);
        setUsers([]);
        return;
      }
      const data = (await res.json()) as { users?: User[] };
      setUsers(data.users ?? []);
      setError(null);
    } catch (e) {
      setError(
        e instanceof Error ? `Erreur réseau : ${e.message}` : "Erreur réseau.",
      );
      setUsers([]);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  const create = async () => {
    setError(null);
    if (newUser.password.length < 8) {
      setError("Mot de passe trop court (8 caractères min).");
      return;
    }
    setCreating(true);
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newUser),
      });
      const data = await res.json();
      if (res.ok) {
        setNewUser({ email: "", password: "", role: "commercial" });
        await refresh();
      } else {
        setError(data.error ?? "Erreur");
      }
    } finally {
      setCreating(false);
    }
  };

  const updateRole = async (id: string, role: Role) => {
    const res = await fetch("/api/admin/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, role }),
    });
    if (res.ok) await refresh();
  };

  const remove = async (id: string, email: string) => {
    if (!confirm(`Supprimer définitivement le compte ${email} ?`)) return;
    const res = await fetch(`/api/admin/users?id=${encodeURIComponent(id)}`, {
      method: "DELETE",
    });
    if (res.ok) await refresh();
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
            Utilisateurs
          </h1>
          <p className="mt-2 text-graphite">
            Gérer les comptes admin, commerciaux et consultations.
          </p>
        </div>

        {/* Erreur globale (403 = pas le bon rôle, etc.) */}
        {error && (
          <div className="mb-6 p-4 rounded-2xl border border-ember/40 bg-ember/5 text-sm text-ink flex items-start gap-3">
            <XIcon className="h-4 w-4 text-ember shrink-0 mt-0.5" />
            <div>
              <div className="font-medium mb-1">Action impossible</div>
              <div className="text-graphite">{error}</div>
            </div>
          </div>
        )}

        {/* Création */}
        <div className="mb-6 rounded-2xl border border-ink/10 bg-white shadow-soft p-6 lg:p-8">
          <div className="flex items-center gap-2 mb-5">
            <UserPlus className="h-5 w-5 text-copper" />
            <h2 className="font-display text-xl text-ink">Nouvel utilisateur</h2>
          </div>
          <div className="grid sm:grid-cols-12 gap-3">
            <input
              type="email"
              placeholder="email@chauffage-artisanal.lu"
              value={newUser.email}
              onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
              className="sm:col-span-4 bg-cream border border-ink/12 rounded-xl px-4 py-2.5 text-sm text-ink focus:border-copper focus:outline-none"
            />
            <input
              type="text"
              placeholder="Mot de passe (8+ caractères)"
              value={newUser.password}
              onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
              className="sm:col-span-4 bg-cream border border-ink/12 rounded-xl px-4 py-2.5 text-sm text-ink focus:border-copper focus:outline-none font-mono"
            />
            <select
              value={newUser.role}
              onChange={(e) => setNewUser({ ...newUser, role: e.target.value as Role })}
              className="sm:col-span-2 bg-cream border border-ink/12 rounded-xl px-4 py-2.5 text-sm text-ink focus:border-copper focus:outline-none"
            >
              <option value="admin">Admin</option>
              <option value="commercial">Commercial</option>
              <option value="viewer">Consultation</option>
            </select>
            <button
              onClick={create}
              disabled={creating || !newUser.email.includes("@") || newUser.password.length < 8}
              className="sm:col-span-2 inline-flex items-center justify-center gap-2 rounded-xl bg-ink text-cream px-4 py-2.5 text-sm font-medium hover:bg-copper transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
              Créer
            </button>
          </div>
          {error && (
            <div className="mt-4 p-3 rounded-xl border border-ember/40 bg-ember/5 text-sm text-ember">
              {error}
            </div>
          )}
        </div>

        {/* Liste */}
        <div className="rounded-2xl border border-ink/10 bg-white shadow-soft overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-cream/40 border-b border-ink/10 text-left text-xs font-mono uppercase tracking-eyebrow text-muted">
                <tr>
                  <th className="px-5 py-3">Email</th>
                  <th className="px-5 py-3">Rôle</th>
                  <th className="px-5 py-3">2FA</th>
                  <th className="px-5 py-3">Dernière connexion</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users === null ? (
                  <tr>
                    <td colSpan={5} className="px-5 py-12 text-center text-muted">
                      Chargement…
                    </td>
                  </tr>
                ) : users.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-5 py-12 text-center">
                      <div className="text-graphite">
                        Aucun utilisateur. Le mode legacy (ADMIN_PASSWORD env) reste actif.
                      </div>
                      <div className="mt-2 text-xs text-muted">
                        Créez un premier utilisateur pour passer en mode multi-comptes.
                      </div>
                    </td>
                  </tr>
                ) : (
                  users.map((u) => (
                    <tr key={u.id} className="border-b border-ink/8 last:border-0">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <Mail className="h-4 w-4 text-graphite" />
                          <span className="text-ink font-medium">{u.email}</span>
                        </div>
                        <div className="mt-1 text-xs text-muted">
                          Créé · {new Date(u.createdAt).toLocaleDateString("fr-FR")}
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <select
                          value={u.role}
                          onChange={(e) => updateRole(u.id, e.target.value as Role)}
                          className="px-2 py-1 rounded-lg border border-ink/15 bg-white text-xs font-mono uppercase tracking-eyebrow text-ink focus:border-copper focus:outline-none"
                          style={{ color: ROLE_COLORS[u.role] }}
                        >
                          <option value="admin">Admin</option>
                          <option value="commercial">Commercial</option>
                          <option value="viewer">Consultation</option>
                        </select>
                      </td>
                      <td className="px-5 py-4">
                        {u.has2fa ? (
                          <span className="inline-flex items-center gap-1.5 text-xs font-mono uppercase tracking-eyebrow text-[#22a06b]">
                            <Check className="h-3 w-3" /> Actif
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 text-xs font-mono uppercase tracking-eyebrow text-muted">
                            <XIcon className="h-3 w-3" /> Inactif
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-4 text-sm text-graphite tabular-nums">
                        {u.lastLoginAt
                          ? new Date(u.lastLoginAt).toLocaleString("fr-FR", {
                              dateStyle: "short",
                              timeStyle: "short",
                            })
                          : "—"}
                      </td>
                      <td className="px-5 py-4 text-right">
                        <div className="inline-flex items-center gap-1.5 justify-end">
                          <Link
                            href={`/admin/users/${u.id}`}
                            className="inline-flex items-center gap-1.5 rounded-full border border-copper/40 bg-copper/8 px-3 py-1.5 text-xs text-copper hover:bg-copper/15 transition-colors"
                            title="Gérer les permissions"
                          >
                            <KeyRound className="h-3 w-3" />
                            Permissions
                          </Link>
                          <button
                            onClick={() => remove(u.id, u.email)}
                            className="h-8 w-8 grid place-items-center rounded-full bg-white border border-ink/10 text-graphite hover:bg-ember hover:text-cream hover:border-ember transition-colors"
                            title="Supprimer"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Légende rôles */}
        <div className="mt-6 grid sm:grid-cols-3 gap-3">
          <RolePill role="admin" desc="Accès total (settings, RGPD, multi-user, suppression)" />
          <RolePill role="commercial" desc="Édition leads, envoi devis et emails — pas de RGPD ni user mgmt" />
          <RolePill role="viewer" desc="Lecture seule (consultation pipeline, stats)" />
        </div>
      </div>
    </div>
  );
}

function RolePill({ role, desc }: { role: Role; desc: string }) {
  const color = ROLE_COLORS[role];
  return (
    <div
      className="p-4 rounded-2xl border bg-white"
      style={{ borderColor: `${color}55`, background: `${color}05` }}
    >
      <div className="flex items-center gap-2">
        <ShieldCheck className="h-4 w-4" style={{ color }} />
        <span className="font-mono text-xs uppercase tracking-eyebrow" style={{ color }}>
          {ROLE_LABELS[role]}
        </span>
      </div>
      <div className="mt-2 text-xs text-graphite leading-relaxed">{desc}</div>
    </div>
  );
}
