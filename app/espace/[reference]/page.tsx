/**
 * Espace client post-vente — vue lecture seule d'un dossier.
 *
 * Sécurité : token HMAC tied au reference (réutilise lib/recap-token).
 * Le client reçoit le lien dans l'email de confirmation. Il y voit :
 *   - L'état actuel de son dossier (statut + timeline visuelle)
 *   - Le récap de sa demande
 *   - Les prochaines étapes selon le statut
 *   - Comment nous joindre
 *
 * Volontairement sobre — pas de chat, pas d'upload : on est sur du suivi
 * passif. Pour les échanges, on garde l'email/téléphone/WhatsApp.
 */

import { notFound } from "next/navigation";
import Link from "next/link";
import {
  CheckCircle2,
  Circle,
  Phone,
  Mail,
  MessageCircle,
  Printer,
  FileText,
  ArrowUpRight,
} from "lucide-react";
import { getLead } from "@/lib/leads-store";
import { verifyRecapToken } from "@/lib/recap-token";
import { SERVICE_LABELS, type LeadRecord } from "@/lib/devis-schema";
import { getProject, computeProgress } from "@/lib/projects-store";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export const metadata = {
  title: "Suivi de votre dossier · Chauffage Artisanal",
  robots: { index: false, follow: false },
};

const TIMELINE: { id: LeadRecord["status"]; label: string; description: string }[] = [
  {
    id: "nouveau",
    label: "Demande reçue",
    description: "Votre demande est entrée dans notre système.",
  },
  {
    id: "contacte",
    label: "Premier échange",
    description:
      "Notre bureau d'études vous a contacté pour qualifier votre projet.",
  },
  {
    id: "devis_envoye",
    label: "Devis envoyé",
    description: "Le devis détaillé vous a été transmis.",
  },
  {
    id: "converti",
    label: "Projet engagé",
    description: "Bienvenue à bord — le chantier est dans notre planning.",
  },
];

const STATUS_INDEX: Record<LeadRecord["status"], number> = {
  nouveau: 0,
  contacte: 1,
  devis_envoye: 2,
  converti: 3,
  perdu: -1,
};

const TIMELINE_LABELS_FR = {
  urgent: "Urgent (< 2 sem.)",
  court: "Sous 3 mois",
  annee: "Cette année",
  exploration: "Pas de date fixée",
} as const;

const BUDGET_LABELS_FR = {
  less10: "Moins de 10 000 €",
  "10-20": "10 000 – 20 000 €",
  "20-40": "20 000 – 40 000 €",
  "40plus": "Plus de 40 000 €",
  "10-25": "10 000 – 25 000 €",
  "25-50": "25 000 – 50 000 €",
  "50-100": "50 000 – 100 000 €",
  "100plus": "Plus de 100 000 €",
  inconnu: "Non précisé",
} as const;

const CHANNEL_LABELS_FR = {
  phone: "Téléphone",
  email: "Email",
  sms: "SMS",
  whatsapp: "WhatsApp",
} as const;

export default async function EspaceClientPage({
  params,
  searchParams,
}: {
  params: { reference: string };
  searchParams: { t?: string };
}) {
  if (!verifyRecapToken(params.reference, searchParams.t)) notFound();
  const lead = await getLead(params.reference);
  if (!lead) notFound();

  const currentIdx = STATUS_INDEX[lead.status];
  const isLost = lead.status === "perdu";
  const services = lead.services.map((s) => SERVICE_LABELS[s]).join(" · ");
  const firstName = lead.fullName.split(" ")[0] ?? "";

  // Suivi de chantier : uniquement si le lead est converti et qu'un projet
  // a été initié côté admin
  const project =
    lead.status === "converti" ? await getProject(lead.reference) : null;
  const projectProgress = project ? computeProgress(project) : null;

  return (
    <main className="min-h-screen bg-cream py-10 lg:py-16">
      <div className="container max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <div className="font-mono text-[10px] uppercase tracking-eyebrow text-copper">
            Espace client · suivi de dossier
          </div>
          <h1 className="mt-3 font-display text-display-md text-ink tracking-tight">
            Bonjour {firstName}, voici{" "}
            <em className="not-italic text-copper">où en est votre dossier</em>.
          </h1>
          <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-ink/12">
            <FileText className="h-4 w-4 text-copper" />
            <span className="font-mono text-sm text-ink">{lead.reference}</span>
            <span className="text-muted">·</span>
            <span className="text-sm text-graphite">{services}</span>
          </div>
        </div>

        {/* Timeline statut */}
        <div className="rounded-3xl border border-ink/10 bg-white shadow-soft p-6 lg:p-10 mb-6">
          <div className="font-mono text-[10px] uppercase tracking-eyebrow text-copper mb-6">
            État d&apos;avancement
          </div>

          {isLost ? (
            <div className="p-5 rounded-2xl border border-ink/15 bg-cream">
              <div className="font-mono text-[10px] uppercase tracking-eyebrow text-muted">
                Dossier clos
              </div>
              <p className="mt-2 text-ink">
                Votre dossier est actuellement clos. Si vous souhaitez le rouvrir, contactez-nous.
              </p>
            </div>
          ) : (
            <ol className="space-y-5">
              {TIMELINE.map((step, i) => {
                const reached = i <= currentIdx;
                const isCurrent = i === currentIdx;
                return (
                  <li key={step.id} className="flex items-start gap-4">
                    <div className="flex flex-col items-center pt-0.5">
                      {reached ? (
                        <CheckCircle2
                          className={`h-6 w-6 ${isCurrent ? "text-copper" : "text-[#22a06b]"}`}
                          fill={isCurrent ? "rgba(184,106,54,0.15)" : "rgba(34,160,107,0.15)"}
                        />
                      ) : (
                        <Circle className="h-6 w-6 text-ink/20" />
                      )}
                      {i < TIMELINE.length - 1 && (
                        <div
                          className={`mt-1 h-12 w-0.5 ${
                            i < currentIdx ? "bg-[#22a06b]" : "bg-ink/10"
                          }`}
                        />
                      )}
                    </div>
                    <div className="pt-0.5 pb-6 flex-1">
                      <div
                        className={`font-display text-lg ${
                          isCurrent
                            ? "text-copper"
                            : reached
                            ? "text-ink"
                            : "text-muted"
                        }`}
                      >
                        {step.label}
                        {isCurrent && (
                          <span className="ml-2 font-mono text-[10px] uppercase tracking-eyebrow text-copper bg-copper/10 border border-copper/40 px-2 py-0.5 rounded-full">
                            En cours
                          </span>
                        )}
                      </div>
                      <p
                        className={`mt-1 text-sm ${
                          reached ? "text-graphite" : "text-muted"
                        }`}
                      >
                        {step.description}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ol>
          )}
        </div>

        {/* Suivi de chantier (uniquement si converti et projet initié) */}
        {project && projectProgress && (
          <div className="rounded-3xl border border-ink/10 bg-white shadow-soft p-6 lg:p-10 mb-6">
            <div className="font-mono text-[10px] uppercase tracking-eyebrow text-copper mb-2">
              Suivi de votre chantier
            </div>
            <div className="flex items-baseline gap-3 mb-3">
              <span className="font-display text-3xl text-ink tabular-nums">
                {projectProgress.doneCount}/{projectProgress.totalCount}
              </span>
              <span className="text-graphite text-sm">étapes accomplies</span>
            </div>
            <div className="h-2 bg-cream rounded-full overflow-hidden mb-6">
              <div
                className="h-full bg-[#22a06b] rounded-full transition-all"
                style={{ width: `${projectProgress.ratio * 100}%` }}
              />
            </div>
            {projectProgress.currentStep && (
              <div className="mb-5 p-4 rounded-2xl bg-copper/5 border border-copper/30">
                <div className="font-mono text-[10px] uppercase tracking-eyebrow text-copper mb-1">
                  En cours
                </div>
                <div className="font-display text-lg text-ink">
                  {projectProgress.currentStep.title}
                </div>
                {projectProgress.currentStep.description && (
                  <p className="mt-1 text-sm text-graphite">
                    {projectProgress.currentStep.description}
                  </p>
                )}
              </div>
            )}
            <ol className="space-y-3">
              {project.milestones.map((m) => {
                const done = m.status === "done";
                const inProgress = m.status === "in_progress";
                return (
                  <li key={m.id} className="flex items-start gap-3">
                    <div className="pt-0.5">
                      {done ? (
                        <CheckCircle2 className="h-5 w-5 text-[#22a06b]" />
                      ) : inProgress ? (
                        <CheckCircle2 className="h-5 w-5 text-copper" />
                      ) : (
                        <Circle className="h-5 w-5 text-ink/20" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div
                        className={`text-sm font-medium ${
                          done
                            ? "text-graphite"
                            : inProgress
                            ? "text-copper"
                            : "text-ink"
                        }`}
                      >
                        {m.title}
                      </div>
                      <div className="text-xs text-muted mt-0.5">
                        {done && m.completedAt && (
                          <>
                            Terminé le{" "}
                            {new Date(m.completedAt).toLocaleDateString(
                              "fr-FR",
                              { dateStyle: "long" },
                            )}
                          </>
                        )}
                        {!done && m.plannedAt && (
                          <>
                            Prévu pour le{" "}
                            {new Date(m.plannedAt).toLocaleDateString(
                              "fr-FR",
                              { dateStyle: "long" },
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ol>
            {project.notesPublic && (
              <div className="mt-5 p-4 rounded-2xl bg-cream border border-ink/8">
                <div className="font-mono text-[10px] uppercase tracking-eyebrow text-muted mb-1">
                  Note de notre équipe
                </div>
                <p className="text-sm text-ink whitespace-pre-wrap leading-relaxed">
                  {project.notesPublic}
                </p>
              </div>
            )}
            {(project.contactName || project.contactPhone) && (
              <div className="mt-5 p-4 rounded-2xl bg-ink text-cream flex items-center gap-3">
                <div className="font-mono text-[10px] uppercase tracking-eyebrow text-copper">
                  Votre contact dédié
                </div>
                <div className="ml-auto text-right">
                  {project.contactName && (
                    <div className="text-sm font-medium">
                      {project.contactName}
                    </div>
                  )}
                  {project.contactPhone && (
                    <a
                      href={`tel:${project.contactPhone.replace(/\s/g, "")}`}
                      className="text-xs text-copper hover:underline"
                    >
                      {project.contactPhone}
                    </a>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Récap projet */}
        <div className="rounded-3xl border border-ink/10 bg-white shadow-soft p-6 lg:p-10 mb-6">
          <div className="flex items-center justify-between gap-4 mb-5">
            <div className="font-mono text-[10px] uppercase tracking-eyebrow text-copper">
              Votre demande
            </div>
            <Link
              href={`/devis/recap/${lead.reference}?t=${searchParams.t}`}
              className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-eyebrow text-graphite hover:text-copper transition-colors"
            >
              <Printer className="h-3.5 w-3.5" />
              Imprimer / PDF
            </Link>
          </div>
          <dl className="grid sm:grid-cols-2 gap-x-8 gap-y-4 text-sm">
            <Field
              k={lead.services.length > 1 ? `Projets (${lead.services.length})` : "Projet"}
              v={services}
            />
            <Field
              k="Bâtiment"
              v={`${BUILDING_LABELS[lead.buildingType]} · ${CONSTRUCTION_LABELS[lead.construction]}`}
            />
            <Field k="Surface" v={`${lead.surface} m²`} />
            <Field k="Énergie actuelle" v={ENERGY_LABELS[lead.currentEnergy]} />
            <Field k="Commune" v={lead.commune} />
            <Field k="Délai souhaité" v={TIMELINE_LABELS_FR[lead.timeline]} />
            <Field k="Budget indicatif" v={BUDGET_LABELS_FR[lead.budget]} />
            <Field k="Canal préféré" v={CHANNEL_LABELS_FR[lead.preferredChannel]} />
          </dl>
        </div>

        {/* Contact direct */}
        <div className="rounded-3xl border border-copper/30 bg-copper/5 p-6 lg:p-8">
          <div className="font-mono text-[10px] uppercase tracking-eyebrow text-copper mb-3">
            Une question, une précision à apporter ?
          </div>
          <h2 className="font-display text-2xl text-ink tracking-tight">
            Joignez-nous directement.
          </h2>
          <p className="mt-2 text-sm text-graphite">
            Le moyen le plus rapide reste l&apos;appel — mentionnez votre référence{" "}
            <strong className="text-ink">{lead.reference}</strong>.
          </p>
          <div className="mt-5 grid sm:grid-cols-3 gap-2.5">
            <Link
              href="/contact"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-ink text-cream px-5 py-3 text-sm font-medium hover:bg-copper transition-colors"
            >
              <Phone className="h-4 w-4" />
              Appeler
            </Link>
            <Link
              href="/contact"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-white border border-ink/15 text-ink px-5 py-3 text-sm font-medium hover:border-copper hover:text-copper transition-colors"
            >
              <Mail className="h-4 w-4" />
              Email
            </Link>
            <Link
              href="/contact"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-white border border-ink/15 text-ink px-5 py-3 text-sm font-medium hover:border-copper hover:text-copper transition-colors"
            >
              <MessageCircle className="h-4 w-4" />
              WhatsApp
            </Link>
          </div>
        </div>

        <div className="mt-8 text-center">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-mono uppercase tracking-eyebrow text-graphite hover:text-copper transition-colors"
          >
            Retour au site
            <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </main>
  );
}

const BUILDING_LABELS = {
  maison: "Maison individuelle",
  appartement: "Appartement",
  collectif: "Immeuble collectif",
  tertiaire: "Bureaux / tertiaire",
  autre: "Autre type",
} as const;

const CONSTRUCTION_LABELS = {
  neuf: "Construction neuve",
  renovation: "Rénovation",
} as const;

const ENERGY_LABELS = {
  fioul: "Fioul",
  gaz: "Gaz",
  electrique: "Électrique",
  bois: "Bois / pellets",
  pac: "Pompe à chaleur",
  autre: "Autre énergie",
  inconnu: "Inconnue / à préciser",
} as const;

function Field({ k, v }: { k: string; v: string }) {
  return (
    <div>
      <dt className="font-mono text-[10px] uppercase tracking-eyebrow text-muted mb-1">
        {k}
      </dt>
      <dd className="text-ink">{v}</dd>
    </div>
  );
}
