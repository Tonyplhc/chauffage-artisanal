# Chauffage Artisanal — De la vitrine premium à la machine commerciale

> Document de vision produit & site. Consultant senior, hypothèses prises, aucune
> question. Objectif : qu'un visiteur comprenne en **< 10 secondes** combien il
> dépense, combien il économiserait, quelles aides il obtient, et pourquoi
> Chauffage Artisanal est le bon partenaire — puis qu'il **agisse**.

---

## 0 · La thèse

**Aujourd'hui le site vend une entreprise. Il doit vendre une opportunité financière.**

Les 6 références qui convertissent ne disent jamais « qui nous sommes » d'abord.
Elles disent **« voici votre argent »** : Octopus mène avec *« Save £9,000 with a
government grant »*, Enpal avec *« 0 € »*, Tesla avec *« le système qui vous fait
économiser le plus »*. **Toutes révèlent le bénéfice AVANT de demander un contact.**

La bascule tient en 3 mouvements :
1. **Le héros, c'est l'argent du visiteur**, pas l'histoire de l'entreprise.
2. **Révéler le résultat avant de capturer** (estimateur d'abord, formulaire ensuite).
3. **Transformer un achat à 25 000 € en micro-engagement réversible**
   (« réservez votre étude », pas « demandez un devis »).

---

# LIVRABLE 1 — Audit complet

## 1.1 Structure actuelle
Home : Hero (manifeste éditorial) → Bande confiance → Chiffres → Économies → Aides
→ Services → Process → *sections legacy (Timeline, Réalisations, Recrutement,
Partenaires, Avis, Zones, CTA final)*. **8 calculateurs** dispersés dans `/outils`.
Devis = formulaire 5 étapes. Réservation `/api/bookings` opérationnelle.

## 1.2 Ce qui FONCTIONNE
- **Identité éditoriale premium** ancrée sur le vrai logo (bleu cobalt + brique +
  crème). Déjà au-dessus de 95 % des chauffagistes LU.
- **Actifs de crédibilité RÉELS** sous-exploités : fondée **1994**, **RCS B46877**,
  **Fédération des Artisans**, **Fédération du Génie Technique**, partenaires
  **Viessmann / Buderus / De Dietrich**, garantie installation.
- **Briques techniques solides** : moteur de dimensionnement (`lib/pac-sizing.ts`,
  coeff. RT2012/2020, ΔT 30 K, 1800 h/an), ROI (`lib/roi-simulator.ts`), scoring de
  leads (`lib/lead-scoring.ts`), et **les vrais barèmes Klimabonus 2026**
  (`lib/klimabonus-2026.ts`, sourcés guichet.public.lu).
- **Sémaphore financier** (vert = gain / rouge = coût / neutre = après) déjà posé.

## 1.3 Ce qui NE FONCTIONNE PAS / bloque la conversion
| Problème | Pourquoi ça bloque | Qui fait mieux |
|---|---|---|
| Hero parle de **l'entreprise** | En 10 s, aucun chiffre qui concerne le visiteur | Octopus, Tesla |
| Aucun **« argent » above-the-fold** | Ne répond pas à « je dépense / j'économise / quelles aides » | Octopus |
| **Devis demandé avant tout résultat** | Effort exigé avant la récompense | Tesla, Octopus, Heat Geek (résultat d'abord) |
| **8 calculateurs séparés** | Paralysie + sensation « tableur » + incohérences | 1 estimateur guidé |
| **CTA multiples** (devis, dépannage, WhatsApp, chat, recrutement) | Dilue l'action unique | 1 CTA dominant |
| **Klimabonus incohérent** | Les bons forfaits (`klimabonus-2026`) ne sont branchés nulle part ; `klimabonus-checker` et `price-estimator` ont des barèmes faux | Octopus auto-applique le grant |
| **Preuve = placeholders** | Pas de vrais chiffres/avis/photos → déficit de confiance | Enpal « 100 000 clients », Heat Geek installateurs nommés |
| **Recrutement très visible en home** | Préoccupation candidat, pas acheteur → bruit | — |

## 1.4 Ce qui est INUTILE (couper / démoter)
- Le **manifeste éditorial** du hero (« c'est la méthode ») → remplacé par l'estimateur.
- **Recrutement** en home acheteur → page dédiée uniquement.
- **CTA secondaires** simultanés (WhatsApp + chat + dépannage + devis) → 1 primaire + 1 urgence.
- **6 des 8 calculateurs** → fusionnés dans l'estimateur ; gardés au plus comme pages SEO.

## 1.5 Ce qui MANQUE (le cœur)
- **L'estimateur immersif « commune-first »** qui révèle le résultat avant le contact.
- Le message **« on gère le Klimabonus de A à Z »** (enlever la corvée, pas que l'argent).
- Une **garantie de performance / confort** (« si ça ne performe pas, on revient »).
- **Équipe nommée + photographiée**, **vrais avis**, **vrais chantiers**.
- Cadrage **reste à charge / réversibilité** (« réservez », « sans engagement »).

## 1.6 Benchmark concurrentiel (mécaniques réelles observées)
| Marque | Mécanique de conversion clé |
|---|---|
| **Tesla** | Recommande *le système qui fait économiser le plus*, révèle l'estimation, puis **micro-engagement** (acompte 100 $ remboursable) avant tout contact humain. Honnêteté (« estimations, pas garanties ») = crédibilité. |
| **Enpal** | Hero **« 0 € »** + mensualité dès ~98 €, **« vous payez quand ça produit »**, calculateur d'économies avant l'expert. Autorité empilée (« 100 000 clients », TÜV, presse). |
| **Octopus** | **Le meilleur** : hero *grant* (£9 000) **auto-appliqué à chaque devis** + **on gère toute la paperasse** + 8 ans de garantie. Prix transparent « après grant ». Ton chaleureux. |
| **Heat Geek** | **Garantie de performance 5 ans** (« si ça ne performe pas, réparation gratuite ») + **installateurs nommés et photographiés** avec accréditations. Survol payant = filtre d'intention. |
| **Viessmann** | Premium « Made in Germany », mais **prix gated derrière le contact** → contre-exemple à ne pas suivre. |
| **Daikin** | Sliders d'hypothèses ajustables → l'économie paraît **personnelle et méritée**. |

**Top patterns à reprendre** : (1) entrée par adresse/commune ; (2) **résultat avant
contact** ; (3) **un chiffre-héros** empilé ; (4) **aide auto-appliquée + paperasse
gérée** ; (5) prix reframé en reste à charge ; (6) **micro-engagement** au lieu d'un
formulaire ; (7) preuve empilée au moment du CTA ; (8) **garantie de résultat** ;
(9) **humains nommés + photos** ; (10) pré-qualification d'intention dans le quiz.

**Notre angle imbattable** = le seul à combiner **éditorial premium + hyper-local
luxembourgeois + 30 ans + honnêteté + estimateur qui révèle l'argent**.

---

# LIVRABLE 2 — Nouvelle architecture homepage

**Principe : la home est un entonnoir vers l'estimateur**, pas un catalogue.
Chaque section lève une objection, dans l'ordre psychologique de la décision.

| # | Section | Rôle conversion |
|---|---|---|
| 0 | Barre urgence dépannage (☎, fine) | Capter la panne sans polluer le parcours achat |
| 1 | Nav par rôle + **1 CTA « Mon estimation »** | Une seule action dominante |
| 2 | **HERO = ENTRÉE ESTIMATEUR** | *Le* changement. Gauche : « Vous chauffez au **mazout/gaz** ? Voyez en 60 s ce que vous **récupérez** avec une pompe à chaleur — **aides comprises**. » + champ **commune** + chauffage actuel + **[Voir mes économies]**. Droite : aperçu du tableau de bord (gain vert). |
| 3 | Preuve immédiate (bande) | 1994 · RCS · Fédérations · Viessmann/Buderus/De Dietrich (+ avis/installs réels). Lever « est-ce sérieux ? » |
| 4 | Comment ça marche — 3 étapes | Estimation 60 s → **Étude gratuite sans engagement** → Installation + **Klimabonus géré**. Réversibilité = risque ↓ |
| 5 | Le résultat-type (tableau de bord) | Créer le **désir** : exemple de révélation (reste à charge après aides + économie + gain 10 ans, sémaphore vert) |
| 6 | Aides Luxembourg — « on s'occupe de tout » | Le move Octopus : l'aide = **corvée en moins** (dossier MyGuichet monté, reste à votre nom, zéro commission) |
| 7 | Pourquoi Chauffage Artisanal | 30 ans · interlocuteur unique · partenaires agréés · garantie. « Pourquoi eux ? » |
| 8 | Réalisations | Montrer, pas dire (structure de données déjà prête) |
| 9 | Équipe nommée + photos | Confiance au moment de décider (move Heat Geek) |
| 10 | Avis clients réels | Preuve sociale (NPS / Google à activer) |
| 11 | Garantie & engagement | De-risquer : SAV, garanties, « si ça ne performe pas… » |
| 12 | Promoteurs / B2B | Audience distincte, CTA « consultation projet » |
| 13 | FAQ | Tuer les objections (bruit, délais, copropriété, vieux radiateurs) |
| 14 | CTA final = retour estimateur + dépannage | Dernière conversion |
| 15 | Footer premium + maillage SEO communes | Autorité locale |

**Sections 2, 5, 6 = 80 % de la conversion.** Le reste lève des objections.
Recrutement **sort** de la home acheteur.

---

# LIVRABLE 3 — Estimateur IA (configurateur immersif, < 60 s)

**Ce n'est pas un calculateur. C'est une expérience qui recommande et révèle.**

## Principes
- **Une question par écran**, plein cadre, grande typo, progression, **valeurs par
  défaut intelligentes** (tout est glissable/sautable → 60 s tenables).
- **Commune-first** (« je vérifie mon éligibilité », pas « je remplis un formulaire »).
- **La révélation est un ÉVÉNEMENT**, pas une sortie de calcul.
- **Résultat AVANT contact.** Le contact = micro-engagement réversible.

## Parcours (≤ 6 micro-étapes, pré-rempli depuis le hero)
1. **Commune** (LU) → climat local + aides communales.
2. **Logement** : maison/appartement + **année** (tranche) → déperditions.
3. **Chauffage actuel** : mazout / gaz / électrique / autre → coût de référence.
4. **Facture annuelle** (slider €) *ou* conso kWh → personnalisation = crédibilité.
5. **Occupants** → eau chaude.
6. *(option)* **Quand ?** → pré-qualification d'intention.

## La révélation — tableau de bord financier
> **« Votre projet recommandé : pompe à chaleur air/eau ~9 kW »** *(on recommande)*

Hiérarchie du sémaphore (le regard tombe sur l'argent qui rentre) :
- 🟢 **Reste à charge après aides : ~8 500 €** *(le prix rendu petit)*
- 🟢 **Vous économisez +1 450 €/an** · 🟢 **Gain 10 ans : +14 500 €** · 🟢 **ROI 6,8 ans**
- 🟢 **Aides estimées : jusqu'à 10 000 €** *(« on monte le dossier »)*
- ⚫ Coût après travaux (neutre) · 🔴 *petit, en bas* : « aujourd'hui 3 200 €/an de mazout partent en fumée »
- **Indice de confiance : 82 %** *(calculé, honnête)*

## Micro-engagement (capture reframée)
Pas « demandez un devis » → **« Réservez votre étude technique gratuite »**
(créneau `/api/bookings`) **ou** **« Recevez votre pré-devis détaillé »** (email).
*Sans engagement · réversible.*

**Entrées / sorties = la spec exacte.** Honnêteté : *« estimation indicative,
confirmée par l'étude »*. L'estimateur **réutilise les moteurs déterministes**.

---

# LIVRABLE 4 — Assistant IA Chauffage Artisanal (architecture)

> **Règle absolue : Claude n'invente jamais un chiffre. Claude orchestre.
> Les nombres viennent de moteurs déterministes + données vérifiables.**

```
COUCHE 4 — CONVERSION
  Pré-devis auto (équipement, fourchette, aides, reste à charge, durée,
  indice de confiance) → RDV → CRM (lead scoré). L'artisan reçoit un prospect
  CHIFFRÉ avant l'appel.
COUCHE 3 — ORCHESTRATION · Claude Opus 4.8 (tool-use, streaming, /api/assistant)
  Mène la conversation, APPELLE les moteurs comme outils, assemble le pré-devis,
  propose le RDV. NE CALCULE RIEN. Clé API côté serveur.
COUCHE 2 — MOTEURS DÉTERMINISTES (TypeScript pur, testés)
  Dimensionnement PAC (← pac-sizing) · Estimation budgétaire (consolide
  price-estimator + catalogue) · MOTEUR D'AIDES (rules engine sur
  klimabonus-2026 + communes + TVA) · Économies/ROI (← roi-simulator) ·
  Qualification (← lead-scoring) · Indice de confiance.
COUCHE 1 — RÉFÉRENTIELS (source unique versionnée, MAJ facile)
  Aides : Klimabonus 2026 (forfaits officiels) + aides communales (Klimapakt
  par commune) + TVA 3 % + Enoprimes — datés, sourcés.
  Produits : catalogue PAC/chaudières (Viessmann/Buderus/De Dietrich) —
  puissances, SCOP, fourchettes prix.
  Énergie & constantes thermiques — datés, sourcés.
```

## Détail
- **Référentiel aides** — dossier `lib/referentiel/` : `klimabonus-2026` (déjà
  correct, à brancher), `aides-communales`, `tva-logement`, `enoprimes`. Chaque
  entrée **datée + sourcée** → MAJ annuelle = 1 fichier. *Priorité n°1 : aujourd'hui
  3 fichiers de barèmes se contredisent.*
- **Référentiel produits** — catalogue versionné : l'assistant **recommande une
  gamme** (« PAC air/eau ~9 kW, ex. Viessmann Vitocal 250-A ») sans prix ferme.
- **Moteur déterministe** — fonctions pures testables = **seule source des nombres**.
  Réutiliser `pac-sizing`, `roi-simulator`, `lead-scoring` ; **reconstruire le moteur
  d'aides sur `klimabonus-2026`** ; consolider les prix.
- **Claude Opus 4.8 en orchestration** — `tool-use` : 5 moteurs exposés comme outils ;
  le modèle conduit le dialogue, appelle les outils, **narre**, génère le pré-devis,
  propose le RDV. Streaming. `tool_choice` discipliné ⇒ **aucun montant hors moteur**.
- **Pré-devis auto** — à partir des sorties moteurs : équipement · fourchette · aides ·
  **reste à charge** · durée · **indice de confiance** → CRM (scoré) + RDV.
  **L'avantage qui écrase la concurrence locale : un prospect qualifié et chiffré
  avant le téléphone.**

## Garde-fous
Fourchettes (pas de fausse précision) · aides **sourcées + datées** · gammes (pas de
stock/prix ferme promis) · RGPD (lead, consentement, données minimales) · **zéro
chiffre généré par l'IA** (tout passe par les moteurs).

---

# Roadmap (séquence recommandée)
1. **Référentiel + cohérence aides** — réparer Klimabonus (gros gain crédibilité, risque faible).
2. **Moteurs consolidés + tests** — budget/aides/éco/dimensionnement cohérents.
3. **Estimateur immersif** — déterministe d'abord (commune-first → révélation → réservation).
4. **Home recentrée** — hero = estimateur, ordre du Livrable 2, recrutement démoté.
5. **Assistant IA** (Opus tool-use) → pré-devis + RDV + CRM.
6. **Preuve réelle** — activer NPS/Google, shooting équipe & chantiers.

# Hypothèses prises (consultant)
- Les **vraies données** (chiffres clients, photos, avis) seront collectées ; on
  construit des coquilles **prêtes à recevoir le réel**, marquées `[DEMO]` en
  attendant — **rien d'inventé n'est publié**.
- **Modèle = Claude Opus 4.8** (`claude-opus-4-8`), tool-use, côté serveur.
- On **garde l'identité** (logo, bleu/brique/crème) ; on change la **stratégie**.
- Le **sémaphore financier** (vert = gain / rouge = coût) est le langage de toutes
  les zones de calcul, jamais la marque.
```
