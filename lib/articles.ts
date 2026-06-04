/**
 * Catalogue articles d'actualités.
 *
 * Discipline éditoriale stricte :
 *   - Aucun chiffre client/SAV inventé.
 *   - Sur les dispositifs Klimabonus, on parle des principes et on renvoie aux
 *     sources officielles (MyEnergy, guichet.lu).
 *   - Auteur = "Bureau d'études Chauffage Artisanal" (générique, non personnel).
 *   - Date = mois courant pour fraîcheur SEO, sans préciser le jour.
 */

export type Article = {
  slug: string;
  title: string;
  excerpt: string;
  category: "klimabonus" | "technique" | "transition" | "metier";
  readingMinutes: number;
  publishedAt: string; // ISO
  author: string;
  cover: string;
  body: ArticleBlock[];
  related?: string[]; // autres slugs
};

export type ArticleBlock =
  | { type: "p"; text: string }
  | { type: "h2"; text: string }
  | { type: "h3"; text: string }
  | { type: "quote"; text: string; cite?: string }
  | { type: "list"; items: string[] }
  | { type: "callout"; tone: "info" | "warning" | "highlight"; title: string; body: string };

export const CATEGORY_LABELS: Record<Article["category"], string> = {
  klimabonus: "Klimabonus & aides",
  technique: "Technique",
  transition: "Transition énergétique",
  metier: "Vie du métier",
};

export const ARTICLES: Article[] = [
  {
    slug: "klimabonus-2026-ce-quil-faut-savoir",
    title: "Klimabonus 2026 : ce qui change, ce qui reste",
    excerpt:
      "Le programme national d'aides énergie évolue régulièrement. Comment lire les changements 2026, et ce que ça veut dire concrètement pour vos projets.",
    category: "klimabonus",
    readingMinutes: 6,
    publishedAt: "2026-05-01",
    author: "Bureau d'études · Chauffage Artisanal",
    cover:
      "https://images.unsplash.com/photo-1497366216548-37526070297c?q=80&w=1600&auto=format&fit=crop",
    body: [
      {
        type: "p",
        text: "Le programme Klimabonus est un dispositif vivant : ses barèmes, ses conditions d'éligibilité et ses cumuls évoluent au fil des décisions politiques et budgétaires. Plutôt que de chiffrer des montants qui peuvent bouger demain, nous proposons ici une lecture des principes — ceux qui changent rarement, et ceux qui sont en train de se déplacer.",
      },
      {
        type: "h2",
        text: "Ce qui ne bouge pas : les fondamentaux du dispositif",
      },
      {
        type: "p",
        text: "Klimabonus reste structuré autour de trois grandes familles d'aides : le chauffage performant (pompes à chaleur, hybrides, biomasse), la rénovation énergétique de l'enveloppe (isolation, ventilation, fenêtres) et le solaire (photovoltaïque et thermique). Ces trois axes restent les piliers, et la logique de cumul avec les aides communales (Klimapakt) ne change pas dans son principe.",
      },
      {
        type: "p",
        text: "L'autre constante : la nécessité d'un installateur qualifié. Sans déclaration d'un professionnel certifié, la quasi-totalité des dispositifs nationaux ne s'appliquent pas. Ce n'est pas une question administrative : c'est la garantie pour l'État que l'argent public soutient des installations qui tiendront.",
      },
      {
        type: "h2",
        text: "Ce qui évolue : la priorité aux solutions bas-carbone",
      },
      {
        type: "p",
        text: "La direction de fond reste l'accélération de la sortie des énergies fossiles. Concrètement, cela se traduit par une attention de plus en plus marquée sur les remplacements de chaudières fioul, sur les pompes à chaleur à haut COP, et sur les couplages PAC + photovoltaïque qui maximisent l'autoconsommation. Les barèmes valorisent désormais davantage les projets cohérents (rénovation + production) que les actions isolées.",
      },
      {
        type: "callout",
        tone: "info",
        title: "Vérifier à la source",
        body: "Les conditions exactes, plafonds, et règles de cumul sont publiées et actualisées par MyEnergy et sur klimabonus.lu. Notre rôle est d'orienter — pas de remplacer ces sources officielles.",
      },
      {
        type: "h2",
        text: "Comment préparer un dossier solide",
      },
      {
        type: "list",
        items: [
          "Avant tout : un audit énergétique sérieux du logement. Il chiffre les vraies déperditions et conditionne souvent l'éligibilité.",
          "Choisir une trajectoire cohérente sur 5 à 10 ans plutôt que des actions au coup par coup.",
          "Travailler avec un installateur qui prépare la partie technique du dossier — schémas, fiches produits, attestations de pose, certificats.",
          "Ne pas signer avant d'avoir un devis qui détaille chaque poste et qui peut être joint au dossier d'aide.",
          "Conserver factures, photos et attestations pendant la durée légale (10 ans en général).",
        ],
      },
      {
        type: "h2",
        text: "Notre position",
      },
      {
        type: "p",
        text: "Nous ne promettons jamais un montant fixe. Nous vérifions au cas par cas, en amont du devis, ce à quoi votre projet peut prétendre selon le dispositif en vigueur au moment du dépôt. Le dossier administratif reste à votre nom — nous ne facturons aucune « commission sur prime ».",
      },
      {
        type: "p",
        text: "Si vous avez un projet en réflexion, le mieux reste une visite technique : nous regardons ensemble votre bâtiment, et nous vous indiquons quels dispositifs sont pertinents pour votre situation.",
      },
    ],
    related: [
      "pac-hybride-renovation-quand-cest-pertinent",
      "sortir-du-fioul-trajectoire-raisonnee",
    ],
  },
  {
    slug: "pac-hybride-renovation-quand-cest-pertinent",
    title: "Pompe à chaleur hybride en rénovation : quand est-ce pertinent ?",
    excerpt:
      "L'hybride (PAC + chaudière) n'est pas une solution par défaut. Voici dans quels cas elle s'impose, et dans quels cas elle est un compromis inutile.",
    category: "technique",
    readingMinutes: 7,
    publishedAt: "2026-04-15",
    author: "Bureau d'études · Chauffage Artisanal",
    cover: "/PAC-air-air1.jpg",
    body: [
      {
        type: "p",
        text: "L'hybride — couplage entre une pompe à chaleur et une chaudière à condensation — est devenu un produit phare des constructeurs. À juste titre dans certains cas, à tort dans d'autres. Voici comment trancher.",
      },
      {
        type: "h2",
        text: "La promesse de l'hybride",
      },
      {
        type: "p",
        text: "L'idée est simple : la PAC couvre la majorité des besoins (la part qui s'effectue à des températures extérieures modérées, où elle est très efficace), et la chaudière prend le relais sur les pics de froid intense, où la PAC perd en COP. Le système bascule automatiquement selon une logique de coût d'énergie marginal.",
      },
      {
        type: "p",
        text: "Sur le papier, c'est imbattable : on capte la majorité du potentiel de la PAC sans perdre le confort en hiver rigoureux. En réalité, ça ne fonctionne bien que dans certaines conditions.",
      },
      {
        type: "h2",
        text: "Les cas où l'hybride s'impose",
      },
      {
        type: "list",
        items: [
          "Rénovation d'un bâtiment moyennement isolé avec radiateurs haute température en place : la PAC seule sous-dimensionnerait, l'hybride permet de couvrir les pics.",
          "Bâtiment équipé d'un réseau gaz fonctionnel que le client ne veut pas démanteler.",
          "Phase transitoire : le client souhaite décarboner progressivement, sans investissement maximal en une seule fois.",
          "Cas où l'unité extérieure de la PAC ne peut pas être dimensionnée pour le pire scénario (contraintes acoustiques, esthétiques, foncières).",
        ],
      },
      {
        type: "h2",
        text: "Les cas où l'hybride est un faux ami",
      },
      {
        type: "list",
        items: [
          "Logement neuf ou très bien rénové, avec plancher chauffant : la PAC seule couvre largement, l'hybride ajoute une complexité inutile.",
          "Pas de réseau gaz disponible : l'hybride n'a plus de sens.",
          "Volonté forte de décarbonation : l'hybride garde un combustible fossile dans le système, et donc une émission résiduelle structurelle.",
          "Budget contraint : deux systèmes coûtent plus cher qu'un seul correctement dimensionné — quand la PAC seule suffit, l'hybride est un surcoût net.",
        ],
      },
      {
        type: "callout",
        tone: "highlight",
        title: "Le test simple",
        body: "Si votre bâtiment est correctement isolé et équipé de plancher chauffant ou de radiateurs basse température, une PAC bien dimensionnée seule fait le travail. Si vous avez des radiateurs haute température et un budget contraint pour l'isolation, l'hybride peut être un compromis intelligent.",
      },
      {
        type: "h2",
        text: "Notre approche",
      },
      {
        type: "p",
        text: "Avant toute proposition, nous mesurons les déperditions réelles du bâtiment, nous analysons le réseau d'émetteurs existant, et nous étudions le scénario PAC seule vs PAC hybride en simulation. Le choix se fait sur des chiffres, pas sur une préférence commerciale.",
      },
    ],
    related: [
      "klimabonus-2026-ce-quil-faut-savoir",
      "sortir-du-fioul-trajectoire-raisonnee",
    ],
  },
  {
    slug: "sortir-du-fioul-trajectoire-raisonnee",
    title: "Sortir du fioul : construire une trajectoire raisonnée",
    excerpt:
      "Remplacer une chaudière fioul ne se fait pas dans l'urgence. Comment construire un plan cohérent qui valorise votre logement sans précipiter l'investissement.",
    category: "transition",
    readingMinutes: 8,
    publishedAt: "2026-03-20",
    author: "Bureau d'études · Chauffage Artisanal",
    cover:
      "https://images.unsplash.com/photo-1568605114967-8130f3a36994?q=80&w=1600&auto=format&fit=crop",
    body: [
      {
        type: "p",
        text: "Beaucoup de clients arrivent chez nous avec la même phrase : « ma chaudière fioul a 25 ans, il faut que je change, mais je ne sais pas par quoi ». La bonne nouvelle, c'est qu'il existe désormais plusieurs voies de sortie qui marchent. La moins bonne, c'est qu'aucune n'est universelle — et qu'aucune ne s'improvise.",
      },
      {
        type: "h2",
        text: "Pourquoi le fioul devient un problème",
      },
      {
        type: "p",
        text: "Au-delà du coût du combustible lui-même, la chaudière fioul cumule plusieurs handicaps : émissions carbone élevées, dépendance à une chaîne d'approvisionnement géopolitique, nécessité de stockage (citerne) qui occupe de la surface, et perspective d'interdiction à moyen terme dans plusieurs pays européens. Ce n'est plus une question de si — c'est une question de quand et comment.",
      },
      {
        type: "h2",
        text: "Première étape : ne pas confondre urgence et précipitation",
      },
      {
        type: "p",
        text: "Si votre chaudière fonctionne encore, vous avez le temps de bien faire. Une étude énergétique du logement, un dimensionnement précis, le choix de la technologie adaptée — tout ça mérite quelques mois de réflexion. À l'inverse, si votre chaudière est en panne sévère, l'urgence dicte parfois un remplacement à l'identique ou un système d'appoint, en attendant la solution structurante.",
      },
      {
        type: "h2",
        text: "Les trois voies de sortie principales",
      },
      {
        type: "h3",
        text: "1. PAC air/eau seule",
      },
      {
        type: "p",
        text: "La solution la plus directe et la plus décarbonée. Fonctionne très bien si le bâtiment est correctement isolé et équipé de plancher chauffant ou de radiateurs basse température. Demande parfois un travail amont sur l'isolation pour atteindre les bonnes performances.",
      },
      {
        type: "h3",
        text: "2. PAC haute température",
      },
      {
        type: "p",
        text: "Permet de conserver les radiateurs en place. Solution rénovation par excellence : on remplace la production de chaleur, on ne touche pas à l'émission. Investissement initial plus élevé qu'une PAC standard, mais évite les travaux lourds sur les pièces.",
      },
      {
        type: "h3",
        text: "3. Hybride PAC + gaz à condensation",
      },
      {
        type: "p",
        text: "Si le réseau gaz est disponible et que vous voulez une transition progressive, l'hybride couvre la majorité des besoins en PAC et garde un appoint gaz pour les pics. Solution pragmatique, mais qui maintient une émission résiduelle fossile.",
      },
      {
        type: "callout",
        tone: "info",
        title: "Et le solaire dans tout ça ?",
        body: "Coupler la nouvelle production de chaleur avec du photovoltaïque permet d'aller un cran plus loin : la PAC tourne en partie sur l'électricité produite sur place. Ça peut être fait en deux étapes (PAC d'abord, PV dans un second temps), pour étaler l'investissement.",
      },
      {
        type: "h2",
        text: "Notre rôle dans la trajectoire",
      },
      {
        type: "p",
        text: "Nous proposons une étude personnalisée qui ne se limite pas à choisir un modèle de PAC. Nous regardons l'ensemble : état du bâtiment, réseau d'émetteurs, contraintes acoustiques, budget, calendrier souhaité, dispositifs d'aide en vigueur. Le résultat, c'est un plan à 5-10 ans avec des étapes prioritaires et leurs conditions.",
      },
      {
        type: "p",
        text: "Le fioul n'est pas une fatalité. Bien préparée, sa sortie est une vraie valorisation du logement — et un confort thermique qui change le quotidien.",
      },
    ],
    related: [
      "pac-hybride-renovation-quand-cest-pertinent",
      "klimabonus-2026-ce-quil-faut-savoir",
    ],
  },
  {
    slug: "comment-choisir-pompe-chaleur-luxembourg-2026",
    title: "Comment choisir sa pompe à chaleur au Luxembourg en 2026",
    excerpt:
      "Air/eau, géothermique, hybride, R32 ou R290 — les choix techniques d'une PAC peuvent dérouter. Guide pratique pour orienter sa décision avant la visite technique.",
    category: "technique",
    readingMinutes: 7,
    publishedAt: "2026-05-15",
    author: "Bureau d'études · Chauffage Artisanal",
    cover:
      "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=1600&auto=format&fit=crop",
    body: [
      {
        type: "p",
        text: "Choisir une pompe à chaleur n'est pas un acte d'achat — c'est un acte d'ingénierie. La même maison peut justifier une PAC air/eau monobloc à 14 000 € ou un système géothermique à 35 000 €, selon l'isolation, le réseau d'émetteurs et l'usage cible. Voici comment lire ces choix.",
      },
      { type: "h2", text: "Étape 1 : connaître ses besoins thermiques" },
      {
        type: "p",
        text: "Avant de parler équipement, il faut chiffrer les besoins. Un bilan thermique rapide permet d'estimer la puissance utile à fournir (kW) en fonction de la surface, de l'isolation, de l'exposition. Sans cette base, on tombe dans le surdimensionnement — premier ennemi du COP réel.",
      },
      { type: "h2", text: "Étape 2 : air/eau, géothermique ou hybride ?" },
      {
        type: "p",
        text: "La PAC air/eau est la plus accessible : pas de forage, installation en 2-3 jours, COP 3,5-4,5. La géothermique offre un COP plus stable (4,5-5,5) et un meilleur silence, mais demande un forage onéreux (10 000 €+) qui n'est rentable que sur des consommations élevées. L'hybride couple PAC + chaudière existante : pertinent en rénovation lourde où l'isolation est limitée.",
      },
      {
        type: "callout",
        tone: "highlight",
        title: "R32 ou R290 ?",
        body: "Le R32 est le réfrigérant standard depuis 2025. Le R290 (propane) le remplace progressivement sur les nouvelles gammes — PRG très bas, performance équivalente, mais plus de précautions à l'installation. Pour un projet 2026, les deux sont valables.",
      },
      { type: "h2", text: "Étape 3 : dimensionner avec marge — mais pas trop" },
      {
        type: "p",
        text: "Le surdimensionnement, c'est la PAC qui démarre/s'arrête trop souvent : moins efficace, plus bruyante, durée de vie réduite. Le sous-dimensionnement, c'est la PAC qui tourne en permanence et appelle un appoint électrique l'hiver. La bonne pratique : couvrir 100 % des besoins à -7 °C extérieur, avec un appoint pour les pics rares (-10 à -15 °C).",
      },
      { type: "h2", text: "Étape 4 : choisir l'installateur avant la marque" },
      {
        type: "p",
        text: "Une PAC Daikin posée par un installateur peu rigoureux performera moins bien qu'une PAC Buderus posée avec soin. Les bonnes pratiques de pose (équilibrage hydraulique, désembouage, paramétrage régulation) comptent autant que le matériel. Vérifiez les certifications (RGE équivalent LU, attestation fluides catégorie I).",
      },
      {
        type: "p",
        text: "Notre conseil : commencer par une étude personnalisée gratuite avant tout devis ferme. Ça permet d'identifier les options réalistes pour votre dossier — et de comparer 2 marques côté à côte avant de décider.",
      },
    ],
    related: ["pac-hybride-renovation-quand-cest-pertinent", "pac-vs-chaudiere-bilan-20-ans"],
  },
  {
    slug: "pac-vs-chaudiere-bilan-20-ans",
    title: "PAC vs chaudière : le bilan économique sur 20 ans",
    excerpt:
      "L'investissement initial d'une PAC fait peur. Sur 20 ans, le calcul change complètement. Décomposition transparente des coûts d'usage, d'entretien et d'énergie.",
    category: "transition",
    readingMinutes: 8,
    publishedAt: "2026-05-08",
    author: "Bureau d'études · Chauffage Artisanal",
    cover:
      "https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?q=80&w=1600&auto=format&fit=crop",
    body: [
      {
        type: "p",
        text: "Comparer le prix d'achat d'une chaudière gaz et d'une PAC, c'est comparer une amende parking de 80 € à un abonnement parking de 30 €/mois : sans la dimension temps, la comparaison ne veut rien dire. Voici comment lire ces deux options sur le seul horizon qui compte : la durée de vie de l'installation.",
      },
      { type: "h2", text: "L'investissement initial : 1 vs 2,5" },
      {
        type: "p",
        text: "Une chaudière gaz à condensation neuve coûte 5 000 à 9 000 € posée au Luxembourg. Une PAC air/eau résidentielle, 14 000 à 24 000 € posée. La PAC coûte 2 à 2,5 fois plus cher au démarrage. C'est le chiffre qui fait peur — et qui occulte tout le reste.",
      },
      { type: "h2", text: "Le Klimabonus change le ratio" },
      {
        type: "p",
        text: "L'aide nationale Klimabonus peut couvrir 5 000 à 12 000 € pour une PAC, selon le dossier. Une PAC à 18 000 € posée, c'est en pratique 8 000 à 13 000 € à la charge du propriétaire — soit le même niveau qu'une chaudière gaz haut de gamme. Le ratio investissement bascule.",
      },
      { type: "h2", text: "Le coût d'usage : facteur 2 à 3 en faveur de la PAC" },
      {
        type: "p",
        text: "C'est ici que tout se joue. Pour 18 000 kWh thermiques annuels (maison 140 m² moyennement isolée) : chaudière gaz à 0,11 €/kWh = ~2 100 €/an. PAC air/eau SCOP 3,5 alimentée à 0,22 €/kWh élec = ~1 130 €/an. Économie : ~1 000 €/an. Sur 20 ans avec inflation modérée, c'est 25 000-30 000 € d'énergie économisée.",
      },
      {
        type: "callout",
        tone: "info",
        title: "Hypothèses prudentes",
        body: "Prix kWh 2026 : gaz 0,11 €, électricité 0,22 €. Inflation énergie 3 %/an. SCOP PAC 3,5 (prudent). Ces hypothèses tiennent sur 20 ans dans les analyses sectorielles.",
      },
      { type: "h2", text: "L'entretien : ex æquo, mais avec nuance" },
      {
        type: "p",
        text: "Chaudière : 180-250 €/an d'entretien obligatoire. PAC : 200-280 €/an. Différence négligeable. En revanche, la PAC n'a pas de combustion : pas de risque CO, pas de mise aux normes ramonage. Côté tranquillité d'esprit, avantage PAC.",
      },
      { type: "h2", text: "Le verdict à 20 ans" },
      {
        type: "p",
        text: "Sur une maison résidentielle moyenne au LU, la PAC remboursée par Klimabonus + économies d'énergie devient rentable entre la 6e et la 10e année. Au terme des 20 ans, l'économie totale par rapport au scénario gaz se situe typiquement entre 12 000 € et 22 000 €.",
      },
      {
        type: "p",
        text: "Cette analyse ne remplace pas une étude personnalisée : votre isolation, vos consommations historiques, le tarif de votre fournisseur d'énergie peuvent faire bouger les chiffres. Mais l'ordre de grandeur tient.",
      },
    ],
    related: [
      "comment-choisir-pompe-chaleur-luxembourg-2026",
      "klimabonus-2026-ce-quil-faut-savoir",
    ],
  },
  {
    slug: "dimensionnement-chauffe-eau-thermo-foyer",
    title: "Quelle taille de chauffe-eau thermodynamique pour votre famille",
    excerpt:
      "150 L, 250 L ou 300 L ? Le dimensionnement du ballon thermodynamique conditionne le confort ECS et l'efficacité du COP. Guide par taille de foyer.",
    category: "technique",
    readingMinutes: 5,
    publishedAt: "2026-04-22",
    author: "Bureau d'études · Chauffage Artisanal",
    cover:
      "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?q=80&w=1600&auto=format&fit=crop",
    body: [
      {
        type: "p",
        text: "Le chauffe-eau thermodynamique économise jusqu'à 70 % de l'énergie d'un ballon électrique classique — à condition de bien le dimensionner. Trop petit, on tombe en pénurie et l'appoint électrique se déclenche. Trop grand, on chauffe inutilement de l'eau qu'on ne consomme pas.",
      },
      { type: "h2", text: "La règle simple : 50 à 60 L par occupant" },
      {
        type: "p",
        text: "C'est l'ordre de grandeur qui marche dans 90 % des cas. Pour 1-2 personnes : 100-150 L. Pour 3-4 personnes : 200-250 L. Pour 5-6 personnes : 270-300 L. Pour 7-8 personnes : 400 L. Ces volumes prévoient les variations de consommation (douches longues, lessive le matin, vaisselle).",
      },
      { type: "h2", text: "Les exceptions à connaître" },
      {
        type: "list",
        items: [
          "Maison avec baignoire utilisée souvent : prévoir +50 L (une baignoire = 150-200 L à 40 °C)",
          "Adolescents : prévoir +30 L par ado (durée des douches…)",
          "Cuisine commerciale ou métier de bouche à domicile : +100 L minimum",
          "Pompe de circulation ECS : peut nécessiter +50 L pour compenser les pertes",
        ],
      },
      { type: "h2", text: "L'erreur classique : surdimensionner « pour être tranquille »" },
      {
        type: "p",
        text: "Beaucoup de devis poussent vers le 300 L alors qu'un 250 L suffit largement. Le coût d'achat augmente, l'encombrement aussi, et surtout : maintenir 50 L supplémentaires à 55 °C en permanence coûte de l'énergie pour rien. Le confort réel n'augmente pas.",
      },
      {
        type: "callout",
        tone: "highlight",
        title: "Klimabonus chauffe-eau thermo",
        body: "Le remplacement d'un chauffe-eau électrique direct par un thermodynamique est éligible au Klimabonus, généralement entre 400 et 1 000 € selon le dossier. À demander avant le devis ferme.",
      },
      { type: "h2", text: "Et la marque ?" },
      {
        type: "p",
        text: "Atlantic Calypso, Thermor, De Dietrich, Daikin Altherma Tank — toutes proposent des modèles 200-300 L performants. Le COP réel à -7 °C extérieur, la garantie cuve (5 à 10 ans selon modèle) et la disponibilité pièces sur 15 ans sont les critères qui comptent. Le « bruit » du compresseur peut aussi décider du choix selon l'emplacement.",
      },
    ],
    related: ["comment-choisir-pompe-chaleur-luxembourg-2026"],
  },
  {
    slug: "renovation-salle-de-bain-7-etapes-cles",
    title: "Rénover sa salle de bain au Luxembourg : 7 étapes clés",
    excerpt:
      "De la première esquisse au nettoyage de chantier, les étapes incontournables d'une rénovation de salle de bain réussie. Calendrier réaliste, pièges à éviter.",
    category: "metier",
    readingMinutes: 6,
    publishedAt: "2026-04-05",
    author: "Bureau d'études · Chauffage Artisanal",
    cover:
      "https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?q=80&w=1600&auto=format&fit=crop",
    body: [
      {
        type: "p",
        text: "Une rénovation de salle de bain bien menée se distingue d'une rénovation chaotique non pas par le budget — mais par la méthode. Voici les 7 étapes que nous appliquons systématiquement sur les chantiers haut de gamme au Luxembourg.",
      },
      { type: "h2", text: "1. Diagnostic existant (semaine 1)" },
      {
        type: "p",
        text: "Avant tout choix esthétique, on inspecte : état des évacuations, accessibilité des arrivées d'eau, électricité aux normes (DTU 60-1), surface réelle, ventilation. Cette visite technique conditionne TOUT le reste — un défaut découvert en cours de chantier double les délais.",
      },
      { type: "h2", text: "2. Programme et budget cadré (semaine 2)" },
      {
        type: "p",
        text: "Liste des éléments souhaités, gammes envisagées, contraintes (âgé, PMR, enfants), budget global. À cette étape, on cale aussi les marques préférées (Hansgrohe, Grohe, Duravit, Geberit…) et le niveau de finition (carrelage standard ou marbre).",
      },
      { type: "h2", text: "3. Plans 2D + 3D (semaine 3-4)" },
      {
        type: "p",
        text: "Pour les chantiers significatifs (12 000 € et plus), nous travaillons avec un architecte d'intérieur. Plans techniques + rendus 3D pour validation client. Permet de visualiser avant de commander les éléments, éviter les regrets.",
      },
      { type: "h2", text: "4. Devis détaillé poste par poste (semaine 5)" },
      {
        type: "list",
        items: [
          "Démolition + évacuation (5-10 % du budget)",
          "Plomberie + sanitaire (25-35 %)",
          "Électricité (5-10 %)",
          "Carrelage + sols (15-25 %)",
          "Robinetterie + douche/baignoire (10-20 %)",
          "Finitions + accessoires (5-10 %)",
          "Coordination + nettoyage (5-10 %)",
        ],
      },
      { type: "h2", text: "5. Commande matériaux (semaine 6, 4-6 sem. de délai)" },
      {
        type: "p",
        text: "Les sanitaires premium ont des délais de 4 à 8 semaines. On les commande dès la signature pour ne pas bloquer le chantier. La douche italienne sur mesure peut nécessiter 10 semaines.",
      },
      { type: "h2", text: "6. Chantier (3 à 5 semaines)" },
      {
        type: "p",
        text: "Démolition (2-3 jours), plomberie/élec brutes (1 semaine), chape (1-2 jours + 21 jours séchage si chape humide), carrelage (1 semaine), pose sanitaires (3-5 jours), finitions (3-5 jours). Photos quotidiennes, planning hebdo communiqué.",
      },
      { type: "h2", text: "7. Réception + livret usager" },
      {
        type: "p",
        text: "Tour de la salle de bain avec le client, point sur chaque détail, livret d'usage des équipements (mitigeur thermostatique, sèche-serviettes, ventilation hygroréglable), garanties remises. Nettoyage de fin de chantier, protection des sols levée.",
      },
      {
        type: "callout",
        tone: "info",
        title: "TVA réduite Luxembourg",
        body: "Sous conditions d'ancienneté du logement, la TVA réduite s'applique aux travaux de rénovation sanitaire au LU. Le devis le précise clairement.",
      },
    ],
    related: [],
  },
  {
    slug: "ventilation-double-flux-vs-simple-flux",
    title: "VMC double flux ou simple flux : laquelle choisir",
    excerpt:
      "La double flux récupère 90 % de la chaleur — mais coûte 3 à 4 fois plus cher. Quand la simple flux hygroréglable suffit, quand la double flux est indispensable.",
    category: "technique",
    readingMinutes: 5,
    publishedAt: "2026-03-18",
    author: "Bureau d'études · Chauffage Artisanal",
    cover:
      "https://images.unsplash.com/photo-1527689368864-3a821dbccc34?q=80&w=1600&auto=format&fit=crop",
    body: [
      {
        type: "p",
        text: "La ventilation mécanique contrôlée est un sujet souvent négligé — alors qu'elle conditionne la qualité de l'air intérieur, l'humidité du logement et même l'efficacité du chauffage. Tour d'horizon des deux grandes familles pour choisir en connaissance.",
      },
      { type: "h2", text: "Simple flux hygroréglable : la solution accessible" },
      {
        type: "p",
        text: "Une VMC simple flux extrait l'air vicié des pièces humides (cuisine, salle de bain, WC) et laisse entrer l'air neuf par des grilles d'entrée. La version hygroréglable module les débits selon l'humidité — c'est aujourd'hui le standard pour les rénovations légères et appartements.",
      },
      {
        type: "list",
        items: [
          "Coût posé : 1 800-3 500 € (maison 150 m²)",
          "Économies d'énergie : modérées vs VMC autoréglable",
          "Entretien : changement bouches 1×/an, nettoyage gaines 1×/5 ans",
          "Pertinent en : rénovations, appartements, budget contraint",
        ],
      },
      { type: "h2", text: "Double flux à récupération : la performance" },
      {
        type: "p",
        text: "La VMC double flux prélève l'air sortant et l'air entrant séparément, puis transfère la chaleur de l'un à l'autre dans un échangeur — récupération jusqu'à 92 %. L'air entrant est filtré (pollens, particules fines), tempéré. Indispensable en construction passive ou BBC.",
      },
      {
        type: "list",
        items: [
          "Coût posé : 6 000-12 000 € (maison 150-200 m²)",
          "Économies : 15-25 % sur la facture chauffage",
          "Entretien : filtres 1-2×/an, nettoyage échangeur 1×/3 ans",
          "Pertinent en : neuf BBC/passif, rénovation lourde haute performance",
        ],
      },
      {
        type: "callout",
        tone: "highlight",
        title: "Klimabonus VMC double flux",
        body: "L'installation d'une VMC double flux à récupération est éligible au Klimabonus dans le cadre d'une rénovation énergétique complète. Aide indicative 1 500-3 500 € selon dossier.",
      },
      { type: "h2", text: "Comment décider" },
      {
        type: "p",
        text: "La question simple à se poser : votre maison est-elle bien isolée ? Si oui, la déperdition par l'air sortant représente 20-30 % de votre facture chauffage. La double flux la récupère, l'investissement supplémentaire (~5 000 €) s'amortit en 8-12 ans. Si l'isolation est faible, la double flux est moins prioritaire — investir d'abord dans l'isolation, puis dans la double flux ensuite.",
      },
    ],
    related: ["pac-hybride-renovation-quand-cest-pertinent"],
  },
  {
    slug: "tva-3-pourcent-logement-luxembourg-2026",
    title: "TVA 3 % logement Luxembourg 2026 : le seuil à 10 ans change la donne",
    excerpt:
      "Le taux réduit à 3 % au lieu de 17 % s'applique désormais aux logements de plus de 10 ans (vs 20 avant 2026). Conditions exactes, démarche, cumul avec Klimabonus.",
    category: "klimabonus",
    readingMinutes: 5,
    publishedAt: "2026-05-20",
    author: "Bureau d'études · Chauffage Artisanal",
    cover:
      "https://images.unsplash.com/photo-1554224155-6726b3ff858f?q=80&w=1600&auto=format&fit=crop",
    body: [
      {
        type: "p",
        text: "La TVA logement à 3 % est probablement l'aide la plus utilisée mais la moins comprise au Luxembourg. Sur un chantier de 30 000 €, c'est 4 200 € d'économies vs le taux standard. Mode d'emploi à jour 2026.",
      },
      { type: "h2", text: "Le seuil à 10 ans : la grande nouveauté 2026" },
      {
        type: "p",
        text: "Avant la réforme, le logement devait avoir 20 ans pour bénéficier de la TVA logement à 3 %. Depuis le 1er janvier 2026, le seuil est descendu à 10 ans. Concrètement : si le permis de construire de votre maison date d'avant 2016, vous êtes éligible.",
      },
      {
        type: "callout",
        tone: "highlight",
        title: "À vérifier sur l'extrait cadastral",
        body: "La date à retenir est celle du permis de construire, pas celle de l'achèvement. Vérifiable sur l'extrait cadastral (cadastre.lu) ou auprès de la commune.",
      },
      { type: "h2", text: "Quels travaux sont éligibles ?" },
      {
        type: "list",
        items: [
          "Rénovation chauffage (chaudière, PAC, hybride)",
          "Rénovation sanitaire (salle de bain, plomberie, chauffe-eau)",
          "Isolation thermique et acoustique",
          "Travaux électriques liés à la rénovation",
          "Ventilation et climatisation",
          "Carrelage, peinture, finitions dans le cadre d'une rénovation",
        ],
      },
      { type: "h2", text: "Conditions transverses" },
      {
        type: "list",
        items: [
          "Usage principal habitation (pas résidence secondaire en location)",
          "Logement > 10 ans (date permis de construire)",
          "Entreprise enregistrée au Luxembourg",
          "Demande à formaliser par l'entreprise sur la facture",
        ],
      },
      { type: "h2", text: "Cumul avec autres aides" },
      {
        type: "p",
        text: "La TVA 3 % est CUMULABLE avec le Klimabonus, les aides communales Klimapakt, le Klimaprêt BCEE à 1,5 %, et le Complément social. C'est rarement une « aide isolée » mais un avantage de plus dans le package.",
      },
      { type: "h2", text: "Démarche" },
      {
        type: "p",
        text: "C'est l'entreprise qui applique le taux réduit sur la facture, après vérification de l'éligibilité du logement. Aucune démarche client préalable obligatoire — mais on vous demande l'extrait cadastral en début de projet. Sur les chantiers > 30 000 €, une attestation peut être requise.",
      },
    ],
    related: ["klimabonus-2026-ce-quil-faut-savoir"],
  },
  {
    slug: "test-blower-door-luxembourg-obligation",
    title: "Test Blower Door au Luxembourg : quand est-il obligatoire ?",
    excerpt:
      "Mesure d'étanchéité à l'air DIN ISO 9972 — obligatoire pour PassivHaus, recommandée pour Klimabonus rénovation lourde. Coût, méthode, ce que ça change pour votre facture.",
    category: "technique",
    readingMinutes: 5,
    publishedAt: "2026-05-10",
    author: "Bureau d'études · Chauffage Artisanal",
    cover:
      "https://images.unsplash.com/photo-1581094271901-8022df4466f9?q=80&w=1600&auto=format&fit=crop",
    body: [
      {
        type: "p",
        text: "Le test Blower Door (mesure d'étanchéité à l'air d'un bâtiment selon la norme DIN ISO 9972) revient régulièrement dans les devis VMC double flux et rénovations énergétiques poussées. Décryptage de ce qu'il mesure, quand il est requis, et ce qu'il prouve.",
      },
      { type: "h2", text: "Ce que mesure le Blower Door" },
      {
        type: "p",
        text: "Une porte étanche équipée d'un ventilateur calibré met le bâtiment en surpression ou dépression de 50 Pa. On mesure le débit d'air nécessaire pour maintenir cette différence de pression — converti en n50 (renouvellements d'air par heure à 50 Pa). Plus n50 est bas, plus le bâtiment est étanche.",
      },
      {
        type: "callout",
        tone: "info",
        title: "Valeurs cibles",
        body: "n50 ≤ 0,6 h⁻¹ : passif obligatoire · n50 ≤ 1,5 h⁻¹ : BBC rénovation typique · n50 ≤ 3 h⁻¹ : neuf standard. Au-delà de 5 h⁻¹, l'enveloppe est passoire.",
      },
      { type: "h2", text: "Quand est-il obligatoire au Luxembourg ?" },
      {
        type: "list",
        items: [
          "Bâtiment passif (PassivHaus certifié) : oui, n50 ≤ 0,6 obligatoire",
          "Rénovation énergétique Klimabonus avec conseil énergie : souvent demandé pour validation",
          "VMC double flux : recommandé en amont pour valider l'enveloppe (sinon la double flux fuit l'air récupéré)",
          "Construction neuve standard : non obligatoire mais bonne pratique",
        ],
      },
      { type: "h2", text: "Coût et durée" },
      {
        type: "p",
        text: "Au Luxembourg, comptez 350 à 700 € pour un test Blower Door sur maison individuelle, en fonction de la surface et de la complexité. Durée : 2-3 heures sur place. Une thermographie infrarouge complémentaire peut être ajoutée (+200 €) pour cartographier les fuites précisément.",
      },
      { type: "h2", text: "Pourquoi ça change tout pour votre VMC" },
      {
        type: "p",
        text: "Une VMC double flux à 92 % de récupération sur un bâtiment avec n50 = 5 récupère en pratique 30-40 % au lieu de 92 %. L'air s'échappe par les fuites avant d'avoir cédé sa chaleur à l'échangeur. Sans Blower Door préalable, on installe potentiellement une VMC chère qui ne tient pas ses promesses.",
      },
      { type: "h2", text: "Pratique conseillée" },
      {
        type: "p",
        text: "Sur les rénovations performantes, nous recommandons systématiquement un test Blower Door en début de projet (audit de l'existant) ET en fin de chantier (validation). C'est 1 400 € de tests qui sécurisent un investissement de 30-50 000 € en chauffage et ventilation.",
      },
    ],
    related: ["ventilation-double-flux-vs-simple-flux"],
  },
  {
    slug: "verifier-permis-construire-cadastre-luxembourg",
    title: "Vérifier l'ancienneté de votre logement (cadastre Luxembourg)",
    excerpt:
      "Plusieurs aides 2026 (TVA 3 %, Klimabonus isolation, fenêtres) exigent un logement de plus de 10 ans. Comment obtenir la date du permis officiel en 10 minutes.",
    category: "klimabonus",
    readingMinutes: 4,
    publishedAt: "2026-05-03",
    author: "Bureau d'études · Chauffage Artisanal",
    cover:
      "https://images.unsplash.com/photo-1568667256549-094345857637?q=80&w=1600&auto=format&fit=crop",
    body: [
      {
        type: "p",
        text: "Le seuil des 10 ans est le sésame de plusieurs aides 2026 importantes : TVA logement à 3 %, Klimabonus isolation, remplacement fenêtres triple vitrage. La date de référence : le permis de construire — pas la date d'achèvement, pas la date d'achat. Comment l'obtenir.",
      },
      { type: "h2", text: "Méthode 1 — Extrait cadastral en ligne (5 min, gratuit)" },
      {
        type: "p",
        text: "Le portail data.public.lu propose une cartographie cadastrale gratuite. Repérez votre parcelle sur la carte, ouvrez la fiche, vérifiez les informations affichées. La date du permis de construire n'y est pas toujours, mais l'année de construction y figure souvent.",
      },
      { type: "h2", text: "Méthode 2 — Demande à la commune (1-3 jours)" },
      {
        type: "p",
        text: "Service Urbanisme de votre commune (chaque mairie a un guichet dédié). Avec votre adresse précise + section cadastrale, ils retrouvent le dossier d'origine du permis. Service gratuit ou modique selon les communes. Délai 1-3 jours.",
      },
      { type: "h2", text: "Méthode 3 — Acte d'achat ou bail emphytéotique" },
      {
        type: "p",
        text: "L'acte notarié de votre achat mentionne souvent la date du permis de construire ou au minimum la date d'achèvement. Si l'année est antérieure à 2016, vous êtes potentiellement éligible aux aides à seuil 10 ans.",
      },
      {
        type: "callout",
        tone: "warning",
        title: "Cas limite : extensions / restructurations",
        body: "Si votre maison a subi une extension récente, c'est la date du permis ORIGINAL qui compte, pas celle de l'extension. À confirmer auprès de la commune en cas de doute.",
      },
      { type: "h2", text: "Aides à seuil 10 ans en 2026" },
      {
        type: "list",
        items: [
          "TVA logement à 3 % (au lieu de 17 %) sur travaux rénovation",
          "Klimabonus isolation toiture, murs, sol",
          "Klimabonus remplacement fenêtres triple vitrage",
          "Klimabonus VMC dans cadre rénovation énergétique globale",
        ],
      },
      { type: "h2", text: "Notre rôle dans la démarche" },
      {
        type: "p",
        text: "Nous vous accompagnons sur la vérification cadastrale en début de projet (souvent en visite technique). Si le seuil n'est pas atteint, on optimise différemment l'aide. C'est un point qu'on traite en amont — pour éviter les mauvaises surprises au moment du devis.",
      },
    ],
    related: [
      "tva-3-pourcent-logement-luxembourg-2026",
      "klimabonus-2026-ce-quil-faut-savoir",
    ],
  },
  {
    slug: "depannage-chauffage-hiver-luxembourg",
    title: "Plus de chauffage en hiver au Luxembourg : que faire dans l'heure",
    excerpt:
      "Avant d'appeler l'astreinte : les 5 vérifications utiles à faire vous-même. Et ce qu'il faut absolument éviter de faire (sécurité, garantie).",
    category: "metier",
    readingMinutes: 5,
    publishedAt: "2026-04-12",
    author: "Bureau d'études · Chauffage Artisanal",
    cover:
      "https://images.unsplash.com/photo-1605712916066-94d23612e2b3?q=80&w=1600&auto=format&fit=crop",
    body: [
      {
        type: "p",
        text: "Plus de chaud à -5 °C dehors, c'est l'urgence numéro 1 en hiver luxembourgeois. Avant d'appeler l'astreinte (qui coûte 200-280 €), 5 vérifications prennent 10 minutes et résolvent 30 % des cas.",
      },
      { type: "h2", text: "1. La chaudière est-elle en défaut visible ?" },
      {
        type: "p",
        text: "Regardez l'afficheur. Un code erreur, une lumière rouge clignotante, un écran éteint = informations utiles. Notez le code (ex: E124, F4) — vous le donnerez au technicien. La majorité des chaudières modernes affichent un défaut explicite (manque de pression, manque de gaz, sonde extérieure HS).",
      },
      { type: "h2", text: "2. La pression d'eau est-elle correcte ?" },
      {
        type: "p",
        text: "Sur les chaudières gaz, un manomètre indique la pression du circuit. Cible : 1 à 1,5 bar à froid. En dessous de 0,8 bar : la chaudière se met en sécurité. Solution : rajouter de l'eau via la vanne de remplissage (vanne sous la chaudière). N'allez pas au-delà de 1,8 bar.",
      },
      {
        type: "callout",
        tone: "warning",
        title: "Pas plus de 2 fois par hiver",
        body: "Si vous devez remplir le circuit plus de 2 fois en hiver, il y a une fuite quelque part. Pas grave si infime — mais à signaler au technicien pour traitement durable.",
      },
      { type: "h2", text: "3. Le compteur de gaz / la cuve fioul ?" },
      {
        type: "p",
        text: "Vérifiez que le compteur de gaz n'a pas été coupé (vanne dans le sous-sol, à proximité du compteur Creos). Pour le fioul : niveau cuve > 20 %. Si la cuve est en réserve, la chaudière s'arrête.",
      },
      { type: "h2", text: "4. Le thermostat fonctionne ?" },
      {
        type: "p",
        text: "Si écran noir : piles à changer (la pile pirate dans 80 % des cas où le chauffage ne démarre pas). Si thermostat connecté : redémarrer le wifi / vérifier que le contrôle distant n'a pas baissé la consigne accidentellement.",
      },
      { type: "h2", text: "5. Les radiateurs sont chauds en haut, froids en bas ?" },
      {
        type: "p",
        text: "C'est un signe de désembouage à faire (le circuit s'est rempli de boues). Pas une urgence immédiate, mais à programmer dans les semaines suivantes. Si les radiateurs sont chauds en bas et froids en haut : il faut purger.",
      },
      { type: "h2", text: "Ce qu'il NE FAUT PAS faire" },
      {
        type: "list",
        items: [
          "Bricoler la chaudière sans formation (perte garantie, risque gaz)",
          "Bypasser une sécurité (sondes, pressostat)",
          "Démarrer un appoint électrique sans s'assurer du circuit (risque incendie)",
          "Démonter une PAC extérieure pour la « réchauffer » (très mauvaise idée)",
        ],
      },
      { type: "h2", text: "Quand appeler l'astreinte" },
      {
        type: "p",
        text: "Après les 5 vérifications ci-dessus, si la chaudière ne démarre toujours pas : appelez. Pour les pannes critiques en plein hiver, nous intervenons sous 2-4 h sur la zone Luxembourg-Ville et grande région. Numéro d'astreinte 24/7 : +352 49 88 41.",
      },
    ],
    related: [],
  },
  {
    slug: "choisir-installateur-agree-klima-agence",
    title: "Pourquoi un installateur agréé Klima-Agence (et comment vérifier)",
    excerpt:
      "Toutes les aides Klimabonus 2026 exigent un installateur agréé. C'est ce qui sépare l'artisan « qui sait faire » du dossier d'aide qui passe. Vérifier en 30 secondes.",
    category: "klimabonus",
    readingMinutes: 4,
    publishedAt: "2026-03-25",
    author: "Bureau d'études · Chauffage Artisanal",
    cover:
      "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?q=80&w=1600&auto=format&fit=crop",
    body: [
      {
        type: "p",
        text: "Toutes les aides nationales luxembourgeoises (Klimabonus 2026, TVA réduite, aides communales) ont une condition transverse : l'installateur doit être agréé. Un piège classique : signer un devis sans vérifier, et découvrir trop tard que l'aide ne s'applique pas.",
      },
      { type: "h2", text: "Pourquoi l'agrément existe" },
      {
        type: "p",
        text: "L'État luxembourgeois ne distribue pas d'argent public sans garantie que les installations tiendront. L'agrément Klima-Agence atteste qu'une entreprise a démontré une formation continue, des techniciens qualifiés, et un historique propre sur les installations passées. C'est un filtre, pas une formalité.",
      },
      { type: "h2", text: "Qui est concerné ?" },
      {
        type: "list",
        items: [
          "Installations photovoltaïques (PV) — agrément spécifique",
          "Pompes à chaleur (air/eau, géothermique)",
          "Chaudières biomasse (pellets, bûches)",
          "Solaire thermique",
          "Réseaux de chaleur",
          "Systèmes de gestion d'énergie (HEMS)",
        ],
      },
      {
        type: "callout",
        tone: "highlight",
        title: "Comment vérifier en 30 secondes",
        body: "Demandez à votre installateur son numéro d'agrément Klima-Agence pour le type de projet. Vérifiez sur le portail klima-agence.lu si le nom de l'entreprise apparaît dans la liste des partenaires accrédités. Si l'entreprise hésite ou tergiverse, c'est un signal d'alarme.",
      },
      { type: "h2", text: "Comment l'agrément se gagne" },
      {
        type: "p",
        text: "Formation initiale + formation continue annuelle (typiquement 14-21 heures/an), audit chantier ponctuel, déclaration des installations posées avec leur performance mesurée. C'est exigeant — mais c'est ce qui sépare la qualité moyenne de la qualité contrôlée.",
      },
      { type: "h2", text: "Ce que ça change pour vous concrètement" },
      {
        type: "list",
        items: [
          "Aides Klimabonus accessibles (sinon : zéro aide)",
          "TVA réduite 3 % applicable",
          "Recours possible auprès de Klima-Agence en cas de litige technique",
          "Engagement de l'installateur sur résultat (rendement, performance)",
        ],
      },
      { type: "h2", text: "Notre position" },
      {
        type: "p",
        text: "Nous tenons à jour les agréments Klima-Agence pour les catégories que nous installons. Sur chaque devis avec aide attendue, le numéro d'agrément est mentionné explicitement — pour que vous puissiez vérifier en amont, et pour que le dossier client puisse être monté sans accroc.",
      },
    ],
    related: ["klimabonus-2026-ce-quil-faut-savoir"],
  },
];

export function getArticle(slug: string): Article | undefined {
  return ARTICLES.find((a) => a.slug === slug);
}

export function getRelatedArticles(slug: string): Article[] {
  const a = getArticle(slug);
  if (!a?.related) return [];
  return a.related
    .map((s) => getArticle(s))
    .filter((x): x is Article => x !== undefined);
}
