# Audit comparatif · ancien site vs nouveau

> **Objet** : support écrit à avoir sous les yeux en rendez-vous client.
> **Usage** : pas pour le lire au client, pour répondre quand il demande « concrètement, qu'est-ce qui change ? ».
> **Ton** : factuel, sans complaisance.
>
> Sites audités :
> - **Ancien** : `https://www.chauffage-artisanal.lu` (home + `/chantiers`)
> - **Nouveau** : `http://localhost:3009` (démo locale)

---

## 1 · Identité visuelle & direction artistique

| | Ancien | Nouveau |
|---|---|---|
| **Palette** | Blanche/grise neutre sans signature | Cream `#F6F0E4` + cuivre `#B86A36` + ink `#2A251E` — palette architecturale signée |
| **Typographie** | Sans-serif basique générique | Fraunces serif éditorial + Inter Tight + JetBrains Mono — système typo professionnel |
| **Cohérence** | Aucune charte apparente, juxtaposition de modules | Système de design cohérent (numérotation sections, eyebrow caps, séparateurs architecte) |
| **Visuels** | Photos hero datées 2012-2013 (qualité visible) | Photos client réelles (chauffage.jpg, PAC-air-air1.jpg, sanitaire.jpg, clim) + intérieurs résidentiels premium |
| **Note** | **3/10** | **9/10** |

→ Le client perçoit *« entreprise correcte mais sans soin »* vs *« maison technique exigeante »*.

---

## 2 · Hero & accroche commerciale

| | Ancien | Nouveau |
|---|---|---|
| **Baseline** | « Oasis de bien-être pour votre maison » | « Le confort thermique nouvelle génération au Luxembourg » |
| **Format** | Carousel 6 images promo | Image cinématique fixe + h1 serif large + 2 CTAs distincts |
| **Eyebrow** | Aucun | « Est. 1994 · Atelier thermique luxembourgeois » |
| **CTAs hero** | **Aucun** | « Demander un devis » + « Dépannage » (deux intentions séparées) |
| **Note** | **2/10** | **9/10** |

→ Sur le site actuel **aucun bouton d'action visible above the fold**. Tout visiteur doit *chercher* comment vous contacter.

---

## 3 · Navigation & architecture

| | Ancien | Nouveau |
|---|---|---|
| **Menu primaire** | 6 services à plat | 5 services + **« Recrutement » avec badge « Nous recrutons »** clignotant |
| **Menu secondaire** | Réalisations, Chantiers, Partenaires, Contact | Dépannage, Entretien, Savoir-faire, Réalisations, Primes & aides, À propos, Recrutement, Contact |
| **Pages totales** | ~8 | **17 + admin + pipeline** |
| **Note** | **5/10** | **9/10** |

→ L'arborescence actuelle ne couvre ni Klimabonus, ni Savoir-faire, ni Entretien. **Trois entrées Google manquées**.

---

## 4 · Preuves sociales

| Élément | Ancien | Nouveau |
|---|---|---|
| Note Google | Absente | Garde-fou audit : retirée tant que non vérifiée |
| Témoignages | Absents | 3 « profils types » avec disclaimer (à remplacer par vrais après accord client) |
| Certifications | Absentes | Mention prudente « maison technique luxembourgeoise depuis 1994 » |
| Métriques entreprise | Absentes | 4 cards (1994 · Grand-Duché · équipe technique · engagement long terme) sans chiffres inventés |
| Marques partenaires | 6 logos en footer (CFM, Neuberg, Buderus…) | 12 marques en section dédiée + disclaimer « technologies couramment rencontrées » |
| **Note** | **3/10** | **7/10** *(plafonné jusqu'à validation client)* |

→ Le nouveau site est **prêt à intégrer** les vraies preuves sociales sans dérive. La structure existe.

---

## 5 · Conversion & génération de leads

| | Ancien | Nouveau |
|---|---|---|
| **Formulaire devis** | Page contact basique nom/email/message | **Configurateur 6 étapes multi-select** : services · bâtiment · contexte technique · délai+budget · photos · contact + canal préféré |
| **Capture leads gros projets** | Tous mélangés dans un message texte | Multi-sélection services → capture combinaisons PAC+sanitaire, EnR+chauffage |
| **Budget** | Aucune qualification | Ranges (<10k / 10-20k / 20-40k / 40k+) |
| **Photos** | Aucun upload | Drag&drop 5 photos / 8 Mo |
| **Préférence contact** | Aucune | Phone / Email / SMS / WhatsApp |
| **Récap projet** | Aucun | Fiche projet complète envoyée client + admin |
| **Pipeline backend** | Aucun (Gmail) | Dashboard interne avec 5 statuts |
| **Note** | **2/10** | **9/10** |

→ C'est **l'écart le plus violent** de l'audit. L'ancien site est un site vitrine. Le nouveau est un outil commercial.

---

## 6 · Recrutement / marque employeur

| | Ancien | Nouveau |
|---|---|---|
| Page dédiée | **Aucune** | `/recrutement` avec 6 profils + perks + process |
| Mention nav | Aucune | **Lien nav primaire + badge « Nous recrutons » animé cuivre** |
| Bannière home | Aucune | Strip dédié post-Réalisations |
| Carte footer | Aucune | Bloc Carrières pleine largeur |
| Section « À propos » | Aucune | Bloc « Rejoindre l'équipe » avant CTA finale |
| **Note** | **0/10** | **9/10** |

→ Site actuel = signal négatif aux candidats *(« cette entreprise ne grandit pas »)*. Nouveau = signal positif fort.

---

## 7 · Dépannage & urgence

| | Ancien | Nouveau |
|---|---|---|
| Page dédiée | Lien mais peu d'emphase | `/depannage` complète : situations type, process 5 étapes, tarification |
| CTA visible header | Aucun | Bandeau urgence + bouton dépannage hero |
| Bouton téléphone direct | Mention oui mais sans intention claire | Désactivé (numéro non confirmé) — à activer post-validation |
| **Note** | **4/10** | **8/10** |

---

## 8 · Klimabonus / aides énergétiques

| | Ancien | Nouveau |
|---|---|---|
| Page dédiée | **Aucune** | `/primes-aides` : 6 catégories d'aides + 4 étapes d'accompagnement + sources officielles MyEnergy / guichet.lu / Klimabonus |
| Disclaimer prudent | N/A | Bandeau ember explicite « montants évoluent, vérification au cas par cas » |
| **Note** | **0/10** | **9/10** |

→ **Le plus gros gisement SEO local manqué**. Mot-clé « klimabonus chauffage luxembourg » = intention d'achat haute.

---

## 9 · Réalisations / chantiers

| | Ancien (`/chantiers`) | Nouveau (`/realisations`) |
|---|---|---|
| Format | Galerie 13 vignettes en grille avec légendes courtes | 10 cas types organisés par métier · filtrage interactif |
| Détails par projet | Légende + ville | Type · commune · technologie · 3 tags · description longue |
| Avant/après | Aucun | Composant slider Before/After avec photos comparatives |
| Disclaimer | N/A | Bandeau ember « cas typiques · galerie réelle en cours » (préparé pour vrais projets) |
| Filtrage | Aucun | Pills par métier (Chauffage / PAC / Clim / Sanitaire / Entretien / EnR) |
| **Note** | **5/10** | **8/10** |

→ La galerie actuelle est correcte mais statique. La nouvelle structure est **prête à recevoir** vrais projets clients sans refonte.

---

## 10 · Pages services individuelles

| | Ancien | Nouveau |
|---|---|---|
| Structure | Page descriptive courte texte/photos | Hero numéroté · métriques · 6 features · bénéfices · catalogue 6 produits par catégorie générique · CTA final |
| Catalogue | Présentation marque par marque sans structure | Catégories pédagogiques + marques en liste indicative |
| **Note** | **5/10** | **8/10** |

---

## 11 · Mobile

| | Ancien | Nouveau |
|---|---|---|
| Méta viewport | Présente | Présente + responsive natif Next.js |
| Touch targets | Non optimisés | ≥44px sur tous boutons |
| Clavier mobile devis | N/A *(formulaire basique)* | `inputMode="tel"` `inputMode="email"` `autoComplete` |
| Lenis smooth-scroll | N/A | Désactivé sur tactile (économie CPU) |
| **Note** | **4/10** | **8/10** *(à valider sur device réel)* |

---

## 12 · SEO infrastructure

| | Ancien | Nouveau |
|---|---|---|
| Sitemap.xml | Vraisemblablement statique | Dynamique 18 URLs |
| Robots.txt | Standard | Dynamique avec disallow `/admin` |
| Metadata pages | Génériques | Spécifiques par page + Open Graph |
| Schema.org JSON-LD | Non visible | À ajouter post-validation |
| **Note** | **5/10** | **7/10** |

---

## 13 · Légal & RGPD

| | Ancien | Nouveau |
|---|---|---|
| Mentions légales | Pas vu | `/mentions-legales` complet *(placeholders à confirmer client)* |
| Politique confidentialité | Pas vu | `/confidentialite` 10 sections conformes RGPD LU + référence CNPD |
| Cookies | Pas de banner | Banner 3 niveaux : tout accepter · refuser non essentiels · personnaliser |
| Durée conservation | Aucune mention | 24 mois leads / 10 ans clients / 90 j logs |
| **Note** | **2/10** | **9/10** |

→ En 2026 au Luxembourg, l'absence de cookie consent banner et de politique RGPD claire est un **risque CNPD direct** (amendes possibles).

---

## 14 · Sécurité & infrastructure (invisible mais critique)

| | Ancien | Nouveau |
|---|---|---|
| HTTPS | Oui | Oui + HSTS preload |
| CSP / X-Frame / Permissions-Policy | Vraisemblablement aucun | Tous configurés |
| Honeypot anti-spam | Non visible | Oui sur `/api/devis` |
| Rate limit | Inconnu | 6 req/min/IP |
| Auth admin | N/A | HMAC sessions + brute-force protection |
| Logger structuré | Aucun | JSON + Sentry-ready |
| **Note** | **4/10** | **9/10** |

---

# Synthèse pondérée

| Axe | Poids commercial | Ancien | Nouveau | Gap |
|---|---|---|---|---|
| Identité visuelle | 15% | 3/10 | 9/10 | +6 |
| Hero / accroche | 12% | 2/10 | 9/10 | +7 |
| Navigation | 6% | 5/10 | 9/10 | +4 |
| Preuves sociales | 10% | 3/10 | 7/10 | +4 |
| Conversion leads | 18% | 2/10 | 9/10 | **+7** |
| Recrutement | 5% | 0/10 | 9/10 | +9 |
| Dépannage | 5% | 4/10 | 8/10 | +4 |
| Klimabonus / aides | 8% | 0/10 | 9/10 | +9 |
| Réalisations | 6% | 5/10 | 8/10 | +3 |
| Pages services | 5% | 5/10 | 8/10 | +3 |
| Mobile | 4% | 4/10 | 8/10 | +4 |
| SEO infra | 3% | 5/10 | 7/10 | +2 |
| Légal / RGPD | 3% | 2/10 | 9/10 | +7 |
| Sécurité backend | 3% | 4/10 | 9/10 | +5 |

**Score global pondéré**
- **Ancien : 3,1 / 10**
- **Nouveau : 8,6 / 10**

---

## Conclusion pour le pitch client

### Ce que dit l'ancien site sans vouloir le dire
- *« Cette entreprise existait il y a dix ans »*
- *« Pas de bouton, je dois chercher »*
- *« Aucune preuve de crédibilité visible »*
- *« Pas de recrutement → ils ne grandissent pas »*
- *« Pas de Klimabonus → ils ne sont pas dans la modernité énergétique »*

### Ce que dit le nouveau site sans vouloir le dire
- *« Maison technique sérieuse »*
- *« Outil commercial structuré »*
- *« Ils savent où ils vont »*
- *« Ils maîtrisent les sujets actuels (PAC, Klimabonus, photovoltaïque) »*
- *« Ils recrutent — donc ils grandissent »*

### Les 3 écarts qui suffisent à justifier la mise en ligne

1. **Configurateur de devis qualifié** *(ancien : 2/10 → nouveau : 9/10)*
   → Conversion des visiteurs en demandes triées par budget/délai/photos.

2. **Page Klimabonus / aides** *(ancien : 0/10 → nouveau : 9/10)*
   → Captation organique sur intention d'achat haute. Position de référence locale.

3. **Marque employeur** *(ancien : 0/10 → nouveau : 9/10)*
   → Les bons techniciens HVAC choisissent leur employeur. Le site actuel est invisible pour eux.

---

## Comment utiliser ce document en rendez-vous

- **Ne pas le distribuer** au client en début de meeting (trop dense).
- **L'avoir sous les yeux** sur un 2ᵉ écran ou imprimé.
- Quand le dirigeant demande *« concrètement, qu'est-ce qui change ? »* → ouvrir ce document, **citer 2-3 dimensions précises** avec les scores.
- **Ne pas montrer les notes /10 au client** — c'est de la jauge interne. Reformuler en bénéfices commerciaux.
- **Mentionner systématiquement les garde-fous** sur les preuves sociales et chiffres : ces éléments dépendent de sa validation. Cela renforce la crédibilité de l'approche.

---

*Document interne · usage commercial · non destiné à publication.*
