/**
 * Helper Schema.org pour les pages catégorie de service.
 *
 * Permet aux moteurs de recherche d'afficher la page comme un Service
 * distinct (avec son fournisseur, zone géographique, types couverts)
 * plutôt qu'une page générique. Améliore la pertinence des résultats
 * locaux pour les requêtes spécifiques ("chauffage installateur", etc.).
 *
 * Référence : https://schema.org/Service
 */

import { COMPANY } from "./company-info";

export type ServiceCategory =
  | "chauffage"
  | "pac"
  | "climatisation"
  | "sanitaire"
  | "enr"
  | "depannage"
  | "entretien";

const CATEGORY_META: Record<
  ServiceCategory,
  { name: string; serviceType: string; description: string }
> = {
  chauffage: {
    name: "Installation et entretien chauffage",
    serviceType: "HVAC heating installation",
    description:
      "Installation, remplacement et entretien de chaudières gaz à condensation, biomasse, hybrides au Luxembourg.",
  },
  pac: {
    name: "Installation pompes à chaleur",
    serviceType: "Heat pump installation",
    description:
      "Installation de pompes à chaleur air/eau, géothermiques et hybrides au Luxembourg. Dimensionnement, accompagnement Klimabonus, mise en service.",
  },
  climatisation: {
    name: "Installation climatisation",
    serviceType: "Air conditioning installation",
    description:
      "Installation et maintenance de systèmes de climatisation résidentiels et tertiaires au Luxembourg : mono-split, multi-split, VRV/VRF.",
  },
  sanitaire: {
    name: "Installation sanitaire et rénovation salle de bain",
    serviceType: "Plumbing and bathroom renovation",
    description:
      "Rénovation salle de bain, installation sanitaire complète, plomberie et débouchage canalisation au Luxembourg.",
  },
  enr: {
    name: "Énergies renouvelables",
    serviceType: "Renewable energy installation",
    description:
      "Installation de systèmes solaires thermiques, photovoltaïques et chauffe-eau thermodynamiques au Luxembourg.",
  },
  depannage: {
    name: "Dépannage chauffage et sanitaire 24/7",
    serviceType: "HVAC emergency repair",
    description:
      "Astreinte 24/7 pour pannes de chauffage, fuites d'eau, sécurité gaz au Luxembourg.",
  },
  entretien: {
    name: "Contrat d'entretien chauffage et climatisation",
    serviceType: "HVAC maintenance contract",
    description:
      "Contrats d'entretien annuels pour chaudières, pompes à chaleur et climatisations au Luxembourg. Conforme RGD luxembourgeois.",
  },
};

/**
 * Génère le JSON-LD Service complet pour une catégorie donnée.
 * À injecter via <script type="application/ld+json" dangerouslySetInnerHTML={...}/>
 */
export function buildServiceJsonLd(category: ServiceCategory, urlPath: string) {
  const meta = CATEGORY_META[category];
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    name: meta.name,
    serviceType: meta.serviceType,
    description: meta.description,
    provider: {
      "@type": "LocalBusiness",
      name: COMPANY.legalName,
      alternateName: COMPANY.shortName,
      address: {
        "@type": "PostalAddress",
        streetAddress: COMPANY.address.street,
        postalCode: COMPANY.address.postalCode,
        addressLocality: COMPANY.address.city,
        addressCountry: COMPANY.address.country,
      },
      telephone: COMPANY.phone.display,
      email: COMPANY.email,
      url: COMPANY.url,
    },
    areaServed: {
      "@type": "Country",
      name: "Luxembourg",
    },
    url: `${COMPANY.url}${urlPath}`,
  };
}
