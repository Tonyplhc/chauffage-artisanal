# VΛIN STUDIO — Checklist PRE-LAUNCH 🔒

> État au gel qualité. **Rien n'est publié.** Le site est en mode « pré-lancement honnête » :
> tout canal non configuré est **désactivé ou masqué**, jamais faussement actif.
> Vérifié en réel (navigateur, desktop + mobile 375 px, console sans erreur).

---

## ✅ Ce qui est PRÊT (vérifié)

### Structure & liens
- [x] Page d'accueil = `index.html` (racine correcte pour la mise en ligne)
- [x] **Liens internes : 0 cassé** sur les 4 pages (vérifié au navigateur)
- [x] Accueil → DevisPilot, Démonstrateur électricien, Démonstrateur industriel, Chauffage Artisanal : tous valides
- [x] DevisPilot & démonstrateurs → retour `index.html` + `index.html#audit` valides
- [x] Ancres `#problems #case #why #audit #devispilot #final` : toutes existantes

### Conversion (état non configuré = honnête)
- [x] **Formulaire** : `action="#"`, bouton **désactivé**, message « en cours d'activation ». N'envoie rien tant que `formspreeId` est vide. ✔ exigence #3
- [x] **Bouton Réserver** : **masqué** tant que `calendly` est vide. ✔ exigence #4
- [x] **WhatsApp** (formulaire + footer) : **masqué** tant que `whatsapp` est vide. ✔ exigence #5
- [x] **Téléphone** (nav + formulaire + footer) : **placeholder propre `+352 XX XX XX XX`, non cliquable**, jamais de faux numéro. ✔ exigence #5
- [x] Le faux numéro du démonstrateur électricien (`27 99 14 02`) a été **neutralisé** en placeholder
- [x] Tout est piloté par **un seul bloc CONFIG** en bas de `index.html`

### Mobile (375 px, vérifié)
- [x] Nav : liens masqués, icône téléphone + CTA « Ma feuille de route » lisibles
- [x] Hero : titre et texte bien dimensionnés
- [x] Sticky bar : texte + bouton lisibles (mention « 3 places » masquée sur petit écran)
- [x] Formulaire / offre : empilés proprement
- [x] Démonstrateurs : barre « DÉMO VΛIN », hero et services corrects

### SEO
- [x] **1 seul `<title>` par page**, unique
- [x] **1 meta description unique** par page (accueil + DevisPilot ; démos en noindex)
- [x] **1 `<h1>` par page**
- [x] **Canonical** correct sur chaque page (`https://vainstudio.lu/...`)
- [x] **Open Graph** propre (type, title, description, url, image) — partage WhatsApp/LinkedIn
- [x] **Démonstrateurs en `noindex, follow`** (marques fictives, hors index Google)
- [x] **`sitemap.xml`** propre : uniquement accueil + DevisPilot (pages réelles & indexables)
- [x] **`robots.txt`** : autorise tout + référence le sitemap
- [x] Favicon VΛIN doré (SVG inline) sur toutes les pages
- [x] `prefers-reduced-motion` respecté (accessibilité)

---

## ⛔ Ce qui MANQUE (à fournir avant publication)

> Ce sont les seules choses qui bloquent une vraie mise en ligne. Sans elles, le site reste honnêtement « en activation ».

1. **Identifiant Formspree** → pour activer le formulaire (compte gratuit)
2. **Lien Calendly / Cal.com** → pour afficher le bouton Réserver
3. **Numéro WhatsApp** (format `352…`)
4. **Numéro de téléphone** (appel + affichage)
5. **Domaine réel** (remplace `vainstudio.lu`)
6. **Email réel** (si différent de `hello@vainstudio.lu`)
7. *(Optionnel)* **`og-cover.jpg`** 1200×630 → image d'aperçu au partage
8. **Nom légal / mentions** de l'entreprise (footer) — à confirmer

---

## ✍️ Où remplir les valeurs

| Valeur | Où | Comment |
|---|---|---|
| Formspree, Calendly, WhatsApp, Téléphone | **Bloc `VAIN_CONFIG`** en bas de `index.html` | remplir entre les `" "` |
| Domaine `vainstudio.lu` | head des 4 `.html` + `robots.txt` + `sitemap.xml` | Rechercher/Remplacer |
| Email `hello@vainstudio.lu` | footers | Rechercher/Remplacer |

> Détails pas-à-pas (comptes gratuits, déploiement) : **`SETUP-MISE-EN-LIGNE.md`**

---

## 🧪 Tests à REFAIRE après configuration (avant d'envoyer le lien)

> Ces tests ne peuvent être validés qu'une fois tes vraies infos en place.

- [ ] **Formulaire** : j'envoie un test → je reçois bien l'email (Formspree confirmé une 1ʳᵉ fois)
- [ ] **Bouton Réserver** : il apparaît et ouvre mon agenda
- [ ] **WhatsApp** : le bouton apparaît et ouvre la conversation pré-remplie
- [ ] **Téléphone** : le numéro est cliquable et lance l'appel (mobile)
- [ ] **Domaine** : le site s'ouvre sur mon domaine avec le **cadenas 🔒 (HTTPS)**
- [ ] **Partage** : coller le lien dans WhatsApp affiche titre + (image si og-cover ajoutée)
- [ ] **Re-test mobile réel** sur mon propre téléphone (pas seulement l'émulateur)
- [ ] **Les 4 pages** s'ouvrent et naviguent entre elles sans erreur
- [ ] **Google Search Console** : site ajouté + `sitemap.xml` soumis

---

## 🚦 Décision de publication

Le site passe en **GO** uniquement quand :
1. Le bloc CONFIG est rempli (au moins formulaire **ou** un canal direct),
2. Domaine + HTTPS actifs,
3. Les tests « après configuration » ci-dessus sont cochés.

Tant que ce n'est pas le cas → **NO-GO**, mais le site reste présentable (aucun élément cassé ou trompeur).

---

*Quand tu veux, donne-moi tes vraies coordonnées et je remplis le bloc CONFIG + domaine/email à ta place — tu n'auras plus qu'à déployer.*
