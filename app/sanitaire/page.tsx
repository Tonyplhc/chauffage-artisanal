import { ServicePage } from "@/components/service-page";
import { HeroAside } from "@/components/hero-aside";
import { FAQ_SANITAIRE } from "@/lib/faq-data";
import { COMPARATORS_SANITAIRE } from "@/lib/comparators";
import { Droplets } from "lucide-react";
import { buildAlternates } from "@/lib/seo-alternates";

export const metadata = {
  title: "Sanitaire Luxembourg — Salles de bain, plomberie, traitement de l'eau",
  description:
    "Sanitaire et salles de bain haut de gamme au Luxembourg. Rénovations clé en main, plomberie complète, traitement de l'eau.",
  alternates: buildAlternates("/sanitaire"),
};

export default function SanitairePage() {
  return (
    <ServicePage
      serviceCategory="sanitaire"
      serviceUrlPath="/sanitaire"
      number="04"
      eyebrow="Sanitaire"
      title={
        <>
          La salle de bain comme <em className="not-italic text-bleu">une pièce architecturée</em>
          , pas comme un poste technique.
        </>
      }
      intro={
        <>
          Salles de bain haut de gamme, plomberie complète, traitement de l&apos;eau. Rénovations clé en main, <strong className="text-bleu font-semibold">en lien avec les architectes</strong> lorsque le projet le demande.
        </>
      }
      heroImg="/sanitaire.jpg"
      aside={
        <HeroAside
          icon={Droplets}
          eyebrow="Périmètre couvert"
          items={[
            { label: "Salles de bain premium", body: "Travail en lien avec architectes" },
            { label: "Plomberie complète", body: "Réseaux PEX-AL-PEX ou cuivre" },
            { label: "Traitement de l'eau", body: "Adoucisseurs, osmose, filtration" },
          ]}
          footnote="Étanchéité PV · coordination chantier soignée"
        />
      }
      metrics={[
        { value: "Architecte", label: "Travail avec votre équipe" },
        { value: "Étanchéité", label: "Méthode soignée" },
        { value: "Marques", label: "Premium à indicatif" },
        { value: "SAV", label: "Engagement durable" },
      ]}
      features={[
        {
          title: "Avec votre architecte",
          body: "Nous travaillons sous contrainte design : intégration des arrivées et évacuations, respect des choix esthétiques, coordination avec carreleurs et menuisiers.",
        },
        {
          title: "Étanchéité au PV",
          body: "Système d'étanchéité sous carrelage selon les règles de l'art, vérifié au procès-verbal avant pose des revêtements.",
        },
        {
          title: "Robinetterie & sanitaires",
          body: "Sélection parmi les fabricants reconnus — Dornbracht, Hansgrohe, Vola, Duravit, Toto et autres — selon design et budget du projet.",
        },
        {
          title: "Traitement de l'eau",
          body: "Adoucisseurs, filtration anti-calcaire, osmose inverse pour eau de boisson. Études TH/TAC réalisées sur place avant proposition.",
        },
        {
          title: "Plomberie générale",
          body: "Réseaux PEX-AL-PEX ou cuivre selon contexte. Identification des nourrices, plans réseau remis en fin de chantier.",
        },
        {
          title: "Chauffage de la pièce",
          body: "Plancher chauffant basse température, sèche-serviettes, thermostat horaire — pour que la pièce soit chaude quand vous y entrez.",
        },
      ]}
      benefits={[
        "Coordination chantier — un seul interlocuteur",
        "Garanties applicables selon réglementation et fabricant",
        "Disponibilité pièces sur la durée selon marque retenue",
        "Eau de qualité boisson possible directement au robinet (osmose)",
        "Économies d'eau via robinetterie économique",
        "Confort thermique homogène pièce par pièce",
      ]}
      faq={FAQ_SANITAIRE}
      comparators={COMPARATORS_SANITAIRE}
      catalog={[
        {
          name: "Robinetterie design premium",
          tag: "Architecte",
          body: "Sélection parmi les fabricants reconnus pour les projets d'architecte. Finitions chrome, platine, cuivre brossé, noir mat.",
        },
        {
          name: "Sanitaire suspendu",
          tag: "Lignes pures",
          body: "Lavabos et WC suspendus, céramique fine. Gamme cohérente complète à choisir avec votre prescripteur.",
        },
        {
          name: "Receveur extra-plat",
          tag: "Douche italienne",
          body: "Receveur acier émaillé ou résine de synthèse selon projet. Antidérapant, résistant, intégration au sol.",
        },
        {
          name: "WC lavant",
          tag: "Premium japonais",
          body: "WC avec fonctions lavantes. Confort et hygiène — solution premium pour clients exigeants.",
        },
        {
          name: "Adoucisseur connecté",
          tag: "Traitement de l'eau",
          body: "Gestion intelligente du sel, suivi de consommation. Eau parfaitement calibrée pour vos installations et votre confort.",
        },
        {
          name: "Plancher chauffant SdB",
          tag: "Confort thermique",
          body: "Solution basse température, intégrée au plancher carrelé. Pilotage indépendant possible.",
        },
      ]}
    />
  );
}
