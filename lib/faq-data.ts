import type { FaqItem } from "@/components/faq";

/**
 * Catalogue FAQ par page métier.
 *
 * Discipline rédactionnelle :
 *   - Aucune réponse ne promet de délai, prix, garantie chiffrée.
 *   - On parle au pluriel impersonnel (« nous »), à la 2e personne (« vous »).
 *   - On renvoie vers /devis ou /contact pour ce qui dépend du dossier.
 */

export const FAQ_CHAUFFAGE: FaqItem[] = [
  {
    q: "Faut-il toujours remplacer une chaudière qui a plus de 15 ans ?",
    a: "Pas systématiquement. Une chaudière bien entretenue peut tenir plus longtemps. En revanche, à partir d'un certain âge, le rendement chute, les pièces deviennent rares et l'investissement dans une solution plus efficace devient pertinent. Le bon moment se décide en fonction de votre consommation, de l'état du circuit et de vos projets sur le logement.",
  },
  {
    q: "Gaz à condensation ou hybride : que choisir aujourd'hui ?",
    a: "Tout dépend de votre bâtiment et de votre trajectoire. Le gaz à condensation reste pertinent dans certains logements, notamment quand le réseau de chaleur n'est pas optimisé. L'hybride (chaudière + pompe à chaleur) prend tout son sens en rénovation lourde où la PAC seule ne suffit pas. Notre étude propose la solution la mieux adaptée.",
  },
  {
    q: "Pourquoi parler de dimensionnement et pas seulement de puissance ?",
    a: "Une chaudière surdimensionnée fonctionne par à-coups, s'use prématurément et consomme plus. Un bon dimensionnement repose sur le calcul des déperditions réelles du bâtiment, pas sur des règles forfaitaires. C'est l'étape la plus importante de l'étude — celle qui détermine si l'installation tiendra 15 ou 25 ans.",
  },
  {
    q: "Une biomasse à pellets, est-ce vraiment écologique ?",
    a: "Cela dépend de la provenance des pellets et du type de chaudière. Une chaudière biomasse moderne, alimentée par des pellets locaux certifiés, présente un bilan carbone nettement inférieur au fioul. Pour les clients en transition fossile → renouvelable, c'est une solution sérieuse, à condition d'accepter le stockage et l'approvisionnement.",
  },
  {
    q: "Travaillez-vous en lien avec des architectes ?",
    a: "Oui. Pour les rénovations exigeantes et les constructions neuves, nous coordonnons fréquemment l'installation avec l'architecte du projet : intégration des conduits, choix des émetteurs, plans de réseaux. Plus l'amont est cohérent, plus la pose est propre.",
  },
];

export const FAQ_PAC: FaqItem[] = [
  {
    q: "Une pompe à chaleur fonctionne-t-elle vraiment au Luxembourg en hiver ?",
    a: "Oui, à condition d'être bien dimensionnée. Les PAC air/eau modernes maintiennent un bon rendement jusqu'à des températures extérieures basses, et un appoint électrique ou hybride prend le relais sur les pics. Le critère décisif est le COP saisonnier, calculé sur l'année — pas la performance théorique annoncée par le fabricant.",
  },
  {
    q: "Air/eau, sol/eau ou hybride : comment choisir ?",
    a: "L'air/eau reste la solution la plus courante : moins d'investissement initial, installation rapide. Le sol/eau géothermique offre des performances supérieures mais demande un terrain compatible et un investissement plus lourd. L'hybride (PAC + chaudière) s'impose en rénovation où la PAC seule ne couvre pas les pics. Notre étude tranche selon votre bâtiment.",
  },
  {
    q: "Peut-on installer une PAC en rénovation sans changer les radiateurs ?",
    a: "Souvent oui, avec une PAC haute température adaptée au réseau existant. C'est une vraie solution rénovation : on garde l'émission existante, on remplace uniquement la production de chaleur. La compatibilité dépend du type de radiateurs et du dimensionnement initial — à vérifier au cas par cas.",
  },
  {
    q: "Quel niveau sonore attendre d'une unité extérieure ?",
    a: "Les unités modernes haut de gamme sont nettement plus silencieuses que les modèles d'il y a 10 ans. Au-delà du modèle, le bruit perçu dépend de la pose : plots anti-vibration, distance aux ouvertures voisines, déport éventuel. Notre méthode prévoit systématiquement le travail acoustique.",
  },
  {
    q: "Mon installation PAC est-elle compatible avec une future borne de recharge VE ?",
    a: "Oui, c'est même un couple cohérent. PAC + photovoltaïque + borne pilotée, c'est l'architecture qui s'impose pour les projets résidentiels neufs ou en rénovation lourde. Nous concevons l'installation électrique en tenant compte de ces évolutions futures.",
  },
];

export const FAQ_CLIM: FaqItem[] = [
  {
    q: "La climatisation est-elle indispensable au Luxembourg ?",
    a: "Pas systématiquement, mais les étés récents et les logements modernes très isolés rendent la question légitime. Un logement neuf bien isolé peut surchauffer en été sans aucun système. Une climatisation réversible reste souvent la solution la plus simple — elle apporte aussi du chauffage d'appoint en mi-saison.",
  },
  {
    q: "Mono-split, multi-split ou système centralisé : quand passer à quoi ?",
    a: "Un mono-split suffit pour une pièce isolée. Le multi-split (plusieurs unités intérieures sur un groupe extérieur unique) est l'optimum résidentiel. Le système centralisé (VRV / gainable invisible) s'impose en tertiaire ou dans les villas d'architecte où l'esthétique compte autant que la performance.",
  },
  {
    q: "Qu'est-ce que la conformité F-Gas et est-elle obligatoire ?",
    a: "Oui. La réglementation européenne impose un contrôle annuel d'étanchéité du circuit de fluide pour la plupart des installations professionnelles, et des règles strictes sur la manipulation. Nous intégrons cette obligation aux contrats d'entretien — vous n'avez pas à vous en soucier au quotidien.",
  },
  {
    q: "Peut-on intégrer une climatisation discrètement dans un projet d'architecte ?",
    a: "Oui. Cassettes plafonnières, unités gainables dissimulées, diffusion par grilles fines — il existe aujourd'hui une vraie palette de solutions invisibles. Cela demande une coordination en amont avec l'architecte et le carreleur, mais le résultat est sans compromis visuel.",
  },
];

export const FAQ_SANITAIRE: FaqItem[] = [
  {
    q: "Pourquoi parler d'étanchéité au PV pour une salle de bain ?",
    a: "Parce que c'est l'étape qui détermine si votre salle de bain tiendra 20 ans ou si vous aurez une fuite cachée dans 5 ans. Le système d'étanchéité sous carrelage doit être appliqué selon les règles de l'art et vérifié par procès-verbal avant la pose du carrelage. Nous ne signons pas une livraison sans ce contrôle.",
  },
  {
    q: "Travaillez-vous avec des architectes d'intérieur ?",
    a: "Oui, c'est même un mode de collaboration récurrent. Nous savons intégrer nos arrivées et évacuations dans le plan de l'architecte, respecter le choix des finitions et coordonner avec carreleurs, menuisiers et électriciens. Une salle de bain premium est un travail d'équipe.",
  },
  {
    q: "Un adoucisseur ou un osmoseur : pour quoi faire ?",
    a: "L'adoucisseur traite la dureté de l'eau (calcaire) — il protège vos installations et améliore le confort général. L'osmoseur produit une eau de qualité boisson directement au robinet — utile si vous voulez supprimer les bouteilles. Les deux sont complémentaires, pas substituables.",
  },
  {
    q: "Faut-il prévoir un plancher chauffant dans une salle de bain en rénovation ?",
    a: "C'est un confort considérable, et c'est aujourd'hui simple à intégrer en basse température, couplé au reste du chauffage. Notre étude vérifie si la hauteur de chape et le réseau existant le permettent. Le confort thermique homogène pièce par pièce, ça change le quotidien.",
  },
];

export const FAQ_ENR: FaqItem[] = [
  {
    q: "Faut-il faire un audit énergétique avant d'investir ?",
    a: "Pour un projet structurant — passage en pompe à chaleur, ajout de photovoltaïque, rénovation lourde — l'audit énergétique est le bon investissement amont. Il chiffre les déperditions réelles, simule plusieurs scénarios et conditionne souvent l'éligibilité aux aides publiques. C'est l'outil qui évite de payer deux fois.",
  },
  {
    q: "PAC + photovoltaïque : pourquoi ces deux systèmes vont-ils ensemble ?",
    a: "Parce qu'ils se complètent dans le temps. La PAC tourne quand vous avez besoin de chaleur — souvent en hiver. Le PV produit de l'électricité — souvent en été. Le couplage permet d'optimiser l'autoconsommation en pilotant la PAC pour qu'elle tourne quand le PV produit. Cumul économies supérieures aux deux installations séparées.",
  },
  {
    q: "Un stockage batterie est-il rentable ?",
    a: "Cela dépend de votre profil de consommation et des tarifs en vigueur. Le stockage devient intéressant quand vous avez une production PV significative et une consommation diurne limitée, ou quand vous voulez de l'autonomie partielle en cas de coupure. À chiffrer projet par projet, sans dogme.",
  },
  {
    q: "Peut-on faire la transition énergétique par étapes ?",
    a: "Oui, et c'est souvent plus pertinent que de tout faire d'un coup. Notre approche : un plan cohérent sur 5-10 ans, étapes priorisées selon le retour sur investissement et votre budget. Chaque étape est compatible avec la suivante — pas de travaux à refaire.",
  },
];

export const FAQ_ENTRETIEN: FaqItem[] = [
  {
    q: "Pourquoi un contrat d'entretien plutôt qu'une intervention à la demande ?",
    a: "Parce qu'un entretien régulier détecte les dérives avant qu'elles ne deviennent une panne lourde. Les clients sous contrat sont aussi prioritaires en cas de dépannage, et la durée de vie de leur équipement est statistiquement supérieure. Sur la durée, c'est moins cher qu'un entretien réactif.",
  },
  {
    q: "Que comprend exactement une visite d'entretien ?",
    a: "Une analyse de combustion, le contrôle des sécurités, un nettoyage complet des organes accessibles, le test des organes mobiles, et l'attestation de conformité quand elle est requise. Le rapport est remis sur place, avec les éventuelles dérives à surveiller.",
  },
  {
    q: "Les pièces d'usure sont-elles incluses dans le contrat ?",
    a: "Selon la formule choisie. Les contrats « essentiels » couvrent uniquement la visite ; les contrats « confort » incluent une liste de pièces d'usure standard (joints, électrodes, filtres) ; les contrats « sérénité » étendent à certaines pièces majeures sous conditions. La liste exacte est annexée au contrat — pas de surprise.",
  },
  {
    q: "L'entretien annuel est-il obligatoire au Luxembourg ?",
    a: "Pour certaines puissances et certains types d'installations, oui — l'attestation de conformité est exigée. Pour d'autres, c'est fortement recommandé, et conditionne souvent la garantie constructeur. Nous gérons cette obligation pour vous, vous n'avez pas à y penser.",
  },
];

/**
 * Mapping service ↔ FAQ. Utilisé par les pages ServicePage pour récupérer
 * la bonne liste sans dupliquer dans chaque fichier de page.
 */
export const FAQ_BY_SERVICE = {
  chauffage: FAQ_CHAUFFAGE,
  pac: FAQ_PAC,
  clim: FAQ_CLIM,
  sanitaire: FAQ_SANITAIRE,
  enr: FAQ_ENR,
  entretien: FAQ_ENTRETIEN,
} as const;
