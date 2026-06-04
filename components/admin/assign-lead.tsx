"use client";

import { useEffect, useState } from "react";
import { UserCheck, Loader2, Check } from "lucide-react";
import { cn } from "@/lib/utils";

type User = {
  id: string;
  email: string;
  role: string;
};

export function AssignLead({
  reference,
  currentAssignee,
  onAssigned,
}: {
  reference: string;
  currentAssignee?: string;
  onAssigned: (email: string | null) => void;
}) {
  const [users, setUsers] = useState<User[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    fetch("/api/admin/users", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => setUsers(data?.users ?? []))
      .catch(() => setUsers([]));
  }, []);

  const assign = async (email: string) => {
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/leads/${reference}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assignedTo: email }),
      });
      if (res.ok) {
        onAssigned(email || null);
        setSuccess(true);
        setTimeout(() => setSuccess(false), 1500);
      }
    } finally {
      setBusy(false);
    }
  };

  // Si pas de users (mode legacy), on n'affiche pas le widget
  if (users && users.length === 0) {
    return null;
  }

  return (
    <div className="p-6 lg:p-8 rounded-3xl border border-ink/10 bg-white shadow-soft">
      <div className="flex items-center gap-2 mb-4">
        <UserCheck className="h-5 w-5 text-copper" />
        <h2 className="font-display text-2xl text-ink">Assignation</h2>
      </div>
      <p className="text-sm text-graphite mb-5">
        Attribuer ce dossier à un membre de l&apos;équipe pour qu&apos;il le
        traite en priorité.
      </p>
      {users === null ? (
        <div className="text-sm text-muted">Chargement…</div>
      ) : (
        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={currentAssignee ?? ""}
            onChange={(e) => assign(e.target.value)}
            disabled={busy}
            className="bg-cream border border-ink/12 rounded-xl px-4 py-2.5 text-sm text-ink focus:border-copper focus:outline-none disabled:opacity-50"
          >
            <option value="">— Non assigné —</option>
            {users.map((u) => (
              <option key={u.id} value={u.email}>
                {u.email} ({u.role})
              </option>
            ))}
          </select>
          {busy && <Loader2 className="h-4 w-4 animate-spin text-copper" />}
          {success && (
            <span
              className={cn(
                "inline-flex items-center gap-1.5 text-sm",
                "text-[#22a06b]",
              )}
            >
              <Check className="h-3.5 w-3.5" /> Enregistré
            </span>
          )}
        </div>
      )}
    </div>
  );
}
