"use client";

/**
 * Page candidature — formulaire avec upload CV PDF.
 *
 * Pré-rempli si l'utilisateur arrive depuis une offre précise
 * (query param `?jobId=xxx`).
 */

import { useEffect, useRef, useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Upload,
  Send,
  Loader2,
  CheckCircle2,
  AlertCircle,
  FileText,
} from "lucide-react";
import { PageHeader } from "@/components/ui";
import { HeroAside } from "@/components/hero-aside";
import { Briefcase } from "lucide-react";
import type { JobRecord } from "@/lib/jobs-store";

export const dynamic = "force-dynamic";

function CandidatureForm() {
  const router = useRouter();
  const params = useSearchParams();
  const jobId = params.get("jobId") ?? "";

  const [job, setJob] = useState<JobRecord | null>(null);
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    message: "",
  });
  const [cv, setCv] = useState<File | null>(null);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Si jobId fourni, fetch le job pour afficher son titre
  useEffect(() => {
    if (!jobId) return;
    fetch("/api/recrutement", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        const found = (d?.jobs ?? []).find((j: JobRecord) => j.id === jobId);
        if (found) setJob(found);
      })
      .catch(() => {});
  }, [jobId]);

  const handleCvChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setError(null);
    if (!file) {
      setCv(null);
      return;
    }
    if (file.type !== "application/pdf") {
      setError("Le CV doit être un PDF.");
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      setError("CV trop volumineux (8 MB max).");
      return;
    }
    setCv(file);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cv) {
      setError("CV PDF obligatoire.");
      return;
    }
    setSending(true);
    setError(null);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      if (jobId) fd.append("jobId", jobId);
      fd.append("cv", cv);
      const res = await fetch("/api/recrutement/candidature", {
        method: "POST",
        body: fd,
      });
      const data = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        error?: string;
      };
      if (!res.ok) {
        throw new Error(data.error ?? `HTTP ${res.status}`);
      }
      setSuccess(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur inconnue.");
    } finally {
      setSending(false);
    }
  };

  if (success) {
    return (
      <main className="min-h-screen bg-creme py-16 lg:py-24 grid place-items-center px-5">
        <div className="max-w-xl w-full text-center">
          <div className="inline-grid place-items-center h-20 w-20 rounded-full bg-bleu/10 border-2 border-bleu/30 mb-6">
            <CheckCircle2 className="h-10 w-10 text-bleu" />
          </div>
          <h1 className="font-display text-4xl text-anthra mb-4">
            Candidature reçue.
          </h1>
          <p className="text-lg text-taupe mb-2">
            Merci{" "}
            <strong className="text-bleu">
              {form.firstName} {form.lastName}
            </strong>{" "}
            — nous avons bien reçu votre dossier.
          </p>
          <p className="text-sm text-muted">
            Notre équipe RH étudie votre profil et vous recontacte sous 5 jours
            ouvrés. Si votre profil retient notre attention, nous vous
            proposerons un premier échange téléphonique.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/recrutement"
              className="inline-flex items-center gap-2 rounded-full bg-navy text-creme px-6 py-3 text-sm font-medium hover:bg-bleu transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Voir d&apos;autres postes
            </Link>
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-sm font-mono uppercase tracking-eyebrow text-taupe hover:text-bleu transition-colors"
            >
              Retour à l&apos;accueil
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <>
      <PageHeader
        number="11"
        eyebrow="Candidature"
        title={
          job ? (
            <>
              Postuler pour <em className="not-italic text-bleu">{job.title}</em>
            </>
          ) : (
            <>
              Candidature{" "}
              <em className="not-italic text-bleu">spontanée</em>
            </>
          )
        }
        intro={
          <>
            Vous remplissez ce formulaire, vous joignez votre CV au format PDF, on
            étudie votre dossier <strong className="text-bleu font-semibold">sous 5 jours ouvrés</strong>.
          </>
        }
        aside={
          <HeroAside
            icon={Briefcase}
            eyebrow="Ce que nous regardons"
            items={[
              { label: "Le geste technique", body: "Précis, propre, durable" },
              { label: "Le sens du client", body: "Écoute et respect" },
              { label: "L'envie d'évoluer", body: "Formation continue" },
            ]}
            footnote="CV PDF · 8 MB max · réponse 5 jours ouvrés"
          />
        }
      />

      <section className="py-12 lg:py-16 bg-creme">
        <div className="container max-w-3xl">
          {job && (
            <div className="mb-8 p-4 rounded-2xl border border-bleu/30 bg-bleu/5 flex items-center gap-3">
              <Briefcase className="h-5 w-5 text-bleu shrink-0" />
              <div className="flex-1">
                <div className="text-xs font-mono uppercase tracking-eyebrow text-bleu">
                  Vous postulez pour
                </div>
                <div className="font-medium text-anthra">{job.title}</div>
              </div>
              <button
                type="button"
                onClick={() => router.push("/recrutement/candidature")}
                className="text-xs text-taupe hover:text-anthra underline"
              >
                Changer
              </button>
            </div>
          )}

          <form
            onSubmit={submit}
            className="p-7 lg:p-10 rounded-3xl border border-pierre bg-white shadow-card"
          >
            <div className="grid sm:grid-cols-2 gap-5">
              <div>
                <label
                  htmlFor="firstName"
                  className="block font-mono text-[10px] uppercase tracking-eyebrow text-muted mb-2"
                >
                  Prénom *
                </label>
                <input
                  id="firstName"
                  type="text"
                  required
                  value={form.firstName}
                  onChange={(e) =>
                    setForm({ ...form, firstName: e.target.value })
                  }
                  disabled={sending}
                  className="w-full bg-creme border border-pierre rounded-xl px-4 py-3 text-anthra focus:border-bleu focus:outline-none focus:ring-2 focus:ring-bleu/20 transition-all"
                />
              </div>
              <div>
                <label
                  htmlFor="lastName"
                  className="block font-mono text-[10px] uppercase tracking-eyebrow text-muted mb-2"
                >
                  Nom *
                </label>
                <input
                  id="lastName"
                  type="text"
                  required
                  value={form.lastName}
                  onChange={(e) =>
                    setForm({ ...form, lastName: e.target.value })
                  }
                  disabled={sending}
                  className="w-full bg-creme border border-pierre rounded-xl px-4 py-3 text-anthra focus:border-bleu focus:outline-none focus:ring-2 focus:ring-bleu/20 transition-all"
                />
              </div>
              <div>
                <label
                  htmlFor="email"
                  className="block font-mono text-[10px] uppercase tracking-eyebrow text-muted mb-2"
                >
                  Email *
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  disabled={sending}
                  className="w-full bg-creme border border-pierre rounded-xl px-4 py-3 text-anthra focus:border-bleu focus:outline-none focus:ring-2 focus:ring-bleu/20 transition-all"
                />
              </div>
              <div>
                <label
                  htmlFor="phone"
                  className="block font-mono text-[10px] uppercase tracking-eyebrow text-muted mb-2"
                >
                  Téléphone *
                </label>
                <input
                  id="phone"
                  type="tel"
                  required
                  placeholder="+352 ..."
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  disabled={sending}
                  className="w-full bg-creme border border-pierre rounded-xl px-4 py-3 text-anthra focus:border-bleu focus:outline-none focus:ring-2 focus:ring-bleu/20 transition-all"
                />
              </div>
            </div>

            <div className="mt-5">
              <label
                htmlFor="message"
                className="block font-mono text-[10px] uppercase tracking-eyebrow text-muted mb-2"
              >
                Message (facultatif)
              </label>
              <textarea
                id="message"
                rows={5}
                placeholder="Quelques mots sur votre profil, vos disponibilités, ce qui vous attire chez nous…"
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
                disabled={sending}
                className="w-full bg-creme border border-pierre rounded-xl px-4 py-3 text-anthra focus:border-bleu focus:outline-none focus:ring-2 focus:ring-bleu/20 transition-all resize-none"
              />
            </div>

            {/* CV Upload */}
            <div className="mt-5">
              <label className="block font-mono text-[10px] uppercase tracking-eyebrow text-muted mb-2">
                CV (PDF, 8 MB max) *
              </label>
              <input
                ref={fileInputRef}
                type="file"
                accept="application/pdf"
                onChange={handleCvChange}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={sending}
                className={`
                  w-full p-5 rounded-xl border-2 border-dashed transition-all
                  ${
                    cv
                      ? "border-bleu/50 bg-bleu/5"
                      : "border-pierre bg-creme/50 hover:border-bleu/30"
                  }
                `}
              >
                <div className="flex items-center justify-center gap-3">
                  {cv ? (
                    <>
                      <FileText className="h-5 w-5 text-bleu" />
                      <span className="text-sm text-anthra font-medium">
                        {cv.name}
                      </span>
                      <span className="text-xs text-muted">
                        ({(cv.size / 1024).toFixed(0)} KB)
                      </span>
                    </>
                  ) : (
                    <>
                      <Upload className="h-5 w-5 text-taupe" />
                      <span className="text-sm text-taupe">
                        Cliquer pour téléverser votre CV PDF
                      </span>
                    </>
                  )}
                </div>
              </button>
            </div>

            {error && (
              <div className="mt-5 p-3.5 rounded-xl bg-terracotta/8 border border-terracotta/30 flex gap-3 items-start text-sm text-anthra">
                <AlertCircle className="h-4 w-4 text-terracotta shrink-0 mt-0.5" />
                {error}
              </div>
            )}

            <div className="mt-8 flex flex-col sm:flex-row items-center gap-4">
              <button
                type="submit"
                disabled={sending || !cv}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-full bg-navy text-creme px-8 py-4 text-sm font-medium hover:bg-bleu transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              >
                {sending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Envoi en cours…
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    Envoyer ma candidature
                  </>
                )}
              </button>
              <p className="text-xs text-muted text-center sm:text-left">
                Vos données restent confidentielles. Conservation 12 mois max.
              </p>
            </div>
          </form>
        </div>
      </section>
    </>
  );
}

export default function CandidaturePage() {
  return (
    <Suspense>
      <CandidatureForm />
    </Suspense>
  );
}
