import { ServicePage } from "@/components/service-page";
import { HeroAside } from "@/components/hero-aside";
import { FAQ_PAC } from "@/lib/faq-data";
import { COMPARATORS_PAC } from "@/lib/comparators";
import { Leaf } from "lucide-react";
import { buildAlternates } from "@/lib/seo-alternates";

export const metadata = {
  title: "Pompes à chaleur Luxembourg — Air/eau, géothermie, hybride",
  description:
    "Installation de pompes à chaleur au Luxembourg. Étude personnalisée, accompagnement Klimabonus, technologies adaptées à chaque projet.",
  alternates: buildAlternates("/pompes-a-chaleur"),
};

export default function PacPage() {
  return (
    <ServicePage
      serviceCategory="pac"
      serviceUrlPath="/pompes-a-chaleur"
      number="02"
      eyebrow="Pompes à chaleur"
      title={
        <>
          La pompe à chaleur <em className="not-italic text-bleu">dimensionnée pour votre projet</em>, pas pour un catalogue.
        </>
      }
      intro={
        <>
          Air/eau, sol/eau géothermique, hybride. Études personnalisées, <strong className="text-bleu font-semibold">accompagnement Klimabonus</strong>, technologies adaptées à votre bâtiment et à votre usage.
        </>
      }
      heroImg="/PAC-air-air1.jpg"
      aside={
        <HeroAside
          icon={Leaf}
          eyebrow="Technologies couvertes"
          items={[
            { label: "Air/eau", body: "Solution la plus répandue, neuf ou rénovation" },
            { label: "Sol/eau géothermique", body: "Sondes verticales, partenaire foreur" },
            { label: "Hybride PAC + gaz", body: "Bascule auto selon températures" },
          ]}
          footnote="Klimabonus accompagné · COP & acoustique soignés"
        />
      }
      metrics={[
        { value: "Étude", label: "Personnalisée" },
        { value: "Klimabonus", label: "Accompagnement" },
        { value: "Marques", label: "Européennes" },
        { value: "SAV", label: "Long terme" },
      ]}
      features={[
        {
          title: "Étude avant devis",
          body: "Mesure des déperditions, analyse du réseau radiateurs ou plancher, étude des contraintes. Une PAC mal dimensionnée perd l'essentiel de son intérêt.",
        },
        {
          title: "Géothermie quand c'est pertinent",
          body: "Sondes verticales par notre partenaire foreur. Solution intéressante quand le terrain et le projet s'y prêtent — nous le disons clairement.",
        },
        {
          title: "Hybride en rénovation",
          body: "Lorsqu'une PAC seule ne suffit pas, le couplage avec une chaudière à condensation prend le relais aux journées les plus froides.",
        },
        {
          title: "Pilotage adapté",
          body: "Loi d'eau ajustée à votre bâtiment, courbe de chauffe optimisée, pilotage par sondes intérieures lorsque la configuration s'y prête.",
        },
        {
          title: "Acoustique soignée",
          body: "Choix d'unités silencieuses, plots anti-vibration, déport possible. L'objectif : ne plus entendre l'installation après quelques semaines.",
        },
        {
          title: "Klimabonus & démarches",
          body: "Nous fournissons les éléments techniques nécessaires aux dossiers d'aides. Le dossier administratif reste au nom du client.",
        },
      ]}
      benefits={[
        "Réduction de la dépendance aux énergies fossiles",
        "Amélioration possible de la classification énergétique du logement",
        "Couplage envisageable avec photovoltaïque pour autoconsommation",
        "Suppression du stockage de combustible (citerne fioul, etc.)",
        "Fonction rafraîchissement passif possible selon technologie",
        "Maintenance simple : généralement une visite annuelle",
      ]}
      faq={FAQ_PAC}
      comparators={COMPARATORS_PAC}
      catalog={[
        {
          name: "PAC air/eau — résidentiel",
          tag: "Maison individuelle",
          body: "Solution la plus répandue. Adaptée à la rénovation comme au neuf selon le type d'émetteurs. Plusieurs fabricants au choix.",
        },
        {
          name: "PAC air/eau haute température",
          tag: "Rénovation sans toucher radiateurs",
          body: "Permet de garder le réseau de radiateurs existant lors d'un remplacement chaudière. Solution rénovation par excellence.",
        },
        {
          name: "PAC sol/eau géothermique",
          tag: "Géothermie",
          body: "Sondes verticales selon le terrain. Performances généralement supérieures, mais investissement plus lourd. Étude préalable indispensable.",
        },
        {
          name: "PAC monobloc extérieure",
          tag: "Encombrement réduit",
          body: "Unité extérieure unique, intégration discrète. Idéale pour villas contemporaines au design contraignant.",
        },
        {
          name: "Système hybride PAC + gaz",
          tag: "Hybride",
          body: "Bascule automatique entre PAC et chaudière selon coût énergie et température extérieure. Solution pragmatique en rénovation lourde.",
        },
        {
          name: "PAC tertiaire — cascade",
          tag: "Tertiaire",
          body: "Solutions cascadables pour bureaux, écoles, résidences collectives. Dimensionnement par notre bureau d'études.",
        },
      ]}
    />
  );
}
