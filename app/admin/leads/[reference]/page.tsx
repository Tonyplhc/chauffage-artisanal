"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Inbox,
  FileText,
  Trophy,
  X as XIcon,
  Save,
  Camera,
  Sparkles,
  ArrowUpRight,
  Clock,
  ArrowRight,
} from "lucide-react";
import type { LeadRecord } from "@/lib/devis-schema";
import { LEVEL_LABELS, LEVEL_COLORS } from "@/lib/lead-scoring";
import { LeadDocuments } from "@/components/admin/lead-documents";
import { RgpdActions } from "@/components/admin/rgpd-actions";
import { AssignLead } from "@/components/admin/assign-lead";
import { LeadTagsBlock } from "@/components/admin/lead-tags";
import { LeadValueBlock } from "@/components/admin/lead-value";
import { LeadRemindersBlock } from "@/components/admin/lead-reminders";
import { LeadCommentsBlock } from "@/components/admin/lead-comments";
import { AISummaryCard } from "@/components/admin/ai-summary-card";
import { DuplicateBadge } from "@/components/admin/duplicate-badge";
import { LeadSourceBlock } from "@/components/admin/lead-source";
import { NextBestActionBlock } from "@/components/admin/next-best-action";
import { LeadTimeline } from "@/components/admin/lead-timeline";
import { LeadReferralBlock } from "@/components/admin/lead-referral";
import { LeadPaymentBlock } from "@/components/admin/lead-payment";
import { LeadProjectBlock } from "@/components/admin/lead-project";
import { LeadInvoiceButton } from "@/components/admin/lead-invoice-button";
import { QuoteApprovalBlock } from "@/components/admin/quote-approval-block";
import { LeadMaintenanceBlock } from "@/components/admin/lead-maintenance";
import { LeadEquipmentBlock } from "@/components/admin/lead-equipment";
import { LeadStartInterventionBlock } from "@/components/admin/lead-start-intervention";
import { LeadAuditTrail } from "@/components/admin/lead-audit-trail";
import { TechSuggestions } from "@/components/admin/tech-suggestions";
import { EmailSuggestions } from "@/components/admin/email-suggestions";
import { cn } from "@/lib/utils";

const STATUSES: { id: LeadRecord["status"]; label: string; icon: any; color: string }[] = [
  { id: "nouveau", label: "Nouveau", icon: Inbox, color: "#b86a36" },
  { id: "contacte", label: "Contacté", icon: Phone, color: "#6ba3c5" },
  { id: "devis_envoye", label: "Devis envoyé", icon: FileText, color: "#94532a" },
  { id: "converti", label: "Converti", icon: Trophy, color: "#22a06b" },
  { id: "perdu", label: "Perdu", icon: XIcon, color: "#8b847a" },
];

const LABELS = {
  service: { chauffage: "Chauffage", pac: "Pompe à chaleur", clim: "Climatisation", sanitaire: "Sanitaire", enr: "Énergies renouvelables", depannage: "Dépannage", autre: "Autre" },
  building: { maison: "Maison individuelle", appartement: "Appartement", collectif: "Immeuble collectif", tertiaire: "Bureaux / tertiaire", autre: "Autre" },
  construction: { neuf: "Neuf", renovation: "Rénovation" },
  energy: { fioul: "Fioul", gaz: "Gaz", electrique: "Électrique", bois: "Bois", pac: "PAC", autre: "Autre", inconnu: "Inconnu" },
  timeline: { urgent: "Urgent", court: "Sous 3 mois", annee: "Cette année", exploration: "Exploration" },
  budget: { less10: "< 10 k€", "10-20": "10-20 k€", "20-40": "20-40 k€", "40plus": "> 40 k€", "10-25": "10-25 k€", "25-50": "25-50 k€", "50-100": "50-100 k€", "100plus": "> 100 k€", inconnu: "Inconnu" },
  channel: { phone: "Téléphone", email: "Email", sms: "SMS", whatsapp: "WhatsApp" },
} as const;

export default function LeadDetailPage() {
  const params = useParams<{ reference: string }>();
  const router = useRouter();
  const [lead, setLead] = useState<LeadRecord | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notesDraft, setNotesDraft] = useState("");
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`/api/admin/leads/${params.reference}`, { cache: "no-store" });
        if (res.status === 401) {
          router.replace("/admin/login");
          return;
        }
        if (!res.ok) {
          setError(res.status === 404 ? "Lead introuvable." : "Erreur de chargement.");
          return;
        }
        const data = await res.json();
        setLead(data.lead);
        setNotesDraft(data.lead.notes ?? "");
      } catch (e) {
        setError("Erreur réseau.");
      }
    })();
  }, [params.reference, router]);

  const updateStatus = async (status: LeadRecord["status"]) => {
    if (!lead || lead.status === status) return;
    // Optimistic update : on bascule l'UI tout de suite, le client voit le
    // changement immédiat. Si la requête échoue, on rollback + on affiche
    // une erreur.
    const previous = lead;
    setLead({ ...lead, status });
    try {
      const res = await fetch(`/api/admin/leads/${lead.reference}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as {
          error?: string;
        };
        throw new Error(body.error ?? `HTTP ${res.status}`);
      }
      const d = (await res.json()) as { lead: LeadRecord };
      setLead(d.lead);
      // Mini feedback visuel : on remplit le savedAt comme pour les notes
      setSavedAt(new Date().toLocaleTimeString("fr-FR"));
      setTimeout(() => setSavedAt(null), 3000);
    } catch (e) {
      setLead(previous);
      setError(
        e instanceof Error
          ? `Statut non sauvegardé : ${e.message}`
          : "Statut non sauvegardé.",
      );
      setTimeout(() => setError(null), 5000);
    }
  };

  const saveNotes = async () => {
    if (!lead) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/leads/${lead.reference}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes: notesDraft }),
      });
      if (res.ok) {
        const d = await res.json();
        setLead(d.lead);
        setSavedAt(new Date().toLocaleTimeString("fr-FR"));
      }
    } finally {
      setSaving(false);
    }
  };

  if (error) {
    return (
      <div className="min-h-screen bg-cream grid place-items-center">
        <div className="text-center">
          <div className="text-graphite mb-4">{error}</div>
          <button
            onClick={() => router.push("/admin/leads")}
            className="inline-flex items-center gap-2 rounded-full bg-ink text-cream px-5 py-2.5 text-sm"
          >
            <ArrowLeft className="h-4 w-4" /> Retour à la liste
          </button>
        </div>
      </div>
    );
  }

  if (!lead) {
    return <div className="min-h-screen bg-cream grid place-items-center text-muted">Chargement…</div>;
  }

  return (
    <div className="min-h-screen bg-cream py-12 lg:py-16">
      <div className="container max-w-6xl">
        <div className="mb-8">
          <Link
            href="/admin/leads"
            className="inline-flex items-center gap-2 text-sm text-graphite hover:text-copper transition-colors"
          >
            <ArrowLeft className="h-4 w-4" /> Pipeline
          </Link>
        </div>

        <div className="grid lg:grid-cols-12 gap-8">
          {/* MAIN */}
          <div className="lg:col-span-8 space-y-8">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-6 lg:p-8 rounded-3xl border border-ink/10 bg-white shadow-soft"
            >
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                  <div className="font-mono text-[10px] uppercase tracking-eyebrow text-copper">
                    Dossier {lead.reference}
                  </div>
                  <h1 className="mt-3 font-display text-3xl lg:text-4xl text-ink">
                    {lead.fullName}
                  </h1>
                  <div className="mt-2 flex items-center gap-3 text-sm text-graphite flex-wrap">
                    <span className="inline-flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5 text-copper" />
                      {new Date(lead.submittedAt).toLocaleString("fr-FR")}
                    </span>
                    <span className="text-ink/20">·</span>
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5 text-copper" />
                      {lead.commune}
                    </span>
                  </div>
                </div>
                <div className="flex flex-col gap-2 items-end">
                  <a
                    href={`mailto:${lead.email}`}
                    className="inline-flex items-center gap-2 text-sm text-ink hover:text-copper transition-colors"
                  >
                    <Mail className="h-4 w-4 text-copper" /> {lead.email}
                  </a>
                  <a
                    href={`tel:${lead.phone.replace(/\s/g, "")}`}
                    className="inline-flex items-center gap-2 text-sm text-ink hover:text-copper transition-colors"
                  >
                    <Phone className="h-4 w-4 text-copper" /> {lead.phone}
                  </a>
                </div>
              </div>
            </motion.div>

            {/* Résumé IA — 1 clic, TL;DR généré par Llama 3.3 via Groq */}
            {/* Caché tant que IA pas activée (cf. NEXT_PUBLIC_ENABLE_AI) */}
            {process.env.NEXT_PUBLIC_ENABLE_AI === "1" && (
              <AISummaryCard reference={lead.reference} />
            )}

            {/* Next best action — suggestions priorisées */}
            <NextBestActionBlock reference={lead.reference} />

            {/* Score lead — visible et explicable */}
            {lead.level && typeof lead.score === "number" && (
              <ScoreBlock lead={lead} />
            )}

            {/* Assignation */}
            <AssignLead
              reference={lead.reference}
              currentAssignee={lead.assignedTo}
              onAssigned={(email) => {
                if (lead) {
                  // refresh lead state via state update on assignment
                  setLead({ ...lead, assignedTo: email || undefined });
                }
              }}
            />

            {/* Tags personnalisés */}
            <LeadTagsBlock
              reference={lead.reference}
              initialTagIds={
                (lead.metadata as { tags?: string[] } | undefined)?.tags ?? []
              }
            />

            {/* Valeur estimée */}
            <LeadValueBlock reference={lead.reference} />

            {/* Rappels */}
            <LeadRemindersBlock reference={lead.reference} />

            {/* Détection doublons (silent si vide) */}
            <DuplicateBadge reference={lead.reference} />

            {/* Source d'acquisition (silent si vide) */}
            <LeadSourceBlock
              source={
                (lead.metadata as { source?: unknown } | undefined)
                  ?.source as never
              }
            />

            {/* Parrainage (visible si converti) */}
            <LeadReferralBlock
              reference={lead.reference}
              isConverted={lead.status === "converti"}
            />

            {/* Paiements d'acompte */}
            <LeadPaymentBlock reference={lead.reference} />

            {/* Suivi de chantier (utile dès la conversion) */}
            {lead.status === "converti" && (
              <LeadProjectBlock reference={lead.reference} />
            )}

            {/* Émettre une facture (si converti + devis exsitant) */}
            {lead.status === "converti" && (
              <LeadInvoiceButton reference={lead.reference} hasQuote={true} />
            )}

            {/* Validation devis (à demander avant envoi) */}
            <QuoteApprovalBlock reference={lead.reference} />

            {/* Trail audit granulaire — silent si aucun diff */}
            <LeadAuditTrail reference={lead.reference} />

            {/* Routing intelligent techniciens */}
            <TechSuggestions reference={lead.reference} />

            {/* Email assistant : brouillons de réponses contextuels */}
            <EmailSuggestions reference={lead.reference} />

            {/* Contrats d'entretien (utile après conversion) */}
            {lead.status === "converti" && (
              <LeadMaintenanceBlock
                reference={lead.reference}
                clientName={lead.fullName}
              />
            )}

            {/* Registre équipements (après conversion) */}
            {lead.status === "converti" && (
              <LeadEquipmentBlock reference={lead.reference} />
            )}

            {/* Démarrer une intervention ad-hoc — dépannage, pose, entretien… */}
            {lead.status === "converti" && (
              <LeadStartInterventionBlock reference={lead.reference} />
            )}

            {/* Rapport de chantier — après conversion */}
            {lead.status === "converti" && (
              <Link
                href={`/admin/leads/${lead.reference}/report`}
                className="rounded-2xl border border-ink/10 bg-white shadow-soft p-4 flex items-center gap-3 hover:border-copper/40 transition-colors group"
              >
                <Camera className="h-4 w-4 text-copper shrink-0" />
                <div className="min-w-0 flex-1">
                  <div className="text-sm text-ink font-medium">
                    Rapport de chantier
                  </div>
                  <div className="text-xs text-muted">
                    Photos avant/après, légendes, partage client
                  </div>
                </div>
                <span className="text-xs text-copper opacity-0 group-hover:opacity-100 transition-opacity">
                  Ouvrir →
                </span>
              </Link>
            )}

            {/* Quote builder */}
            <Link
              href={`/admin/leads/${lead.reference}/quote`}
              className="group block p-6 rounded-3xl border border-ink/15 bg-white hover:border-copper/40 hover:shadow-lift transition-all"
            >
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-full bg-ink text-cream grid place-items-center">
                    <FileText className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="font-display text-xl text-ink">
                      Devis officiel
                    </div>
                    <div className="text-sm text-graphite mt-0.5">
                      Construire et envoyer un devis numéroté au client
                    </div>
                  </div>
                </div>
                <ArrowUpRight className="h-5 w-5 text-ink group-hover:text-copper group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all shrink-0" />
              </div>
            </Link>

            {/* Propositions auto */}
            <Link
              href={`/admin/leads/${lead.reference}/propositions`}
              className="group block p-6 rounded-3xl border border-copper/40 bg-gradient-to-br from-copper/5 to-cream hover:from-copper/10 hover:shadow-lift transition-all"
            >
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-full bg-copper/15 border border-copper/40 grid place-items-center">
                    <Sparkles className="h-5 w-5 text-copper" />
                  </div>
                  <div>
                    <div className="font-display text-xl text-ink">
                      Générer 2-3 propositions automatiques
                    </div>
                    <div className="text-sm text-graphite mt-0.5">
                      Solutions tirées de votre catalogue · avantages/limites · prix indicatifs
                    </div>
                  </div>
                </div>
                <ArrowUpRight className="h-5 w-5 text-copper group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform shrink-0" />
              </div>
            </Link>

            {/* Projet */}
            <div className="p-6 lg:p-8 rounded-3xl border border-ink/10 bg-white shadow-soft">
              <h2 className="font-display text-2xl text-ink mb-6">Projet</h2>
              <dl className="grid sm:grid-cols-2 gap-x-8 gap-y-4 text-sm">
                <Row
                  k={lead.services.length > 1 ? `Projets (${lead.services.length})` : "Type de projet"}
                  v={lead.services.map((s) => LABELS.service[s]).join(" · ")}
                  accent
                />
                <Row k="Bâtiment" v={`${LABELS.building[lead.buildingType]} · ${LABELS.construction[lead.construction]}`} />
                <Row k="Surface" v={`${lead.surface} m²`} />
                <Row k="Énergie actuelle" v={LABELS.energy[lead.currentEnergy]} />
                <Row k="Délai souhaité" v={LABELS.timeline[lead.timeline]} accent={lead.timeline === "urgent"} accentColor={lead.timeline === "urgent" ? "ember" : undefined} />
                <Row k="Budget indicatif" v={LABELS.budget[lead.budget]} />
                <Row k="Canal préféré" v={LABELS.channel[lead.preferredChannel]} />
                <Row k="Source" v={lead.source} />
              </dl>

              {lead.message && (
                <div className="mt-8">
                  <div className="font-mono text-[10px] uppercase tracking-eyebrow text-copper mb-3">
                    Message du client
                  </div>
                  <div className="p-4 rounded-xl bg-cream border border-ink/8 text-sm text-ink whitespace-pre-wrap">
                    {lead.message}
                  </div>
                </div>
              )}
            </div>

            {/* Photos */}
            {lead.photoUrls.length > 0 && (
              <div className="p-6 lg:p-8 rounded-3xl border border-ink/10 bg-white shadow-soft">
                <h2 className="font-display text-2xl text-ink mb-2 flex items-center gap-2">
                  <Camera className="h-5 w-5 text-copper" />
                  Photos jointes ({lead.photoUrls.length})
                </h2>
                <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                  {lead.photoUrls.map((u, i) => (
                    <a
                      key={i}
                      href={u}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="aspect-square rounded-xl overflow-hidden border border-ink/10 bg-stone hover:border-copper/40 transition-colors"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={u} alt="" className="w-full h-full object-cover" />
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Documents attachés */}
            <LeadDocuments reference={lead.reference} />

            {/* Historique transitions de statut */}
            {lead.statusHistory && lead.statusHistory.length > 0 && (
              <div className="p-6 lg:p-8 rounded-3xl border border-ink/10 bg-white shadow-soft">
                <div className="flex items-center gap-2 mb-5">
                  <Clock className="h-5 w-5 text-copper" />
                  <h2 className="font-display text-2xl text-ink">Historique du dossier</h2>
                </div>
                <ol className="relative border-l-2 border-ink/10 pl-6 space-y-5">
                  {/* Soumission initiale */}
                  <li className="relative">
                    <span
                      className="absolute -left-[31px] top-1.5 h-3 w-3 rounded-full bg-copper border-2 border-cream"
                      aria-hidden
                    />
                    <div className="font-mono text-[10px] uppercase tracking-eyebrow text-copper">
                      {new Date(lead.submittedAt).toLocaleString("fr-FR")}
                    </div>
                    <div className="mt-1 text-sm text-ink">
                      Lead créé · statut initial <strong>Nouveau</strong>
                    </div>
                  </li>
                  {lead.statusHistory.map((t, i) => {
                    const fromLabel = STATUSES.find((s) => s.id === t.from)?.label ?? t.from;
                    const toLabel = STATUSES.find((s) => s.id === t.to)?.label ?? t.to;
                    return (
                      <li key={i} className="relative">
                        <span
                          className="absolute -left-[31px] top-1.5 h-3 w-3 rounded-full bg-ink border-2 border-cream"
                          aria-hidden
                        />
                        <div className="font-mono text-[10px] uppercase tracking-eyebrow text-graphite">
                          {new Date(t.at).toLocaleString("fr-FR")}
                        </div>
                        <div className="mt-1 text-sm text-ink flex items-center gap-2 flex-wrap">
                          <span className="text-graphite">{fromLabel}</span>
                          <ArrowRight className="h-3.5 w-3.5 text-copper" />
                          <strong>{toLabel}</strong>
                        </div>
                      </li>
                    );
                  })}
                </ol>
              </div>
            )}

            {/* Discussion équipe */}
            <LeadCommentsBlock reference={lead.reference} />

            {/* Timeline unifié */}
            <LeadTimeline reference={lead.reference} />

            {/* RGPD actions */}
            <RgpdActions reference={lead.reference} />

            {/* Notes internes */}
            <div className="p-6 lg:p-8 rounded-3xl border border-ink/10 bg-white shadow-soft">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-display text-2xl text-ink">Notes internes</h2>
                {savedAt && (
                  <span className="text-xs text-muted font-mono uppercase tracking-eyebrow">
                    Enregistré · {savedAt}
                  </span>
                )}
              </div>
              <textarea
                rows={6}
                value={notesDraft}
                onChange={(e) => setNotesDraft(e.target.value)}
                placeholder="Échanges téléphoniques, contraintes spécifiques, points à clarifier…"
                className="w-full bg-cream border border-ink/12 rounded-xl px-4 py-3.5 text-ink focus:border-copper focus:outline-none focus:ring-2 focus:ring-copper/20 transition-all resize-none"
              />
              <button
                onClick={saveNotes}
                disabled={saving || notesDraft === lead.notes}
                className={cn(
                  "mt-4 inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium transition-all",
                  saving || notesDraft === lead.notes
                    ? "bg-ink/15 text-ink/40 cursor-not-allowed"
                    : "bg-ink text-cream hover:bg-copper",
                )}
              >
                <Save className="h-4 w-4" /> Enregistrer les notes
              </button>
            </div>
          </div>

          {/* SIDEBAR */}
          <div className="lg:col-span-4 space-y-6">
            <div className="p-6 rounded-3xl border border-ink/10 bg-white shadow-soft sticky top-8">
              <div className="flex items-center justify-between mb-4 gap-3">
                <div className="font-mono text-[10px] uppercase tracking-eyebrow text-copper">
                  Statut du dossier
                </div>
                {savedAt && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-mono uppercase tracking-eyebrow text-green-600">
                    ✓ Sauvé · {savedAt}
                  </span>
                )}
              </div>
              {error && (
                <div className="mb-3 px-3 py-2 rounded-lg border border-ember/40 bg-ember/8 text-xs text-ember">
                  {error}
                </div>
              )}
              <div className="grid gap-2">
                {STATUSES.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => updateStatus(s.id)}
                    className={cn(
                      "flex items-center justify-between gap-3 px-4 py-3 rounded-xl border transition-all text-sm",
                      lead.status === s.id
                        ? "border-ink bg-ink/5 text-ink ring-2 ring-ink/15"
                        : "border-ink/10 bg-cream hover:border-copper/40",
                    )}
                  >
                    <span className="flex items-center gap-2">
                      <span
                        className="h-7 w-7 rounded-full grid place-items-center"
                        style={{ background: `${s.color}15`, color: s.color }}
                      >
                        <s.icon className="h-3.5 w-3.5" />
                      </span>
                      {s.label}
                    </span>
                    {lead.status === s.id && (
                      <span className="font-mono text-[10px] uppercase tracking-eyebrow text-copper">
                        Actif
                      </span>
                    )}
                  </button>
                ))}
              </div>

              <div className="mt-6 pt-6 border-t border-ink/8 text-xs text-muted">
                <div className="font-mono uppercase tracking-eyebrow mb-2">RGPD</div>
                {lead.rgpdConsent ? "✓ Consentement explicite reçu" : "⚠ Pas de consentement"}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Row({
  k,
  v,
  accent,
  accentColor,
}: {
  k: string;
  v: string;
  accent?: boolean;
  accentColor?: "copper" | "ember";
}) {
  const color = accentColor === "ember" ? "ember" : "copper";
  return (
    <div>
      <dt className="font-mono text-[10px] uppercase tracking-eyebrow text-muted mb-1">{k}</dt>
      <dd
        className={cn(
          "font-medium",
          accent ? (color === "ember" ? "text-ember" : "text-copper") : "text-ink",
        )}
      >
        {v}
      </dd>
    </div>
  );
}

/* ──────────────── Score lead block ──────────────── */

function ScoreBlock({ lead }: { lead: LeadRecord }) {
  const level = lead.level!;
  const score = lead.score ?? 0;
  const reasons = lead.scoreReasons ?? [];
  const color = LEVEL_COLORS[level];
  const label = LEVEL_LABELS[level];
  return (
    <div
      className="p-6 lg:p-8 rounded-3xl border bg-white shadow-soft"
      style={{ borderColor: `${color}50` }}
    >
      <div className="flex items-start justify-between gap-6 mb-6">
        <div>
          <div className="font-mono text-[10px] uppercase tracking-eyebrow text-muted">
            Score lead
          </div>
          <div className="mt-2 flex items-baseline gap-3">
            <span
              className="font-display text-5xl lg:text-6xl tabular-nums leading-none"
              style={{ color }}
            >
              {score}
            </span>
            <span className="text-base text-muted">/ 100</span>
          </div>
          <div className="mt-3 text-sm text-graphite">
            Heuristique transparente — chaque point est tracé.
          </div>
        </div>
        <span
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-mono uppercase tracking-eyebrow"
          style={{ background: `${color}15`, borderColor: `${color}55`, color }}
        >
          {level === "hot" && (
            <span className="relative flex h-2 w-2">
              <span
                className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-75"
                style={{ background: color }}
              />
              <span
                className="relative inline-flex h-2 w-2 rounded-full"
                style={{ background: color }}
              />
            </span>
          )}
          {label}
        </span>
      </div>

      {/* Barre de progression */}
      <div className="h-2 w-full rounded-full bg-ink/5 overflow-hidden mb-6">
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${score}%`, background: color }}
        />
      </div>

      {reasons.length > 0 && (
        <>
          <div className="font-mono text-[10px] uppercase tracking-eyebrow text-muted mb-3">
            Signaux ({reasons.length})
          </div>
          <ul className="grid sm:grid-cols-2 gap-2">
            {reasons.map((r, i) => (
              <li
                key={i}
                className="flex items-center justify-between gap-3 px-3 py-2 rounded-xl bg-cream border border-ink/8 text-sm"
              >
                <span className="text-ink truncate">{r.label}</span>
                <span
                  className="shrink-0 font-mono text-xs tabular-nums"
                  style={{ color }}
                >
                  +{r.points}
                </span>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
