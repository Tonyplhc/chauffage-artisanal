import { ServicePage } from "@/components/service-page";
import { HeroAside } from "@/components/hero-aside";
import { FAQ_CHAUFFAGE } from "@/lib/faq-data";
import { COMPARATORS_CHAUFFAGE } from "@/lib/comparators";
import { Flame } from "lucide-react";
import { buildAlternates } from "@/lib/seo-alternates";

export const metadata = {
  title: "Chauffage Luxembourg — Chaudières, hybrides, biomasse",
  description:
    "Installation et entretien de systèmes de chauffage au Luxembourg : chaudières gaz à condensation, hybrides, biomasse. Étude personnalisée.",
  alternates: buildAlternates("/chauffage"),
};

export default function ChauffagePage() {
  return (
    <ServicePage
      serviceCategory="chauffage"
      serviceUrlPath="/chauffage"
      number="01"
      eyebrow="Chauffage"
      title={
        <>
          Le chauffage <em className="not-italic text-copper">pensé pour durer</em>, pas juste pour
          passer l&apos;hiver.
        </>
      }
      intro={
        <>
          Chaudières gaz à condensation, systèmes hybrides, biomasse, mise aux normes. De la maison individuelle au tertiaire, <strong className="text-copper font-semibold">étude personnalisée</strong> à chaque projet.
        </>
      }
      heroImg="/chauffage.jpg"
      aside={
        <HeroAside
          icon={Flame}
          eyebrow="Ce que nous installons"
          items={[
            { label: "Gaz à condensation", body: "Résidentiel, collectif, tertiaire" },
            { label: "Systèmes hybrides", body: "Couplage chaudière + pompe à chaleur" },
            { label: "Biomasse pellets", body: "Pour transition fossile → bois" },
          ]}
          footnote="Étude personnalisée · marques européennes · SAV long terme"
        />
      }
      metrics={[
        { value: "Étude", label: "Personnalisée par projet" },
        { value: "Marques", label: "Européennes de référence" },
        { value: "Pose", label: "Soignée & documentée" },
        { value: "SAV", label: "Engagement long terme" },
      ]}
      features={[
        {
          title: "Étude thermique",
          body: "Bilan du bâtiment, analyse des contraintes, dimensionnement raisonné. Pas de chaudière surdimensionnée ni d'installation au jugé.",
        },
        {
          title: "Marques européennes",
          body: "Nous travaillons avec les fabricants européens de référence — Viessmann, Vaillant, Buderus et autres — en privilégiant la disponibilité pièces sur la durée.",
        },
        {
          title: "Pose dans les règles",
          body: "Tubage, vase d'expansion correctement dimensionné, désembouage du circuit, équilibrage hydraulique. Une installation est aussi bonne que sa pose.",
        },
        {
          title: "Régulation moderne",
          body: "Thermostats connectés, sondes extérieures, programmation par zones — selon la pertinence du projet et le budget client.",
        },
        {
          title: "Accompagnement aides",
          body: "Nous intégrons dans le devis les informations techniques requises pour les dispositifs d'aides en vigueur (Klimabonus, communales).",
        },
        {
          title: "Mise en service propre",
          body: "Tests, analyse de combustion, formation à l'usage, dossier remis sur place. SAV assuré dans la durée.",
        },
      ]}
      benefits={[
        "Confort homogène — pièces équilibrées, circuit silencieux",
        "Compatibilité future avec un système hybride PAC",
        "Choix orienté disponibilité pièces et durabilité",
        "Conformité réglementaire luxembourgeoise",
        "Conditions de garantie selon fabricant et installation",
        "Devis détaillé, transparent, sans poste flou",
      ]}
      faq={FAQ_CHAUFFAGE}
      comparators={COMPARATORS_CHAUFFAGE}
      catalog={[
        {
          name: "Chaudière gaz condensation murale",
          tag: "Résidentiel",
          body: "La référence pour les maisons individuelles 100 à 350 m². Compacte, modulante, performante. Marques européennes au choix selon dimensionnement.",
        },
        {
          name: "Chaudière sol — moyennes puissances",
          tag: "Résidentiel collectif",
          body: "Pour les rénovations exigeantes ou les logements collectifs. Cascade possible selon la puissance requise.",
        },
        {
          name: "Chaudière biomasse — pellets",
          tag: "Biomasse",
          body: "Solution énergie renouvelable pour clients en transition fossile → bois. Silo intégré ou déporté selon configuration.",
        },
        {
          name: "Système hybride condensation + PAC",
          tag: "Hybride",
          body: "Couplage chaudière + pompe à chaleur. Pilotage intelligent selon coût d'énergie et température extérieure.",
        },
        {
          name: "Chaudière fonte tertiaire",
          tag: "Tertiaire",
          body: "Robustesse industrielle pour résidences collectives, écoles, petits bâtiments tertiaires.",
        },
        {
          name: "Régulation & pilotage connecté",
          tag: "Périphérique",
          body: "Vannes thermostatiques, sondes extérieures, thermostats connectés. Optimisation de la courbe de chauffe.",
        },
      ]}
    />
  );
}
