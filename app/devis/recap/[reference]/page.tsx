/**
 * Récap public du devis — accessible via lien tokenisé envoyé dans l'email
 * client. Lecture seule, imprimable (Ctrl+P → PDF).
 *
 * Sécurité : token HMAC tied au reference. Pas d'accès admin.
 * Toute requête sans token valide → 404 (on n'indique pas que le lead existe).
 */

import { notFound } from "next/navigation";
import Link from "next/link";
import { getLead } from "@/lib/leads-store";
import { verifyRecapToken } from "@/lib/recap-token";
import { SERVICE_LABELS } from "@/lib/devis-schema";
import { RecapPrint } from "./recap-print";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export const metadata = {
  title: "Récap de votre demande de devis · Chauffage Artisanal",
  robots: { index: false, follow: false },
};

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

const TIMELINE_LABELS = {
  urgent: "Urgent (< 2 semaines)",
  court: "Sous 3 mois",
  annee: "Cette année",
  exploration: "Pas de date fixée",
} as const;

const BUDGET_LABELS = {
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

const CHANNEL_LABELS = {
  phone: "Appel téléphonique",
  email: "Email",
  sms: "SMS",
  whatsapp: "WhatsApp",
} as const;

export default async function RecapPage({
  params,
  searchParams,
}: {
  params: { reference: string };
  searchParams: { t?: string };
}) {
  if (!verifyRecapToken(params.reference, searchParams.t)) {
    notFound();
  }
  const lead = await getLead(params.reference);
  if (!lead) notFound();

  const services = lead.services.map((s) => SERVICE_LABELS[s]).join(" · ");
  const submitted = new Date(lead.submittedAt).toLocaleString("fr-FR", {
    dateStyle: "long",
    timeStyle: "short",
  });

  return (
    <main className="min-h-screen bg-cream py-12 lg:py-16 print:bg-white print:py-0">
      <div className="container max-w-3xl">
        {/* Toolbar — masquée à l'impression */}
        <div className="flex items-center justify-between gap-4 mb-8 print:hidden">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-mono uppercase tracking-eyebrow text-graphite hover:text-copper transition-colors"
          >
            ← Retour au site
          </Link>
          <RecapPrint />
        </div>

        {/* Carte récap */}
        <article className="bg-white rounded-3xl border border-ink/10 shadow-soft overflow-hidden print:border-0 print:shadow-none print:rounded-none">
          {/* Header sombre */}
          <header className="bg-charcoal text-cream px-8 py-10 print:bg-white print:text-ink">
            <div className="font-mono text-[10px] uppercase tracking-eyebrow text-copper">
              Chauffage Artisanal · Luxembourg
            </div>
            <h1 className="mt-3 font-display text-3xl lg:text-4xl tracking-tight">
              Récapitulatif de votre demande de devis
            </h1>
            <div className="mt-5 flex items-baseline gap-6 flex-wrap">
              <div>
                <div className="font-mono text-[10px] uppercase tracking-eyebrow text-cream/60 print:text-muted">
                  Référence
                </div>
                <div className="mt-1 font-mono text-lg text-copper">{lead.reference}</div>
              </div>
              <div>
                <div className="font-mono text-[10px] uppercase tracking-eyebrow text-cream/60 print:text-muted">
                  Soumis le
                </div>
                <div className="mt-1 text-base text-cream print:text-ink">{submitted}</div>
              </div>
            </div>
          </header>

          {/* Corps */}
          <div className="px-8 py-8 space-y-8">
            <Section title="Votre projet">
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
              <Field k="Délai souhaité" v={TIMELINE_LABELS[lead.timeline]} />
              <Field k="Budget indicatif" v={BUDGET_LABELS[lead.budget]} />
              <Field k="Photos jointes" v={`${lead.photoUrls.length}`} />
            </Section>

            <Section title="Vos coordonnées">
              <Field k="Nom" v={lead.fullName} />
              <Field k="Email" v={lead.email} />
              <Field k="Téléphone" v={lead.phone} />
              <Field k="Canal préféré" v={CHANNEL_LABELS[lead.preferredChannel]} />
            </Section>

            {lead.message && (
              <Section title="Votre message">
                <div className="p-5 rounded-2xl bg-cream border border-ink/8 text-sm text-ink leading-relaxed whitespace-pre-wrap">
                  {lead.message}
                </div>
              </Section>
            )}

            <Section title="Suite donnée">
              <p className="text-sm text-graphite leading-relaxed">
                Notre bureau d&apos;études analyse votre dossier. Nous vous
                recontacterons via{" "}
                <strong className="text-ink">
                  {CHANNEL_LABELS[lead.preferredChannel].toLowerCase()}
                </strong>{" "}
                sous 4 heures ouvrées avec une première réponse.
              </p>
              <p className="mt-3 text-sm text-graphite leading-relaxed">
                Pour ajouter une information ou modifier votre demande, vous
                pouvez répondre directement à l&apos;email de confirmation ou
                nous contacter via la page contact du site.
              </p>
            </Section>
          </div>

          {/* Footer */}
          <footer className="bg-linen border-t border-ink/8 px-8 py-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 print:bg-white">
            <div className="font-mono text-[10px] uppercase tracking-eyebrow text-muted">
              Document généré automatiquement · à conserver
            </div>
            <div className="font-mono text-[10px] uppercase tracking-eyebrow text-muted">
              chauffage-artisanal.lu · Luxembourg
            </div>
          </footer>
        </article>

        <p className="mt-6 text-center text-xs text-muted print:hidden">
          Pour conserver une copie PDF, utilisez l&apos;option «&nbsp;Imprimer&nbsp;»
          ci-dessus et sélectionnez «&nbsp;Enregistrer au format PDF&nbsp;».
        </p>
      </div>
    </main>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="font-display text-xl text-ink mb-4 pb-2 border-b border-ink/8">
        {title}
      </h2>
      <dl className="grid sm:grid-cols-2 gap-x-8 gap-y-3 text-sm">{children}</dl>
    </section>
  );
}

function Field({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex flex-col">
      <dt className="font-mono text-[10px] uppercase tracking-eyebrow text-muted">
        {k}
      </dt>
      <dd className="mt-1 text-ink">{v}</dd>
    </div>
  );
}
