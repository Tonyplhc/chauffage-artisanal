import { ServicePage } from "@/components/service-page";
import { HeroAside } from "@/components/hero-aside";
import { FAQ_CLIM } from "@/lib/faq-data";
import { COMPARATORS_CLIM } from "@/lib/comparators";
import { Snowflake } from "lucide-react";
import { buildAlternates } from "@/lib/seo-alternates";

export const metadata = {
  title: "Climatisation Luxembourg — Résidentiel & tertiaire",
  description:
    "Installation de climatisation au Luxembourg : mono-split, multi-split, systèmes tertiaires. Étude acoustique, intégration architecturale, maintenance sur durée.",
  alternates: buildAlternates("/climatisation"),
};

export default function ClimatisationPage() {
  return (
    <ServicePage
      serviceCategory="climatisation"
      serviceUrlPath="/climatisation"
      number="03"
      eyebrow="Climatisation"
      title={
        <>
          Du confort résidentiel à la salle technique :{" "}
          <em className="not-italic text-bleu">le froid juste</em>.
        </>
      }
      intro={
        <>
          Mono-split, multi-split, systèmes tertiaires. Pour les bureaux, commerces, salles techniques et <strong className="text-bleu font-semibold">logements modernes mal protégés de l&apos;été</strong>.
        </>
      }
      heroImg="/reparation-climatisation-2.jpeg"
      aside={
        <HeroAside
          icon={Snowflake}
          eyebrow="Configurations couvertes"
          items={[
            { label: "Mono / multi-split", body: "Résidentiel, intégration discrète" },
            { label: "Tertiaire centralisé", body: "Bureaux, commerces, salles techniques" },
            { label: "Cassette · gainable", body: "Solutions architecturalement invisibles" },
          ]}
          footnote="Étude acoustique · conformité F-Gas · maintenance"
        />
      }
      metrics={[
        { value: "Étude", label: "Dimensionnement précis" },
        { value: "Acoustique", label: "Soignée" },
        { value: "Marques", label: "Européennes & japonaises" },
        { value: "F-Gas", label: "Conformité réglementaire" },
      ]}
      features={[
        {
          title: "Dimensionnement par calcul",
          body: "Charge thermique pièce par pièce. Pas de surdimensionnement, pas de cycle court qui réduit la durée de vie du matériel.",
        },
        {
          title: "Intégration architecturale",
          body: "Choix des unités intérieures avec votre architecte : cassettes encastrées, gainables invisibles, consoles design. L'intégration discrète est possible.",
        },
        {
          title: "Solutions tertiaires",
          body: "Pour bureaux, commerces, salles techniques : étude dédiée avec récupération d'énergie lorsque l'usage le permet, pilotage centralisé.",
        },
        {
          title: "Pilotage par zone",
          body: "Commandes individuelles, programmation horaire, intégration domotique selon configuration et besoin.",
        },
        {
          title: "Maintenance encadrée",
          body: "Contrats d'entretien adaptés à l'installation. Conformité F-Gas selon réglementation en vigueur (charge fluide).",
        },
        {
          title: "Fluides modernes",
          body: "Choix de fluides à faible impact environnemental (GWP réduit), conformes aux évolutions réglementaires européennes.",
        },
      ]}
      benefits={[
        "Confort été comme hiver (de nombreuses unités sont réversibles)",
        "Air filtré selon les gammes choisies",
        "Niveau sonore maîtrisé selon technologie",
        "Économies possibles via récupération d'énergie en tertiaire",
        "Conformité F-Gas annuelle gérée par contrat",
        "Garantie constructeur selon fabricant et modèle retenu",
      ]}
      faq={FAQ_CLIM}
      comparators={COMPARATORS_CLIM}
      catalog={[
        {
          name: "Mono-split résidentiel",
          tag: "Maison · appartement",
          body: "Solution la plus courante : une unité intérieure liée à une unité extérieure. Marques japonaises et européennes au choix.",
        },
        {
          name: "Multi-split résidentiel",
          tag: "Plusieurs pièces",
          body: "Plusieurs unités intérieures sur un seul groupe extérieur. Idéal pour climatiser plusieurs pièces sans multiplier les unités extérieures.",
        },
        {
          name: "Système tertiaire centralisé",
          tag: "Bureaux & commerces",
          body: "Solutions multi-zones avec récupération de chaleur, pilotage centralisé, intégration GTC selon installation.",
        },
        {
          name: "Cassette plafonnière",
          tag: "Intégration discrète",
          body: "Encastrée dans le faux-plafond. Diffusion 360°, idéal en bureaux et espaces commerciaux.",
        },
        {
          name: "Gainable invisible",
          tag: "Design architectural",
          body: "Unité dissimulée en plafond ou en placard technique, diffusion par grilles discrètes. Pour projets d'architecte.",
        },
        {
          name: "Contrat F-Gas",
          tag: "Maintenance",
          body: "Contrôle d'étanchéité circuit fluide, recharge si nécessaire, conformité réglementaire annuelle.",
        },
      ]}
    />
  );
}
