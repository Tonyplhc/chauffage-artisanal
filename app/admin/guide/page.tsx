"use client";

/**
 * Guide utilisateur admin — page imprimable accessible depuis `/admin/guide`.
 *
 * Audience : patron HVAC, non-technicien. Pas de jargon, pas de doc API.
 * On parle workflow métier, pas archi technique.
 *
 * Print : CSS dédié masque la nav, formate proprement pour A4.
 */

import Link from "next/link";
import {
  ArrowLeft,
  Printer,
  Inbox,
  ListChecks,
  FileText,
  Wrench,
  Mail,
  BarChart3,
  ShieldCheck,
  Sparkles,
  PlayCircle,
  Users,
  Building2,
} from "lucide-react";
import { TourLauncher } from "@/components/admin/tour-overlay";

export default function AdminGuidePage() {
  return (
    <div className="min-h-screen bg-cream py-10 lg:py-14 print:bg-white print:py-0">
      <style jsx global>{`
        @media print {
          .print\\:hidden {
            display: none !important;
          }
          .print\\:avoid-break {
            break-inside: avoid;
          }
          .print\\:break-before {
            break-before: page;
          }
          body {
            background: white !important;
          }
          h1,
          h2,
          h3 {
            break-after: avoid;
          }
        }
      `}</style>

      <div className="container max-w-3xl">
        <div className="print:hidden">
          <Link
            href="/admin/leads"
            className="inline-flex items-center gap-2 text-sm font-mono uppercase tracking-eyebrow text-graphite hover:text-copper transition-colors mb-6"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Retour pipeline
          </Link>
        </div>

        <div className="flex items-start justify-between gap-3 flex-wrap mb-8 print:mb-4">
          <div>
            <h1 className="font-display text-display-md text-ink">
              Guide d&apos;utilisation
            </h1>
            <p className="mt-2 text-graphite max-w-2xl">
              Comment utiliser la plateforme au quotidien — sans détour technique.
              Pensé pour le patron qui pilote et l&apos;équipe qui exécute.
            </p>
          </div>
          <button
            onClick={() => window.print()}
            className="print:hidden inline-flex items-center gap-2 bg-ink text-cream px-4 py-2 rounded-full text-sm hover:bg-copper transition-colors"
          >
            <Printer className="h-4 w-4" />
            Imprimer / PDF
          </button>
        </div>

        {/* Lanceur du tour interactif */}
        <div className="print:hidden mb-8 rounded-2xl border border-copper/30 bg-copper/5 p-5 lg:p-6">
          <div className="flex items-start gap-3 mb-3">
            <span className="h-9 w-9 rounded-full grid place-items-center border bg-white border-copper/40 text-copper shrink-0">
              <PlayCircle className="h-4 w-4" />
            </span>
            <div>
              <div className="font-mono text-[10px] uppercase tracking-eyebrow text-copper">
                Découverte guidée
              </div>
              <h2 className="font-display text-xl text-ink">
                Tour interactif en 8 étapes
              </h2>
              <p className="mt-1 text-sm text-graphite leading-relaxed">
                Une visite guidée des fonctionnalités les plus impressionnantes,
                avec navigation automatique entre les pages et points d&apos;intérêt
                surlignés. Vous pouvez l&apos;arrêter à tout moment et reprendre
                où vous en étiez.
              </p>
            </div>
          </div>
          <TourLauncher />
        </div>

        {/* Sommaire */}
        <nav className="rounded-2xl border border-ink/10 bg-white shadow-soft p-5 mb-8 print:avoid-break print:shadow-none">
          <div className="font-mono text-[10px] uppercase tracking-eyebrow text-copper mb-3">
            Sommaire
          </div>
          <ol className="grid lg:grid-cols-2 gap-x-6 gap-y-1.5 text-sm text-graphite list-decimal list-inside">
            <li>Vue d&apos;ensemble — qui fait quoi</li>
            <li>Recevoir et qualifier un lead</li>
            <li>Préparer et envoyer un devis</li>
            <li>Convertir un lead en chantier</li>
            <li>Suivre la facturation et l&apos;entretien</li>
            <li>Communiquer avec les clients</li>
            <li>Piloter avec les tableaux de bord</li>
            <li>Gérer l&apos;équipe et les droits</li>
            <li>Respecter le RGPD au quotidien</li>
            <li>Démarrer une démo (vous ou un prospect)</li>
          </ol>
        </nav>

        {/* 1. Vue d'ensemble */}
        <Section
          icon={Sparkles}
          number="1"
          title="Vue d'ensemble — qui fait quoi"
        >
          <p>
            La plateforme remplit cinq rôles côté entreprise. Vous pouvez en
            activer un ou tous — c&apos;est <strong>vous</strong> qui décidez
            du niveau d&apos;utilisation.
          </p>
          <RoleGrid
            roles={[
              {
                title: "Collecte",
                desc: "Recevoir les demandes de devis depuis le site, par email, ou saisies manuellement.",
              },
              {
                title: "Qualification",
                desc: "Évaluer chaque lead (score automatique, signaux d'urgence, valeur estimée).",
              },
              {
                title: "Commercial",
                desc: "Préparer un devis, le suivre, relancer, encaisser un acompte.",
              },
              {
                title: "Production",
                desc: "Planifier les techniciens, suivre le chantier, déclarer fin de travaux.",
              },
              {
                title: "Après-vente",
                desc: "Contrats d'entretien récurrents, visites annuelles, garanties, SAV.",
              },
            ]}
          />
        </Section>

        {/* 2. Recevoir et qualifier */}
        <Section
          icon={Inbox}
          number="2"
          title="Recevoir et qualifier un lead"
        >
          <h3 className="font-display text-base text-ink mt-3 mb-1">
            D&apos;où viennent les leads
          </h3>
          <ul className="list-disc list-inside space-y-1">
            <li>
              Formulaire <code className="bg-cream px-1 rounded text-xs">/devis</code>{" "}
              du site public (le plus fréquent)
            </li>
            <li>Saisie manuelle dans l&apos;admin (téléphone, salon, recommandation)</li>
            <li>Import en masse via CSV / Excel</li>
          </ul>

          <h3 className="font-display text-base text-ink mt-4 mb-1">
            Ce qu&apos;il faut faire dans les 24 h
          </h3>
          <ol className="list-decimal list-inside space-y-1">
            <li>
              Ouvrir <strong>/admin/leads</strong> et trier par date — les
              nouveaux sont en haut.
            </li>
            <li>
              Cliquer sur la fiche pour voir le résumé qualifié (surface,
              énergie actuelle, budget, timing).
            </li>
            <li>
              Lire le bloc <strong>« Next best action »</strong> — l&apos;outil
              propose la prochaine étape selon le contexte.
            </li>
            <li>
              Passer le statut à <strong>« Contacté »</strong> une fois
              l&apos;échange engagé. L&apos;historique se met à jour
              automatiquement.
            </li>
          </ol>

          <CalloutTip>
            Le <strong>score</strong> (0-100) en haut de chaque fiche n&apos;est
            pas un verdict. C&apos;est un signal qui met en avant les leads
            urgents ou à fort potentiel — utile pour prioriser quand on a
            beaucoup de demandes le même jour.
          </CalloutTip>
        </Section>

        {/* 3. Devis */}
        <Section
          icon={FileText}
          number="3"
          title="Préparer et envoyer un devis"
        >
          <h3 className="font-display text-base text-ink mt-3 mb-1">
            Étapes
          </h3>
          <ol className="list-decimal list-inside space-y-1">
            <li>Ouvrir la fiche lead → cliquer sur le bloc « Devis ».</li>
            <li>
              Choisir un <strong>modèle</strong> dans la bibliothèque (créés
              dans <em>/admin/quote-templates</em>) ou partir de zéro.
            </li>
            <li>
              Ajouter les lignes (produits du catalogue, prestations
              manuelles, remises). Le total HT / TVA / TTC est calculé en direct.
            </li>
            <li>
              Sauvegarder en brouillon, puis cliquer sur <strong>Envoyer</strong>.
              Le statut passe automatiquement à « Devis envoyé ».
            </li>
          </ol>

          <h3 className="font-display text-base text-ink mt-4 mb-1">
            Suivi
          </h3>
          <p>
            La fiche lead montre la date d&apos;envoi, l&apos;ouverture par le
            client (si tracking activé), et l&apos;acceptation éventuelle. Si
            silence après 7 jours, l&apos;outil propose une relance dans
            <strong> « Email suggestions »</strong>.
          </p>

          <CalloutTip>
            Activez le <strong>workflow de validation</strong>
            (<em>/admin/approvals</em>) pour exiger qu&apos;un devis &gt; X €
            soit validé par un responsable avant envoi. Évite les erreurs et
            structure la délégation.
          </CalloutTip>
        </Section>

        {/* 4. Conversion */}
        <Section
          icon={ListChecks}
          number="4"
          title="Convertir un lead en chantier"
        >
          <p>
            Quand le client accepte le devis, vous passez la fiche en{" "}
            <strong>« Converti »</strong>. Cinq choses se déclenchent
            automatiquement :
          </p>
          <ol className="list-decimal list-inside space-y-1 mt-2">
            <li>Le pipeline forecast bascule la valeur en CA réalisé.</li>
            <li>
              Si activé, un email de bienvenue / onboarding chantier part au
              client.
            </li>
            <li>
              Le bloc <strong>« Projet »</strong> apparaît avec des étapes
              à cocher (commande matériel, planification, intervention).
            </li>
            <li>
              Le bloc <strong>« Routing techniciens »</strong> propose 3 techs
              selon compétences et proximité.
            </li>
            <li>
              Le client peut maintenant accéder à son <strong>portail
              client</strong> via un lien sécurisé.
            </li>
          </ol>
        </Section>

        {/* 5. Facturation & entretien */}
        <Section
          icon={Wrench}
          number="5"
          title="Suivre la facturation et l'entretien"
        >
          <h3 className="font-display text-base text-ink mt-3 mb-1">
            Facturation
          </h3>
          <p>
            <em>/admin/invoices</em> — création depuis le devis accepté en un
            clic. Numérotation automatique (FAC-YYYY-NNNN). Statuts :
            brouillon, envoyé, payé, en retard. Les factures payées
            alimentent le rapport « Budgets projets » qui calcule la marge
            brute par chantier.
          </p>

          <h3 className="font-display text-base text-ink mt-4 mb-1">
            Contrats d&apos;entretien
          </h3>
          <p>
            <em>/admin/maintenance</em> — un contrat lie un client à une
            fréquence (annuelle, semestrielle). L&apos;outil planifie
            automatiquement les visites et alerte 30 jours avant échéance.
          </p>

          <h3 className="font-display text-base text-ink mt-4 mb-1">
            Visites
          </h3>
          <p>
            <em>/admin/visits</em> — chaque visite a une check-list type
            adaptée au type d&apos;équipement (chaudière, PAC, climatisation…),
            un compte-rendu, et des photos avant/après.
          </p>
        </Section>

        {/* 6. Communication */}
        <Section
          icon={Mail}
          number="6"
          title="Communiquer avec les clients"
        >
          <h3 className="font-display text-base text-ink mt-3 mb-1">
            Emails
          </h3>
          <p>
            Quatre outils combinés :
          </p>
          <ul className="list-disc list-inside space-y-1">
            <li>
              <strong>Templates</strong> (<em>/admin/templates</em>) :
              accusé de réception, relance, devis, etc.
            </li>
            <li>
              <strong>Snippets</strong> (<em>/admin/snippets</em>) :
              paragraphes courts à coller (réponses fréquentes).
            </li>
            <li>
              <strong>Email suggestions</strong> sur la fiche lead : 3-6
              brouillons contextuels générés à la volée (statut, sentiment,
              ancienneté).
            </li>
            <li>
              <strong>Drip campaigns</strong> (<em>/admin/drip-campaigns</em>) :
              séquences automatiques (ex : 3 emails sur 15 jours après un
              devis sans réponse).
            </li>
          </ul>

          <h3 className="font-display text-base text-ink mt-4 mb-1">
            Newsletter
          </h3>
          <p>
            <em>/admin/newsletter</em> — éditeur simple, envoi planifié,
            statistiques d&apos;ouverture et de clic. Double opt-in obligatoire
            côté formulaire d&apos;inscription.
          </p>
        </Section>

        {/* 7. Pilotage */}
        <Section
          icon={BarChart3}
          number="7"
          title="Piloter avec les tableaux de bord"
        >
          <p>
            Vous avez <strong>une dizaine</strong> de tableaux de bord. Au début,
            consacrez 10 minutes par semaine à ces trois-là :
          </p>
          <ol className="list-decimal list-inside space-y-1 mt-2">
            <li>
              <strong>Pipeline pondéré</strong> (<em>/admin/pipeline/value</em>) — qu&apos;est-ce qui rentre ? Combien vaut-il en pondéré ?
            </li>
            <li>
              <strong>SLA tracker</strong> (<em>/admin/sla</em>) — combien de
              temps mettons-nous à répondre ?
            </li>
            <li>
              <strong>ROI marketing</strong> (<em>/admin/marketing-roi</em>) —
              chaque euro investi rapporte combien ?
            </li>
          </ol>

          <p className="mt-3">
            Plus tard, explorez le <strong>forecast saisonnier</strong>, la
            <strong> heatmap géographique</strong> et le{" "}
            <strong>pricing intelligence</strong>. Ils deviennent vraiment
            utiles après <em>plusieurs mois</em> de données.
          </p>

          <CalloutTip>
            Activez les <strong>objectifs mensuels</strong>
            (<em>/admin/goals</em>) pour gamifier l&apos;équipe : nombre de
            leads, conversions, CA. Visibles sur le dashboard.
          </CalloutTip>
        </Section>

        {/* 8. Équipe */}
        <Section
          icon={Users}
          number="8"
          title="Gérer l'équipe et les droits"
        >
          <p>
            <em>/admin/users</em> — créez un compte par collaborateur avec
            un rôle (admin, commercial, technicien). Chacun voit ce qui le
            concerne. L&apos;activité est tracée dans le journal d&apos;audit
            (<em>/admin/activity</em>).
          </p>
          <p className="mt-2">
            Activez le <strong>2FA</strong> (<em>/admin/2fa</em>) sur au moins
            les comptes admin — code à 6 chiffres via Google Authenticator.
          </p>

          <CalloutTip>
            Vous pouvez gérer plusieurs <strong>marques</strong> sur la même
            base (<em>/admin/tenants</em>) — utile si vous avez un groupe ou
            une activité distincte (ex : photovoltaïque sous une autre marque).
          </CalloutTip>
        </Section>

        {/* 9. RGPD */}
        <Section
          icon={ShieldCheck}
          number="9"
          title="Respecter le RGPD au quotidien"
        >
          <p>
            Trois choses à faire systématiquement :
          </p>
          <ol className="list-decimal list-inside space-y-1 mt-2">
            <li>
              <strong>Demande d&apos;accès</strong> d&apos;un client → bouton{" "}
              <em>Export RGPD</em> sur la fiche → JSON complet téléchargé.
            </li>
            <li>
              <strong>Demande d&apos;effacement</strong> → bouton{" "}
              <em>Supprimer (RGPD)</em>. Les données du lead sont effacées ;
              les factures sont conservées (obligation comptable 10 ans) en
              anonymisant le client quand le délai légal est échu.
            </li>
            <li>
              Une fois par an, ouvrir <em>/admin/rgpd</em> → revue du registre
              des traitements + recommandations (leads anciens à purger,
              etc.). Imprimer pour archive.
            </li>
          </ol>
        </Section>

        {/* 10. Démo */}
        <Section
          icon={PlayCircle}
          number="10"
          title="Démarrer une démo (pour vous ou un prospect)"
          breakBefore
        >
          <p>
            Pour explorer l&apos;outil avec des données réalistes sans toucher
            à vos vrais leads :
          </p>
          <ol className="list-decimal list-inside space-y-1 mt-2">
            <li>
              Allez sur <em>/admin/onboarding</em>.
            </li>
            <li>
              Cliquez sur <strong>« Générer 80 leads démo »</strong> dans le
              bloc « Données de démonstration ».
            </li>
            <li>
              Les leads démo apparaissent dans le pipeline avec une référence
              préfixée <code className="bg-cream px-1 rounded text-xs">DEV-SEED-</code>{" "}
              — impossible de les confondre avec de vrais leads.
            </li>
            <li>
              Quand vous avez fini, cliquez sur{" "}
              <strong>« Supprimer les leads démo »</strong> pour tout nettoyer.
            </li>
          </ol>
        </Section>

        {/* Footer */}
        <div className="mt-8 pt-6 border-t border-ink/10 text-xs text-muted">
          <p>
            Ce guide évolue avec le produit. Pour toute question, contactez
            l&apos;équipe support — vous trouverez l&apos;adresse dans les
            paramètres de marque (<em>/admin/brand</em>).
          </p>
          <p className="mt-2 print:hidden">
            Cette page est conçue pour être imprimée ou exportée en PDF via le
            bouton en haut à droite.
          </p>
        </div>
      </div>
    </div>
  );
}

function Section({
  icon: Icon,
  number,
  title,
  children,
  breakBefore,
}: {
  icon: typeof Inbox;
  number: string;
  title: string;
  children: React.ReactNode;
  breakBefore?: boolean;
}) {
  return (
    <section
      className={`rounded-2xl border border-ink/10 bg-white shadow-soft p-5 lg:p-6 mb-6 print:shadow-none print:avoid-break ${
        breakBefore ? "print:break-before" : ""
      }`}
    >
      <div className="flex items-start gap-3 mb-3">
        <span className="h-9 w-9 rounded-full grid place-items-center border bg-copper/10 border-copper/30 text-copper shrink-0">
          <Icon className="h-4 w-4" />
        </span>
        <div>
          <div className="font-mono text-[10px] uppercase tracking-eyebrow text-muted">
            Chapitre {number}
          </div>
          <h2 className="font-display text-xl text-ink">{title}</h2>
        </div>
      </div>
      <div className="text-sm text-graphite leading-relaxed space-y-2 pl-12 print:pl-0">
        {children}
      </div>
    </section>
  );
}

function RoleGrid({
  roles,
}: {
  roles: { title: string; desc: string }[];
}) {
  return (
    <div className="grid lg:grid-cols-2 gap-3 mt-3">
      {roles.map((r) => (
        <div
          key={r.title}
          className="rounded-xl bg-cream/40 p-3 print:bg-white print:border print:border-ink/10"
        >
          <div className="font-mono text-[10px] uppercase tracking-eyebrow text-copper">
            {r.title}
          </div>
          <div className="text-xs text-graphite mt-1">{r.desc}</div>
        </div>
      ))}
    </div>
  );
}

function CalloutTip({ children }: { children: React.ReactNode }) {
  return (
    <div className="mt-3 rounded-xl bg-copper/5 border border-copper/20 px-4 py-3 text-xs text-graphite print:bg-white">
      <span className="font-mono text-[10px] uppercase tracking-eyebrow text-copper mr-2">
        Astuce
      </span>
      {children}
    </div>
  );
}
