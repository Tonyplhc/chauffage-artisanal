"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Download,
  Upload,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  Database,
  FileJson,
} from "lucide-react";

export default function AdminBackupPage() {
  const [busy, setBusy] = useState<"export" | "import" | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const exportNow = () => {
    setBusy("export");
    setSuccess(null);
    setError(null);
    window.location.href = "/api/admin/backup";
    setTimeout(() => {
      setBusy(null);
      setSuccess("Backup exporté. Conservez-le en lieu sûr.");
    }, 1500);
  };

  const handleFile = async (file: File) => {
    if (!file.name.endsWith(".json")) {
      setError("Fichier .json requis.");
      return;
    }
    if (
      !confirm(
        "Restaurer ce backup va ÉCRASER les données actuelles (leads, devis, abonnés…). Confirmer ?",
      )
    ) {
      return;
    }
    setBusy("import");
    setSuccess(null);
    setError(null);
    try {
      const text = await file.text();
      const res = await fetch("/api/admin/backup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: text,
      });
      const data = await res.json();
      if (res.ok) {
        setSuccess(`Restore terminé · ${data.restored} fichier(s) restauré(s).`);
      } else {
        setError(data.error ?? "Erreur de restore");
      }
    } catch (e) {
      setError(String(e));
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="min-h-screen bg-cream py-10 lg:py-14">
      <div className="container max-w-3xl">
        <Link
          href="/admin/leads"
          className="inline-flex items-center gap-2 text-sm font-mono uppercase tracking-eyebrow text-graphite hover:text-copper transition-colors mb-6"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Retour pipeline
        </Link>

        <div className="flex items-center gap-3 mb-8">
          <div className="h-12 w-12 rounded-full bg-copper/10 border border-copper/30 grid place-items-center">
            <Database className="h-5 w-5 text-copper" />
          </div>
          <div>
            <h1 className="font-display text-display-md text-ink">
              Backup & restore
            </h1>
            <p className="mt-2 text-graphite">
              Sauvegarder et restaurer l&apos;ensemble des données admin.
            </p>
          </div>
        </div>

        {success && (
          <div className="mb-6 p-4 rounded-2xl border border-[#22a06b]/40 bg-[#22a06b]/5 flex items-start gap-3">
            <CheckCircle2 className="h-5 w-5 text-[#22a06b] shrink-0 mt-0.5" />
            <div className="text-sm text-ink">{success}</div>
          </div>
        )}
        {error && (
          <div className="mb-6 p-4 rounded-2xl border border-ember/40 bg-ember/5 flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-ember shrink-0 mt-0.5" />
            <div className="text-sm text-ink">{error}</div>
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-5">
          {/* Export */}
          <div className="p-6 rounded-3xl border border-ink/10 bg-white shadow-soft">
            <div className="flex items-center gap-2 mb-3">
              <Download className="h-5 w-5 text-copper" />
              <h2 className="font-display text-xl text-ink">Exporter</h2>
            </div>
            <p className="text-sm text-graphite leading-relaxed">
              Télécharge un fichier <code className="font-mono text-xs">.json</code>{" "}
              contenant tous les leads, devis, templates email, abonnés
              newsletter, activity log, utilisateurs, secret 2FA et events
              analytics.
            </p>
            <button
              onClick={exportNow}
              disabled={busy !== null}
              className="mt-5 inline-flex items-center gap-2 rounded-full bg-ink text-cream px-5 py-3 text-sm font-medium hover:bg-copper transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {busy === "export" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}
              Télécharger le backup
            </button>
          </div>

          {/* Import */}
          <div className="p-6 rounded-3xl border border-ember/30 bg-ember/5">
            <div className="flex items-center gap-2 mb-3">
              <Upload className="h-5 w-5 text-ember" />
              <h2 className="font-display text-xl text-ink">Restaurer</h2>
            </div>
            <p className="text-sm text-graphite leading-relaxed">
              ⚠️ Cette opération <strong className="text-ink">écrase</strong>{" "}
              les données actuelles. Faites un export de sauvegarde avant.
              Réservée aux comptes <strong>admin</strong>.
            </p>
            <button
              onClick={() => inputRef.current?.click()}
              disabled={busy !== null}
              className="mt-5 inline-flex items-center gap-2 rounded-full bg-ember text-cream px-5 py-3 text-sm font-medium hover:bg-ember/85 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {busy === "import" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <FileJson className="h-4 w-4" />
              )}
              Choisir un fichier
            </button>
            <input
              ref={inputRef}
              type="file"
              accept=".json,application/json"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleFile(f);
              }}
            />
          </div>
        </div>

        {/* Liste des fichiers couverts */}
        <div className="mt-6 p-5 rounded-2xl border border-ink/10 bg-white">
          <div className="font-mono text-[10px] uppercase tracking-eyebrow text-copper mb-3">
            Couverture du backup
          </div>
          <ul className="grid sm:grid-cols-2 gap-2 text-xs text-graphite">
            <li>✓ Leads + transitions de statut</li>
            <li>✓ Catalogue produits/prestations</li>
            <li>✓ Devis officiels</li>
            <li>✓ Templates email</li>
            <li>✓ Abonnés newsletter</li>
            <li>✓ Activity log complet</li>
            <li>✓ Utilisateurs (mots de passe hashés)</li>
            <li>✓ Secret 2FA</li>
            <li>✓ Events analytics anonymisés</li>
            <li>✗ Photos / documents binaires (non inclus dans le JSON)</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
