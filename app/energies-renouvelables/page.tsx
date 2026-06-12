import { ServicePage } from "@/components/service-page";
import { HeroAside } from "@/components/hero-aside";
import { PVAutoconsumptionCalculator } from "@/components/pv-autoconsumption-calculator";
import { FAQ_ENR } from "@/lib/faq-data";
import { COMPARATORS_ENR } from "@/lib/comparators";
import { Sun } from "lucide-react";
import { buildAlternates } from "@/lib/seo-alternates";

export const metadata = {
  title: "Énergies renouvelables Luxembourg — Solaire, PAC, hybride",
  description:
    "Solaire thermique, photovoltaïque, pompes à chaleur, stockage batterie. Audit énergétique et accompagnement transition au Luxembourg.",
  alternates: buildAlternates("/energies-renouvelables"),
};

export default function EnRPage() {
  return (
    <ServicePage
      serviceCategory="enr"
      serviceUrlPath="/energies-renouvelables"
      number="07"
      eyebrow="Énergies renouvelables"
      title={
        <>
          Une transition énergétique <em className="not-italic text-bleu">à votre rythme</em>, sur dossier.
        </>
      }
      intro={
        <>
          Solaire thermique, photovoltaïque couplé pompe à chaleur, stockage batterie. <strong className="text-bleu font-semibold">Audit du bâtiment</strong> et trajectoire d&apos;investissement par étapes.
        </>
      }
      heroImg="https://images.pexels.com/photos/433308/pexels-photo-433308.jpeg?auto=compress&w=2400"
      aside={
        <HeroAside
          icon={Sun}
          eyebrow="Technologies couvertes"
          items={[
            { label: "Photovoltaïque", body: "Résidentiel & tertiaire, auto-consommation" },
            { label: "Solaire thermique", body: "ECS et appoint chauffage" },
            { label: "Stockage batterie", body: "Lithium, pilotage selon tarifs" },
          ]}
          footnote="Audit énergétique · plan par étapes · Klimabonus"
        />
      }
      metrics={[
        { value: "Audit", label: "Avant proposition" },
        { value: "Plan", label: "Étapes raisonnées" },
        { value: "Klimabonus", label: "Aides intégrées" },
        { value: "Long terme", label: "Vision 10+ ans" },
      ]}
      features={[
        {
          title: "Audit énergétique",
          body: "Bilan thermique, analyse de votre profil de consommation, étude d'orientation et d'ombrage. Pas de proposition sans diagnostic préalable.",
        },
        {
          title: "Plan par étapes",
          body: "Tout faire d'un coup n'est ni nécessaire ni toujours optimal. Nous proposons une trajectoire raisonnée selon votre budget et vos priorités.",
        },
        {
          title: "Photovoltaïque calibré",
          body: "Modules haut rendement, micro-onduleurs ou onduleur central selon contexte. Conditions de garantie selon fabricant retenu.",
        },
        {
          title: "Couplage PAC + PV",
          body: "Optimisation auto-consommation : la PAC tourne quand le PV produit. Économies cumulées supérieures aux deux installations séparées.",
        },
        {
          title: "Stockage intelligent",
          body: "Batteries lithium selon technologie, pilotage en fonction des tarifs électricité. Conditions et durée de garantie selon fabricant.",
        },
        {
          title: "Klimabonus & démarches",
          body: "Accompagnement technique des dossiers de prime Luxembourg (Klimabonus + dispositifs communaux le cas échéant). Conditions évolutives à vérifier.",
        },
      ]}
      benefits={[
        "Réduction de la dépendance aux énergies fossiles",
        "Valorisation immobilière possible (amélioration classe énergétique)",
        "Production locale d'énergie, traçabilité",
        "Compatibilité possible avec véhicule électrique",
        "Impact carbone réduit dans la durée",
        "Trajectoire d'investissement adaptable",
      ]}
      faq={FAQ_ENR}
      comparators={COMPARATORS_ENR}
      extraBlocks={<PVAutoconsumptionCalculator />}
      catalog={[
        {
          name: "Photovoltaïque résidentiel",
          tag: "Maison individuelle",
          body: "Installation toiture, micro-onduleurs ou onduleur central. Monitoring de production en temps réel selon technologie retenue.",
        },
        {
          name: "Photovoltaïque tertiaire",
          tag: "Bâtiment professionnel",
          body: "Toitures plates et inclinées. Dimensionnement adapté à la consommation et à l'objectif d'autoconsommation.",
        },
        {
          name: "Solaire thermique",
          tag: "ECS · appoint chauffage",
          body: "Capteurs plans pour préparation eau chaude sanitaire, avec appoint chauffage selon saison et configuration.",
        },
        {
          name: "Stockage batterie",
          tag: "Auto-consommation",
          body: "Batteries lithium pour stocker la production solaire. Pilotage selon tarifs et profil de consommation.",
        },
        {
          name: "Borne de recharge VE",
          tag: "Mobilité électrique",
          body: "Wallbox connectée, charge solaire intelligente, intégration domotique selon installation.",
        },
        {
          name: "Audit énergétique",
          tag: "Pré-projet",
          body: "Diagnostic complet, simulation, classification énergétique. Conditionne souvent l'éligibilité aux aides publiques.",
        },
      ]}
    />
  );
}
