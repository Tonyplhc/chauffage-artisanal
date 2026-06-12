import Link from "next/link";
import {
  ArrowUpRight,
  Phone,
  Eye,
  ClipboardCheck,
  FileText,
  Sparkles,
  Wrench,
  ShieldCheck,
  Settings,
  HeartHandshake,
} from "lucide-react";
import { Eyebrow, SectionTitle } from "@/components/ui";
import { COMPANY } from "@/lib/company-info";
import { buildAlternates } from "@/lib/seo-alternates";

export const metadata = {
  title:
    "Notre processus — Méthode 8 étapes pour un projet HVAC au Luxembourg",
  description:
    "De la première visite à la mise en service et au SAV : les 8 étapes réelles de notre méthode de travail. Conforme RGD luxembourgeois, accompagnement Klimabonus, réception SCRB.",
  alternates: buildAlternates("/processus"),
};

const STEPS = [
  {
    n: "01",
    icon: Phone,
    title: "Premier contact (sous 24h)",
    body: "Vous nous appelez ou remplissez le formulaire devis en ligne. Sous 24h ouvrées, un de nos techniciens vous rappelle pour qualifier votre projet : besoin réel, contraintes principales, planning souhaité. Pas de pression commerciale — un échange technique.",
    deliverables: [
      "Cadrage initial téléphonique 15-20 min",
      "Premiers éléments de fourchette budgétaire",
      "Planification visite technique",
    ],
  },
  {
    n: "02",
    icon: Eye,
    title: "Visite technique sur place (gratuite)",
    body: "Notre bureau d'études se déplace pour évaluer le bâti, les contraintes (accès, copropriété, patrimoine, isolation), mesurer les débits et puissances. C'est cette visite qui permet de proposer une solution réaliste — sans elle, tout devis est fragile.",
    deliverables: [
      "Inspection complète des installations existantes",
      "Photos et croquis des points clés",
      "Premier diagnostic isolation et émetteurs",
      "Vérification du seuil 10 ans pour aides éligibles",
    ],
  },
  {
    n: "03",
    icon: ClipboardCheck,
    title: "Étude technique en bureau (sous 1 semaine)",
    body: "Bilan thermique, dimensionnement, choix des équipements, simulation Klimabonus, comparaison de 2 marques quand pertinent. Pas de copier-coller — chaque dossier est unique et l'étude prend le temps qu'elle mérite.",
    deliverables: [
      "Bilan thermique précis (kWh/an, puissance utile)",
      "Choix équipements + 2 marques comparées",
      "Estimation Klimabonus + aides communales",
      "Note de calcul TVA 3 % logement",
    ],
  },
  {
    n: "04",
    icon: FileText,
    title: "Devis détaillé poste par poste",
    body: "Devis ligne par ligne : équipement principal, pose, raccordements, accessoires, services. Pas de poste « divers » flou. Validité 30 jours, prix fermes. Si vous comparez avec un autre devis, vous pouvez aller au détail sans ambiguïté.",
    deliverables: [
      "PDF lisible avec hypothèses transparentes",
      "Décomposition équipement / pose / accessoires",
      "Mention TVA 3 % si éligible",
      "Conditions de garantie constructeur + pose",
    ],
  },
  {
    n: "05",
    icon: Sparkles,
    title: "Dossier Klimabonus accompagné",
    body: "Une fois le devis signé, nous préparons les fiches techniques, schémas et attestations nécessaires à votre dossier Klimabonus. Vous gardez le dossier administratif à votre nom (déposé sur MyGuichet.lu) — nous fournissons la partie technique conforme aux exigences 2026.",
    deliverables: [
      "Fiches produits + numéros de série",
      "Schémas hydraulique et électrique",
      "Attestation installateur (Autorisation établissement)",
      "Notice d'attente accord de principe MyGuichet.lu",
    ],
  },
  {
    n: "06",
    icon: Wrench,
    title: "Pose et installation",
    body: "Chantier planifié, communiqué semaine par semaine, photos quotidiennes si besoin, protection des sols, nettoyage de fin de poste. Techniciens habilités fluides frigorigènes cat I quand applicable. Pour les chantiers > 1 semaine, point hebdomadaire client.",
    deliverables: [
      "Planning détaillé communiqué",
      "Photos avancement quotidien (optionnel)",
      "Tests d'étanchéité, équilibrage hydraulique",
      "Mise en service avec analyse combustion",
    ],
  },
  {
    n: "07",
    icon: ShieldCheck,
    title: "Réception conforme SCRB / déclaration",
    body: "Pour les installations gaz, demande de réception SCRB (Chambre des Métiers) déposée dans les 4 semaines suivant la mise en service — c'est notre responsabilité légale (RGD 27 février 2010). Pour la climatisation, déclaration annuelle d'étanchéité avant le 31 mars suivant l'année d'installation.",
    deliverables: [
      "Demande de réception SCRB déposée",
      "Procès-verbal de mise en service signé",
      "Notice d'usage remise au client",
      "Carnet d'entretien initialisé",
    ],
  },
  {
    n: "08",
    icon: HeartHandshake,
    title: "Contrat d'entretien + SAV long terme",
    body: "Le projet ne s'arrête pas à la mise en service. Souscription au contrat d'entretien (recommandé pour préserver la garantie constructeur), rappel automatique annuel, intervention prioritaire sur les pannes. Astreinte 24/7 hors horaires de bureau.",
    deliverables: [
      "Contrat d'entretien adapté (Essentiel / Confort / Sérénité)",
      "Rappel automatique visite annuelle",
      "Priorité dépannage (vs. non-contrats)",
      "Suivi des évolutions réglementaires HVAC",
    ],
  },
];

const KEY_PRINCIPLES = [
  {
    icon: Settings,
    title: "Étude personnalisée systématique",
    body: "Pas de devis sans visite technique sur les chantiers significatifs. Le bilan thermique conditionne tout le reste.",
  },
  {
    icon: ShieldCheck,
    title: "Conformité réglementaire intégrée",
    body: "Réception SCRB, attestation fluides cat I, déclaration étanchéité — pas en option, dans la prestation.",
  },
  {
    icon: Sparkles,
    title: "Klimabonus accompagné",
    body: "Volet technique pris en charge, accord de principe vérifié AVANT signature, conditions transverses rappelées.",
  },
];

export default function ProcessusPage() {
  return (
    <>
      {/* Hero */}
      <section className="relative pt-12 lg:pt-16 pb-10 lg:pb-12 bg-creme border-b border-pierre overflow-hidden">
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 20% 30%, rgba(11,87,160,0.35), transparent 55%), radial-gradient(circle at 80% 70%, rgba(11,87,160,0.18), transparent 55%)",
          }}
        />
        <div className="container relative">
          <div className="max-w-3xl">
            <Eyebrow number="00">Notre méthode</Eyebrow>
            <h1 className="mt-4 font-display text-display-xl tracking-tightest text-balance text-anthra">
              De votre appel à votre confort —{" "}
              <em className="not-italic text-bleu">8 étapes</em>, zéro improvisation.
            </h1>
            <p className="mt-5 text-lg lg:text-xl text-taupe leading-relaxed text-balance">
              {COMPANY.shortName} travaille depuis {new Date().getFullYear() - COMPANY.foundedYear} ans
              au Luxembourg. Cette méthode est ce qui sépare un chantier réussi d&apos;un
              chantier qui dépasse les délais ou les budgets. Aucune étape n&apos;est sautée.
            </p>
          </div>
        </div>
      </section>

      {/* Principles transverses */}
      <section className="py-12 bg-creme border-b border-pierre">
        <div className="container">
          <div className="grid md:grid-cols-3 gap-5">
            {KEY_PRINCIPLES.map((p) => (
              <div
                key={p.title}
                className="flex items-start gap-3 p-5 rounded-2xl border border-bleu/30 bg-white"
              >
                <span className="grid place-items-center h-10 w-10 rounded-full bg-bleu/12 border border-bleu/30 shrink-0">
                  <p.icon className="h-5 w-5 text-bleu" />
                </span>
                <div className="min-w-0">
                  <div className="font-display text-base text-anthra tracking-tight">
                    {p.title}
                  </div>
                  <div className="mt-1 text-sm text-taupe leading-relaxed">
                    {p.body}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Timeline 8 étapes */}
      <section className="py-14 lg:py-20 bg-creme">
        <div className="container">
          <div className="max-w-3xl mb-10">
            <Eyebrow number="01">Les 8 étapes</Eyebrow>
            <SectionTitle className="mt-4">
              Chronologie <em className="not-italic text-bleu">détaillée</em>.
            </SectionTitle>
          </div>

          <div className="space-y-5">
            {STEPS.map((s) => (
              <article
                key={s.n}
                className="grid lg:grid-cols-12 gap-6 p-6 lg:p-8 rounded-3xl border border-pierre bg-white hover:border-bleu/30 transition-colors"
              >
                <div className="lg:col-span-4 flex items-start gap-4">
                  <span className="grid place-items-center h-12 w-12 rounded-2xl bg-bleu/12 border border-bleu/30 shrink-0">
                    <s.icon className="h-5 w-5 text-bleu" />
                  </span>
                  <div className="min-w-0">
                    <div className="font-mono text-[10px] uppercase tracking-eyebrow text-bleu">
                      Étape {s.n}
                    </div>
                    <h2 className="mt-1 font-display text-2xl text-anthra tracking-tight">
                      {s.title}
                    </h2>
                  </div>
                </div>
                <div className="lg:col-span-8">
                  <p className="text-taupe leading-relaxed">{s.body}</p>
                  <div className="mt-5">
                    <div className="font-mono text-[10px] uppercase tracking-eyebrow text-bleu mb-2">
                      Livrables
                    </div>
                    <ul className="grid sm:grid-cols-2 gap-x-4 gap-y-1.5">
                      {s.deliverables.map((d, i) => (
                        <li
                          key={i}
                          className="text-sm text-taupe flex items-start gap-2"
                        >
                          <span className="text-bleu mt-0.5">•</span>
                          <span>{d}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 lg:py-20 bg-navy text-creme">
        <div className="container text-center max-w-3xl mx-auto">
          <div className="font-mono text-[11px] uppercase tracking-eyebrow text-sable">
            Lancer l&apos;étape 1
          </div>
          <h2 className="mt-4 font-display text-display-lg tracking-tightest text-balance">
            On commence par votre{" "}
            <em className="not-italic text-sable">premier contact</em>.
          </h2>
          <p className="mt-5 text-creme/75 text-lg leading-relaxed">
            Le formulaire en ligne ou un appel direct — vous nous décrivez votre projet, on
            cadre l&apos;étape suivante.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/devis"
              className="inline-flex items-center gap-2 rounded-full bg-creme text-navy px-7 py-4 text-sm font-medium hover:bg-bleu hover:text-creme transition-colors group"
            >
              Demander un devis
              <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </Link>
            <a
              href={`tel:${COMPANY.phone.tel}`}
              className="inline-flex items-center gap-2 rounded-full bg-terracotta/15 border border-terracotta/40 text-creme px-7 py-4 text-sm font-medium hover:bg-terracotta/25 transition-colors"
            >
              <Phone className="h-4 w-4" />
              {COMPANY.phone.display}
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
