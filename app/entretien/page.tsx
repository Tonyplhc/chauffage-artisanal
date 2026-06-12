import { ServicePage } from "@/components/service-page";
import { HeroAside } from "@/components/hero-aside";
import { FAQ_ENTRETIEN } from "@/lib/faq-data";
import { COMPARATORS_ENTRETIEN } from "@/lib/comparators";
import { ShieldCheck } from "lucide-react";
import { buildAlternates } from "@/lib/seo-alternates";

export const metadata = {
  title: "Entretien chaudière, PAC, climatisation — Luxembourg",
  description:
    "Contrats d'entretien pour chaudières, pompes à chaleur, climatisation. Maintenance préventive, priorité dépannage, conformité réglementaire.",
  alternates: buildAlternates("/entretien"),
};

export default function EntretienPage() {
  return (
    <ServicePage
      serviceCategory="entretien"
      serviceUrlPath="/entretien"
      number="06"
      eyebrow="Entretien"
      title={
        <>
          L&apos;entretien <em className="not-italic text-bleu">qui empêche la panne</em>, pas celui qui la facture.
        </>
      }
      intro={
        <>
          Contrats d&apos;entretien chaudières, pompes à chaleur et climatisation. <strong className="text-bleu font-semibold">Maintenance préventive</strong>, priorité dépannage, conformité réglementaire.
        </>
      }
      heroImg="/chauffage.jpg"
      aside={
        <HeroAside
          icon={ShieldCheck}
          eyebrow="Périmètre des contrats"
          items={[
            { label: "Chaudières", body: "Gaz condensation, biomasse, fioul" },
            { label: "Pompes à chaleur", body: "Air/eau, géothermie, hybrides" },
            { label: "Climatisation F-Gas", body: "Contrôle étanchéité annuel" },
          ]}
          footnote="Visite annuelle · priorité dépannage · conformité LU"
        />
      }
      metrics={[
        { value: "Annuel", label: "Visite minimum" },
        { value: "Priorité", label: "Clients sous contrat" },
        { value: "Conformité", label: "Réglementaire LU" },
        { value: "Sur devis", label: "Tarification" },
      ]}
      features={[
        {
          title: "Visite annuelle approfondie",
          body: "Analyse de combustion, contrôle des sécurités, nettoyage complet, test des organes mobiles. Rapport remis sur place.",
        },
        {
          title: "Priorité dépannage",
          body: "Les clients sous contrat sont traités en priorité dans le planning. Conditions d'intervention précisées contractuellement.",
        },
        {
          title: "Télémaintenance possible",
          body: "Sur installations connectées, pré-diagnostic à distance avant déplacement, lorsque la technologie le permet.",
        },
        {
          title: "Pièces d'usure selon formule",
          body: "Joints, électrodes d'allumage, filtres, anodes : inclus ou non selon le niveau de contrat choisi. Conditions précisées au devis.",
        },
        {
          title: "Conformité réglementaire",
          body: "Attestation de combustion conforme aux exigences luxembourgeoises, transmise selon la réglementation en vigueur.",
        },
        {
          title: "Conditions transparentes",
          body: "Durée, prix, prestations incluses : tout est précisé au devis. Pas de revalorisation cachée — conditions de révision contractuelles explicites.",
        },
      ]}
      benefits={[
        "Durée de vie de l'équipement préservée par un entretien régulier",
        "Rendement maintenu dans la durée",
        "Conformité légale assurée (obligation annuelle pour certaines puissances)",
        "Détection précoce des dérives avant panne lourde",
        "Garantie constructeur souvent conditionnée à l'entretien annuel",
        "Économies sur durée par rapport à un entretien réactif",
      ]}
      faq={FAQ_ENTRETIEN}
      comparators={COMPARATORS_ENTRETIEN}
      catalog={[
        {
          name: "Formule essentielle",
          tag: "Visite annuelle",
          body: "Visite annuelle, attestation conformité, déplacement dépannage prioritaire. Le minimum pour une chaudière résidentielle.",
        },
        {
          name: "Formule confort",
          tag: "Pièces incluses",
          body: "Visite annuelle, conformité, et pièces d'usure incluses selon liste contractuelle. Notre formule la plus équilibrée.",
        },
        {
          name: "Formule sérénité",
          tag: "Tout compris",
          body: "Toutes les prestations ci-dessus, plus une couverture étendue sur les pièces majeures selon conditions contractuelles.",
        },
        {
          name: "Contrat PAC",
          tag: "Pompe à chaleur",
          body: "Visite annuelle, contrôle F-Gas obligatoire selon charge, diagnostic à distance lorsque l'installation est connectée.",
        },
        {
          name: "Contrat climatisation",
          tag: "F-Gas",
          body: "Contrôle annuel d'étanchéité circuit fluide, nettoyage des batteries, recharge si nécessaire.",
        },
        {
          name: "Contrat tertiaire",
          tag: "Sur mesure",
          body: "Conditions personnalisées pour bureaux, commerces, résidences collectives. Astreinte selon besoin précisé au contrat.",
        },
      ]}
    />
  );
}
