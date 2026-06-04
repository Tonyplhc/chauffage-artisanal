# Storyline pitch client — 15 minutes

> Document de scénarisation pour la présentation produit en rendez-vous client.
> Pas un argumentaire commercial — un **script de démonstration** détaillé,
> minute par minute, avec chemins de clic et phrases-clés.

**Prérequis avant le rendez-vous** :

- Lancer `npm run seed:demo` ou cliquer « Générer 80 leads démo » dans
  `/admin/onboarding` → 80 leads répartis sur 24 mois, dashboards vivants.
- Vérifier `localhost:3020` accessible, projecteur calibré, mode plein écran.
- Avoir l'onglet `/admin/leads` ouvert et l'onglet `/devis` prêt dans une
  fenêtre séparée.
- Désactiver les notifications système (Slack, mail).
- Prévoir une bouteille d'eau, parler **20 % moins vite que d'habitude**.

**Posture éditoriale** : on parle d'un outil **opéré par le client**, pas d'un
service externalisé. On dit « **votre** pipeline », « **vos** leads », « **votre**
forecast ». Le client est propriétaire de ses données et de son workflow.

---

## Décor & accroche (0 – 1 min)

**Ce qu'on dit (mot-à-mot)** :

> « Vous gérez aujourd'hui vos demandes entrantes par email, téléphone, peut-être
> WhatsApp. Vos devis sont dans Word, vos rappels dans la tête. Ce qu'on va
> regarder ensemble, c'est une plateforme qui centralise tout, **sans rien
> imposer** : c'est votre métier qui pilote, pas l'outil. Trois minutes pour
> la promesse, douze pour la démo. Allons-y. »

**Ce qu'on montre** : l'écran d'accueil du site public `localhost:3020`.

**Ne pas faire** : démarrer par les fonctionnalités. Démarrer par le problème.

---

## Acte 1 — Le lead entrant (1:00 – 2:30)

**But** : montrer que la collecte d'info est intelligente, non-intrusive, et
qu'elle produit un dossier qualifié.

**Chemin** :
1. Ouvrir `/devis` côté public.
2. Remplir en direct : type bâtiment **maison**, surface **180 m²**, énergie
   actuelle **fioul**, services **chauffage + PAC**, budget **20-40 k€**,
   timeline **court**, commune **Strassen**, prénom/nom/email/téléphone fictifs.
3. **Sans soumettre** : cliquer sur la page de récap avant validation.
4. Soumettre. Affichage du message de confirmation avec référence.

**Ce qu'on dit** :

> « Le client voit un formulaire qui ressemble à un échange — pas un
> questionnaire administratif. Multi-sélection des services, options
> photos, prise en compte du timing. Côté technique : validation Zod, anti-spam
> honeypot, rate-limit. Côté commercial : on capte assez d'info pour qualifier
> sans noyer le visiteur. »

**Transition** : « Vous, vous le recevez immédiatement ici → »

---

## Acte 2 — Le pipeline pondéré (2:30 – 4:00)

**But** : projeter le décideur dans son tableau de pilotage quotidien.

**Chemin** :
1. Ouvrir `/admin/leads` → le lead qu'on vient de créer est en haut.
2. Survoler la colonne **Score** → expliquer le scoring (1-2 phrases).
3. Cliquer sur **Forecast pondéré** dans la barre d'outils.
4. Montrer les 5 colonnes : nouveau / contacté / devis / converti / perdu avec
   les valeurs estimées + probabilités.
5. Retour `/admin/leads`, cliquer **Kanban** → mode drag&drop.

**Ce qu'on dit** :

> « Chaque lead a une valeur estimée, basée sur le budget déclaré ou une
> estimation prudente. Le pipeline pondéré multiplie cette valeur par une
> probabilité associée au statut — c'est ce que vous **espérez** réaliser. Ce
> n'est pas une projection magique, c'est une arithmétique transparente. Vous
> voyez le forecast bouger quand vous changez les statuts. »

**Phrase-clé** : « Vous arrêtez de piloter au feeling. »

---

## Acte 3 — La fiche lead 360° (4:00 – 6:00)

**But** : montrer la profondeur fonctionnelle sur **un seul écran**.

**Chemin** :
1. Cliquer sur un lead démo (de préférence un `devis_envoye` avec historique).
2. Faire défiler **lentement** en commentant chaque bloc :
   - Coordonnées + score + bouton WhatsApp/téléphone
   - Timeline unifié (chat + commentaires + transitions)
   - **Next best action** (encadré copper) — pointer du doigt
   - **Tech suggestions** (3 techniciens scorés)
   - **Email suggestions** (déplier 1 carte, montrer copier sujet/corps)
   - Documents, équipements installés, paiement, RGPD
3. Cliquer sur un **commentaire** existant pour montrer la mention `@`.

**Ce qu'on dit** :

> « Tout ce que votre équipe doit savoir sur ce client est sur **une page**.
> Pas de tabs en pagaille, pas de bascule entre outils. Et certains blocs sont
> intelligents : ici, l'outil vous suggère le bon technicien selon ses
> compétences et sa charge ; là, il vous prépare 4 brouillons de réponse
> contextualisés. Vous gardez la main éditoriale — c'est marqué « copier »,
> pas « envoyer ». »

**Phrase-clé** : « L'outil propose, vous décidez. »

---

## Acte 4 — Forecast saisonnier (6:00 – 7:30)

**But** : montrer une intelligence collective des données.

**Chemin** :
1. Retour `/admin/leads` → cliquer **Forecast saisonnier**.
2. Montrer la barre d'index saisonnier (12 mois) — pointer un mois fort/faible.
3. Faire défiler le graphique historique + projection (24 mois passés + 6 futurs).
4. Changer l'horizon à 12 mois → le tableau se recalcule.
5. Pointer la mention « pas d'ARIMA — projection naïve volontairement
   auditable » en bas de page.

**Ce qu'on dit** :

> « Cette projection ne vient pas d'un algorithme magique fermé. On part de
> **vos** données : 24 mois d'historique, on calcule un index de saisonnalité
> par mois calendaire, une tendance moyenne mobile, une pente. Tout est
> additionné, multiplié, et affiché avec une bande d'incertitude qui croît
> avec l'horizon. Vous pouvez le re-faire au crayon si vous voulez. »

**Phrase-clé** : « Pas de boîte noire. »

---

## Acte 5 — Pricing intelligence & heatmap géo (7:30 – 9:00)

**But** : démontrer la valeur stratégique des données accumulées.

**Chemin** :
1. Cliquer **Pricing** dans la barre d'outils.
2. Pointer la table des segments avec CV (coefficient de variation).
3. Scroller jusqu'aux outliers — cliquer sur un devis aberrant.
4. Revenir, ouvrir **Heat map géographique**.
5. Trier par « Forecast pondéré » → montrer les communes premium.

**Ce qu'on dit** :

> « Au bout d'un an d'utilisation, vous avez un capital de données qui vaut
> de l'or : vos prix moyens par segment, vos zones géographiques rentables,
> vos devis aberrants qu'il faut investiguer. Vous arrêtez de vendre au pif —
> vous vendez avec un repère statistique. »

**Phrase-clé** : « C'est votre histoire commerciale qui pilote vos prix. »

---

## Acte 6 — ROI marketing (9:00 – 10:00)

**But** : ancrer le ROI direct dans le portefeuille du décideur.

**Chemin** :
1. Cliquer **Marketing ROI** dans la barre d'outils.
2. Pointer les 4 KPIs en haut (leads, CA estimé, dépense, ROI global).
3. Saisir un budget mensuel sur une source (cliquer le bouton « définir »).
4. Le tableau se recalcule → CAC, ROI mis à jour.

**Ce qu'on dit** :

> « Saisissez ce que vous dépensez par canal. L'outil croise avec les
> conversions et vous dit : **chaque euro Google Ads vous rapporte X €**. Si
> c'est rouge, vous arrêtez. Si c'est vert, vous accélérez. Ce dashboard
> finance la solution **avant le 3ᵉ mois**. »

**Phrase-clé** : « Le ROI n'est plus une croyance, c'est une mesure. »

---

## Acte 7 — Conformité & sérieux (10:00 – 11:30)

**But** : rassurer sur les sujets qui inquiètent un patron de PME (RGPD,
audit, sécurité).

**Chemin** :
1. Cliquer **Rapport RGPD** dans la barre d'outils.
2. Pointer les 5 finalités de traitement, expliquer base légale (1 phrase).
3. Cliquer **Imprimer / PDF** → montrer le mode imprimable.
4. Revenir, ouvrir un lead → bouton **Exporter RGPD** → JSON téléchargé.
5. Ouvrir `/admin/activity` → log d'audit horodaté de toutes les actions.

**Ce qu'on dit** :

> « Vous êtes responsable de traitement. Si demain la CNPD frappe à la porte,
> vous avez un registre, des preuves, et la capacité d'exporter ou supprimer
> les données d'un client en un clic. Tout est tracé. Vous savez qui a fait
> quoi quand. »

**Phrase-clé** : « Vous êtes conforme par construction. »

---

## Acte 8 — Multi-marque & white-label (11:30 – 12:30)

**But** : ouvrir la perspective long terme (groupe, marque blanche, croissance).

**Chemin** :
1. Cliquer **Marques blanches** dans la barre d'outils.
2. Cliquer **Nouvelle marque** → créer une fausse marque (couleurs vives,
   nom court).
3. Montrer le bandeau gradient des 3 couleurs.
4. Cliquer **Activer** pour basculer le cookie.

**Ce qu'on dit** :

> « Si demain vous rachetez un confrère, vous gérez deux marques sur la même
> base sans dupliquer l'outil. Si vous voulez vendre l'outil en marque blanche
> à d'autres artisans, vous avez la structure. C'est une option, pas une
> contrainte — vous restez maître de votre modèle. »

**Phrase-clé** : « L'outil grandit avec vous. »

---

## Conclusion & next steps (12:30 – 15:00)

**Ce qu'on dit** :

> « Ce que vous venez de voir est la base. Trois remarques honnêtes pour
> finir :
>
> 1. **Aucune intégration externe** ne tourne en démo aujourd'hui (Stripe en
>    mode test, Resend en mode console). C'est volontaire — on les branche
>    quand vous décidez d'y aller, et on vous facture le coût réel.
>
> 2. **Vos vraies données** ne ressemblent pas aux 80 leads démo. La courbe
>    de valeur va se construire au fur et à mesure. Comptez 2-3 mois pour que
>    les dashboards saisonniers deviennent vraiment parlants.
>
> 3. **L'outil est opéré par vous**. Notre rôle, c'est de vous le livrer, de
>    vous former, et d'être joignables. Pas de SaaS captif, pas
>    d'abonnement obligatoire — vous êtes propriétaire du code.
>
> Question que je vous pose maintenant : **qu'est-ce qui vous bloque pour
> dire oui aujourd'hui ?** »

---

## Objections fréquentes — réponses préparées

| Objection                              | Réponse                                                                                                                          |
| -------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| « C'est trop pour nous »               | « D'accord. Commencez par les 4 features que vous utiliserez vraiment : pipeline, devis, RGPD, forecast. Le reste attend. »      |
| « Combien ça coûte vraiment ? »        | « Le code, [montant fixe]. L'hébergement, ~[X]€/mois. Les intégrations, à la conso. C'est dans la proposition commerciale. »     |
| « Mes équipes ne s'en serviront pas »  | « Le pipeline et la fiche lead suffisent au début. Le reste s'apprend à la demande. On forme votre référent en 2 demi-journées. » |
| « Et si je veux partir dans 2 ans ? »  | « Vous repartez avec vos données (export JSON/CSV/SQL) et avec le code source. Pas de lock-in. »                                 |
| « Pourquoi pas Salesforce / HubSpot ? » | « Parce qu'ils sont génériques. Cet outil est spécialisé HVAC Luxembourg : aides Klimabonus, communes, services métier. »       |
| « Vous êtes seul ? »                   | « Oui, et c'est documenté. Le code est lisible, transmissible. Si je disparais, un autre dev reprend en 2-3 semaines. »          |

---

## Cheatsheet timing

| Acte                                | Durée   | Cumul  |
| ----------------------------------- | ------- | ------ |
| Décor & accroche                    | 1 min   | 1:00   |
| Acte 1 — Lead entrant               | 1:30    | 2:30   |
| Acte 2 — Pipeline pondéré           | 1:30    | 4:00   |
| Acte 3 — Fiche lead 360°            | 2:00    | 6:00   |
| Acte 4 — Forecast saisonnier        | 1:30    | 7:30   |
| Acte 5 — Pricing & heatmap          | 1:30    | 9:00   |
| Acte 6 — ROI marketing              | 1:00    | 10:00  |
| Acte 7 — Conformité                 | 1:30    | 11:30  |
| Acte 8 — Multi-marque               | 1:00    | 12:30  |
| Conclusion + objections             | 2:30    | 15:00  |

**Marge de manœuvre** : si le client interrompt souvent (bon signe), couper
les actes 5 et 8 et garder du temps pour la conclusion. Si le client est très
silencieux, **demander une question toutes les 3 minutes** pour vérifier
l'attention.

---

## Après le rendez-vous

- Envoyer le PDF de la `PROPOSITION-COMMERCIALE.md` dans les 24h.
- Si feu vert : proposer un atelier de 90 min pour configurer marque,
  utilisateurs, premiers leads réels.
- Si refus : demander **honnêtement** ce qui a manqué. Documenter dans le CRM
  interne pour la prochaine présentation.
